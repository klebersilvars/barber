"use client"

import type React from "react"
import { useState, useEffect } from "react"
import "./cliente.css"
import { useParams } from "react-router-dom"
import {
  Search,
  UserPlus,
  Users,
  Filter,
  Calendar,
  Mail,
  Phone,
  X,
  ChevronDown,
  Check,
  ArrowLeft,
  Trash2,
  User,
  MapPin,
  Clock,
  Edit,
  Download,
} from "lucide-react"
import { firestore } from "../../../firebase/firebase"
import { collection, addDoc, onSnapshot, query, where, doc, getDoc } from "firebase/firestore"
import { deleteDoc, updateDoc } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
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
  Tag as CTag,
  TagLabel,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Switch,
  Select,
  Textarea,
  Checkbox,
  Stack,
} from '@chakra-ui/react'

export default function Cliente() {
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
  const [firestoreClients, setFirestoreClients] = useState<any[]>([]) // Estado para clientes do Firestore
  const [estabelecimento, setEstabelecimento] = useState("")

  // Estados para o modal de edição
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState<any>(null) // Cliente selecionado para edição
  const [editFormData, setEditFormData] = useState<any>({}) // Estado para os dados do formulário de edição

  // Lista de clientes vazia inicialmente (agora usaremos firestoreClients)
  // const clients: any[] = []

  const filteredClients = firestoreClients.filter((client) => {
    // Ensure client and its properties exist before accessing
    const clientName = client?.nome || ""
    const clientPhone = client?.telefone || ""
    const clientEmail = client?.email || ""

    // Filter by search query
    const matchesSearch =
      clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clientPhone.includes(searchQuery) ||
      clientEmail.toLowerCase().includes(searchQuery.toLowerCase())

    // Filter by status
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
    // Remove non-digit characters
    const cleanedCep = cep.replace(/\D/g, "")

    // Check if CEP is valid (8 digits)
    if (cleanedCep.length !== 8) {
      // Optionally clear address fields if CEP is invalid
      setCidadeCliente("")
      setRuaCliente("")
      setComplementoCasaCliente("")
      // You might want to add more robust error handling here
      return
    }

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`)
      const data = await response.json()

      if (data.erro) {
        // Handle CEP not found error
        alert("CEP não encontrado.")
        setCidadeCliente("")
        setRuaCliente("")
        setComplementoCasaCliente("")
        return
      }

      // Pre-fill fields
      setCidadeCliente(data.localidade)
      setRuaCliente(data.logradouro)
      // You might want to set bairro (neighborhood) as well if you have a state for it
      // setBairroCliente(data.bairro);
      setComplementoCasaCliente(data.complemento)
    } catch (error) {
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
      alert("Erro ao cadastrar cliente: " + error)
    }
  }

  // Function to delete a client
  const handleDeleteClient = async (clientId: string) => {
    if (!uid) {
      alert("Erro: UID do usuário não encontrado para exclusão.")
      return
    }
    if (!confirm("Tem certeza que deseja excluir este cliente?")) {
      return
    }

    try {
      // Reference to the client document
      const clientDocRef = doc(firestore, "clienteUser", clientId)
      await deleteDoc(clientDocRef)
      // The onSnapshot listener will automatically update the UI
    } catch (error) {
      alert("Erro ao excluir cliente: " + error)
    }
  }

  // Function to update a client
  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!uid || !selectedClient) {
      alert("Erro: UID do usuário ou cliente selecionado não encontrado para atualização.")
      return
    }

    try {
      // Reference to the client document
      const clientDocRef = doc(firestore, "clienteUser", selectedClient.id)
      // Update the document with the data from editFormData
      await updateDoc(clientDocRef, editFormData)
      alert("Cliente atualizado com sucesso!")
      setShowEditModal(false) // Close the edit modal
      setSelectedClient(null) // Clear selected client
      setEditFormData({}) // Clear form data
    } catch (error) {
      alert("Erro ao atualizar cliente: " + error)
    }
  }

  // Buscar nome do estabelecimento do admin logado
  useEffect(() => {
    if (!uid) return
    const fetchEstabelecimento = async () => {
      const contaDocRef = doc(firestore, "contas", uid)
      const contaDoc = await getDoc(contaDocRef)
      if (contaDoc.exists()) {
        const contaData = contaDoc.data()
        setEstabelecimento(contaData.nomeEstabelecimento || "")
      }
    }
    fetchEstabelecimento()
  }, [uid])

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

  // Function to format date from timestamp
  const formatDate = (date: any) => {
    if (!date) return "N/A"

    try {
      // Handle Firestore timestamp
      if (date.toDate) {
        date = date.toDate()
      }

      // Handle string date
      if (typeof date === "string") {
        date = new Date(date)
      }

      // Format date
      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(date)
    } catch (error) {
      return "Data inválida"
    }
  }

  // Função para exportar clientes para Excel
  const handleExportToExcel = () => {
    try {
      // Preparar dados para exportação
      const exportData = filteredClients.map((client, index) => {
        const dataCriacao = formatDate(client.dataCriacao);
        const dataNascimento = client.dataNascimento ? 
          new Date(client.dataNascimento).toLocaleDateString('pt-BR') : 'Não informado';
        
        return {
          'Nº': index + 1,
          'Nome': client.nome || '',
          'Sobrenome': client.sobrenome || '',
          'Nome Completo': `${client.nome || ''} ${client.sobrenome || ''}`.trim(),
          'CPF': client.cpf || 'Não informado',
          'Data de Nascimento': dataNascimento,
          'Telefone': client.telefone || 'Não informado',
          'WhatsApp': client.whatsapp || 'Não informado',
          'E-mail': client.email || 'Não informado',
          'Instagram': client.instagram || 'Não informado',
          'CEP': client.cep || 'Não informado',
          'Cidade': client.cidade || 'Não informado',
          'Rua': client.rua || 'Não informado',
          'Número': client.numeroCasa || 'Não informado',
          'Complemento': client.complementoCasa || 'Não informado',
          'Endereço Completo': `${client.rua || ''}, ${client.numeroCasa || ''}${client.complementoCasa ? ` - ${client.complementoCasa}` : ''}, ${client.cidade || ''}`.replace(/Não informado/g, '').replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '') || 'Não informado',
          'Como Conheceu': client.comoConheceu || 'Não informado',
          'Agendamento Online': client.agendamentoOnline ? 'Habilitado' : 'Desabilitado',
          'Tags': client.tags && client.tags.length > 0 ? client.tags.join(', ') : 'Nenhuma',
          'Anotações': client.anotacoesImportantes || 'Nenhuma',
          'Data de Cadastro': dataCriacao,
          'Estabelecimento': client.estabelecimento || 'Não informado',
          'Status': client.status === 'active' ? 'Ativo' : client.status === 'inactive' ? 'Inativo' : 'Não definido'
        };
      });

      // Criar workbook e worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      
      // Configurar largura das colunas
      const colWidths = [
        { wch: 5 },   // Nº
        { wch: 20 },  // Nome
        { wch: 20 },  // Sobrenome
        { wch: 30 },  // Nome Completo
        { wch: 15 },  // CPF
        { wch: 15 },  // Data de Nascimento
        { wch: 15 },  // Telefone
        { wch: 15 },  // WhatsApp
        { wch: 25 },  // E-mail
        { wch: 20 },  // Instagram
        { wch: 12 },  // CEP
        { wch: 20 },  // Cidade
        { wch: 25 },  // Rua
        { wch: 8 },   // Número
        { wch: 20 },  // Complemento
        { wch: 40 },  // Endereço Completo
        { wch: 15 },  // Como Conheceu
        { wch: 18 },  // Agendamento Online
        { wch: 20 },  // Tags
        { wch: 30 },  // Anotações
        { wch: 15 },  // Data de Cadastro
        { wch: 20 },  // Estabelecimento
        { wch: 10 }   // Status
      ];
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, 'Relatório de Clientes');
      
      // Gerar arquivo Excel
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Nome do arquivo com data atual
      const fileName = `relatorio_clientes_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Download do arquivo
      saveAs(data, fileName);
      
      alert('Relatório de clientes exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      alert('Erro ao exportar relatório. Tente novamente.');
    }
  };

  

  // UseEffect para preencher o formulário de edição quando um cliente é selecionado
  useEffect(() => {
    if (selectedClient) {
      // Initialize edit form data with selected client's data
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
        tags: selectedClient.tags || [], // Ensure tags is an array
        // Keep original dataCriacao and cadastradoPor if they exist
        dataCriacao: selectedClient.dataCriacao || null,
        cadastradoPor: selectedClient.cadastradoPor || null,
      })
    } else {
      // Clear form data when no client is selected (modal closed)
      setEditFormData({})
    }
  }, [selectedClient]) // Re-run when selectedClient changes

  // Removidas as variáveis não utilizadas
  // const [tipoPlano, setTipoPlano] = useState<string | null>(null)
  // const [isPremium, setIsPremium] = useState<boolean>(true)
  // const navigate = useNavigate()
  const auth = getAuth()
  useEffect(() => {
    if (!auth.currentUser?.uid) return
    const docRef = doc(firestore, 'contas', auth.currentUser.uid)
    getDoc(docRef).then((docSnap) => {
      if (docSnap.exists()) {
        // const data = docSnap.data()
        // setTipoPlano(data.tipoPlano || null)
        // setIsPremium(data.premium === true)
      }
    })
  }, [auth.currentUser])
  // Removida a lógica de proteção de rotas que bloqueava o acesso

  // Chakra UI color tokens (evita hooks condicionais)
  const colorBg = useColorModeValue('white','gray.800')
  const colorBorder = useColorModeValue('gray.200','gray.700')
  const colorTextSecondary = useColorModeValue('gray.600','gray.300')
  const colorMuted = useColorModeValue('gray.500','gray.400')

  return (
    <Box
      width="100%"
      h={{ base: '100dvh', md: 'auto' }}
      minH={{ base: '30dvh', md: 'auto' }}
      overflowY="auto"
      overflowX="hidden"
      pb={{ base: 12, md: 0 }}
      sx={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
    >
      <Box bg={colorBg} borderBottom="1px" borderColor={colorBorder} px={4} py={4} width="100%">
        <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'stretch', md: 'center' }} gap={3} width="100%">
          <Box>
            <Heading size="lg">Clientes</Heading>
            <Text color={colorTextSecondary}>Gerencie seus clientes e perfis</Text>
          </Box>
          <HStack spacing={2} flexWrap="wrap" w="100%" justify={{ base: 'stretch', md: 'flex-end' }}>
            <Button size="sm" w={{ base: '100%', sm: 'auto' }} variant="outline" leftIcon={<Filter size={16} />} onClick={() => setShowFilters(!showFilters)}>
            Filtros
            </Button>
            <Button size="sm" w={{ base: '100%', sm: 'auto' }} variant="outline" leftIcon={<Download size={16} />} onClick={handleExportToExcel}>
            Exportar
            </Button>
            <Button size="sm" w={{ base: '100%', sm: 'auto' }} colorScheme="purple" leftIcon={<UserPlus size={16} />} onClick={handleOpenModal}>Cadastrar Cliente</Button>
          </HStack>
        </Flex>
      </Box>

      {showFilters && (
        <Box px={4} py={2} width="100%">
          <Box bg={colorBg} border="1px" borderColor={colorBorder} borderRadius="md" p={4}>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <Box>
                <Text fontWeight="semibold" mb={2}>Status</Text>
                <HStack>
                  <Button size="sm" variant={filterStatus==='all'?'solid':'outline'} colorScheme="purple" onClick={()=>setFilterStatus('all')}>Todos</Button>
                  <Button size="sm" variant={filterStatus==='active'?'solid':'outline'} colorScheme="purple" onClick={()=>setFilterStatus('active')}>Ativos</Button>
                  <Button size="sm" variant={filterStatus==='inactive'?'solid':'outline'} colorScheme="purple" onClick={()=>setFilterStatus('inactive')}>Inativos</Button>
                </HStack>
              </Box>
              <Box>
                <Text fontWeight="semibold" mb={2}>Tags</Text>
                <Wrap>
                  {['VIP','Novo','Cabelo','Manicure','Barba'].map((tag) => (
                    <WrapItem key={tag}>
                      <CTag
                        size="md"
                        variant={selectedTags.includes(tag)?'solid':'subtle'}
                        colorScheme={selectedTags.includes(tag)?'purple':'gray'}
                        cursor="pointer"
                        onClick={()=>toggleTag(tag)}
                      >
                        <TagLabel>{tag}</TagLabel>
                      </CTag>
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
                <Input placeholder="Buscar por nome" value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} />
              </InputGroup>
          {searchQuery && (
                <Button size="sm" variant="ghost" onClick={()=>setSearchQuery('')} leftIcon={<X size={16}/>}>Limpar</Button>
              )}
            </HStack>
            <Badge colorScheme="gray">{filteredClients?.length || 0} resultado(s)</Badge>
          </Flex>
          {filteredClients && filteredClients.length === 0 && searchQuery && (
            <VStack py={10} spacing={2} color={colorTextSecondary}>
              <Users size={48} />
              <Heading size="sm">Nenhum cliente encontrado para sua busca</Heading>
              <Text>Tente ajustar sua busca ou cadastre um novo cliente</Text>
              <Button colorScheme="purple" leftIcon={<UserPlus size={16}/>} onClick={handleOpenModal}>Cadastrar Cliente</Button>
            </VStack>
          )}
          {filteredClients && filteredClients.length === 0 && !searchQuery && (
            <VStack py={10} spacing={2} color={colorTextSecondary}>
              <Users size={48} />
              <Heading size="sm">Nenhum cliente cadastrado</Heading>
              <Text>Cadastre seu primeiro cliente para começar!</Text>
              <Button colorScheme="purple" leftIcon={<UserPlus size={16}/>} onClick={handleOpenModal}>Cadastrar Cliente</Button>
            </VStack>
          )}
        </Box>
      </Box>

      {Array.isArray(filteredClients) && filteredClients.length > 0 && (
        <Box px={4} py={2}>
          <VStack spacing={3} align="stretch">
          {filteredClients.map((client) => (
              <Box key={client.id} bg={colorBg} border="1px" borderColor={colorBorder} borderRadius="md" p={4}>
                <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'stretch', md: 'center' }} gap={3}>
                  <Box>
                    <Heading size="sm" mb={1}>{client.nome} {client.sobrenome}</Heading>
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={2} color={colorTextSecondary} fontSize="sm">
                      <HStack><Phone size={14}/><Text>{client.telefone || 'Não informado'}</Text></HStack>
                      <HStack><Mail size={14}/><Text>{client.email || 'Não informado'}</Text></HStack>
                      <HStack><User size={14}/><Text>{client.cpf || 'Não informado'}</Text></HStack>
                      {client.cidade && (<HStack><MapPin size={14}/><Text>{client.cidade}</Text></HStack>)}
                      {client.dataCriacao && (<HStack><Clock size={14}/><Text>{formatDate(client.dataCriacao)}</Text></HStack>)}
                    </SimpleGrid>
                    {client.tags && client.tags.length > 0 && (
                      <HStack mt={2} spacing={2} flexWrap="wrap">
                    {client.tags.map((tag: string, index: number) => (
                          <Badge key={index} colorScheme="purple" variant="subtle">{tag}</Badge>
                    ))}
                      </HStack>
                )}
                    {client.estabelecimento && (
                      <Text fontSize="xs" color={colorMuted} mt={2}>cliente cadastrado por {client.estabelecimento}</Text>
                    )}
                  </Box>
                  <HStack spacing={2} justify={{ base: 'stretch', md: 'flex-end' }} flexWrap="wrap">
                    <Button size="sm" w={{ base: '100%', md: 'auto' }} variant="outline" colorScheme="red" leftIcon={<Trash2 size={16}/>} onClick={()=>handleDeleteClient(client.id)}>Excluir</Button>
                    <Button size="sm" w={{ base: '100%', md: 'auto' }} variant="outline" leftIcon={<Phone size={16}/>} onClick={()=>{}}>
                      Ligar
                    </Button>
                    <Button size="sm" w={{ base: '100%', md: 'auto' }} variant="solid" leftIcon={<Edit size={16}/>} onClick={()=>{ setSelectedClient(client); setShowEditModal(true); }}>Editar perfil</Button>
                  </HStack>
                </Flex>
              </Box>
            ))}
          </VStack>
        </Box>
      )}

      {/* Add Client Modal - Chakra UI */}
      <Modal isOpen={showModal} onClose={handleCloseModal} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack justify="space-between">
              <HStack>
                <Button variant="ghost" size="sm" onClick={formStep > 1 ? handlePrevStep : handleCloseModal} leftIcon={<ArrowLeft size={18}/>}>Voltar</Button>
                <Heading size="md">
                  {formStep === 1 && 'Novo Cliente'}
                  {formStep === 2 && 'Informações de Contato'}
                  {formStep === 3 && 'Preferências e Detalhes'}
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
                    <FormLabel htmlFor="name">Nome</FormLabel>
                    <Input id="name" placeholder="Nome do cliente" value={nomeClinte} onChange={(e)=>setNomeCliente(e.target.value)} />
                  </FormControl>
                  <FormControl>
                    <FormLabel htmlFor="surname">Sobrenome</FormLabel>
                    <Input id="surname" placeholder="Sobrenome do cliente" value={sobreNomeClinte} onChange={(e)=>setSobreNomeCliente(e.target.value)} />
                  </FormControl>
                </SimpleGrid>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mt={4}>
                  <FormControl>
                    <FormLabel htmlFor="cpf">CPF</FormLabel>
                    <Input id="cpf" placeholder="000.000.000-00" value={cpfClinte} onChange={(e)=>{
                      const value = e.target.value.replace(/\D/g, '')
                          let maskedValue = value
                      if (value.length > 3) maskedValue = `${maskedValue.slice(0,3)}.${maskedValue.slice(3)}`
                      if (value.length > 6) maskedValue = `${maskedValue.slice(0,7)}.${maskedValue.slice(7)}`
                      if (value.length > 9) maskedValue = `${maskedValue.slice(0,11)}-${maskedValue.slice(11)}`
                      if (maskedValue.length > 14) maskedValue = maskedValue.slice(0,14)
                          setCpfCliente(maskedValue)
                    }} />
                  </FormControl>
                  <FormControl>
                    <FormLabel htmlFor="birthdate">Data de Nascimento</FormLabel>
                    <Input id="birthdate" type="date" value={dataNascimentoClinte} onChange={(e)=>setDataNascimentoCliente(e.target.value)} />
                  </FormControl>
                </SimpleGrid>
                <FormControl mt={4}>
                  <HStack align="center" justify="space-between">
                    <Box>
                      <FormLabel mb={0}>Agendamento Online</FormLabel>
                      <Text fontSize="sm" color={useColorModeValue('gray.600','gray.300')}>Este cliente poderá marcar agendamentos online.</Text>
                    </Box>
                    <HStack>
                      <Switch id="online-scheduling" isChecked={agendamentoOnline} onChange={(e)=>setAgendamentoOnline(e.target.checked)} />
                      <Text fontSize="sm">{agendamentoOnline ? 'Habilitado' : 'Desabilitado'}</Text>
                    </HStack>
                  </HStack>
                </FormControl>
              </ModalBody>
            )}
              {formStep === 2 && (
              <ModalBody>
                <Box>
                  <Heading size="sm" mb={3}>Informações de Contato</Heading>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl isRequired>
                      <FormLabel htmlFor="phone">Telefone</FormLabel>
                      <Input id="phone" placeholder="(00) 00000-0000" value={telefoneContato} onChange={(e)=>setTelefoneContato(e.target.value)} />
                    </FormControl>
                    <FormControl>
                      <FormLabel htmlFor="whatsapp">WhatsApp</FormLabel>
                      <Input id="whatsapp" placeholder="(00) 00000-0000" value={whatsappContato} onChange={(e)=>setWhatsappContato(e.target.value)} />
                    </FormControl>
                  </SimpleGrid>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mt={4}>
                    <FormControl>
                      <FormLabel htmlFor="email">E-mail</FormLabel>
                      <Input id="email" type="email" placeholder="email@exemplo.com" value={emailContato} onChange={(e)=>setEmailContato(e.target.value)} />
                    </FormControl>
                    <FormControl>
                      <FormLabel htmlFor="instagram">Instagram</FormLabel>
                      <Input id="instagram" placeholder="@usuario" value={instagramContato} onChange={(e)=>setInstagramContato(e.target.value)} />
                    </FormControl>
                  </SimpleGrid>
                </Box>
                <Box mt={6}>
                  <Heading size="sm" mb={3}>Endereço</Heading>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl>
                      <FormLabel htmlFor="cep">CEP</FormLabel>
                      <Input id="cep" placeholder="00000-000" value={cepCliente} onChange={(e)=>{
                        const value = e.target.value.replace(/\D/g, '')
                            let maskedValue = value
                        if (value.length > 5) maskedValue = `${value.slice(0,5)}-${value.slice(5,8)}`
                            setCepCliente(maskedValue)
                      }} onBlur={(e)=>fetchAddressByCep(e.target.value)} />
                    </FormControl>
                    <FormControl>
                      <FormLabel htmlFor="city">Cidade</FormLabel>
                      <Input id="city" placeholder="Cidade" value={cidadeCliente} onChange={(e)=>setCidadeCliente(e.target.value)} />
                    </FormControl>
                  </SimpleGrid>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mt={4}>
                    <FormControl>
                      <FormLabel htmlFor="street">Rua</FormLabel>
                      <Input id="street" placeholder="Rua, Avenida, etc" value={ruaClinte} onChange={(e)=>setRuaCliente(e.target.value)} />
                    </FormControl>
                    <FormControl>
                      <FormLabel htmlFor="number">Número</FormLabel>
                      <Input id="number" placeholder="Número" value={numeroCasaClinte} onChange={(e)=>setNumeroCasaCliente(e.target.value)} />
                    </FormControl>
                  </SimpleGrid>
                  <FormControl mt={4}>
                    <FormLabel htmlFor="complement">Complemento</FormLabel>
                    <Input id="complement" placeholder="Apartamento, bloco, etc" value={complementoCasaClinte} onChange={(e)=>setComplementoCasaCliente(e.target.value)} />
                  </FormControl>
                </Box>
              </ModalBody>
            )}
              {formStep === 3 && (
              <ModalBody>
                <Box>
                  <Heading size="sm" mb={3}>Preferências e Detalhes</Heading>
                  <FormControl>
                    <FormLabel htmlFor="referral">Como Conheceu</FormLabel>
                    <Select id="referral" value={comoConheceu} onChange={(e)=>setComoConheceu(e.target.value)} icon={<ChevronDown size={16}/> as any}>
                          <option value="">Selecione uma opção</option>
                          <option value="indicacao">Indicação</option>
                          <option value="redes-sociais">Redes Sociais</option>
                          <option value="google">Google</option>
                          <option value="passagem">Passagem</option>
                          <option value="outro">Outro</option>
                    </Select>
                  </FormControl>
                  <Box mt={4}>
                    <FormLabel>Tags</FormLabel>
                    <Wrap>
                      {['VIP','Novo','Cabelo','Manicure','Barba'].map((tag)=> (
                        <WrapItem key={tag}>
                          <CTag size="md" variant={selectedTags.includes(tag)?'solid':'subtle'} colorScheme={selectedTags.includes(tag)?'purple':'gray'} cursor="pointer" onClick={()=>toggleTag(tag)}>
                            <TagLabel>{tag}</TagLabel>
                          </CTag>
                        </WrapItem>
                      ))}
                    </Wrap>
                  </Box>
                  <FormControl mt={4}>
                    <FormLabel htmlFor="notes">Anotações Importantes</FormLabel>
                    <Textarea id="notes" rows={4} placeholder="Adicione informações importantes sobre o cliente, como alergias, preferências, etc." value={anotacoesImportantes} onChange={(e)=>setAnotacoesImportantes(e.target.value)} />
                  </FormControl>
                  <Box mt={4}>
                    <FormLabel>Notificações</FormLabel>
                    <Stack spacing={2}>
                      <Checkbox id="notify-sms">Enviar SMS</Checkbox>
                      <Checkbox id="notify-email">Enviar E-mail</Checkbox>
                      <Checkbox id="notify-whatsapp">Enviar WhatsApp</Checkbox>
                    </Stack>
                  </Box>
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
                  <Button colorScheme="purple" onClick={handleNextStep} rightIcon={<ChevronDown size={16} />}>Próximo</Button>
                </HStack>
              )}
              {formStep === 3 && (
                <HStack w="100%" justify="space-between">
                  <Button variant="ghost" leftIcon={<ChevronDown size={16} style={{ transform: 'rotate(90deg)' }} />} onClick={handlePrevStep}>Voltar</Button>
                  <Button type="submit" colorScheme="purple" leftIcon={<Check size={16} />}>Salvar Cliente</Button>
                </HStack>
              )}
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Edit Client Modal - Chakra UI */}
      <Modal isOpen={showEditModal && !!selectedClient} onClose={() => setShowEditModal(false)} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Heading size="md">Perfil do Cliente</Heading>
          </ModalHeader>
          <ModalCloseButton />
          {selectedClient && (
            <form onSubmit={handleUpdateClient}>
              <ModalBody>
                <Box mb={4}>
                  <Heading size="sm" mb={2}>{selectedClient.nome} {selectedClient.sobrenome}</Heading>
                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={2} color={colorTextSecondary} fontSize="sm">
                    <HStack><Phone size={14}/><Text>{selectedClient.telefone || 'Não informado'}</Text></HStack>
                    <HStack><Mail size={14}/><Text>{selectedClient.email || 'Não informado'}</Text></HStack>
                    <HStack><Calendar size={14}/><Text>Cliente desde {formatDate(selectedClient.dataCriacao)}</Text></HStack>
                  </SimpleGrid>
                </Box>

                <Box>
                  <Heading size="sm" mb={3}>Informações Básicas</Heading>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl isRequired>
                      <FormLabel htmlFor="edit-name">Nome</FormLabel>
                      <Input id="edit-name" placeholder="Nome do cliente" value={editFormData.nome || ''} onChange={(e)=>setEditFormData({ ...editFormData, nome: e.target.value })} />
                    </FormControl>
                    <FormControl>
                      <FormLabel htmlFor="edit-surname">Sobrenome</FormLabel>
                      <Input id="edit-surname" placeholder="Sobrenome do cliente" value={editFormData.sobrenome || ''} onChange={(e)=>setEditFormData({ ...editFormData, sobrenome: e.target.value })} />
                    </FormControl>
                  </SimpleGrid>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mt={4}>
                    <FormControl>
                      <FormLabel htmlFor="edit-cpf">CPF</FormLabel>
                      <Input id="edit-cpf" placeholder="000.000.000-00" value={editFormData.cpf || ''} onChange={(e)=>{
                        const value = e.target.value.replace(/\D/g, '')
                          let maskedValue = value
                        if (value.length > 3) maskedValue = `${maskedValue.slice(0,3)}.${maskedValue.slice(3)}`
                        if (value.length > 6) maskedValue = `${maskedValue.slice(0,7)}.${maskedValue.slice(7)}`
                        if (value.length > 9) maskedValue = `${maskedValue.slice(0,11)}-${maskedValue.slice(11)}`
                        if (maskedValue.length > 14) maskedValue = maskedValue.slice(0,14)
                          setEditFormData({ ...editFormData, cpf: maskedValue })
                      }} />
                    </FormControl>
                    <FormControl>
                      <FormLabel htmlFor="edit-birthdate">Data de Nascimento</FormLabel>
                      <Input id="edit-birthdate" type="date" value={editFormData.dataNascimento || ''} onChange={(e)=>setEditFormData({ ...editFormData, dataNascimento: e.target.value })} />
                    </FormControl>
                  </SimpleGrid>
                  <FormControl mt={4}>
                    <HStack align="center" justify="space-between">
                      <Box>
                        <FormLabel mb={0}>Agendamento Online</FormLabel>
                        <Text fontSize="sm" color={useColorModeValue('gray.600','gray.300')}>Este cliente poderá marcar agendamentos online.</Text>
                      </Box>
                      <HStack>
                        <Switch id="edit-online-scheduling" isChecked={editFormData.agendamentoOnline || false} onChange={(e)=>setEditFormData({ ...editFormData, agendamentoOnline: e.target.checked })} />
                        <Text fontSize="sm">{editFormData.agendamentoOnline ? 'Habilitado' : 'Desabilitado'}</Text>
                      </HStack>
                    </HStack>
                  </FormControl>
                </Box>

                <Box mt={6}>
                  <Heading size="sm" mb={3}>Informações de Contato</Heading>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl isRequired>
                      <FormLabel htmlFor="edit-phone">Telefone</FormLabel>
                      <Input id="edit-phone" placeholder="(00) 00000-0000" value={editFormData.telefone || ''} onChange={(e)=>setEditFormData({ ...editFormData, telefone: e.target.value })} />
                    </FormControl>
                    <FormControl>
                      <FormLabel htmlFor="edit-whatsapp">WhatsApp</FormLabel>
                      <Input id="edit-whatsapp" placeholder="(00) 00000-0000" value={editFormData.whatsapp || ''} onChange={(e)=>setEditFormData({ ...editFormData, whatsapp: e.target.value })} />
                    </FormControl>
                  </SimpleGrid>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mt={4}>
                    <FormControl>
                      <FormLabel htmlFor="edit-email">E-mail</FormLabel>
                      <Input id="edit-email" type="email" placeholder="email@exemplo.com" value={editFormData.email || ''} onChange={(e)=>setEditFormData({ ...editFormData, email: e.target.value })} />
                    </FormControl>
                    <FormControl>
                      <FormLabel htmlFor="edit-instagram">Instagram</FormLabel>
                      <Input id="edit-instagram" placeholder="@usuario" value={editFormData.instagram || ''} onChange={(e)=>setEditFormData({ ...editFormData, instagram: e.target.value })} />
                    </FormControl>
                  </SimpleGrid>
                </Box>

                <Box mt={6}>
                  <Heading size="sm" mb={3}>Endereço</Heading>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl>
                      <FormLabel htmlFor="edit-cep">CEP</FormLabel>
                      <Input id="edit-cep" placeholder="00000-000" value={editFormData.cep || ''} onChange={(e)=>{
                        const value = e.target.value.replace(/\D/g, '')
                          let maskedValue = value
                        if (value.length > 5) maskedValue = `${value.slice(0,5)}-${value.slice(5,8)}`
                          setEditFormData({ ...editFormData, cep: maskedValue })
                      }} onBlur={(e)=>fetchAddressByCep(e.target.value)} />
                    </FormControl>
                    <FormControl>
                      <FormLabel htmlFor="edit-city">Cidade</FormLabel>
                      <Input id="edit-city" placeholder="Cidade" value={editFormData.cidade || ''} onChange={(e)=>setEditFormData({ ...editFormData, cidade: e.target.value })} />
                    </FormControl>
                  </SimpleGrid>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mt={4}>
                    <FormControl>
                      <FormLabel htmlFor="edit-street">Rua</FormLabel>
                      <Input id="edit-street" placeholder="Rua, Avenida, etc" value={editFormData.rua || ''} onChange={(e)=>setEditFormData({ ...editFormData, rua: e.target.value })} />
                    </FormControl>
                    <FormControl>
                      <FormLabel htmlFor="edit-number">Número</FormLabel>
                      <Input id="edit-number" placeholder="Número" value={editFormData.numeroCasa || ''} onChange={(e)=>setEditFormData({ ...editFormData, numeroCasa: e.target.value })} />
                    </FormControl>
                  </SimpleGrid>
                  <FormControl mt={4}>
                    <FormLabel htmlFor="edit-complement">Complemento</FormLabel>
                    <Input id="edit-complement" placeholder="Apartamento, bloco, etc" value={editFormData.complementoCasa || ''} onChange={(e)=>setEditFormData({ ...editFormData, complementoCasa: e.target.value })} />
                  </FormControl>
                </Box>

                <Box mt={6}>
                  <Heading size="sm" mb={3}>Preferências e Detalhes</Heading>
                  <FormControl>
                    <FormLabel htmlFor="edit-referral">Como Conheceu</FormLabel>
                    <Select id="edit-referral" value={editFormData.comoConheceu || ''} onChange={(e)=>setEditFormData({ ...editFormData, comoConheceu: e.target.value })} icon={<ChevronDown size={16}/> as any}>
                        <option value="">Selecione uma opção</option>
                        <option value="indicacao">Indicação</option>
                        <option value="redes-sociais">Redes Sociais</option>
                        <option value="google">Google</option>
                        <option value="passagem">Passagem</option>
                        <option value="outro">Outro</option>
                    </Select>
                  </FormControl>
                  <Box mt={4}>
                    <FormLabel>Tags</FormLabel>
                    <Wrap>
                      {(editFormData.tags || []).map((tag: string, index: number) => (
                        <WrapItem key={index}>
                          <CTag size="md" variant="subtle" colorScheme="purple">
                            <TagLabel>{tag}</TagLabel>
                            <Button ml={2} size="xs" variant="ghost" onClick={()=>setEditFormData({ ...editFormData, tags: (editFormData.tags || []).filter((t: string)=> t !== tag) })}>
                              <X size={12} />
                            </Button>
                          </CTag>
                        </WrapItem>
                      ))}
                      <WrapItem>
                        <Input size="sm" placeholder="+ Nova Tag" onKeyPress={(e)=>{
                          if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                            const newTag = e.currentTarget.value.trim()
                            if (editFormData.tags && !editFormData.tags.includes(newTag)) {
                              setEditFormData({ ...editFormData, tags: [...(editFormData.tags || []), newTag] })
                              e.currentTarget.value = ''
                            }
                            e.preventDefault()
                          }
                        }} />
                      </WrapItem>
                    </Wrap>
                  </Box>
                  <FormControl mt={4}>
                    <FormLabel htmlFor="edit-notes">Anotações Importantes</FormLabel>
                    <Textarea id="edit-notes" rows={4} placeholder="Adicione informações importantes sobre o cliente, como alergias, preferências, etc." value={editFormData.anotacoesImportantes || ''} onChange={(e)=>setEditFormData({ ...editFormData, anotacoesImportantes: e.target.value })} />
                  </FormControl>
                </Box>

                <Box mt={6}>
                  <Heading size="sm" mb={3}>Detalhes do Cadastro</Heading>
                  <VStack align="start" spacing={1} fontSize="sm" color={useColorModeValue('gray.600','gray.300')}>
                    <Text><b>Cadastrado por:</b> {editFormData.cadastradoPor || 'N/A'}</Text>
                    <Text><b>Data de Cadastro:</b> {formatDate(editFormData.dataCriacao) || 'N/A'}</Text>
                  </VStack>
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
    </Box>
  )
}
