"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import {
  Search,
  UserPlus,
  Users,
  Filter,
  Calendar,
  Mail,
  Phone,
  Instagram,
  X,
  ChevronDown,
  Check,
  ArrowLeft,
  Trash2,
  User,
  MapPin,
  Tag,
  Clock,
  Edit,
} from "lucide-react"
import { firestore } from "../../../firebase/firebase"
import { collection, addDoc, onSnapshot, query, where, doc, getDoc } from "firebase/firestore"
import { deleteDoc, updateDoc } from "firebase/firestore"
import {
  Box,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Badge,
  SimpleGrid,
  useColorModeValue,
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
  Textarea,
  Checkbox,
  Switch,
  Avatar,
  IconButton,
  Tooltip,
  Wrap,
  WrapItem,
} from '@chakra-ui/react'

export default function ClienteAtendente() {
  const { uid } = useParams()
  const [showModal, setShowModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [formStep, setFormStep] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [filterStatus, setFilterStatus] = useState("all")
  const [nomeClinte, setNomeCliente] = useState<string>("")
  const [sobreNomeClinte, setSobreNomeCliente] = useState<string>("")
  const [cpfClinte, setCpfCliente] = useState<string>("")
  const [dataNascimentoClinte, setDataNascimentoCliente] = useState<string>("")
  const [agendamentoOnline, setAgendamentoOnline] = useState<boolean>(false)
  const [cepCliente, setCepCliente] = useState<string>("")
  const [cidadeCliente, setCidadeCliente] = useState<string>("")
  const [ruaClinte, setRuaCliente] = useState<string>("")
  const [numeroCasaClinte, setNumeroCasaCliente] = useState<string>("")
  const [complementoCasaClinte, setComplementoCasaCliente] = useState<string>("")
  const [telefoneContato, setTelefoneContato] = useState<string>("")
  const [whatsappContato, setWhatsappContato] = useState<string>("")
  const [emailContato, setEmailContato] = useState<string>("")
  const [instagramContato, setInstagramContato] = useState<string>("")
  const [comoConheceu, setComoConheceu] = useState<string>("")
  const [anotacoesImportantes, setAnotacoesImportantes] = useState<string>("")
  const [firestoreClients, setFirestoreClients] = useState<any[]>([])
  const [estabelecimento, setEstabelecimento] = useState("")

  // Estados para o modal de edição
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [editFormData, setEditFormData] = useState<any>({})
  const [estabelecimentoCliente, setEstabelecimentoCliente] = useState<string>("")
  const [tipoCadastroInfo, setTipoCadastroInfo] = useState<any>({})

  const filteredClients = firestoreClients.filter((client) => {
    const clientName = client?.nome || ""
    const clientPhone = client?.telefone || ""
    const clientEmail = client?.email || ""

    const matchesSearch =
      clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clientPhone.includes(searchQuery) ||
      clientEmail.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && client.status === "active") ||
      (filterStatus === "inactive" && client.status === "inactive")

    return matchesSearch && matchesStatus
  })

  const handleOpenModal = () => {
    setShowModal(true)
    setFormStep(1)
  }

  const handleCloseModal = () => {
    setShowModal(false)
  }

  const handleNextStep = () => {
    setFormStep(formStep + 1)
  }

  const handlePrevStep = () => {
    setFormStep(formStep - 1)
  }

  const fetchAddressByCep = async (cep: string) => {
    const cleanedCep = cep.replace(/\D/g, "")

    if (cleanedCep.length !== 8) {
      setCidadeCliente("")
      setRuaCliente("")
      setComplementoCasaCliente("")
      return
    }

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`)
      const data = await response.json()

      if (data.erro) {
        alert("CEP não encontrado.")
        setCidadeCliente("")
        setRuaCliente("")
        setComplementoCasaCliente("")
        return
      }

      setCidadeCliente(data.localidade)
      setRuaCliente(data.logradouro)
      setComplementoCasaCliente(data.complemento)
    } catch (error) {
      console.error("Erro ao buscar CEP:", error)
      alert("Erro ao buscar CEP. Tente novamente.")
      setCidadeCliente("")
      setRuaCliente("")
      setComplementoCasaCliente("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!uid || !estabelecimento) {
        alert("Erro: UID do usuário ou nome do estabelecimento não encontrado.")
        return
      }
      // Coletar todos os campos do modal
      const novoCliente = {
        nome: nomeClinte,
        sobrenome: sobreNomeClinte,
        cpf: cpfClinte,
        dataNascimento: dataNascimentoClinte,
        agendamentoOnline: agendamentoOnline,
        telefone: telefoneContato,
        whatsapp: whatsappContato,
        email: emailContato,
        instagram: instagramContato,
        cep: cepCliente,
        cidade: cidadeCliente,
        rua: ruaClinte,
        numeroCasa: numeroCasaClinte,
        complementoCasa: complementoCasaClinte,
        comoConheceu: comoConheceu,
        anotacoesImportantes: anotacoesImportantes,
        tags: selectedTags,
        dataCriacao: new Date(),
        cadastradoPor: uid,
        estabelecimento: estabelecimento,
      }
      const clientesCollectionRef = collection(firestore, "clienteUser")
      await addDoc(clientesCollectionRef, novoCliente)
      alert("Cliente cadastrado com sucesso!")
      handleCloseModal()
      setNomeCliente("")
      setSobreNomeCliente("")
      setCpfCliente("")
      setDataNascimentoCliente("")
      setAgendamentoOnline(false)
      setTelefoneContato("")
      setWhatsappContato("")
      setEmailContato("")
      setInstagramContato("")
      setCepCliente("")
      setCidadeCliente("")
      setRuaCliente("")
      setNumeroCasaCliente("")
      setComplementoCasaCliente("")
      setComoConheceu("")
      setAnotacoesImportantes("")
      setSelectedTags([])
      setFormStep(1)
    } catch (error) {
      console.error("Erro ao cadastrar cliente:", error)
      alert("Erro ao cadastrar cliente: " + error)
    }
  }

  const handleDeleteClient = async (clientId: string) => {
    if (!uid) {
      alert("Erro: UID do usuário não encontrado para exclusão.")
      return
    }
    if (!confirm("Tem certeza que deseja excluir este cliente?")) {
      return
    }

    try {
      const clientDocRef = doc(firestore, "clienteUser", clientId)
      await deleteDoc(clientDocRef)
      console.log("Cliente excluído com sucesso!")
    } catch (error) {
      console.error("Erro ao excluir cliente:", error)
      alert("Erro ao excluir cliente: " + error)
    }
  }

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!uid || !selectedClient) {
      alert("Erro: UID do usuário ou cliente selecionado não encontrado para atualização.")
      return
    }

    try {
      const clientDocRef = doc(firestore, "clienteUser", selectedClient.id)
      await updateDoc(clientDocRef, editFormData)

      console.log("Cliente atualizado com sucesso!")
      alert("Cliente atualizado com sucesso!")
      setShowEditModal(false)
      setSelectedClient(null)
      setEditFormData({})
    } catch (error) {
      console.error("Erro ao atualizar cliente:", error)
      alert("Erro ao atualizar cliente: " + error)
    }
  }

  // Buscar nome do estabelecimento do atendente logado
  useEffect(() => {
    if (!uid) return
    const fetchEstabelecimento = async () => {
      const atendenteDocRef = doc(firestore, "colaboradores", uid)
      const atendenteDoc = await getDoc(atendenteDocRef)
      if (atendenteDoc.exists()) {
        const atendenteData = atendenteDoc.data()
        setEstabelecimento(atendenteData.estabelecimento || "")
      }
    }
    fetchEstabelecimento()
  }, [uid])

  // Sistema automático de identificação do tipo de cadastro
  const getTipoCadastro = (cadastradoPor: string) => {
    if (!cadastradoPor) return { tipo: 'desconhecido', nome: 'N/A' }
    
    // Padrões para identificar cadastro automático via agendamento
    const padroesAgendamento = [
      'agendaAdmin',
      'agendamento',
      'auto',
      'sistema',
      'online'
    ]
    
    // Verifica se contém algum padrão de agendamento automático
    const isAgendamentoAutomatico = padroesAgendamento.some(padrao => 
      cadastradoPor.toLowerCase().includes(padrao.toLowerCase())
    )
    
    if (isAgendamentoAutomatico) {
      return { 
        tipo: 'agendamento_automatico', 
        nome: 'Agendamento Online Automático',
        descricao: 'Cliente se cadastrou automaticamente via agendamento online'
      }
    }
    
    // Se não for agendamento automático, é cadastro manual
    return { 
      tipo: 'cadastro_manual', 
      nome: 'Cadastro Manual',
      descricao: 'Cliente cadastrado manualmente pelo estabelecimento'
    }
  }

  // Função para buscar o nome do estabelecimento baseado no cadastradoPor
  const getEstabelecimentoName = async (cadastradoPor: string) => {
    if (!cadastradoPor) return "N/A"
    
    const tipoCadastro = getTipoCadastro(cadastradoPor)
    
    // Se for agendamento automático, busca na coleção agendaAdmin
    if (tipoCadastro.tipo === 'agendamento_automatico') {
      try {
        const agendaAdminDocRef = doc(firestore, "agendaAdmin", cadastradoPor)
        const agendaAdminDoc = await getDoc(agendaAdminDocRef)
        if (agendaAdminDoc.exists()) {
          const agendaData = agendaAdminDoc.data()
          return agendaData.nomeEstabelecimento || "Estabelecimento não encontrado"
        }
      } catch (error) {
        console.error("Erro ao buscar estabelecimento na agendaAdmin:", error)
      }
    }
    
    // Se for cadastro manual, busca na coleção colaboradores
    if (tipoCadastro.tipo === 'cadastro_manual') {
      try {
        const colaboradorDocRef = doc(firestore, "colaboradores", cadastradoPor)
        const colaboradorDoc = await getDoc(colaboradorDocRef)
        if (colaboradorDoc.exists()) {
          const colaboradorData = colaboradorDoc.data()
          return colaboradorData.estabelecimento || "Estabelecimento não encontrado"
        }
      } catch (error) {
        console.error("Erro ao buscar estabelecimento nos colaboradores:", error)
      }
    }
    
    return "Estabelecimento não encontrado"
  }

  // Buscar clientes em tempo real pelo nome do estabelecimento
  useEffect(() => {
    if (!estabelecimento) return
    const clientesRef = collection(firestore, "clienteUser")
    const q = query(clientesRef, where("estabelecimento", "==", estabelecimento))
    const unsub = onSnapshot(q, (snapshot) => {
      setFirestoreClients(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })))
    })
    return () => unsub()
  }, [estabelecimento])

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag))
    } else {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const formatDate = (date: any) => {
    if (!date) return "N/A"

    try {
      if (date.toDate) {
        date = date.toDate()
      }

      if (typeof date === "string") {
        date = new Date(date)
      }

      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(date)
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Data inválida"
    }
  }


  useEffect(() => {
    if (selectedClient) {
      setEditFormData({
        nome: selectedClient.nome || "",
        sobrenome: selectedClient.sobrenome || "",
        cpf: selectedClient.cpf || "",
        dataNascimento: selectedClient.dataNascimento || "",
        agendamentoOnline: selectedClient.agendamentoOnline || false,
        telefone: selectedClient.telefone || "",
        whatsapp: selectedClient.whatsapp || "",
        email: selectedClient.email || "",
        instagram: selectedClient.instagram || "",
        cep: selectedClient.cep || "",
        cidade: selectedClient.cidade || "",
        rua: selectedClient.rua || "",
        numeroCasa: selectedClient.numeroCasa || "",
        complementoCasa: selectedClient.complementoCasa || "",
        comoConheceu: selectedClient.comoConheceu || "",
        anotacoesImportantes: selectedClient.anotacoesImportantes || "",
        tags: selectedClient.tags || [],
        dataCriacao: selectedClient.dataCriacao || null,
        cadastradoPor: selectedClient.cadastradoPor || null,
      })
      
      // Identificar tipo de cadastro e buscar informações
      if (selectedClient.cadastradoPor) {
        const tipoInfo = getTipoCadastro(selectedClient.cadastradoPor)
        setTipoCadastroInfo(tipoInfo)
        
        getEstabelecimentoName(selectedClient.cadastradoPor).then(nomeEstabelecimento => {
          setEstabelecimentoCliente(nomeEstabelecimento)
        })
      } else {
        setTipoCadastroInfo({ tipo: 'desconhecido', nome: 'N/A', descricao: 'Informação não disponível' })
        setEstabelecimentoCliente("N/A")
      }
    } else {
      setEditFormData({})
      setEstabelecimentoCliente("")
      setTipoCadastroInfo({})
    }
  }, [selectedClient])

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')} p={4} overflowY="auto">
      {/* Header */}
      <Box bg={useColorModeValue('white', 'gray.800')} borderRadius="lg" p={6} mb={6} boxShadow="sm">
        <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'stretch', md: 'center' }} gap={4}>
          <Box>
            <Heading size="lg" mb={2}>Clientes</Heading>
            <Text color={useColorModeValue('gray.600', 'gray.300')}>Gerencie seus clientes e histórico de atendimentos</Text>
          </Box>
          <HStack spacing={3}>
            <Button variant="outline" leftIcon={<Filter size={18} />} onClick={() => setShowFilters(!showFilters)}>
              Filtros
            </Button>
            <Button colorScheme="blue" leftIcon={<UserPlus size={18} />} onClick={handleOpenModal}>
              Cadastrar Cliente
            </Button>
          </HStack>
        </Flex>
      </Box>

      {/* Filters */}
      {showFilters && (
        <Box bg={useColorModeValue('white', 'gray.800')} borderRadius="lg" p={6} mb={6} boxShadow="sm">
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            <Box>
              <Text fontWeight="semibold" mb={3}>Status</Text>
              <HStack spacing={2} flexWrap="wrap">
                <Button size="sm" variant={filterStatus === "all" ? "solid" : "outline"} onClick={() => setFilterStatus("all")}>
                  Todos
                </Button>
                <Button size="sm" variant={filterStatus === "active" ? "solid" : "outline"} onClick={() => setFilterStatus("active")}>
                  Ativos
                </Button>
                <Button size="sm" variant={filterStatus === "inactive" ? "solid" : "outline"} onClick={() => setFilterStatus("inactive")}>
                  Inativos
                </Button>
              </HStack>
            </Box>
            <Box>
              <Text fontWeight="semibold" mb={3}>Tags</Text>
              <Wrap spacing={2}>
                {["VIP", "Novo", "Cabelo", "Manicure", "Barba"].map((tag) => (
                  <WrapItem key={tag}>
                    <Badge
                      as="button"
                      colorScheme={selectedTags.includes(tag) ? "blue" : "gray"}
                      variant={selectedTags.includes(tag) ? "solid" : "outline"}
                      cursor="pointer"
                      onClick={() => toggleTag(tag)}
                      _hover={{ opacity: 0.8 }}
                    >
                      {tag}
                    </Badge>
                  </WrapItem>
                ))}
              </Wrap>
            </Box>
          </SimpleGrid>
        </Box>
      )}

      {/* Search */}
      <Box bg={useColorModeValue('white', 'gray.800')} borderRadius="lg" p={6} mb={6} boxShadow="sm">
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <Search size={20} />
          </InputLeftElement>
          <Input
            placeholder="Buscar por nome, telefone ou email"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <IconButton
              aria-label="Limpar busca"
              icon={<X size={16} />}
              size="sm"
              variant="ghost"
              onClick={() => setSearchQuery("")}
            />
          )}
        </InputGroup>
        
        {filteredClients && filteredClients.length > 0 ? (
          <Text mt={3} color={useColorModeValue('gray.600', 'gray.300')} fontSize="sm">
            {filteredClients.length} cliente(s) encontrado(s)
          </Text>
        ) : filteredClients && filteredClients.length === 0 && searchQuery ? (
          <VStack py={10} spacing={4} color={useColorModeValue('gray.500', 'gray.400')}>
            <Users size={48} />
            <Heading size="md">Nenhum cliente encontrado para sua busca</Heading>
            <Text textAlign="center">Tente ajustar sua busca ou cadastre um novo cliente</Text>
            <Button colorScheme="blue" leftIcon={<UserPlus size={18} />} onClick={handleOpenModal}>
              Cadastrar Cliente
            </Button>
          </VStack>
        ) : filteredClients && filteredClients.length === 0 && !searchQuery ? (
          <VStack py={10} spacing={4} color={useColorModeValue('gray.500', 'gray.400')}>
            <Users size={48} />
            <Heading size="md">Nenhum cliente cadastrado</Heading>
            <Text textAlign="center">Cadastre seu primeiro cliente para começar!</Text>
            <Button colorScheme="blue" leftIcon={<UserPlus size={18} />} onClick={handleOpenModal}>
              Cadastrar Cliente
            </Button>
          </VStack>
        ) : null}
      </Box>

      {/* Client List */}
      {Array.isArray(filteredClients) && filteredClients.length > 0 && (
        <Box maxH="70vh" overflowY="auto" pr={2} sx={{ WebkitOverflowScrolling: 'touch' }}>
          <VStack spacing={4} align="stretch">
            {filteredClients.map((client) => (
            <Box key={client.id} bg={useColorModeValue('white', 'gray.800')} borderRadius="lg" p={6} boxShadow="sm">
              <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'stretch', md: 'center' }} gap={4}>
                <Box flex={1}>
                  <Heading size="md" mb={3}>
                    {client.nome} {client.sobrenome}
                  </Heading>

                  <VStack align="stretch" spacing={2}>
                    <HStack>
                      <Phone size={16} color="blue.500" />
                      <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')}>
                        <strong>Telefone:</strong> {client.telefone || "Não informado"}
                      </Text>
                    </HStack>

                    <HStack>
                      <Mail size={16} color="blue.500" />
                      <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')}>
                        <strong>Email:</strong> {client.email || "Não informado"}
                      </Text>
                    </HStack>

                    <HStack>
                      <User size={16} color="blue.500" />
                      <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')}>
                        <strong>CPF:</strong> {client.cpf || "Não informado"}
                      </Text>
                    </HStack>

                    {client.cidade && (
                      <HStack>
                        <MapPin size={16} color="blue.500" />
                        <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')}>
                          <strong>Endereço:</strong> {client.cidade}
                        </Text>
                      </HStack>
                    )}

                    {client.dataCriacao && (
                      <HStack>
                        <Calendar size={16} color="blue.500" />
                        <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')}>
                          <strong>Cadastro:</strong> {formatDate(client.dataCriacao)}
                        </Text>
                      </HStack>
                    )}

                    {client.tags && client.tags.length > 0 && (
                      <Box>
                        <HStack mb={2}>
                          <Tag size={16} color="blue.500" />
                          <Text fontSize="sm" fontWeight="semibold">Tags:</Text>
                        </HStack>
                        <Wrap spacing={1}>
                          {client.tags.map((tag: string, index: number) => (
                            <WrapItem key={index}>
                              <Badge colorScheme="blue" variant="subtle">
                                {tag}
                              </Badge>
                            </WrapItem>
                          ))}
                        </Wrap>
                      </Box>
                    )}

                    {client.estabelecimento && (
                      <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')} mt={2}>
                        Cliente cadastrado por {client.estabelecimento}
                      </Text>
                    )}
                  </VStack>
                </Box>

                <HStack spacing={2} justify={{ base: 'center', md: 'flex-end' }}>
                  <Tooltip label="Excluir cliente">
                    <IconButton
                      aria-label="Excluir cliente"
                      icon={<Trash2 size={18} />}
                      colorScheme="red"
                      variant="ghost"
                      onClick={() => handleDeleteClient(client.id)}
                    />
                  </Tooltip>
                  <Tooltip label="Ligar">
                    <IconButton
                      aria-label="Ligar"
                      icon={<Phone size={18} />}
                      colorScheme="green"
                      variant="ghost"
                    />
                  </Tooltip>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedClient(client)
                      setShowEditModal(true)
                    }}
                  >
                    Editar perfil
                  </Button>
                </HStack>
              </Flex>
            </Box>
          ))}
          </VStack>
        </Box>
      )}

      {/* Add Client Modal */}
      <Modal isOpen={showModal} onClose={handleCloseModal} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Flex justify="space-between" align="center">
              <HStack>
                <IconButton
                  aria-label="Voltar"
                  icon={<ArrowLeft size={20} />}
                  variant="ghost"
                  onClick={formStep > 1 ? handlePrevStep : handleCloseModal}
                />
                <Heading size="md">
                  {formStep === 1 && "Novo Cliente"}
                  {formStep === 2 && "Informações de Contato"}
                  {formStep === 3 && "Preferências e Detalhes"}
                </Heading>
              </HStack>
              <HStack spacing={2}>
                <Badge colorScheme={formStep >= 1 ? "blue" : "gray"}>1</Badge>
                <Badge colorScheme={formStep >= 2 ? "blue" : "gray"}>2</Badge>
                <Badge colorScheme={formStep >= 3 ? "blue" : "gray"}>3</Badge>
              </HStack>
            </Flex>
          </ModalHeader>
          <ModalCloseButton />

          <form onSubmit={handleSubmit}>
            {/* Step 1: Basic Information */}
            {formStep === 1 && (
              <>
              <ModalBody>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Nome</FormLabel>
                    <Input
                      placeholder="Nome do cliente"
                      value={nomeClinte}
                      onChange={(e) => setNomeCliente(e.target.value)}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Sobrenome</FormLabel>
                    <Input
                      placeholder="Sobrenome do cliente"
                      value={sobreNomeClinte}
                      onChange={(e) => setSobreNomeCliente(e.target.value)}
                    />
                  </FormControl>
                </SimpleGrid>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl>
                    <FormLabel>CPF</FormLabel>
                    <Input
                      placeholder="000.000.000-00"
                      value={cpfClinte}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "")
                        let maskedValue = value

                        if (value.length > 3) {
                          maskedValue = `${maskedValue.slice(0, 3)}.${maskedValue.slice(3)}`
                        }
                        if (value.length > 6) {
                          maskedValue = `${maskedValue.slice(0, 7)}.${maskedValue.slice(7)}`
                        }
                        if (value.length > 9) {
                          maskedValue = `${maskedValue.slice(0, 11)}-${maskedValue.slice(11)}`
                        }
                        if (maskedValue.length > 14) {
                          maskedValue = maskedValue.slice(0, 14)
                        }

                        setCpfCliente(maskedValue)
                      }}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Data de Nascimento</FormLabel>
                    <Input
                      type="date"
                      value={dataNascimentoClinte}
                      onChange={(e) => setDataNascimentoCliente(e.target.value)}
                    />
                  </FormControl>
                </SimpleGrid>

                <FormControl>
                  <FormLabel>Agendamento Online</FormLabel>
                  <HStack>
                    <Switch
                      isChecked={agendamentoOnline}
                      onChange={(e) => setAgendamentoOnline(e.target.checked)}
                    />
                    <Text>{agendamentoOnline ? "Habilitado" : "Desabilitado"}</Text>
                  </HStack>
                  <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')} mt={1}>
                    Este cliente poderá marcar agendamentos online.
                  </Text>
                </FormControl>

              </ModalBody>
              <ModalFooter>
                <HStack spacing={3}>
                  <Button variant="ghost" onClick={handleCloseModal}>
                    Cancelar
                  </Button>
                  <Button colorScheme="blue" onClick={handleNextStep} rightIcon={<ChevronDown size={18} />}>
                    Próximo
                  </Button>
                </HStack>
              </ModalFooter>
              </>
            )}

            {/* Step 2: Contact Information */}
            {formStep === 2 && (
              <>
              <ModalBody>
                <VStack spacing={6} align="stretch">
                  <Box>
                    <Heading size="sm" mb={4}>Informações de Contato</Heading>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <FormControl isRequired>
                        <FormLabel>Telefone</FormLabel>
                        <InputGroup>
                          <InputLeftElement pointerEvents="none">
                            <Phone size={18} />
                          </InputLeftElement>
                          <Input
                            type="tel"
                            placeholder="(00) 00000-0000"
                            value={telefoneContato}
                            onChange={(e) => setTelefoneContato(e.target.value)}
                          />
                        </InputGroup>
                      </FormControl>
                      <FormControl>
                        <FormLabel>WhatsApp</FormLabel>
                        <InputGroup>
                          <InputLeftElement pointerEvents="none">
                            <Phone size={18} />
                          </InputLeftElement>
                          <Input
                            type="tel"
                            placeholder="(00) 00000-0000"
                            value={whatsappContato}
                            onChange={(e) => setWhatsappContato(e.target.value)}
                          />
                        </InputGroup>
                      </FormControl>
                    </SimpleGrid>

                    <FormControl>
                      <FormLabel>E-mail</FormLabel>
                      <InputGroup>
                        <InputLeftElement pointerEvents="none">
                          <Mail size={18} />
                        </InputLeftElement>
                        <Input
                          type="email"
                          placeholder="email@exemplo.com"
                          value={emailContato}
                          onChange={(e) => setEmailContato(e.target.value)}
                        />
                      </InputGroup>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Instagram</FormLabel>
                      <InputGroup>
                        <InputLeftElement pointerEvents="none">
                          <Instagram size={18} />
                        </InputLeftElement>
                        <Input
                          type="text"
                          placeholder="@usuario"
                          value={instagramContato}
                          onChange={(e) => setInstagramContato(e.target.value)}
                        />
                      </InputGroup>
                    </FormControl>
                  </Box>

                  <Box>
                    <Heading size="sm" mb={4}>Endereço</Heading>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <FormControl>
                        <FormLabel>CEP</FormLabel>
                        <Input
                          placeholder="00000-000"
                          value={cepCliente}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "")
                            let maskedValue = value
                            if (value.length > 5) {
                              maskedValue = `${value.slice(0, 5)}-${value.slice(5, 8)}`
                            }
                            setCepCliente(maskedValue)
                          }}
                          onBlur={(e) => fetchAddressByCep(e.target.value)}
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Cidade</FormLabel>
                        <Input
                          placeholder="Cidade"
                          value={cidadeCliente}
                          onChange={(e) => setCidadeCliente(e.target.value)}
                        />
                      </FormControl>
                    </SimpleGrid>

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <FormControl>
                        <FormLabel>Rua</FormLabel>
                        <Input
                          placeholder="Rua, Avenida, etc"
                          value={ruaClinte}
                          onChange={(e) => setRuaCliente(e.target.value)}
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Número</FormLabel>
                        <Input
                          placeholder="Número"
                          value={numeroCasaClinte}
                          onChange={(e) => setNumeroCasaCliente(e.target.value)}
                        />
                      </FormControl>
                    </SimpleGrid>

                    <FormControl>
                      <FormLabel>Complemento</FormLabel>
                      <Input
                        placeholder="Apartamento, bloco, etc"
                        value={complementoCasaClinte}
                        onChange={(e) => setComplementoCasaCliente(e.target.value)}
                      />
                    </FormControl>
                  </Box>

                </VStack>
              </ModalBody>
              <ModalFooter>
                <HStack spacing={3}>
                  <Button variant="ghost" leftIcon={<ChevronDown size={18} />} onClick={handlePrevStep}>
                    Voltar
                  </Button>
                  <Button colorScheme="blue" rightIcon={<ChevronDown size={18} />} onClick={handleNextStep}>
                    Próximo
                  </Button>
                </HStack>
              </ModalFooter>
              </>
            )}

            {/* Step 3: Preferences and Details */}
            {formStep === 3 && (
              <>
              <ModalBody>
                <VStack spacing={6} align="stretch">
                  <Box>
                    <Heading size="sm" mb={4}>Preferências e Detalhes</Heading>
                    <FormControl>
                      <FormLabel>Como Conheceu</FormLabel>
                      <Select placeholder="Selecione uma opção" value={comoConheceu} onChange={(e) => setComoConheceu(e.target.value)}>
                        <option value="indicacao">Indicação</option>
                        <option value="redes-sociais">Redes Sociais</option>
                        <option value="google">Google</option>
                        <option value="passagem">Passagem</option>
                        <option value="outro">Outro</option>
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Tags</FormLabel>
                      <Wrap spacing={2}>
                        {["VIP", "Novo", "Cabelo", "Manicure", "Barba"].map((tag) => (
                          <WrapItem key={tag}>
                            <Badge
                              as="button"
                              colorScheme={selectedTags.includes(tag) ? "blue" : "gray"}
                              variant={selectedTags.includes(tag) ? "solid" : "outline"}
                              cursor="pointer"
                              onClick={() => toggleTag(tag)}
                              _hover={{ opacity: 0.8 }}
                            >
                              {tag}
                            </Badge>
                          </WrapItem>
                        ))}
                      </Wrap>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Anotações Importantes</FormLabel>
                      <Textarea
                        placeholder="Adicione informações importantes sobre o cliente, como alergias, preferências, etc."
                        rows={4}
                        value={anotacoesImportantes}
                        onChange={(e) => setAnotacoesImportantes(e.target.value)}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Notificações</FormLabel>
                      <VStack align="stretch" spacing={2}>
                        <Checkbox>Enviar SMS</Checkbox>
                        <Checkbox>Enviar E-mail</Checkbox>
                        <Checkbox>Enviar WhatsApp</Checkbox>
                      </VStack>
                    </FormControl>
                  </Box>

                </VStack>
              </ModalBody>
              <ModalFooter>
                <HStack spacing={3}>
                  <Button variant="ghost" leftIcon={<ChevronDown size={18} />} onClick={handlePrevStep}>
                    Voltar
                  </Button>
                  <Button type="submit" colorScheme="blue" leftIcon={<Check size={18} />}>
                    Salvar Cliente
                  </Button>
                </HStack>
              </ModalFooter>
              </>
            )}
          </form>
        </ModalContent>
      </Modal>

      {/* Edit Client Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Heading size="md">Perfil do Cliente</Heading>
          </ModalHeader>
          <ModalCloseButton />

          {selectedClient && (
            <Box p={6} bg={useColorModeValue('gray.50', 'gray.700')}>
              <Flex align="center" gap={4}>
                <Avatar size="lg" name={`${selectedClient.nome} ${selectedClient.sobrenome}`} />
                <Box flex={1}>
                  <Heading size="md" mb={2}>
                    {selectedClient.nome} {selectedClient.sobrenome}
                  </Heading>
                  <VStack align="start" spacing={1}>
                    <HStack>
                      <Phone size={16} />
                      <Text fontSize="sm">{selectedClient.telefone || "Não informado"}</Text>
                    </HStack>
                    <HStack>
                      <Mail size={16} />
                      <Text fontSize="sm">{selectedClient.email || "Não informado"}</Text>
                    </HStack>
                    <HStack>
                      <Calendar size={16} />
                      <Text fontSize="sm">Cliente desde {formatDate(selectedClient.dataCriacao)}</Text>
                    </HStack>
                  </VStack>
                  <HStack mt={2}>
                    <Box w="8px" h="8px" borderRadius="50%" bg="green.500" />
                    <Text fontSize="sm" color="green.500">Ativo</Text>
                  </HStack>
                </Box>
              </Flex>
            </Box>
          )}

          <form onSubmit={handleUpdateClient}>
            <ModalBody>
              <VStack spacing={6} align="stretch">
                {/* Informações Básicas */}
                <Box>
                  <HStack mb={4}>
                    <User size={20} />
                    <Heading size="sm">Informações Básicas</Heading>
                  </HStack>
                  
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    <FormControl isRequired>
                      <FormLabel fontSize="sm" fontWeight="medium" mb={2} minH="20px">
                        <HStack>
                          <User size={16} />
                          <Text>Nome*</Text>
                        </HStack>
                      </FormLabel>
                      <Input
                        placeholder="Nome do cliente"
                        value={editFormData.nome || ""}
                        onChange={(e) => setEditFormData({ ...editFormData, nome: e.target.value })}
                        size="md"
                        h="40px"
                      />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="medium" mb={2} minH="20px">
                        <HStack>
                          <User size={16} />
                          <Text>Sobrenome</Text>
                        </HStack>
                      </FormLabel>
                      <Input
                        placeholder="Sobrenome do cliente"
                        value={editFormData.sobrenome || ""}
                        onChange={(e) => setEditFormData({ ...editFormData, sobrenome: e.target.value })}
                        size="md"
                        h="40px"
                      />
                    </FormControl>
                  </SimpleGrid>

                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mt={4}>
                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="medium" mb={2} minH="20px">
                        <HStack>
                          <User size={16} />
                          <Text>CPF</Text>
                        </HStack>
                      </FormLabel>
                      <Input
                        placeholder="000.000.000-00"
                        value={editFormData.cpf || ""}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "")
                          let maskedValue = value
                          if (value.length > 3) {
                            maskedValue = `${maskedValue.slice(0, 3)}.${maskedValue.slice(3)}`
                          }
                          if (value.length > 6) {
                            maskedValue = `${maskedValue.slice(0, 7)}.${maskedValue.slice(7)}`
                          }
                          if (value.length > 9) {
                            maskedValue = `${maskedValue.slice(0, 11)}-${maskedValue.slice(11)}`
                          }
                          if (maskedValue.length > 14) {
                            maskedValue = maskedValue.slice(0, 14)
                          }
                          setEditFormData({ ...editFormData, cpf: maskedValue })
                        }}
                        size="md"
                        h="40px"
                      />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="medium" mb={2} minH="20px">
                        <HStack>
                          <Calendar size={16} />
                          <Text>Data de Nascimento</Text>
                        </HStack>
                      </FormLabel>
                      <Input
                        type="date"
                        value={editFormData.dataNascimento || ""}
                        onChange={(e) => setEditFormData({ ...editFormData, dataNascimento: e.target.value })}
                        size="md"
                        h="40px"
                      />
                    </FormControl>
                  </SimpleGrid>

                  <FormControl mt={4}>
                    <FormLabel fontSize="sm" fontWeight="medium" mb={2}>
                      <HStack>
                        <Calendar size={16} />
                        <Text>Agendamento Online</Text>
                      </HStack>
                    </FormLabel>
                    <HStack>
                      <Switch
                        isChecked={editFormData.agendamentoOnline || false}
                        onChange={(e) => setEditFormData({ ...editFormData, agendamentoOnline: e.target.checked })}
                        size="md"
                      />
                      <Text fontSize="sm">{editFormData.agendamentoOnline ? "Habilitado" : "Desabilitado"}</Text>
                    </HStack>
                    <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')} mt={1}>
                      Este cliente poderá marcar agendamentos online.
                    </Text>
                  </FormControl>
                </Box>

                {/* Informações de Contato */}
                <Box>
                  <HStack mb={4}>
                    <Phone size={20} />
                    <Heading size="sm">Informações de Contato</Heading>
                  </HStack>
                  
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    <FormControl isRequired>
                      <FormLabel fontSize="sm" fontWeight="medium" mb={2} minH="20px">
                        <HStack>
                          <Phone size={16} />
                          <Text>Telefone*</Text>
                        </HStack>
                      </FormLabel>
                      <InputGroup>
                        <InputLeftElement pointerEvents="none">
                          <Phone size={18} />
                        </InputLeftElement>
                        <Input
                          type="tel"
                          placeholder="(00) 00000-0000"
                          value={editFormData.telefone || ""}
                          onChange={(e) => setEditFormData({ ...editFormData, telefone: e.target.value })}
                          size="md"
                          h="40px"
                        />
                      </InputGroup>
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="medium" mb={2} minH="20px">
                        <HStack>
                          <Phone size={16} />
                          <Text>WhatsApp</Text>
                        </HStack>
                      </FormLabel>
                      <InputGroup>
                        <InputLeftElement pointerEvents="none">
                          <Phone size={18} />
                        </InputLeftElement>
                        <Input
                          type="tel"
                          placeholder="(00) 00000-0000"
                          value={editFormData.whatsapp || ""}
                          onChange={(e) => setEditFormData({ ...editFormData, whatsapp: e.target.value })}
                          size="md"
                          h="40px"
                        />
                      </InputGroup>
                    </FormControl>
                  </SimpleGrid>

                  <FormControl mt={4}>
                    <FormLabel fontSize="sm" fontWeight="medium" mb={2} minH="20px">
                      <HStack>
                        <Mail size={16} />
                        <Text>E-mail</Text>
                      </HStack>
                    </FormLabel>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <Mail size={18} />
                      </InputLeftElement>
                      <Input
                        type="email"
                        placeholder="email@exemplo.com"
                        value={editFormData.email || ""}
                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                        size="md"
                        h="40px"
                      />
                    </InputGroup>
                  </FormControl>

                  <FormControl mt={4}>
                    <FormLabel fontSize="sm" fontWeight="medium" mb={2} minH="20px">
                      <HStack>
                        <Instagram size={16} />
                        <Text>Instagram</Text>
                      </HStack>
                    </FormLabel>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <Instagram size={18} />
                      </InputLeftElement>
                      <Input
                        type="text"
                        placeholder="@usuario"
                        value={editFormData.instagram || ""}
                        onChange={(e) => setEditFormData({ ...editFormData, instagram: e.target.value })}
                        size="md"
                        h="40px"
                      />
                    </InputGroup>
                  </FormControl>
                </Box>

                {/* Endereço */}
                <Box>
                  <HStack mb={4}>
                    <MapPin size={20} />
                    <Heading size="sm">Endereço</Heading>
                  </HStack>
                  
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="medium" mb={2} minH="20px">
                        <HStack>
                          <MapPin size={16} />
                          <Text>CEP</Text>
                        </HStack>
                      </FormLabel>
                      <Input
                        placeholder="00000-000"
                        value={editFormData.cep || ""}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "")
                          let maskedValue = value
                          if (value.length > 5) {
                            maskedValue = `${value.slice(0, 5)}-${value.slice(5, 8)}`
                          }
                          setEditFormData({ ...editFormData, cep: maskedValue })
                        }}
                        onBlur={(e) => fetchAddressByCep(e.target.value)}
                        size="md"
                        h="40px"
                      />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="medium" mb={2} minH="20px">
                        <HStack>
                          <MapPin size={16} />
                          <Text>Cidade</Text>
                        </HStack>
                      </FormLabel>
                      <Input
                        placeholder="Cidade"
                        value={editFormData.cidade || ""}
                        onChange={(e) => setEditFormData({ ...editFormData, cidade: e.target.value })}
                        size="md"
                        h="40px"
                      />
                    </FormControl>
                  </SimpleGrid>

                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mt={4}>
                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="medium" mb={2} minH="20px">
                        <HStack>
                          <MapPin size={16} />
                          <Text>Rua</Text>
                        </HStack>
                      </FormLabel>
                      <Input
                        placeholder="Rua, Avenida, etc"
                        value={editFormData.rua || ""}
                        onChange={(e) => setEditFormData({ ...editFormData, rua: e.target.value })}
                        size="md"
                        h="40px"
                      />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="medium" mb={2} minH="20px">
                        <HStack>
                          <MapPin size={16} />
                          <Text>Número</Text>
                        </HStack>
                      </FormLabel>
                      <Input
                        placeholder="Número"
                        value={editFormData.numeroCasa || ""}
                        onChange={(e) => setEditFormData({ ...editFormData, numeroCasa: e.target.value })}
                        size="md"
                        h="40px"
                      />
                    </FormControl>
                  </SimpleGrid>

                  <FormControl mt={4}>
                    <FormLabel fontSize="sm" fontWeight="medium" mb={2} minH="20px">
                      <HStack>
                        <MapPin size={16} />
                        <Text>Complemento</Text>
                      </HStack>
                    </FormLabel>
                    <Input
                      placeholder="Apartamento, bloco, etc"
                      value={editFormData.complementoCasa || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, complementoCasa: e.target.value })}
                      size="md"
                      h="40px"
                    />
                  </FormControl>
                </Box>

                {/* Preferências e Detalhes */}
                <Box>
                  <HStack mb={4}>
                    <Tag size={20} />
                    <Heading size="sm">Preferências e Detalhes</Heading>
                  </HStack>
                  
                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="medium" mb={2} minH="20px">
                      <HStack>
                        <User size={16} />
                        <Text>Como Conheceu</Text>
                      </HStack>
                    </FormLabel>
                    <Select
                      placeholder="Selecione uma opção"
                      value={editFormData.comoConheceu || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, comoConheceu: e.target.value })}
                      size="md"
                      h="40px"
                    >
                      <option value="indicacao">Indicação</option>
                      <option value="redes-sociais">Redes Sociais</option>
                      <option value="google">Google</option>
                      <option value="passagem">Passagem</option>
                      <option value="outro">Outro</option>
                    </Select>
                  </FormControl>

                  <FormControl mt={4}>
                    <FormLabel fontSize="sm" fontWeight="medium" mb={2} minH="20px">
                      <HStack>
                        <Tag size={16} />
                        <Text>Tags</Text>
                      </HStack>
                    </FormLabel>
                    <Box>
                      <Wrap spacing={2} mb={3}>
                        {editFormData.tags &&
                          Array.isArray(editFormData.tags) &&
                          editFormData.tags.map((tag: string, index: number) => (
                            <WrapItem key={index}>
                              <Badge
                                colorScheme="blue"
                                variant="solid"
                                cursor="pointer"
                                onClick={() => {
                                  setEditFormData({
                                    ...editFormData,
                                    tags: editFormData.tags.filter((t: string) => t !== tag),
                                  })
                                }}
                                _hover={{ opacity: 0.8 }}
                              >
                                {tag}
                                <X size={12} style={{ marginLeft: '4px' }} />
                              </Badge>
                            </WrapItem>
                          ))}
                      </Wrap>
                      <Input
                        placeholder="+ Nova Tag (pressione Enter para adicionar)"
                        size="md"
                        h="40px"
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && e.currentTarget.value.trim()) {
                            const newTag = e.currentTarget.value.trim()
                            if (editFormData.tags && !editFormData.tags.includes(newTag)) {
                              setEditFormData({
                                ...editFormData,
                                tags: [...(editFormData.tags || []), newTag],
                              })
                              e.currentTarget.value = ""
                            }
                            e.preventDefault()
                          }
                        }}
                      />
                    </Box>
                  </FormControl>

                  <FormControl mt={4}>
                    <FormLabel fontSize="sm" fontWeight="medium" mb={2} minH="20px">
                      <HStack>
                        <Edit size={16} />
                        <Text>Anotações Importantes</Text>
                      </HStack>
                    </FormLabel>
                    <Textarea
                      placeholder="Adicione informações importantes sobre o cliente, como alergias, preferências, etc."
                      rows={4}
                      value={editFormData.anotacoesImportantes || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, anotacoesImportantes: e.target.value })}
                      size="md"
                    />
                  </FormControl>
                </Box>

                {/* Detalhes do Cadastro */}
                <Box>
                  <HStack mb={4}>
                    <Clock size={20} />
                    <Heading size="sm">Detalhes do Cadastro</Heading>
                  </HStack>
                  
                  <Box 
                    bg={useColorModeValue('gray.50', 'gray.700')} 
                    p={4} 
                    borderRadius="md"
                    border="1px solid"
                    borderColor={useColorModeValue('gray.200', 'gray.600')}
                  >
                    <VStack align="start" spacing={3}>
                      <Box>
                        <Text fontSize="sm" fontWeight="bold" mb={1}>Tipo de Cadastro:</Text>
                        <HStack>
                          <Badge 
                            colorScheme={tipoCadastroInfo.tipo === 'agendamento_automatico' ? 'green' : 
                                       tipoCadastroInfo.tipo === 'cadastro_manual' ? 'blue' : 'gray'}
                            variant="solid"
                          >
                            {tipoCadastroInfo.nome || "Carregando..."}
                          </Badge>
                        </HStack>
                        {tipoCadastroInfo.descricao && (
                          <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.300')} mt={1}>
                            {tipoCadastroInfo.descricao}
                          </Text>
                        )}
                      </Box>
                      
                      <Box>
                        <Text fontSize="sm" fontWeight="bold" mb={1}>Estabelecimento:</Text>
                        <Text fontSize="sm">
                          {estabelecimentoCliente || "Carregando..."}
                        </Text>
                      </Box>
                      
                      <Box>
                        <Text fontSize="sm" fontWeight="bold" mb={1}>Data de Cadastro:</Text>
                        <Text fontSize="sm">
                          {formatDate(editFormData.dataCriacao) || "N/A"}
                        </Text>
                      </Box>
                    </VStack>
                  </Box>
                </Box>
              </VStack>
            </ModalBody>

            <ModalFooter>
              <HStack spacing={3}>
                <Button variant="ghost" onClick={() => setShowEditModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" colorScheme="blue" leftIcon={<Check size={18} />}>
                  Salvar Alterações
                </Button>
              </HStack>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </Box>
  )
}
