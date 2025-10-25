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
  Select,
  FormControl,
  FormLabel,
} from "@chakra-ui/react"
import { FaWhatsapp, FaQrcode, FaPhone, FaPaperPlane, FaSignOutAlt, FaUser } from "react-icons/fa"
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

  // Estados para seleção de clientes
  const [clientes, setClientes] = useState<any[]>([])
  const [clienteSelecionado, setClienteSelecionado] = useState<string>("")
  const [isLoadingClientes, setIsLoadingClientes] = useState<boolean>(false)

  // Estados para verificação de status
  const [isCheckingStatus, setIsCheckingStatus] = useState<boolean>(false)
  const [lastCheckedPhone, setLastCheckedPhone] = useState<string>("")

  // API Key do WhatsApp (configurada diretamente)
  const API_KEY = "Lyu6H6ADzWn3KqqQofyhFlmT96UBs3"

  // Função para mostrar alertas
  const showAlertMessage = (message: string, type: "success" | "error" | "info" | "warning") => {
    setAlertMessage(message)
    setAlertType(type)
    setShowAlert(true)
    setTimeout(() => setShowAlert(false), 5000)
  }

  // Função para formatar número de telefone (adicionar 55 na frente)
  const formatarNumero = (numero: string) => {
    // Remove todos os caracteres não numéricos
    const numeroLimpo = numero.replace(/\D/g, '')
    
    // Se já começar com 55, retorna como está
    if (numeroLimpo.startsWith('55')) {
      return numeroLimpo
    }
    
    // Adiciona 55 na frente
    return `55${numeroLimpo}`
  }

  // Função para buscar clientes do estabelecimento
  const buscarClientes = async (nomeEstabelecimento: string) => {
    if (!nomeEstabelecimento || !nomeEstabelecimento.trim()) {
      console.log('❌ Nome do estabelecimento não fornecido ou vazio')
      setClientes([])
      return
    }

    console.log('🔍 Buscando clientes para estabelecimento:', nomeEstabelecimento)
    console.log('🔍 Tipo do estabelecimento:', typeof nomeEstabelecimento)
    console.log('🔍 Tamanho do estabelecimento:', nomeEstabelecimento.length)
    setIsLoadingClientes(true)
    
    try {
      console.log('📡 Conectando ao Firestore...')
      const clientesRef = collection(firestore, 'clienteUser')
      console.log('📡 Referência da coleção criada')
      
      const q = query(clientesRef, where('estabelecimento', '==', nomeEstabelecimento))
      console.log('📡 Query criada com filtro:', nomeEstabelecimento)
      
      const snapshot = await getDocs(q)
      console.log('📊 Total de documentos na coleção clienteUser:', snapshot.docs.length)
      
      if (snapshot.docs.length === 0) {
        console.log('⚠️ Nenhum documento encontrado na coleção clienteUser')
        setClientes([])
        showAlertMessage(`Nenhum cliente encontrado para "${nomeEstabelecimento}"`, "info")
        return
      }
      
      const clientesData = snapshot.docs.map((doc, index) => {
        const data = doc.data()
        console.log(`📋 Cliente ${index + 1}:`, { 
          id: doc.id, 
          nome: data.nome, 
          telefone: data.telefone, 
          estabelecimento: data.estabelecimento,
          email: data.email 
        })
        return {
          id: doc.id,
          ...data
        }
      })
      
      console.log('✅ Processando clientes...')
      setClientes(clientesData)
      console.log('✅ Total de clientes encontrados:', clientesData.length)
      
      if (clientesData.length === 0) {
        console.log('⚠️ Nenhum cliente encontrado para o estabelecimento:', nomeEstabelecimento)
        showAlertMessage(`Nenhum cliente encontrado para "${nomeEstabelecimento}"`, "info")
      } else {
        showAlertMessage(`${clientesData.length} cliente(s) encontrado(s)`, "success")
      }
    } catch (error) {
      console.error('❌ Erro ao buscar clientes:', error)
      console.error('❌ Stack trace:', (error as Error).stack)
      showAlertMessage("Erro ao carregar lista de clientes", "error")
      setClientes([])
    } finally {
      setIsLoadingClientes(false)
    }
  }

  // Função para lidar com seleção de cliente
  const handleClienteSelecionado = (clienteId: string) => {
    setClienteSelecionado(clienteId)
    
    if (clienteId === "") {
      // Se não selecionou nenhum cliente, limpa o número
      setRecipientNumber("")
      return
    }
    
    // Busca o cliente selecionado
    const cliente = clientes.find(c => c.id === clienteId)
    if (cliente && cliente.telefone) {
      // Formata o número e preenche o campo
      const numeroFormatado = formatarNumero(cliente.telefone)
      setRecipientNumber(numeroFormatado)
      showAlertMessage(`Cliente selecionado: ${cliente.nome}`, "success")
    }
  }

  // Função para verificar status de conexão do WhatsApp
  const checkWhatsAppStatus = async (phoneNumber: string) => {
    if (!phoneNumber.trim()) return

    setIsCheckingStatus(true)
    try {
      const response = await fetch('https://barber-backend-qlt6.onrender.com/api/whatsapp/check-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: API_KEY,
          number: phoneNumber
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        if (data.connected) {
          setIsConnected(true)
          setLastCheckedPhone(phoneNumber)
          // Salva o número no localStorage para verificação automática
          localStorage.setItem('whatsapp_phone', phoneNumber)
          showAlertMessage("WhatsApp já está conectado! Você pode enviar mensagens.", "success")
        } else {
          setIsConnected(false)
          showAlertMessage(`WhatsApp não está conectado. Status: ${data.status || 'Desconhecido'}`, "info")
        }
      } else {
        console.log('Erro ao verificar status:', data.error)
        // Se der erro, assume que não está conectado
        setIsConnected(false)
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error)
      setIsConnected(false)
    } finally {
      setIsCheckingStatus(false)
    }
  }

  // Função para gerar QR Code
  const generateQRCode = async () => {
    if (!phoneNumber.trim()) {
      showAlertMessage("Por favor, insira um número de telefone", "warning")
      return
    }

    // Primeiro verifica se já está conectado
    await checkWhatsAppStatus(phoneNumber)
    
    // Se já estiver conectado, não precisa gerar QR Code
    if (isConnected && lastCheckedPhone === phoneNumber) {
      return
    }

    setIsGeneratingQR(true)
    try {
      const response = await fetch('https://barber-backend-qlt6.onrender.com/api/whatsapp/generate-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device: phoneNumber,
          api_key: API_KEY,
          force: true
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        if (data.qrcode) {
          setQrCodeUrl(data.qrcode)
          showAlertMessage("QR Code gerado com sucesso! Escaneie com seu WhatsApp", "success")
        } else if (data.msg) {
          showAlertMessage(data.msg, "info")
        } else {
          showAlertMessage(data.message || "QR Code gerado com sucesso!", "success")
        }
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
      const response = await fetch('https://barber-backend-qlt6.onrender.com/api/whatsapp/send-message', {
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
      const response = await fetch('https://barber-backend-qlt6.onrender.com/api/whatsapp/disconnect', {
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
        setLastCheckedPhone("")
        // Limpa o número salvo no localStorage
        localStorage.removeItem('whatsapp_phone')
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



  // Buscar estabelecimento do atendente logado usando o UID da URL
  useEffect(() => {
    const fetchEstabelecimento = async () => {
      if (!uid) {
        console.log('❌ UID não fornecido na URL')
        return
      }
      
      console.log('🔍 Iniciando busca do estabelecimento para UID:', uid)
      
      try {
        // Primeiro tenta buscar como colaborador
        console.log('🔍 Buscando como colaborador...')
        const colabRef = doc(firestore, "colaboradores", uid)
        const colabSnap = await getDoc(colabRef)
        
        if (colabSnap.exists()) {
          const colabData = colabSnap.data() as any
          const estabelecimentoData = colabData?.estabelecimento || ""
          console.log('🏢 Dados do colaborador:', colabData)
          console.log('🏢 Estabelecimento encontrado via colaborador:', estabelecimentoData)
          
          if (estabelecimentoData && estabelecimentoData.trim()) {
            setEstabelecimento(estabelecimentoData)
            // @ts-ignore
            window.nomeEstabelecimentoAtendente = estabelecimentoData
            return
          }
        } else {
          console.log('❌ Usuário não é colaborador')
        }

        // Se não for colaborador, tenta buscar como conta principal (admin)
        console.log('🔍 Buscando como conta principal...')
        const contaRef = doc(firestore, "contas", uid)
        const contaSnap = await getDoc(contaRef)
        
        if (contaSnap.exists()) {
          const contaData = contaSnap.data() as any
          const estabelecimentoData = contaData?.nomeEstabelecimento || ""
          console.log('🏢 Dados da conta:', contaData)
          console.log('🏢 Estabelecimento encontrado via conta principal:', estabelecimentoData)
          
          if (estabelecimentoData && estabelecimentoData.trim()) {
            setEstabelecimento(estabelecimentoData)
            // @ts-ignore
            window.nomeEstabelecimentoAtendente = estabelecimentoData
          } else {
            console.log('❌ Nome do estabelecimento vazio na conta principal')
          }
        } else {
          console.log('❌ Usuário não encontrado na coleção contas')
        }
      } catch (e) {
        console.error("❌ Erro ao buscar estabelecimento:", e)
      }
    }
    
    // Adicionar um pequeno delay para garantir que o Firebase esteja pronto
    const timeoutId = setTimeout(() => {
      fetchEstabelecimento()
    }, 1000)
    
    return () => clearTimeout(timeoutId)
  }, [uid])

  // Buscar clientes quando o estabelecimento for carregado
  useEffect(() => {
    console.log('🏢 Estabelecimento mudou:', estabelecimento)
    if (estabelecimento && estabelecimento.trim()) {
      console.log('📞 Iniciando busca de clientes...')
      buscarClientes(estabelecimento)
    } else {
      console.log('❌ Estabelecimento vazio ou inválido')
      setClientes([])
    }
  }, [estabelecimento])

  // Verificar status de conexão automaticamente quando o componente carregar
  useEffect(() => {
    // Verifica se há um número salvo no localStorage ou sessionStorage
    const savedPhone = localStorage.getItem('whatsapp_phone') || sessionStorage.getItem('whatsapp_phone')
    if (savedPhone && savedPhone.trim()) {
      setPhoneNumber(savedPhone)
      // Verifica o status automaticamente
      checkWhatsAppStatus(savedPhone)
    }
  }, [])

  // Verificação automática de status em tempo real
  useEffect(() => {
    if (!phoneNumber.trim() || !isConnected) return

    // Verifica o status a cada 30 segundos se estiver conectado
    const intervalId = setInterval(() => {
      console.log('🔄 Verificação automática de status...')
      checkWhatsAppStatus(phoneNumber)
    }, 30000) // 30 segundos

    return () => clearInterval(intervalId)
  }, [phoneNumber, isConnected])

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
      console.log('🔄 Usando estabelecimento do window:', est)
      setEstabelecimento(est)
    }
  }, [estabelecimento])

  // Verificação adicional: buscar estabelecimento diretamente da conta se ainda não tiver
  useEffect(() => {
    const fetchEstabelecimentoAlternativo = async () => {
      if (!uid || estabelecimento) return // Só executa se não tiver estabelecimento
      
      try {
        console.log('🔄 Tentativa alternativa de buscar estabelecimento...')
        const contaRef = doc(firestore, "contas", uid)
        const contaSnap = await getDoc(contaRef)
        if (contaSnap.exists()) {
          const data = contaSnap.data() as any
          const estabelecimentoData = data?.nomeEstabelecimento || ""
          if (estabelecimentoData) {
            console.log('✅ Estabelecimento encontrado via busca alternativa:', estabelecimentoData)
            setEstabelecimento(estabelecimentoData)
          }
        }
      } catch (e) {
        console.error("Erro na busca alternativa de estabelecimento:", e)
      }
    }
    
    // Executar após 3 segundos se ainda não tiver estabelecimento
    const timeoutId = setTimeout(() => {
      if (!estabelecimento) {
        fetchEstabelecimentoAlternativo()
      }
    }, 3000)
    
    return () => clearTimeout(timeoutId)
  }, [uid, estabelecimento])

  // Verificação alternativa: buscar tipoPlano diretamente do usuário se for admin
  useEffect(() => {
    const fetchTipoPlanoAlternativo = async () => {
      if (!uid || estabelecimento) return // Só executa se não tiver estabelecimento
      
      try {
        // Tentar buscar como conta principal (admin)
        const contaRef = doc(firestore, "contas", uid)
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
  }, [uid, estabelecimento])


  // Debug: verificar estado do usuário
  useEffect(() => {
    console.log("=== DEBUG USUÁRIO ===")
    console.log("UID da URL:", uid)
    console.log("User object:", user)
    console.log("User UID:", user?.uid)
    console.log("User email:", user?.email)
    console.log("Estabelecimento:", estabelecimento)
    console.log("===================")
  }, [uid, user, estabelecimento])

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
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="bold">
                      {isConnected ? "Conectado" : "Desconectado"}
                    </Text>
                    {lastCheckedPhone && (
                      <Text fontSize="sm" color="gray.500">
                        Número: {lastCheckedPhone}
                      </Text>
                    )}
                    {isCheckingStatus && (
                      <Text fontSize="xs" color="blue.500">
                        Verificando status...
                      </Text>
                    )}
                  </VStack>
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

                    <HStack w="100%" spacing={3}>
                      <Button
                        colorScheme="whatsapp"
                        size="lg"
                        leftIcon={<FaQrcode />}
                        onClick={generateQRCode}
                        isLoading={isGeneratingQR || isCheckingStatus}
                        loadingText={isCheckingStatus ? "Verificando..." : "Gerando QR Code..."}
                        flex={1}
                        isDisabled={!phoneNumber.trim()}
                      >
                        {isCheckingStatus ? "Verificando Status" : "Gerar QR Code"}
                      </Button>
                      
                      <Button
                        colorScheme="blue"
                        size="lg"
                        variant="outline"
                        onClick={() => checkWhatsAppStatus(phoneNumber)}
                        isLoading={isCheckingStatus}
                        loadingText="Verificando..."
                        isDisabled={!phoneNumber.trim() || isGeneratingQR}
                      >
                        Verificar Status
                      </Button>
                    </HStack>
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
                    {/* Seleção de Cliente */}
                    <FormControl>
                      <HStack justify="space-between" align="center" mb={2}>
                        <FormLabel fontSize="sm" fontWeight="bold" color="gray.700" mb={0}>
                          Selecionar Cliente (Opcional)
                        </FormLabel>
                        <Button
                          size="xs"
                          variant="outline"
                          colorScheme="blue"
                          onClick={() => buscarClientes(estabelecimento)}
                          isLoading={isLoadingClientes}
                          isDisabled={!estabelecimento}
                        >
                          {isLoadingClientes ? "Carregando..." : "Atualizar"}
                        </Button>
                      </HStack>
                      <Select
                        placeholder={clientes.length === 0 ? "Nenhum cliente encontrado" : "Escolha um cliente cadastrado..."}
                        value={clienteSelecionado}
                        onChange={(e) => handleClienteSelecionado(e.target.value)}
                        isDisabled={isSendingMessage || isLoadingClientes || clientes.length === 0}
                        bg="white"
                      >
                        {clientes.map((cliente) => (
                          <option key={cliente.id} value={cliente.id}>
                            {cliente.nome} - {cliente.telefone}
                          </option>
                        ))}
                      </Select>
                      {isLoadingClientes && (
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          Carregando clientes...
                        </Text>
                      )}
                      {!isLoadingClientes && clientes.length === 0 && estabelecimento && (
                        <Text fontSize="xs" color="orange.500" mt={1}>
                          Nenhum cliente encontrado para "{estabelecimento}"
                        </Text>
                      )}
                      {!isLoadingClientes && clientes.length > 0 && (
                        <Text fontSize="xs" color="green.500" mt={1}>
                          {clientes.length} cliente(s) encontrado(s)
                        </Text>
                      )}
                    </FormControl>

                    {/* Input de Número de Telefone */}
                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="bold" color="gray.700">
                        Número do Destinatário
                      </FormLabel>
                      <InputGroup>
                        <InputLeftElement>
                          <Icon as={FaPhone} color="gray.400" />
                        </InputLeftElement>
                        <Input
                          placeholder="Digite o número (ex: 21987654321) ou selecione um cliente acima"
                          value={recipientNumber}
                          onChange={(e) => {
                            setRecipientNumber(e.target.value)
                            // Se o usuário digitar manualmente, limpa a seleção de cliente
                            if (e.target.value !== recipientNumber) {
                              setClienteSelecionado("")
                            }
                          }}
                          isDisabled={isSendingMessage}
                        />
                      </InputGroup>
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        {clienteSelecionado ? "Número preenchido automaticamente" : "Digite o número ou selecione um cliente"}
                      </Text>
                    </FormControl>

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

                    {/* Botão para limpar seleção de cliente */}
                    {clienteSelecionado && (
                      <Button
                        size="sm"
                        variant="outline"
                        colorScheme="gray"
                        leftIcon={<FaUser />}
                        onClick={() => {
                          setClienteSelecionado("")
                          setRecipientNumber("")
                        }}
                        isDisabled={isSendingMessage}
                      >
                        Limpar Seleção de Cliente
                      </Button>
                    )}

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
