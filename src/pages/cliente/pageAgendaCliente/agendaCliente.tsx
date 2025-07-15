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
} from "lucide-react"
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

  const hasOpenedWhatsApp = useRef(false)

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
      const docRef = await addDoc(agendaRef, appointmentData)
      
      console.log("Agendamento salvo com sucesso! ID:", docRef.id)
      console.log("Dados do agendamento:", appointmentData)
      
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
  const availableProfessionals = selectedService
    ? professionals.filter((prof) => prof.cargos && prof.cargos.includes('Profissional'))
    : professionals

  // Função para montar mensagem de confirmação
  const getConfirmationMessage = () => {
    let msg = `Olá!\n`;
    msg += `Quero confirmar meu agendamento, por favor.\n`;
    msg += `--- Dados do Agendamento ---\n`;
    msg += `Estabelecimento: ${establishment?.nomeEstabelecimento || ''}\n`;
    msg += `Serviço: ${selectedService?.nomeServico || ''}\n`;
    msg += `Profissional: ${selectedProfessional?.nome || ''}\n`;
    msg += `Data: ${selectedDate ? new Date(selectedDate).toLocaleDateString('pt-BR') : ''}\n`;
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
    <div className="cliente-agenda-container">
      {/* Header com logo */}
      <header className="cliente-header">
        <div className="cliente-logo">
          <Scissors className="cliente-logo-icon" />
          <span className="cliente-logo-text">CliqAgenda</span>
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
              <div className="cliente-about-section">
                <h3>Sobre nós</h3>
                <p className="cliente-about-text">
                  {establishment.descricaoEstabelecimento || 
                    "Há mais de 10 anos cuidando da sua beleza com carinho e profissionalismo. Oferecemos os melhores serviços com uma equipe altamente qualificada e produtos de primeira qualidade."}
                </p>

                <div className="cliente-features-highlight">
                  <div className="cliente-feature-badge">
                    <Shield size={16} />
                    <span>Ambiente seguro</span>
                  </div>
                  <div className="cliente-feature-badge">
                    <Heart size={16} />
                    <span>Atendimento personalizado</span>
                  </div>
                  <div className="cliente-feature-badge">
                    <Star size={16} />
                    <span>Produtos premium</span>
                  </div>
                  <div className="cliente-feature-badge">
                    <Check size={16} />
                    <span>Profissionais certificados</span>
                  </div>
                </div>
              </div>
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
          <div className="cliente-step cliente-step-datetime">
            <div className="cliente-step-header">
              <h2>Escolha Data e Horário</h2>
              <p>Selecione quando deseja ser atendido</p>
            </div>

            <div className="cliente-datetime-container">
              <div className="cliente-date-selection">
                <h3>Escolha a Data</h3>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="cliente-date-input"
                />
              </div>

              {selectedDate && (
                <div className="cliente-time-selection">
                  <h3>Horários Disponíveis</h3>
                  <div className="cliente-time-grid">
                    {availableTimes.map((time) => {
                      const ocupado = busyTimes.includes(time)
                      return (
                        <button
                          key={time}
                          className={`cliente-time-slot ${selectedTime === time ? "cliente-selected" : ""}`}
                          onClick={() => !ocupado && setSelectedTime(time)}
                          disabled={ocupado}
                          style={ocupado ? { background: '#f3f4f6', color: '#aaa', cursor: 'not-allowed', textDecoration: 'line-through' } : {}}
                        >
                          {time} {ocupado && <span style={{color:'#dc2626', fontWeight:600, fontSize:13}}>Indisponível</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {selectedDate && selectedTime && (
              <div className="cliente-appointment-summary">
                <h3>Resumo do Agendamento</h3>
                <div className="cliente-summary-card">
                  <div className="cliente-summary-item">
                    <strong>Serviço:</strong> {selectedService?.nomeServico}
                  </div>
                  <div className="cliente-summary-item">
                    <strong>Profissional:</strong> {selectedProfessional?.nome}
                  </div>
                  <div className="cliente-summary-item">
                    <strong>Data:</strong> {new Date(selectedDate).toLocaleDateString("pt-BR")}
                  </div>
                  <div className="cliente-summary-item">
                    <strong>Horário:</strong> {selectedTime}
                  </div>
                  <div className="cliente-summary-item">
                    <strong>Duração:</strong> {selectedService?.duracaoServico} minutos
                  </div>
                  <div className="cliente-summary-item cliente-summary-price">
                    <strong>Valor:</strong> {formatCurrency(selectedService?.valorServico || 0)}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Dados do Cliente */}
        {currentStep === 4 && (
          <div className="cliente-step cliente-step-client-data">
            <div className="cliente-step-header">
              <h2>Seus Dados</h2>
              <p>Precisamos de algumas informações para confirmar seu agendamento</p>
            </div>

            <div className="cliente-form-container">
              <div className="cliente-form-grid">
                <div className="cliente-form-group">
                  <label htmlFor="name">Nome Completo *</label>
                  <input
                    type="text"
                    id="name"
                    value={clientData.name}
                    onChange={(e) => setClientData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Digite seu nome completo"
                    required
                  />
                </div>

                <div className="cliente-form-group">
                  <label htmlFor="phone">WhatsApp *</label>
                  <input
                    type="tel"
                    id="phone"
                    value={clientData.phone}
                    onChange={handlePhoneChange}
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>

                <div className="cliente-form-group cliente-full-width">
                  <label htmlFor="email">E-mail (opcional)</label>
                  <input
                    type="email"
                    id="email"
                    value={clientData.email}
                    onChange={(e) => setClientData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="seu@email.com"
                  />
                </div>

                <div className="cliente-form-group cliente-full-width">
                  <label>Forma de Pagamento</label>
                  <div className="cliente-payment-methods">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        className={`cliente-payment-method ${clientData.paymentMethod === method.id ? "cliente-selected" : ""}`}
                        onClick={() => setClientData((prev) => ({ ...prev, paymentMethod: method.id }))}
                      >
                        <method.icon size={20} />
                        <span>{method.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="cliente-form-group cliente-full-width">
                  <label htmlFor="notes">Observações (opcional)</label>
                  <textarea
                    id="notes"
                    value={clientData.notes}
                    onChange={(e) => setClientData((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Alguma observação especial ou preferência..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="cliente-privacy-notice">
                <Shield size={16} />
                <p>Seus dados estão seguros conosco e serão usados apenas para este agendamento.</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Confirmação Final */}
        {currentStep === 5 && (
          <div className="cliente-step cliente-step-confirmation">
            <div className="cliente-step-header">
              <h2>Confirmar Agendamento</h2>
              <p>Revise todos os dados antes de finalizar</p>
            </div>

            <div className="cliente-final-summary">
              <div className="cliente-summary-section">
                <h3>Estabelecimento</h3>
                <div className="cliente-establishment-mini">
                  <img src={establishment.logo || "/placeholder.svg"} alt="Logo" />
                  <div>
                    <strong>{establishment.nomeEstabelecimento}</strong>
                    <p>{formatAddress()}</p>
                    <p>{formatPhone(establishment.telefone)}</p>
                  </div>
                </div>
              </div>

              <div className="cliente-summary-section">
                <h3>Serviço</h3>
                <div className="cliente-service-mini">
                  <strong>{selectedService?.nomeServico}</strong>
                  <p>{selectedService?.descricaoServico || "Descrição não disponível"}</p>
                  <div className="cliente-service-mini-details">
                    <span>
                      <Clock size={14} /> {selectedService?.duracaoServico} min
                    </span>
                    <span className="cliente-price">{formatCurrency(selectedService?.valorServico || 0)}</span>
                  </div>
                </div>
              </div>

              <div className="cliente-summary-section">
                <h3>Profissional</h3>
                <div className="cliente-professional-mini">
                  {selectedProfessional?.photo ? (
                    <img src={selectedProfessional.photo} alt={selectedProfessional?.nome} />
                  ) : (
                    <div className="cliente-professional-mini-placeholder">
                      <User size={24} />
                    </div>
                  )}
                  <div>
                    <strong>{selectedProfessional?.nome}</strong>
                    <p>{selectedProfessional?.cargo || "Profissional"}</p>
                    {selectedProfessional?.rating && (
                      <div className="cliente-rating-mini">
                        <Star size={12} className="cliente-star-filled" />
                        <span>{selectedProfessional.rating}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="cliente-summary-section">
                <h3>Data e Horário</h3>
                <div className="cliente-datetime-mini">
                  <div className="cliente-date-mini">
                    <Calendar size={16} />
                    <span>
                      {new Date(selectedDate).toLocaleDateString("pt-BR", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="cliente-time-mini">
                    <Clock size={16} />
                    <span>{selectedTime}</span>
                  </div>
                </div>
              </div>

              <div className="cliente-summary-section">
                <h3>Seus Dados</h3>
                <div className="cliente-client-mini">
                  <p>
                    <strong>Nome:</strong> {clientData.name}
                  </p>
                  <p>
                    <strong>WhatsApp:</strong> {formatPhone(clientData.phone)}
                  </p>
                  {clientData.email && (
                    <p>
                      <strong>E-mail:</strong> {clientData.email}
                    </p>
                  )}
                  {clientData.paymentMethod && (
                    <p>
                      <strong>Pagamento:</strong> {paymentMethods.find((p) => p.id === clientData.paymentMethod)?.name}
                    </p>
                  )}
                  {clientData.notes && (
                    <p>
                      <strong>Observações:</strong> {clientData.notes}
                    </p>
                  )}
                </div>
              </div>

              <div className="cliente-total-section">
                <div className="cliente-total-card">
                  <h3>Total a Pagar</h3>
                  <div className="cliente-total-price">{formatCurrency(selectedService?.valorServico || 0)}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Sucesso */}
        {currentStep === 6 && (
          <div className="cliente-step cliente-step-success">
            <div className="cliente-success-content">
              <div className="cliente-success-icon">
                <Check size={48} />
              </div>
              <div style={{
                textAlign: 'center',
                fontWeight: 700,
                fontSize: 22,
                color: '#2563eb',
                margin: '24px 0 16px 0',
                padding: '16px 24px',
                background: '#f0f7ff',
                borderRadius: 12,
                boxShadow: '0 2px 8px 0 rgba(96,165,250,0.08)'
              }}>
                {establishment.mensagemAgradecimento ? (
                  <span>{establishment.mensagemAgradecimento}</span>
                ) : (
                  <span>Seu agendamento foi realizado com sucesso.</span>
                )}
              </div>
              <div className="cliente-success-details">
                <div className="cliente-success-item">
                  <Calendar size={20} />
                  <span>
                    {new Date(selectedDate).toLocaleDateString("pt-BR")} às {selectedTime}
                  </span>
                </div>
                <div className="cliente-success-item">
                  <MapPin size={20} />
                  <span>{formatAddress()}</span>
                </div>
                <div className="cliente-success-item">
                  <Phone size={20} />
                  <span>{formatPhone(establishment.telefone)}</span>
                </div>
              </div>

              <div className="cliente-success-actions">
                <button className="cliente-btn-primary" onClick={openWhatsApp}>
                  <MessageCircle size={16} />
                  WhatsApp
                </button>
                <button className="cliente-btn-secondary" onClick={() => window.location.reload()}>
                  Fazer Novo Agendamento
                </button>
              </div>

              <div className="cliente-success-tips">
                <h3>Dicas importantes:</h3>
                <ul>
                  <li>Chegue com 10 minutos de antecedência</li>
                  <li>{"Em caso de cancelamento, avise com 2 horas de antecedência ao estabelecimento pelo WhatsApp"}</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Navigation Footer */}
      {currentStep < 6 && (
        <footer className="cliente-navigation-footer">
          <div className="cliente-nav-content">
            {currentStep > 1 && (
              <button className="cliente-btn-back" onClick={handlePrevStep}>
                <ArrowLeft size={16} />
                Voltar
              </button>
            )}

            <div className="cliente-nav-info">
              <span>Passo {currentStep} de 5</span>
            </div>

            <button
              className="cliente-btn-next"
              onClick={currentStep === 5 ? handleSubmit : handleNextStep}
              disabled={!canProceed() || submitting}
            >
              {submitting ? (
                <>
                  <div className="cliente-spinner-mini"></div>
                  Salvando...
                </>
              ) : currentStep === 5 ? (
                "Confirmar Agendamento"
              ) : (
                "Continuar"
              )}
              {!submitting && <ArrowRight size={16} />}
            </button>
          </div>
        </footer>
      )}
    </div>
  )
}

export default AgendaCliente
