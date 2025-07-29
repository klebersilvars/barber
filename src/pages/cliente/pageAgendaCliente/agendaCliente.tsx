"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "react-router-dom"
import {
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  Star,
  Phone,
  Check,
  Scissors,
  CreditCard,
  Smartphone,
  Heart,
  Shield,
  ArrowRight,
  ArrowLeft,
  MessageCircle,
  User,
  Building2,
} from "lucide-react"
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  Badge,
  Flex,
  Container,
  Heading,
  SimpleGrid,
  Icon,
  Textarea,
} from "@chakra-ui/react"
import "./agendaCliente.css"
import { firestore } from "../../../firebase/firebase"
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore"
import PageErro from '../../pageErro/pageErro'

const AgendaCliente = () => {
  const { slug } = useParams()
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedService, setSelectedService] = useState<any>(null)
  const [selectedProfessional, setSelectedProfessional] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [clientData, setClientData] = useState({
    name: "",
    phone: "",
    email: "",
    paymentMethod: "",
    notes: "",
  })

  // Estados para dados do estabelecimento
  const [establishment, setEstablishment] = useState<any>(null)
  const [services, setServices] = useState<any[]>([])
  const [professionals, setProfessionals] = useState<any[]>([])
  const [error, setError] = useState("")
  const [showLoading, setShowLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [busyTimes, setBusyTimes] = useState<string[]>([])
  const [primaryColor, setPrimaryColor] = useState("#5d3fd3") // Cor padrão

  const hasOpenedWhatsApp = useRef(false)

  // Função para ajustar o brilho da cor
  const adjustBrightness = (hex: string, percent: number) => {
    const num = parseInt(hex.replace("#", ""), 16)
    const amt = Math.round(2.55 * percent)
    const R = (num >> 16) + amt
    const G = (num >> 8 & 0x00FF) + amt
    const B = (num & 0x0000FF) + amt
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1)
  }

  // Buscar dados do estabelecimento pelo slug
  useEffect(() => {
    const fetchEstablishmentData = async () => {
      if (!slug) return

      try {
        setShowLoading(true)
        
        // Delay de 1 segundo para melhor experiência
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Buscar estabelecimento na coleção 'contas' pelo slug
        const contasRef = collection(firestore, "contas")
        const q = query(contasRef, where("slug", "==", slug))
        const querySnapshot = await getDocs(q)
        
        if (querySnapshot.empty) {
          setError("Estabelecimento não encontrado")
          setShowLoading(false)
          return
        }

        const establishmentDoc = querySnapshot.docs[0]
        const establishmentData = establishmentDoc.data()
        
        // Buscar a cor principal do estabelecimento
        let establishmentPrimaryColor = "#5d3fd3" // Cor padrão
        if (establishmentData.aparenciaAgendamento && establishmentData.aparenciaAgendamento.corPrincipal) {
          establishmentPrimaryColor = establishmentData.aparenciaAgendamento.corPrincipal
        }
        setPrimaryColor(establishmentPrimaryColor)
        
        // Buscar serviços do estabelecimento
        const servicosRef = collection(firestore, "servicosAdmin")
        const servicosQuery = query(servicosRef, where("nomeEstabelecimento", "==", establishmentData.nomeEstabelecimento))
        const servicosSnapshot = await getDocs(servicosQuery)
        const servicosData = servicosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

        // Buscar profissionais do estabelecimento
        const colaboradoresRef = collection(firestore, "colaboradores")
        const colaboradoresQuery = query(colaboradoresRef, where("estabelecimento", "==", establishmentData.nomeEstabelecimento))
        const colaboradoresSnapshot = await getDocs(colaboradoresQuery)
        const colaboradoresData = colaboradoresSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

        setEstablishment({
          id: establishmentDoc.id,
          ...establishmentData
        })
        setServices(servicosData)
        setProfessionals(colaboradoresData)
        setShowLoading(false)

      } catch (error) {
        console.error("Erro ao buscar dados do estabelecimento:", error)
        setError("Erro ao carregar dados do estabelecimento")
        setShowLoading(false)
      }
    }

    fetchEstablishmentData()
  }, [slug])

  // Buscar horários ocupados sempre que selectedDate, establishment ou selectedService mudar
  useEffect(() => {
    const fetchBusyTimes = async () => {
      setBusyTimes([])
      if (!selectedDate || !establishment?.nomeEstabelecimento) return
      try {
        const agendaRef = collection(firestore, 'agendaAdmin')
        const q = query(
          agendaRef,
          where('nomeEstabelecimento', '==', establishment.nomeEstabelecimento),
          where('date', '==', selectedDate)
        )
        const snapshot = await getDocs(q)
        const times = snapshot.docs.map(doc => doc.data().time)
        setBusyTimes(times)
      } catch (err) {
        setBusyTimes([])
      }
    }
    fetchBusyTimes()
  }, [selectedDate, establishment])

  // Horários disponíveis
  const availableTimes = [
    "08:00",
    "08:30",
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
    "17:30",
    "18:00",
  ]

  // Métodos de pagamento
  const paymentMethods = [
    { id: "money", name: "Dinheiro", icon: DollarSign },
    { id: "pix", name: "PIX", icon: Smartphone },
    { id: "card", name: "Cartão", icon: CreditCard },
    { id: "later", name: "Pagar no local", icon: Clock },
  ]

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const handleNextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleServiceSelect = (service: any) => {
    setSelectedService(service)
  }

  const handleProfessionalSelect = (professional: any) => {
    setSelectedProfessional(professional)
  }

  const handleSubmit = async () => {
    if (submitting) return // Evita múltiplos cliques
    
    try {
      setSubmitting(true)
      
      // Preparar dados do agendamento seguindo o padrão mostrado
      const appointmentData = {
        // Dados do estabelecimento (mantém como está)
        nomeEstabelecimento: establishment.nomeEstabelecimento,
        
        // Dados do serviço (campos em inglês)
        service: selectedService.nomeServico,
        categoriaServico: selectedService.categoriaServico || '',
        duration: selectedService.duracaoServico || 0,
        price: selectedService.valorServico || 0,
        servicoAtivo: selectedService.servicoAtivo || true,
        profissionaisServico: selectedService.profissionaisServico || [],
        
        // Dados do profissional (campo em inglês)
        professional: selectedProfessional.nome || '',
        
        // Data e horário (campos em inglês)
        date: selectedDate,
        time: selectedTime,
        
        // Dados do cliente (campos em inglês)
        clientName: clientData.name,
        clientPhone: clientData.phone.replace(/\D/g, ''), // Remove caracteres não numéricos
        clientEmail: clientData.email || '',
        clientId: '', // Será preenchido pelo sistema se necessário
        
        // Forma de pagamento e observações (campos em inglês)
        paymentMethod: clientData.paymentMethod || '',
        notes: clientData.notes || '',
        
        // Status e configurações
        reminderEnabled: true,
        
        // Dados do proprietário (se disponíveis no serviço)
        emailProprietario: selectedService.emailProprietario || '',
        uidProprietario: selectedService.uidProprietario || '',
        
        // Array responsável (se necessário)
        responsavel: [],
        
        // Timestamp
        createdAt: serverTimestamp()
      }

      // Salvar na coleção agendaAdmin
      const agendaRef = collection(firestore, "agendaAdmin")
      await addDoc(agendaRef, appointmentData)
      
      // Ir para tela de sucesso
      setCurrentStep(6)
      
    } catch (error) {
      console.error("Erro ao salvar agendamento:", error)
      alert("Erro ao confirmar agendamento. Tente novamente.")
    } finally {
      setSubmitting(false)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedService !== null
      case 2:
        return selectedProfessional !== null
      case 3:
        return selectedDate !== "" && selectedTime !== ""
      case 4:
        return clientData.name !== "" && clientData.phone !== ""
      default:
        return true
    }
  }

  // Filtrar profissionais que fazem o serviço selecionado
  const availableProfessionals = (() => {
    if (selectedService && Array.isArray(selectedService.profissionaisServico)) {
      const filtered = professionals.filter((prof) => selectedService.profissionaisServico.includes(prof.nome))
      // Se o admin/proprietário está no array de profissionais do serviço, adicionar como opção
      if (
        establishment &&
        selectedService.profissionaisServico.includes(establishment.nomeEstabelecimento)
      ) {
        filtered.unshift({ // Adicionar no início do array
          id: 'admin',
          nome: establishment.nomeEstabelecimento,
          cargo: 'Administrador',
          photo: establishment.logo || '', // Usar logo do estabelecimento como foto
          experiencia: '',
          descricao: 'Administrador do salão',
        })
      }
      return filtered
    }
    return professionals // Se não há serviço selecionado ou não há profissionais específicos, mostrar todos
  })()

  // Função para montar mensagem de confirmação
  const getConfirmationMessage = () => {
    let msg = `Olá!\n`;
    msg += `Quero confirmar meu agendamento, por favor.\n`;
    msg += `--- Dados do Agendamento ---\n`;
    msg += `Estabelecimento: ${establishment?.nomeEstabelecimento || ''}\n`;
    msg += `Serviço: ${selectedService?.nomeServico || ''}\n`;
    msg += `Profissional: ${selectedProfessional?.nome || ''}\n`;
    msg += `Data: ${selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR') : ''}\n`;
    msg += `Horário: ${selectedTime || ''}\n`;
    msg += `Cliente: ${clientData.name}\n`;
    msg += `WhatsApp: ${clientData.phone}\n`;
    if (clientData.email) msg += `E-mail: ${clientData.email}\n`;
    if (clientData.paymentMethod) msg += `Pagamento: ${paymentMethods.find((p) => p.id === clientData.paymentMethod)?.name}\n`;
    if (clientData.notes) msg += `Observações: ${clientData.notes}\n`;
    msg += `--------------------------`;
    return msg;
  }

  // Efeito para abrir WhatsApp automaticamente ao finalizar
  useEffect(() => {
    if (currentStep === 6 && establishment?.telefone && !hasOpenedWhatsApp.current) {
      hasOpenedWhatsApp.current = true;
      // Remove caracteres não numéricos
      const phone = establishment.telefone.replace(/\D/g, '');
      // Adiciona código do país se necessário
      const phoneWithCountry = phone.length === 11 ? `55${phone}` : phone;
      const message = getConfirmationMessage();
      const whatsappUrl = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  }, [currentStep, establishment, selectedService, selectedProfessional, selectedDate, selectedTime, clientData]);

  // Loading state
  if (showLoading) {
    return (
      <div className="cliente-agenda-container">
        <div className="cliente-loading">
          <div className="cliente-loading-content">
            <div className="cliente-loading-logo">
              <Scissors className="cliente-loading-icon" />
            </div>
            <div className="cliente-loading-text">
              <h2>Carregando estabelecimento...</h2>
              <p>Preparando tudo para você</p>
            </div>
            <div className="cliente-loading-spinner">
              <div className="cliente-spinner-ring"></div>
            </div>
            <div className="cliente-loading-dots">
              <div className="cliente-dot"></div>
              <div className="cliente-dot"></div>
              <div className="cliente-dot"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return <PageErro />
  }

  // Se não encontrou o estabelecimento
  if (!establishment) {
    return (
      <div className="cliente-agenda-container">
        <div className="cliente-error">
          <h2>Estabelecimento não encontrado</h2>
          <p>O estabelecimento que você está procurando não existe ou foi removido.</p>
        </div>
      </div>
    )
  }

  // Função para formatar endereço completo
  const formatAddress = () => {
    const parts = []
    if (establishment.rua) parts.push(establishment.rua)
    if (establishment.numero) parts.push(establishment.numero)
    if (establishment.complemento) parts.push(establishment.complemento)
    if (establishment.bairro) parts.push(establishment.bairro)
    if (establishment.cidade) parts.push(establishment.cidade)
    if (establishment.estado) parts.push(establishment.estado)
    if (establishment.cep) parts.push(establishment.cep)
    
    return parts.length > 0 ? parts.join(", ") : "Endereço não informado"
  }

  // Função para formatar telefone com máscara
  const formatPhone = (phone: string) => {
    if (!phone) return "Telefone não informado"
    
    // Remove todos os caracteres não numéricos
    const numbers = phone.replace(/\D/g, '')
    
    // Aplica máscara baseada no número de dígitos
    if (numbers.length === 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`
    } else if (numbers.length === 10) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`
    } else {
      return phone // Retorna original se não conseguir formatar
    }
  }

  // Função para abrir WhatsApp
  const openWhatsApp = () => {
    if (!establishment.telefone) {
      alert("Telefone não disponível para contato")
      return
    }

    // Remove todos os caracteres não numéricos
    const phone = establishment.telefone.replace(/\D/g, '')
    
    // Adiciona código do país se não tiver
    const phoneWithCountry = phone.length === 11 ? `55${phone}` : phone
    
    // Cria mensagem padrão
    const message = encodeURIComponent(`Olá! Gostaria de fazer um agendamento no ${establishment.nomeEstabelecimento}.`)
    
    // Abre WhatsApp
    const whatsappUrl = `https://wa.me/${phoneWithCountry}?text=${message}`
    window.open(whatsappUrl, '_blank')
  }

  // Função para aplicar máscara em tempo real no telefone
  const applyPhoneMask = (value: string) => {
    // Remove todos os caracteres não numéricos
    const numbers = value.replace(/\D/g, '')
    
    // Limita a 11 dígitos
    const limitedNumbers = numbers.slice(0, 11)
    
    // Aplica máscara baseada no número de dígitos
    if (limitedNumbers.length === 0) {
      return ''
    } else if (limitedNumbers.length <= 2) {
      return `(${limitedNumbers}`
    } else if (limitedNumbers.length <= 6) {
      return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2)}`
    } else if (limitedNumbers.length <= 10) {
      return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2, 6)}-${limitedNumbers.slice(6)}`
    } else {
      return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2, 7)}-${limitedNumbers.slice(7)}`
    }
  }

  // Função para lidar com mudança no campo de telefone
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const maskedValue = applyPhoneMask(e.target.value)
    setClientData((prev) => ({ ...prev, phone: maskedValue }))
  }

  return (
    <div className="cliente-agenda-container" style={{ 
      '--primary-color': primaryColor,
      '--primary-color-hover': adjustBrightness(primaryColor, -20),
      '--primary-color-light': adjustBrightness(primaryColor, 20)
    } as React.CSSProperties}>
      {/* Header com logo */}
      <header className="cliente-header">
        <div className="cliente-logo">
          <Scissors className="cliente-logo-icon" />
          <span className="cliente-logo-text">Trezu</span>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="cliente-progress-container">
        <div className="cliente-progress-bar">
          <div className="cliente-progress-fill" style={{ width: `${(currentStep / 5) * 100}%` }}></div>
        </div>
        <div className="cliente-progress-steps">
          {[1, 2, 3, 4, 5].map((step) => (
            <div key={step} className={`cliente-progress-step ${currentStep >= step ? "cliente-active" : ""}`}>
              {currentStep > step ? <Check size={16} /> : step}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="cliente-main-content">
        {/* Step 1: Informações do Estabelecimento */}
        {currentStep === 1 && (
          <div className="cliente-step cliente-step-establishment">
            {/* Hero Section com informações principais */}
            <div className="cliente-establishment-hero">
              <div className="cliente-hero-background">
                <div className="cliente-hero-overlay">
                  <div className="cliente-hero-content">
                    <div className="cliente-establishment-logo-section">
                      <div className="cliente-logo-placeholder">
                        <Scissors size={40} />
                      </div>
                      <div className="cliente-establishment-main-info">
                        <h1 className="cliente-establishment-name">{establishment.nomeEstabelecimento}</h1>
                        
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Informações detalhadas do estabelecimento */}
            <div className="cliente-establishment-details-section">
              <div className="cliente-info-cards-grid">
                {/* Card de Localização */}
                <div className="cliente-info-card">
                  <div className="cliente-info-card-header">
                    <MapPin className="cliente-info-icon" />
                    <h3>Localização</h3>
                  </div>
                  <div className="cliente-info-card-content">
                    <p className="cliente-address">{formatAddress()}</p>
                    <button className="cliente-btn-map">Ver no mapa</button>
                  </div>
                </div>

                {/* Card de Contato */}
                <div className="cliente-info-card">
                  <div className="cliente-info-card-header">
                    <Phone className="cliente-info-icon" />
                    <h3>Contato</h3>
                  </div>
                  <div className="cliente-info-card-content">
                    <p className="cliente-phone">{formatPhone(establishment.telefone)}</p>
                    <button className="cliente-btn-contact" onClick={openWhatsApp}>
                      <MessageCircle size={16} />
                      WhatsApp
                    </button>
                  </div>
                </div>

                {/* Card de Horários */}
                <div className="cliente-info-card cliente-hours-card">
                  <div className="cliente-info-card-header">
                    <Clock className="cliente-info-icon" />
                    <h3>Horário de Funcionamento</h3>
                  </div>
                  <div className="cliente-info-card-content">
                    <div className="cliente-hours-list">
                      {establishment.horariosFunc && Array.isArray(establishment.horariosFunc) ? (
                        establishment.horariosFunc.map((day: any, index: number) => {
                          const daysMap = {
                            monday: "Segunda",
                            tuesday: "Terça", 
                            wednesday: "Quarta",
                            thursday: "Quinta",
                            friday: "Sexta",
                            saturday: "Sábado",
                            sunday: "Domingo"
                          }
                          
                          return (
                            <div key={index} className="cliente-hour-item">
                              <span className="cliente-day">{daysMap[day.dia as keyof typeof daysMap]}</span>
                              <span className={`cliente-time ${!day.aberto ? 'cliente-closed' : ''}`}>
                                {day.aberto ? `${day.abertura} - ${day.fechamento}` : 'Fechado'}
                              </span>
                            </div>
                          )
                        })
                      ) : (
                        <div className="cliente-hour-item">
                          <span className="cliente-day">Horários não informados</span>
                        </div>
                      )}
                    </div>
                    <div className="cliente-current-status">
                      <div className="cliente-status-indicator cliente-open"></div>
                      <span>Aberto agora</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sobre o estabelecimento */}
              <Box className="cliente-about-section">
                <Heading as="h3" size="lg" mb={4} textAlign="center" color="gray.700">
                  Sobre nós
                </Heading>
                <Text className="cliente-about-text" textAlign="center" mb={6}>
                  {establishment.descricaoEstabelecimento || 
                    "Há mais de 10 anos cuidando da sua beleza com carinho e profissionalismo. Oferecemos os melhores serviços com uma equipe altamente qualificada e produtos de primeira qualidade."}
                </Text>

                <Flex className="cliente-features-highlight" wrap="wrap" justify="center" gap={3}>
                  <Badge
                    className="cliente-feature-badge"
                    colorScheme="gray"
                    variant="subtle"
                    px={3}
                    py={2}
                    borderRadius="md"
                    fontSize="sm"
                    fontWeight="600"
                    display="flex"
                    alignItems="center"
                    gap={2}
                  >
                    <Shield size={16} />
                    <span>Ambiente seguro</span>
                  </Badge>
                  <Badge
                    className="cliente-feature-badge"
                    colorScheme="gray"
                    variant="subtle"
                    px={3}
                    py={2}
                    borderRadius="md"
                    fontSize="sm"
                    fontWeight="600"
                    display="flex"
                    alignItems="center"
                    gap={2}
                  >
                    <Heart size={16} />
                    <span>Atendimento personalizado</span>
                  </Badge>
                  <Badge
                    className="cliente-feature-badge"
                    colorScheme="gray"
                    variant="subtle"
                    px={3}
                    py={2}
                    borderRadius="md"
                    fontSize="sm"
                    fontWeight="600"
                    display="flex"
                    alignItems="center"
                    gap={2}
                  >
                    <Star size={16} />
                    <span>Produtos premium</span>
                  </Badge>
                  <Badge
                    className="cliente-feature-badge"
                    colorScheme="gray"
                    variant="subtle"
                    px={3}
                    py={2}
                    borderRadius="md"
                    fontSize="sm"
                    fontWeight="600"
                    display="flex"
                    alignItems="center"
                    gap={2}
                  >
                    <Check size={16} />
                    <span>Profissionais certificados</span>
                  </Badge>
                </Flex>
              </Box>
            </div>

            {/* Seção de serviços */}
            <div className="cliente-services-section">
              <div className="cliente-services-header">
                <h3>Escolha seu Serviço</h3>
                <p>Selecione o serviço que deseja agendar</p>
              </div>

              <div className="cliente-services-grid">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className={`cliente-service-card ${selectedService?.id === service.id ? "cliente-selected" : ""}`}
                    onClick={() => handleServiceSelect(service)}
                  >
                    <div className="cliente-service-header">
                      <div className="cliente-service-icon">
                        <Scissors size={24} />
                      </div>
                      {service.popular && (
                        <div className="cliente-service-badge">
                          <Heart size={12} />
                          Popular
                        </div>
                      )}
                    </div>

                    <div className="cliente-service-content">
                      <h4 className="cliente-service-name">{service.nomeServico}</h4>
                      <p className="cliente-service-description">{service.descricaoServico || "Descrição não disponível"}</p>

                      <div className="cliente-service-footer">
                        <div className="cliente-service-duration">
                          <Clock size={14} />
                          <span>{service.duracaoServico} min</span>
                        </div>
                        <div className="cliente-service-price">{formatCurrency(service.valorServico)}</div>
                      </div>
                    </div>

                    {selectedService?.id === service.id && (
                      <div className="cliente-service-selected-indicator">
                        <Check size={20} />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {services.length === 0 && (
                <div className="cliente-no-services">
                  <p>Nenhum serviço disponível no momento.</p>
                </div>
              )}

              {services.length > 6 && (
                <div className="cliente-services-footer">
                  <button className="cliente-btn-see-more">Ver todos os serviços ({services.length})</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Escolha do Profissional */}
        {currentStep === 2 && (
          <div className="cliente-step cliente-step-professional">
            <div className="cliente-step-header">
              <h2>Escolha seu Profissional</h2>
              <p>Selecione quem irá realizar seu {selectedService?.nomeServico}</p>
            </div>

            <div className="cliente-professionals-grid">
              {availableProfessionals.map((professional) => (
                <div
                  key={professional.id}
                  className={`cliente-professional-card ${selectedProfessional?.id === professional.id ? "cliente-selected" : ""}`}
                  onClick={() => handleProfessionalSelect(professional)}
                >
                  <div className="cliente-professional-photo">
                    {professional.photo ? (
                      <img src={professional.photo} alt={professional.nome} />
                    ) : (
                      <div className="cliente-professional-photo-placeholder">
                        <User size={40} />
                      </div>
                    )}
                    {professional.rating && (
                      <div className="cliente-professional-rating">
                        <Star size={12} className="cliente-star-filled" />
                        <span>{professional.rating}</span>
                      </div>
                    )}
                  </div>

                  <div className="cliente-professional-info">
                    <h3>{professional.nome}</h3>
                    <p className="cliente-professional-specialty">{professional.cargo || "Profissional"}</p>
                    <p className="cliente-professional-experience">{professional.experiencia || "Profissional qualificado"}</p>
                    <p className="cliente-professional-description">{professional.descricao || "Bem avaliado pelos clientes"}</p>

                    {professional.avaliacoes && (
                      <div className="cliente-professional-reviews">
                        <span>{professional.avaliacoes} avaliações</span>
                      </div>
                    )}
                  </div>

                  {selectedProfessional?.id === professional.id && (
                    <div className="cliente-professional-selected">
                      <Check size={20} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {availableProfessionals.length === 0 && (
              <div className="cliente-no-professionals">
                <p>Nenhum profissional disponível no momento.</p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Data e Horário */}
        {currentStep === 3 && (
          <Box className="cliente-step cliente-step-datetime">
            <VStack spacing={8} align="stretch">
              <Box textAlign="center">
                <Heading as="h2" size="xl" mb={2} color="gray.800">
                  Escolha Data e Horário
                </Heading>
                <Text fontSize="lg" color="gray.600">
                  Selecione quando deseja ser atendido
                </Text>
              </Box>

              <Container maxW="container.md">
                <VStack spacing={8} align="stretch">
                  {/* Seleção de Data */}
                  <Box>
                    <Heading as="h3" size="md" mb={4} color="gray.700">
                      Escolha a Data
                    </Heading>
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      size="lg"
                      borderRadius="lg"
                      borderColor="gray.300"
                      _focus={{
                        borderColor: primaryColor,
                        boxShadow: `0 0 0 1px ${primaryColor}`,
                      }}
                      _hover={{
                        borderColor: "gray.400",
                      }}
                    />
                  </Box>

                  {/* Seleção de Horário */}
                  {selectedDate && (
                    <Box>
                      <Heading as="h3" size="md" mb={4} color="gray.700">
                        Horários Disponíveis
                      </Heading>
                      <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={3}>
                        {availableTimes.map((time) => {
                          const ocupado = busyTimes.includes(time)
                          const isSelected = selectedTime === time
                          
                          return (
                            <Button
                              key={time}
                              size="lg"
                              variant={isSelected ? "solid" : "outline"}
                              colorScheme={isSelected ? "purple" : "gray"}
                              onClick={() => !ocupado && setSelectedTime(time)}
                              disabled={ocupado}
                              height="60px"
                              borderRadius="lg"
                              fontSize="md"
                              fontWeight="600"
                              _disabled={{
                                opacity: 0.5,
                                cursor: "not-allowed",
                                bg: "gray.100",
                                color: "gray.400",
                                textDecoration: "line-through",
                              }}
                              _hover={{
                                transform: ocupado ? "none" : "translateY(-2px)",
                                boxShadow: ocupado ? "none" : "lg",
                              }}
                              _active={{
                                transform: "scale(0.98)",
                              }}
                              position="relative"
                            >
                              <VStack spacing={1}>
                                <Text fontSize="sm" fontWeight="500">
                                  {time}
                                </Text>
                                {ocupado && (
                                  <Badge
                                    colorScheme="red"
                                    size="sm"
                                    position="absolute"
                                    top={1}
                                    right={1}
                                  >
                                    Ocupado
                                  </Badge>
                                )}
                              </VStack>
                            </Button>
                          )
                        })}
                      </SimpleGrid>
                    </Box>
                  )}
                </VStack>
              </Container>

              {/* Resumo do Agendamento */}
              {selectedDate && selectedTime && (
                <Box
                  bg="white"
                  borderRadius="xl"
                  p={6}
                  boxShadow="lg"
                  border="1px solid"
                  borderColor="gray.200"
                  maxW="container.md"
                  mx="auto"
                >
                  <Heading as="h3" size="md" mb={4} color="gray.700">
                    Resumo do Agendamento
                  </Heading>
                  <VStack spacing={3} align="stretch">
                    <HStack justify="space-between">
                      <Text fontWeight="500">Serviço:</Text>
                      <Text>{selectedService?.nomeServico}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontWeight="500">Profissional:</Text>
                      <Text>{selectedProfessional?.nome}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontWeight="500">Data:</Text>
                      <Text>{new Date(selectedDate).toLocaleDateString("pt-BR")}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontWeight="500">Horário:</Text>
                      <Text>{selectedTime}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontWeight="500">Duração:</Text>
                      <Text>{selectedService?.duracaoServico} minutos</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontWeight="600" fontSize="lg">Valor:</Text>
                      <Text fontWeight="600" fontSize="lg" color="green.600">
                        {formatCurrency(selectedService?.valorServico || 0)}
                      </Text>
                    </HStack>
                  </VStack>
                </Box>
              )}
            </VStack>
          </Box>
        )}

        {/* Step 4: Dados do Cliente */}
        {currentStep === 4 && (
          <Box className="cliente-step cliente-step-client-data">
            <VStack spacing={8} align="stretch">
              <Box textAlign="center">
                <Heading as="h2" size="xl" mb={2} color="gray.800">
                  Seus Dados
                </Heading>
                <Text fontSize="lg" color="gray.600">
                  Precisamos de algumas informações para confirmar seu agendamento
                </Text>
              </Box>

              <Container maxW="container.md">
                <VStack spacing={6} align="stretch">
                  {/* Nome Completo */}
                  <Box>
                    <Text as="label" fontSize="md" fontWeight="600" color="gray.700" mb={2} display="block">
                      Nome Completo *
                    </Text>
                    <Input
                      type="text"
                      value={clientData.name}
                      onChange={(e) => setClientData((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Digite seu nome completo"
                      size="lg"
                      borderRadius="lg"
                      borderColor="gray.300"
                      _focus={{
                        borderColor: primaryColor,
                        boxShadow: `0 0 0 1px ${primaryColor}`,
                      }}
                      _hover={{
                        borderColor: "gray.400",
                      }}
                      required
                    />
                  </Box>

                  {/* WhatsApp */}
                  <Box>
                    <Text as="label" fontSize="md" fontWeight="600" color="gray.700" mb={2} display="block">
                      WhatsApp *
                    </Text>
                    <Input
                      type="tel"
                      value={clientData.phone}
                      onChange={handlePhoneChange}
                      placeholder="(11) 99999-9999"
                      size="lg"
                      borderRadius="lg"
                      borderColor="gray.300"
                      _focus={{
                        borderColor: primaryColor,
                        boxShadow: `0 0 0 1px ${primaryColor}`,
                      }}
                      _hover={{
                        borderColor: "gray.400",
                      }}
                      required
                    />
                  </Box>

                  {/* E-mail */}
                  <Box>
                    <Text as="label" fontSize="md" fontWeight="600" color="gray.700" mb={2} display="block">
                      E-mail (opcional)
                    </Text>
                    <Input
                      type="email"
                      value={clientData.email}
                      onChange={(e) => setClientData((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="seu@email.com"
                      size="lg"
                      borderRadius="lg"
                      borderColor="gray.300"
                      _focus={{
                        borderColor: primaryColor,
                        boxShadow: `0 0 0 1px ${primaryColor}`,
                      }}
                      _hover={{
                        borderColor: "gray.400",
                      }}
                    />
                  </Box>

                  {/* Forma de Pagamento */}
                  <Box>
                    <Text as="label" fontSize="md" fontWeight="600" color="gray.700" mb={3} display="block">
                      Forma de Pagamento
                    </Text>
                    <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
                      {paymentMethods.map((method) => (
                        <Button
                          key={method.id}
                          variant={clientData.paymentMethod === method.id ? "solid" : "outline"}
                          colorScheme={clientData.paymentMethod === method.id ? "purple" : "gray"}
                          onClick={() => setClientData((prev) => ({ ...prev, paymentMethod: method.id }))}
                          height="60px"
                          borderRadius="lg"
                          fontSize="sm"
                          fontWeight="500"
                          _hover={{
                            transform: "translateY(-2px)",
                            boxShadow: "lg",
                          }}
                          _active={{
                            transform: "scale(0.98)",
                          }}
                        >
                          <VStack spacing={1}>
                            <Icon as={method.icon} boxSize={5} />
                            <Text fontSize="xs">{method.name}</Text>
                          </VStack>
                        </Button>
                      ))}
                    </SimpleGrid>
                  </Box>

                  {/* Observações */}
                  <Box>
                    <Text as="label" fontSize="md" fontWeight="600" color="gray.700" mb={2} display="block">
                      Observações (opcional)
                    </Text>
                    <Textarea
                      value={clientData.notes}
                      onChange={(e) => setClientData((prev) => ({ ...prev, notes: e.target.value }))}
                      placeholder="Alguma observação especial ou preferência..."
                      size="lg"
                      borderRadius="lg"
                      borderColor="gray.300"
                      _focus={{
                        borderColor: primaryColor,
                        boxShadow: `0 0 0 1px ${primaryColor}`,
                      }}
                      _hover={{
                        borderColor: "gray.400",
                      }}
                      rows={3}
                      resize="vertical"
                    />
                  </Box>

                  {/* Aviso de Privacidade */}
                  <Box
                    bg="blue.50"
                    border="1px solid"
                    borderColor="blue.200"
                    borderRadius="lg"
                    p={4}
                    display="flex"
                    alignItems="center"
                    gap={3}
                  >
                    <Icon as={Shield} color="blue.500" boxSize={5} />
                    <Text fontSize="sm" color="blue.700" fontWeight="500">
                      Seus dados estão seguros conosco e serão usados apenas para este agendamento.
                    </Text>
                  </Box>
                </VStack>
              </Container>
            </VStack>
          </Box>
        )}

        {/* Step 5: Confirmação Final */}
        {currentStep === 5 && (
          <Box className="cliente-step cliente-step-confirmation" minH="100vh" pb="120px">
            <VStack spacing={8} align="stretch" py={8}>
              <Box textAlign="center">
                <Heading as="h2" size="xl" mb={2} color="gray.800">
                  Confirmar Agendamento
                </Heading>
                <Text fontSize="lg" color="gray.600">
                  Revise todos os dados antes de finalizar
                </Text>
              </Box>

              <Container maxW="container.md" px={4}>
                <VStack spacing={6} align="stretch">
                  {/* Estabelecimento */}
                  <Box
                    bg="white"
                    borderRadius="xl"
                    p={6}
                    boxShadow="lg"
                    border="1px solid"
                    borderColor="gray.200"
                  >
                    <Heading as="h3" size="md" mb={4} color="gray.700" display="flex" alignItems="center" gap={2}>
                      <Icon as={Building2} color={primaryColor} />
                      Estabelecimento
                    </Heading>
                    <HStack spacing={4} align="start">
                      <Box
                        w="60px"
                        h="60px"
                        borderRadius="lg"
                        bg="gray.100"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        flexShrink={0}
                      >
                        <Icon as={Scissors} color="gray.500" boxSize={6} />
                      </Box>
                      <VStack align="start" spacing={1} flex={1}>
                        <Text fontWeight="600" fontSize="lg" color="gray.800">
                          {establishment.nomeEstabelecimento}
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                          {formatAddress()}
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                          {formatPhone(establishment.telefone)}
                        </Text>
                      </VStack>
                    </HStack>
                  </Box>

                  {/* Serviço */}
                  <Box
                    bg="white"
                    borderRadius="xl"
                    p={6}
                    boxShadow="lg"
                    border="1px solid"
                    borderColor="gray.200"
                  >
                    <Heading as="h3" size="md" mb={4} color="gray.700" display="flex" alignItems="center" gap={2}>
                      <Icon as={Scissors} color={primaryColor} />
                      Serviço
                    </Heading>
                    <VStack align="start" spacing={3}>
                      <Text fontWeight="600" fontSize="lg" color="gray.800">
                        {selectedService?.nomeServico}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        {selectedService?.descricaoServico || "Descrição não disponível"}
                      </Text>
                      <HStack justify="space-between" w="full">
                        <HStack spacing={2}>
                          <Icon as={Clock} color="gray.500" boxSize={4} />
                          <Text fontSize="sm" color="gray.600">
                            {selectedService?.duracaoServico} min
                          </Text>
                        </HStack>
                        <Text fontWeight="600" fontSize="lg" color="green.600">
                          {formatCurrency(selectedService?.valorServico || 0)}
                        </Text>
                      </HStack>
                    </VStack>
                  </Box>

                  {/* Profissional */}
                  <Box
                    bg="white"
                    borderRadius="xl"
                    p={6}
                    boxShadow="lg"
                    border="1px solid"
                    borderColor="gray.200"
                  >
                    <Heading as="h3" size="md" mb={4} color="gray.700" display="flex" alignItems="center" gap={2}>
                      <Icon as={User} color={primaryColor} />
                      Profissional
                    </Heading>
                    <HStack spacing={4} align="start">
                      <Box
                        w="60px"
                        h="60px"
                        borderRadius="full"
                        bg={primaryColor}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        flexShrink={0}
                      >
                        <Icon as={User} color="white" boxSize={6} />
                      </Box>
                      <VStack align="start" spacing={1} flex={1}>
                        <Text fontWeight="600" fontSize="lg" color="gray.800">
                          {selectedProfessional?.nome}
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                          {selectedProfessional?.cargo || "Profissional"}
                        </Text>
                        {selectedProfessional?.rating && (
                          <HStack spacing={1}>
                            <Icon as={Star} color="yellow.400" boxSize={3} />
                            <Text fontSize="sm" color="gray.600">
                              {selectedProfessional.rating}
                            </Text>
                          </HStack>
                        )}
                      </VStack>
                    </HStack>
                  </Box>

                  {/* Data e Horário */}
                  <Box
                    bg="white"
                    borderRadius="xl"
                    p={6}
                    boxShadow="lg"
                    border="1px solid"
                    borderColor="gray.200"
                  >
                    <Heading as="h3" size="md" mb={4} color="gray.700" display="flex" alignItems="center" gap={2}>
                      <Icon as={Calendar} color={primaryColor} />
                      Data e Horário
                    </Heading>
                    <VStack spacing={3} align="start">
                      <HStack spacing={3}>
                        <Icon as={Calendar} color="gray.500" boxSize={5} />
                        <Text fontSize="md" color="gray.800">
                          {selectedDate ?
                            new Date(selectedDate + 'T00:00:00').toLocaleDateString("pt-BR", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }) : ''}
                        </Text>
                      </HStack>
                      <HStack spacing={3}>
                        <Icon as={Clock} color="gray.500" boxSize={5} />
                        <Text fontSize="md" color="gray.800">
                          {selectedTime}
                        </Text>
                      </HStack>
                    </VStack>
                  </Box>

                  {/* Dados do Cliente */}
                  <Box
                    bg="white"
                    borderRadius="xl"
                    p={6}
                    boxShadow="lg"
                    border="1px solid"
                    borderColor="gray.200"
                  >
                    <Heading as="h3" size="md" mb={4} color="gray.700" display="flex" alignItems="center" gap={2}>
                      <Icon as={User} color={primaryColor} />
                      Seus Dados
                    </Heading>
                    <VStack spacing={2} align="start">
                      <HStack justify="space-between" w="full">
                        <Text fontWeight="500" color="gray.600">Nome:</Text>
                        <Text color="gray.800">{clientData.name}</Text>
                      </HStack>
                      <HStack justify="space-between" w="full">
                        <Text fontWeight="500" color="gray.600">WhatsApp:</Text>
                        <Text color="gray.800">{formatPhone(clientData.phone)}</Text>
                      </HStack>
                      {clientData.email && (
                        <HStack justify="space-between" w="full">
                          <Text fontWeight="500" color="gray.600">E-mail:</Text>
                          <Text color="gray.800">{clientData.email}</Text>
                        </HStack>
                      )}
                      {clientData.paymentMethod && (
                        <HStack justify="space-between" w="full">
                          <Text fontWeight="500" color="gray.600">Pagamento:</Text>
                          <Text color="gray.800">{paymentMethods.find((p) => p.id === clientData.paymentMethod)?.name}</Text>
                        </HStack>
                      )}
                      {clientData.notes && (
                        <HStack justify="space-between" w="full" align="start">
                          <Text fontWeight="500" color="gray.600">Observações:</Text>
                          <Text color="gray.800" textAlign="right" maxW="200px">{clientData.notes}</Text>
                        </HStack>
                      )}
                    </VStack>
                  </Box>

                  {/* Total - Aumentado e mais destacado */}
                  <Box
                    bg={`linear-gradient(135deg, ${primaryColor} 0%, ${adjustBrightness(primaryColor, -20)} 100%)`}
                    color="white"
                    borderRadius="xl"
                    p={8}
                    boxShadow="xl"
                    textAlign="center"
                    mb={8}
                  >
                    <Heading as="h3" size="lg" mb={3} opacity={0.9}>
                      Total a Pagar
                    </Heading>
                    <Text fontSize={{ base: "2xl", md: "4xl" }} fontWeight="700" mb={2}>
                      {formatCurrency(selectedService?.valorServico || 0)}
                    </Text>
                    <Text fontSize="sm" opacity={0.8}>
                      Valor do serviço selecionado
                    </Text>
                  </Box>
                </VStack>
              </Container>
            </VStack>
          </Box>
        )}

        {/* Step 6: Sucesso */}
        {currentStep === 6 && (
          <Box className="cliente-step cliente-step-success">
            <VStack spacing={8} align="stretch" minH="100vh" justify="center">
              <Container maxW="container.md">
                <VStack spacing={8} align="stretch">
                  {/* Ícone de Sucesso */}
                  <Box textAlign="center">
                    <Box
                      w="80px"
                      h="80px"
                      borderRadius="full"
                      bg="green.500"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      mx="auto"
                      mb={6}
                      boxShadow="lg"
                    >
                      <Icon as={Check} color="white" boxSize={10} />
                    </Box>
                  </Box>

                  {/* Mensagem de Sucesso */}
                  <Box
                    bg="blue.50"
                    border="1px solid"
                    borderColor="blue.200"
                    borderRadius="xl"
                    p={6}
                    textAlign="center"
                    boxShadow="md"
                  >
                    <Text
                      fontSize={{ base: "lg", md: "xl" }}
                      fontWeight="700"
                      color="blue.700"
                      lineHeight="1.4"
                    >
                      {establishment.mensagemAgradecimento ? (
                        establishment.mensagemAgradecimento
                      ) : (
                        "Seu agendamento foi realizado com sucesso."
                      )}
                    </Text>
                  </Box>

                  {/* Detalhes do Agendamento */}
                  <Box
                    bg="white"
                    borderRadius="xl"
                    p={6}
                    boxShadow="lg"
                    border="1px solid"
                    borderColor="gray.200"
                  >
                    <VStack spacing={4} align="stretch">
                      <HStack spacing={3}>
                        <Icon as={Calendar} color="gray.500" boxSize={5} />
                        <Text fontSize="md" color="gray.800">
                          {new Date(selectedDate).toLocaleDateString("pt-BR")} às {selectedTime}
                        </Text>
                      </HStack>
                      
                      <HStack spacing={3}>
                        <Icon as={MapPin} color="gray.500" boxSize={5} />
                        <Text fontSize="md" color="gray.800">
                          {formatAddress()}
                        </Text>
                      </HStack>
                      
                      <HStack spacing={3}>
                        <Icon as={Phone} color="gray.500" boxSize={5} />
                        <Text fontSize="md" color="gray.800">
                          {formatPhone(establishment.telefone)}
                        </Text>
                      </HStack>
                    </VStack>
                  </Box>

                  {/* Botões de Ação */}
                  <VStack spacing={4} w="full">
                    <Button
                      leftIcon={<Icon as={MessageCircle} boxSize={5} />}
                      onClick={openWhatsApp}
                      size="lg"
                      colorScheme="green"
                      w="full"
                      h="56px"
                      borderRadius="lg"
                      fontSize="md"
                      fontWeight="600"
                      _hover={{
                        transform: "translateY(-2px)",
                        boxShadow: "lg",
                      }}
                      _active={{
                        transform: "scale(0.98)",
                      }}
                    >
                      WhatsApp
                    </Button>
                    
                    <Button
                      onClick={() => window.location.reload()}
                      size="lg"
                      variant="outline"
                      colorScheme="gray"
                      w="full"
                      h="56px"
                      borderRadius="lg"
                      fontSize="md"
                      fontWeight="600"
                      _hover={{
                        transform: "translateY(-2px)",
                        boxShadow: "lg",
                      }}
                      _active={{
                        transform: "scale(0.98)",
                      }}
                    >
                      Fazer Novo Agendamento
                    </Button>
                  </VStack>

                  {/* Dicas Importantes */}
                  <Box
                    bg="blue.50"
                    border="1px solid"
                    borderColor="blue.200"
                    borderRadius="xl"
                    p={6}
                    boxShadow="md"
                  >
                    <Heading as="h3" size="md" mb={4} color="blue.700" display="flex" alignItems="center" gap={2}>
                      <Icon as={Shield} color="blue.500" boxSize={5} />
                      Dicas importantes:
                    </Heading>
                    <VStack spacing={3} align="start">
                      <HStack spacing={3} align="start">
                        <Box
                          w="6px"
                          h="6px"
                          borderRadius="full"
                          bg="blue.500"
                          mt={2}
                          flexShrink={0}
                        />
                        <Text fontSize="sm" color="blue.800" lineHeight="1.5">
                          Chegue com 10 minutos de antecedência
                        </Text>
                      </HStack>
                      <HStack spacing={3} align="start">
                        <Box
                          w="6px"
                          h="6px"
                          borderRadius="full"
                          bg="blue.500"
                          mt={2}
                          flexShrink={0}
                        />
                        <Text fontSize="sm" color="blue.800" lineHeight="1.5">
                          Em caso de cancelamento, avise com 2 horas de antecedência ao estabelecimento pelo WhatsApp
                        </Text>
                      </HStack>
                    </VStack>
                  </Box>
                </VStack>
              </Container>
            </VStack>
          </Box>
        )}
      </main>

      {/* Navigation Footer */}
      {currentStep < 6 && (
        <Box
          as="footer"
          className="cliente-navigation-footer"
          position="fixed"
          bottom={0}
          left={0}
          right={0}
          bg="white"
          borderTop="1px solid"
          borderColor="gray.200"
          boxShadow="lg"
          zIndex={10}
          px={4}
          py={4}
        >
          <Flex justify="space-between" align="center" maxW="container.md" mx="auto">
            {currentStep > 1 && (
              <Button
                variant="outline"
                colorScheme="gray"
                size="lg"
                onClick={handlePrevStep}
                leftIcon={<Icon as={ArrowLeft} boxSize={4} />}
                borderRadius="lg"
                fontWeight="600"
              >
                Voltar
              </Button>
            )}

            <Text fontSize="sm" color="gray.600" fontWeight="500">
              Passo {currentStep} de 5
            </Text>

            <Button
              colorScheme="purple"
              size="lg"
              onClick={currentStep === 5 ? handleSubmit : handleNextStep}
              disabled={!canProceed()}
              rightIcon={!submitting ? <Icon as={ArrowRight} boxSize={4} /> : undefined}
              borderRadius="lg"
              fontWeight="600"
              isLoading={submitting}
              loadingText="Salvando..."
              opacity={canProceed() ? 1 : 0.5}
              cursor={canProceed() ? "pointer" : "not-allowed"}
            >
              {currentStep === 5 ? "Confirmar Agendamento" : "Continuar"}
            </Button>
          </Flex>
        </Box>
      )}
    </div>
  )
}

export default AgendaCliente
