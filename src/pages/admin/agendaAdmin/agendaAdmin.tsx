"use client"

import { useState, useEffect } from "react"
import {
  Calendar,
  Clock,
  Users,
  DollarSign,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Check,
  X,
  AlertTriangle,
  User,
  Scissors,
  Star,
  BarChart3,
  Play as PlayIcon,
  MessageCircle,
} from "lucide-react"
import "./agendaAdmin.css"
import { firestore } from '../../../firebase/firebase'
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, getDoc, deleteDoc } from 'firebase/firestore'
import { getAuth } from "firebase/auth"
import { useNavigate } from "react-router-dom"
import {
  Button,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Box,
  Badge,
  useDisclosure
} from "@chakra-ui/react"
import { Download as DownloadIcon } from "lucide-react"

const AgendaAdmin = () => {
  const [currentView, setCurrentView] = useState("dashboard")
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedProfessional, setSelectedProfessional] = useState("todos")
  const [showFilters, setShowFilters] = useState(false)

  // PWA States
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isPWAInstalled, setIsPWAInstalled] = useState(false)
  const [pwaInstallError, setPwaInstallError] = useState<string | null>(null)
  const toast = useToast()
  const { isOpen: isPWAModalOpen, onOpen: onPWAModalOpen, onClose: onPWAModalClose } = useDisclosure()

  // Modal states
  const [showAppointmentModal, setShowAppointmentModal] = useState(false)
  const [modalStep, setModalStep] = useState(1)
  const [appointmentData, setAppointmentData] = useState({
    clientId: "",
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    service: "",
    professional: "",
    date: "",
    time: "",
    duration: 60,
    price: 0,
    notes: "",
    paymentMethod: "",
    reminderEnabled: true,
  })

  // Available times
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
    "18:30",
  ]

  const auth = getAuth()
  const navigate = useNavigate()
  const [clientes, setClientes] = useState<any[]>([])
  const [clientesLoading, setClientesLoading] = useState(true)
  const [servicosFirestore, setServicosFirestore] = useState<any[]>([])
  const [servicosLoading, setServicosLoading] = useState(true)

  // Agendamentos do Firestore
  const [agendamentos, setAgendamentos] = useState<any[]>([])
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [showDayModal, setShowDayModal] = useState(false)

  // Profissionais ativos
  const [colaboradores, setColaboradores] = useState<any[]>([])
  const [colaboradoresLoading, setColaboradoresLoading] = useState(true)

  // Buscar nome do estabelecimento do admin logado
  const [estabelecimento, setEstabelecimento] = useState("")
  
  // PWA Logic - Permitir teste em desenvolvimento
  useEffect(() => {
    // Detectar se é dispositivo móvel primeiro
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase())
      setIsMobile(isMobileDevice)
      console.log('📱 Dispositivo móvel detectado:', isMobileDevice)
      return isMobileDevice
    }
    
    const isMobileDevice = checkMobile()
    
    // Se não for dispositivo móvel, não fazer nada
    if (!isMobileDevice) {
      console.log('❌ PWA desabilitado - Apenas dispositivos móveis')
      console.log('📱 User Agent:', navigator.userAgent)
      console.log('🖥️ Para testar, use o DevTools do navegador e simule um dispositivo móvel')
      return
    }
    
    // Em desenvolvimento, simular condições PWA para teste
    const isDevelopment = window.location.protocol === 'http:'
    const isProduction = window.location.protocol === 'https:'
    
    if (isDevelopment) {
      console.log('🔧 Modo desenvolvimento - PWA simulado para teste (MOBILE)')
      // Simular condições PWA em desenvolvimento
      setDeferredPrompt({ prompt: () => Promise.resolve({ outcome: 'accepted' }) }) // Simular prompt
      
      // Mostrar modal após 2 segundos em desenvolvimento (apenas mobile)
      setTimeout(() => {
        console.log('🔧 Mostrando modal PWA em desenvolvimento (MOBILE)')
        onPWAModalOpen()
      }, 2000)
      
      return
    }
    
    // Detectar evento de instalação PWA
    const handleBeforeInstallPrompt = (e: any) => {
      console.log('🎯 Evento beforeinstallprompt capturado!')
      e.preventDefault()
      setDeferredPrompt(e)
      console.log('✅ PWA install prompt disponível e armazenado')
      
      // Mostrar modal PWA automaticamente após 3 segundos apenas se:
      // - Não estiver instalado
      // - For dispositivo móvel
      // - Estiver em HTTPS
      setTimeout(() => {
        if (!isPWAInstalled && isMobile && isProduction) {
          onPWAModalOpen()
        }
      }, 3000)
    }
    
    // Detectar se já foi instalado
    const handleAppInstalled = () => {
      console.log('✅ PWA instalado com sucesso!')
      setDeferredPrompt(null)
      setIsPWAInstalled(true)
      onPWAModalClose()
      toast({
        title: "Aplicativo instalado!",
        description: "O Trezu foi adicionado à sua tela inicial.",
        status: "success",
        duration: 3000,
        isClosable: true,
      })
    }
    
    // Verificar se já está instalado
    const checkIfInstalled = () => {
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
        console.log('✅ PWA já está instalado (standalone mode)')
        setIsPWAInstalled(true)
        return true
      }
      console.log('ℹ️ PWA não está instalado (não está em standalone mode)')
      setIsPWAInstalled(false)
      return false
    }
    
    // Verificar se o service worker está registrado
    const checkServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration()
          if (registration) {
            console.log('✅ Service Worker registrado:', registration)
            console.log('Service Worker ativo:', registration.active)
            console.log('Service Worker instalando:', registration.installing)
            console.log('Service Worker esperando:', registration.waiting)
          } else {
            console.log('⚠️ Service Worker não encontrado')
          }
        } catch (error) {
          console.error('❌ Erro ao verificar Service Worker:', error)
        }
      } else {
        console.log('❌ Service Worker não suportado neste navegador')
      }
    }
    
    // Verificar se o manifest está carregado
    const checkManifest = async () => {
      const manifestLink = document.querySelector('link[rel="manifest"]')
      if (manifestLink) {
        const manifestUrl = manifestLink.getAttribute('href')
        console.log('✅ Manifest encontrado:', manifestUrl)
        
        try {
          const response = await fetch(manifestUrl!)
          const manifest = await response.json()
          console.log('📄 Manifest carregado:', manifest)
          console.log('📄 Ícones no manifest:', manifest.icons)
        } catch (error) {
          console.error('❌ Erro ao carregar manifest:', error)
        }
      } else {
        console.log('❌ Manifest não encontrado')
      }
    }
    
    // Verificar se o site está sendo servido via HTTPS
    const checkHTTPS = () => {
      const isHTTPS = window.location.protocol === 'https:'
      console.log('🔒 HTTPS:', isHTTPS)
      return isHTTPS
    }
    
    // Executar verificações
    console.log('🔍 Iniciando verificações PWA...')
    checkIfInstalled()
    checkServiceWorker()
    checkManifest()
    checkHTTPS()
    
    // Adicionar listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    
    // Log para debug
    console.log('👂 Listeners PWA adicionados')
    console.log('📱 isMobile:', isMobile)
    console.log('🎯 deferredPrompt inicial:', deferredPrompt)
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [toast, isPWAInstalled, isMobile, onPWAModalOpen, onPWAModalClose])
  
  // Função para instalar PWA
  const handleInstallPWA = async () => {
    try {
      console.log('🔄 Iniciando processo de instalação PWA...')
      
      // Em desenvolvimento, mostrar mensagem de teste
      if (window.location.protocol === 'http:') {
        toast({
          title: "Modo de Teste",
          description: "Em produção (HTTPS), o app seria instalado automaticamente.",
          status: "info",
          duration: 3000,
          isClosable: true,
        })
        onPWAModalClose()
        return
      }
      
      console.log('Deferred prompt disponível:', !!deferredPrompt)
      console.log('É dispositivo móvel:', isMobile)
      console.log('Display mode:', window.matchMedia('(display-mode: standalone)').matches)
      
      if (!deferredPrompt) {
        console.log('❌ Nenhum prompt de instalação disponível')
        setPwaInstallError('Nenhum prompt de instalação disponível')
        
        toast({
          title: "Instalação Manual",
          description: "Use o menu do navegador para adicionar à tela inicial",
          status: "info",
          duration: 5000,
          isClosable: true,
        })
        return
      }
      
      console.log('✅ Prompt de instalação encontrado, iniciando...')
      console.log('Prompt object:', deferredPrompt)
      
      // Mostrar o prompt de instalação
      deferredPrompt.prompt()
      
      // Aguardar a resposta do usuário
      const { outcome } = await deferredPrompt.userChoice
      
      console.log('Resultado da instalação:', outcome)
      
      if (outcome === 'accepted') {
        console.log('✅ PWA instalado com sucesso')
        setPwaInstallError(null)
        toast({
          title: "Instalação iniciada!",
          description: "O aplicativo está sendo adicionado à sua tela inicial.",
          status: "success",
          duration: 3000,
          isClosable: true,
        })
        
        // Limpar o prompt usado
        setDeferredPrompt(null)
      } else {
        console.log('❌ PWA não foi instalado (usuário recusou)')
        setPwaInstallError('Instalação cancelada pelo usuário')
        toast({
          title: "Instalação cancelada",
          description: "Você pode instalar manualmente usando o menu do navegador.",
          status: "info",
          duration: 5000,
          isClosable: true,
        })
      }
    } catch (error) {
      console.error('❌ Erro durante instalação PWA:', error)
      setPwaInstallError('Erro durante a instalação')
      toast({
        title: "Erro na instalação",
        description: "Ocorreu um erro durante a instalação. Tente novamente.",
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    }
  }
  
  useEffect(() => {
    if (!auth.currentUser?.uid) return
    const contasRef = collection(firestore, 'contas')
    const docRef = doc(contasRef, auth.currentUser.uid)
    getDoc(docRef).then((contaDoc) => {
      if (contaDoc.exists()) {
        const contaData = contaDoc.data()
        setEstabelecimento(contaData.nomeEstabelecimento || "")
      }
    })
  }, [auth.currentUser])

  // Buscar clientes do Firestore pelo nome do estabelecimento
  useEffect(() => {
    if (!estabelecimento) return
    setClientesLoading(true)
    const clientesRef = collection(firestore, 'clienteUser')
    const q = query(clientesRef, where('estabelecimento', '==', estabelecimento))
    const unsub = onSnapshot(q, (snapshot) => {
      setClientes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      setClientesLoading(false)
    })
    return () => unsub()
  }, [estabelecimento])

  // Buscar serviços do Firestore pelo emailProprietario
  useEffect(() => {
    if (!auth.currentUser?.email) return
    setServicosLoading(true)
    const servicosRef = collection(firestore, 'servicosAdmin')
    const q = query(servicosRef, where('emailProprietario', '==', auth.currentUser.email))
    const unsub = onSnapshot(q, (snapshot) => {
      setServicosFirestore(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      setServicosLoading(false)
    })
    return () => unsub()
  }, [auth.currentUser])

  // Buscar agendamentos em tempo real
  useEffect(() => {
    if (!estabelecimento) return
    const agendamentosRef = collection(firestore, 'agendaAdmin')
    const q = query(agendamentosRef, where('nomeEstabelecimento', '==', estabelecimento))
    const unsub = onSnapshot(q, (snapshot) => {
      const agendamentosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      setAgendamentos(agendamentosData)
    })
    return () => unsub()
  }, [estabelecimento])

  useEffect(() => {
    if (!auth.currentUser?.uid) return
    setColaboradoresLoading(true)
    const colaboradoresRef = collection(firestore, 'colaboradores')
    const q = query(colaboradoresRef, where('createdBy', '==', auth.currentUser.uid))
    const unsub = onSnapshot(q, (snapshot) => {
      setColaboradores(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      setColaboradoresLoading(false)
    })
    return () => unsub()
  }, [auth.currentUser])

  const [tipoPlano, setTipoPlano] = useState<string | null>(null)
  const [isPremium, setIsPremium] = useState<boolean>(true)
  useEffect(() => {
    if (!auth.currentUser?.uid) return
    const docRef = doc(firestore, 'contas', auth.currentUser.uid)
    getDoc(docRef).then((docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data()
        setTipoPlano(data.tipoPlano || null)
        setIsPremium(data.premium === true)
      }
    })
  }, [auth.currentUser])
  useEffect(() => {
    const pathname = window.location.pathname;
    // Permitir acesso à agenda para planos 'individual' e 'gratis'
    if ((tipoPlano === 'individual' || tipoPlano === 'gratis') && !pathname.endsWith('/agenda')) {
      navigate(`/dashboard/${auth.currentUser?.uid}`);
    }
    if (!isPremium) {
      navigate(`/dashboard/${auth.currentUser?.uid}`);
    }
  }, [tipoPlano, isPremium, navigate, auth.currentUser]);

  const handleModalClose = () => {
    setShowAppointmentModal(false)
    setModalStep(1)
    setAppointmentData({
      clientId: "",
      clientName: "",
      clientPhone: "",
      clientEmail: "",
      service: "",
      professional: "",
      date: "",
      time: "",
      duration: 60,
      price: 0,
      notes: "",
      paymentMethod: "",
      reminderEnabled: true,
    })
  }

  const handleNextStep = () => {
    if (modalStep < 4) {
      setModalStep(modalStep + 1)
    }
  }

  const handlePrevStep = () => {
    if (modalStep > 1) {
      setModalStep(modalStep - 1)
    }
  }

  const handleSubmitAppointment = async () => {
    if (!auth.currentUser) return
    
    const novoAgendamento = {
      ...appointmentData,
      nomeEstabelecimento: estabelecimento,
      createdAt: new Date(),
    }
    try {
      await addDoc(collection(firestore, 'agendaAdmin'), novoAgendamento)
      console.log("Agendamento criado:", novoAgendamento)
      handleModalClose()
      // Mostrar toast de sucesso
    } catch (error) {
      alert('Erro ao cadastrar agendamento: ' + error)
    }
  }

  // Função para filtrar agendamentos do dia selecionado
  const agendamentosDoDia = (date: Date) => {
    const dia = date.toISOString().split('T')[0]
    return agendamentos.filter(a => a.date === dia)
  }

  // Função para abrir modal do dia
  const handleDayClick = (date: Date) => {
    setSelectedDay(date)
    setShowDayModal(true)
  }

  // Mock data
  const todayISO = new Date(selectedDate).toISOString().split('T')[0]
  const todayAppointments = agendamentos.filter(a => a.date === todayISO)
  const receitaPrevistaHoje = todayAppointments.reduce((sum, a) => sum + (a.price || 0), 0)
  const confirmadosHoje = todayAppointments.filter(a => a.status === 'confirmado').length
  const pendentesHoje = todayAppointments.filter(a => a.status !== 'confirmado').length

  // Receita confirmada do dia
  const receitaConfirmadaHoje = todayAppointments.filter(a => a.status === 'finalizado').reduce((sum, a) => sum + (a.price || 0), 0)

  // Histórico do dia: agendamentos finalizados do dia
  const historicoHoje = todayAppointments.filter(a => a.status === 'finalizado')
  // Agenda de hoje: agendamentos do dia que não estão finalizados
  const agendaHoje = todayAppointments.filter(a => a.status !== 'finalizado')

  // Funções para atualizar status
  const handleIniciarAtendimento = async (id: string) => {
    await updateDoc(doc(firestore, 'agendaAdmin', id), { status: 'em_andamento' })
  }
  const handleFinalizarAtendimento = async (id: string) => {
    // Atualiza status para finalizado
    await updateDoc(doc(firestore, 'agendaAdmin', id), { status: 'finalizado' })
    // Busca o documento completo
    const agendamentoDoc = await getDoc(doc(firestore, 'agendaAdmin', id))
    if (agendamentoDoc.exists()) {
      const agendamentoData = agendamentoDoc.data()
      await addDoc(collection(firestore, 'historicoAgendamentoFinalizadoAdmin'), {
        ...agendamentoData,
        admin: agendamentoData.admin || [],
        status: 'finalizado',
        dataFinalizacao: new Date(),
        agendamentoId: id
      })
    }
  }

  const handleExcluirAgendamento = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este agendamento?')) return;
    try {
      await deleteDoc(doc(firestore, 'agendaAdmin', id));
      // Opcional: mostrar toast de sucesso
    } catch (error) {
      alert('Erro ao excluir agendamento: ' + error);
    }
  }

  const getStatusColor = (status:string) => {
    switch (status) {
      case "confirmado":
        return "success"
      case "agendado":
        return "warning"
      case "finalizado":
        return "info"
      case "cancelado":
        return "error"
      default:
        return "neutral"
    }
  }

  const getStatusIcon = (status:string) => {
    switch (status) {
      case "confirmado":
        return <Check size={16} />
      case "agendado":
        return <Clock size={16} />
      case "finalizado":
        return <Star size={16} />
      case "cancelado":
        return <X size={16} />
      default:
        return <AlertTriangle size={16} />
    }
  }

  const formatCurrency = (value:number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDate = (date:Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date)
  }

  // Profissionais habilitados para o serviço selecionado
  const profissionaisHabilitados = (() => {
    const servicoSelecionado = servicosFirestore.find(s => s.nomeServico === appointmentData.service)
    if (servicoSelecionado && Array.isArray(servicoSelecionado.profissionaisServico)) {
      return servicoSelecionado.profissionaisServico
    }
    return []
  })()

  // Função para gerar os dias do mês (com dias do mês anterior/próximo para completar a grade)
  function getMonthDays(date: Date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startDay = firstDayOfMonth.getDay(); // 0 (Dom) - 6 (Sáb)
    const days = [];
    for (let i = 0; i < startDay; i++) {
      days.push(new Date(year, month, i - startDay + 1));
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    while (days.length % 7 !== 0) {
      days.push(new Date(year, month + 1, days.length - daysInMonth - startDay + 1));
    }
    return days;
  }

  // Funções para navegar entre meses
  const handlePrevMonth = () => {
    setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  return (
    <div className="agenda-container">
      {/* Header */}
      <header className="agenda-header">
        

        <div className="header-center">
          <div className="date-display">
            <Calendar size={20} />
            <div className="date-info">
              <h2>{formatDate(selectedDate)}</h2>
              <p>Hoje • {agendaHoje.length + historicoHoje.length} agendamentos</p>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="agenda-nav">
        <div className="nav-items">
          <button
            className={`nav-item ${currentView === "dashboard" ? "active" : ""}`}
            onClick={() => setCurrentView("dashboard")}
          >
            <BarChart3 size={18} />
            <span>Dashboard</span>
          </button>
          <button
            className={`nav-item ${currentView === "calendar" ? "active" : ""}`}
            onClick={() => setCurrentView("calendar")}
          >
            <Calendar size={18} />
            <span>Calendário</span>
          </button>
          
          
          
        </div>
      </nav>

      {/* Main Content */}
      <main className="agenda-main">
        {/* Dashboard View */}
        {currentView === "dashboard" && (
          <div className="dashboard-content">
            {/* Stats Cards */}
            <div className="stats-grid">
              <div className="stat-card primary">
                <div className="stat-header">
                  <div className="stat-icon">
                    <Calendar size={24} />
                  </div>
                  <span className="stat-trend positive">+{todayAppointments.length * 10}%</span>
                </div>
                <div className="stat-content">
                  <h3>{todayAppointments.length}</h3>
                  <p>Agendamentos Hoje</p>
                  <small>{confirmadosHoje} confirmados • {pendentesHoje} pendentes</small>
                </div>
              </div>

              <div className="stat-card success">
                <div className="stat-header">
                  <div className="stat-icon">
                    <DollarSign size={24} />
                  </div>
                  <span className="stat-trend positive">+{receitaPrevistaHoje > 0 ? 8 : 0}%</span>
                </div>
                <div className="stat-content">
                  <h3>{formatCurrency(receitaPrevistaHoje)}</h3>
                  <p>Receita Prevista Hoje</p>
                  <small>{formatCurrency(receitaConfirmadaHoje)} já confirmados</small>
                </div>
              </div>

              <div className="stat-card info">
                <div className="stat-header">
                  <div className="stat-icon">
                    <Users size={24} />
                  </div>
                  <span className="stat-trend neutral">{colaboradores.length}/{colaboradores.length}</span>
                </div>
                <div className="stat-content">
                  <h3>{colaboradores.length}</h3>
                  <p>Profissionais Ativos</p>
                  <small>{colaboradoresLoading ? 'Carregando...' : `${colaboradores.length} cadastrados`}</small>
                </div>
              </div>
            </div>

            {/* Today's Schedule */}
            <div className="dashboard-section">
              <div className="section-header">
                <h2>Agenda de Hoje</h2>
                <div className="section-actions">
                  <button className="btn-filter" onClick={() => setShowFilters(!showFilters)}>
                    <Filter size={16} />
                    Filtros
                  </button>
                  <button className="btn-export">
                    <Download size={16} />
                    Exportar
                  </button>
                </div>
              </div>

              {/* Filters */}
              {showFilters && (
                <div className="filters-bar">
                  <div className="filter-group">
                    <label>Profissional:</label>
                    <select value={selectedProfessional} onChange={(e) => setSelectedProfessional(e.target.value)}>
                      <option value="todos">Todos</option>
                      <option value="carlos">Carlos</option>
                      <option value="ana">Ana</option>
                      <option value="fernanda">Fernanda</option>
                    </select>
                  </div>
                  <div className="filter-group">
                    <label>Status:</label>
                    <select>
                      <option value="todos">Todos</option>
                      <option value="confirmado">Confirmados</option>
                      <option value="agendado">Agendados</option>
                      <option value="finalizado">Finalizados</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Appointments List */}
              <div className="appointments-list">
                {agendaHoje.map((appointment) => (
                  <div key={appointment.id} className="appointment-card">
                    <div className="appointment-time">
                      <Clock size={16} />
                      <span>{appointment.time}</span>
                    </div>

                    <div className="appointment-info">
                      <div className="client-info">
                        <h4>{appointment.clientName}</h4>
                        <p>{appointment.service}</p>
                        <div className="appointment-meta">
                          <span className="professional">
                            <User size={14} />
                            {appointment.professional}
                          </span>
                          <span className="price">
                            <DollarSign size={14} />
                            {formatCurrency(appointment.price)}
                          </span>
                        </div>
                      </div>

                      <div className="appointment-status">
                        <span className={`status-badge ${getStatusColor(appointment.status)}`}>
                          {getStatusIcon(appointment.status)}
                          {appointment.status}
                        </span>
                      </div>
                    </div>

                    <div className="appointment-actions">
                      {appointment.status !== 'em_andamento' && (
                        <button className="btn-action-sm" title="Iniciar Atendimento" onClick={() => handleIniciarAtendimento(appointment.id)}>
                          <PlayIcon size={16} />
                        </button>
                      )}
                      {appointment.status === 'em_andamento' && (
                        <button className="btn-action-sm success" title="Finalizar Atendimento" onClick={() => handleFinalizarAtendimento(appointment.id)}>
                          <Check size={16} />
                        </button>
                      )}
                      <button className="btn-action-sm" title="Ver detalhes">
                        <Eye size={16} />
                      </button>
                      <button className="btn-action-sm" title="Editar">
                        <Edit size={16} />
                      </button>
                      <button className="btn-action-sm" title="WhatsApp" onClick={() => {
                        const phone = appointment.clientPhone?.replace(/\D/g, '');
                        if (!phone) {
                          alert('Telefone do cliente não encontrado!');
                          return;
                        }
                        const phoneWithCountry = phone.length === 11 ? `55${phone}` : phone;
                        const message = 'Olá, tudo bem? vim aqui para confirmar o seu agendamento de hoje, posso contar com a sua presença?';
                        const whatsappUrl = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
                        window.open(whatsappUrl, '_blank');
                      }}>
                        <MessageCircle size={16} />
                      </button>
                      <button className="btn-action-sm danger" title="Excluir Agendamento" onClick={() => handleExcluirAgendamento(appointment.id)}>
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Histórico de Atendimento do Dia */}
            {historicoHoje.length > 0 && (
              <div className="dashboard-section">
                <div className="section-header">
                  <h2>Histórico de Atendimento do Dia</h2>
                </div>
                <div className="appointments-list">
                  {historicoHoje.map((appointment) => (
                    <div key={appointment.id} className="appointment-card finalizado">
                      <div className="appointment-time">
                        <Clock size={16} />
                        <span>{appointment.time}</span>
                      </div>
                      <div className="appointment-info">
                        <div className="client-info">
                          <h4>{appointment.clientName}</h4>
                          <p>{appointment.service}</p>
                          <div className="appointment-meta">
                            <span className="professional">
                              <User size={14} />
                              {appointment.professional}
                            </span>
                            <span className="price">
                              <DollarSign size={14} />
                              {formatCurrency(appointment.price)}
                            </span>
                          </div>
                        </div>
                        <div className="appointment-status">
                          <span className={`status-badge info`}>
                            <Check size={16} />
                            Finalizado
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Calendar View */}
        {currentView === "calendar" && (
          <div className="calendar-content">
            <div className="calendar-header">
              <div className="calendar-navigation">
                <button className="btn-nav" onClick={handlePrevMonth}>
                  <ChevronLeft size={20} />
                </button>
                <h2>{formatDate(selectedDate)}</h2>
                <button className="btn-nav" onClick={handleNextMonth}>
                  <ChevronRight size={20} />
                </button>
              </div>
              <div className="calendar-views">
                <button className="btn-view active">Mês</button>
                <button className="btn-view">Semana</button>
                <button className="btn-view">Dia</button>
              </div>
            </div>
            <div className="calendar-grid">
              <div className="calendar-weekdays">
                <div className="weekday">Dom</div>
                <div className="weekday">Seg</div>
                <div className="weekday">Ter</div>
                <div className="weekday">Qua</div>
                <div className="weekday">Qui</div>
                <div className="weekday">Sex</div>
                <div className="weekday">Sáb</div>
              </div>
              <div className="calendar-days">
                {getMonthDays(selectedDate).map((day, idx) => {
                  const dayISO = day.toISOString().split('T')[0];
                  const isToday = day.toDateString() === new Date().toDateString();
                  const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
                  const hasAppointments = agendamentos.some(a => a.date === dayISO);
                  return (
                    <div
                      key={idx}
                      className={`calendar-day${isToday ? " today" : ""}${!isCurrentMonth ? " other-month" : ""}`}
                      onClick={() => handleDayClick(day)}
                      style={{
                        cursor: 'pointer',
                        border: hasAppointments ? '2px solid #6366f1' : undefined,
                        background: isToday ? '#e0f2fe' : undefined,
                        color: !isCurrentMonth ? '#bbb' : undefined
                      }}
                    >
                      <span className="day-number">{day.getDate()}</span>
                      {hasAppointments && <div className="day-appointments"><div className="appointment-dot confirmed"></div></div>}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="calendar-legend">
              <div className="legend-item">
                <div className="legend-dot confirmed"></div>
                <span>Agendamento</span>
              </div>
            </div>
          </div>
        )}

        {/* Other views would go here */}
        {currentView !== "dashboard" && currentView !== "calendar" && (
          <div className="placeholder-content">
            <div className="placeholder-icon">
              {/* Zap size={48} */}
            </div>
            <h2>Em Desenvolvimento</h2>
            <p>Esta seção está sendo desenvolvida e estará disponível em breve!</p>
          </div>
        )}
      </main>

      {/* Appointment Modal */}
      {showAppointmentModal && (
        <div className="modal-overlay" onClick={handleModalClose}>
          <div className="appointment-modal" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="modal-header">
              <div className="modal-title">
                <h2>Novo Agendamento</h2>
                <p>Passo {modalStep} de 4</p>
              </div>

              <div className="modal-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${(modalStep / 4) * 100}%` }}></div>
                </div>
                <div className="progress-steps">
                  {[1, 2, 3, 4].map((step) => (
                    <div key={step} className={`progress-step ${modalStep >= step ? "active" : ""}`}>
                      {modalStep > step ? <Check size={16} /> : step}
                    </div>
                  ))}
                </div>
              </div>

              <button className="modal-close" onClick={handleModalClose}>
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="modal-content">
              {/* Step 1: Client Information */}
              {modalStep === 1 && (
                <div className="modal-step">
                  <div className="step-header">
                    <div className="step-icon">
                      <User size={24} />
                    </div>
                    <div className="step-info">
                      <h3>Selecione o Cliente</h3>
                      <p>Escolha um cliente cadastrado para o agendamento</p>
                    </div>
                  </div>
                  {clientesLoading ? (
                    <div>Carregando clientes...</div>
                  ) : clientes.length === 0 ? (
                    <div style={{ color: 'red', margin: '16px 0' }}>
                      Nenhum cliente cadastrado.<br />
                      <button className="btn-primary" onClick={() => navigate('/dashboard/' + auth.currentUser?.uid + '/cliente')}>
                        Cadastrar Cliente
                      </button>
                    </div>
                  ) : (
                    <div className="clientes-list-modal">
                      {clientes.map((cliente) => (
                        <label
                          key={cliente.id}
                          className={`cliente-select-card ${appointmentData.clientId === cliente.id ? 'selected' : ''}`}
                          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', border: appointmentData.clientId === cliente.id ? '2px solid #6366f1' : '1px solid #ccc', borderRadius: 8, padding: 12, marginBottom: 8 }}
                        >
                          <input
                            type="radio"
                            name="selectCliente"
                            checked={appointmentData.clientId === cliente.id}
                            onChange={() => setAppointmentData((prev) => ({ ...prev, clientId: cliente.id, clientName: cliente.nome, clientPhone: cliente.telefone, clientEmail: cliente.email }))}
                            style={{ marginRight: 12 }}
                          />
                          <div>
                            <div><strong>{cliente.nome}</strong></div>
                            <div>{cliente.telefone}</div>
                            <div>{cliente.email}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Service Selection */}
              {modalStep === 2 && (
                <div className="modal-step">
                  <div className="step-header">
                    <div className="step-icon">
                      <Scissors size={24} />
                    </div>
                    <div className="step-info">
                      <h3>Escolha o Serviço</h3>
                      <p>Selecione o serviço desejado</p>
                    </div>
                  </div>
                  {servicosLoading ? (
                    <div>Carregando serviços...</div>
                  ) : servicosFirestore.length === 0 ? (
                    <div style={{ color: 'red', margin: '16px 0' }}>
                      Nenhum serviço cadastrado para este estabelecimento.<br />
                    </div>
                  ) : (
                    <div className="services-grid">
                      {servicosFirestore.map((service) => (
                        <div
                          key={service.id}
                          className={`service-card ${appointmentData.service === service.nomeServico ? "selected" : ""}`}
                          onClick={() => setAppointmentData((prev) => ({
                            ...prev,
                            service: service.nomeServico,
                            duration: service.duracaoServico,
                            price: service.valorServico,
                            categoriaServico: service.categoriaServico,
                            profissionaisServico: service.profissionaisServico,
                            servicoAtivo: service.servicoAtivo,
                            nomeEstabelecimento: service.nomeEstabelecimento,
                            uidProprietario: service.uidProprietario,
                            emailProprietario: service.emailProprietario,
                          }))}
                        >
                          <div className="service-info">
                            <h4>{service.nomeServico}</h4>
                            <p className="service-category">{service.categoriaServico}</p>
                            <div className="service-details">
                              <span className="service-duration">
                                <Clock size={14} />
                                {service.duracaoServico} min
                              </span>
                              <span className="service-price">
                                <DollarSign size={14} />
                                {formatCurrency(service.valorServico)}
                              </span>
                            </div>
                            <div className="service-extra">
                              <div><strong>Profissionais:</strong> {Array.isArray(service.profissionaisServico) ? service.profissionaisServico.join(', ') : ''}</div>
                              <div><strong>Status:</strong> {service.servicoAtivo ? 'Ativo' : 'Inativo'}</div>
                              <div><strong>Estabelecimento:</strong> {service.nomeEstabelecimento}</div>
                            </div>
                          </div>
                          {appointmentData.service === service.nomeServico && (
                            <div className="service-selected">
                              <Check size={20} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Professional & Date/Time */}
              {modalStep === 3 && (
                <div className="modal-step">
                  <div className="step-header">
                    <div className="step-icon">
                      <Calendar size={24} />
                    </div>
                    <div className="step-info">
                      <h3>Data, Hora e Profissional</h3>
                      <p>Escolha quando e com quem</p>
                    </div>
                  </div>

                  <div className="datetime-grid">
                    <div className="form-group">
                      <label htmlFor="professional">Profissional *</label>
                      <select
                        id="professional"
                        value={appointmentData.professional}
                        onChange={(e) => setAppointmentData((prev) => ({ ...prev, professional: e.target.value }))}
                        required
                      >
                        <option value="">Selecione um profissional</option>
                        {profissionaisHabilitados.map((prof: string, idx: number) => (
                          <option key={idx} value={prof}>{prof}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="date">Data *</label>
                      <input
                        type="date"
                        id="date"
                        value={appointmentData.date}
                        onChange={(e) => setAppointmentData((prev) => ({ ...prev, date: e.target.value }))}
                        min={new Date().toISOString().split("T")[0]}
                        required
                      />
                    </div>

                    <div className="time-selection">
                      <label>Horário Disponível *</label>
                      <div className="time-grid">
                        {availableTimes.map((time) => (
                          <button
                            key={time}
                            type="button"
                            className={`time-slot ${appointmentData.time === time ? "selected" : ""}`}
                            onClick={() => setAppointmentData((prev) => ({ ...prev, time }))}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Confirmation & Payment */}
              {modalStep === 4 && (
                <div className="modal-step">
                  <div className="step-header">
                    <div className="step-icon">
                      <Check size={24} />
                    </div>
                    <div className="step-info">
                      <h3>Confirmação</h3>
                      <p>Revise os dados e finalize</p>
                    </div>
                  </div>

                  <div className="confirmation-content">
                    <div className="appointment-summary">
                      <h4>Resumo do Agendamento</h4>

                      <div className="summary-section">
                        <h5>Cliente</h5>
                        <p>{appointmentData.clientName}</p>
                        <p>{appointmentData.clientPhone}</p>
                        {appointmentData.clientEmail && <p>{appointmentData.clientEmail}</p>}
                      </div>

                      <div className="summary-section">
                        <h5>Serviço</h5>
                        <p>{appointmentData.service}</p>
                        <p>Duração: {appointmentData.duration} minutos</p>
                        <p className="price-highlight">Valor: {formatCurrency(appointmentData.price)}</p>
                      </div>

                      <div className="summary-section">
                        <h5>Agendamento</h5>
                        <p>Profissional: {appointmentData.professional}</p>
                        <p>
                          Data: {appointmentData.date ? new Date(appointmentData.date).toLocaleDateString("pt-BR") : ""}
                        </p>
                        <p>Horário: {appointmentData.time}</p>
                      </div>
                    </div>

                    <div className="additional-options">
                      <div className="form-group">
                        <label htmlFor="paymentMethod">Forma de Pagamento</label>
                        <select
                          id="paymentMethod"
                          value={appointmentData.paymentMethod}
                          onChange={(e) => setAppointmentData((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                        >
                          <option value="">Definir no atendimento</option>
                          <option value="dinheiro">Dinheiro</option>
                          <option value="pix">PIX</option>
                          <option value="cartao">Cartão</option>
                        </select>
                      </div>

                      <div className="form-group full-width">
                        <label htmlFor="notes">Observações</label>
                        <textarea
                          id="notes"
                          value={appointmentData.notes}
                          onChange={(e) => setAppointmentData((prev) => ({ ...prev, notes: e.target.value }))}
                          placeholder="Observações especiais, preferências do cliente..."
                          rows={3}
                        />
                      </div>

                      <div className="checkbox-group">
                        <input
                          type="checkbox"
                          id="reminder"
                          checked={appointmentData.reminderEnabled}
                          onChange={(e) =>
                            setAppointmentData((prev) => ({ ...prev, reminderEnabled: e.target.checked }))
                          }
                        />
                        <label htmlFor="reminder">Enviar lembrete por WhatsApp</label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              <div className="footer-actions">
                {modalStep > 1 && (
                  <button className="btn-secondary" onClick={handlePrevStep}>
                    <ChevronLeft size={16} />
                    Voltar
                  </button>
                )}

                <div className="primary-actions">
                  <button className="btn-cancel" onClick={handleModalClose}>
                    Cancelar
                  </button>

                  {modalStep < 4 ? (
                    <button
                      className="btn-primary"
                      onClick={handleNextStep}
                      disabled={
                        (modalStep === 1 && (!appointmentData.clientId)) ||
                        (modalStep === 2 && !appointmentData.service) ||
                        (modalStep === 3 && (!appointmentData.professional || !appointmentData.date || !appointmentData.time))
                      }
                    >
                      Próximo
                      <ChevronRight size={16} />
                    </button>
                  ) : (
                    <button className="btn-success" onClick={handleSubmitAppointment}>
                      <Check size={16} />
                      Confirmar Agendamento
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de agendamentos do dia */}
      {showDayModal && selectedDay && (
        <div className="modal-overlay" onClick={() => setShowDayModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Agendamentos de {selectedDay.toLocaleDateString('pt-BR')}</h2>
              <button className="modal-close" onClick={() => setShowDayModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {agendamentosDoDia(selectedDay).length === 0 ? (
                <p>Nenhum agendamento para este dia.</p>
              ) : (
                <ul>
                  {agendamentosDoDia(selectedDay).map((a, idx) => (
                    <li key={idx} style={{ marginBottom: 12, borderBottom: '1px solid #eee', paddingBottom: 8 }}>
                      <strong>Cliente:</strong> {a.clientName}<br />
                      <strong>Serviço:</strong> {a.service}<br />
                      <strong>Profissional:</strong> {a.professional}<br />
                      <strong>Horário:</strong> {a.time}<br />
                      <strong>Status:</strong> {a.status || 'agendado'}<br />
                      <strong>Telefone:</strong> {a.clientPhone}<br />
                      <strong>Valor:</strong> {formatCurrency(a.price)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Histórico Geral Modal */}
      {/* Removed as per edit hint */}
      
      {/* PWA Install Modal */}
      <Modal isOpen={isPWAModalOpen} onClose={onPWAModalClose} isCentered size="md">
        <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
        <ModalContent 
          bg="white" 
          borderRadius="xl" 
          boxShadow="2xl"
          mx={4}
          maxW="400px"
        >
          
          <ModalCloseButton 
            top={4} 
            right={4} 
            borderRadius="full"
            bg="gray.100"
            _hover={{ bg: "gray.200" }}
          />
          
          <ModalBody py={6}>
            <VStack spacing={4} align="stretch">
              {/* Indicador de modo de teste */}
              {window.location.protocol === 'http:' && (
                <Box
                  bg="yellow.50"
                  border="1px solid"
                  borderColor="yellow.200"
                  borderRadius="lg"
                  p={3}
                >
                  <Text fontSize="sm" color="yellow.800" textAlign="center" fontWeight="500">
                    🔧 Modo de Teste - PWA simulado para desenvolvimento
                  </Text>
                </Box>
              )}
              
              <Text fontSize="md" color="gray.600" textAlign="center" lineHeight="1.6">
                Instale o <strong>Trezu</strong> na sua tela inicial para ter acesso rápido e uma experiência melhor!
              </Text>
              
              <Box
                bg="blue.50"
                border="1px solid"
                borderColor="blue.200"
                borderRadius="lg"
                p={4}
              >
                <VStack spacing={2} align="start">
                  <HStack spacing={2}>
                    <Badge colorScheme="blue" variant="subtle" fontSize="xs">
                      📱 Android
                    </Badge>
                    <Badge colorScheme="purple" variant="subtle" fontSize="xs">
                      🍎 iOS
                    </Badge>
                  </HStack>
                  <Text fontSize="sm" color="blue.800" fontWeight="500">
                    Funciona em ambos os sistemas!
                  </Text>
                </VStack>
              </Box>
              
              <Box
                bg="gray.50"
                border="1px solid"
                borderColor="gray.200"
                borderRadius="lg"
                p={3}
              >
                <VStack spacing={2} align="start">
                  <Text fontSize="sm" fontWeight="600" color="gray.700">
                    ✨ Benefícios:
                  </Text>
                  <VStack spacing={1} align="start" w="full">
                    <HStack spacing={2}>
                      <Box w="2" h="2" borderRadius="full" bg="green.500" />
                      <Text fontSize="xs" color="gray.600">Acesso rápido à agenda</Text>
                    </HStack>
                    <HStack spacing={2}>
                      <Box w="2" h="2" borderRadius="full" bg="green.500" />
                      <Text fontSize="xs" color="gray.600">Funciona offline</Text>
                    </HStack>
                    <HStack spacing={2}>
                      <Box w="2" h="2" borderRadius="full" bg="green.500" />
                      <Text fontSize="xs" color="gray.600">Notificações push</Text>
                    </HStack>
                    <HStack spacing={2}>
                      <Box w="2" h="2" borderRadius="full" bg="green.500" />
                      <Text fontSize="xs" color="gray.600">Experiência nativa</Text>
                    </HStack>
                  </VStack>
                </VStack>
              </Box>
              
              {pwaInstallError && (
                <Box
                  bg="red.50"
                  border="1px solid"
                  borderColor="red.200"
                  borderRadius="lg"
                  p={3}
                >
                  <Text fontSize="sm" color="red.700" textAlign="center">
                    ⚠️ {pwaInstallError}
                  </Text>
                </Box>
              )}
            </VStack>
          </ModalBody>
          
          <ModalFooter 
            pt={0} 
            pb={6} 
            px={6}
            flexDirection="column"
            gap={3}
          >
            <Button
              colorScheme="blue"
              size="lg"
              w="full"
              h="50px"
              borderRadius="lg"
              fontWeight="600"
              onClick={handleInstallPWA}
              leftIcon={<DownloadIcon size={20} />}
              bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              _hover={{
                transform: "translateY(-2px)",
                boxShadow: "lg",
              }}
              _active={{
                transform: "scale(0.98)",
              }}
            >
              Instalar Agora
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              w="full"
              onClick={onPWAModalClose}
              color="gray.500"
              _hover={{ bg: "gray.100" }}
            >
              Talvez depois
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}

export default AgendaAdmin
