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
} from '@chakra-ui/react'
import type { ResponsiveValue } from '@chakra-ui/react'

const AgendaAdmin = () => {
  const [currentView, setCurrentView] = useState("dashboard")
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedProfessional, setSelectedProfessional] = useState("todos")
  const [showFilters, setShowFilters] = useState(false)

  // Modal states
  const { onOpen: onDayModalOpen } = useDisclosure()

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
    if ((tipoPlano === 'individual' || tipoPlano === 'gratis') && !pathname.endsWith('/agenda')) {
      navigate(`/dashboard/${auth.currentUser?.uid}`);
    }
    if (!isPremium) {
      navigate(`/dashboard/${auth.currentUser?.uid}`);
    }
  }, [tipoPlano, isPremium, navigate, auth.currentUser]);

  // Função para abrir modal do dia
  const handleDayClick = () => {
    onDayModalOpen()
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
      </Box>

      {/* Main Content */}
      <Container maxW="container.xl" py={6} minH="calc(100vh - 140px)">
        {currentView === "dashboard" && (
          <VStack spacing={6} align="stretch" minH="calc(100vh - 200px)" h="full">
            {/* Stats Cards */}
            <SimpleGrid columns={statsColumns} spacing={4}>
              <Card>
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
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<Download size={16} />}
                    >
                      Exportar
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
                      <Select size="sm">
                        <option value="todos">Todos</option>
                        <option value="confirmado">Confirmados</option>
                        <option value="agendado">Agendados</option>
                        <option value="finalizado">Finalizados</option>
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
                            <Tooltip label="Ver detalhes">
                              <IconButton
                                size={{ base: 'sm', md: 'md' }}
                                icon={<Eye size={16} />}
                                colorScheme="gray"
                                variant="ghost"
                                aria-label="Ver detalhes"
                              />
                            </Tooltip>
                            <Tooltip label="Editar">
                              <IconButton
                                size={{ base: 'sm', md: 'md' }}
                                icon={<Edit size={16} />}
                                colorScheme="gray"
                                variant="ghost"
                                aria-label="Editar"
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
                  <Button size="sm" colorScheme="blue" variant="solid">Mês</Button>
                  <Button size="sm" variant="outline">Semana</Button>
                  <Button size="sm" variant="outline">Dia</Button>
                </HStack>
              </Flex>
            </CardHeader>
            <CardBody>
              <Box overflowX="auto">
                <SimpleGrid columns={7} gap={{ base: 0.5, md: 1 }} minW={{ base: '280px', md: 'auto' }}>
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                    <Box 
                      key={day} 
                      p={{ base: 1, md: 2 }} 
                      textAlign="center" 
                      fontWeight="bold" 
                      color="gray.600"
                      fontSize={{ base: 'xs', md: 'sm' }}
                    >
                      {day}
                    </Box>
                  ))}
                  {getMonthDays(selectedDate).map((day, idx) => {
                    const dayISO = day.toISOString().split('T')[0];
                    const isToday = day.toDateString() === new Date().toDateString();
                    const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
                    const hasAppointments = agendamentos.some(a => a.date === dayISO);
                    return (
                      <Box
                        key={idx}
                        p={{ base: 1, md: 2 }}
                        textAlign="center"
                        cursor="pointer"
                        border={hasAppointments ? '2px solid' : '1px solid'}
                        borderColor={hasAppointments ? 'blue.500' : 'gray.200'}
                        bg={isToday ? 'blue.50' : 'white'}
                        color={!isCurrentMonth ? 'gray.400' : 'gray.700'}
                        borderRadius="md"
                        onClick={() => handleDayClick()}
                        _hover={{ bg: 'gray.50' }}
                        minH={{ base: '40px', md: '60px' }}
                        display="flex"
                        flexDirection="column"
                        justifyContent="center"
                        alignItems="center"
                      >
                        <Text fontSize={{ base: 'xs', md: 'sm' }}>{day.getDate()}</Text>
                        {hasAppointments && (
                          <Box w="3px" h="3px" bg="blue.500" borderRadius="full" mx="auto" mt={0.5} />
                        )}
                      </Box>
                    );
                  })}
                </SimpleGrid>
              </Box>
            </CardBody>
          </Card>
        )}
      </Container>
    </Box>
  )
}

export default AgendaAdmin