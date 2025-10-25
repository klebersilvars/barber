"use client"

import { useState, useEffect } from "react"
import {
  Calendar,
  Clock,
  Users,
  DollarSign,
  Filter,
  ChevronLeft,
  ChevronRight,
  Edit,
  Check,
  X,
  AlertTriangle,
  User,
  Star,
  BarChart3,
  Play as PlayIcon,
  MessageCircle,
} from "lucide-react"
import { firestore } from '../../../firebase/firebase'
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, getDoc, deleteDoc, getDocs, serverTimestamp } from 'firebase/firestore'
import { getAuth } from "firebase/auth"
import { useNavigate } from "react-router-dom"
import {
  Box,
  Flex,
  Text,
  Button,
  VStack,
  HStack,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Badge,
  Icon,
  useDisclosure,
  FormControl,
  FormLabel,
  Select,
  SimpleGrid,
  useToast,
  Container,
  IconButton,
  Tooltip,
  useBreakpointValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Input,
  Textarea,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react'
import type { ResponsiveValue } from '@chakra-ui/react'

const AgendaAdmin = () => {
  const [currentView, setCurrentView] = useState("calendar")
  const [calendarGranularity, setCalendarGranularity] = useState<'month'|'week'|'day'>('month')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedProfessional, setSelectedProfessional] = useState("todos")
  const [selectedStatus, setSelectedStatus] = useState("todos")
  const [showFilters, setShowFilters] = useState(false)

  // Modal states
  const { isOpen: isDayModalOpen, onOpen: onDayModalOpen, onClose: onDayModalClose } = useDisclosure()
  const {
    isOpen: isDetailsOpen,
    onOpen: onDetailsOpen,
    onClose: onDetailsClose,
  } = useDisclosure()
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null)
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null)

  const auth = getAuth()
  const navigate = useNavigate()
  const toast = useToast()

  // Agendamentos do Firestore
  const [agendamentos, setAgendamentos] = useState<any[]>([])

  // Profissionais ativos
  const [colaboradores, setColaboradores] = useState<any[]>([])
  const [colaboradoresLoading, setColaboradoresLoading] = useState(true)

  // Buscar nome do estabelecimento do admin logado
  const [estabelecimento, setEstabelecimento] = useState("")

  // Estados para agendamento manual (sistema de steps como atendente)
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
  const [services, setServices] = useState<any[]>([])
  const [submittingManualBooking, setSubmittingManualBooking] = useState(false)
  const [clientesEstab, setClientesEstab] = useState<any[]>([])
  const [clientesLoading, setClientesLoading] = useState(true)
  const [busyTimes, setBusyTimes] = useState<string[]>([])
  
  // Estados para sistema de alert
  const [alertMessage, setAlertMessage] = useState<string>("")
  const [alertType, setAlertType] = useState<"success" | "error" | "info" | "warning">("info")
  const [showAlert, setShowAlert] = useState<boolean>(false)

  // Função para mostrar alertas
  const showAlertMessage = (message: string, type: "success" | "error" | "info" | "warning") => {
    setAlertMessage(message)
    setAlertType(type)
    setShowAlert(true)
    setTimeout(() => setShowAlert(false), 5000)
  }

  // Available times
  const availableTimes = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30", "18:00", "18:30",
  ]
  
  // Responsive values
  const headerDirection = useBreakpointValue({ base: 'column', md: 'row' }) as ResponsiveValue<'row' | 'column'>
  const statsColumns = useBreakpointValue({ base: 1, md: 3 }) as ResponsiveValue<number>
  
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

  // Buscar agendamentos em tempo real
  useEffect(() => {
    if (!estabelecimento) return
    const agendamentosRef = collection(firestore, 'agendaAdmin')
    const q = query(agendamentosRef, where('nomeEstabelecimento', '==', estabelecimento))
    const unsub = onSnapshot(q, (snapshot) => {
      const agendamentosData = snapshot.docs.map(docSnap => {
        const data: any = docSnap.data()
        // Normalizar campo date para 'YYYY-MM-DD'
        let normalizedDate: string = ''
        const rawDate = data.date
        if (rawDate && typeof rawDate === 'string') {
          // Se vier como string, tentar cortar apenas a parte da data
          normalizedDate = rawDate.includes('T') ? rawDate.split('T')[0] : rawDate
        } else if (rawDate && typeof rawDate === 'object' && typeof rawDate.toDate === 'function') {
          const d: Date = rawDate.toDate()
          normalizedDate = formatLocalISODate(d)
        }
        return {
          id: docSnap.id,
          ...data,
          date: normalizedDate || data.date,
          status: data.status || 'agendado',
        }
      })
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

  // Buscar clientes do estabelecimento
  useEffect(() => {
    if (!estabelecimento) return
    setClientesLoading(true)
    const clientesRef = collection(firestore, 'clienteUser')
    const q = query(clientesRef, where('estabelecimento', '==', estabelecimento))
    const unsub = onSnapshot(q, (snapshot) => {
      setClientesEstab(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      setClientesLoading(false)
    })
    return () => unsub()
  }, [estabelecimento])

  // Buscar serviços do estabelecimento
  useEffect(() => {
    const fetchServices = async () => {
      if (!auth.currentUser?.uid) {
        return
      }
      try {
        // Primeiro tenta buscar pelo UID do proprietário
        const servicosRef = collection(firestore, "servicosAdmin")
        const servicosQuery = query(servicosRef, where("uidProprietario", "==", auth.currentUser.uid))
        const servicosSnapshot = await getDocs(servicosQuery)
        
        if (servicosSnapshot.empty) {
          // Se não encontrar pelo UID, tenta pelo email
          const servicosQueryEmail = query(servicosRef, where("emailProprietario", "==", auth.currentUser.email))
          const servicosSnapshotEmail = await getDocs(servicosQueryEmail)
          const servicosData = servicosSnapshotEmail.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data()
          }))
          setServices(servicosData)
        } else {
          const servicosData = servicosSnapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data()
          }))
          setServices(servicosData)
        }
      } catch (error) {
        console.error("Erro ao buscar serviços:", error)
        setServices([])
      }
    }
    fetchServices()
  }, [auth.currentUser])

  // Buscar horários ocupados quando a data for selecionada
  useEffect(() => {
    const fetchBusyTimes = async () => {
      setBusyTimes([])
      if (!appointmentData.date || !estabelecimento) return
      try {
        const agendaRef = collection(firestore, 'agendaAdmin')
        const q = query(
          agendaRef,
          where('nomeEstabelecimento', '==', estabelecimento),
          where('date', '==', appointmentData.date)
        )
        const snapshot = await getDocs(q)
        const times = snapshot.docs.map((doc: any) => doc.data().time)
        setBusyTimes(times)
      } catch (err) {
        setBusyTimes([])
      }
    }
    fetchBusyTimes()
  }, [appointmentData.date, estabelecimento])


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
    if ((tipoPlano === 'individual' || tipoPlano === 'gratis') && !pathname.endsWith('/agenda')) {
      navigate(`/dashboard/${auth.currentUser?.uid}`);
    }
    if (!isPremium) {
      navigate(`/dashboard/${auth.currentUser?.uid}`);
    }
  }, [tipoPlano, isPremium, navigate, auth.currentUser]);

  // Função para abrir modal do dia
  const [selectedDayISO, setSelectedDayISO] = useState<string | null>(null)
  const handleDayClick = (dayISO: string) => {
    setSelectedDayISO(dayISO)
    onDayModalOpen()
  }

  // Assinar em tempo real o agendamento selecionado
  useEffect(() => {
    if (!selectedAppointmentId) return
    const ref = doc(firestore, 'agendaAdmin', selectedAppointmentId)
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data: any = snap.data()
        let normalizedDate = data.date
        if (normalizedDate && typeof normalizedDate === 'object' && typeof normalizedDate.toDate === 'function') {
          normalizedDate = formatLocalISODate(data.date.toDate())
        }
        setSelectedAppointment({ id: snap.id, ...data, date: normalizedDate })
      }
    })
    return () => unsub()
  }, [selectedAppointmentId])

  const openDetails = (id: string) => {
    setSelectedAppointmentId(id)
    onDetailsOpen()
  }

  const handleUpdateAppointment = async () => {
    if (!selectedAppointment?.id) return
    try {
      const ref = doc(firestore, 'agendaAdmin', selectedAppointment.id)
      const payload: any = { ...selectedAppointment }
      delete payload.id
      await updateDoc(ref, payload)
      alert('Agendamento atualizado com sucesso!')
      // toast({
      //   position: 'top-right',
      //   duration: 3500,
      //   isClosable: true,
      //   render: ({ onClose }) => (
      //     <Alert status="success" variant="subtle" borderRadius="md" boxShadow="lg">
      //       <AlertIcon />
      //       <Box>
      //         <AlertTitle>Agendamento atualizado</AlertTitle>
      //         <AlertDescription>As alterações foram salvas com sucesso!</AlertDescription>
      //       </Box>
      //       <CloseButton position="absolute" right="8px" top="8px" onClick={onClose} />
      //     </Alert>
      //   ),
      // })
      onDetailsClose()
    } catch (error: any) {
      alert('Erro ao atualizar o agendamento, tente novamente mais tarde!')
      // toast({
      //   position: 'top-right',
      //   duration: 5000,
      //   isClosable: true,
      //   render: ({ onClose }) => (
      //     <Alert status="error" variant="subtle" borderRadius="md" boxShadow="lg">
      //       <AlertIcon />
      //       <Box>
      //         <AlertTitle>Erro ao salvar</AlertTitle>
      //         <AlertDescription>{`Não foi possível salvar as alterações. ${error?.message || error}`}</AlertDescription>
      //       </Box>
      //       <CloseButton position="absolute" right="8px" top="8px" onClick={onClose} />
      //     </Alert>
      //   ),
      // })
    }
    
  }

  // Utilitário para formatar data local (YYYY-MM-DD) sem deslocamento de fuso
  const formatLocalISODate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Mock data
  const todayISO = formatLocalISODate(new Date(selectedDate))
  const todayAppointments = agendamentos.filter(a => {
    const isSameDay = a.date === todayISO
    const professionalOk = selectedProfessional === 'todos' ? true : a.professional === selectedProfessional
    const statusOk = selectedStatus === 'todos' ? true : a.status === selectedStatus
    return isSameDay && professionalOk && statusOk
  })
  const receitaPrevistaHoje = todayAppointments.reduce((sum, a) => sum + (a.price || 0), 0)
  const confirmadosHoje = todayAppointments.filter(a => a.status === 'confirmado').length
  const pendentesHoje = todayAppointments.filter(a => a.status !== 'confirmado').length
  // Helpers para Semana/Dia
  const getStartOfWeek = (d: Date) => {
    const day = d.getDay()
    const diff = d.getDate() - day
    return new Date(d.getFullYear(), d.getMonth(), diff)
  }
  const weekDays = (() => {
    const start = getStartOfWeek(selectedDate)
    return Array.from({ length: 7 }).map((_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i))
  })()
  const weekAppointmentsByDay: Record<string, any[]> = weekDays.reduce((acc, day) => {
    const key = formatLocalISODate(day)
    acc[key] = agendamentos.filter(a => a.date === key)
    return acc
  }, {} as Record<string, any[]>)

  const dayHours = Array.from({ length: 12 }).map((_, i) => `${String(i + 8).padStart(2, '0')}:00`)
  const dayMinHeightPx = `${dayHours.length * 62}px`
  const dayAppointmentsByHour: Record<string, any[]> = dayHours.reduce((acc, h) => {
    acc[h] = todayAppointments.filter(a => (a.time || '').startsWith(h.slice(0,2)))
    return acc
  }, {} as Record<string, any[]>)

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
    await updateDoc(doc(firestore, 'agendaAdmin', id), { status: 'finalizado' })
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
      toast({
        title: "Agendamento excluído",
        description: "Agendamento foi excluído com sucesso!",
        status: "success",
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: `Erro ao excluir agendamento: ${error}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    }
  }

  // Funções para agendamento manual (sistema de steps)
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
    if (submittingManualBooking) return
    
    try {
      setSubmittingManualBooking(true)
      
      // Validar dados obrigatórios
      if (!appointmentData.clientId || !appointmentData.service || 
          !appointmentData.professional || !appointmentData.date || !appointmentData.time) {
        toast({
          title: "Erro",
          description: "Preencha todos os campos obrigatórios",
          status: "error",
          duration: 3000,
          isClosable: true,
        })
        return
      }

      const servicoSelecionado = services.find(s => s.nomeServico === appointmentData.service)
      if (!servicoSelecionado) {
        toast({
          title: "Erro",
          description: "Serviço não encontrado!",
          status: "error",
          duration: 3000,
          isClosable: true,
        })
        return
      }

      const emailProprietario = servicoSelecionado?.emailProprietario || auth.currentUser?.email
      const uidProprietario = servicoSelecionado?.uidProprietario || auth.currentUser?.uid
      const nomeEstabelecimento = servicoSelecionado?.nomeEstabelecimento || estabelecimento
      const admin = [emailProprietario, uidProprietario, nomeEstabelecimento]

      const responsavel = [
        auth.currentUser?.email,
        auth.currentUser?.uid,
        estabelecimento
      ]

      const novoAgendamento = {
        ...appointmentData,
        admin,
        responsavel,
        nomeEstabelecimento: estabelecimento,
        createdAt: serverTimestamp()
      }

      await addDoc(collection(firestore, 'agendaAdmin'), novoAgendamento)
      
      showAlertMessage("Agendamento criado com sucesso!", "success")
      
      handleModalClose()
      
    } catch (error) {
      console.error("Erro ao salvar agendamento:", error)
      toast({
        title: "Erro",
        description: "Erro ao criar agendamento. Tente novamente.",
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setSubmittingManualBooking(false)
    }
  }

  // Profissionais habilitados para o serviço selecionado
  const profissionaisHabilitados = (() => {
    const servicoSelecionado = services.find((s) => s.nomeServico === appointmentData.service)
    if (servicoSelecionado && Array.isArray(servicoSelecionado.profissionaisServico)) {
      return servicoSelecionado.profissionaisServico
    }
    return []
  })()

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmado": return "green"
      case "agendado": return "yellow"
      case "finalizado": return "blue"
      case "cancelado": return "red"
      default: return "gray"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmado": return Check
      case "agendado": return Clock
      case "finalizado": return Star
      case "cancelado": return X
      default: return AlertTriangle
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date)
  }

  // Função para gerar os dias do mês
  function getMonthDays(date: Date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startDay = firstDayOfMonth.getDay();
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
    <Box minH="100vh" maxH="none" overflowY="auto" overflowX="hidden" bg="gray.50" pb={8} sx={{ WebkitOverflowScrolling: 'touch' }}>
      {/* Header */}
      <Box bg="white" borderBottom="1px" borderColor="gray.200" p={4} position="sticky" top={0} zIndex={100} boxShadow="sm">
        <Flex direction={headerDirection} align="center" justify="space-between" gap={4}>
          <Flex align="center" gap={3}>
            <Icon as={Calendar} boxSize={5} color="blue.500" />
            <Box>
              <Heading size="md">{formatDate(selectedDate)}</Heading>
              <Text fontSize="sm" color="gray.600">
                Hoje • {agendaHoje.length + historicoHoje.length} agendamentos
              </Text>
            </Box>
          </Flex>
          <Button
            colorScheme="blue"
            leftIcon={<Icon as={Calendar} boxSize={4} />}
            onClick={() => setShowAppointmentModal(true)}
            size="md"
            borderRadius="lg"
            fontWeight="600"
          >
            Novo Agendamento
          </Button>
        </Flex>
      </Box>

      {/* Navigation */}
      <Box bg="white" borderBottom="1px" borderColor="gray.200" px={4}>
        <HStack spacing={0}>
          <Button
            variant={currentView === "dashboard" ? "solid" : "ghost"}
            colorScheme={currentView === "dashboard" ? "blue" : "gray"}
            onClick={() => setCurrentView("dashboard")}
            leftIcon={<BarChart3 size={18} />}
            borderRadius="none"
            borderBottom={currentView === "dashboard" ? "2px solid" : "none"}
            borderColor="blue.500"
          >
            Dashboard
          </Button>
          <Button
            variant={currentView === "calendar" ? "solid" : "ghost"}
            colorScheme={currentView === "calendar" ? "blue" : "gray"}
            onClick={() => setCurrentView("calendar")}
            leftIcon={<Calendar size={18} />}
            borderRadius="none"
            borderBottom={currentView === "calendar" ? "2px solid" : "none"}
            borderColor="blue.500"
          >
            Calendário
          </Button>
        </HStack>
        {currentView === 'calendar' && (
          <HStack spacing={2} mt={2}>
            <Button size="sm" colorScheme={calendarGranularity==='month'?'blue':'gray'} variant={calendarGranularity==='month'?'solid':'outline'} onClick={()=>setCalendarGranularity('month')}>Mês</Button>
            <Button size="sm" colorScheme={calendarGranularity==='week'?'blue':'gray'} variant={calendarGranularity==='week'?'solid':'outline'} onClick={()=>setCalendarGranularity('week')}>Semana</Button>
            <Button size="sm" colorScheme={calendarGranularity==='day'?'blue':'gray'} variant={calendarGranularity==='day'?'solid':'outline'} onClick={()=>setCalendarGranularity('day')}>Dia</Button>
          </HStack>
        )}
      </Box>

      {/* Main Content */}
      <Container maxW="container.xl" py={6} minH="calc(100vh - 140px)" pb={16}>
        {/* Alert de feedback */}
        {showAlert && (
          <Alert status={alertType} maxW="600px" w="100%" mb={4}>
            <AlertIcon />
            <Box>
              <AlertTitle>{alertType === "success" ? "Sucesso!" : alertType === "error" ? "Erro!" : "Informação"}</AlertTitle>
              <AlertDescription>{alertMessage}</AlertDescription>
            </Box>
          </Alert>
        )}
        
        {currentView === "dashboard" && (
          <VStack spacing={6} align="stretch" minH="calc(100vh - 200px)" h="full">
            {/* Stats Cards */}
            <SimpleGrid columns={statsColumns} spacing={4}>
            <Card minH={calendarGranularity==='day' ? dayMinHeightPx : undefined}>
                <CardBody>
                  <Flex justify="space-between" align="center" mb={2}>
                    <Icon as={Calendar} boxSize={6} color="blue.500" />
                    <Badge colorScheme="green" variant="subtle">
                      +{todayAppointments.length * 10}%
                    </Badge>
                  </Flex>
                  <Heading size="lg">{todayAppointments.length}</Heading>
                  <Text color="gray.600">Agendamentos Hoje</Text>
                  <Text fontSize="sm" color="gray.500">
                    {confirmadosHoje} confirmados • {pendentesHoje} pendentes
                  </Text>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <Flex justify="space-between" align="center" mb={2}>
                    <Icon as={DollarSign} boxSize={6} color="green.500" />
                    <Badge colorScheme="green" variant="subtle">
                      +{receitaPrevistaHoje > 0 ? 8 : 0}%
                    </Badge>
                  </Flex>
                  <Heading size="lg">{formatCurrency(receitaPrevistaHoje)}</Heading>
                  <Text color="gray.600">Receita Prevista Hoje</Text>
                  <Text fontSize="sm" color="gray.500">
                    {formatCurrency(receitaConfirmadaHoje)} já confirmados
                  </Text>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <Flex justify="space-between" align="center" mb={2}>
                    <Icon as={Users} boxSize={6} color="purple.500" />
                    <Badge colorScheme="gray" variant="subtle">
                      {colaboradores.length}/{colaboradores.length}
                    </Badge>
                  </Flex>
                  <Heading size="lg">{colaboradores.length}</Heading>
                  <Text color="gray.600">Profissionais Ativos</Text>
                  <Text fontSize="sm" color="gray.500">
                    {colaboradoresLoading ? 'Carregando...' : `${colaboradores.length} cadastrados`}
                  </Text>
                </CardBody>
              </Card>
            </SimpleGrid>

            {/* Today's Schedule */}
            <Card flex={1} minH="400px">
              <CardHeader>
                <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'stretch', md: 'center' }} gap={3}>
                  <Heading size="md">Agenda de Hoje</Heading>
                  <HStack spacing={2} justify={{ base: 'center', md: 'flex-end' }}>
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<Filter size={16} />}
                      onClick={() => setShowFilters(!showFilters)}
                    >
                      Filtros
                    </Button>
                  </HStack>
                </Flex>
              </CardHeader>

              {showFilters && (
                <Box p={4} bg="gray.50" borderTop="1px" borderColor="gray.200">
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl>
                      <FormLabel fontSize="sm">Profissional:</FormLabel>
                      <Select
                        value={selectedProfessional}
                        onChange={(e) => setSelectedProfessional(e.target.value)}
                        size="sm"
                      >
                        <option value="todos">Todos</option>
                        {colaboradores.map((colab) => (
                          <option key={colab.id} value={colab.nome}>{colab.nome}</option>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="sm">Status:</FormLabel>
                      <Select size="sm" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                        <option value="todos">Todos</option>
                        <option value="confirmado">Confirmados</option>
                        <option value="agendado">Agendados</option>
                        <option value="finalizado">Finalizados</option>
                        <option value="em_andamento">Em andamento</option>
                      </Select>
                    </FormControl>
                  </SimpleGrid>
                </Box>
              )}

              <CardBody flex={1} overflowY="auto">
                <VStack spacing={3} align="stretch">
                  {agendaHoje.map((appointment) => (
                    <Box
                      key={appointment.id}
                      p={{ base: 3, md: 4 }}
                      border="1px"
                      borderColor="gray.200"
                      borderRadius="md"
                      bg="white"
                    >
                      <VStack spacing={3} align="stretch">
                        {/* Header com horário e status */}
                        <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'start', md: 'center' }} gap={2}>
                          <Flex align="center" gap={2}>
                            <Icon as={Clock} boxSize={4} color="gray.500" />
                            <Text fontWeight="medium" fontSize={{ base: 'sm', md: 'md' }}>{appointment.time}</Text>
                          </Flex>
                          <Badge colorScheme={getStatusColor(appointment.status)} size={{ base: 'sm', md: 'md' }}>
                            <Icon as={getStatusIcon(appointment.status)} boxSize={3} mr={1} />
                            {appointment.status}
                          </Badge>
                        </Flex>

                        {/* Informações do cliente */}
                        <Box>
                          <Heading size={{ base: 'sm', md: 'md' }} mb={1}>{appointment.clientName}</Heading>
                          <Text color="gray.600" mb={2} fontSize={{ base: 'sm', md: 'md' }}>{appointment.service}</Text>
                          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2} fontSize="sm" color="gray.500">
                            <HStack spacing={1}>
                              <Icon as={User} boxSize={3} />
                              <Text>{appointment.professional}</Text>
                            </HStack>
                            <HStack spacing={1}>
                              <Icon as={DollarSign} boxSize={3} />
                              <Text>{formatCurrency(appointment.price)}</Text>
                            </HStack>
                          </SimpleGrid>
                        </Box>

                        {/* Ações */}
                        <Flex direction={{ base: 'column', md: 'row' }} gap={2} justify="space-between" align={{ base: 'stretch', md: 'center' }}>
                          <HStack spacing={1} justify={{ base: 'center', md: 'flex-start' }} wrap="wrap">
                            {appointment.status !== 'em_andamento' && (
                              <Tooltip label="Iniciar Atendimento">
                                <IconButton
                                  size={{ base: 'sm', md: 'md' }}
                                  icon={<PlayIcon size={16} />}
                                  onClick={() => handleIniciarAtendimento(appointment.id)}
                                  colorScheme="blue"
                                  variant="ghost"
                                  aria-label="Iniciar Atendimento"
                                />
                              </Tooltip>
                            )}
                            {appointment.status === 'em_andamento' && (
                              <Tooltip label="Finalizar Atendimento">
                                <IconButton
                                  size={{ base: 'sm', md: 'md' }}
                                  icon={<Check size={16} />}
                                  onClick={() => handleFinalizarAtendimento(appointment.id)}
                                  colorScheme="green"
                                  variant="ghost"
                                  aria-label="Finalizar Atendimento"
                                />
                              </Tooltip>
                            )}
                            <Tooltip label="Editar">
                              <IconButton
                                size={{ base: 'sm', md: 'md' }}
                                icon={<Edit size={16} />}
                                colorScheme="gray"
                                variant="ghost"
                                aria-label="Ver detalhes"
                                onClick={() => openDetails(appointment.id)}
                              />
                            </Tooltip>
                          </HStack>
                          
                          <HStack spacing={1} justify={{ base: 'center', md: 'flex-end' }}>
                            <Tooltip label="WhatsApp">
                              <IconButton
                                size={{ base: 'sm', md: 'md' }}
                                icon={<MessageCircle size={16} />}
                                onClick={() => {
                                  const phone = appointment.clientPhone?.replace(/\D/g, '');
                                  if (!phone) {
                                    toast({
                                      title: "Erro",
                                      description: "Telefone do cliente não encontrado!",
                                      status: "error",
                                      duration: 3000,
                                      isClosable: true,
                                    });
                                    return;
                                  }
                                  const phoneWithCountry = phone.length === 11 ? `55${phone}` : phone;
                                  const message = 'Olá, tudo bem? vim aqui para confirmar o seu agendamento de hoje, posso contar com a sua presença?';
                                  const whatsappUrl = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
                                  window.open(whatsappUrl, '_blank');
                                }}
                                colorScheme="green"
                                variant="ghost"
                                aria-label="WhatsApp"
                              />
                            </Tooltip>
                            <Tooltip label="Excluir Agendamento">
                              <IconButton
                                size={{ base: 'sm', md: 'md' }}
                                icon={<X size={16} />}
                                onClick={() => handleExcluirAgendamento(appointment.id)}
                                colorScheme="red"
                                variant="ghost"
                                aria-label="Excluir Agendamento"
                              />
                            </Tooltip>
                          </HStack>
                        </Flex>
                      </VStack>
                    </Box>
                  ))}
                </VStack>
              </CardBody>
            </Card>

            {/* Histórico de Atendimento do Dia */}
            {historicoHoje.length > 0 && (
              <Card>
                <CardHeader>
                  <Heading size="md">Histórico de Atendimento do Dia</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={3} align="stretch">
                    {historicoHoje.map((appointment) => (
                      <Box
                        key={appointment.id}
                        p={{ base: 3, md: 4 }}
                        border="1px"
                        borderColor="gray.200"
                        borderRadius="md"
                        bg="gray.50"
                      >
                        <VStack spacing={3} align="stretch">
                          <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'start', md: 'center' }} gap={2}>
                            <Flex align="center" gap={2}>
                              <Icon as={Clock} boxSize={4} color="gray.500" />
                              <Text fontWeight="medium" fontSize={{ base: 'sm', md: 'md' }}>{appointment.time}</Text>
                            </Flex>
                            <Badge colorScheme="blue" size={{ base: 'sm', md: 'md' }}>
                              <Icon as={Check} boxSize={3} mr={1} />
                              Finalizado
                            </Badge>
                          </Flex>

                          <Box>
                            <Heading size={{ base: 'sm', md: 'md' }} mb={1}>{appointment.clientName}</Heading>
                            <Text color="gray.600" mb={2} fontSize={{ base: 'sm', md: 'md' }}>{appointment.service}</Text>
                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2} fontSize="sm" color="gray.500">
                              <HStack spacing={1}>
                                <Icon as={User} boxSize={3} />
                                <Text>{appointment.professional}</Text>
                              </HStack>
                              <HStack spacing={1}>
                                <Icon as={DollarSign} boxSize={3} />
                                <Text>{formatCurrency(appointment.price)}</Text>
                              </HStack>
                            </SimpleGrid>
                          </Box>
                        </VStack>
                      </Box>
                    ))}
                  </VStack>
                </CardBody>
              </Card>
            )}
          </VStack>
        )}

        {currentView === "calendar" && (
          <Card minH="600px">
            <CardHeader>
              <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'stretch', md: 'center' }} gap={4}>
                <HStack spacing={4} justify={{ base: 'center', md: 'flex-start' }}>
                  <IconButton
                    icon={<ChevronLeft size={20} />}
                    onClick={handlePrevMonth}
                    variant="outline"
                    size="sm"
                    aria-label="Mês anterior"
                  />
                  <Heading size={{ base: 'sm', md: 'md' }}>{formatDate(selectedDate)}</Heading>
                  <IconButton
                    icon={<ChevronRight size={20} />}
                    onClick={handleNextMonth}
                    variant="outline"
                    size="sm"
                    aria-label="Próximo mês"
                  />
                </HStack>
                <HStack spacing={2} justify={{ base: 'center', md: 'flex-end' }}>
                  <Button size="sm" colorScheme={calendarGranularity==='month'?'blue':'gray'} variant={calendarGranularity==='month'?'solid':'outline'} onClick={()=>setCalendarGranularity('month')}>Mês</Button>
                  <Button size="sm" colorScheme={calendarGranularity==='week'?'blue':'gray'} variant={calendarGranularity==='week'?'solid':'outline'} onClick={()=>setCalendarGranularity('week')}>Semana</Button>
                  <Button size="sm" colorScheme={calendarGranularity==='day'?'blue':'gray'} variant={calendarGranularity==='day'?'solid':'outline'} onClick={()=>setCalendarGranularity('day')}>Dia</Button>
                </HStack>
              </Flex>
            </CardHeader>
            <CardBody>
              <Box overflowX="auto">
                {calendarGranularity === 'month' && (
                  <SimpleGrid columns={7} gap={{ base: 0.5, md: 1 }} minW={{ base: '280px', md: 'auto' }}>
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                      <Box key={day} p={{ base: 1, md: 2 }} textAlign="center" fontWeight="bold" color="gray.600" fontSize={{ base: 'xs', md: 'sm' }}>{day}</Box>
                    ))}
                    {getMonthDays(selectedDate).map((day, idx) => {
                      const dayISO = formatLocalISODate(day);
                      const isToday = day.toDateString() === new Date().toDateString();
                      const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
                      const hasAppointments = agendamentos.some(a => a.date === dayISO);
                      return (
                        <Box key={idx} p={{ base: 2, md: 3 }} textAlign="center" cursor="pointer" border={hasAppointments ? '2px solid' : '1px solid'} borderColor={hasAppointments ? 'blue.500' : 'gray.200'} bg={isToday ? 'blue.50' : 'white'} color={!isCurrentMonth ? 'gray.400' : 'gray.700'} borderRadius="md" onClick={() => handleDayClick(dayISO)} _hover={{ bg: 'gray.50' }} minH={{ base: '60px', md: '80px' }} display="flex" flexDirection="column" justifyContent="center" alignItems="center">
                          <Text fontSize={{ base: 'xs', md: 'sm' }}>{day.getDate()}</Text>
                          {hasAppointments && (<Box w="3px" h="3px" bg="blue.500" borderRadius="full" mx="auto" mt={0.5} />)}
                        </Box>
                      );
                    })}
                  </SimpleGrid>
                )}
                {calendarGranularity === 'week' && (
                  <SimpleGrid columns={7} gap={2}>
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                      <Box key={day} textAlign="center" fontWeight="bold" color="gray.600" fontSize="sm">{day}</Box>
                    ))}
                    {weekDays.map((day, i) => {
                      const key = formatLocalISODate(day)
                      const items = weekAppointmentsByDay[key]
                      return (
                        <VStack key={i} align="stretch" p={3} border="1px" borderColor="gray.200" borderRadius="md" minH="150px" bg="white" spacing={2} onClick={()=> handleDayClick(key)} cursor="pointer">
                          {items.length === 0 && (
                            <Text fontSize="xs" color="gray.400">Sem agendamentos</Text>
                          )}
                          {items.slice(0,3).map((a) => (
                            <HStack key={a.id} spacing={2} fontSize="xs" color="gray.700" justify="space-between">
                              <Text noOfLines={1}>{a.time || '--:--'}</Text>
                              <Text noOfLines={1}>{a.clientName || 'Cliente'}</Text>
                            </HStack>
                          ))}
                          {items.length > 3 && (
                            <Text fontSize="xs" color="blue.500">+{items.length - 3} mais</Text>
                          )}
                        </VStack>
                      )
                    })}
                  </SimpleGrid>
                )}
                {calendarGranularity === 'day' && (
                  <Box maxH={{ base: '60vh', md: '70vh' }} overflowY="auto" pr={1} sx={{ WebkitOverflowScrolling: 'touch' }}>
                    <VStack align="stretch" spacing={2}>
                      {dayHours.map((h) => (
                        <Button key={h} variant="outline" justifyContent="space-between" onClick={()=> handleDayClick(formatLocalISODate(selectedDate))}>
                          <HStack spacing={2}>
                            <Text>{h}</Text>
                          </HStack>
                          <Badge colorScheme={dayAppointmentsByHour[h].length>0? 'blue':'gray'}>{dayAppointmentsByHour[h].length}</Badge>
                        </Button>
                      ))}
                    </VStack>
                  </Box>
                )}
              </Box>
            </CardBody>
          </Card>
        )}
      </Container>
      {/* Modal Agendamentos do Dia */}
      <Modal isOpen={isDayModalOpen} onClose={onDayModalClose} size={{ base: 'full', md: 'lg' }} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Agendamentos do dia {selectedDayISO || ''}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={3} align="stretch">
              {(() => {
                const items = (selectedDayISO ? agendamentos.filter(a => a.date === selectedDayISO) : [])
                if (items.length === 0) return <Text color="gray.500">Nenhum agendamento para este dia.</Text>
                return items
                  .sort((a:any,b:any)=> String(a.time||'').localeCompare(String(b.time||'')))
                  .map((a:any) => (
                    <Box key={a.id} p={3} border="1px" borderColor="gray.200" borderRadius="md" bg="white">
                      <Flex justify="space-between" align="center" mb={1}>
                        <HStack>
                          <Icon as={Clock} boxSize={4} color="gray.600" />
                          <Text fontWeight="semibold">{a.time || '--:--'}</Text>
                        </HStack>
                        <Badge colorScheme={a.status==='confirmado'?'green': a.status==='finalizado'?'blue': a.status==='em_andamento'?'yellow':'gray'}>{a.status || 'agendado'}</Badge>
                      </Flex>
                      <Text fontWeight="medium">{a.clientName || 'Cliente'}</Text>
                      <Text color="gray.600">{a.service || 'Serviço'}</Text>
                      <HStack spacing={3} mt={1} color="gray.500" fontSize="sm">
                        <HStack><Icon as={User} boxSize={3} /><Text>{a.professional || '-'}</Text></HStack>
                        <HStack><Icon as={DollarSign} boxSize={3} /><Text>{typeof a.price==='number'? formatCurrency(a.price): '-'}</Text></HStack>
                      </HStack>
                    </Box>
                  ))
              })()}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onDayModalClose}>Fechar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      {/* Modal Detalhes do Agendamento */}
      <Modal isOpen={isDetailsOpen} onClose={onDetailsClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Detalhes do Agendamento</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedAppointment && (
              <VStack spacing={3} align="stretch">
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                  <FormControl>
                    <FormLabel>Cliente</FormLabel>
                    <Input
                      value={selectedAppointment.clientName || ''}
                      onChange={(e) => setSelectedAppointment((p: any) => ({ ...p, clientName: e.target.value }))}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>WhatsApp</FormLabel>
                    <Input
                      value={selectedAppointment.clientPhone || ''}
                      onChange={(e) => setSelectedAppointment((p: any) => ({ ...p, clientPhone: e.target.value.replace(/\D/g, '') }))}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Serviço</FormLabel>
                    <Input
                      value={selectedAppointment.service || ''}
                      onChange={(e) => setSelectedAppointment((p: any) => ({ ...p, service: e.target.value }))}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Profissional</FormLabel>
                    <Select
                      value={selectedAppointment.professional || ''}
                      onChange={(e) => setSelectedAppointment((p: any) => ({ ...p, professional: e.target.value }))}
                    >
                      {(Array.isArray(selectedAppointment.profissionaisServico) && selectedAppointment.profissionaisServico.length > 0
                        ? selectedAppointment.profissionaisServico
                        : colaboradores.map((c: any) => c.nome)
                      ).map((nome: any) => (
                        <option key={String(nome)} value={String(nome)}>{String(nome)}</option>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel>Data</FormLabel>
                    <Input
                      type="date"
                      value={selectedAppointment.date || ''}
                      onChange={(e) => setSelectedAppointment((p: any) => ({ ...p, date: e.target.value }))}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Hora</FormLabel>
                    <Input
                      type="time"
                      value={selectedAppointment.time || ''}
                      onChange={(e) => setSelectedAppointment((p: any) => ({ ...p, time: e.target.value }))}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Preço (R$)</FormLabel>
                    <Input
                      type="number"
                      value={selectedAppointment.price ?? 0}
                      onChange={(e) => setSelectedAppointment((p: any) => ({ ...p, price: Number(e.target.value) }))}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Status</FormLabel>
                    <Select
                      value={selectedAppointment.status || 'agendado'}
                      onChange={(e) => setSelectedAppointment((p: any) => ({ ...p, status: e.target.value }))}
                    >
                      <option value="agendado">Agendado</option>
                      <option value="confirmado">Confirmado</option>
                      <option value="em_andamento">Em andamento</option>
                      <option value="finalizado">Finalizado</option>
                      <option value="cancelado">Cancelado</option>
                    </Select>
                  </FormControl>
                </SimpleGrid>
                <FormControl>
                  <FormLabel>Forma de pagamento</FormLabel>
                  <Input
                    value={selectedAppointment.paymentMethod || ''}
                    onChange={(e) => setSelectedAppointment((p: any) => ({ ...p, paymentMethod: e.target.value }))}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Observações</FormLabel>
                  <Textarea
                    rows={3}
                    value={selectedAppointment.notes || ''}
                    onChange={(e) => setSelectedAppointment((p: any) => ({ ...p, notes: e.target.value }))}
                  />
                </FormControl>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <HStack spacing={2}>
              <Button variant="ghost" onClick={onDetailsClose}>Fechar</Button>
              <Button colorScheme="blue" onClick={handleUpdateAppointment}>Salvar alterações</Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Agendamento (Sistema de Steps) */}
      {showAppointmentModal && (
        <Modal isOpen={showAppointmentModal} onClose={handleModalClose} size="6xl" isCentered>
        <ModalOverlay />
        <ModalContent maxH="90vh" overflowY="auto">
          <ModalHeader>
            <Flex align="center" gap={3}>
              <Icon as={Calendar} boxSize={6} color="blue.500" />
              <Box>
                <Heading size="lg">Novo Agendamento</Heading>
              </Box>
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {/* Step 1: Client Selection */}
            {modalStep === 1 && (
              <Box>
                <VStack spacing={6} align="stretch">
                  <Box textAlign="center">
                    <Heading size="lg" mb={2} color="gray.800">Selecione o Cliente</Heading>
                    <Text color="gray.600" fontSize="md">Escolha um cliente cadastrado para o agendamento</Text>
                  </Box>
                  
                  {clientesLoading ? (
                    <Box textAlign="center" py={8}>
                      <Text color="gray.500" fontSize="lg">Carregando clientes...</Text>
                    </Box>
                  ) : clientesEstab.length === 0 ? (
                    <Box textAlign="center" p={8} bg="orange.50" borderRadius="xl" border="1px solid" borderColor="orange.200">
                      <Text color="orange.700" mb={6} fontSize="lg" fontWeight="500">Nenhum cliente cadastrado.</Text>
                      <Button colorScheme="orange" size="lg" onClick={() => navigate('/clientes')} borderRadius="lg">
                        Cadastrar Cliente
                      </Button>
                    </Box>
                  ) : (
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      {clientesEstab.map((cliente) => (
                        <Button
                          key={cliente.id}
                          variant={appointmentData.clientId === cliente.id ? "solid" : "outline"}
                          colorScheme={appointmentData.clientId === cliente.id ? "blue" : "gray"}
                          onClick={() => setAppointmentData(prev => ({
                            ...prev,
                            clientId: cliente.id,
                            clientName: cliente.nome,
                            clientPhone: cliente.telefone,
                            clientEmail: cliente.email,
                          }))}
                          h="auto"
                          p={6}
                          textAlign="left"
                          justifyContent="flex-start"
                          borderRadius="xl"
                          borderWidth="2px"
                          _hover={{
                            transform: "translateY(-2px)",
                            boxShadow: "lg",
                          }}
                          _active={{
                            transform: "scale(0.98)",
                          }}
                        >
                          <VStack align="start" spacing={2} w="full">
                            <Text fontWeight="700" fontSize="md" color={appointmentData.clientId === cliente.id ? "white" : "gray.800"}>
                              {cliente.nome}
                            </Text>
                            <Text fontSize="sm" color={appointmentData.clientId === cliente.id ? "blue.100" : "gray.500"}>
                              {cliente.telefone}
                            </Text>
                            <Text fontSize="sm" color={appointmentData.clientId === cliente.id ? "blue.100" : "gray.500"}>
                              {cliente.email}
                            </Text>
                          </VStack>
                        </Button>
                      ))}
                    </SimpleGrid>
                  )}
                  
                  {!appointmentData.clientId && clientesEstab.length > 0 && (
                    <Box
                      bg="orange.50"
                      border="1px solid"
                      borderColor="orange.200"
                      borderRadius="lg"
                      p={4}
                      textAlign="center"
                    >
                      <Text fontSize="sm" color="orange.700" fontWeight="500">
                        ⚠️ Selecione um cliente para continuar
                      </Text>
                    </Box>
                  )}
                </VStack>
              </Box>
            )}

            {/* Step 2: Service Selection */}
            {modalStep === 2 && (
              <Box>
                <VStack spacing={6} align="stretch">
                  <Box textAlign="center">
                    <Heading size="lg" mb={2} color="gray.800">Escolha o Serviço</Heading>
                    <Text color="gray.600" fontSize="md">Selecione o serviço desejado para o agendamento</Text>
                  </Box>
                  
                  {services.length === 0 ? (
                    <Box textAlign="center" p={8} bg="orange.50" borderRadius="xl" border="1px solid" borderColor="orange.200">
                      <Text color="orange.700" mb={6} fontSize="lg" fontWeight="500">Nenhum serviço cadastrado para este estabelecimento.</Text>
                    </Box>
                  ) : (
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      {services.map((service) => (
                        <Button
                          key={service.id}
                          variant={appointmentData.service === service.nomeServico ? "solid" : "outline"}
                          colorScheme={appointmentData.service === service.nomeServico ? "blue" : "gray"}
                          onClick={() => setAppointmentData(prev => ({
                            ...prev,
                            service: service.nomeServico,
                            duration: service.duracaoServico,
                            price: service.valorServico,
                          }))}
                          h="auto"
                          p={6}
                          textAlign="left"
                          justifyContent="flex-start"
                          borderRadius="xl"
                          borderWidth="2px"
                          _hover={{
                            transform: "translateY(-2px)",
                            boxShadow: "lg",
                          }}
                          _active={{
                            transform: "scale(0.98)",
                          }}
                        >
                          <VStack align="start" spacing={3} w="full">
                            <Text fontWeight="700" fontSize="md" color={appointmentData.service === service.nomeServico ? "white" : "gray.800"}>
                              {service.nomeServico}
                            </Text>
                            <Text fontSize="sm" color={appointmentData.service === service.nomeServico ? "blue.100" : "gray.500"}>
                              {service.categoriaServico}
                            </Text>
                            <HStack justify="space-between" w="full" mt={2}>
                              <HStack spacing={1}>
                                <Text fontSize="sm" color={appointmentData.service === service.nomeServico ? "blue.100" : "gray.500"}>
                                  {service.duracaoServico} min
                                </Text>
                              </HStack>
                              <Text fontSize="lg" fontWeight="700" color={appointmentData.service === service.nomeServico ? "blue.100" : "green.600"}>
                                {formatCurrency(service.valorServico)}
                              </Text>
                            </HStack>
                          </VStack>
                        </Button>
                      ))}
                    </SimpleGrid>
                  )}
                  
                  {!appointmentData.service && services.length > 0 && (
                    <Box
                      bg="orange.50"
                      border="1px solid"
                      borderColor="orange.200"
                      borderRadius="lg"
                      p={4}
                      textAlign="center"
                    >
                      <Text fontSize="sm" color="orange.700" fontWeight="500">
                        ⚠️ Selecione um serviço para continuar
                      </Text>
                    </Box>
                  )}
                </VStack>
              </Box>
            )}

            {/* Step 3: Professional & Date/Time */}
            {modalStep === 3 && (
              <Box>
                <VStack spacing={6} align="stretch">
                  <Box textAlign="center">
                    <Heading size="lg" mb={2} color="gray.800">Data, Hora e Profissional</Heading>
                    <Text color="gray.600" fontSize="md">Escolha quando e com quem realizar o agendamento</Text>
                  </Box>
                  
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    <Box>
                      <Text fontSize="md" fontWeight="600" color="gray.700" mb={3}>
                        Profissional *
                      </Text>
                      <Select
                        value={appointmentData.professional}
                        onChange={(e) => setAppointmentData(prev => ({ ...prev, professional: e.target.value }))}
                        placeholder="Selecione um profissional"
                        size="lg"
                        borderRadius="lg"
                        borderColor={!appointmentData.professional ? "red.300" : "gray.300"}
                        _focus={{
                          borderColor: !appointmentData.professional ? "red.500" : "blue.500",
                          boxShadow: !appointmentData.professional ? "0 0 0 1px #E53E3E" : "0 0 0 1px #3182CE",
                        }}
                        _hover={{
                          borderColor: !appointmentData.professional ? "red.400" : "gray.400",
                        }}
                      >
                        {profissionaisHabilitados.map((prof: string, idx: number) => (
                          <option key={idx} value={prof}>{prof}</option>
                        ))}
                      </Select>
                      {!appointmentData.professional && (
                        <Text fontSize="sm" color="red.500" mt={1}>
                          Selecione um profissional para continuar
                        </Text>
                      )}
                    </Box>
                    
                    <Box>
                      <Text fontSize="md" fontWeight="600" color="gray.700" mb={3}>
                        Data *
                      </Text>
                      <Input
                        type="date"
                        value={appointmentData.date}
                        onChange={(e) => setAppointmentData(prev => ({ ...prev, date: e.target.value }))}
                        min={new Date().toISOString().split("T")[0]}
                        size="lg"
                        borderRadius="lg"
                        borderColor={!appointmentData.date ? "red.300" : "gray.300"}
                        _focus={{
                          borderColor: !appointmentData.date ? "red.500" : "blue.500",
                          boxShadow: !appointmentData.date ? "0 0 0 1px #E53E3E" : "0 0 0 1px #3182CE",
                        }}
                        _hover={{
                          borderColor: !appointmentData.date ? "red.400" : "gray.400",
                        }}
                      />
                      {!appointmentData.date && (
                        <Text fontSize="sm" color="red.500" mt={1}>
                          Selecione uma data para continuar
                        </Text>
                      )}
                    </Box>
                  </SimpleGrid>
                  
                  {appointmentData.date && (
                    <Box>
                      <Text fontSize="md" fontWeight="600" color="gray.700" mb={4}>
                        Horários Disponíveis *
                      </Text>
                      <SimpleGrid columns={{ base: 3, md: 4, lg: 6 }} spacing={3}>
                        {availableTimes.map((time) => {
                          const isOcupado = busyTimes.includes(time)
                          const isSelected = appointmentData.time === time
                          
                          return (
                            <Button
                              key={time}
                              size="lg"
                              variant={isSelected ? "solid" : "outline"}
                              colorScheme={isSelected ? "blue" : "gray"}
                              onClick={() => !isOcupado && setAppointmentData(prev => ({ ...prev, time }))}
                              disabled={isOcupado}
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
                                transform: isOcupado ? "none" : "translateY(-2px)",
                                boxShadow: isOcupado ? "none" : "lg",
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
                                {isOcupado && (
                                  <Badge
                                    colorScheme="red"
                                    size="sm"
                                    position="absolute"
                                    top={1}
                                    right={1}
                                    borderRadius="full"
                                    fontSize="xs"
                                  >
                                    Ocupado
                                  </Badge>
                                )}
                              </VStack>
                            </Button>
                          )
                        })}
                      </SimpleGrid>
                      
                      {!appointmentData.time && appointmentData.date && (
                        <Box
                          bg="orange.50"
                          border="1px solid"
                          borderColor="orange.200"
                          borderRadius="lg"
                          p={4}
                          textAlign="center"
                          mt={4}
                        >
                          <Text fontSize="sm" color="orange.700" fontWeight="500">
                            ⚠️ Selecione um horário para continuar
                          </Text>
                        </Box>
                      )}
                    </Box>
                  )}

                  {!appointmentData.date && (
                    <Box
                      bg="orange.50"
                      border="1px solid"
                      borderColor="orange.200"
                      borderRadius="lg"
                      p={4}
                      textAlign="center"
                    >
                      <Text fontSize="sm" color="orange.700" fontWeight="500">
                        ⚠️ Selecione uma data para ver os horários disponíveis
                      </Text>
                    </Box>
                  )}
                </VStack>
              </Box>
            )}

            {/* Step 4: Confirmation */}
            {modalStep === 4 && (
              <Box>
                <VStack spacing={6} align="stretch">
                  <Box textAlign="center">
                    <Heading size="lg" mb={2} color="gray.800">Confirmação</Heading>
                    <Text color="gray.600" fontSize="md">Revise os dados e finalize o agendamento</Text>
                  </Box>
                  
                  <Box bg="blue.50" border="2px solid" borderColor="blue.200" borderRadius="xl" p={6} boxShadow="md">
                    <Heading size="md" mb={4} color="blue.700">
                      Resumo do Agendamento
                    </Heading>
                    <VStack spacing={3} align="stretch">
                      <HStack justify="space-between" p={3} bg="white" borderRadius="lg" border="1px solid" borderColor="blue.100">
                        <Text fontSize="md" color="gray.600" fontWeight="500">Cliente:</Text>
                        <Text fontSize="md" fontWeight="600" color="gray.800">{appointmentData.clientName}</Text>
                      </HStack>
                      <HStack justify="space-between" p={3} bg="white" borderRadius="lg" border="1px solid" borderColor="blue.100">
                        <Text fontSize="md" color="gray.600" fontWeight="500">Serviço:</Text>
                        <Text fontSize="md" fontWeight="600" color="gray.800">{appointmentData.service}</Text>
                      </HStack>
                      <HStack justify="space-between" p={3} bg="white" borderRadius="lg" border="1px solid" borderColor="blue.100">
                        <Text fontSize="md" color="gray.600" fontWeight="500">Profissional:</Text>
                        <Text fontSize="md" fontWeight="600" color="gray.800">{appointmentData.professional}</Text>
                      </HStack>
                      <HStack justify="space-between" p={3} bg="white" borderRadius="lg" border="1px solid" borderColor="blue.100">
                        <Text fontSize="md" color="gray.600" fontWeight="500">Data:</Text>
                        <Text fontSize="md" fontWeight="600" color="gray.800">
                          {appointmentData.date ? new Date(appointmentData.date).toLocaleDateString("pt-BR") : ""}
                        </Text>
                      </HStack>
                      <HStack justify="space-between" p={3} bg="white" borderRadius="lg" border="1px solid" borderColor="blue.100">
                        <Text fontSize="md" color="gray.600" fontWeight="500">Horário:</Text>
                        <Text fontSize="md" fontWeight="600" color="gray.800">{appointmentData.time}</Text>
                      </HStack>
                      <HStack justify="space-between" p={3} bg="green.50" borderRadius="lg" border="2px solid" borderColor="green.200">
                        <Text fontSize="lg" color="gray.700" fontWeight="600">Valor Total:</Text>
                        <Text fontSize="xl" fontWeight="700" color="green.600">
                          {formatCurrency(appointmentData.price)}
                        </Text>
                      </HStack>
                    </VStack>
                  </Box>
                  
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    <Box>
                      <Text fontSize="md" fontWeight="600" color="gray.700" mb={3}>
                        Forma de Pagamento
                      </Text>
                      <Select
                        value={appointmentData.paymentMethod}
                        onChange={(e) => setAppointmentData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                        size="lg"
                        borderRadius="lg"
                        borderColor="gray.300"
                        _focus={{
                          borderColor: "blue.500",
                          boxShadow: "0 0 0 1px #3182CE",
                        }}
                        _hover={{
                          borderColor: "gray.400",
                        }}
                      >
                        <option value="">Definir no atendimento</option>
                        <option value="dinheiro">Dinheiro</option>
                        <option value="pix">PIX</option>
                        <option value="cartao">Cartão</option>
                      </Select>
                    </Box>
                    <Box>
                      <Text fontSize="md" fontWeight="600" color="gray.700" mb={3}>
                        Observações
                      </Text>
                      <Textarea
                        value={appointmentData.notes}
                        onChange={(e) => setAppointmentData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Observações especiais sobre o agendamento..."
                        rows={4}
                        size="lg"
                        borderRadius="lg"
                        borderColor="gray.300"
                        _focus={{
                          borderColor: "blue.500",
                          boxShadow: "0 0 0 1px #3182CE",
                        }}
                        _hover={{
                          borderColor: "gray.400",
                        }}
                      />
                    </Box>
                  </SimpleGrid>
                </VStack>
              </Box>
            )}
          </ModalBody>
          <ModalFooter bg="gray.50" borderTop="1px solid" borderColor="gray.200" py={6}>
            <HStack spacing={4} w="full" justify="space-between">
              <HStack spacing={3}>
                {modalStep > 1 && (
                  <Button 
                    variant="outline" 
                    onClick={handlePrevStep}
                    size="lg"
                    borderRadius="lg"
                    fontWeight="600"
                    colorScheme="gray"
                    leftIcon={<Icon as={ChevronLeft} boxSize={4} />}
                  >
                    Voltar
                  </Button>
                )}
              </HStack>
              
              {modalStep < 4 ? (
                <Button
                  colorScheme="blue"
                  onClick={handleNextStep}
                  size="lg"
                  borderRadius="lg"
                  fontWeight="600"
                  rightIcon={<Icon as={ChevronRight} boxSize={4} />}
                  isDisabled={
                    (modalStep === 1 && !appointmentData.clientId) ||
                    (modalStep === 2 && !appointmentData.service) ||
                    (modalStep === 3 && (!appointmentData.professional || !appointmentData.date || !appointmentData.time))
                  }
                  _disabled={{
                    opacity: 0.5,
                    cursor: "not-allowed",
                    bg: "gray.300",
                    color: "gray.500",
                    _hover: {
                      bg: "gray.300",
                      transform: "none",
                      boxShadow: "none"
                    }
                  }}
                  _hover={{
                    transform: "translateY(-2px)",
                    boxShadow: "lg",
                  }}
                  _active={{
                    transform: "scale(0.98)",
                  }}
                >
                  Próximo
                </Button>
              ) : (
                <Button
                  colorScheme="green"
                  onClick={handleSubmitAppointment}
                  isLoading={submittingManualBooking}
                  loadingText="Criando..."
                  size="lg"
                  borderRadius="lg"
                  fontWeight="600"
                  rightIcon={<Icon as={Check} boxSize={4} />}
                  _hover={{
                    transform: "translateY(-2px)",
                    boxShadow: "lg",
                  }}
                  _active={{
                    transform: "scale(0.98)",
                  }}
                >
                  Confirmar Agendamento
                </Button>
              )}
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
      )}
    </Box>
  )
}

export default AgendaAdmin

// Modal de Detalhes
// Inserido ao fim do componente JSX principal