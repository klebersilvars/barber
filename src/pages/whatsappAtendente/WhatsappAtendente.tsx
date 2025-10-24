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
} from "@chakra-ui/react"
import { FaWhatsapp, FaEnvelope } from "react-icons/fa"
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
            <Card
             className="contact-support-card"
              w="100%"
              maxW="720px"
              mx="auto"
              bg="white"
              borderWidth="1px"
              borderColor="gray.200"
              boxShadow="lg"
              rounded="xl"
            >
             <CardBody p={{ base: 8, md: 12 }}>
               <VStack spacing={8} textAlign="center">
                        <VStack spacing={4}>
                   <Flex
                     align="center"
                     justify="center"
                     w={16}
                     h={16}
                     bg="blue.500"
                     rounded="full"
                     boxShadow="lg"
                     mx="auto"
                   >
                     <Icon as={FaEnvelope} boxSize={8} color="white" />
                   </Flex>
                   
                   <Heading size="xl" color="gray.800">
                     Entre em Contato com o Suporte
                      </Heading>
                   
                   <Text color="gray.600" fontSize="lg" maxW="500px" lineHeight="1.6">
                     Para criarmos sua conta na plataforma de envio de mensagens, 
                     entre em contato conosco através do WhatsApp.
                      </Text>
                    </VStack>

                    <Button
                      colorScheme="whatsapp"
                      size="lg"
                   leftIcon={<FaEnvelope />}
                      onClick={() => {
                     const phoneNumber = "5521982410516"
                     const message = "Olá! Gostaria de criar minha conta na plataforma de envio de mensagens WhatsApp."
                     const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
                     window.open(whatsappUrl, "_blank")
                   }}
              w="100%"
                   maxW="400px"
              mx="auto"
                   h="60px"
                   fontSize="lg"
                   fontWeight="bold"
                   boxShadow="md"
                   _hover={{
                     transform: "translateY(-2px)",
                     boxShadow: "lg"
                   }}
                   transition="all 0.2s"
                 >
                   Enviar Mensagem pro Suporte
                        </Button>
                  </VStack>
                </CardBody>
              </Card>
        </VStack>
      </Container>
    </Box>
  )
}
