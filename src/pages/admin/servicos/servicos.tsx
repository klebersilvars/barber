"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Search,
  Plus,
  Filter,
  DollarSign,
  Clock,
  Users,
  X,
  ChevronDown,
  Check,
  ArrowLeft,
  Trash2,
  Edit,
  Eye,
  Tag,
  Scissors,
  Palette,
  Sparkles,
  User,
  ToggleLeft,
  ToggleRight,
  PlusCircle,
  Trash,
} from "lucide-react"
import './servicos.css'
import { collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc, onSnapshot, getDoc, setDoc } from 'firebase/firestore'
import { firestore } from '../../../firebase/firebase'
import { getAuth } from "firebase/auth"
import {
  Box,
  Flex,
  Heading,
  Text,
  HStack,
  VStack,
  Button,
  Badge,
  SimpleGrid,
  useColorModeValue,
  Input,
  InputGroup,
  InputLeftElement,
  Wrap,
  WrapItem,
  
} from '@chakra-ui/react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Select,
  Checkbox,
  Textarea,
} from '@chakra-ui/react'

interface Servico {
  id: string
  nomeServico: string
  descricaoServico: string
  valorServico: number
  duracaoServico: number
  categoriaServico: string
  profissionaisServico: string[]
  servicoAtivo: boolean
  nomeEstabelecimento: string
  uidProprietario: string
  emailProprietario: string
}

interface Colaborador {
  id: string
  nome: string
  cargos: string[]
}

interface Categoria {
  id: string
  nome: string
  icon?: any
  iconKey?: string
  color: string
}

