import { useEffect, useState } from "react"
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Button,
  Card,
  CardBody,
  Flex,
  Icon,
  Spinner,
  Input,
  InputGroup,
  InputLeftElement,
  Textarea,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider,
  Badge,
  HStack,
} from "@chakra-ui/react"
import { FaWhatsapp, FaQrcode, FaPhone, FaPaperPlane, FaSignOutAlt } from "react-icons/fa"
import { firestore } from "../../firebase/firebase"
import { collection, doc, getDoc, query, where, getDocs } from "firebase/firestore"
import { useAuth } from "../../contexts/AuthContext"
import { useNavigate, useParams } from "react-router-dom"

export default function WhatsappAtendente() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { uid } = useParams()
  const [estabelecimento, setEstabelecimento] = useState<string>("")
  const [tipoPlano, setTipoPlano] = useState<string | null>(null)
  const [isLoadingPlano, setIsLoadingPlano] = useState(true)

  // Estados para o sistema de WhatsApp
  const [phoneNumber, setPhoneNumber] = useState<string>("")
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("")
  const [isGeneratingQR, setIsGeneratingQR] = useState<boolean>(false)
  const [isDisconnecting, setIsDisconnecting] = useState<boolean>(false)
  
  // Estados para envio de mensagens
  const [recipientNumber, setRecipientNumber] = useState<string>("")
  const [messageText, setMessageText] = useState<string>("")
  const [messageFooter, setMessageFooter] = useState<string>("")
  const [isSendingMessage, setIsSendingMessage] = useState<boolean>(false)
  
  // Estados de feedback
  const [alertMessage, setAlertMessage] = useState<string>("")
  const [alertType, setAlertType] = useState<"success" | "error" | "info" | "warning">("info")
  const [showAlert, setShowAlert] = useState<boolean>(false)

  // API Key do WhatsApp (configurada diretamente)
  const API_KEY = "Lyu6H6ADzWn3KqqQofyhFlmT96UBs3"

  // Função para mostrar alertas
  const showAlertMessage = (message: string, type: "success" | "error" | "info" | "warning") => {
    setAlertMessage(message)
    setAlertType(type)
    setShowAlert(true)
    setTimeout(() => setShowAlert(false), 5000)
  }

  // Função para gerar QR Code
  const generateQRCode = async () => {
    if (!phoneNumber.trim()) {
      showAlertMessage("Por favor, insira um número de telefone", "warning")
      return
    }

    setIsGeneratingQR(true)
    try {
      const response = await fetch('/api/whatsapp/generate-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device: phoneNumber,
          api_key: API_KEY
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        setQrCodeUrl(data.qr_code_url)
        showAlertMessage("QR Code gerado com sucesso! Escaneie com seu WhatsApp", "success")
      } else {
        showAlertMessage(data.error || "Erro ao gerar QR Code", "error")
      }
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error)
      showAlertMessage("Erro de conexão ao gerar QR Code", "error")
    } finally {
      setIsGeneratingQR(false)
    }
  }

  // Função para confirmar conexão
  const confirmConnection = () => {
    setIsConnected(true)
    showAlertMessage("Conexão confirmada! Agora você pode enviar mensagens", "success")
  }

  // Função para enviar mensagem
  const sendMessage = async () => {
    if (!recipientNumber.trim() || !messageText.trim()) {
      showAlertMessage("Por favor, preencha o número e a mensagem", "warning")
      return
    }

    setIsSendingMessage(true)
    try {
      const response = await fetch('/api/whatsapp/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: API_KEY,
          sender: phoneNumber,
          number: recipientNumber,
          message: messageText,
          footer: messageFooter || undefined
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        showAlertMessage("Mensagem enviada com sucesso!", "success")
        setRecipientNumber("")
        setMessageText("")
        setMessageFooter("")
      } else {
        showAlertMessage(data.error || "Erro ao enviar mensagem", "error")
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      showAlertMessage("Erro de conexão ao enviar mensagem", "error")
    } finally {
      setIsSendingMessage(false)
    }
  }

  // Função para desconectar dispositivo
  const disconnectDevice = async () => {
    setIsDisconnecting(true)
    try {
      const response = await fetch('/api/whatsapp/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: API_KEY,
          sender: phoneNumber
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        setIsConnected(false)
        setQrCodeUrl("")
        setPhoneNumber("")
        showAlertMessage("Dispositivo desconectado com sucesso!", "success")
      } else {
        showAlertMessage(data.error || "Erro ao desconectar dispositivo", "error")
      }
    } catch (error) {
      console.error('Erro ao desconectar:', error)
      showAlertMessage("Erro de conexão ao desconectar", "error")
    } finally {
      setIsDisconnecting(false)
    }
  }



  // Buscar estabelecimento do atendente logado
  useEffect(() => {
    const fetchEstabelecimento = async () => {
      if (!user?.uid) return
      try {
        const colabRef = doc(firestore, "colaboradores", user.uid)
        const colabSnap = await getDoc(colabRef)
        if (colabSnap.exists()) {
          const estabelecimentoData = (colabSnap.data() as any)?.estabelecimento || ""
          setEstabelecimento(estabelecimentoData)
          // @ts-ignore
          window.nomeEstabelecimentoAtendente = estabelecimentoData
        }
      } catch (e) {
        console.error("Erro ao buscar estabelecimento:", e)
      }
    }
    fetchEstabelecimento()
  }, [user?.uid])

  // Buscar tipoPlano da conta dona do estabelecimento
  useEffect(() => {
    const fetchTipoPlano = async () => {
      if (!estabelecimento) {
        // Se não tem estabelecimento, permitir acesso (fallback)
        setTipoPlano('ouro') // Assumir plano ouro como fallback
        setIsLoadingPlano(false)
        return
      }
      
      setIsLoadingPlano(true)
      try {
        const contasRef = collection(firestore, 'contas')
        const q = query(contasRef, where('nomeEstabelecimento', '==', estabelecimento))
        const snap = await getDocs(q)
        if (!snap.empty) {
          const data = snap.docs[0].data() as any
          const tipoPlanoData = (data?.tipoPlano ?? null) as string | null
          setTipoPlano(tipoPlanoData)
          console.log("TipoPlano encontrado:", tipoPlanoData)
        } else {
          console.log("Nenhuma conta encontrada para o estabelecimento:", estabelecimento)
          setTipoPlano(null)
        }
      } catch (e) {
        console.error("Erro ao buscar tipoPlano:", e)
        setTipoPlano(null)
      } finally {
        setIsLoadingPlano(false)
      }
    }
    
    // Adicionar timeout para evitar travamento
    const timeoutId = setTimeout(() => {
      if (isLoadingPlano) {
        console.log("Timeout na verificação do plano, permitindo acesso")
        setTipoPlano('ouro') // Fallback para ouro
        setIsLoadingPlano(false)
      }
    }, 5000) // 5 segundos de timeout
    
    fetchTipoPlano()
    
    return () => clearTimeout(timeoutId)
  }, [estabelecimento])

  // Fallback: usar o estabelecimento já carregado no Dashboard (window)
  useEffect(() => {
    // @ts-ignore
    const est = typeof window !== 'undefined' ? window.nomeEstabelecimentoAtendente : ""
    if (est && !estabelecimento) {
      setEstabelecimento(est)
    }
  }, [estabelecimento])

  // Verificação alternativa: buscar tipoPlano diretamente do usuário se for admin
  useEffect(() => {
    const fetchTipoPlanoAlternativo = async () => {
      if (!user?.uid || estabelecimento) return // Só executa se não tiver estabelecimento
      
      try {
        // Tentar buscar como conta principal (admin)
        const contaRef = doc(firestore, "contas", user.uid)
        const contaSnap = await getDoc(contaRef)
        if (contaSnap.exists()) {
          const data = contaSnap.data() as any
          const tipoPlanoData = (data?.tipoPlano ?? null) as string | null
          if (tipoPlanoData) {
            setTipoPlano(tipoPlanoData)
            setIsLoadingPlano(false)
            console.log("TipoPlano encontrado via conta principal:", tipoPlanoData)
          }
        }
    } catch (e) {
        console.error("Erro na verificação alternativa:", e)
      }
    }
    
    // Executar após 2 segundos se ainda estiver carregando
    const timeoutId = setTimeout(() => {
      fetchTipoPlanoAlternativo()
    }, 2000)
    
    return () => clearTimeout(timeoutId)
  }, [user?.uid, estabelecimento])


  // Debug: verificar estado do usuário
  useEffect(() => {
    console.log("=== DEBUG USUÁRIO ===")
    console.log("User object:", user)
    console.log("User UID:", user?.uid)
    console.log("User email:", user?.email)
    console.log("Estabelecimento:", estabelecimento)
    console.log("===================")
  }, [user, estabelecimento])

  // Verificar se o acesso ao WhatsApp é permitido baseado no tipo de plano
  const isWhatsappAllowed = tipoPlano === 'gratis' || tipoPlano === 'ouro' || tipoPlano === 'diamante'

  // Bloquear acesso se o plano não permitir WhatsApp
  useEffect(() => {
    if (!isLoadingPlano && !isWhatsappAllowed && uid) {
      console.log("Acesso negado. TipoPlano:", tipoPlano)
      // Redirecionar para o dashboard do atendente
      navigate(`/acessoAtendente/${uid}`)
    } else if (!isLoadingPlano && isWhatsappAllowed) {
      console.log("Acesso permitido. TipoPlano:", tipoPlano)
    }
  }, [isLoadingPlano, isWhatsappAllowed, uid, tipoPlano])



  // Mostrar loading enquanto verifica o plano
  if (isLoadingPlano) {
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
          <VStack spacing={8} align="center" w="100%" justify="center" minH="60vh">
            <Spinner 
              size="xl" 
              color="purple.500" 
              thickness="4px" 
              speed="0.8s"
              emptyColor="purple.100"
            />
            <VStack spacing={4} textAlign="center">
              <Text color="purple.600" fontWeight="bold" fontSize="lg">
                Verificando permissões de acesso...
              </Text>
              <Text color="gray.500" fontSize="sm">
                Aguarde enquanto verificamos seu plano de acesso
              </Text>
            </VStack>
            <Button
              colorScheme="purple"
              variant="outline"
              size="sm"
              onClick={() => {
                // Permitir acesso manual em caso de problemas
                setTipoPlano('ouro')
                setIsLoadingPlano(false)
              }}
            >
              Continuar sem verificação
            </Button>
          </VStack>
        </Container>
      </Box>
    )
  }


  // Mostrar tela de bloqueio se não tiver acesso
  if (!isWhatsappAllowed) {
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
          <VStack spacing={8} align="center" w="100%" justify="center" minH="60vh">
            <Flex
              align="center"
              justify="center"
              w={20}
              h={20}
              bg="red.500"
              rounded="full"
              boxShadow="lg"
              mx="auto"
            >
              <Icon as={FaWhatsapp} boxSize={10} color="white" />
            </Flex>
            <VStack spacing={4} textAlign="center">
              <Heading size="2xl" color="gray.800">
                Acesso Restrito
              </Heading>
              <Text color="gray.600" fontSize={{ base: "md", md: "lg" }} maxW="600px">
                O acesso ao sistema de WhatsApp é permitido apenas para planos <strong>Gratuito</strong>, <strong>Ouro</strong> ou <strong>Diamante</strong>.
              </Text>
              <Text color="gray.500" fontSize="sm">
                Entre em contato com o administrador do estabelecimento para mais informações sobre os planos disponíveis.
              </Text>
            </VStack>
            <Button
              colorScheme="blue"
              size="lg"
              onClick={() => navigate(`/acessoAtendente/${uid}`)}
            >
              Voltar ao Dashboard
            </Button>
          </VStack>
        </Container>
      </Box>
    )
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
          {/* Header */}
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

          {/* Alert de feedback */}
          {showAlert && (
            <Alert status={alertType} maxW="600px" w="100%">
              <AlertIcon />
              <Box>
                <AlertTitle>{alertType === "success" ? "Sucesso!" : alertType === "error" ? "Erro!" : "Informação"}</AlertTitle>
                <AlertDescription>{alertMessage}</AlertDescription>
              </Box>
            </Alert>
          )}

          {/* Status da conexão */}
          <Card w="100%" maxW="600px" mx="auto">
            <CardBody>
              <HStack justify="space-between" align="center">
                <HStack>
                  <Icon as={FaPhone} color={isConnected ? "green.500" : "gray.400"} />
                  <Text fontWeight="bold">
                    {isConnected ? "Conectado" : "Desconectado"}
                  </Text>
                </HStack>
                <Badge colorScheme={isConnected ? "green" : "gray"}>
                  {isConnected ? "Online" : "Offline"}
                </Badge>
              </HStack>
            </CardBody>
          </Card>

          {/* Seção de Conexão - Só aparece se não estiver conectado */}
          {!isConnected && (
            <Card w="100%" maxW="600px" mx="auto">
              <CardBody>
                <VStack spacing={6}>
                  <VStack spacing={4}>
                    <Icon as={FaQrcode} boxSize={12} color="whatsapp.500" />
                    <Heading size="lg" color="gray.800">
                      Conectar WhatsApp
                    </Heading>
                    <Text color="gray.600" textAlign="center">
                      Digite seu número de telefone para gerar o QR Code de conexão
                    </Text>
                  </VStack>

                  <VStack spacing={4} w="100%">
                    <InputGroup>
                      <InputLeftElement>
                        <Icon as={FaPhone} color="gray.400" />
                      </InputLeftElement>
                      <Input
                        placeholder="Digite seu número (ex: 5521987654321)"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        isDisabled={isGeneratingQR}
                      />
                    </InputGroup>

                    <Button
                      colorScheme="whatsapp"
                      size="lg"
                      leftIcon={<FaQrcode />}
                      onClick={generateQRCode}
                      isLoading={isGeneratingQR}
                      loadingText="Gerando QR Code..."
                      w="100%"
                      isDisabled={!phoneNumber.trim()}
                    >
                      Gerar QR Code
                    </Button>
                  </VStack>

                  {/* QR Code */}
                  {qrCodeUrl && (
                    <VStack spacing={4}>
                      <Divider />
                      <VStack spacing={3}>
                        <Text fontWeight="bold" color="gray.700">
                          Escaneie o QR Code com seu WhatsApp:
                        </Text>
                        <Box
                          p={4}
                          border="2px solid"
                          borderColor="gray.200"
                          rounded="lg"
                          bg="white"
                        >
                          <img 
                            src={qrCodeUrl} 
                            alt="QR Code WhatsApp" 
                            style={{ maxWidth: "200px", height: "auto" }}
                          />
                        </Box>
                        <Button
                          colorScheme="green"
                          size="md"
                          onClick={confirmConnection}
                          leftIcon={<FaWhatsapp />}
                        >
                          Já Escaneei o QR Code
                        </Button>
                      </VStack>
                    </VStack>
                  )}
                </VStack>
              </CardBody>
            </Card>
          )}

          {/* Seção de Envio de Mensagens - Só aparece se estiver conectado */}
          {isConnected && (
            <Card w="100%" maxW="600px" mx="auto">
              <CardBody>
                <VStack spacing={6}>
                  <VStack spacing={4}>
                    <Icon as={FaPaperPlane} boxSize={12} color="whatsapp.500" />
                    <Heading size="lg" color="gray.800">
                      Enviar Mensagem
                    </Heading>
                    <Text color="gray.600" textAlign="center">
                      Preencha os dados para enviar uma mensagem via WhatsApp
                    </Text>
                  </VStack>

                  <VStack spacing={4} w="100%">
                    <InputGroup>
                      <InputLeftElement>
                        <Icon as={FaPhone} color="gray.400" />
                      </InputLeftElement>
                      <Input
                        placeholder="Número do destinatário (ex: 5521987654321)"
                        value={recipientNumber}
                        onChange={(e) => setRecipientNumber(e.target.value)}
                        isDisabled={isSendingMessage}
                      />
                    </InputGroup>

                    <Textarea
                      placeholder="Digite sua mensagem aqui..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      isDisabled={isSendingMessage}
                      rows={4}
                    />

                    <Input
                      placeholder="Rodapé da mensagem (opcional)"
                      value={messageFooter}
                      onChange={(e) => setMessageFooter(e.target.value)}
                      isDisabled={isSendingMessage}
                    />

                    <HStack w="100%" spacing={4}>
                      <Button
                        colorScheme="whatsapp"
                        size="lg"
                        leftIcon={<FaPaperPlane />}
                        onClick={sendMessage}
                        isLoading={isSendingMessage}
                        loadingText="Enviando..."
                        flex={1}
                        isDisabled={!recipientNumber.trim() || !messageText.trim()}
                      >
                        Enviar Mensagem
                      </Button>

                      <Button
                        colorScheme="red"
                        size="lg"
                        leftIcon={<FaSignOutAlt />}
                        onClick={disconnectDevice}
                        isLoading={isDisconnecting}
                        loadingText="Desconectando..."
                        variant="outline"
                      >
                        Desconectar
                      </Button>
                    </HStack>
                  </VStack>
                </VStack>
              </CardBody>
            </Card>
          )}
        </VStack>
      </Container>
    </Box>
  )
}
