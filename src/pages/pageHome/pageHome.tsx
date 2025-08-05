"use client"

import { useState, useEffect } from "react"
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
  Shield,
  Zap,
  Award,
} from "lucide-react"
import { Box, Flex, HStack, IconButton, Button, useDisclosure, Stack, Drawer, DrawerOverlay, DrawerContent, DrawerCloseButton, DrawerHeader, DrawerBody } from "@chakra-ui/react"
import { HamburgerIcon } from "@chakra-ui/icons"

export default function PageHome() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [contadorClientes, setContadorClientes] = useState(0)
  const [contadorProfissionais, setContadorProfissionais] = useState(0)
  const [contadorAgendamentos, setContadorAgendamentos] = useState(0)

  const navigate = useNavigate()

  useEffect(() => {
    // Animação dos contadores
    const animateCounter = (setter: any, target: number, duration: number) => {
      let start = 0
      const increment = target / (duration / 16)
      const timer = setInterval(() => {
        start += increment
        if (start >= target) {
          setter(target)
          clearInterval(timer)
        } else {
          setter(Math.floor(start))
        }
      }, 16)
    }

    // Inicia a animação dos contadores
    animateCounter(setContadorClientes, 500, 2000)
    animateCounter(setContadorProfissionais, 50, 1500)
    animateCounter(setContadorAgendamentos, 1000, 2500)
  }, [])

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
            <div className="badge-novo">
              <Star size={16} />
              <span>Sistema Completo de Gestão</span>
            </div>
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
            <div className="hero-stats">
              <div className="stat">
                <span className="stat-number">{contadorClientes}+</span>
                <span className="stat-label">Clientes Satisfeitos</span>
              </div>
              <div className="stat">
                <span className="stat-number">{contadorProfissionais}+</span>
                <span className="stat-label">Profissionais</span>
              </div>
              <div className="stat">
                <span className="stat-number">{contadorAgendamentos}+</span>
                <span className="stat-label">Agendamentos</span>
              </div>
            </div>
            <div className="social-proof">
              <div className="avatars-group">
                <div className="avatar">CS</div>
                <div className="avatar">AM</div>
                <div className="avatar">RL</div>
                <div className="avatar">+</div>
              </div>
              <div className="proof-text">
                <div className="stars">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="star-filled" />
                  ))}
                </div>
                <span>Avaliação 5.0 de nossos clientes</span>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-image">
              <img src={barberImage} alt="Profissional trabalhando" />
            </div>
          </div>
        </div>
      </section>

      {/* Seção de Dispositivos */}
      <section className="dispositivos-section section" id="solucoes">
        <div className="container">
          <div className="dispositivos-container">
            <div className="dispositivos-content">
              <div className="section-badge">
                <Shield size={16} />
                <span>Sistema Seguro e Confiável</span>
              </div>
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
            <div className="section-badge">
              <Award size={16} />
              <span>Funcionalidades Premium</span>
            </div>
            <h2>Tudo que seu estabelecimento precisa em um só lugar</h2>
            <p>Ferramentas completas para otimizar sua gestão e aumentar seus lucros</p>
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
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="depoimentos-section section" id="depoimentos">
        <div className="container">
          <div className="section-header">
            <div className="section-badge">
              <Star size={16} />
              <span>Depoimentos Reais</span>
            </div>
            <h2>O que nossos clientes dizem</h2>
            <p>Experiências reais de quem já transformou seu negócio com o CliqAgenda</p>
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

      {/* Footer */}
      <footer className="home-footer" id="contato">
        <div className="footer-content">
          <div className="footer-section">
            <div className="logo">
              <img src={logoTrezu} alt="Trezu Logo" className="logo-image" />
            </div>
            <p>O sistema completo para gestão de barbearias e salões de beleza</p>
            {/* <div className="footer-social">
              <div className="social-link">IG</div>
            </div> */}
          </div>
          <div className="footer-section">
            <h4>Contato</h4>
            <div className="contato-item">
              <Phone size={16} />
              <span>(21) 98241-0516</span>
            </div>
            <div className="contato-item">
              <Mail size={16} />
              <span>contato.trezu@gmail.com</span>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 Trezu. Todos os direitos reservados.</p>
          <div className="footer-links">
            <a href="#privacidade">Privacidade</a>
            <a href="#termos">Termos</a>
            <a href="#cookies">Cookies</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