const Servicos = () => {
  const auth = getAuth()
  const [nomeEstabelecimento, setNomeEstabelecimento] = useState("")
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])

  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedServico, setSelectedServico] = useState<Servico | null>(null)

  // Form and filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [formStep, setFormStep] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [filterCategoria, setFilterCategoria] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterProfissional, setFilterProfissional] = useState("all")
  const [servicos, setServicos] = useState<Servico[]>([])
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  // Categorias (agora editáveis)
  const [categorias, setCategorias] = useState<Categoria[]>([
    { id: "cabelo", nome: "Cabelo", icon: Scissors, iconKey: "Scissors", color: "#8b5cf6" },
    { id: "unha", nome: "Unhas", icon: Sparkles, iconKey: "Sparkles", color: "#ec4899" },
    { id: "estetica", nome: "Estética", icon: Palette, iconKey: "Palette", color: "#06b6d4" },
    { id: "barba", nome: "Barba", icon: User, iconKey: "User", color: "#f59e0b" },
  ])
  const [categoriasModalOpen, setCategoriasModalOpen] = useState(false)
  const [novaCategoriaNome, setNovaCategoriaNome] = useState("")
  const [novaCategoriaIcon, setNovaCategoriaIcon] = useState("Scissors")
  const [novaCategoriaCor, setNovaCategoriaCor] = useState("#8b5cf6")

  // Chakra UI color tokens
  const colorBg = useColorModeValue('white','gray.800')
  const colorBorder = useColorModeValue('gray.200','gray.700')
  const colorTextSecondary = useColorModeValue('gray.600','gray.300')

  // Form states
  const [nomeServico, setNomeServico] = useState("")
  const [descricaoServico, setDescricaoServico] = useState("")
  const [valorServico, setValorServico] = useState("")
  const [duracaoServico, setDuracaoServico] = useState("")
  const [categoriaServico, setCategoriaServico] = useState("")
  const [profissionaisSelecionados, setProfissionaisSelecionados] = useState<string[]>([])
  const [servicoAtivo, setServicoAtivo] = useState(true)

  const mapIcon = (key: string) => {
    switch (key) {
      case "Sparkles":
        return Sparkles
      case "Palette":
        return Palette
      case "User":
        return User
      case "Scissors":
      default:
        return Scissors
    }
  }

  // Persistir categorias no documento da conta (campo 'category')
  const persistCategorias = async (items: Categoria[]) => {
    const user = auth.currentUser
    if (!user?.uid) return
    const docRef = doc(firestore, 'contas', user.uid)
    const serializado = items.map(c => ({ id: c.id, nome: c.nome, iconKey: c.iconKey || 'Scissors', color: c.color }))
    try {
      await updateDoc(docRef, { category: serializado })
    } catch (e) {
      // caso campo ainda não exista
      await setDoc(docRef, { category: serializado }, { merge: true })
    }
  }

  const handleAddCategoria = async () => {
    const nome = novaCategoriaNome.trim()
    if (!nome) return
    const id = nome.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')
    if (categorias.some(c => c.id === id)) {
      alert('Já existe uma categoria com esse nome.')
      return
    }
    const nova: Categoria = { id, nome, icon: mapIcon(novaCategoriaIcon), iconKey: novaCategoriaIcon, color: novaCategoriaCor }
    const atualizadas = [...categorias, nova]
    setCategorias(atualizadas)
    await persistCategorias(atualizadas)
    setNovaCategoriaNome("")
  }

  const handleRemoveCategoria = async (id: string) => {
    const atualizadas = categorias.filter(c => c.id !== id)
    setCategorias(atualizadas)
    await persistCategorias(atualizadas)
  }

  // Carregar categorias do Firestore (tempo real)
  useEffect(() => {
    const user = auth.currentUser
    if (!user?.uid) return
    const ref = doc(firestore, 'contas', user.uid)
    const unsub = onSnapshot(ref, async (snap) => {
      if (!snap.exists()) return
      const data: any = snap.data()
      if (Array.isArray(data.category) && data.category.length > 0) {
        const loaded: Categoria[] = data.category.map((c: any) => ({
          id: c.id,
          nome: c.nome,
          iconKey: c.iconKey || 'Scissors',
          icon: mapIcon(c.iconKey || 'Scissors'),
          color: c.color || '#8b5cf6'
        }))
        setCategorias(loaded)
      }
    })
    return () => unsub()
  }, [auth.currentUser])

  // Buscar nome do estabelecimento do admin logado
  useEffect(() => {
    const fetchEstabelecimento = async () => {
      if (!auth.currentUser?.email) return

      const contasRef = collection(firestore, 'contas')
      const q = query(contasRef, where('email', '==', auth.currentUser.email))
      const snapshot = await getDocs(q)

      if (!snapshot.empty) {
        const nomeEstab = snapshot.docs[0].data().nomeEstabelecimento
        setNomeEstabelecimento(nomeEstab)
      }
    }

    fetchEstabelecimento()
  }, [auth.currentUser])

  // Buscar colaboradores do estabelecimento
  useEffect(() => {
    const fetchColaboradores = async () => {
      const user = auth.currentUser

      if (!user?.uid) {
        return
      }

      try {
        const colaboradoresRef = collection(firestore, 'colaboradores')
        
        const q = query(
          colaboradoresRef,
          where('estabelecimentoId', '==', user.uid)
        )

        const snapshot = await getDocs(q)
        
        if (snapshot.empty) {
          setColaboradores([])
          return
        }

        const colaboradoresData = snapshot.docs
          .map(doc => {
            const data = doc.data()
            return {
              id: doc.id,
              nome: data.nome,
              cargos: data.cargos || [],
              estabelecimentoId: data.estabelecimentoId
            }
          })
          .filter(colab => 
            Array.isArray(colab.cargos) && 
            colab.cargos.includes('Profissional')
          )

        setColaboradores(colaboradoresData)
      } catch (error) {
        console.error('Erro ao buscar colaboradores:', error)
        alert('Erro ao buscar colaboradores: ' + error)
      }
    }

    fetchColaboradores()
  }, [auth.currentUser])

  // Buscar serviços do estabelecimento
  useEffect(() => {
    if (!auth.currentUser?.uid) return

    const servicosRef = collection(firestore, 'servicosAdmin')
    const q = query(servicosRef, where('uidProprietario', '==', auth.currentUser.uid))
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const servicosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Servico[]
      setServicos(servicosData)
    })

    return () => unsubscribe()
  }, [auth.currentUser])

  const filteredServicos = servicos.filter((servico) => {
    const matchesSearch =
      servico.nomeServico.toLowerCase().includes(searchQuery.toLowerCase()) ||
      servico.descricaoServico.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategoria = filterCategoria === "all" || servico.categoriaServico === filterCategoria
    const matchesStatus = filterStatus === "all" || (filterStatus === "ativo" ? servico.servicoAtivo : !servico.servicoAtivo)
    const matchesProfissional = filterProfissional === "all" || servico.profissionaisServico.includes(filterProfissional)

    return matchesSearch && matchesCategoria && matchesStatus && matchesProfissional
  })

  const handleOpenModal = () => {
    setShowModal(true)
    setFormStep(1)
    resetForm()
  }

  const resetForm = () => {
    setNomeServico("")
    setDescricaoServico("")
    setValorServico("")
    setDuracaoServico("")
    setCategoriaServico("")
    setProfissionaisSelecionados([])
    setServicoAtivo(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setFormStep(1)
    resetForm()
  }

  const handleNextStep = () => {
    setFormStep(formStep + 1)
  }

  const handlePrevStep = () => {
    setFormStep(formStep - 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!auth.currentUser?.uid || !auth.currentUser?.email || !nomeEstabelecimento) {
      return
    }

    // Validação dos campos obrigatórios
    if (!nomeServico || !valorServico || !duracaoServico || !categoriaServico || profissionaisSelecionados.length === 0) {
      alert('Preencha todos os campos obrigatórios!')
      return
    }

    try {
      const servicoRef = collection(firestore, 'servicosAdmin')
      const newServico = {
        nomeServico,
        descricaoServico,
        valorServico: Number.parseFloat(valorServico),
        duracaoServico: Number.parseInt(duracaoServico),
        categoriaServico,
        profissionaisServico: profissionaisSelecionados,
        servicoAtivo,
        nomeEstabelecimento,
        uidProprietario: auth.currentUser.uid,
        emailProprietario: auth.currentUser.email,
        createdAt: new Date()
      }

      await addDoc(servicoRef, newServico)
      
      alert("Serviço cadastrado com sucesso!")
      handleCloseModal()
    } catch (error) {
      console.error("Erro ao cadastrar serviço:", error)
      alert("Erro ao cadastrar serviço: " + error)
    }
  }

  const handleEditServico = (servico: Servico) => {
    setSelectedServico(servico)
    setNomeServico(servico.nomeServico)
    setDescricaoServico(servico.descricaoServico)
    setValorServico(servico.valorServico.toString())
    setDuracaoServico(servico.duracaoServico.toString())
    setCategoriaServico(servico.categoriaServico)
    setProfissionaisSelecionados(servico.profissionaisServico)
    setServicoAtivo(servico.servicoAtivo)
    setShowEditModal(true)
  }

  const handleUpdateServico = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedServico) return

    try {
      const servicoRef = doc(firestore, 'servicosAdmin', selectedServico.id)
      await updateDoc(servicoRef, {
        nomeServico,
        descricaoServico,
        valorServico: Number.parseFloat(valorServico),
        duracaoServico: Number.parseInt(duracaoServico),
        categoriaServico,
        profissionaisServico: profissionaisSelecionados,
        servicoAtivo
      })

      setShowEditModal(false)
      alert("Serviço atualizado com sucesso!")
    } catch (error) {
      console.error("Erro ao atualizar serviço:", error)
      alert("Erro ao atualizar serviço: " + error)
    }
  }

  const handleDeleteServico = async (servicoId: string) => {
    if (confirm("Tem certeza que deseja excluir este serviço?")) {
      try {
        await deleteDoc(doc(firestore, 'servicosAdmin', servicoId))
        alert("Serviço excluído com sucesso!")
      } catch (error) {
        console.error("Erro ao excluir serviço:", error)
        alert("Erro ao excluir serviço: " + error)
      }
    }
  }

  const handleToggleStatus = async (servicoId: string) => {
    try {
      const servicoRef = doc(firestore, 'servicosAdmin', servicoId)
      const servico = servicos.find(s => s.id === servicoId)
      if (servico) {
        await updateDoc(servicoRef, {
          servicoAtivo: !servico.servicoAtivo
        })
      }
    } catch (error) {
      console.error("Erro ao alterar status:", error)
      alert("Erro ao alterar status: " + error)
    }
  }

  const handleViewServico = (servico: Servico) => {
    setSelectedServico(servico)
    setShowViewModal(true)
  }

  const handleProfissionalToggle = (profissional: string) => {
    if (profissionaisSelecionados.includes(profissional)) {
      setProfissionaisSelecionados(profissionaisSelecionados.filter((p) => p !== profissional))
    } else {
      setProfissionaisSelecionados([...profissionaisSelecionados, profissional])
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}min`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`
  }

  const getCategoriaInfo = (categoriaId: string) => {
    return categorias.find((cat) => cat.id === categoriaId) || categorias[0]
  }

  // Statistics
  const totalServicos = servicos.length
  const servicosAtivos = servicos.filter((s) => s.servicoAtivo).length
  // const servicosInativos = servicos.filter((s) => !s.servicoAtivo).length
  const valorMedio = servicos.reduce((sum, s) => sum + s.valorServico, 0) / (servicos.length || 1)

  if (!auth.currentUser) {
    return <div>Você precisa estar logado para acessar esta página.</div>
  }

  return (
    <Box
      width="100%"
      minH={{ base: '40dvh', md: 'auto' }}
      overflowY={{ base: 'auto', md: 'visible' }}
      pb={{ base: 12, md: 0 }}
      sx={{ WebkitOverflowScrolling: 'touch' }}
    >
      <Box bg={colorBg} borderBottom="1px" borderColor={colorBorder} px={4} py={4} width="100%">
        <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'stretch', md: 'center' }} gap={3} width="100%">
          <Box>
            <Heading size="lg">Serviços</Heading>
            <Text color={colorTextSecondary}>Gerencie o catálogo de serviços.</Text>
          </Box>
          <HStack spacing={2} flexWrap="wrap" w="100%" justify={{ base: 'stretch', md: 'flex-end' }}>
            <Button size="sm" w={{ base: '100%', sm: 'auto' }} variant="outline" leftIcon={<Filter size={16} />} onClick={() => setShowFilters(!showFilters)}>
              Filtros
              <Badge ml={2} colorScheme="purple" variant="subtle">
                {Object.values({ filterCategoria, filterStatus, filterProfissional }).filter((f) => f !== 'all').length || 0}
              </Badge>
            </Button>
            <Button size="sm" w={{ base: '100%', sm: 'auto' }} colorScheme="purple" leftIcon={<Plus size={16} />} onClick={handleOpenModal}>Novo Serviço</Button>
          </HStack>
        </Flex>
      </Box>

      <Box px={4} py={2} width="100%">
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
          <Box border="1px" borderColor={colorBorder} bg={colorBg} borderRadius="md" p={4}>
            <Flex justify="space-between" align="center">
              <Box>
                <Text fontSize="sm" color={colorTextSecondary}>Total de Serviços</Text>
                <Heading size="md">{totalServicos}</Heading>
                <Text fontSize="xs" color="green.500">+{((servicosAtivos / (totalServicos || 1)) * 100).toFixed(0)}%</Text>
              </Box>
              <Scissors size={28} />
            </Flex>
          </Box>
          <Box border="1px" borderColor={colorBorder} bg={colorBg} borderRadius="md" p={4}>
            <Flex justify="space-between" align="center">
              <Box>
                <Text fontSize="sm" color={colorTextSecondary}>Valor Médio</Text>
                <Heading size="md">{formatCurrency(valorMedio)}</Heading>
              </Box>
              <DollarSign size={28} />
            </Flex>
          </Box>
          <Box border="1px" borderColor={colorBorder} bg={colorBg} borderRadius="md" p={4}>
            <Flex justify="space-between" align="center">
              <Box>
                <Text fontSize="sm" color={colorTextSecondary}>Profissionais</Text>
                <Heading size="md">{colaboradores.length}</Heading>
              </Box>
              <Users size={28} />
            </Flex>
          </Box>
          <Box border="1px" borderColor={colorBorder} bg={colorBg} borderRadius="md" p={4}>
            <Flex justify="space-between" align="center">
              <Box>
                <Text fontSize="sm" color={colorTextSecondary}>Categorias</Text>
                <Heading size="md">{categorias.length}</Heading>
              </Box>
              <HStack spacing={2}>
                <Button size="xs" variant="outline" onClick={()=>setCategoriasModalOpen(true)}>Editar Categorias</Button>
                <Scissors size={28} />
              </HStack>
            </Flex>
          </Box>
        </SimpleGrid>
      </Box>

      {showFilters && (
        <Box px={4} py={2} width="100%">
          <Box bg={colorBg} border="1px" borderColor={colorBorder} borderRadius="md" p={4}>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <Box>
                <Text fontWeight="semibold" mb={2}>Categoria</Text>
                <Wrap>
                  <WrapItem>
                    <Button size="sm" variant={filterCategoria==='all'?'solid':'outline'} onClick={()=>setFilterCategoria('all')}>Todas</Button>
                  </WrapItem>
                  {categorias.map((cat)=> (
                    <WrapItem key={cat.id}>
                      <Button size="sm" variant={filterCategoria===cat.id?'solid':'outline'} onClick={()=>setFilterCategoria(cat.id)} leftIcon={cat.icon ? <cat.icon size={14}/> : undefined}>{cat.nome}</Button>
                    </WrapItem>
                  ))}
                </Wrap>
              </Box>
              <Box>
                <Text fontWeight="semibold" mb={2}>Status</Text>
                <HStack>
                  <Button size="sm" variant={filterStatus==='all'?'solid':'outline'} onClick={()=>setFilterStatus('all')}>Todos</Button>
                  <Button size="sm" variant={filterStatus==='ativo'?'solid':'outline'} onClick={()=>setFilterStatus('ativo')}>Ativos</Button>
                  <Button size="sm" variant={filterStatus==='inativo'?'solid':'outline'} onClick={()=>setFilterStatus('inativo')}>Inativos</Button>
                </HStack>
              </Box>
              <Box>
                <Text fontWeight="semibold" mb={2}>Profissional</Text>
                <Wrap>
                  <WrapItem>
                    <Button size="sm" variant={filterProfissional==='all'?'solid':'outline'} onClick={()=>setFilterProfissional('all')}>Todos</Button>
                  </WrapItem>
                  {colaboradores.map((colab)=> (
                    <WrapItem key={colab.id}>
                      <Button size="sm" variant={filterProfissional===colab.nome?'solid':'outline'} onClick={()=>setFilterProfissional(colab.nome)}>{colab.nome}</Button>
                    </WrapItem>
                  ))}
                </Wrap>
              </Box>
            </SimpleGrid>
          </Box>
        </Box>
      )}

      <Box px={4} py={2} width="100%">
        <Box bg={colorBg} border="1px" borderColor={colorBorder} borderRadius="md" p={4}>
          <Flex gap={3} align="center" wrap="wrap">
            <HStack flex={1} minW={{ base: '100%', md: '400px' }}>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <Search size={18} />
                </InputLeftElement>
                <Input placeholder="Buscar por nome ou descrição..." value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} />
              </InputGroup>
          {searchQuery && (
                <Button size="sm" variant="ghost" onClick={()=>setSearchQuery('')} leftIcon={<X size={16}/>}>Limpar</Button>
              )}
            </HStack>
            <HStack>
              <Button size="sm" variant={viewMode==='grid'?'solid':'outline'} onClick={()=>setViewMode('grid')}>Grid</Button>
              <Button size="sm" variant={viewMode==='list'?'solid':'outline'} onClick={()=>setViewMode('list')}>Lista</Button>
            </HStack>
            <Badge colorScheme="gray">{filteredServicos.length} resultado(s)</Badge>
          </Flex>
          {filteredServicos.length === 0 && (
            <VStack py={10} spacing={2} color={colorTextSecondary}>
              <Scissors size={48} />
              <Heading size="sm">Nenhum serviço encontrado</Heading>
              <Text>Cadastre seu primeiro serviço para começar!</Text>
              <Button colorScheme="purple" leftIcon={<Plus size={16}/>} onClick={handleOpenModal}>Novo Serviço</Button>
            </VStack>
          )}
        </Box>
      </Box>

      {filteredServicos.length > 0 && (
        <Box px={4} py={2}>
          <VStack spacing={3} align="stretch">
          {filteredServicos.map((servico) => {
            const categoriaInfo = getCategoriaInfo(servico.categoriaServico)
            return (
                <Box key={servico.id} bg={colorBg} border="1px" borderColor={colorBorder} borderRadius="md" p={4}>
                  <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'stretch', md: 'center' }} gap={3}>
                    <Box>
                      <Heading size="sm" mb={1}>{servico.nomeServico}</Heading>
                      <SimpleGrid columns={{ base: 1, md: 3, lg: 4 }} spacing={2} color={colorTextSecondary} fontSize="sm">
                        <HStack><DollarSign size={14}/><Text>{formatCurrency(servico.valorServico)}</Text></HStack>
                        <HStack><Clock size={14}/><Text>{formatDuration(servico.duracaoServico)}</Text></HStack>
                        <HStack><Users size={14}/><Text>{servico.profissionaisServico.length} profissionais</Text></HStack>
                        <HStack>{categoriaInfo.icon ? <categoriaInfo.icon size={14}/> : null}<Text>{categoriaInfo.nome}</Text></HStack>
                      </SimpleGrid>
                      {servico.descricaoServico && (
                        <Text mt={2} fontSize="sm" color={colorTextSecondary}>{servico.descricaoServico}</Text>
                      )}
                      {servico.profissionaisServico.length > 0 && (
                        <HStack mt={2} spacing={2} flexWrap="wrap">
                          {servico.profissionaisServico.map((prof, idx)=>(
                            <Badge key={idx} colorScheme="purple" variant="subtle">{prof}</Badge>
                          ))}
                        </HStack>
                      )}
                    </Box>
                    <HStack spacing={2} justify={{ base: 'stretch', md: 'flex-end' }} flexWrap="wrap">
                      <Button size="sm" w={{ base: '100%', md: 'auto' }} variant="outline" colorScheme="red" leftIcon={<Trash2 size={16}/>} onClick={()=>handleDeleteServico(servico.id)}>Excluir</Button>
                      <Button size="sm" w={{ base: '100%', md: 'auto' }} variant="outline" leftIcon={<Edit size={16}/>} onClick={()=>handleEditServico(servico)}>Editar</Button>
                      <Button size="sm" w={{ base: '100%', md: 'auto' }} variant="solid" leftIcon={<Eye size={16}/>} onClick={()=>handleViewServico(servico)}>Ver Detalhes</Button>
                      <Button size="sm" w={{ base: '100%', md: 'auto' }} variant={servico.servicoAtivo?'solid':'outline'} onClick={()=>handleToggleStatus(servico.id)} leftIcon={servico.servicoAtivo ? <ToggleRight size={16}/> : <ToggleLeft size={16}/>}>{servico.servicoAtivo ? 'Ativo' : 'Inativo'}</Button>
                    </HStack>
                  </Flex>
                </Box>
              )
            })}
          </VStack>
        </Box>
      )}

      {/* View Service Modal - Chakra UI */}
      <Modal isOpen={showViewModal && !!selectedServico} onClose={() => setShowViewModal(false)} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Heading size="md">Detalhes do Serviço</Heading>
          </ModalHeader>
          <ModalCloseButton />
          {selectedServico && (
            <ModalBody>
              <VStack align="stretch" spacing={4}>
                <Flex gap={4} direction={{ base: 'column', md: 'row' }} align={{ base: 'stretch', md: 'center' }}>
                  <Box>
                    <Box
                      borderRadius="md"
                      bg={getCategoriaInfo(selectedServico.categoriaServico).color}
                      w={{ base: '100%', md: '120px' }}
                      h={{ base: '120px', md: '120px' }}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      {(() => {
                        const IconComponent = getCategoriaInfo(selectedServico.categoriaServico).icon
                        return IconComponent ? <IconComponent size={48} color="white" /> : null
                      })()}
                    </Box>
                  </Box>
                  <Box flex={1}>
                    <Heading size="sm" mb={1}>{selectedServico.nomeServico}</Heading>
                    <Text color={colorTextSecondary}>{selectedServico.descricaoServico}</Text>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} mt={3}>
                      <HStack>
                        <DollarSign size={18} />
                        <VStack align="start" spacing={0}>
                          <Text fontSize="sm" color={colorTextSecondary}>Valor</Text>
                          <Text fontWeight="semibold">{formatCurrency(selectedServico.valorServico)}</Text>
                        </VStack>
                      </HStack>
                      <HStack>
                        <Clock size={18} />
                        <VStack align="start" spacing={0}>
                          <Text fontSize="sm" color={colorTextSecondary}>Duração</Text>
                          <Text fontWeight="semibold">{formatDuration(selectedServico.duracaoServico)}</Text>
                        </VStack>
                      </HStack>
                    </SimpleGrid>
                  </Box>
                </Flex>

                <Box>
                  <Heading size="sm" mb={2}>Profissionais Habilitados</Heading>
                  <Wrap>
                    {selectedServico.profissionaisServico.map((prof, index) => (
                      <WrapItem key={index}>
                        <Badge colorScheme="purple" variant="subtle">{prof}</Badge>
                      </WrapItem>
                    ))}
                  </Wrap>
                </Box>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                  <HStack>
                    <Tag size={16} />
                    <Text><b>Categoria:</b> {getCategoriaInfo(selectedServico.categoriaServico).nome}</Text>
                  </HStack>
                  <HStack>
                    <Text><b>Status:</b></Text>
                    <Badge colorScheme={selectedServico.servicoAtivo ? 'green' : 'red'}>
                      {selectedServico.servicoAtivo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </HStack>
                </SimpleGrid>
              </VStack>
            </ModalBody>
          )}
          <ModalFooter>
            <HStack w="100%" justify="space-between">
              <Button variant="ghost" onClick={() => setShowViewModal(false)}>Fechar</Button>
              {selectedServico && (
                <Button variant="solid" leftIcon={<Edit size={16}/>} onClick={() => { setShowViewModal(false); handleEditServico(selectedServico) }}>Editar Serviço</Button>
              )}
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Service Modal - Chakra UI */}
      <Modal isOpen={showEditModal && !!selectedServico} onClose={() => setShowEditModal(false)} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Heading size="md">Editar Serviço</Heading>
          </ModalHeader>
          <ModalCloseButton />
          {selectedServico && (
            <form onSubmit={handleUpdateServico}>
              <ModalBody>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel htmlFor="nome">Nome do Serviço</FormLabel>
                    <Input id="nome" value={nomeServico} onChange={(e)=>setNomeServico(e.target.value)} placeholder="Ex: Corte Masculino" />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel htmlFor="valor">Valor (R$)</FormLabel>
                    <Input id="valor" type="number" step="0.01" min="0" value={valorServico} onChange={(e)=>setValorServico(e.target.value)} placeholder="0,00" />
                  </FormControl>
                </SimpleGrid>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mt={4}>
                  <FormControl isRequired>
                    <FormLabel htmlFor="duracao">Duração (minutos)</FormLabel>
                    <Input id="duracao" type="number" min="1" value={duracaoServico} onChange={(e)=>setDuracaoServico(e.target.value)} placeholder="30" />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel htmlFor="categoria">Categoria</FormLabel>
                    <Select id="categoria" value={categoriaServico} onChange={(e)=>setCategoriaServico(e.target.value)} placeholder="Selecione uma categoria">
                      {categorias.map((cat)=> (
                        <option key={cat.id} value={cat.id}>{cat.nome}</option>
                      ))}
                    </Select>
                  </FormControl>
                </SimpleGrid>
                <FormControl mt={4}>
                  <FormLabel htmlFor="descricao">Descrição</FormLabel>
                  <Textarea id="descricao" rows={3} value={descricaoServico} onChange={(e)=>setDescricaoServico(e.target.value)} placeholder="Breve descrição do serviço..." />
                </FormControl>

                <Box mt={6}>
                  <FormLabel>Profissionais Habilitados</FormLabel>
                  <Text fontSize="sm" color={colorTextSecondary} mb={2}>Selecione quais profissionais podem executar este serviço</Text>
                  <VStack align="stretch" spacing={1} maxH="40vh" overflowY="auto">
                    {nomeEstabelecimento && (
                      <Checkbox isChecked={profissionaisSelecionados.includes(nomeEstabelecimento)} onChange={()=>handleProfissionalToggle(nomeEstabelecimento)}>
                        {nomeEstabelecimento} (Administrador)
                      </Checkbox>
                    )}
                    {colaboradores.length > 0 ? (
                      colaboradores.map((colab)=> (
                        <Checkbox key={colab.id} isChecked={profissionaisSelecionados.includes(colab.nome)} onChange={()=>handleProfissionalToggle(colab.nome)}>
                          {colab.nome}
                        </Checkbox>
                      ))
                    ) : (
                      <Text fontSize="sm" color={colorTextSecondary}>Nenhum profissional encontrado. Cadastre um profissional primeiro.</Text>
                    )}
                  </VStack>
                  {profissionaisSelecionados.length === 0 && (
                    <Text fontSize="xs" color="red.500" mt={2}>Selecione pelo menos um profissional</Text>
                  )}
                </Box>

                <Box mt={4}>
                  <Checkbox id="ativo" isChecked={servicoAtivo} onChange={(e)=>setServicoAtivo(e.target.checked)}>Serviço ativo</Checkbox>
                  <Text fontSize="xs" color={colorTextSecondary}>Serviços inativos não aparecem para agendamento</Text>
                </Box>
              </ModalBody>
              <ModalFooter>
                <HStack w="100%" justify="space-between">
                  <Button variant="ghost" onClick={()=>setShowEditModal(false)}>Cancelar</Button>
                  <Button type="submit" colorScheme="purple" leftIcon={<Check size={16} />}>Salvar Alterações</Button>
                </HStack>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>

      {/* Add Service Modal - Chakra UI */}
      <Modal isOpen={showModal} onClose={handleCloseModal} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack justify="space-between">
              <HStack>
                <Button variant="ghost" size="sm" onClick={formStep > 1 ? handlePrevStep : handleCloseModal} leftIcon={<ArrowLeft size={18}/>}>Voltar</Button>
                <Heading size="md">
                  {formStep === 1 && 'Novo Serviço'}
                  {formStep === 2 && 'Configurações'}
                  {formStep === 3 && 'Finalizar'}
                </Heading>
              </HStack>
              <HStack spacing={2} display={{ base: 'none', md: 'flex' }}>
                <Badge colorScheme={formStep>=1?'purple':'gray'}>1</Badge>
                <Badge colorScheme={formStep>=2?'purple':'gray'}>2</Badge>
                <Badge colorScheme={formStep>=3?'purple':'gray'}>3</Badge>
              </HStack>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <form onSubmit={handleSubmit}>
            {formStep === 1 && (
              <ModalBody>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel htmlFor="nome">Nome do Serviço</FormLabel>
                    <Input id="nome" placeholder="Ex: Corte Masculino, Unha em Gel..." value={nomeServico} onChange={(e)=>setNomeServico(e.target.value)} />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel htmlFor="valor">Valor (R$)</FormLabel>
                    <Input id="valor" type="number" step="0.01" min="0" placeholder="0,00" value={valorServico} onChange={(e)=>setValorServico(e.target.value)} />
                  </FormControl>
                </SimpleGrid>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mt={4}>
                  <FormControl isRequired>
                    <FormLabel htmlFor="duracao">Duração (minutos)</FormLabel>
                    <Input id="duracao" type="number" min="1" placeholder="30" value={duracaoServico} onChange={(e)=>setDuracaoServico(e.target.value)} />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel htmlFor="categoria">Categoria</FormLabel>
                    <Select id="categoria" placeholder="Selecione uma categoria" value={categoriaServico} onChange={(e)=>setCategoriaServico(e.target.value)}>
                      {categorias.map((cat)=> (
                        <option key={cat.id} value={cat.id}>{cat.nome}</option>
                      ))}
                    </Select>
                  </FormControl>
                </SimpleGrid>
                <FormControl mt={4}>
                  <FormLabel htmlFor="descricao">Descrição</FormLabel>
                  <Textarea id="descricao" rows={4} placeholder="Breve descrição do serviço oferecido..." value={descricaoServico} onChange={(e)=>setDescricaoServico(e.target.value)} />
                </FormControl>
              </ModalBody>
            )}
            {formStep === 2 && (
              <ModalBody>
                <Box>
                  <Heading size="sm" mb={3}>Configurações do Serviço</Heading>
                  <Box>
                    <FormLabel>Profissionais Habilitados</FormLabel>
                    <Text fontSize="sm" color={colorTextSecondary} mb={2}>Selecione quais profissionais podem executar este serviço</Text>
                    <VStack align="stretch" spacing={1} maxH="40vh" overflowY="auto">
                      {nomeEstabelecimento && (
                        <Checkbox isChecked={profissionaisSelecionados.includes(nomeEstabelecimento)} onChange={()=>handleProfissionalToggle(nomeEstabelecimento)}>
                          {nomeEstabelecimento} (Administrador)
                        </Checkbox>
                      )}
                      {colaboradores.length > 0 ? (
                        colaboradores.map((colab)=> (
                          <Checkbox key={colab.id} isChecked={profissionaisSelecionados.includes(colab.nome)} onChange={()=>handleProfissionalToggle(colab.nome)}>
                            {colab.nome}
                          </Checkbox>
                        ))
                      ) : (
                        <Text fontSize="sm" color={colorTextSecondary}>Nenhum profissional encontrado. Cadastre um profissional primeiro.</Text>
                      )}
                    </VStack>
                    {profissionaisSelecionados.length === 0 && (
                      <Text fontSize="xs" color="red.500" mt={2}>Selecione pelo menos um profissional</Text>
                    )}
                  </Box>
                  <Box mt={4}>
                    <HStack>
                      <Checkbox id="ativo" isChecked={servicoAtivo} onChange={(e)=>setServicoAtivo(e.target.checked)}>Serviço ativo</Checkbox>
                    </HStack>
                    <Text fontSize="xs" color={colorTextSecondary}>Serviços inativos não aparecem para agendamento</Text>
                  </Box>
                </Box>
              </ModalBody>
            )}
            {formStep === 3 && (
              <ModalBody>
                <Box>
                  <Heading size="sm" mb={3}>Revisar Informações</Heading>
                  <VStack align="stretch" spacing={3}>
                    <Text><b>Nome:</b> {nomeServico || '—'}</Text>
                    <Text><b>Descrição:</b> {descricaoServico || 'Sem descrição'}</Text>
                    <HStack><DollarSign size={16}/><Text>{formatCurrency(Number.parseFloat(valorServico || '0'))}</Text></HStack>
                    <HStack><Clock size={16}/><Text>{formatDuration(Number.parseInt(duracaoServico || '0'))}</Text></HStack>
                    <HStack><Tag size={16}/><Text>{(categorias.find(c=>c.id===categoriaServico)?.nome) || '—'}</Text></HStack>
                    <Box>
                      <Text fontWeight="semibold">Profissionais:</Text>
                      <Wrap mt={1}>
                        {profissionaisSelecionados.map((p, i)=> (
                          <WrapItem key={i}><Badge colorScheme="purple" variant="subtle">{p}</Badge></WrapItem>
                        ))}
                      </Wrap>
                    </Box>
                    <HStack>
                      <Text fontWeight="semibold">Status:</Text>
                      <Badge colorScheme={servicoAtivo ? 'green' : 'red'}>{servicoAtivo ? 'Ativo' : 'Inativo'}</Badge>
                    </HStack>
                    {nomeEstabelecimento === '' && (
                      <Text color="red.500">O nome do estabelecimento não foi carregado. Aguarde ou recarregue a página.</Text>
                    )}
                  </VStack>
                </Box>
              </ModalBody>
            )}
            <ModalFooter>
              {formStep === 1 && (
                <HStack w="100%" justify="space-between">
                  <Button variant="ghost" onClick={handleCloseModal}>Cancelar</Button>
                  <Button colorScheme="purple" onClick={handleNextStep} rightIcon={<ChevronDown size={16} />}>Próximo</Button>
                </HStack>
              )}
              {formStep === 2 && (
                <HStack w="100%" justify="space-between">
                  <Button variant="ghost" leftIcon={<ChevronDown size={16} style={{ transform: 'rotate(90deg)' }} />} onClick={handlePrevStep}>Voltar</Button>
                  <Button colorScheme="purple" onClick={handleNextStep} rightIcon={<ChevronDown size={16} />} isDisabled={profissionaisSelecionados.length === 0}>Próximo</Button>
                </HStack>
              )}
              {formStep === 3 && (
                <HStack w="100%" justify="space-between">
                  <Button variant="ghost" leftIcon={<ChevronDown size={16} style={{ transform: 'rotate(90deg)' }} />} onClick={handlePrevStep}>Voltar</Button>
                  <Button type="submit" colorScheme="purple" leftIcon={<Check size={16} />} isDisabled={nomeEstabelecimento === ''}>Cadastrar Serviço</Button>
                </HStack>
              )}
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Modal de Edição de Categorias */}
      <Modal isOpen={categoriasModalOpen} onClose={()=>setCategoriasModalOpen(false)} size={{ base: 'full', md: 'lg' }}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Heading size="md">Editar Categorias</Heading>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch" spacing={4}>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
                <FormControl isRequired>
                  <FormLabel>Nome da Categoria</FormLabel>
                  <Input placeholder="Ex: Sobrancelha" value={novaCategoriaNome} onChange={(e)=>setNovaCategoriaNome(e.target.value)} />
                </FormControl>
                <FormControl>
                  <FormLabel>Ícone</FormLabel>
                  <Select value={novaCategoriaIcon} onChange={(e)=>setNovaCategoriaIcon(e.target.value)}>
                    <option value="Scissors">Tesoura</option>
                    <option value="Sparkles">Unhas</option>
                    <option value="Palette">Estética</option>
                    <option value="User">Barba</option>
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>Cor</FormLabel>
                  <Input type="color" value={novaCategoriaCor} onChange={(e)=>setNovaCategoriaCor(e.target.value)} />
                </FormControl>
              </SimpleGrid>
              <HStack>
                <Button leftIcon={<PlusCircle size={16}/>} colorScheme="purple" onClick={handleAddCategoria}>Adicionar</Button>
              </HStack>

              <Box>
                <Heading size="sm" mb={2}>Categorias Atuais</Heading>
                <Wrap>
                  {categorias.map(cat => (
                    <WrapItem key={cat.id}>
                      <HStack borderWidth="1px" borderColor={colorBorder} borderRadius="md" p={2} spacing={2}>
                        {cat.icon ? <cat.icon size={16} /> : null}
                        <Text>{cat.nome}</Text>
                        <Box w="14px" h="14px" borderRadius="sm" bg={cat.color} border="1px" borderColor={colorBorder} />
                        <Button size="xs" variant="outline" colorScheme="red" leftIcon={<Trash size={12}/>} onClick={()=>handleRemoveCategoria(cat.id)}>Remover</Button>
                      </HStack>
                    </WrapItem>
                  ))}
                </Wrap>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack w="100%" justify="flex-end">
              <Button variant="ghost" onClick={()=>setCategoriasModalOpen(false)}>Fechar</Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}

export default Servicos
