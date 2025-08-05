"use client"

import { useState, useEffect } from "react"
import { Box, Button, Text, Badge, VStack, HStack, useColorModeValue, Icon, Stack } from "@chakra-ui/react"
import "./plano.css"
import { ArrowLeft, Check, X, Star, Crown, CreditCard, Smartphone, HeadphonesIcon, ChevronRight } from "lucide-react"
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

  const navigate = useNavigate();

  // Função para calcular a data de término do plano
  const calcularDataTermino = (diasRestantes: number) => {
    const hoje = new Date();
    const dataTermino = new Date(hoje);
    dataTermino.setDate(hoje.getDate() + diasRestantes);
    
    return dataTermino.toISOString();
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
    // Redirecionar para o dashboard para liberar as rotas
    navigate(`/dashboard/${auth.currentUser.uid}`)
  }

  const plans = [
    {
      id: "individual",
      name: "Individual",
      description: "Para profissionais autônomos ou pequenos negócios",
      monthlyPrice: 28.90,
      yearlyPrice: 100.0,
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
        'Sem controle de clientes'
        
      ],
      color: "purple",
      icon: Star,
    },
    {
      id: "empresa",
      name: "Empresa",
      description: "Para estabelecimentos em crescimento",
      monthlyPrice: 58.00,
      yearlyPrice: 200.0,
      popular: true,
      features: [
        "Colaboradores ilimitados",
        "Relatórios avançados",
        "Relatórios personalizados",
        "Suporte prioritário 24/7",
        "Treinamento incluído",
        "Gestão financeira completa",
      ],
      limitations: [],
      color: "blue",
      icon: Crown,
    },
  ]

  const benefits = [
    "Administre sua agenda, parceiros e estoque",
    "Crie relatórios para analisar o seu negócio",
    "Habilite agendamentos online",
    "Gestão financeira avançada",
    "Suporte especializado",
  ]

  const getPrice = (plan: any) => plan.monthlyPrice

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

      // Calcular data de término do plano (30 dias)
      const dataTermino = calcularDataTermino(30);
      setDataTerminoPlano(dataTermino);

      setPaymentMessage("Redirecionando para o Mercado Pago. Aguarde...");
      const response = await fetch(`${BACKEND_URL}/api/create-preference`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          planName: plan.name,
          price: getPrice(plan),
          email: userEmail,
          dataTermino: dataTermino // Enviar data de término para o backend
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
    <div className="plano-container">
      {/* Header */}
      <header className="plano-header">
        <button className="back-button">
          <ArrowLeft size={20} />
        </button>
        <h1>Plano e Pagamento</h1>
      </header>

      {/* Plans Section */}
      <section className="plans-section">
        <div className="plans-header">
          <h2>Conheça nossos planos e preços</h2>
          <p>Escolha o plano ideal para o seu negócio e comece a transformar sua gestão hoje mesmo!</p>

          {/* Billing Toggle removido: só mensal */}
        </div>

        {/* Benefits List */}
        <div className="benefits-list">
          {benefits.map((benefit, index) => (
            <div key={index} className="benefit-item">
              <Check className="benefit-icon" />
              <span>{benefit}</span>
            </div>
          ))}
        </div>

        {/* Plans Grid */}
        <div className="plans-grid-two" style={{ overflowX: 'auto', paddingBottom: 16 }}>
          <Stack direction={{ base: "column", md: "row" }} spacing={8} width="100%" wrap="wrap">
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
                  flex="1 1 400px"
                  minW={{ base: "100%", md: 340 }}
                  maxW={400}
                  w={{ base: "100%", md: "100%" }}
                  position="relative"
                  transition="all 0.2s"
                  _hover={{ boxShadow: "lg", borderColor: "green.600" }}
                  mb={{ base: 6, md: 0 }}
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
            
            {plans.map((plan) => (
              <Box
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                borderStyle={selectedPlan === plan.id ? "solid" : "dashed"}
                borderWidth={selectedPlan === plan.id ? 3 : 2}
                borderColor={selectedPlan === plan.id ? (plan.id === "individual" ? "purple.500" : "blue.500") : plan.popular ? "blue.400" : "gray.200"}
                borderRadius="xl"
                boxShadow={plan.popular ? "0 0 0 3px #2563eb33" : "sm"}
                bg={plan.id === "individual" ? useColorModeValue("purple.50", "purple.900") : useColorModeValue("white", "gray.800")}
                p={6}
                flex="1 1 400px"
                minW={{ base: "100%", md: 340 }}
                maxW={400}
                w={{ base: "100%", md: "100%" }}
                position="relative"
                transition="all 0.2s"
                _hover={{ boxShadow: "lg", borderColor: plan.popular ? "blue.500" : "purple.400" }}
                cursor="pointer"
                mb={{ base: 6, md: 0 }}
              >
                {plan.popular && (
                  <Badge colorScheme="blue" position="absolute" top={4} right={4} px={3} py={1} borderRadius="md" fontWeight={700} fontSize="sm">
                    <Icon as={Star} mr={1} /> Mais Popular
                  </Badge>
                )}
                {plan.id === "individual" && (
                  <Badge colorScheme="purple" position="absolute" top={4} right={4} px={3} py={1} borderRadius="md" fontWeight={700} fontSize="sm">
                    Individual
                  </Badge>
                )}
                <VStack spacing={3} align="start">
                  <HStack spacing={2} align="center">
                    <Box bg={plan.id === "individual" ? "purple.400" : "blue.400"} borderRadius="full" p={2} display="flex" alignItems="center">
                      <Icon as={plan.icon} color="white" boxSize={6} />
                    </Box>
                    <Text fontWeight={700} fontSize="2xl" color={plan.id === "individual" ? "purple.700" : "blue.700"}>{plan.name}</Text>
                  </HStack>
                  <Text color="gray.600" fontSize="md">{plan.description}</Text>
                  <Box mt={2} mb={2}>
                    <Text fontSize="3xl" fontWeight={800} color={plan.id === "individual" ? "purple.700" : "blue.700"}>
                      R$ {getPrice(plan).toFixed(2).replace(".", ",")}
                      <Text as="span" fontSize="lg" color="gray.500" fontWeight={400}>/mês</Text>
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
                        <Icon as={Check} color={plan.id === "individual" ? "purple.500" : "blue.500"} boxSize={4} />
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
                    colorScheme={plan.id === "individual" ? "purple" : "blue"}
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
            ))}
          </Stack>
        </div>
      </section>

      {/* Payment Methods */}
      <section className="payment-section">
        <h3>Métodos de pagamento aceitos</h3>
        <div className="payment-methods">
          <div className="payment-method">
            <CreditCard size={24} />
            <span>Cartão de Crédito</span>
          </div>
          <div className="payment-method">
            <Smartphone size={24} />
            <span>PIX</span>
          </div>
        </div>
      </section>

      {/* Support */}
      <section className="support-section">
        <div className="support-content">
          <HeadphonesIcon size={32} />
          <h3>Precisa de ajuda para escolher?</h3>
          <p>Nossa equipe está pronta para te ajudar a encontrar o plano ideal para o seu negócio.</p>
          <button className="support-button" onClick={handleWhatsAppClick}>
            Falar com Especialista
          </button>
        </div>
      </section>
    </div>
  )
}
