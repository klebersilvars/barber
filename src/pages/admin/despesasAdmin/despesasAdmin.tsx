"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Search,
  Plus,
  Filter,
  Download,
  DollarSign,
  Calendar,
  CreditCard,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  ArrowLeft,
  Trash2,
  Edit,
  Eye,
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  Tag,
  BarChart2,
  Lock,
  AlertTriangle,
} from "lucide-react"
import { firestore } from "../../../firebase/firebase"
import { collection, addDoc, getDocs, query, where, onSnapshot, deleteDoc, doc, updateDoc, Timestamp, getDoc } from "firebase/firestore"
import { useParams, useNavigate } from "react-router-dom"
import "./despesasAdmin.css"
import { getAuth } from "firebase/auth"
import {
  Box,
  Flex,
  Heading,
  Text,
  HStack,
  Button,
  Badge,
  SimpleGrid,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react'

interface Despesa {
  id: string
  descricao: string
  valor: number
  data: Date
  tipo: "fixa" | "variavel"
  categoria: string
  formaPagamento: string
  observacoes: string
  recorrente: boolean
  nomeEstabelecimento: string
  estabelecimentoUid: string
  emailAdmin: string
}

interface HistoricoMensal {
  mes: string
  ano: number
  totalDespesas: number
  despesasFixas: number
  despesasVariaveis: number
  receitaEstimada: number
  saldo: number
  status: "aberto" | "fechado"
  dataFechamento?: Date
  estabelecimentoUid: string
}

const DespesasAdmin = () => {
  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showCompareModal, setShowCompareModal] = useState(false)
  const [showEmptyMonthModal, setShowEmptyMonthModal] = useState(false)
  const [showCloseMonthModal, setShowCloseMonthModal] = useState(false)
  const [showEditEstimatesModal, setShowEditEstimatesModal] = useState(false)

  // Form and filter states
  const [selectedDespesa, setSelectedDespesa] = useState<Despesa | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [formStep, setFormStep] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [filterTipo, setFilterTipo] = useState("all")
  const [filterPayment, setFilterPayment] = useState("all")
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [historicoMensal, setHistoricoMensal] = useState<HistoricoMensal[]>([])
  const [receitaEstimada, setReceitaEstimada] = useState(4500)
  const [saldoEsperado, setSaldoEsperado] = useState(0)
  const { uid } = useParams()

  // Month navigation states
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [isCurrentMonth, setIsCurrentMonth] = useState(true)
  const [monthClosed, setMonthClosed] = useState(false)
  const [nomeEstabelecimento, setNomeEstabelecimento] = useState("")

  // Form states
  const [descricao, setDescricao] = useState("")
  const [valor, setValor] = useState("")
  const [data, setData] = useState("")
  const [tipo, setTipo] = useState<"fixa" | "variavel">("fixa")
  const [categoria, setCategoria] = useState("")
  const [formaPagamento, setFormaPagamento] = useState("")
  const [observacoes, setObservacoes] = useState("")
  const [recorrente, setRecorrente] = useState(false)

  // Filtragem de despesas
  const filteredDespesas = despesas.filter((despesa) => {
    const matchesSearch =
      despesa.descricao.toLowerCase().includes(searchQuery.toLowerCase()) ||
      despesa.categoria.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesTipo = filterTipo === "all" || despesa.tipo === filterTipo
    const matchesPayment = filterPayment === "all" || despesa.formaPagamento === filterPayment

    return matchesSearch && matchesTipo && matchesPayment
  })

  // Calculations
  const totalDespesas = filteredDespesas.reduce((sum, despesa) => sum + despesa.valor, 0)
  const despesasFixas = filteredDespesas
    .filter((d) => d.tipo === "fixa")
    .reduce((sum, despesa) => sum + despesa.valor, 0)
  const despesasVariaveis = filteredDespesas
    .filter((d) => d.tipo === "variavel")
    .reduce((sum, despesa) => sum + despesa.valor, 0)

  // Buscar nome do estabelecimento
  useEffect(() => {
    if (!uid) return
    const fetchEstabelecimento = async () => {
      const estabelecimentoRef = collection(firestore, "contas")
      const q = query(estabelecimentoRef, where("__name__", "==", uid))
      const snapshot = await getDocs(q)
      if (!snapshot.empty) {
        setNomeEstabelecimento(snapshot.docs[0].data().nomeEstabelecimento || "")
      }
    }
    fetchEstabelecimento()
  }, [uid])

  // Buscar despesas em tempo real
  useEffect(() => {
    if (!uid) return

    const despesasRef = collection(firestore, "despesasAdmin")
    const q = query(
      despesasRef,
      where("estabelecimentoUid", "==", uid),
      where("mes_cadastrado", "==", getMonthName(selectedMonth).toLowerCase())
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const despesasData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        data: doc.data().data.toDate(),
      })) as Despesa[]
      setDespesas(despesasData)
    })

    return () => unsubscribe()
  }, [uid, selectedMonth])

  // Buscar histórico mensal
  useEffect(() => {
    if (!uid) return

    const historicoRef = collection(firestore, "historicoDespesasAdmin")
    const q = query(
      historicoRef,
      where("estabelecimentoUid", "==", uid),
      where("mes", "==", getMonthName(selectedMonth))
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const historicoData = snapshot.docs.map((doc) => ({
        ...doc.data(),
        dataFechamento: doc.data().dataFechamento?.toDate(),
      })) as HistoricoMensal[]
      setHistoricoMensal(historicoData)
    })

    return () => unsubscribe()
  }, [uid, selectedMonth])

  // Verificar se é o mês atual
  useEffect(() => {
    const now = new Date()
    const isCurrent = now.getMonth() === selectedMonth && now.getFullYear() === selectedYear
    setIsCurrentMonth(isCurrent)

    // Se não for o mês atual, verificar se está fechado
    if (!isCurrent) {
      const mesFechado = historicoMensal.find(
        (h) => h.mes === getMonthName(selectedMonth) && h.ano === selectedYear && h.status === "fechado",
      )
      setMonthClosed(!!mesFechado)
    } else {
      // Se for o mês atual, nunca está fechado
      setMonthClosed(false)
    }
  }, [selectedMonth, selectedYear, historicoMensal])

  // Atualizar saldo esperado quando receita ou despesas mudarem
  useEffect(() => {
    setSaldoEsperado(receitaEstimada - totalDespesas)
  }, [receitaEstimada, totalDespesas])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const user = getAuth().currentUser
      if (!user || !uid) {
        alert("Erro: Usuário não autenticado")
        return
      }

      const dataObj = new Date(data)
      const novaDespesa = {
        descricao,
        valor: Number.parseFloat(valor),
        data: Timestamp.fromDate(dataObj),
        tipo,
        categoria,
        formaPagamento,
        observacoes,
        recorrente,
        nomeEstabelecimento,
        estabelecimentoUid: uid,
        emailAdmin: user.email,
        mes_cadastrado: getMonthName(dataObj.getMonth()).toLowerCase(),
      }

      await addDoc(collection(firestore, "despesasAdmin"), novaDespesa)
      alert("Despesa cadastrada com sucesso!")

      // Limpar campos
      setDescricao("")
      setValor("")
      setData("")
      setTipo("fixa")
      setCategoria("")
      setFormaPagamento("")
      setObservacoes("")
      setRecorrente(false)
      setFormStep(1)

      handleCloseModal()
    } catch (error) {
      console.error("Erro ao cadastrar despesa:", error)
      alert("Erro ao cadastrar despesa: " + error)
    }
  }

  const handleDeleteDespesa = async (despesaId: string) => {
    if (monthClosed) {
      alert("Este mês já foi fechado e não permite exclusões.")
      return
    }

    if (confirm("Tem certeza que deseja excluir esta despesa?")) {
      try {
        await deleteDoc(doc(firestore, "despesasAdmin", despesaId))
        alert("Despesa excluída com sucesso!")
      } catch (error) {
        console.error("Erro ao excluir despesa:", error)
        alert("Erro ao excluir despesa: " + error)
      }
    }
  }

  const handleUpdateDespesa = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDespesa) return

    try {
      const dataObj = new Date(data)
      const updatedDespesa = {
        descricao,
        valor: Number.parseFloat(valor),
        data: Timestamp.fromDate(dataObj),
        tipo,
        categoria,
        formaPagamento,
        observacoes,
        recorrente,
        nomeEstabelecimento,
        estabelecimentoUid: uid,
        emailAdmin: getAuth().currentUser?.email,
        mes_cadastrado: getMonthName(dataObj.getMonth()).toLowerCase(),
      }

      await updateDoc(doc(firestore, "despesasAdmin", selectedDespesa.id), updatedDespesa)
      alert("Despesa atualizada com sucesso!")
      setShowEditModal(false)
    } catch (error) {
      console.error("Erro ao atualizar despesa:", error)
      alert("Erro ao atualizar despesa: " + error)
    }
  }

  const handleCloseMonth = async () => {
    try {
      const totalDespesas = despesas.reduce((sum, d) => sum + d.valor, 0)
      const despesasFixas = despesas.filter((d) => d.tipo === "fixa").reduce((sum, d) => sum + d.valor, 0)
      const despesasVariaveis = despesas.filter((d) => d.tipo === "variavel").reduce((sum, d) => sum + d.valor, 0)

      const historicoMensal = {
        mes: getMonthName(selectedMonth),
        ano: selectedYear,
        totalDespesas,
        despesasFixas,
        despesasVariaveis,
        receitaEstimada,
        saldo: receitaEstimada - totalDespesas,
        status: "fechado" as const,
        dataFechamento: new Date(),
        estabelecimentoUid: uid,
      }

      await addDoc(collection(firestore, "historicoDespesasAdmin"), historicoMensal)
      setMonthClosed(true)
      setShowCloseMonthModal(false)
      alert("Mês fechado com sucesso! As despesas não poderão mais ser editadas ou excluídas.")
    } catch (error) {
      console.error("Erro ao fechar mês:", error)
      alert("Erro ao fechar mês: " + error)
    }
  }

  // Month navigation functions
  const goToPreviousMonth = () => {
    let newMonth = selectedMonth - 1
    let newYear = selectedYear

    if (newMonth < 0) {
      newMonth = 11
      newYear -= 1
    }

    setSelectedMonth(newMonth)
    setSelectedYear(newYear)
  }

  const goToNextMonth = () => {
    let newMonth = selectedMonth + 1
    let newYear = selectedYear

    if (newMonth > 11) {
      newMonth = 0
      newYear += 1
    }

    setSelectedMonth(newMonth)
    setSelectedYear(newYear)
  }

  const getMonthName = (month: number) => {
    const monthNames = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ]
    return monthNames[month]
  }

  const handleOpenModal = () => {
    setShowModal(true)
    setFormStep(1)

    // Set default date to current selected month
    const today = new Date()
    const defaultDate = new Date(selectedYear, selectedMonth, today.getDate())
    setData(defaultDate.toISOString().split("T")[0])

    // Reset other form fields
    setDescricao("")
    setValor("")
    setTipo("fixa")
    setCategoria("")
    setFormaPagamento("")
    setObservacoes("")
    setRecorrente(false)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setFormStep(1)
  }

  const handleNextStep = () => {
    setFormStep(formStep + 1)
  }

  const handlePrevStep = () => {
    setFormStep(formStep - 1)
  }

  const handleEditDespesa = (despesa: Despesa) => {
    if (monthClosed) {
      alert("Este mês já foi fechado e não permite edições.")
      return
    }

    setSelectedDespesa(despesa)
    setDescricao(despesa.descricao)
    setValor(despesa.valor.toString())
    setData(new Date(despesa.data).toISOString().split("T")[0])
    setTipo(despesa.tipo)
    setCategoria(despesa.categoria)
    setFormaPagamento(despesa.formaPagamento)
    setObservacoes(despesa.observacoes)
    setRecorrente(despesa.recorrente)
    setShowEditModal(true)
  }

  const handleViewDespesa = (despesa: Despesa) => {
    setSelectedDespesa(despesa)
    setShowViewModal(true)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date)
  }

  // Historical data for charts (mock)
  const handleUpdateEstimates = async () => {
    try {
      const mesAtual = getMonthName(selectedMonth)
      const anoAtual = selectedYear
      const historicoRef = collection(firestore, "historicoDespesasAdmin")
      const q = query(
        historicoRef,
        where("estabelecimentoUid", "==", uid),
        where("mes", "==", mesAtual),
        where("ano", "==", anoAtual),
      )
      const snapshot = await getDocs(q)

      if (!snapshot.empty) {
        const docRef = doc(firestore, "historicoDespesasAdmin", snapshot.docs[0].id)
        await updateDoc(docRef, {
          receitaEstimada,
          saldo: receitaEstimada - totalDespesas,
        })
      } else {
        // Criar novo registro se não existir
        const despesasFixas = despesas.filter((d) => d.tipo === "fixa").reduce((sum, d) => sum + d.valor, 0)
        const despesasVariaveis = despesas.filter((d) => d.tipo === "variavel").reduce((sum, d) => sum + d.valor, 0)

        await addDoc(historicoRef, {
          mes: mesAtual,
          ano: anoAtual,
          totalDespesas,
          despesasFixas,
          despesasVariaveis,
          receitaEstimada,
          saldo: receitaEstimada - totalDespesas,
          status: "aberto",
          estabelecimentoUid: uid,
        })
      }

      setShowEditEstimatesModal(false)
      alert("Valores atualizados com sucesso!")
    } catch (error) {
      console.error("Erro ao atualizar valores:", error)
      alert("Erro ao atualizar valores: " + error)
    }
  }

  const [tipoPlano, setTipoPlano] = useState<string | null>(null)
  const [isPremium, setIsPremium] = useState<boolean>(true)
  const navigate = useNavigate()
  const auth = getAuth()
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
    if (tipoPlano === 'individual' && !window.location.pathname.includes('despesasAdmin')) {
      navigate(`/dashboard/${auth.currentUser?.uid}`)
    }
    if (!isPremium) {
      navigate(`/dashboard/${auth.currentUser?.uid}`)
    }
  }, [tipoPlano, isPremium, navigate, auth.currentUser])

  return (
    <Box className="despesas-container" width="100%">
      {/* Header (Chakra UI) */}
      <Box bg={useColorModeValue('white','gray.800')} borderBottom="1px" borderColor={useColorModeValue('gray.200','gray.700')} px={4} py={4} width="100%">
          <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'stretch', md: 'center' }} gap={3} width="100%">
            <Box>
              <Heading size="lg">Gestão de Despesas</Heading>
              <Text color={useColorModeValue('gray.600','gray.300')}>Controle seus gastos e acompanhe o fluxo de caixa</Text>
            </Box>
            <HStack spacing={2} flexWrap="wrap" w="100%" justify={{ base: 'stretch', md: 'flex-end' }}>
              <Button size="sm" w={{ base: '100%', sm: 'auto' }} variant="outline" leftIcon={<Filter size={16} />} onClick={() => setShowFilters(!showFilters)}>
                Filtros
                <Badge ml={2} colorScheme="purple" variant="subtle">
                  {Object.values({ filterTipo, filterPayment }).filter((f) => f !== 'all').length || 0}
                </Badge>
              </Button>
              <Button size="sm" w={{ base: '100%', sm: 'auto' }} variant="outline" leftIcon={<Download size={16} />} onClick={() => setShowHistoryModal(true)}>Relatório</Button>
              <Button size="sm" w={{ base: '100%', sm: 'auto' }} colorScheme="purple" leftIcon={<Plus size={16} />} onClick={handleOpenModal} isDisabled={!isCurrentMonth && monthClosed}>Nova Despesa</Button>
            </HStack>
          </Flex>
      </Box>

      {/* Month Selector (Chakra) */}
      <Box px={4} py={4} width="100%">
        <Flex bg={useColorModeValue('white','gray.800')} border="1px" borderColor={useColorModeValue('gray.200','gray.700')} borderRadius="md" p={4} align="center" justify="space-between" wrap="wrap" gap={3}>
          <HStack flexWrap="wrap" gap={2}>
            <Button size="sm" w={{ base: '100%', sm: 'auto' }} variant="outline" onClick={goToPreviousMonth} leftIcon={<ChevronLeft size={18}/>}>Anterior</Button>
            <Box>
              <Heading size="md" textAlign="center">{getMonthName(selectedMonth)} {selectedYear}</Heading>
              <Text color={useColorModeValue('gray.600','gray.300')} textAlign="center">Despesas do mês</Text>
            </Box>
            <Button size="sm" w={{ base: '100%', sm: 'auto' }} variant="outline" onClick={goToNextMonth} rightIcon={<ChevronRight size={18}/>} isDisabled={selectedMonth === new Date().getMonth() && selectedYear === new Date().getFullYear()}>Próximo</Button>
            <Badge colorScheme={isCurrentMonth ? 'blue' : monthClosed ? 'red' : 'gray'} ml={2}>{isCurrentMonth ? 'MÊS ATUAL' : monthClosed ? 'MÊS FECHADO' : 'MÊS ANTERIOR'}</Badge>
          </HStack>
          <HStack flexWrap="wrap" justify={{ base: 'center', md: 'flex-end' }} gap={2}>
            <Button size="sm" w={{ base: '100%', sm: 'auto' }} variant="ghost" leftIcon={<Calendar size={16} />} onClick={() => setShowHistoryModal(true)}>Histórico</Button>
            <Button size="sm" w={{ base: '100%', sm: 'auto' }} variant="ghost" leftIcon={<BarChart2 size={16} />} onClick={() => setShowCompareModal(true)}>Comparar</Button>
          {!isCurrentMonth && !monthClosed && (
              <Button size="sm" w={{ base: '100%', sm: 'auto' }} colorScheme="red" variant="outline" leftIcon={<Lock size={16}/>} onClick={() => setShowCloseMonthModal(true)}>Fechar Mês</Button>
            )}
          </HStack>
        </Flex>
      </Box>

      {/* Stats Cards (Chakra) */}
      <Box px={4} py={2} width="100%">
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
          <Box border="1px" borderColor={useColorModeValue('gray.200','gray.700')} bg={useColorModeValue('white','gray.800')} borderRadius="md" p={4}>
            <Flex justify="space-between" align="center">
              <Box>
                <Text fontSize="sm" color={useColorModeValue('gray.600','gray.300')}>Total de Despesas</Text>
                <Heading size="md">{formatCurrency(totalDespesas)}</Heading>
                <Text fontSize="xs" color="red.500">-{((totalDespesas / receitaEstimada) * 100).toFixed(1)}%</Text>
              </Box>
              <TrendingDown size={28} color="#ef4444"/>
            </Flex>
          </Box>
          <Box border="1px" borderColor={useColorModeValue('gray.200','gray.700')} bg={useColorModeValue('white','gray.800')} borderRadius="md" p={4}>
            <Flex justify="space-between" align="center">
              <Box>
                <Text fontSize="sm" color={useColorModeValue('gray.600','gray.300')}>Receita Estimada</Text>
                <Heading size="md">{formatCurrency(receitaEstimada)}</Heading>
                <Button size="xs" variant="outline" mt={2} onClick={()=>setShowEditEstimatesModal(true)}>Editar</Button>
              </Box>
              <TrendingUp size={28} color="#22c55e"/>
            </Flex>
          </Box>
          <Box border="1px" borderColor={useColorModeValue('gray.200','gray.700')} bg={useColorModeValue('white','gray.800')} borderRadius="md" p={4}>
            <Flex justify="space-between" align="center">
              <Box>
                <Text fontSize="sm" color={useColorModeValue('gray.600','gray.300')}>Saldo do Mês</Text>
                <Heading size="md">{formatCurrency(saldoEsperado)}</Heading>
                <Text fontSize="xs" color={saldoEsperado>=0?'green.500':'red.500'}>
                  {saldoEsperado >= 0 ? '+' : ''}{((saldoEsperado / receitaEstimada) * 100).toFixed(1)}%
                </Text>
              </Box>
              <Wallet size={28} color="#3b82f6"/>
            </Flex>
          </Box>
          <Box border="1px" borderColor={useColorModeValue('gray.200','gray.700')} bg={useColorModeValue('white','gray.800')} borderRadius="md" p={4}>
            <Flex justify="space-between" align="center">
              <Box>
                <Text fontSize="sm" color={useColorModeValue('gray.600','gray.300')}>Gastos Fixos</Text>
                <Heading size="md">{formatCurrency(despesasFixas)}</Heading>
                <Text fontSize="xs" color={useColorModeValue('gray.600','gray.300')}>Variáveis: {formatCurrency(despesasVariaveis)}</Text>
              </Box>
              <Receipt size={28} color="#a855f7"/>
            </Flex>
          </Box>
        </SimpleGrid>
      </Box>

      {/* Filters (Chakra) */}
      {showFilters && (
        <Box px={4} py={2} width="100%">
          <Box bg={useColorModeValue('white','gray.800')} border="1px" borderColor={useColorModeValue('gray.200','gray.700')} borderRadius="md" p={4}>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <Box>
                <Text fontWeight="semibold" mb={2}>Tipo de Despesa</Text>
                <HStack>
                  <Button size="sm" variant={filterTipo==='all'?'solid':'outline'} colorScheme="purple" onClick={()=>setFilterTipo('all')}>Todas</Button>
                  <Button size="sm" variant={filterTipo==='fixa'?'solid':'outline'} colorScheme="purple" onClick={()=>setFilterTipo('fixa')}>Fixas</Button>
                  <Button size="sm" variant={filterTipo==='variavel'?'solid':'outline'} colorScheme="purple" onClick={()=>setFilterTipo('variavel')}>Variáveis</Button>
                </HStack>
              </Box>
              <Box>
                <Text fontWeight="semibold" mb={2}>Forma de Pagamento</Text>
                <HStack>
                  <Button size="sm" variant={filterPayment==='all'?'solid':'outline'} onClick={()=>setFilterPayment('all')}>Todas</Button>
                  <Button size="sm" variant={filterPayment==='PIX'?'solid':'outline'} onClick={()=>setFilterPayment('PIX')}>PIX</Button>
                  <Button size="sm" variant={filterPayment==='Cartão de Crédito'?'solid':'outline'} onClick={()=>setFilterPayment('Cartão de Crédito')}>Cartão</Button>
                  <Button size="sm" variant={filterPayment==='Dinheiro'?'solid':'outline'} onClick={()=>setFilterPayment('Dinheiro')}>Dinheiro</Button>
                </HStack>
              </Box>
            </SimpleGrid>
          </Box>
        </Box>
      )}

      {/* Search (Chakra) */}
      <Box px={4} py={2} width="100%">
        <Box bg={useColorModeValue('white','gray.800')} border="1px" borderColor={useColorModeValue('gray.200','gray.700')} borderRadius="md" p={4}>
          <Flex gap={3} align="center" wrap="wrap">
            <HStack flex={1} minW={{ base: '100%', md: '400px' }}>
              <Search size={18} />
              <input style={{ flex: 1, background: 'transparent', border: '1px solid', borderColor: 'transparent', outline: 'none' }} placeholder="Buscar por descrição ou categoria..." value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} />
          {searchQuery && (
                <Button size="sm" variant="ghost" onClick={()=>setSearchQuery('')} leftIcon={<X size={16}/>}>Limpar</Button>
              )}
            </HStack>
            <Badge colorScheme="gray">{filteredDespesas.length} resultado(s)</Badge>
          </Flex>
          {filteredDespesas.length === 0 && (
            <VStack py={10} spacing={2} color={useColorModeValue('gray.600','gray.300')}>
              <Receipt size={48}/>
              <Heading size="sm">Nenhuma despesa encontrada</Heading>
              <Text>{isCurrentMonth ? 'Cadastre sua primeira despesa para começar!' : 'Não há despesas registradas neste mês.'}</Text>
              {isCurrentMonth && !monthClosed && (
                <Button leftIcon={<Plus size={16}/>} colorScheme="purple" onClick={handleOpenModal}>Nova Despesa</Button>
              )}
            </VStack>
          )}
        </Box>
      </Box>

      {/* Despesas List (Chakra) */}
      {filteredDespesas.length > 0 && (
        <Box px={4} py={2}>
          <VStack spacing={3} align="stretch">
          {filteredDespesas.map((despesa) => (
              <Box key={despesa.id} bg={useColorModeValue('white','gray.800')} border="1px" borderColor={useColorModeValue('gray.200','gray.700')} borderRadius="md" p={4}>
                <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'stretch', md: 'center' }} gap={3}>
                  <Box>
                    <Heading size="sm" mb={1}>{despesa.descricao}</Heading>
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={2} color={useColorModeValue('gray.600','gray.300')} fontSize="sm">
                      <HStack><DollarSign size={14}/><Text fontWeight="semibold" color="red.500">{formatCurrency(despesa.valor)}</Text></HStack>
                      <HStack><Tag size={14}/><Text>{despesa.categoria}</Text></HStack>
                      <HStack><CreditCard size={14}/><Text>{despesa.formaPagamento}</Text></HStack>
                      <HStack><Calendar size={14}/><Text>{formatDate(despesa.data)}</Text></HStack>
                    </SimpleGrid>
                {despesa.observacoes && (
                      <Text mt={2} fontSize="sm" color={useColorModeValue('gray.600','gray.300')}><b>Obs:</b> {despesa.observacoes}</Text>
                    )}
                    <HStack mt={2} spacing={2}>
                      <Badge colorScheme={despesa.tipo === 'fixa' ? 'blue':'orange'}>{despesa.tipo === 'fixa' ? 'Fixa':'Variável'}</Badge>
                      {despesa.recorrente && (<Badge colorScheme="green">Recorrente</Badge>)}
                      {monthClosed && (<Badge colorScheme="red">Mês Fechado</Badge>)}
                    </HStack>
                  </Box>
                  <HStack spacing={2} justify={{ base: 'flex-start', md: 'flex-end' }}>
                {!monthClosed && (
                      <Button variant="outline" colorScheme="red" leftIcon={<Trash2 size={16}/>} onClick={()=>handleDeleteDespesa(despesa.id)}>Excluir</Button>
                )}
                {!monthClosed && (
                      <Button variant="outline" leftIcon={<Edit size={16}/>} onClick={()=>handleEditDespesa(despesa)}>Editar</Button>
                    )}
                    <Button variant="solid" leftIcon={<Eye size={16}/>} onClick={()=>handleViewDespesa(despesa)}>Ver Detalhes</Button>
                  </HStack>
                </Flex>
              </Box>
            ))}
          </VStack>
        </Box>
      )}

      {/* Empty Month Modal */}
      {showEmptyMonthModal && (
        <div className="modal-overlay" onClick={() => setShowEmptyMonthModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Mês sem despesas</h2>
              <button className="modal-close" onClick={() => setShowEmptyMonthModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="empty-month-content">
                <Calendar size={48} className="empty-month-icon" />
                <h3>
                  Não há despesas registradas em {getMonthName(selectedMonth)} de {selectedYear}
                </h3>
                <p>Você pode adicionar despesas para este mês ou navegar para outro período.</p>

                <div className="empty-month-actions">
                  <button className="btn-secondary" onClick={() => setShowEmptyMonthModal(false)}>
                    Fechar
                  </button>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      setShowEmptyMonthModal(false)
                      handleOpenModal()
                    }}
                  >
                    <Plus size={18} />
                    Adicionar Despesa
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Close Month Modal */}
      {showCloseMonthModal && (
        <div className="modal-overlay" onClick={() => setShowCloseMonthModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Fechar Mês</h2>
              <button className="modal-close" onClick={() => setShowCloseMonthModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="close-month-content">
                <AlertTriangle size={48} className="warning-icon" />
                <h3>
                  Tem certeza que deseja fechar o mês de {getMonthName(selectedMonth)} de {selectedYear}?
                </h3>
                <p>
                  Após fechar o mês, não será possível adicionar, editar ou excluir despesas. Esta ação não pode ser
                  desfeita.
                </p>

                <div className="close-month-summary">
                  <div className="summary-item">
                    <span>Total de Despesas:</span>
                    <strong>{formatCurrency(totalDespesas)}</strong>
                  </div>
                  <div className="summary-item">
                    <span>Receita Estimada:</span>
                    <strong>{formatCurrency(receitaEstimada)}</strong>
                  </div>
                  <div className="summary-item">
                    <span>Saldo Final:</span>
                    <strong className={saldoEsperado >= 0 ? "positive" : "negative"}>
                      {formatCurrency(saldoEsperado)}
                    </strong>
                  </div>
                </div>

                <div className="close-month-actions">
                  <button className="btn-secondary" onClick={() => setShowCloseMonthModal(false)}>
                    Cancelar
                  </button>
                  <button className="btn-danger" onClick={handleCloseMonth}>
                    <Lock size={18} />
                    Fechar Mês
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Histórico de Despesas</h2>
              <button className="modal-close" onClick={() => setShowHistoryModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="history-content">
                <div className="history-chart">
                  <h3>Evolução de Despesas</h3>
                  {historicoMensal.length > 0 ? (
                    <div className="chart-container">
                      <div className="chart-bars">
                        {historicoMensal.map((item, index) => (
                          <div className="chart-bar-group" key={index}>
                            <div
                              className="chart-bar expense"
                              style={{ height: `${(item.totalDespesas / 5000) * 100}%` }}
                              data-value={formatCurrency(item.totalDespesas)}
                            ></div>
                            <div
                              className="chart-bar revenue"
                              style={{ height: `${(item.receitaEstimada / 5000) * 100}%` }}
                              data-value={formatCurrency(item.receitaEstimada)}
                            ></div>
                            <div className="chart-label">{item.mes.substring(0, 3)}</div>
                          </div>
                        ))}
                      </div>
                      <div className="chart-legend">
                        <div className="legend-item">
                          <div className="legend-color expense"></div>
                          <span>Despesas</span>
                        </div>
                        <div className="legend-item">
                          <div className="legend-color revenue"></div>
                          <span>Receitas</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="no-data-message">
                      <p>Não há registros de histórico disponíveis</p>
                    </div>
                  )}
                </div>

                <div className="history-table">
                  <h3>Resumo Mensal</h3>
                  {historicoMensal.length > 0 ? (
                    <table>
                      <thead>
                        <tr>
                          <th>Mês</th>
                          <th>Despesas</th>
                          <th>Receitas</th>
                          <th>Saldo</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historicoMensal.map((item, index) => (
                          <tr key={index}>
                            <td>
                              {item.mes} {item.ano}
                            </td>
                            <td className="expense-value">{formatCurrency(item.totalDespesas)}</td>
                            <td>{formatCurrency(item.receitaEstimada)}</td>
                            <td className={item.saldo >= 0 ? "positive" : "negative"}>{formatCurrency(item.saldo)}</td>
                            <td>
                              <span className={`status-pill ${item.status}`}>
                                {item.status === "fechado" ? "Fechado" : "Aberto"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="no-data-message">
                      <p>Não há registros de histórico disponíveis</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setShowHistoryModal(false)}>
                  Fechar
                </button>
                {historicoMensal.length > 0 && (
                  <button className="btn-primary">
                    <Download size={18} />
                    Exportar Relatório
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compare Modal */}
      {showCompareModal && (
        <div className="modal-overlay" onClick={() => setShowCompareModal(false)}>
          <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Comparação de Meses</h2>
              <button className="modal-close" onClick={() => setShowCompareModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="compare-content">
                {historicoMensal.length >= 2 ? (
                  <>
                    <div className="compare-selectors">
                      <div className="compare-selector">
                        <label>Mês Base</label>
                        <div className="month-dropdown">
                          <select defaultValue="0">
                            {historicoMensal.map((item, index) => (
                              <option key={index} value={index}>
                                {item.mes} {item.ano}
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={18} />
                        </div>
                      </div>

                      <div className="compare-selector">
                        <label>Mês de Comparação</label>
                        <div className="month-dropdown">
                          <select defaultValue="1">
                            {historicoMensal.map((item, index) => (
                              <option key={index} value={index}>
                                {item.mes} {item.ano}
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={18} />
                        </div>
                      </div>
                    </div>

                    <div className="compare-results">
                      <div className="compare-summary">
                        <div className="compare-card">
                          <h4>
                            {historicoMensal[0].mes} {historicoMensal[0].ano}
                          </h4>
                          <div className="compare-value">{formatCurrency(historicoMensal[0].totalDespesas)}</div>
                          <div className="compare-label">Total de Despesas</div>
                        </div>

                        <div className="compare-vs">
                          <div className="vs-icon">VS</div>
                        </div>

                        <div className="compare-card">
                          <h4>
                            {historicoMensal[1].mes} {historicoMensal[1].ano}
                          </h4>
                          <div className="compare-value">{formatCurrency(historicoMensal[1].totalDespesas)}</div>
                          <div className="compare-label">Total de Despesas</div>
                        </div>

                        <div
                          className={`compare-difference ${historicoMensal[1].totalDespesas > historicoMensal[0].totalDespesas ? "increase" : "decrease"}`}
                        >
                          {historicoMensal[1].totalDespesas > historicoMensal[0].totalDespesas ? (
                            <TrendingUp size={20} />
                          ) : (
                            <TrendingDown size={20} />
                          )}
                          <span>
                            {formatCurrency(
                              Math.abs(historicoMensal[1].totalDespesas - historicoMensal[0].totalDespesas),
                            )}
                            (
                            {(
                              (Math.abs(historicoMensal[1].totalDespesas - historicoMensal[0].totalDespesas) /
                                historicoMensal[0].totalDespesas) *
                              100
                            ).toFixed(1)}
                            %)
                          </span>
                        </div>
                      </div>

                      <div className="compare-details">
                        <h3>Análise por Categoria</h3>
                        <table className="compare-table">
                          <thead>
                            <tr>
                              <th>Categoria</th>
                              <th>
                                {historicoMensal[0].mes} {historicoMensal[0].ano}
                              </th>
                              <th>
                                {historicoMensal[1].mes} {historicoMensal[1].ano}
                              </th>
                              <th>Diferença</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>Despesas Fixas</td>
                              <td>{formatCurrency(historicoMensal[0].despesasFixas)}</td>
                              <td>{formatCurrency(historicoMensal[1].despesasFixas)}</td>
                              <td
                                className={
                                  historicoMensal[1].despesasFixas > historicoMensal[0].despesasFixas
                                    ? "negative"
                                    : "positive"
                                }
                              >
                                {(
                                  ((historicoMensal[1].despesasFixas - historicoMensal[0].despesasFixas) /
                                    historicoMensal[0].despesasFixas) *
                                  100
                                ).toFixed(1)}
                                %
                              </td>
                            </tr>
                            <tr>
                              <td>Despesas Variáveis</td>
                              <td>{formatCurrency(historicoMensal[0].despesasVariaveis)}</td>
                              <td>{formatCurrency(historicoMensal[1].despesasVariaveis)}</td>
                              <td
                                className={
                                  historicoMensal[1].despesasVariaveis > historicoMensal[0].despesasVariaveis
                                    ? "negative"
                                    : "positive"
                                }
                              >
                                {(
                                  ((historicoMensal[1].despesasVariaveis - historicoMensal[0].despesasVariaveis) /
                                    historicoMensal[0].despesasVariaveis) *
                                  100
                                ).toFixed(1)}
                                %
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="no-data-message">
                    <p>É necessário ter pelo menos dois meses fechados para realizar a comparação</p>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setShowCompareModal(false)}>
                  Fechar
                </button>
                {historicoMensal.length >= 2 && (
                  <button className="btn-primary">
                    <Download size={18} />
                    Exportar Comparação
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Despesa Modal */}
      {showViewModal && selectedDespesa && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detalhes da Despesa</h2>
              <button className="modal-close" onClick={() => setShowViewModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="despesa-details">
                <div className="detail-group">
                  <h3>Informações Básicas</h3>
                  <p>
                    <strong>Descrição:</strong> {selectedDespesa.descricao}
                  </p>
                  <p>
                    <strong>Valor:</strong> {formatCurrency(selectedDespesa.valor)}
                  </p>
                  <p>
                    <strong>Data:</strong> {formatDate(selectedDespesa.data)}
                  </p>
                  <p>
                    <strong>Tipo:</strong> {selectedDespesa.tipo === "fixa" ? "Fixa" : "Variável"}
                  </p>
                </div>

                <div className="detail-group">
                  <h3>Categoria e Pagamento</h3>
                  <p>
                    <strong>Categoria:</strong> {selectedDespesa.categoria}
                  </p>
                  <p>
                    <strong>Forma de Pagamento:</strong> {selectedDespesa.formaPagamento}
                  </p>
                  <p>
                    <strong>Recorrente:</strong> {selectedDespesa.recorrente ? "Sim" : "Não"}
                  </p>
                </div>

                {selectedDespesa.observacoes && (
                  <div className="detail-group">
                    <h3>Observações</h3>
                    <p>{selectedDespesa.observacoes}</p>
                  </div>
                )}

                {monthClosed && (
                  <div className="detail-notice">
                    <Lock size={16} />
                    <span>Este mês está fechado. As despesas não podem ser editadas ou excluídas.</span>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setShowViewModal(false)}>
                  Fechar
                </button>
                {!monthClosed && (
                  <button
                    className="btn-primary"
                    onClick={() => {
                      setShowViewModal(false)
                      handleEditDespesa(selectedDespesa)
                    }}
                  >
                    <Edit size={18} />
                    Editar Despesa
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Despesa Modal */}
      {showEditModal && selectedDespesa && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Editar Despesa</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateDespesa}>
              <div className="modal-body">
                <div className="form-section">
                  <div className="form-group">
                    <label htmlFor="descricao">Descrição*</label>
                    <input
                      type="text"
                      id="descricao"
                      required
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="valor">Valor*</label>
                      <input
                        type="number"
                        id="valor"
                        step="0.01"
                        min="0"
                        required
                        value={valor}
                        onChange={(e) => setValor(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="data">Data*</label>
                      <input type="date" id="data" required value={data} onChange={(e) => setData(e.target.value)} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="tipo">Tipo de Despesa*</label>
                    <div className="select-wrapper">
                      <select id="tipo" value={tipo} onChange={(e) => setTipo(e.target.value as "fixa" | "variavel")}>
                        <option value="fixa">Fixa</option>
                        <option value="variavel">Variável</option>
                      </select>
                      <ChevronDown size={18} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="categoria">Categoria*</label>
                    <div className="select-wrapper">
                      <select id="categoria" required value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                        <option value="">Selecione uma categoria</option>
                        <option value="Infraestrutura">Infraestrutura</option>
                        <option value="Produtos">Produtos</option>
                        <option value="Contas">Contas</option>
                        <option value="Manutenção">Manutenção</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Equipamentos">Equipamentos</option>
                        <option value="Pessoal">Pessoal</option>
                        <option value="Outros">Outros</option>
                      </select>
                      <ChevronDown size={18} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="formaPagamento">Forma de Pagamento*</label>
                    <div className="select-wrapper">
                      <select
                        id="formaPagamento"
                        required
                        value={formaPagamento}
                        onChange={(e) => setFormaPagamento(e.target.value)}
                      >
                        <option value="">Selecione a forma de pagamento</option>
                        <option value="Dinheiro">Dinheiro</option>
                        <option value="PIX">PIX</option>
                        <option value="Cartão de Débito">Cartão de Débito</option>
                        <option value="Cartão de Crédito">Cartão de Crédito</option>
                        <option value="Boleto">Boleto</option>
                        <option value="Débito Automático">Débito Automático</option>
                        <option value="Transferência">Transferência</option>
                      </select>
                      <ChevronDown size={18} />
                    </div>
                  </div>

                  <div className="form-group">
                    <div className="checkbox-group">
                      <input
                        type="checkbox"
                        id="recorrente"
                        checked={recorrente}
                        onChange={(e) => setRecorrente(e.target.checked)}
                      />
                      <label htmlFor="recorrente">Esta é uma despesa recorrente</label>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="observacoes">Observações</label>
                    <textarea
                      id="observacoes"
                      rows={4}
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  <Check size={18} />
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Despesa Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <button className="modal-back" onClick={formStep > 1 ? handlePrevStep : handleCloseModal}>
                <ArrowLeft size={20} />
              </button>
              <h2>
                {formStep === 1 && "Nova Despesa"}
                {formStep === 2 && "Detalhes da Despesa"}
                {formStep === 3 && "Finalizar Cadastro"}
              </h2>
              <div className="modal-steps">
                <div className={`step ${formStep >= 1 ? "active" : ""}`}>1</div>
                <div className="step-line"></div>
                <div className={`step ${formStep >= 2 ? "active" : ""}`}>2</div>
                <div className="step-line"></div>
                <div className={`step ${formStep >= 3 ? "active" : ""}`}>3</div>
              </div>
              <button className="modal-close" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Step 1: Basic Information */}
              {formStep === 1 && (
                <div className="modal-body">
                  <div className="form-section">
                    <h3>Informações Básicas</h3>

                    <div className="form-group">
                      <label htmlFor="descricao">Descrição*</label>
                      <input
                        type="text"
                        id="descricao"
                        placeholder="Ex: Aluguel, Produtos, Conta de luz..."
                        required
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="valor">Valor*</label>
                        <input
                          type="number"
                          id="valor"
                          placeholder="0,00"
                          step="0.01"
                          min="0"
                          required
                          value={valor}
                          onChange={(e) => setValor(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="data">Data*</label>
                        <input type="date" id="data" required value={data} onChange={(e) => setData(e.target.value)} />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="tipo">Tipo de Despesa*</label>
                      <div className="select-wrapper">
                        <select id="tipo" value={tipo} onChange={(e) => setTipo(e.target.value as "fixa" | "variavel")}>
                          <option value="fixa">Fixa</option>
                          <option value="variavel">Variável</option>
                        </select>
                        <ChevronDown size={18} />
                      </div>
                    </div>
                  </div>

                  <div className="form-footer">
                    <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                      Cancelar
                    </button>
                    <button type="button" className="btn-primary" onClick={handleNextStep}>
                      Próximo
                      <ChevronDown size={18} className="rotate-270" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Category and Payment */}
              {formStep === 2 && (
                <div className="modal-body">
                  <div className="form-section">
                    <h3>Categoria e Pagamento</h3>

                    <div className="form-group">
                      <label htmlFor="categoria">Categoria*</label>
                      <div className="select-wrapper">
                        <select
                          id="categoria"
                          required
                          value={categoria}
                          onChange={(e) => setCategoria(e.target.value)}
                        >
                          <option value="">Selecione uma categoria</option>
                          <option value="Infraestrutura">Infraestrutura</option>
                          <option value="Produtos">Produtos</option>
                          <option value="Contas">Contas</option>
                          <option value="Manutenção">Manutenção</option>
                          <option value="Marketing">Marketing</option>
                          <option value="Equipamentos">Equipamentos</option>
                          <option value="Pessoal">Pessoal</option>
                          <option value="Outros">Outros</option>
                        </select>
                        <ChevronDown size={18} />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="formaPagamento">Forma de Pagamento*</label>
                      <div className="select-wrapper">
                        <select
                          id="formaPagamento"
                          required
                          value={formaPagamento}
                          onChange={(e) => setFormaPagamento(e.target.value)}
                        >
                          <option value="">Selecione a forma de pagamento</option>
                          <option value="Dinheiro">Dinheiro</option>
                          <option value="PIX">PIX</option>
                          <option value="Cartão de Débito">Cartão de Débito</option>
                          <option value="Cartão de Crédito">Cartão de Crédito</option>
                          <option value="Boleto">Boleto</option>
                          <option value="Débito Automático">Débito Automático</option>
                          <option value="Transferência">Transferência</option>
                        </select>
                        <ChevronDown size={18} />
                      </div>
                    </div>

                    <div className="form-group">
                      <div className="checkbox-group">
                        <input
                          type="checkbox"
                          id="recorrente"
                          checked={recorrente}
                          onChange={(e) => setRecorrente(e.target.checked)}
                        />
                        <label htmlFor="recorrente">Esta é uma despesa recorrente</label>
                      </div>
                      <small style={{ color: "var(--text-secondary)", fontSize: "12px" }}>
                        Marque se esta despesa se repete mensalmente
                      </small>
                    </div>
                  </div>

                  <div className="form-footer">
                    <button type="button" className="btn-secondary" onClick={handlePrevStep}>
                      <ChevronDown size={18} className="rotate-90" />
                      Voltar
                    </button>
                    <button type="button" className="btn-primary" onClick={handleNextStep}>
                      Próximo
                      <ChevronDown size={18} className="rotate-270" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Final Details */}
              {formStep === 3 && (
                <div className="modal-body">
                  <div className="form-section">
                    <h3>Finalizar Cadastro</h3>

                    <div className="form-group">
                      <label htmlFor="observacoes">Observações</label>
                      <textarea
                        id="observacoes"
                        placeholder="Adicione observações sobre esta despesa..."
                        rows={4}
                        value={observacoes}
                        onChange={(e) => setObservacoes(e.target.value)}
                      />
                    </div>

                    <div className="info-display">
                      <h4 style={{ marginBottom: "12px", color: "var(--text-primary)" }}>Resumo da Despesa</h4>
                      <p>
                        <strong>Descrição:</strong> {descricao}
                      </p>
                      <p>
                        <strong>Valor:</strong> {formatCurrency(Number.parseFloat(valor || "0"))}
                      </p>
                      <p>
                        <strong>Data:</strong> {data ? new Date(data).toLocaleDateString("pt-BR") : ""}
                      </p>
                      <p>
                        <strong>Tipo:</strong> {tipo === "fixa" ? "Fixa" : "Variável"}
                      </p>
                      <p>
                        <strong>Categoria:</strong> {categoria}
                      </p>
                      <p>
                        <strong>Forma de Pagamento:</strong> {formaPagamento}
                      </p>
                      {recorrente && (
                        <p style={{ color: "var(--success)", fontWeight: "600" }}>
                          <strong>✓ Despesa Recorrente</strong>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="form-footer">
                    <button type="button" className="btn-secondary" onClick={handlePrevStep}>
                      <ChevronDown size={18} className="rotate-90" />
                      Voltar
                    </button>
                    <button type="submit" className="btn-primary">
                      <Check size={18} />
                      Cadastrar Despesa
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Edit Estimates Modal */}
      {showEditEstimatesModal && (
        <div className="modal-overlay" onClick={() => setShowEditEstimatesModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Editar Valores Estimados</h2>
              <button className="modal-close" onClick={() => setShowEditEstimatesModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-section">
                <div className="form-group">
                  <label htmlFor="receitaEstimada">Receita Estimada</label>
                  <input
                    type="number"
                    id="receitaEstimada"
                    value={receitaEstimada}
                    onChange={(e) => setReceitaEstimada(Number(e.target.value))}
                    min="0"
                    step="100"
                  />
                </div>

                <div className="form-group">
                  <label>Saldo Atual</label>
                  <p className="current-balance">{formatCurrency(saldoEsperado)}</p>
                  <small style={{ color: "var(--text-secondary)" }}>
                    O saldo é calculado automaticamente (Receita - Despesas)
                  </small>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowEditEstimatesModal(false)}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={handleUpdateEstimates}>
                <Check size={18} />
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </Box>
  )
}

export default DespesasAdmin
