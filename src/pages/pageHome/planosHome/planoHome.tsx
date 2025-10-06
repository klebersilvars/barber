"use client"

import { useState, useEffect } from "react"
import { Box, Button, Text, Badge, VStack, HStack, useColorModeValue, Icon, SimpleGrid, Stack } from "@chakra-ui/react"
import "./plano.css"
import { Check, X, Star, Crown, CreditCard, Smartphone, HeadphonesIcon, ChevronRight } from "lucide-react"
import { auth } from '../../../firebase/firebase'
import { firestore } from '../../../firebase/firebase'
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore'
import { useNavigate } from "react-router-dom"

export default function Plano() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [testeGratisAtivo, setTesteGratisAtivo] = useState(false)
  const [jaPegouPremiumGratis, setJaPegouPremiumGratis] = useState<boolean | null>(null);
  const [loadingConta, setLoadingConta] = useState(true);
  const [dataTerminoPlano, setDataTerminoPlano] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly')

  const navigate = useNavigate();

  // Função para calcular a data de término do plano por período exato (mês/3 meses/1 ano cravado)
  const calcularDataTerminoPorPeriodo = (period: 'monthly' | 'quarterly' | 'yearly') => {
    const inicio = new Date()
    const termino = new Date(inicio)
    if (period === 'yearly') {
      termino.setFullYear(termino.getFullYear() + 1)
    } else if (period === 'quarterly') {
      termino.setMonth(termino.getMonth() + 3)
    } else {
      termino.setMonth(termino.getMonth() + 1)
    }
    return termino.toISOString()
  };

  // Função para formatar a data de término
  const formatarDataTermino = (dataISO: string) => {
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  useEffect(() => {
    if (!auth.currentUser?.uid) return;
    setLoadingConta(true);
    const contasRef = collection(firestore, 'contas');
    const qConta = query(contasRef, where('__name__', '==', auth.currentUser.uid));
    getDocs(qConta).then(snapshot => {
      if (!snapshot.empty) {
        const contaData = snapshot.docs[0].data();
        setJaPegouPremiumGratis(contaData.ja_pegou_premium_gratis ?? false);
      }
      setLoadingConta(false);
    });
  }, []);

  const ativarTesteGratis = async () => {
    if (!auth.currentUser?.uid) return
    const docRef = doc(firestore, 'contas', auth.currentUser.uid)
    const hoje = new Date()
    
    // Calcular data de término: dia atual + 7 dias
    const dataTermino = new Date(hoje)
    dataTermino.setDate(hoje.getDate() + 7) // 7 dias de teste grátis
    
    console.log('=== ATIVANDO TESTE GRÁTIS (PLANO.TSX) ===');
    console.log('Data atual:', hoje.toISOString());
    console.log('Data de término calculada:', dataTermino.toISOString());
    console.log('Dias restantes: 7');
    
    await updateDoc(docRef, {
      premium: true,
      tipoPlano: 'gratis', // DEFINIR COMO GRATIS
      data_inicio_teste_gratis: hoje.toISOString(),
      dias_restantes_teste_gratis: 7,
      ja_pegou_premium_gratis: true,
      data_termino_plano_premium: dataTermino.toISOString() // ✅ Data de término correta
    })
    
    console.log('Teste grátis ativado com sucesso!');
    console.log('Data de término salva:', dataTermino.toISOString());
    
    setTesteGratisAtivo(true)
    setJaPegouPremiumGratis(true)
    // Redirecionar para o dashboard   para liberar as rotas
    navigate(`/dashboard/${auth.currentUser.uid}`)
  }

  const plans = [
    {
      id: "bronze",
      name: "Bronze",
      description: "Para profissionais autônomos ou pequenos negócios",
      monthlyPrice: 59.90,  
      quarterlyPrice: 162.00,
      yearlyPrice: 575.00,
      popular: false,
      features: [
        "1 colaborador (você)",
        "Agendamento online",
        "Suporte padrão",
        'Treinamento incluído'
      ],
      limitations: [
        "Sem relatórios avançados",
        "Sem colaboradores adicionais",
        'Sem gestão financeira',
        'Sem controle de clientes',
        'Whatsapp integrado',
        'Sem personalização da página de agendamento' 
      ],
      color: "purple",
      icon: Star,
    },
    {
      id: "prata",
      name: "Prata",
      description: "Para estabelecimentos em crescimento",
      monthlyPrice: 89.90,
      quarterlyPrice: 243.00,
      yearlyPrice: 863.00,
      popular: false,
      features: [
        "2 colaboradores",
        "Relatórios avançados",
        "Relatórios personalizados",
        "Suporte prioritário 24/7",
        "Treinamento incluído",
        "Gestão financeira completa",
      ],
      limitations: [
        'Whatsapp integrado',
        'Sem personalização da página de agendamento'
      ],
      color: "blue",
      icon: Star,
    },
    {
      id: "ouro",
      name: "Ouro",
      description: 'Perfeito para empresas em plena expansão.',
      monthlyPrice: 139.90,
      quarterlyPrice: 378.00,
      yearlyPrice: 1343.00,
      popular: false,
      features: [
        "3 colaboradores",
        "Relatórios avançados",
        "Relatórios personalizados",
        "Suporte prioritário 24/7",
        "Treinamento incluído",
        "Gestão financeira completa",
        'Whatsapp integrado para o atendente.',
        'Personalização da página de agendamento'
      ],
      limitations: [
        'Sem colaboradores ilimitados'
      ],
      color: "blue",
      icon: Crown,
    },
    {
      id: "diamante",
      name: "Diamante",
      description: 'Feito para líderes que buscam o máximo em desempenho e exclusividade.',
      monthlyPrice: 189.90,
      quarterlyPrice: 513.00,
      yearlyPrice: 1823.00,
      popular: true,
      features: [
        "Colaboradores ilimitados",
        "Relatórios avançados",
        "Relatórios personalizados",
        "Suporte prioritário 24/7",
        "Treinamento incluído",
        "Gestão financeira completa",
        'Whatsapp integrado para o atendente.',
        'Personalização da página de agendamento'
      ],
      limitations: [
      ],
      color: "blue",
      icon: Star,
    },
  ]

  const benefits = [
    "Administre sua agenda, parceiros e estoque",
    "Crie relatórios para analisar o seu negócio",
    "Habilite agendamentos online",
    "Gestão financeira avançada",
    "Suporte especializado",
  ]

  const getTotalPriceByPeriod = (plan: any, period: 'monthly' | 'quarterly' | 'yearly') => {
    if (period === 'quarterly') return plan.quarterlyPrice
    if (period === 'yearly') return plan.yearlyPrice
    return plan.monthlyPrice
  }

  const getMonthlyEquivalent = (plan: any, period: 'monthly' | 'quarterly' | 'yearly') => {
    const total = getTotalPriceByPeriod(plan, period)
    if (period === 'quarterly') return total / 3
    if (period === 'yearly') return total / 12
    return total
  }

  const getCycleLabel = (period: 'monthly' | 'quarterly' | 'yearly') => {
    if (period === 'quarterly') return '/trimestre'
    if (period === 'yearly') return '/ano'
    return '/mês'
  }

  // Removido cálculo por dias; usamos meses/ano exatos

  const handleWhatsAppClick = () => {
    const phoneNumber = "5521982410516"
    const message = "Olá, tudo bem? quero conversar sobre os planos que vi na plataforma Trezu"
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
  }

  // URL do backend no Render
  const BACKEND_URL = "https://barber-backend-qlt6.onrender.com"; // Troque pelo seu domínio do Render

  // Função para iniciar o pagamento Mercado Pago
  const handleCheckout = async (plan: any) => {
    try {
      setPaymentMessage("");
      setLoadingPayment(true);
      const userEmail = auth.currentUser?.email;
      if (!userEmail) {
        setPaymentMessage("Você precisa estar logado para assinar um plano. Faça login e tente novamente.");
        setLoadingPayment(false);
        return;
      }

      // Calcular data de término conforme período (mês/3 meses/1 ano cravado)
      const dataTermino = calcularDataTerminoPorPeriodo(billingPeriod);
      setDataTerminoPlano(dataTermino);

      setPaymentMessage("Redirecionando para o Mercado Pago. Aguarde...");
      const response = await fetch(`${BACKEND_URL}/api/create-preference`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          planName: plan.name,
          price: getTotalPriceByPeriod(plan, billingPeriod),
          email: userEmail,
          dataTermino: dataTermino, // Enviar data de término para o backend
          billingPeriod: billingPeriod // Enviar período para o backend (mensal/trimestral/anual)
        }),
      });
      const data = await response.json();
      if (data.init_point) {
        setPaymentMessage("");
        window.location.href = data.init_point;
      } else {
        setPaymentMessage("Não foi possível iniciar o pagamento. Tente novamente em instantes ou entre em contato com o suporte.");
      }
    } catch (err) {
      setPaymentMessage("Erro ao conectar com o Mercado Pago. Verifique sua conexão ou tente novamente mais tarde.");
    } finally {
      setLoadingPayment(false);
    }
  };

  return (
    <Box width="100%" maxW="100%" bg={useColorModeValue('gray.50','gray.900')}  h={{ base: '100dvh', md: '100dvh' }} overflowY="scroll" pb={{ base: 20, md: 28 }} sx={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
      {/* Hero + Billing Toggle */}
      <Box w="100%" maxW="100%"  bgGradient={useColorModeValue('linear(to-r, purple.50, white)','linear(to-r, gray.800, gray.900)')} borderBottomWidth="1px" borderColor={useColorModeValue('gray.200','gray.700')}>
        <Box w="100%" maxW="1600px" mx="auto" px={{ base: 4, md: 8 }} py={{ base: 8, md: 10 }}>
          <VStack align="start" spacing={4} w="100%">
            <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight={800} color={useColorModeValue('gray.800','white')}>
              Escolha o plano ideal para o seu negócio
            </Text>
            <Text color={useColorModeValue('gray.600','gray.300')}>
              Comece a transformar sua gestão hoje mesmo com os recursos certos para você.
            </Text>
            <HStack spacing={2} pt={2}>
              <Button size="sm" variant={billingPeriod==='monthly'?'solid':'outline'} colorScheme="purple" onClick={()=>setBillingPeriod('monthly')}>Mensal</Button>
              <Button size="sm" variant={billingPeriod==='quarterly'?'solid':'outline'} colorScheme="purple" onClick={()=>setBillingPeriod('quarterly')}>Trimestral</Button>
              <Button size="sm" variant={billingPeriod==='yearly'?'solid':'outline'} colorScheme="purple" onClick={()=>setBillingPeriod('yearly')}>Anual</Button>
            </HStack>
          </VStack>
        </Box>
      </Box>

      {/* Benefits List */}
      <Box w="100%" maxW="1500px" mx="auto" px={{ base: 4, md: 8 }} pt={{ base: 6, md: 8 }} pb={{ base: 2, md: 4 }}>
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={3} w="100%">
          {benefits.map((benefit, index) => (
            <HStack key={index} spacing={3} bg={useColorModeValue('white','gray.800')} borderWidth="1px" borderColor={useColorModeValue('gray.200','gray.700')} borderRadius="lg" px={4} py={3} boxShadow={useColorModeValue('sm','none')}>
              <Icon as={Check} color={useColorModeValue('green.500','green.300')} />
              <Text color={useColorModeValue('gray.700','gray.200')} fontWeight={600} fontSize="sm">{benefit}</Text>
            </HStack>
          ))}
        </SimpleGrid>
      </Box>

      {/* Plans Grid */}
      <Box w="100%" maxW="100%" py={{ base: 6, md: 10 }}>
        <Box w="100%" maxW="1600px" mx="auto" px={{ base: 4, md: 8 }}>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={{ base: 4, md: 6, lg: 8 }} w="100%">
            {loadingConta ? (
              <div style={{width: '100%', display: 'flex', justifyContent: 'center', margin: '32px 0'}}>
                <span>Carregando...</span>
              </div>
            ) : (
              jaPegouPremiumGratis === false && !testeGratisAtivo && (
                <Box
                  borderStyle="solid"
                  borderWidth={3}
                  borderColor="green.500"
                  borderRadius="xl"
                  boxShadow="0 0 0 3px #22c55e33"
                  bg={useColorModeValue("green.50", "green.900")}
                  p={6}
                  w="100%"
                  h="100%"
                  position="relative"
                  transition="all 0.2s"
                  _hover={{ boxShadow: "lg", borderColor: "green.600" }}
                >
                  <Badge colorScheme="green" position="absolute" top={4} right={4} px={3} py={1} borderRadius="md" fontWeight={700} fontSize="sm">
                    🎁 GRÁTIS
                  </Badge>
                  <VStack spacing={3} align="start">
                    <HStack spacing={2} align="center">
                      <Box bg="green.400" borderRadius="full" p={2} display="flex" alignItems="center">
                        <Icon as={Star} color="white" boxSize={6} />
                      </Box>
                      <Text fontWeight={700} fontSize="2xl" color="green.700">Avaliação Grátis</Text>
                    </HStack>
                    <Text color="gray.600" fontSize="md">Experimente gratuitamente por 7 dias</Text>
                    <Box mt={2} mb={2}>
                      <Text fontSize="3xl" fontWeight={800} color="green.700">
                        R$ 0,00
                        <Text as="span" fontSize="lg" color="gray.500" fontWeight={400}>/7 dias</Text>
                      </Text>
                    </Box>
                    <VStack align="start" spacing={1} mt={2} mb={2}>
                      <HStack spacing={2}>
                        <Icon as={Check} color="green.500" boxSize={4} />
                        <Text fontSize="sm">Acesso limitado por 7 dias</Text>
                      </HStack>
                      <HStack spacing={2}>
                        <Icon as={Check} color="green.500" boxSize={4} />
                        <Text fontSize="sm">Página de serviços</Text>
                      </HStack>
                      <HStack spacing={2}>
                        <Icon as={Check} color="green.500" boxSize={4} />
                        <Text fontSize="sm">Página de agendamento</Text>
                      </HStack>
                      <HStack spacing={2}>
                        <Icon as={Check} color="green.500" boxSize={4} />
                        <Text fontSize="sm">Não precisa cadastrar cartão de crédito</Text>
                      </HStack>
                    </VStack>
                    <Button
                      colorScheme="green"
                      rightIcon={<ChevronRight size={16} />}
                      onClick={ativarTesteGratis}
                      w="100%"
                      mt={2}
                      fontWeight={700}
                      fontSize="md"
                    >
                      Ativar Grátis
                    </Button>
                  </VStack>
                </Box>
              )
            )}
            {/* Mostrar todos os planos: Bronze, Prata, Ouro, Diamante */}
            {plans.map((plan) => {
              return (
              <Box
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                borderStyle={selectedPlan === plan.id ? "solid" : "dashed"}
                borderWidth={selectedPlan === plan.id ? 3 : 2}
                borderColor={selectedPlan === plan.id ? (plan.id === "bronze" ? "purple.500" : "blue.500") : plan.popular ? "blue.400" : "gray.200"}
                borderRadius="xl"
                boxShadow={plan.popular ? "0 0 0 3px #2563eb33" : "sm"}
                bg={plan.id === "bronze" ? useColorModeValue("purple.50", "purple.900") : useColorModeValue("white", "gray.800")}
                p={6}
                w="100%"
                h="100%"
                position="relative"
                transition="all 0.2s"
                _hover={{ boxShadow: "lg", borderColor: plan.popular ? "blue.500" : "purple.400" }}
                cursor="pointer"
              >
                {plan.popular && (
                  <Badge colorScheme="blue" position="absolute" top={4} right={4} px={3} py={1} borderRadius="md" fontWeight={700} fontSize="sm">
                    <Icon as={Star} mr={1} /> Mais Popular
                  </Badge>
                )}
                {plan.id === "bronze" && (
                  <Badge colorScheme="purple" position="absolute" top={4} right={4} px={3} py={1} borderRadius="md" fontWeight={700} fontSize="sm">
                    Básico
                  </Badge>
                )}
                <VStack spacing={3} align="start">
                  <HStack spacing={2} align="center">
                    <Box bg={plan.id === "bronze" ? "purple.400" : "blue.400"} borderRadius="full" p={2} display="flex" alignItems="center">
                      <Icon as={plan.icon} color="white" boxSize={6} />
                    </Box>
                    <Text fontWeight={700} fontSize="2xl" color={plan.id === "bronze" ? "purple.700" : "blue.700"}>{plan.name}</Text>
                  </HStack>
                  <Text color="gray.600" fontSize="md">{plan.description}</Text>
                  <Box mt={2} mb={2}>
                    <Text fontSize="3xl" fontWeight={800} color={plan.id === "bronze" ? "purple.700" : "blue.700"}>
                      R$ {getTotalPriceByPeriod(plan, billingPeriod).toFixed(2).replace(".", ",")}
                      <Text as="span" fontSize="lg" color="gray.500" fontWeight={400}>{getCycleLabel(billingPeriod)}</Text>
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      Equivale a R$ {getMonthlyEquivalent(plan, billingPeriod).toFixed(2).replace(".", ",")}/mês
                    </Text>
                    {dataTerminoPlano && selectedPlan === plan.id && (
                      <Text fontSize="sm" color="gray.600" mt={1}>
                        Data que termina o plano: {formatarDataTermino(dataTerminoPlano)}
                      </Text>
                    )}
                  </Box>
                  <VStack align="start" spacing={1} mt={2} mb={2}>
                    {plan.features.map((feature, index) => (
                      <HStack key={index} spacing={2}>
                        <Icon as={Check} color={plan.id === "bronze" ? "purple.500" : "blue.500"} boxSize={4} />
                        <Text fontSize="sm">{feature}</Text>
                      </HStack>
                    ))}
                    {plan.limitations.map((limitation, index) => (
                      <HStack key={index} spacing={2}>
                        <Icon as={X} color="red.400" boxSize={4} />
                        <Text fontSize="sm" color="red.500">{limitation}</Text>
                      </HStack>
                    ))}
                  </VStack>
                  <Button
                    colorScheme={plan.id === "bronze" ? "purple" : "blue"}
                    rightIcon={<ChevronRight size={16} />}
                    onClick={e => {
                      e.stopPropagation();
                      handleCheckout(plan);
                    }}
                    isLoading={loadingPayment}
                    loadingText="Processando..."
                    w="100%"
                    mt={2}
                    fontWeight={700}
                    fontSize="md"
                  >
                    {loadingPayment ? "Processando..." : "Selecionar Plano"}
                  </Button>
                  {paymentMessage && selectedPlan === plan.id && (
                    <Text color={paymentMessage.includes('Erro') || paymentMessage.includes('não foi possível') ? 'red.500' : 'gray.700'} mt={2} fontSize="sm" textAlign="center">
                      {paymentMessage}
                    </Text>
                  )}
                </VStack>
              </Box>
              )
            })}
          </SimpleGrid>
        </Box>
      </Box>

      {/* Payment Methods */}
      <Box w="100%" maxW="100%" bg={useColorModeValue('white','gray.800')} borderTopWidth="1px" borderBottomWidth="1px" borderColor={useColorModeValue('gray.200','gray.700')} py={{ base: 8, md: 12 }}>
        <Box w="100%" maxW="1200px" mx="auto" px={{ base: 4, md: 8 }}>
          <VStack align="stretch" spacing={4}>
            <Text fontWeight={800} fontSize={{ base: 'lg', md: 'xl' }} color={useColorModeValue('gray.800','gray.100')}>
              Métodos de pagamento aceitos
            </Text>
            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
              <HStack spacing={3} bg={useColorModeValue('gray.50','gray.700')} borderWidth="1px" borderColor={useColorModeValue('gray.200','gray.600')} borderRadius="md" px={4} py={3}>
                <CreditCard size={22} />
                <Text fontWeight={600}>Cartão de Crédito</Text>
              </HStack>
              <HStack spacing={3} bg={useColorModeValue('gray.50','gray.700')} borderWidth="1px" borderColor={useColorModeValue('gray.200','gray.600')} borderRadius="md" px={4} py={3}>
                <Smartphone size={22} />
                <Text fontWeight={600}>PIX</Text>
              </HStack>
            </SimpleGrid>
          </VStack>
        </Box>
      </Box>

      {/* Support */}
      <Box w="100%" maxW="100%" bgGradient={useColorModeValue('linear(to-r, purple.50, purple.100)','linear(to-r, gray.800, gray.700)')} py={{ base: 10, md: 14 }}>
        <Box w="100%" maxW="1200px" mx="auto" px={{ base: 4, md: 8 }}>
          <Box bg={useColorModeValue('white','gray.800')} borderWidth="1px" borderColor={useColorModeValue('purple.200','gray.600')} borderRadius="xl" boxShadow={useColorModeValue('md','none')} px={{ base: 4, md: 8 }} py={{ base: 6, md: 8 }}>
            <Stack direction={{ base: 'column', md: 'row' }} align={{ base: 'flex-start', md: 'center' }} spacing={{ base: 4, md: 6 }} w="100%">
              <HeadphonesIcon size={32} />
              <VStack align="start" spacing={1} flex={1}>
                <Text fontSize={{ base: 'lg', md: 'xl' }} fontWeight={800}>Precisa de ajuda para escolher?</Text>
                <Text color={useColorModeValue('gray.700','gray.300')}>Nossa equipe está pronta para te ajudar a encontrar o plano ideal para o seu negócio.</Text>
              </VStack>
              <Button colorScheme="purple" variant="solid" size={{ base: 'md', md: 'lg' }} onClick={handleWhatsAppClick} w={{ base: '100%', md: 'auto' }}>
                Falar com Especialista
              </Button>
            </Stack>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
