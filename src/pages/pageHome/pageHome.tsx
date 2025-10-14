"use client"

import { } from "react"
import { useNavigate } from "react-router-dom"
import "./pageHome.css"
import barberImage from "../../assets/barber.jpg"
import logoTrezu from "../../assets/LOGOTIPO-TREZU-BLUE.png"
import {
  Calendar,
  Star,
  Phone,
  Mail,
  Check,
  Users,
  TrendingUp,
  Clock,
  ArrowRight,
  Zap,
  Award,
  MessageCircle,
} from "lucide-react"
import { Box, Flex, HStack, IconButton, Button, useDisclosure, Stack, Drawer, DrawerOverlay, DrawerContent, DrawerCloseButton, DrawerHeader, DrawerBody, Container, SimpleGrid, VStack, Text, Divider, Link as ChakraLink, Image } from "@chakra-ui/react"
import { HamburgerIcon } from "@chakra-ui/icons"

export default function PageHome() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  // Contadores removidos (sem uso)

  const navigate = useNavigate()

  // Removido: animação e contadores não utilizados

  const depoimentos = [
    {
      nome: "Carlos Silva",
      cargo: "Proprietário -  Moderna",
      comentario:
        "Revolucionou minha barbearia! Agora tenho controle total dos agendamentos e meus clientes adoram a praticidade.",
      avatar: "CS",
      rating: 5,
    },
    {
      nome: "Ana Costa",
      cargo: "Manicure Profissional",
      comentario: "O sistema é muito intuitivo. Consegui organizar minha agenda e aumentar meu faturamento em 40%.",
      avatar: "AC",
      rating: 5,
    },
    {
      nome: "Roberto Lima",
      cargo: "Salão Premium",
      comentario: "Excelente suporte e funcionalidades incríveis. Recomendo para todos os profissionais da área.",
      avatar: "RL",
      rating: 5,
    },
  ]

  function navegarLogin(){
    navigate('/login')
  }

  function iniciarCadastro() {
    navigate('/cadastro')
  }

  function irCadastroTeste() {
    navigate('/cadastro')
  }

  // Dados dos planos (sem avaliação grátis)
  const planos = [
    {
      id: "bronze",
      name: "Bronze",
      description: "Para profissionais autônomos ou pequenos negócios",
      monthlyPrice: 59.90,
      color: "purple",
      icon: Award
    },
    {
      id: "prata",
      name: "Prata",
      description: "Para estabelecimentos em crescimento",
      monthlyPrice: 89.90,
      color: "blue",
      icon: Award
    },
    {
      id: "ouro",
      name: "Ouro",
      description: "Perfeito para empresas em expansão",
      monthlyPrice: 139.90,
      color: "blue",
      icon: Award
    },
    {
      id: "diamante",
      name: "Diamante",
      description: "Máximo em desempenho e exclusividade",
      monthlyPrice: 189.90,
      color: "blue",
      icon: Award
    }
  ]

  function selecionarPlano() {
    // Sem compra fora da plataforma — apenas direciona para cadastro
    navigate('/cadastro')
  }

  return (
    <div className="page-home">
      {/* Header Chakra UI */}
      <Box as="header" bg="white" boxShadow="sm" position="sticky" top={0} zIndex={100} w="100%">
        <Flex maxW="1200px" mx="auto" px={4} h="70px" align="center" justify="space-between">
          {/* Logo */}
          <HStack spacing={3}>
            <img src={logoTrezu} alt="Trezu Logo" className="logo-image" />
          </HStack>

          {/* Menu Desktop */}
          <HStack as="nav" spacing={8} display={{ base: "none", md: "flex" }}>
            <Button variant="ghost" fontWeight={500} color="#374151" _hover={{ color: "#5d3fd3" }} as="a" href="#inicio">Início</Button>
            <Button variant="ghost" fontWeight={500} color="#374151" _hover={{ color: "#5d3fd3" }} as="a" href="#solucoes">Soluções</Button>
            <Button variant="ghost" fontWeight={500} color="#374151" _hover={{ color: "#5d3fd3" }} as="a" href="#planos">Planos</Button>
            <Button variant="ghost" fontWeight={500} color="#374151" _hover={{ color: "#5d3fd3" }} as="a" href="#funcionalidades">Funcionalidades</Button>
            <Button variant="ghost" fontWeight={500} color="#374151" _hover={{ color: "#5d3fd3" }} as="a" href="#depoimentos">Depoimentos</Button>
            <Button variant="ghost" fontWeight={500} color="#374151" _hover={{ color: "#5d3fd3" }} as="a" href="#contato">Contato</Button>
          </HStack>

          {/* Ações e Menu Mobile */}
          <HStack spacing={3}>
            <Button
              colorScheme="purple"
              bgGradient="linear(to-r, #5d3fd3, #4c32b3)"
              color="white"
              fontWeight={700}
              px={6}
              py={2}
              borderRadius="md"
              boxShadow="md"
              display={{ base: "none", md: "inline-flex" }}
              onClick={irCadastroTeste}
            >
              TESTE GRÁTIS
            </Button>
            <Button
              variant="outline"
              colorScheme="purple"
              fontWeight={700}
              px={6}
              py={2}
              borderRadius="md"
              borderWidth={2}
              borderColor="#5d3fd3"
              color="#5d3fd3"
              _hover={{ bg: "#5d3fd3", color: "white" }}
              display={{ base: "none", md: "inline-flex" }}
              onClick={navegarLogin}
            >
              JÁ SOU CLIENTE
            </Button>
            {/* Botão menu mobile */}
            <IconButton
              aria-label="Abrir menu"
              icon={<HamburgerIcon />}
              display={{ base: "inline-flex", md: "none" }}
              onClick={onOpen}
              variant="ghost"
              fontSize="2xl"
            />
          </HStack>
        </Flex>
        {/* Drawer Mobile */}
        <Drawer placement="top" onClose={onClose} isOpen={isOpen} size="full">
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader borderBottomWidth="1px">Menu</DrawerHeader>
            <DrawerBody>
              <Stack spacing={6} mt={8} align="center">
                <Button w="100%" variant="ghost" fontWeight={500} color="#374151" _hover={{ color: "#5d3fd3" }} as="a" href="#inicio" onClick={onClose}>Início</Button>
                <Button w="100%" variant="ghost" fontWeight={500} color="#374151" _hover={{ color: "#5d3fd3" }} as="a" href="#solucoes" onClick={onClose}>Soluções</Button>
                <Button w="100%" variant="ghost" fontWeight={500} color="#374151" _hover={{ color: "#5d3fd3" }} as="a" href="#funcionalidades" onClick={onClose}>Funcionalidades</Button>
                <Button w="100%" variant="ghost" fontWeight={500} color="#374151" _hover={{ color: "#5d3fd3" }} as="a" href="#depoimentos" onClick={onClose}>Depoimentos</Button>
                <Button w="100%" variant="ghost" fontWeight={500} color="#374151" _hover={{ color: "#5d3fd3" }} as="a" href="#contato" onClick={onClose}>Contato</Button>
                <Button w="100%" colorScheme="purple" bgGradient="linear(to-r, #5d3fd3, #4c32b3)" color="white" fontWeight={700} px={6} py={2} borderRadius="md" boxShadow="md" onClick={()=>{onClose(); irCadastroTeste();}}>TESTE GRÁTIS</Button>
                <Button w="100%" variant="outline" colorScheme="purple" fontWeight={700} px={6} py={2} borderRadius="md" borderWidth={2} borderColor="#5d3fd3" color="#5d3fd3" _hover={{ bg: "#5d3fd3", color: "white" }} onClick={()=>{onClose(); navegarLogin();}}>JÁ SOU CLIENTE</Button>
              </Stack>
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </Box>
      {/* Hero Section */}
      <section className="hero-section section" id="inicio">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Escolha um sistema
              <span className="destaque-laranja"> completo </span>
              para a gestão do seu
              <span className="destaque-roxo"> estabelecimento</span>
            </h1>
            <p className="hero-description">
              Agilidade no fechamento de caixa e otimização na sua gestão para lucrar mais no seu estabelecimento com controle
              fácil de agendamentos, recursos para fidelização de clientes e muito mais.
            </p>
            <div className="hero-buttons">
              <button onClick={irCadastroTeste} className="btn-teste-hero">
                <Calendar size={20} />
                TESTE GRÁTIS POR 7 DIAS
                <ArrowRight size={16} />
              </button>
            </div>
            
            <div className="social-proof">
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-image">
              <img src={barberImage} alt="Profissional trabalhando" />
            </div>
          </div>
        </div>
      </section>

      {/* Planos */}
      <section className="section" id="planos">
        <div className="container">
          <div className="section-header">
            <h2>Escolha um plano para começar</h2>
          </div>
          <div className="funcionalidades-grid">
            {planos.map((plano) => (
              <div
                key={plano.id}
                className="funcionalidade-card"
                style={{ cursor: 'pointer', border: '1px solid #e5e7eb' }}
                onClick={selecionarPlano}
              >
                <div className="funcionalidade-icon">
                  <plano.icon />
                </div>
                <h3>{plano.name}</h3>
                <p>{plano.description}</p>
                <div style={{ marginTop: 12, fontWeight: 800, color: '#111827' }}>
                  R$ {plano.monthlyPrice.toFixed(2).replace('.', ',')}/mês
                </div>
                <div style={{ marginTop: 16 }}>
                  <Button colorScheme={plano.color === 'purple' ? 'purple' : 'blue'} onClick={selecionarPlano}>
                    Selecionar Plano
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Seção de Dispositivos */}
      <section className="dispositivos-section section" id="solucoes">
        <div className="container">
          <div className="dispositivos-container">
            <div className="dispositivos-content">
              <h2>
                Dê adeus à comanda de papel no seu
                <span className="destaque-roxo"> estabelecimento</span>
              </h2>
              <p>
                Dividir o foco entre atender os clientes e gerenciar o negócio não é fácil. Com o Trezu, você tem
                um software de gestão para o seu estabelecimento que otimiza os seus processos, desde o agendamento até o pagamento
                de comissões, deixando você livre para se concentrar no que faz de melhor: criar cortes incríveis e
                fidelizar seus clientes.
              </p>
              <div className="beneficios-lista">
                <div className="beneficio">
                  <div className="beneficio-icon">
                    <Check className="check-icon" />
                  </div>
                  <div className="beneficio-content">
                    <span className="beneficio-title">Agendamento online 24/7</span>
                    <span className="beneficio-description">Seus clientes podem agendar a qualquer hora</span>
                  </div>
                </div>
                <div className="beneficio">
                  <div className="beneficio-icon">
                    <Check className="check-icon" />
                  </div>
                  <div className="beneficio-content">
                    <span className="beneficio-title">Controle financeiro completo</span>
                    <span className="beneficio-description">Relatórios detalhados e gestão de comissões</span>
                  </div>
                </div>
                <div className="beneficio">
                  <div className="beneficio-icon">
                    <Check className="check-icon" />
                  </div>
                  <div className="beneficio-content">
                    <span className="beneficio-title">Gestão de comissões automática</span>
                    <span className="beneficio-description">
                      Calcule automaticamente as comissões dos profissionais
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={irCadastroTeste} className="btn-saiba-mais">
                Saiba Mais
                <ArrowRight size={16} />
              </button>
            </div>
            <div className="dispositivos-visual">
              <div className="dispositivos-mockup">
                <div className="mockup-header">
                  <div className="mockup-title">Dashboard</div>
                  <div className="mockup-date">Hoje, {new Date().toLocaleDateString('pt-BR')}</div>
                </div>
                <div className="mockup-card">
                  <div className="mockup-card-header">
                    <div className="mockup-card-title">Agendamentos Hoje</div>
                    <div className="mockup-card-trend">
                      <TrendingUp size={14} />
                      +12%
                    </div>
                  </div>
                  <div className="mockup-card-value">24</div>
                </div>
                <div className="mockup-card">
                  <div className="mockup-card-header">
                    <div className="mockup-card-title">Faturamento</div>
                    <div className="mockup-card-trend negative">
                      <TrendingUp size={14} />
                      -3%
                    </div>
                  </div>
                  <div className="mockup-card-value">R$ 2.450</div>
                </div>
                <div className="mockup-chart">
                  <div className="chart-bar"></div>
                  <div className="chart-bar"></div>
                  <div className="chart-bar"></div>
                  <div className="chart-bar"></div>
                  <div className="chart-bar"></div>
                  <div className="chart-bar"></div>
                  <div className="chart-bar"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Funcionalidades */}
      <section className="funcionalidades-section section" id="funcionalidades">
        <div className="container">
          <div className="section-header">
            <h2>Tudo que seu estabelecimento precisa em um só lugar</h2>
          </div>
          <div className="funcionalidades-grid">
            <div className="funcionalidade-card featured">
              <div className="card-badge">Mais Popular</div>
              <div className="funcionalidade-icon">
                <Calendar />
              </div>
              <h3>Agendamento Online</h3>
              <p>
                Seus clientes podem agendar 24 horas por dia através do app ou site, reduzindo cancelamentos e no-shows.
              </p>
              {/* <div className="card-features">
                <div className="feature-item">
                  <Check size={14} />
                  <span>Confirmação automática</span>
                </div>
                <div className="feature-item">
                  <Check size={14} />
                  <span>Lembretes automáticos</span>
                </div>
              </div> */}
            </div>
            <div className="funcionalidade-card">
              <div className="funcionalidade-icon">
                <TrendingUp />
              </div>
              <h3>Relatórios Financeiros</h3>
              <p>Acompanhe faturamento, comissões e despesas com relatórios detalhados e gráficos intuitivos.</p>
              {/* <div className="card-features">
                <div className="feature-item">
                  <Check size={14} />
                  <span>Dashboard em tempo real</span>
                </div>
                <div className="feature-item">
                  <Check size={14} />
                  <span>Exportação para Excel</span>
                </div>
              </div> */}
            </div>
            <div className="funcionalidade-card">
              <div className="funcionalidade-icon">
                <Users />
              </div>
              <h3>Gestão de Clientes</h3>
              <p>Histórico completo de serviços, preferências e programa de fidelidade para aumentar o retorno.</p>
              {/* <div className="card-features">
                <div className="feature-item">
                  <Check size={14} />
                  <span>Histórico completo</span>
                </div>
                <div className="feature-item">
                  <Check size={14} />
                  <span>Programa de pontos</span>
                </div>
              </div> */}
            </div>
            
            <div className="funcionalidade-card">
              <div className="funcionalidade-icon">
                <Clock />
              </div>
              <h3>Controle de Horários</h3>
              <p>Defina horários de funcionamento, pausas e disponibilidade de cada profissional.</p>
              {/* <div className="card-features">
                <div className="feature-item">
                  <Check size={14} />
                  <span>Agenda personalizada</span>
                </div>
                <div className="feature-item">
                  <Check size={14} />
                  <span>Bloqueio de horários</span>
                </div>
              </div> */}
            </div>
            <div className="funcionalidade-card">
              <div className="funcionalidade-icon">
                <Star />
              </div>
              <h3>Avaliações</h3>
              <p>Sistema de avaliações e feedback para melhorar continuamente a qualidade dos serviços.</p>
              {/* <div className="card-features">
                <div className="feature-item">
                  <Check size={14} />
                  <span>Avaliações automáticas</span>
                </div>
                <div className="feature-item">
                  <Check size={14} />
                  <span>Análise de satisfação</span>
                </div>
              </div> */}
            </div>

            <div className="funcionalidade-card">
              <div className="funcionalidade-icon">
                <MessageCircle />
              </div>
              <h3>Whatsapp Integrado</h3>
              <p>Envie mensagens para seus clientes dentro da plataforma.</p>
              {/* <div className="card-features">
                <div className="feature-item">
                  <Check size={14} />
                  <span>Avaliações automáticas</span>
                </div>
                <div className="feature-item">
                  <Check size={14} />
                  <span>Análise de satisfação</span>
                </div>
              </div> */}
            </div>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="depoimentos-section section" id="depoimentos">
        <div className="container">
          <div className="section-header">
            <h2>O que nossos clientes dizem</h2>
          </div>
          <div className="depoimentos-grid">
            {depoimentos.map((depoimento, index) => (
              <div key={index} className="depoimento-card">
                <div className="depoimento-header">
                  <div className="depoimento-avatar">{depoimento.avatar}</div>
                  <div className="depoimento-info">
                    <div className="depoimento-nome">{depoimento.nome}</div>
                    <div className="depoimento-cargo">{depoimento.cargo}</div>
                  </div>
                  <div className="depoimento-rating">
                    {[...Array(depoimento.rating)].map((_, i) => (
                      <Star key={i} className="estrela-filled" />
                    ))}
                  </div>
                </div>
                <p className="depoimento-texto">"{depoimento.comentario}"</p>
                <div className="depoimento-footer">
                  <Check className="verified-icon" />
                  <span>Cliente Verificado</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section section">
        <div className="container">
          <div className="cta-content">
            <div className="cta-badge">
              <Zap size={16} />
              <span>Oferta Limitada</span>
            </div>
            <h2>Pronto para revolucionar seu estabelecimento?</h2>
            <p>
              Junte-se a centenas de profissionais que já transformaram seus negócios com o CliqAgenda. Comece hoje
              mesmo e veja a diferença!
            </p>
            <div className="cta-buttons">
              <button onClick={iniciarCadastro} className="btn-cta-primary">
                <Calendar size={20} />
                COMEÇAR TESTE GRÁTIS
                <ArrowRight size={16} />
              </button>
              {/* <button className="btn-cta-secondary">
                <Play size={20} />
                Ver Demonstração
              </button> */}
            </div>
            <div className="garantias">
              <div className="garantia">
                <Check className="garantia-icon" />
                <span>7 dias grátis</span>
              </div>
              <div className="garantia">
                <Check className="garantia-icon" />
                <span>Sem compromisso</span>
              </div>
              <div className="garantia">
                <Check className="garantia-icon" />
                <span>Cancele quando quiser</span>
              </div>
            </div>
            <div className="urgencia">
              <Clock size={16} />
              <span>Mais de 100 profissionais se cadastraram esta semana!</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer (Chakra UI) */}
      <Box as="footer" id="contato" bg="gray.900" color="gray.200" mt={16} pt={{ base: 10, md: 14 }} pb={{ base: 8, md: 10 }} borderTopWidth="1px" borderColor="gray.800">
        <Container maxW="1200px" px={{ base: 4, md: 6 }}>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={{ base: 8, md: 10 }} alignItems="flex-start">
            {/* Brand */}
            <VStack align="start" spacing={4}>
              <Image src={logoTrezu} alt="Trezu" h={{ base: 10, md: 12, lg: 14 }} maxW={{ base: '160px', md: '200px', lg: '220px' }} objectFit="contain" />
              <Text color="gray.400" maxW="md">
                O sistema completo para gestão de barbearias e salões de beleza
              </Text>
            </VStack>

            {/* Contact */}
            <VStack align="start" spacing={3}>
              <Text fontWeight={700} color="white">Contato</Text>
              <HStack spacing={3} color="gray.300">
                <Phone size={16} />
                <Text>(21) 98241-0516</Text>
              </HStack>
              <HStack spacing={3} color="gray.300">
                <Mail size={16} />
                <Text>contato.trezu@gmail.com</Text>
              </HStack>
            </VStack>

            {/* Links */}
            <VStack align="start" spacing={3}>
              <Text fontWeight={700} color="white">Legal</Text>
              <ChakraLink href="#privacidade" color="gray.300" _hover={{ color: 'white' }}>Privacidade</ChakraLink>
              <ChakraLink href="#termos" color="gray.300" _hover={{ color: 'white' }}>Termos</ChakraLink>
              <ChakraLink href="#cookies" color="gray.300" _hover={{ color: 'white' }}>Cookies</ChakraLink>
            </VStack>
          </SimpleGrid>

          <Divider my={{ base: 8, md: 10 }} borderColor="gray.800" />

          <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align="center" gap={3}>
            <Text fontSize="sm" color="gray.400">&copy; 2025 Trezu. Todos os direitos reservados.</Text>
            <HStack spacing={6} color="gray.400" fontSize="sm">
              <ChakraLink href="#privacidade" _hover={{ color: 'white' }}>Privacidade</ChakraLink>
              <ChakraLink href="#termos" _hover={{ color: 'white' }}>Termos</ChakraLink>
              <ChakraLink href="#cookies" _hover={{ color: 'white' }}>Cookies</ChakraLink>
            </HStack>
          </Flex>
        </Container>
      </Box>
    </div>
  )
}
