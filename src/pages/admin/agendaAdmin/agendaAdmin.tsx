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
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, getDoc, deleteDoc } from 'firebase/firestore'
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
    <Box minH="100vh" bg="gray.50" pb={8}>
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
      <Container maxW="container.xl" py={6} minH="calc(100vh - 140px)">
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
          <Card>
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
                        <Box key={idx} p={{ base: 1, md: 2 }} textAlign="center" cursor="pointer" border={hasAppointments ? '2px solid' : '1px solid'} borderColor={hasAppointments ? 'blue.500' : 'gray.200'} bg={isToday ? 'blue.50' : 'white'} color={!isCurrentMonth ? 'gray.400' : 'gray.700'} borderRadius="md" onClick={() => handleDayClick(dayISO)} _hover={{ bg: 'gray.50' }} minH={{ base: '40px', md: '60px' }} display="flex" flexDirection="column" justifyContent="center" alignItems="center">
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
                        <VStack key={i} align="stretch" p={2} border="1px" borderColor="gray.200" borderRadius="md" minH="100px" bg="white" spacing={1} onClick={()=> handleDayClick(key)} cursor="pointer">
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
    </Box>
  )
}

export default AgendaAdmin

// Modal de Detalhes
// Inserido ao fim do componente JSX principal