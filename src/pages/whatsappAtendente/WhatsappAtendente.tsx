import React, { useEffect } from "react"
import { useState } from "react"
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Switch,
  Card,
  CardBody,
  Flex,
  Icon,
  Spinner,
  Image,
  Select,
} from "@chakra-ui/react"
import { FaWhatsapp, FaQrcode, FaPaperPlane, FaCheckCircle } from "react-icons/fa"
import { firestore } from "../../firebase/firebase"
import { collection, onSnapshot, doc, getDoc, query, where, getDocs } from "firebase/firestore"
import { useAuth } from "../../contexts/AuthContext"

export default function WhatsappAtendente() {
  const { user } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isGeneratingQR, setIsGeneratingQR] = useState(false)
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null)
  const [clients, setClients] = useState<Array<{ id: string; name: string; number: string }>>([])
  const [isLoadingClients, setIsLoadingClients] = useState(false)
  const [estabelecimento, setEstabelecimento] = useState<string>("")
  const [selectedClientId, setSelectedClientId] = useState<string>("")
  // Alerts padrão do navegador no lugar de toasts customizados

  const [formData, setFormData] = useState({
    api_key: "2esiF44O0U8gKEMXLITathxSYKUuca",
    sender: "",
    number: "",
    message: "",
    footer: "",
    fullnumber: false,
  })

  // Buscar estabelecimento do atendente logado
  useEffect(() => {
    const fetchEstabelecimento = async () => {
      if (!user?.uid) return
      try {
        const colabRef = doc(firestore, "colaboradores", user.uid)
        const colabSnap = await getDoc(colabRef)
        if (colabSnap.exists()) {
          setEstabelecimento((colabSnap.data() as any)?.estabelecimento || "")
        }
      } catch (e) {}
    }
    fetchEstabelecimento()
  }, [user?.uid])

  // Fallback: usar o estabelecimento já carregado no Dashboard (window)
  useEffect(() => {
    // @ts-ignore
    const est = typeof window !== 'undefined' ? window.nomeEstabelecimentoAtendente : ""
    if (est && !estabelecimento) {
      setEstabelecimento(est)
    }
  }, [estabelecimento])

  // Listar clientes do estabelecimento
  useEffect(() => {
    if (!estabelecimento) return
    setIsLoadingClients(true)
    try {
      const q = query(collection(firestore, "clienteUser"), where("estabelecimento", "==", estabelecimento))
      const unsub = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map((doc) => {
          const d = doc.data() as any
          const name = `${d?.nome || d?.nomeClinte || "Cliente"}${d?.sobrenome || d?.sobreNomeClinte ? " " + (d?.sobrenome || d?.sobreNomeClinte) : ""}`.trim()
          const number = (d?.whatsapp || d?.whatsappContato || d?.telefone || d?.telefoneContato || "").toString()
          return { id: doc.id, name, number }
        })
        setClients(data.filter((c) => !!c.number))
        setIsLoadingClients(false)
      })
      return () => unsub()
    } catch (e) {
      setIsLoadingClients(false)
    }
  }, [estabelecimento])

  // Carregamento imediato sob demanda (ex.: ao conectar)
  const loadClientsNow = async () => {
    try {
      const est = estabelecimento || (typeof window !== "undefined" ? (window as any).nomeEstabelecimentoAtendente : "")
      if (!est) return
      setIsLoadingClients(true)
      const q = query(collection(firestore, "clienteUser"), where("estabelecimento", "==", est))
      const snap = await getDocs(q)
      const data = snap.docs.map((doc) => {
        const d = doc.data() as any
        const name = `${d?.nome || d?.nomeClinte || "Cliente"}${d?.sobrenome || d?.sobreNomeClinte ? " " + (d?.sobrenome || d?.sobreNomeClinte) : ""}`.trim()
        const number = (d?.whatsapp || d?.whatsappContato || d?.telefone || d?.telefoneContato || "").toString()
        return { id: doc.id, name, number }
      })
      setClients(data.filter((c) => !!c.number))
    } finally {
      setIsLoadingClients(false)
    }
  }

  useEffect(() => {
    if (isConnected) {
      try {
        window.scrollTo({ top: 0, behavior: "smooth" })
      } catch {}
    }
  }, [isConnected])

  // Restaurar conexão persistida (até desconectar)
  useEffect(() => {
    try {
      const wasConnected = localStorage.getItem("wa_connected") === "1"
      const savedSender = localStorage.getItem("wa_sender") || ""
      if (wasConnected) {
        setIsConnected(true)
        if (savedSender) setFormData((p) => ({ ...p, sender: savedSender }))
      }
    } catch {}
  }, [])

  const handleConnect = async () => {
    if (!formData.sender) {
      alert("Informe o número do dispositivo")
      return
    }
    setIsGeneratingQR(true)
    setQrImageUrl(null)
    try {
      // 1) Tenta GET primeiro (alguns provedores só permitem GET)
      const url = new URL("https://belkit.pro/generate-qr")
      url.searchParams.set("device", formData.sender)
      url.searchParams.set("api_key", formData.api_key)
      url.searchParams.set("force", "true")
      let response = await fetch(url.toString(), { method: "GET", headers: { Accept: "application/json,image/*" } })

      if (response.status === 405) {
        // 2) Fallback para POST
        response = await fetch("https://belkit.pro/generate-qr", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json,image/*" },
          body: JSON.stringify({ device: formData.sender, api_key: formData.api_key, force: true }),
        })
      }

      const contentType = response.headers.get("content-type") || ""
      if (!response.ok) throw new Error(`Erro ${response.status}`)

      if (contentType.includes("application/json")) {
        const data = await response.json()
        const possible = data.qr || data.qrcode || data.qr_code || data.image || data.url || data.dataUrl
        if (typeof possible === "string") {
          if (possible.startsWith("data:")) {
            setQrImageUrl(possible)
          } else if (possible.startsWith("http")) {
            // Buscar a imagem e transformar em blob para evitar novos 405s
            const imgRes = await fetch(possible)
            if (!imgRes.ok) throw new Error(`Erro ${imgRes.status}`)
            const blob = await imgRes.blob()
            setQrImageUrl(URL.createObjectURL(blob))
          } else {
            throw new Error("URL/base64 de QR inválida")
          }
        } else {
          throw new Error("Resposta da API não contém o QR")
        }
      } else if (contentType.startsWith("image/")) {
        const blob = await response.blob()
        setQrImageUrl(URL.createObjectURL(blob))
      } else {
        const blob = await response.blob()
        setQrImageUrl(URL.createObjectURL(blob))
      }
    } catch (err: any) {
      const message = err?.message || "Falha ao gerar QR"
      alert(message)
    } finally {
      setIsGeneratingQR(false)
    }
  }

  const handleDisconnect = () => {
    const doLogout = async () => {
      try {
        const res = await fetch("https://belkit.pro/logout-device", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ api_key: formData.api_key, sender: formData.sender }),
        })
        if (!res.ok) throw new Error(`Erro ${res.status}`)
        alert("Desconectado do WhatsApp")
      } catch (e: any) {
        alert(e?.message || "Falha ao desconectar")
      } finally {
    setIsConnected(false)
        try {
          localStorage.removeItem("wa_connected")
          localStorage.removeItem("wa_sender")
        } catch {}
      }
    }
    doLogout()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSending(true)
    try {
      if (!formData.sender) {
        alert("Informe o número do dispositivo")
        setIsSending(false)
        return
      }
      if (!formData.number) {
        alert("Selecione um cliente ou informe o número")
        setIsSending(false)
        return
      }
      const normalizedNumber = normalizePhone(formData.number)

      let response = await fetch("https://belkit.pro/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          api_key: formData.api_key,
          sender: formData.sender,
          number: normalizedNumber,
          message: formData.message,
          footer: formData.footer,
          full: formData.fullnumber ? 1 : 0,
        }),
      })
      if (response.status === 405) {
        const url = new URL("https://belkit.pro/send-message")
        url.searchParams.set("api_key", formData.api_key)
        url.searchParams.set("sender", formData.sender)
        url.searchParams.set("number", formData.number)
        url.searchParams.set("message", formData.message)
        if (formData.footer) url.searchParams.set("footer", formData.footer)
        if (formData.fullnumber) url.searchParams.set("full", "1")
        response = await fetch(url.toString(), { method: "GET", headers: { Accept: "application/json" } })
      }
      if (!response.ok) throw new Error(`Erro ${response.status}`)
      alert(`Mensagem enviada para ${normalizedNumber}`)
      setFormData({ ...formData, number: "", message: "", footer: "" })
      setSelectedClientId("")
    } catch (err: any) {
      alert(err?.message || "Falha ao enviar mensagem")
    } finally {
      setIsSending(false)
    }
  }

  // Normalização simples para E.164 sem o sinal de '+' (regras da API)
  function normalizePhone(input: string): string {
    const original = input || ""
    const trimmed = original.trim()
    const hadPlus = trimmed.startsWith("+")
    let digits = trimmed.replace(/\D/g, "")
    if (trimmed.startsWith("00")) {
      // Remover o 00 internacional
      digits = digits.replace(/^00+/, "")
    }
    // Se veio com código de país (+xx ou 00xx), mantemos
    const hasCountryCode = hadPlus || /^\d{1,3}\d{6,}$/.test(digits) && (digits.length > 11)
    if (!hasCountryCode) {
      // Heurística: tratar como BR local -> prefixar 55
      if (digits.length === 10 || digits.length === 11) {
        digits = `55${digits}`
      }
    }
    return digits
  }

  return (
    <Box
      className="whatsapp-atendente-container"
      w="100%"
      minH="100vh"
      maxH="100vh"
      overflowY="auto"
      bg='white'
      py={{ base: 8, md: 12 }}
    >
      <Container maxW="100%" px={{ base: 4, md: 8 }}>
        <VStack spacing={8} align="center" w="100%">
          {/* Header (sem animação) */}
          <VStack spacing={4} textAlign="center" className="header-section" w="100%">
              <Flex
                align="center"
                justify="center"
              w={20}
              h={20}
                bg="whatsapp.500"
                rounded="full"
              boxShadow="lg"
              mx="auto"
              >
              <Icon as={FaWhatsapp} boxSize={10} color="white" />
              </Flex>
            <Heading size="2xl" color="gray.800">
                Trezu Atendente
              </Heading>
            <Text color="gray.600" fontSize={{ base: "md", md: "lg" }}>
                Sistema profissional de envio de mensagens
              </Text>
            </VStack>

          {/* Main Content */}
          {!isConnected ? (
            <Card
              className="connection-card"
              w="100%"
              maxW="720px"
              mx="auto"
              bg="white"
              borderWidth="1px"
              borderColor="gray.200"
              boxShadow="lg"
              rounded="xl"
            >
              <CardBody p={{ base: 6, md: 8 }}>
                <VStack spacing={6}>
                  <FormControl isRequired>
                    <FormLabel color="gray.700">Número do Dispositivo</FormLabel>
                    <Input
                      placeholder="Ex: 5511999999999"
                      value={formData.sender}
                      onChange={(e) => setFormData({ ...formData, sender: e.target.value })}
                      variant="filled"
                      size="lg"
                      bg="gray.100"
                      _focus={{ bg: "gray.200" }}
                    />
                  </FormControl>

                  {/* API Key mantida apenas no estado interno; não exibida na interface */}

                  <Box className="qr-code-container" w="100%" display="flex" justifyContent="center">
                    {isGeneratingQR ? (
                        <VStack spacing={4}>
                          <Spinner size="xl" color="whatsapp.500" thickness="4px" speed="0.8s" />
                        <Text color="gray.600" fontWeight="medium">
                          Gerando QR...
                          </Text>
                        </VStack>
                    ) : qrImageUrl ? (
                      <Image src={qrImageUrl} alt="QR Code" boxSize={{ base: "240px", md: "280px" }} />
                      ) : (
                      <Icon as={FaQrcode} boxSize={32} color="gray.500" />
                      )}
                    </Box>

                    <VStack spacing={2}>
                    <Heading size="lg" color="gray.800">
                        Conecte seu WhatsApp
                      </Heading>
                    <Text color="gray.600" textAlign="center">
                      Informe o dispositivo, gere e escaneie o QR com seu WhatsApp
                      </Text>
                    </VStack>

                    <Button
                      colorScheme="whatsapp"
                      size="lg"
                      leftIcon={<FaWhatsapp />}
                      onClick={handleConnect}
                    isLoading={isGeneratingQR}
                    loadingText="Gerando..."
                    w="100%"
                    maxW="360px"
                      className="connect-button"
                    mx="auto"
                  >
                    Gerar QR Code
                  </Button>

                  {qrImageUrl && (
                    <Button
                      variant="outline"
                      colorScheme="whatsapp"
                      onClick={() => {
                        setQrImageUrl(null)
                        setIsConnected(true)
                        try {
                          localStorage.setItem("wa_connected", "1")
                          if (formData.sender) localStorage.setItem("wa_sender", formData.sender)
                        } catch {}
                        // Carregar clientes imediatamente após conectar
                        loadClientsNow()
                      }}
                    >
                      Já escaneei – Marcar como conectado
                    </Button>
                  )}
                  </VStack>
                </CardBody>
              </Card>
          ) : (
            <Card
              className="message-form-card"
              w="100%"
              maxW="860px"
              mx="auto"
              bg="white"
              borderWidth="1px"
              borderColor="gray.200"
              boxShadow="lg"
              rounded="xl"
            >
              <CardBody p={{ base: 6, md: 8 }}>
                <VStack spacing={6} w="100%">
                    {/* Connection Status */}
                  <Flex className="connection-status" w="100%" justify="space-between" align="center">
                      <Flex align="center" gap={3}>
                        <Icon as={FaCheckCircle} color="whatsapp.400" boxSize={5} />
                        <Text color="whatsapp.400" fontWeight="medium">
                          WhatsApp Conectado
                        </Text>
                      </Flex>
                      <Button size="sm" variant="ghost" colorScheme="red" onClick={handleDisconnect}>
                        Desconectar
                      </Button>
                    </Flex>

                    {/* Message Form */}
                    <form onSubmit={handleSubmit} style={{ width: "100%" }}>
                      <VStack spacing={5} w="full">
                      <FormControl>
                        <FormLabel color="gray.700">Selecionar Cliente</FormLabel>
                        <Select
                          placeholder={isLoadingClients ? "Carregando clientes..." : "Escolha um cliente"}
                          value={selectedClientId}
                          onChange={(e) => {
                            const id = e.target.value
                            setSelectedClientId(id)
                            const client = clients.find((c) => c.id === id)
                            if (client) {
                              const normalized = normalizePhone(client.number)
                              setFormData({ ...formData, number: normalized })
                            }
                          }}
                          isDisabled={isLoadingClients}
                          bg="gray.100"
                          size="lg"
                        >
                          {clients.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} — {normalizePhone(c.number)}
                            </option>
                          ))}
                        </Select>
                        </FormControl>


                        <FormControl isRequired>
                        <FormLabel color="gray.700">Número do Destinatário</FormLabel>
                          <Input
                            placeholder="Ex: 5511888888888"
                            value={formData.number}
                            onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                            className="form-input"
                          variant="filled"
                          size="lg"
                          bg="gray.100"
                          _focus={{ bg: "gray.200" }}
                          />
                        </FormControl>

                        <FormControl isRequired>
                        <FormLabel color="gray.700">Mensagem</FormLabel>
                          <Textarea
                            placeholder="Digite sua mensagem aqui..."
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            className="form-textarea"
                            rows={4}
                          variant="filled"
                          size="lg"
                          bg="gray.100"
                          _focus={{ bg: "gray.200" }}
                          />
                        </FormControl>

                        <FormControl>
                        <FormLabel color="gray.700">Rodapé (Opcional)</FormLabel>
                          <Input
                            placeholder="Texto do rodapé"
                            value={formData.footer}
                            onChange={(e) => setFormData({ ...formData, footer: e.target.value })}
                            className="form-input"
                          variant="filled"
                          size="lg"
                          bg="gray.100"
                          _focus={{ bg: "gray.200" }}
                          />
                        </FormControl>

                        <FormControl display="flex" alignItems="center">
                          <FormLabel color="gray.300" mb={0}>
                            Mostrar resposta completa do WhatsApp
                          </FormLabel>
                          <Switch
                            colorScheme="whatsapp"
                            isChecked={formData.fullnumber}
                            onChange={(e) => setFormData({ ...formData, fullnumber: e.target.checked })}
                          />
                        </FormControl>

                        <Button
                          type="submit"
                          colorScheme="whatsapp"
                          size="lg"
                        w="100%"
                          leftIcon={<FaPaperPlane />}
                          isLoading={isSending}
                          loadingText="Enviando..."
                          className="send-button"
                        boxShadow="md"
                        >
                          Enviar Mensagem
                        </Button>
                      </VStack>
                    </form>
                  </VStack>
                </CardBody>
              </Card>
          )}
        </VStack>
      </Container>
    </Box>
  )
}
