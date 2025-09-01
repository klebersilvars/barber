"use client"
import { useState, useEffect } from "react"
import type React from "react"

import {
  Search,
  UserPlus,
  ArrowLeft,
  X,
  User,
  Mail,
  Phone,
  Instagram,
  Briefcase,
  Shield,
  CreditCard,
  MapPin,
  Trash2,
  Edit,
  UserX,
  UserCheck,
  Check,
  MoreVertical,
  Filter,
  Users,
  Star,
  Info,
  AlertTriangle,
} from "lucide-react"
import { useParams } from "react-router-dom"
import { firestore } from "../../../firebase/firebase"
import { collection, addDoc, onSnapshot, query, doc, deleteDoc, updateDoc, getDoc, where } from "firebase/firestore"
import { getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth"
import { IMaskInput } from 'react-imask'

// Componentes Chakra UI
import {
  Box,
  Button,
  Input,
  Card,
  CardBody,
  Badge,
  Avatar,
  Select,
  Textarea,
  Checkbox,
  VStack,
  HStack,
  Text,
  Heading,
  Flex,
  Grid,
  SimpleGrid,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  IconButton,
  Progress,
  Alert,
  AlertDescription,
  Stat,
  StatLabel,
  StatNumber,
  useColorModeValue,
  Container,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  useBreakpointValue,
  Center,
  Icon,
} from "@chakra-ui/react"

// Definir interfaces para a tipagem do formData (chaves em inglês para inputs)
interface ColaboradorAtributosForm {
  executeAppointments: boolean // executaAtendimentos
  sellProducts: boolean // vendeProdutos
  sellPackages: boolean // vendePacotes
}

interface ColaboradorContatoForm {
  instagram: string // instagram (manter)
  phone: string // telefone
  phoneType: string // tipoTelefone
}

interface ColaboradorPessoalForm {
  birthDate: string // dataNascimento
  cpf: string // cpf (manter)
  rg: string // rg (manter)
  issuingBody: string // orgaoExpedidor
  additionalInfo: string // informacoesAdicionais
}

interface ColaboradorBancarioForm {
  pixKey: string // chavePix
  bank: string // banco
  agency: string // agencia
  account: string // conta
  digit: string // digito
  accountType: string // tipoConta
  personType: string // tipoPessoa
}

interface ColaboradorEnderecoForm {
  street: string // rua
  number: string // numeroCasa
  complement: string // complementoCasa
  neighborhood: string // bairro
  city: string // cidade
  state: string // estado
  zipCode: string // cep
}

interface ColaboradorFormData {
  name: string
  lastName: string
  email: string
  onlineScheduling: string
  roles: string[] // Manter como array de strings
  attributes: ColaboradorAtributosForm
  contact: ColaboradorContatoForm
  personal: ColaboradorPessoalForm
  banking: ColaboradorBancarioForm
  address: ColaboradorEnderecoForm
}

// Definir interface para os dados que vêm ou vão para o Firestore (com chaves em português)
interface ColaboradorFirestoreData {
  id?: string // ID do documento do Firestore, opcional ao criar
  nome: string // name + lastName
  email: string
  agendamentoOnline: string
  cargos: string[]
  atributos: {
    executaAtendimentos: boolean
    vendeProdutos: boolean
    vendePacotes: boolean
  }
  contato: {
    instagram: string
    telefone: string
    tipoTelefone: string
  }
  pessoal: {
    dataNascimento: string
    cpf: string
    rg: string
    orgaoExpedidor: string
    informacoesAdicionais: string
  }
  bancario: {
    chavePix: string
    banco: string
    agencia: string
    conta: string
    digito: string
    tipoConta: string
    tipoPessoa: string
  }
  endereco: {
    rua: string
    numeroCasa: string
    complementoCasa: string
    bairro: string
    cidade: string
    estado: string
    cep: string
  }
  status: string
  criadoEm: any // Usar any ou Timestamp
  avatar?: string | null
  authUserId?: string
  createdBy?: string
  estabelecimento?: string // Adicionando o campo estabelecimento
  estabelecimentoId?: string // Adicionando o campo estabelecimentoId
}

// Mock data expandido para demonstração do layout
const mockCollaborators: ColaboradorFirestoreData[] = [
  {
    id: "mock-1",
    nome: "Ana Silva Santos",
    email: "ana.silva@salaobela.com",
    cargos: ["Profissional"],
    status: "active",
    avatar: "/placeholder.svg?height=40&width=40",
    agendamentoOnline: "enabled",
    atributos: { executaAtendimentos: true, vendeProdutos: true, vendePacotes: false },
    contato: {
      instagram: "@anasilva_hair",
      telefone: "(11) 98765-4321",
      tipoTelefone: "WhatsApp",
    },
    pessoal: {
      dataNascimento: "15/03/1988",
      cpf: "123.456.789-00",
      rg: "11.222.333-4",
      orgaoExpedidor: "SSP",
      informacoesAdicionais: "Especialista em cortes femininos",
    },
    bancario: {
      chavePix: "ana.silva@salaobela.com",
      banco: "Banco do Brasil",
      agencia: "1234",
      conta: "56789",
      digito: "0",
      tipoConta: "corrente",
      tipoPessoa: "fisica",
    },
    endereco: {
      rua: "Rua das Flores, 123",
      numeroCasa: "123",
      complementoCasa: "Apto 45",
      bairro: "Centro",
      cidade: "São Paulo",
      estado: "SP",
      cep: "01000-000",
    },
    criadoEm: new Date(),
  },
  {
    id: "mock-2",
    nome: "Carlos Eduardo Oliveira",
    email: "carlos.oliveira@salaobela.com",
    cargos: ["Gerente"],
    status: "active",
    avatar: "/placeholder.svg?height=40&width=40",
    agendamentoOnline: "enabled",
    atributos: { executaAtendimentos: false, vendeProdutos: true, vendePacotes: true },
    contato: {
      instagram: "@carlosmanager",
      telefone: "(11) 97654-3210",
      tipoTelefone: "WhatsApp",
    },
    pessoal: {
      dataNascimento: "22/07/1985",
      cpf: "987.654.321-00",
      rg: "22.333.444-5",
      orgaoExpedidor: "SSP",
      informacoesAdicionais: "Gerente geral do salão",
    },
    bancario: {
      chavePix: "carlos.oliveira@salaobela.com",
      banco: "Itaú",
      agencia: "5678",
      conta: "12345",
      digito: "6",
      tipoConta: "corrente",
      tipoPessoa: "fisica",
    },
    endereco: {
      rua: "Av. Paulista, 1000",
      numeroCasa: "1000",
      complementoCasa: "Sala 501",
      bairro: "Bela Vista",
      cidade: "São Paulo",
      estado: "SP",
      cep: "01310-100",
    },
    criadoEm: new Date(),
  },
  {
    id: "mock-3",
    nome: "Mariana Costa Lima",
    email: "mariana.costa@salaobela.com",
    cargos: ["Profissional"],
    status: "active",
    avatar: "/placeholder.svg?height=40&width=40",
    agendamentoOnline: "enabled",
    atributos: { executaAtendimentos: true, vendeProdutos: false, vendePacotes: true },
    contato: {
      instagram: "@mari_nails",
      telefone: "(11) 96543-2109",
      tipoTelefone: "WhatsApp",
    },
    pessoal: {
      dataNascimento: "08/11/1992",
      cpf: "456.789.123-00",
      rg: "33.444.555-6",
      orgaoExpedidor: "SSP",
      informacoesAdicionais: "Especialista em nail art e manicure",
    },
    bancario: {
      chavePix: "11965432109",
      banco: "Santander",
      agencia: "9012",
      conta: "34567",
      digito: "8",
      tipoConta: "poupanca",
      tipoPessoa: "fisica",
    },
    endereco: {
      rua: "Rua Augusta, 500",
      numeroCasa: "500",
      complementoCasa: "",
      bairro: "Consolação",
      cidade: "São Paulo",
      estado: "SP",
      cep: "01305-000",
    },
    criadoEm: new Date(),
  },
  {
    id: "mock-4",
    nome: "Roberto Fernandes",
    email: "roberto.fernandes@salaobela.com",
    cargos: ["Atendente"],
    status: "inactive",
    avatar: null,
    agendamentoOnline: "disabled",
    atributos: { executaAtendimentos: false, vendeProdutos: true, vendePacotes: false },
    contato: {
      instagram: "@roberto_recep",
      telefone: "(11) 95432-1098",
      tipoTelefone: "Celular",
    },
    pessoal: {
      dataNascimento: "30/05/1990",
      cpf: "789.123.456-00",
      rg: "44.555.666-7",
      orgaoExpedidor: "SSP",
      informacoesAdicionais: "Recepcionista e vendedor",
    },
    bancario: {
      chavePix: "789.123.456-00",
      banco: "Caixa Econômica",
      agencia: "3456",
      conta: "78901",
      digito: "2",
      tipoConta: "corrente",
      tipoPessoa: "fisica",
    },
    endereco: {
      rua: "Rua da Consolação, 200",
      numeroCasa: "200",
      complementoCasa: "Bloco B",
      bairro: "República",
      cidade: "São Paulo",
      estado: "SP",
      cep: "01302-000",
    },
    criadoEm: new Date(),
  },
  {
    id: "mock-5",
    nome: "Juliana Pereira Santos",
    email: "juliana.pereira@salaobela.com",
    cargos: ["Profissional"],
    status: "active",
    avatar: "/placeholder.svg?height=40&width=40",
    agendamentoOnline: "enabled",
    atributos: { executaAtendimentos: true, vendeProdutos: true, vendePacotes: true },
    contato: {
      instagram: "@ju_makeup",
      telefone: "(11) 94321-0987",
      tipoTelefone: "WhatsApp",
    },
    pessoal: {
      dataNascimento: "12/09/1987",
      cpf: "321.654.987-00",
      rg: "55.666.777-8",
      orgaoExpedidor: "SSP",
      informacoesAdicionais: "Maquiadora profissional e esteticista",
    },
    bancario: {
      chavePix: "juliana.pereira@salaobela.com",
      banco: "Bradesco",
      agencia: "7890",
      conta: "23456",
      digito: "1",
      tipoConta: "corrente",
      tipoPessoa: "fisica",
    },
    endereco: {
      rua: "Rua Oscar Freire, 800",
      numeroCasa: "800",
      complementoCasa: "Loja 12",
      bairro: "Jardins",
      cidade: "São Paulo",
      estado: "SP",
      cep: "01426-000",
    },
    criadoEm: new Date(),
  },
]

export default function Colaboradores() {
  // Obter UID do usuário logado
  const { uid } = useParams()

  // Usar a nova interface para a tipagem do estado collaborators (FirestoreData)
  const [collaborators, setCollaborators] = useState<ColaboradorFirestoreData[]>(mockCollaborators)
  const [showModal, setShowModal] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("active")
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [formData, setFormData] = useState<ColaboradorFormData>({
    name: "",
    lastName: "",
    email: "",
    onlineScheduling: "enabled",
    roles: [],
    attributes: {
      // Chaves em inglês para o formData
      executeAppointments: false,
      sellProducts: false,
      sellPackages: false,
    },
    contact: {
      // Chaves em inglês
      instagram: "",
      phone: "",
      phoneType: "WhatsApp",
    },
    personal: {
      // Chaves em inglês
      birthDate: "",
      cpf: "",
      rg: "",
      issuingBody: "",
      additionalInfo: "",
    },
    banking: {
      // Chaves em inglês
      pixKey: "",
      bank: "",
      agency: "",
      account: "",
      digit: "",
      accountType: "",
      personType: "",
    },
    address: {
      // Chaves em inglês
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      zipCode: "",
    },
  })

  // Estado para controlar o ID do colaborador sendo editado
  const [editingCollaboratorId, setEditingCollaboratorId] = useState<string | null>(null)

  // Chakra UI responsive values
  const isMobile = useBreakpointValue({ base: true, lg: false })
  const cardBg = useColorModeValue("white", "gray.800")

  // Garantir que o scroll funcione
  useEffect(() => {
    document.body.style.overflow = 'auto'
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [])

  // Listen for collaborators in real-time from Firestore
  useEffect(() => {
    // Mudar referência da coleção para a raiz "colaboradores"
    const collaboratorsCollectionRef = collection(firestore, "colaboradores")
    // Filtrar apenas colaboradores criados pelo usuário logado
    const q = query(collaboratorsCollectionRef, where("createdBy", "==", uid))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const collaboratorsData: ColaboradorFirestoreData[] = snapshot.docs.map((doc) => ({
        id: doc.id, // Incluir o ID do documento do Firestore
          ...(doc.data() as ColaboradorFirestoreData), // Usar a interface para tipagem
        }))
        setCollaborators(collaboratorsData)
      },
      (error: any) => {
        console.error("Erro ao carregar colaboradores em tempo real:", error)
      // Opcional: exibir uma mensagem de erro para o usuário
      },
    )

    // Limpeza do listener ao desmontar o componente
    return () => unsubscribe()
  }, [uid]) // Dependência: re-executar se o UID mudar

  // Efeito para abrir o modal quando um colaborador for selecionado para edição
  useEffect(() => {
    if (editingCollaboratorId) {
      setShowModal(true)
      setCurrentStep(1) // Começar do primeiro passo ao editar
    }
  }, [editingCollaboratorId]) // Dependência: re-executar quando o editingCollaboratorId mudar

  // Filter collaborators based on search query and status filter (ajustar chaves)
  const filteredCollaborators = collaborators.filter((colaborador) => {
    // Adicionar verificações para nome e email antes de chamar toLowerCase
    const matchesSearch =
      (colaborador.nome ? colaborador.nome.toLowerCase() : "").includes(searchQuery.toLowerCase()) ||
      (colaborador.email ? colaborador.email.toLowerCase() : "").includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || colaborador.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Função assíncrona para buscar endereço pelo CEP usando ViaCEP
  const fetchAddressByCep = async (cep: string) => {
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()
      // Verifica se a resposta contém um erro ou se o CEP não foi encontrado
      if (data.erro) {
        console.error("CEP não encontrado.", cep)
        // Opcional: alert("CEP não encontrado.");
        return null // Retorna null para indicar que não encontrou
      }
      // Retorna os dados do endereço relevantes
      return {
        street: data.logradouro,
        neighborhood: data.bairro,
        city: data.localidade,
        state: data.uf,
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error)
      // Opcional: alert("Erro ao buscar CEP. Por favor, tente novamente.");
      return null // Retorna null em caso de erro
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    section?: keyof Omit<ColaboradorFormData, "name" | "lastName" | "email" | "onlineScheduling" | "roles">, // Apenas chaves de seções aninhadas
  ) => {
    const target = e.target
    const name = target.name
    const value = target.value
    // Casting para acessar 'checked' que só existe em HTMLInputElement
    const checked = (target as HTMLInputElement).checked

    // Determine the actual value based on input type
    const input_value = target.type === "checkbox" ? checked : value

    setFormData((prev) => {
      // Create a copy to avoid direct mutation
      const newFormData = { ...prev }

      if (section) {
        // Access the nested section object using the English key from formData
        const sectionData = newFormData[section]

        // Ensure sectionData is an object before spreading or indexing
        if (typeof sectionData === "object" && sectionData !== null) {
          // Update the field directly on the section based on input 'name' (which should match the English key)
          // Adicionado cast para garantir que name é uma chave válida para sectionData
          ;(sectionData as any)[name as keyof typeof sectionData] = input_value // Usando any temporariamente, pode ser refinado

           // Update the section in the new form data (using the English key)
          ;(newFormData as any)[section] = sectionData // Usando any temporariamente

           // Lógica para buscar CEP quando o input name for 'zipCode' na seção 'address'
          if (section === "address" && name === "zipCode") {
            const cepValue = input_value as string
             // Verifica se o CEP tem 8 dígitos e contém apenas números
             if (cepValue.length === 8 && /^[0-9]+$/.test(cepValue)) {
              fetchAddressByCep(cepValue).then((addressData) => {
                 if (addressData) {
                   // Atualiza os campos de endereço com os dados retornados
                  setFormData((currentFormData) => ({
                     ...currentFormData,
                     address: {
                       ...currentFormData.address,
                      street: addressData.street || "",
                      neighborhood: addressData.neighborhood || "",
                      city: addressData.city || "",
                      state: addressData.state || "",
                       // Mantém os outros campos como number e complement
                    },
                  }))
                 } else {
                    // Limpa os campos de endereço se o CEP não for encontrado ou houver erro
                  setFormData((currentFormData) => ({
                      ...currentFormData,
                      address: {
                        ...currentFormData.address,
                      street: "",
                      neighborhood: "",
                      city: "",
                      state: "",
                        // Mantém os outros campos
                    },
                  }))
                }
              })
            } else if (cepValue.length < 8) {
              // Limpar campos se o CEP ficar incompleto
              setFormData((currentFormData) => ({
                   ...currentFormData,
                   address: {
                     ...currentFormData.address,
                  street: "",
                  neighborhood: "",
                  city: "",
                  state: "",
                     // Mantém os outros campos
                },
              }))
             }
           }
        } else {
          console.error(`Section '${String(section)}' in formData is not an object.`)
          ;(newFormData as any)[name] = input_value // Usando any temporariamente
        }
      } else {
        // Handle fields at the root level of formData (name, lastName, email, onlineScheduling, roles)
         // Adicionado cast para garantir que name é uma chave válida para newFormData
        ;(newFormData as any)[name as keyof typeof newFormData] = input_value // Usando any temporariamente
      }

      return newFormData // Return the updated state
    })
  }

  // Função para lidar com a mudança de roles
  const handleRoleToggle = (role: string) => {
    setFormData((prev) => {
      // A lógica de roles funciona com strings, então não precisa mudar as chaves aqui, apenas a interface
      const roles = Array.isArray(prev.roles) ? [...prev.roles] : []
      if (roles.includes(role)) {
        return { ...prev, roles: roles.filter((r) => r !== role) }
      } else {
        return { ...prev, roles: [...roles, role] }
      }
    })
  }

   // Função para lidar com a mudança de atributos
  const handleAttributeToggle = (attribute: keyof ColaboradorAtributosForm) => {
    setFormData((prev) => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [attribute]: !prev.attributes[attribute],
      },
    }))
  }

  const handleOpenModal = () => {
    setShowModal(true)
    setCurrentStep(1)
    setEditingCollaboratorId(null) // Resetar ID ao abrir para adicionar novo
    // Reset form data (usar chaves em inglês para resetar o estado do formulário)
    setFormData({
      name: "",
      lastName: "",
      email: "",
      onlineScheduling: "enabled",
      roles: [],
      attributes: {
        // Chaves em inglês
        executeAppointments: false,
        sellProducts: false,
        sellPackages: false,
      },
      contact: {
        // Chaves em inglês
        instagram: "",
        phone: "",
        phoneType: "WhatsApp",
      },
      personal: {
        // Chaves em inglês
        birthDate: "",
        cpf: "",
        rg: "",
        issuingBody: "",
        additionalInfo: "",
      },
      banking: {
        // Chaves em inglês
        pixKey: "",
        bank: "",
        agency: "",
        account: "",
        digit: "",
        accountType: "",
        personType: "",
      },
      address: {
        // Chaves em inglês
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
        zipCode: "",
      },
    })
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setCurrentStep(1) // Resetar para o primeiro passo
    setEditingCollaboratorId(null) // Resetar ID ao fechar
    // Reset form data após fechar (usar chaves em inglês)
    setFormData({
      name: "",
      lastName: "",
      email: "",
      onlineScheduling: "enabled",
      roles: [],
      attributes: {
        // Chaves em inglês
        executeAppointments: false,
        sellProducts: false,
        sellPackages: false,
      },
      contact: {
        // Chaves em inglês
        instagram: "",
        phone: "",
        phoneType: "WhatsApp",
      },
      personal: {
        // Chaves em inglês
        birthDate: "",
        cpf: "",
        rg: "",
        issuingBody: "",
        additionalInfo: "",
      },
      banking: {
        // Chaves em inglês
        pixKey: "",
        bank: "",
        agency: "",
        account: "",
        digit: "",
        accountType: "",
        personType: "",
      },
      address: {
        // Chaves em inglês
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
        zipCode: "",
      },
    })
  }

  // Função para controlar abertura/fechamento do menu
  const handleMenuToggle = (collaboratorId: string | null) => {
    if (openMenuId === collaboratorId) {
      // Se clicar no mesmo card, fecha o menu
      setOpenMenuId(null)
    } else {
      // Se clicar em outro card, abre o menu do novo card
      setOpenMenuId(collaboratorId)
    }
  }

  // Fechar menu quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('[data-menu-container]')) {
        setOpenMenuId(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleNextStep = () => {
    setCurrentStep(currentStep + 1)
  }

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1)
  }

  // Função para lidar com o envio do formulário (ajustar para salvar com chaves em português)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Verificar se o cargo é "Profissional" ou "Atendente"
    const isProfessional = formData.roles.includes("Profissional")
    const isAtendente = formData.roles.includes("Atendente")

    // Buscar o nome do estabelecimento na coleção 'contas'
    let estabelecimentoNome = ""
    if (uid) {
      const contaDoc = await getDoc(doc(firestore, "contas", uid))
      estabelecimentoNome = contaDoc.data()?.nomeEstabelecimento || ""
    }

    // Lógica para adicionar ou atualizar no Firestore
    if (editingCollaboratorId) {
      // Lógica de atualização
      console.log("Atualizando colaborador com ID:", editingCollaboratorId)
      const docRef = doc(firestore, "colaboradores", editingCollaboratorId)
      const updatedData: Omit<ColaboradorFirestoreData, "id" | "criadoEm"> = {
        nome: `${formData.name} ${formData.lastName}`.trim(),
        email: formData.email,
        agendamentoOnline: formData.onlineScheduling,
        cargos: formData.roles,
        atributos: {
          executaAtendimentos: formData.attributes.executeAppointments,
          vendeProdutos: formData.attributes.sellProducts,
          vendePacotes: formData.attributes.sellPackages,
        },
        contato: {
          instagram: formData.contact.instagram,
          telefone: formData.contact.phone,
          tipoTelefone: formData.contact.phoneType,
        },
        pessoal: {
          dataNascimento: formData.personal.birthDate,
          cpf: formData.personal.cpf,
          rg: formData.personal.rg,
          orgaoExpedidor: formData.personal.issuingBody,
          informacoesAdicionais: formData.personal.additionalInfo,
        },
        bancario: {
          chavePix: formData.banking.pixKey,
          banco: formData.banking.bank,
          agencia: formData.banking.agency,
          conta: formData.banking.account,
          digito: formData.banking.digit,
          tipoConta: formData.banking.accountType,
          tipoPessoa: formData.banking.personType,
        },
        endereco: {
          rua: formData.address.street,
          numeroCasa: formData.address.number,
          complementoCasa: formData.address.complement,
          bairro: formData.address.neighborhood,
          cidade: formData.address.city,
          estado: formData.address.state,
          cep: formData.address.zipCode,
        },
        status: collaborators.find((c) => c.id === editingCollaboratorId)?.status || "active",
        estabelecimento: estabelecimentoNome,
        estabelecimentoId: uid, // Adicionando o UID do proprietário
      }

      try {
        await updateDoc(docRef, updatedData)
        console.log("Colaborador atualizado com sucesso no Firestore!")
        handleCloseModal()
      } catch (error: any) {
        console.error("Erro ao atualizar colaborador no Firestore:", error)
        alert("Erro ao atualizar colaborador: " + error.message)
      }
    } else {
      const collaboratorsCollectionRef = collection(firestore, "colaboradores")
      const auth = getAuth()
      let authUserId: string | undefined = undefined

      try {
        // Se for atendente, criar conta no Authentication
        if (isAtendente) {
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            formData.email,
            Math.random()
              .toString(36)
              .slice(-8), // Senha temporária aleatória
          )
          authUserId = userCredential.user.uid
          await sendPasswordResetEmail(auth, formData.email)
          console.log("Email de criação de senha enviado para atendente!")
        }

        // Se for profissional, criar conta no Authentication
        if (isProfessional) {
          // Criar usuário no Authentication
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            formData.email,
            Math.random()
              .toString(36)
              .slice(-8), // Senha temporária aleatória
          )
          authUserId = userCredential.user.uid
          // Enviar email para criar senha
          await sendPasswordResetEmail(auth, formData.email)
          console.log("Email de criação de senha enviado com sucesso!")
        }

        // Objeto de dados formatado para adição no Firestore (chaves em português)
        const newCollaboratorData: any = {
          nome: `${formData.name} ${formData.lastName}`.trim(),
          email: formData.email,
          agendamentoOnline: formData.onlineScheduling,
          cargos: formData.roles,
          atributos: {
            executaAtendimentos: formData.attributes.executeAppointments,
            vendeProdutos: formData.attributes.sellProducts,
            vendePacotes: formData.attributes.sellPackages,
          },
          contato: {
            instagram: formData.contact.instagram,
            telefone: formData.contact.phone,
            tipoTelefone: formData.contact.phoneType,
          },
          pessoal: {
            dataNascimento: formData.personal.birthDate,
            cpf: formData.personal.cpf,
            rg: formData.personal.rg,
            orgaoExpedidor: formData.personal.issuingBody,
            informacoesAdicionais: formData.personal.additionalInfo,
          },
          bancario: {
            chavePix: formData.banking.pixKey,
            banco: formData.banking.bank,
            agencia: formData.banking.agency,
            conta: formData.banking.account,
            digito: formData.banking.digit,
            tipoConta: formData.banking.accountType,
            tipoPessoa: formData.banking.personType,
          },
          endereco: {
            rua: formData.address.street,
            numeroCasa: formData.address.number,
            complementoCasa: formData.address.complement,
            bairro: formData.address.neighborhood,
            cidade: formData.address.city,
            estado: formData.address.state,
            cep: formData.address.zipCode,
          },
          status: "active",
          criadoEm: new Date(),
          createdBy: uid,
          estabelecimento: estabelecimentoNome,
          estabelecimentoId: uid, // Adicionando o UID do proprietário
        }

        // Se for profissional, adiciona o authUserId se existir
        if (authUserId) {
          newCollaboratorData.authUserId = authUserId
        }

        await addDoc(collaboratorsCollectionRef, newCollaboratorData)
        console.log("Novo colaborador adicionado com sucesso ao Firestore!")

        if (isProfessional || isAtendente) {
          alert("Colaborador criado com sucesso! Um email foi enviado para ele criar sua senha.")
        } else {
          alert("Colaborador criado com sucesso!")
        }

        handleCloseModal()
      } catch (error: any) {
        console.error("Erro ao adicionar colaborador:", error)
        alert("Erro ao adicionar colaborador: " + error.message)
      }
    }
  }

  // Handler functions for collaborator actions (ajustar tipagem e chaves)
  const handleEditCollaborator = (collaborator: ColaboradorFirestoreData) => {
    console.log("Editar colaborador:", collaborator.nome)
    setEditingCollaboratorId(collaborator.id || null) // Armazena o ID do colaborador a ser editado

    // Mapear dados do Firestore (chaves em português) para o formData (chaves em inglês)
    const formDataToEdit: ColaboradorFormData = {
      name: collaborator.nome.split(" ")[0] || "", // Assume que o primeiro nome é o que vem antes do primeiro espaço
      lastName: collaborator.nome.split(" ").slice(1).join(" ") || "", // O restante é o sobrenome
      email: collaborator.email || "",
      onlineScheduling: collaborator.agendamentoOnline || "enabled",
      roles: Array.isArray(collaborator.cargos) ? collaborator.cargos : [],
      attributes: {
        // Mapear chaves
        executeAppointments: collaborator.atributos?.executaAtendimentos || false,
        sellProducts: collaborator.atributos?.vendeProdutos || false,
        sellPackages: collaborator.atributos?.vendePacotes || false,
      },
      contact: {
        // Mapear chaves
        instagram: collaborator.contato?.instagram || "",
        phone: collaborator.contato?.telefone || "",
        phoneType: collaborator.contato?.tipoTelefone || "WhatsApp",
      },
      personal: {
        // Mapear chaves
        birthDate: collaborator.pessoal?.dataNascimento || "",
        cpf: collaborator.pessoal?.cpf || "",
        rg: collaborator.pessoal?.rg || "",
        issuingBody: collaborator.pessoal?.orgaoExpedidor || "",
        additionalInfo: collaborator.pessoal?.informacoesAdicionais || "",
      },
      banking: {
        // Mapear chaves
        pixKey: collaborator.bancario?.chavePix || "",
        bank: collaborator.bancario?.banco || "",
        agency: collaborator.bancario?.agencia || "",
        account: collaborator.bancario?.conta || "",
        digit: collaborator.bancario?.digito || "",
        accountType: collaborator.bancario?.tipoConta || "",
        personType: collaborator.bancario?.tipoPessoa || "",
      },
      address: {
        // Mapear chaves
        street: collaborator.endereco?.rua || "",
        number: collaborator.endereco?.numeroCasa || "",
        complement: collaborator.endereco?.complementoCasa || "",
        neighborhood: collaborator.endereco?.bairro || "",
        city: collaborator.endereco?.cidade || "",
        state: collaborator.endereco?.estado || "",
        zipCode: collaborator.endereco?.cep || "",
      },
    }

    setFormData(formDataToEdit) // Preenche o formulário com os dados do colaborador
  }

  const handleToggleStatus = async (collaborator: ColaboradorFirestoreData) => {
    const newStatus = collaborator.status === "active" ? "inactive" : "active"
    console.log(`${newStatus === "active" ? "Ativar" : "Desativar"} colaborador:`, collaborator.nome)

    try {
      // Atualizar status no Firestore
      const docRef = doc(firestore, "colaboradores", collaborator.id!)
      await updateDoc(docRef, { status: newStatus })

      // Se estiver desativando e tiver authUserId, desabilitar a conta no Authentication
      if (newStatus === "inactive" && collaborator.authUserId) {
        try {
          // Atualizar o documento do usuário no Firestore para marcar como desabilitado
          const userDocRef = doc(firestore, "users", collaborator.authUserId)
          await updateDoc(userDocRef, {
            disabled: true,
            disabledAt: new Date(),
            disabledBy: uid,
          })
          console.log("Conta do usuário desabilitada com sucesso!")
        } catch (error: any) {
          console.error("Erro ao desabilitar conta do usuário:", error)
          // Não mostrar erro para o usuário, pois a atualização do status já foi feita
        }
      }
      // Se estiver ativando e tiver authUserId, reabilitar a conta no Authentication
      else if (newStatus === "active" && collaborator.authUserId) {
        try {
          // Atualizar o documento do usuário no Firestore para marcar como habilitado
          const userDocRef = doc(firestore, "users", collaborator.authUserId)
          await updateDoc(userDocRef, {
            disabled: false,
            enabledAt: new Date(),
            enabledBy: uid,
          })
          console.log("Conta do usuário reabilitada com sucesso!")
        } catch (error: any) {
          console.error("Erro ao reabilitar conta do usuário:", error)
          // Não mostrar erro para o usuário, pois a atualização do status já foi feita
        }
      }
    } catch (error: any) {
      console.error("Erro ao atualizar status do colaborador:", error)
      alert("Erro ao atualizar status do colaborador: " + error.message)
    }
  }

  const handleDeleteCollaborator = async (collaborator: ColaboradorFirestoreData) => {
    if (!collaborator.id) {
      console.error("Erro ao excluir: ID do colaborador não encontrado.")
      alert("Não foi possível excluir o colaborador: ID não encontrado.")
      return
    }

    if (window.confirm(`Tem certeza que deseja excluir o colaborador ${collaborator.nome}?`)) {
      console.log("Excluir colaborador:", collaborator.nome)

      try {
        // Excluir do Firestore
        const docRef = doc(firestore, "colaboradores", collaborator.id)
        await deleteDoc(docRef)
        console.log("Colaborador excluído com sucesso do Firestore!")

        // Se tiver authUserId, desabilitar a conta no Authentication
        if (collaborator.authUserId) {
          try {
            // Atualizar o documento do usuário no Firestore para marcar como desabilitado
            const userDocRef = doc(firestore, "users", collaborator.authUserId)
            await updateDoc(userDocRef, {
              disabled: true,
              disabledAt: new Date(),
              disabledBy: uid,
            })
            console.log("Conta do usuário desabilitada com sucesso!")
          } catch (error: any) {
            console.error("Erro ao desabilitar conta do usuário:", error)
            // Não mostrar erro para o usuário, pois a exclusão do Firestore já foi feita
          }
        }
      } catch (error: any) {
        console.error("Erro ao excluir colaborador:", error)
        alert("Erro ao excluir colaborador: " + error.message)
      }
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "Proprietário":
        return "yellow"
      case "Gerente":
        return "blue"
      case "Profissional":
        return "green"
      case "Atendente":
        return "purple"
      default:
        return "gray"
    }
  }

  const getStatsData = () => {
    const total = collaborators.length
    const active = collaborators.filter((c) => c.status === "active").length
    const inactive = collaborators.filter((c) => c.status === "inactive").length
    const professionals = collaborators.filter((c) => c.cargos?.includes("Profissional")).length

    return { total, active, inactive, professionals }
  }

  const stats = getStatsData()

  return (
    <Box minH={{ base: "100vh", md: "90vh" }} bg="gray.50" p={{ base: 2, md: 4, lg: 8 }} pb={{ base: 40, md: 24, lg: 32 }} overflow="auto">
      <Container maxW={{ base: "100vw", md: "100vw", lg: "100vw" }} px={{ base: 0, md: 4, lg: 8 }} mx="auto">
        <VStack spacing={{ base: 4, md: 6, lg: 8 }} align="stretch">
          {/* Header Section */}
          <Flex
            direction={{ base: "column", lg: "row" }}
            justify="space-between"
            align={{ base: "stretch", lg: "center" }}
            gap={{ base: 4, md: 6 }}
          >
            <VStack align="start" spacing={2}>
              <HStack spacing={{ base: 3, md: 4 }}>
                <Box p={{ base: 2, md: 3 }} bg="blue.500" borderRadius="xl" shadow="lg">
                  <Icon as={Users} w={{ base: 6, md: 8 }} h={{ base: 6, md: 8 }} color="white" />
                </Box>
                <VStack align="start" spacing={1}>
                  <Heading size={{ base: "lg", md: "xl", lg: "2xl" }} color="gray.800">
                    Colaboradores
                  </Heading>
                  <Text fontSize={{ base: "sm", md: "lg" }} color="gray.600">
                    Gerencie sua equipe e defina permissões
                  </Text>
                </VStack>
              </HStack>
            </VStack>
            <Button
              leftIcon={<UserPlus size={20} />}
              colorScheme="blue"
              size={{ base: "md", md: "lg" }}
              onClick={handleOpenModal}
              shadow="lg"
              _hover={{ shadow: "xl", transform: "translateY(-2px)" }}
              transition="all 0.2s"
            >
            Adicionar Colaborador
            </Button>
          </Flex>

          {/* Stats Cards */}
          <SimpleGrid columns={{ base: 2, md: 2, lg: 4 }} spacing={{ base: 3, md: 6 }}>
            <Card bg="blue.500" color="white" shadow="lg" _hover={{ shadow: "xl" }} transition="all 0.2s">
              <CardBody p={{ base: 3, md: 6 }}>
                <Flex justify="space-between" align="center">
                  <Stat>
                    <StatLabel color="blue.100" fontSize={{ base: "xs", md: "sm" }}>Total</StatLabel>
                    <StatNumber fontSize={{ base: "xl", md: "3xl" }}>{stats.total}</StatNumber>
                  </Stat>
                  <Icon as={Users} w={{ base: 6, md: 8 }} h={{ base: 6, md: 8 }} color="blue.200" />
                </Flex>
              </CardBody>
            </Card>

            <Card bg="green.500" color="white" shadow="lg" _hover={{ shadow: "xl" }} transition="all 0.2s">
              <CardBody p={{ base: 3, md: 6 }}>
                <Flex justify="space-between" align="center">
                  <Stat>
                    <StatLabel color="green.100" fontSize={{ base: "xs", md: "sm" }}>Ativos</StatLabel>
                    <StatNumber fontSize={{ base: "xl", md: "3xl" }}>{stats.active}</StatNumber>
                  </Stat>
                  <Icon as={UserCheck} w={{ base: 6, md: 8 }} h={{ base: 6, md: 8 }} color="green.200" />
                </Flex>
              </CardBody>
            </Card>

            <Card bg="yellow.500" color="white" shadow="lg" _hover={{ shadow: "xl" }} transition="all 0.2s">
              <CardBody p={{ base: 3, md: 6 }}>
                <Flex justify="space-between" align="center">
                  <Stat>
                    <StatLabel color="yellow.100" fontSize={{ base: "xs", md: "sm" }}>Profissionais</StatLabel>
                    <StatNumber fontSize={{ base: "xl", md: "3xl" }}>{stats.professionals}</StatNumber>
                  </Stat>
                  <Icon as={Star} w={{ base: 6, md: 8 }} h={{ base: 6, md: 8 }} color="yellow.200" />
                </Flex>
              </CardBody>
            </Card>

            <Card bg="gray.500" color="white" shadow="lg" _hover={{ shadow: "xl" }} transition="all 0.2s">
              <CardBody p={{ base: 3, md: 6 }}>
                <Flex justify="space-between" align="center">
                  <Stat>
                    <StatLabel color="gray.100" fontSize={{ base: "xs", md: "sm" }}>Inativos</StatLabel>
                    <StatNumber fontSize={{ base: "xl", md: "3xl" }}>{stats.inactive}</StatNumber>
                  </Stat>
                  <Icon as={UserX} w={{ base: 6, md: 8 }} h={{ base: 6, md: 8 }} color="gray.200" />
                </Flex>
              </CardBody>
            </Card>
          </SimpleGrid>

      {/* Filters and Search */}
          <Card bg={cardBg} shadow="lg">
            <CardBody p={{ base: 4, md: 6 }}>
              <Flex direction={{ base: "column", lg: "row" }} gap={{ base: 4, md: 6 }}>
                {/* Status Filter */}
                <HStack spacing={3} wrap="wrap">
                  <Button
                    leftIcon={<Filter size={16} />}
                    variant={statusFilter === "all" ? "solid" : "outline"}
                    colorScheme="blue"
                    size={{ base: "sm", md: "sm" }}
                    onClick={() => setStatusFilter("all")}
                  >
                    Todos ({collaborators.length})
                  </Button>
                  <Button
                    leftIcon={<UserCheck size={16} />}
                    variant={statusFilter === "active" ? "solid" : "outline"}
                    colorScheme="green"
                    size={{ base: "sm", md: "sm" }}
                    onClick={() => setStatusFilter("active")}
                  >
                    Ativos ({collaborators.filter((c) => c.status === "active").length})
                  </Button>
                  <Button
                    leftIcon={<UserX size={16} />}
                    variant={statusFilter === "inactive" ? "solid" : "outline"}
                    colorScheme="gray"
                    size={{ base: "sm", md: "sm" }}
                    onClick={() => setStatusFilter("inactive")}
                  >
                    Inativos ({collaborators.filter((c) => c.status === "inactive").length})
                  </Button>
                </HStack>

                {/* Search */}
                <Box flex={1}>
                  <InputGroup size={{ base: "md", md: "lg" }}>
                    <InputLeftElement>
                      <Icon as={Search} color="gray.400" />
                    </InputLeftElement>
                    <Input
                      placeholder="Procurar por nome ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
                      bg="white"
                      borderColor="gray.200"
                      _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px blue.500" }}
          />
          {searchQuery && (
                      <InputRightElement>
                        <IconButton
                          aria-label="Limpar busca"
                          icon={<X size={16} />}
                          size="sm"
                          variant="ghost"
                          onClick={() => setSearchQuery("")}
                        />
                      </InputRightElement>
                    )}
                  </InputGroup>
                </Box>
              </Flex>
            </CardBody>
          </Card>

      {/* Collaborators List */}
        {filteredCollaborators.length > 0 ? (
          <>
              {/* Desktop Table View */}
              {!isMobile && (
                <Card bg={cardBg} shadow="lg" overflow="hidden" w="100%" maxW="100vw" borderRadius="xl">
                  <TableContainer
                    w="100%"
                    maxW="100vw"
                    maxH={{ base: 'none', md: '600px', lg: '700px' }}
                    overflowY={{ base: 'unset', md: 'auto' }}
                    sx={{
                      '&::-webkit-scrollbar': {
                        width: '8px',
                        height: '8px',
                      },
                      '&::-webkit-scrollbar-track': {
                        background: 'transparent',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: 'var(--chakra-colors-gray-300)',
                        borderRadius: '4px',
                      },
                      '&::-webkit-scrollbar-thumb:hover': {
                        background: 'var(--chakra-colors-gray-400)',
                      },
                    }}
                  >
                    <Table variant="simple" size="md">
                      <Thead bg="gray.50" position="sticky" top={0} zIndex={10}>
                        <Tr>
                          <Th 
                            fontSize={{ base: "sm", md: "md" }} 
                            fontWeight="bold" 
                            color="gray.700"
                            py={{ base: 4, md: 6 }}
                            px={{ base: 3, md: 4 }}
                            textTransform="uppercase"
                            letterSpacing="wider"
                            borderBottom="2px"
                            borderColor="gray.200"
                            minW={{ base: "200px", md: "250px" }}
                          >
                            Colaborador
                          </Th>
                          <Th 
                            fontSize={{ base: "sm", md: "md" }} 
                            fontWeight="bold" 
                            color="gray.700"
                            py={{ base: 4, md: 6 }}
                            px={{ base: 3, md: 4 }}
                            textTransform="uppercase"
                            letterSpacing="wider"
                            borderBottom="2px"
                            borderColor="gray.200"
                            minW={{ base: "180px", md: "220px" }}
                          >
                            E-mail
                          </Th>
                          <Th 
                            fontSize={{ base: "sm", md: "md" }} 
                            fontWeight="bold" 
                            color="gray.700"
                            py={{ base: 4, md: 6 }}
                            px={{ base: 3, md: 4 }}
                            textTransform="uppercase"
                            letterSpacing="wider"
                            borderBottom="2px"
                            borderColor="gray.200"
                            minW={{ base: "120px", md: "150px" }}
                          >
                            Função
                          </Th>
                          <Th 
                            fontSize={{ base: "sm", md: "md" }} 
                            fontWeight="bold" 
                            color="gray.700"
                            py={{ base: 4, md: 6 }}
                            px={{ base: 3, md: 4 }}
                            textTransform="uppercase"
                            letterSpacing="wider"
                            borderBottom="2px"
                            borderColor="gray.200"
                            minW={{ base: "140px", md: "160px" }}
                          >
                            Telefone
                          </Th>
                          <Th 
                            fontSize={{ base: "sm", md: "md" }} 
                            fontWeight="bold" 
                            color="gray.700"
                            py={{ base: 4, md: 6 }}
                            px={{ base: 3, md: 4 }}
                            textTransform="uppercase"
                            letterSpacing="wider"
                            borderBottom="2px"
                            borderColor="gray.200"
                            minW={{ base: "100px", md: "120px" }}
                          >
                            Status
                          </Th>
                          <Th 
                            fontSize={{ base: "sm", md: "md" }} 
                            fontWeight="bold" 
                            color="gray.700"
                            py={{ base: 4, md: 6 }}
                            px={{ base: 3, md: 4 }}
                            textTransform="uppercase"
                            letterSpacing="wider"
                            borderBottom="2px"
                            borderColor="gray.200"
                            minW={{ base: "80px", md: "100px" }}
                            textAlign="center"
                          >
                            Ações
                          </Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {filteredCollaborators.map((colaborador, index) => (
                          <Tr
                            key={colaborador.id}
                            bg={index % 2 === 0 ? "white" : "gray.50"}
                            _hover={{ bg: "blue.50", transform: "translateY(-1px)", boxShadow: "sm" }}
                            transition="all 0.2s ease-in-out"
                            height={{ base: "64px", md: "72px" }}
                            borderBottom="1px"
                            borderColor="gray.100"
                          >
                            <Td py={{ base: 3, md: 4 }} px={{ base: 3, md: 4 }}>
                              <HStack spacing={3} align="center">
                                <Avatar
                                  size={{ base: "sm", md: "md" }}
                                  src={colaborador.avatar || undefined}
                                  name={colaborador.nome}
                                  bg={`${getRoleBadgeColor(colaborador.cargos?.[0] || "")}.500`}
                                  color="white"
                                  flexShrink={0}
                                  boxShadow="sm"
                                />
                                <VStack align="start" spacing={1} flex={1} minW={0}>
                                  <Text 
                                    fontWeight="semibold" 
                                    color="gray.800"
                                    fontSize={{ base: "sm", md: "md" }}
                                    noOfLines={1}
                                    overflow="hidden"
                                    textOverflow="ellipsis"
                                    w="full"
                                  >
                                    {colaborador.nome}
                                  </Text>
                                  <HStack spacing={1} w="full">
                                    <Icon as={Instagram} size={12} color="gray.400" flexShrink={0} />
                                    <Text 
                                      fontSize={{ base: "xs", md: "sm" }} 
                                      color="gray.500"
                                      noOfLines={1}
                                      overflow="hidden"
                                      textOverflow="ellipsis"
                                      flex={1}
                                    >
                                      {colaborador.contato?.instagram || "Sem Instagram"}
                                    </Text>
                                  </HStack>
                                </VStack>
                              </HStack>
                            </Td>
                            <Td py={{ base: 3, md: 4 }} px={{ base: 3, md: 4 }}>
                              <HStack spacing={2} w="full" align="center">
                                <Icon as={Mail} size={14} color="gray.400" flexShrink={0} />
                                <Text 
                                  color="gray.700"
                                  fontSize={{ base: "sm", md: "md" }}
                                  noOfLines={1}
                                  overflow="hidden"
                                  textOverflow="ellipsis"
                                  flex={1}
                                >
                                  {colaborador.email}
                                </Text>
                              </HStack>
                            </Td>
                            <Td py={{ base: 3, md: 4 }} px={{ base: 3, md: 4 }}>
                              <HStack spacing={1} wrap="wrap" maxW="150px">
                                {colaborador.cargos?.map((cargo, idx) => (
                                  <Badge 
                                    key={idx} 
                                    colorScheme={getRoleBadgeColor(cargo)} 
                                    variant="solid"
                                    fontSize={{ base: "xs", md: "sm" }}
                                    px={{ base: 2, md: 3 }}
                                    py={{ base: 1, md: 1 }}
                                    borderRadius="full"
                                    textTransform="uppercase"
                                    fontWeight="medium"
                                    letterSpacing="wider"
                                  >
                                    {cargo}
                                  </Badge>
                                ))}
                              </HStack>
                            </Td>
                            <Td py={{ base: 3, md: 4 }} px={{ base: 3, md: 4 }}>
                              <HStack spacing={2} w="full" align="center">
                                <Icon as={Phone} size={14} color="gray.400" flexShrink={0} />
                                <Text 
                                  color="gray.700"
                                  fontSize={{ base: "sm", md: "md" }}
                                  noOfLines={1}
                                  overflow="hidden"
                                  textOverflow="ellipsis"
                                  flex={1}
                                >
                                  {colaborador.contato?.telefone || "Não informado"}
                                </Text>
                              </HStack>
                            </Td>
                            <Td py={{ base: 3, md: 4 }} px={{ base: 3, md: 4 }}>
                              <Badge 
                                colorScheme={colaborador.status === "active" ? "green" : "gray"} 
                                variant="solid"
                                fontSize={{ base: "xs", md: "sm" }}
                                px={{ base: 2, md: 3 }}
                                py={{ base: 1, md: 1 }}
                                borderRadius="full"
                                textTransform="uppercase"
                                fontWeight="medium"
                                letterSpacing="wider"
                              >
                                {colaborador.status === "active" ? "Ativo" : "Inativo"}
                              </Badge>
                            </Td>
                            <Td py={{ base: 3, md: 4 }} px={{ base: 3, md: 4 }} textAlign="center">
                              <Box as="span" position="relative" display="inline-block" w="100%">
                                <IconButton
                                  aria-label="Opções"
                                  icon={<MoreVertical size={16} />}
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleMenuToggle(colaborador.id || null)}
                                  zIndex={11}
                                  color="gray.600"
                                  _hover={{ bg: "gray.100", color: "gray.800" }}
                                  transition="all 0.2s"
                                />
                                {openMenuId === colaborador.id && (
                                  <VStack
                                    position="absolute"
                                    left="50%"
                                    top="calc(100% + 8px)"
                                    transform="translateX(-50%)"
                                    bg="white"
                                    borderWidth={1}
                                    borderColor="gray.200"
                                    borderRadius="lg"
                                    boxShadow="2xl"
                                    zIndex={20}
                                    minW="180px"
                                    py={2}
                                    align="stretch"
                                    spacing={1}
                                    data-menu-container
                                  >
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      w="full"
                                      justifyContent="start"
                                      leftIcon={<Edit size={16} />}
                                      onClick={() => {
                                        handleEditCollaborator(colaborador)
                                        handleMenuToggle(null)
                                      }}
                                      borderRadius="md"
                                      _hover={{ bg: "blue.50", color: "blue.600" }}
                                      transition="all 0.2s"
                                    >
                                      Editar
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      w="full"
                                      justifyContent="start"
                                      leftIcon={colaborador.status === "active" ? <UserX size={16} /> : <UserCheck size={16} />}
                                      onClick={() => {
                                        handleToggleStatus(colaborador)
                                        handleMenuToggle(null)
                                      }}
                                      borderRadius="md"
                                      _hover={{ bg: "orange.50", color: "orange.600" }}
                                      transition="all 0.2s"
                                    >
                                      {colaborador.status === "active" ? "Desativar" : "Ativar"}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      w="full"
                                      justifyContent="start"
                                      leftIcon={<Trash2 size={16} />}
                                      color="red.500"
                                      onClick={() => {
                                        handleDeleteCollaborator(colaborador)
                                        handleMenuToggle(null)
                                      }}
                                      borderRadius="md"
                                      _hover={{ bg: "red.50", color: "red.600" }}
                                      transition="all 0.2s"
                                    >
                                      Excluir
                                    </Button>
                                  </VStack>
                                )}
                              </Box>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                </Card>
              )}

              {/* Mobile/Tablet Card View */}
              {isMobile && (
                <VStack spacing={10}>
            {filteredCollaborators.map((colaborador) => (
                    <Card key={colaborador.id} bg={cardBg} shadow="lg" w="full" _hover={{ shadow: "xl" }}>
                      <CardBody p={{ base: 8, md: 10 }}>
                        <Flex justify="space-between" align="start" mb={4}>
                          <HStack spacing={4} flex={1} minW={0}>
                            <Avatar
                              size="lg"
                              src={colaborador.avatar || undefined}
                              name={colaborador.nome}
                              bg={`${getRoleBadgeColor(colaborador.cargos?.[0] || "")}.500`}
                              color="white"
                              flexShrink={0}
                            />
                            <VStack align="start" spacing={1} flex={1} minW={0}>
                              <Text 
                                fontWeight="bold" 
                                fontSize="lg" 
                                color="gray.800"
                                noOfLines={1}
                                overflow="hidden"
                                textOverflow="ellipsis"
                                w="full"
                              >
                                {colaborador.nome}
                              </Text>
                              <HStack spacing={1} w="full">
                                <Icon as={Mail} size={14} color="gray.400" flexShrink={0} />
                                <Text 
                                  fontSize="sm" 
                                  color="gray.600"
                                  noOfLines={1}
                                  overflow="hidden"
                                  textOverflow="ellipsis"
                                  flex={1}
                                >
                                  {colaborador.email}
                                </Text>
                              </HStack>
                            </VStack>
                          </HStack>
                          <Box position="relative" flexShrink={0}>
                            <IconButton
                              aria-label="Opções"
                              icon={<MoreVertical size={16} />}
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMenuToggle(colaborador.id || null)}
                            />
                            {openMenuId === colaborador.id && (
                              <Box
                                position="absolute"
                                right={0}
                                top="100%"
                                bg="white"
                                border="1px"
                                borderColor="gray.200"
                                borderRadius="md"
                                boxShadow="lg"
                                zIndex={10}
                                minW="120px"
                                data-menu-container
                              >
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  w="full"
                                  justifyContent="start"
                                  leftIcon={<Edit size={16} />}
                                  onClick={() => {
                                    handleEditCollaborator(colaborador)
                                    handleMenuToggle(null)
                                  }}
                                >
                                  Editar
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  w="full"
                                  justifyContent="start"
                                  leftIcon={colaborador.status === "active" ? <UserX size={16} /> : <UserCheck size={16} />}
                                  onClick={() => {
                                    handleToggleStatus(colaborador)
                                    handleMenuToggle(null)
                                  }}
                                >
                                  {colaborador.status === "active" ? "Desativar" : "Ativar"}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  w="full"
                                  justifyContent="start"
                                  leftIcon={<Trash2 size={16} />}
                                  color="red.500"
                                  onClick={() => {
                                    handleDeleteCollaborator(colaborador)
                                    handleMenuToggle(null)
                                  }}
                                >
                                  Excluir
                                </Button>
                              </Box>
                            )}
                          </Box>
                        </Flex>

                        <VStack spacing={3} align="stretch">
                          <HStack spacing={2} w="full">
                            <Icon as={Phone} size={16} color="gray.400" flexShrink={0} />
                            <Text 
                              color="gray.600"
                              fontSize="sm"
                              noOfLines={1}
                              overflow="hidden"
                              textOverflow="ellipsis"
                              flex={1}
                            >
                              {colaborador.contato?.telefone || "Não informado"}
                            </Text>
                          </HStack>

                          {colaborador.contato?.instagram && (
                            <HStack spacing={2} w="full">
                              <Icon as={Instagram} size={16} color="gray.400" flexShrink={0} />
                              <Text 
                                color="gray.600"
                                fontSize="sm"
                                noOfLines={1}
                                overflow="hidden"
                                textOverflow="ellipsis"
                                flex={1}
                              >
                                {colaborador.contato.instagram}
                              </Text>
                            </HStack>
                          )}

                          <Flex justify="space-between" align="center" pt={3} borderTop="1px" borderColor="gray.100" w="full">
                            <HStack spacing={2} wrap="wrap" flex={1} minW={0}>
                              {colaborador.cargos?.map((cargo, idx) => (
                                <Badge 
                                  key={idx} 
                                  colorScheme={getRoleBadgeColor(cargo)} 
                                  variant="solid"
                                  fontSize="xs"
                                  px={2}
                                  py={1}
                                >
                                  {cargo}
                                </Badge>
                              ))}
                            </HStack>
                            <Badge 
                              colorScheme={colaborador.status === "active" ? "green" : "gray"} 
                              variant="solid"
                              flexShrink={0}
                              ml={2}
                            >
                              {colaborador.status === "active" ? "Ativo" : "Inativo"}
                            </Badge>
                          </Flex>
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              )}
          </>
        ) : (
            <Card bg={cardBg} shadow="lg">
              <CardBody p={16}>
                <Center>
                  <VStack spacing={6}>
                    <Box p={6} bg="gray.100" borderRadius="full">
                      <Icon as={User} w={12} h={12} color="gray.400" />
                    </Box>
                    <VStack spacing={3}>
                      <Heading size="lg" color="gray.800">
                        Nenhum colaborador encontrado
                      </Heading>
                      <Text color="gray.600" textAlign="center" fontSize="lg">
                        Adicione colaboradores à sua equipe ou ajuste seus filtros de busca
                      </Text>
                    </VStack>
                    <Button
                      leftIcon={<UserPlus size={20} />}
                      colorScheme="blue"
                      size="lg"
                      onClick={handleOpenModal}
                      shadow="lg"
                    >
              Adicionar Colaborador
                    </Button>
                  </VStack>
                </Center>
              </CardBody>
            </Card>
          )}

          {/* Add/Edit Collaborator Modal */}
      {showModal && (
            <Box
              position="fixed"
              top={0}
              left={0}
              right={0}
              bottom={0}
              bg="rgba(0,0,0,0.5)"
              zIndex={1000}
              display="flex"
              alignItems="center"
              justifyContent="center"
              p={{ base: 2, md: 4 }}
              overflow="auto"
            >
              <Box
                bg="white"
                borderRadius="xl"
                maxW={{ base: "95vw", md: "6xl" }}
                w="full"
                maxH={{ base: "95vh", md: "90vh" }}
                overflow="hidden"
                position="relative"
                mx={{ base: 2, md: 0 }}
                my={{ base: 2, md: 0 }}
              >
                <Box
                  position="absolute"
                  top={{ base: 2, md: 4 }}
                  right={{ base: 2, md: 4 }}
                  zIndex={10}
                >
                  <IconButton
                    aria-label="Fechar"
                    icon={<X size={20} />}
                    variant="ghost"
                    size={{ base: "md", md: "lg" }}
                    onClick={handleCloseModal}
                  />
                </Box>
                
                <Box p={{ base: 4, md: 8 }} overflow="auto" maxH="100%">
                  <VStack align="stretch" spacing={{ base: 3, md: 4 }}>
                    <HStack spacing={{ base: 2, md: 4 }}>
                      {currentStep > 1 && (
                        <IconButton
                          aria-label="Voltar"
                          icon={<ArrowLeft size={20} />}
                          variant="ghost"
                          size={{ base: "md", md: "lg" }}
                          onClick={handlePrevStep}
                        />
                      )}
                      <VStack align="start" flex={1} spacing={1}>
                        <Heading size={{ base: "md", md: "lg" }} color="gray.800">
                {editingCollaboratorId ? "Editar Colaborador" : "Adicionar Colaborador"}
                        </Heading>
                        <Text color="gray.600" fontSize={{ base: "sm", md: "lg" }}>
                          Passo {currentStep} de 6 -{" "}
                          {currentStep === 1
                            ? "Informações Básicas"
                            : currentStep === 2
                              ? "Cargos e Funções"
                              : currentStep === 3
                                ? "Contato"
                                : currentStep === 4
                                  ? "Informações Pessoais"
                                  : currentStep === 5
                                    ? "Informações Bancárias"
                                    : "Endereço"}
                        </Text>
                      </VStack>
                    </HStack>

                    {/* Progress Steps */}
                    <HStack spacing={{ base: 1, md: 3 }} overflowX="auto" pb={2}>
                {[1, 2, 3, 4, 5, 6].map((step) => (
                        <HStack key={step} spacing={{ base: 1, md: 2 }} flexShrink={0}>
                          <Box
                            w={{ base: 8, md: 10 }}
                            h={{ base: 8, md: 10 }}
                            borderRadius="full"
                            bg={currentStep >= step ? "blue.500" : "gray.200"}
                            color={currentStep >= step ? "white" : "gray.600"}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            fontWeight="bold"
                            fontSize={{ base: "sm", md: "md" }}
                            transition="all 0.2s"
                          >
                    {step}
                          </Box>
                          {step < 6 && (
                            <Box
                              w={{ base: 8, md: 12 }}
                              h={2}
                              borderRadius="full"
                              bg={currentStep > step ? "blue.500" : "gray.200"}
                              transition="all 0.2s"
                            />
                          )}
                        </HStack>
                      ))}
                    </HStack>
                    <Progress
                      value={(currentStep / 6) * 100}
                      colorScheme="blue"
                      size="sm"
                      borderRadius="full"
                      bg="gray.200"
                    />
                  </VStack>
                </Box>

                <Box py={{ base: 4, md: 8 }} px={{ base: 4, md: 8 }} overflow="auto" maxH={{ base: "calc(100vh - 200px)", md: "calc(100vh - 250px)", lg: "calc(100vh - 300px)" }}>
            <form onSubmit={handleSubmit}>
                {/* Step 1: Basic Information */}
                {currentStep === 1 && (
                      <VStack spacing={{ base: 4, md: 6 }} align="stretch">
                        <HStack spacing={{ base: 2, md: 3 }} mb={{ base: 4, md: 6 }}>
                          <Box p={{ base: 2, md: 3 }} bg="blue.500" borderRadius="xl">
                            <Icon as={User} w={{ base: 5, md: 6 }} h={{ base: 5, md: 6 }} color="white" />
                          </Box>
                          <Heading size={{ base: "md", md: "lg" }} color="gray.800">
                            Informações Básicas
                          </Heading>
                        </HStack>

                        <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={{ base: 4, md: 6 }}>
                          <VStack align="stretch" spacing={3}>
                            <Text fontWeight="semibold" color="gray.700" fontSize={{ base: "sm", md: "md" }}>
                              Nome *
                            </Text>
                            <InputGroup size={{ base: "md", md: "lg" }}>
                              <InputLeftElement>
                                <Icon as={User} color="gray.400" />
                              </InputLeftElement>
                              <Input
                          name="name"
                          placeholder="Nome do colaborador"
                          required
                          value={formData.name}
                          onChange={handleInputChange}
                                bg="white"
                                borderColor="gray.200"
                                _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px blue.500" }}
                              />
                            </InputGroup>
                          </VStack>
                          <VStack align="stretch" spacing={3}>
                            <Text fontWeight="semibold" color="gray.700" fontSize={{ base: "sm", md: "md" }}>
                              Sobrenome
                            </Text>
                            <Input
                        name="lastName"
                        placeholder="Sobrenome do colaborador"
                        value={formData.lastName}
                        onChange={handleInputChange}
                              size={{ base: "md", md: "lg" }}
                              bg="white"
                              borderColor="gray.200"
                              _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px blue.500" }}
                            />
                          </VStack>
                        </Grid>

                        <VStack align="stretch" spacing={3}>
                          <Text fontWeight="semibold" color="gray.700" fontSize={{ base: "sm", md: "md" }}>
                            E-mail do colaborador *
                          </Text>
                          <InputGroup size={{ base: "md", md: "lg" }}>
                            <InputLeftElement>
                              <Icon as={Mail} color="gray.400" />
                            </InputLeftElement>
                            <Input
                          name="email"
                              type="email"
                          placeholder="email@exemplo.com"
                          required
                          value={formData.email}
                          onChange={handleInputChange}
                              bg="white"
                              borderColor="gray.200"
                              _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px blue.500" }}
                            />
                          </InputGroup>
                          <Alert status="info" borderRadius="lg">
                            <Icon as={Info} color="blue.500" mr={2} />
                            <AlertDescription fontSize={{ base: "xs", md: "sm" }}>
                              💡 Preencha este campo de e-mail caso o colaborador também precise acessar o sistema.
                            </AlertDescription>
                          </Alert>
                        </VStack>

                        <VStack align="stretch" spacing={3}>
                          <Text fontWeight="semibold" color="gray.700" fontSize={{ base: "sm", md: "md" }}>
                            Agendamento Online
                          </Text>
                          <Select
                            name="onlineScheduling"
                            value={formData.onlineScheduling}
                            onChange={(e) => setFormData((prev) => ({ ...prev, onlineScheduling: e.target.value }))}
                            size={{ base: "md", md: "lg" }}
                            bg="white"
                            borderColor="gray.200"
                            _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px blue.500" }}
                          >
                          <option value="enabled">Habilitado</option>
                          <option value="disabled">Desabilitado</option>
                          </Select>
                          <Alert status="warning" borderRadius="lg">
                            <Icon as={AlertTriangle} color="orange.500" mr={2} />
                            <AlertDescription fontSize={{ base: "xs", md: "sm" }}>
                              📅 Clientes podem selecionar este profissional para marcar Agendamentos Online.
                            </AlertDescription>
                          </Alert>
                        </VStack>
                      </VStack>
                    )}

                    {/* Step 2: Cargos e Funções */}
                {currentStep === 2 && (
                      <VStack spacing={{ base: 4, md: 6 }} align="stretch">
                        <HStack spacing={{ base: 2, md: 3 }} mb={{ base: 4, md: 6 }}>
                          <Box p={{ base: 2, md: 3 }} bg="blue.500" borderRadius="xl">
                            <Icon as={Briefcase} w={{ base: 5, md: 6 }} h={{ base: 5, md: 6 }} color="white" />
                          </Box>
                          <Heading size={{ base: "md", md: "lg" }} color="gray.800">
                            Cargos e Funções
                          </Heading>
                        </HStack>
                        <Text fontWeight="semibold" color="gray.700" fontSize={{ base: "sm", md: "md" }}>
                          Selecione os cargos do colaborador:
                        </Text>
                        <HStack spacing={3} wrap="wrap">
                          {['Proprietário', 'Gerente', 'Profissional', 'Atendente'].map((role) => (
                            <Checkbox
                              key={role}
                              isChecked={formData.roles.includes(role)}
                              onChange={() => handleRoleToggle(role)}
                              colorScheme="blue"
                            >
                              {role}
                            </Checkbox>
                          ))}
                        </HStack>
                        <Text fontWeight="semibold" color="gray.700" fontSize={{ base: "sm", md: "md" }} mt={4}>
                          Permissões e funções:
                        </Text>
                        <HStack spacing={3} wrap="wrap">
                          <Checkbox
                            isChecked={formData.attributes.executeAppointments}
                            onChange={() => handleAttributeToggle('executeAppointments')}
                            colorScheme="green"
                          >
                            Executa atendimentos
                          </Checkbox>
                          <Checkbox
                            isChecked={formData.attributes.sellProducts}
                            onChange={() => handleAttributeToggle('sellProducts')}
                            colorScheme="purple"
                          >
                            Vende produtos
                          </Checkbox>
                          <Checkbox
                            isChecked={formData.attributes.sellPackages}
                            onChange={() => handleAttributeToggle('sellPackages')}
                            colorScheme="yellow"
                          >
                            Vende pacotes
                          </Checkbox>
                        </HStack>
                      </VStack>
                    )}

                    {/* Step 3: Contato */}
                {currentStep === 3 && (
                      <VStack spacing={{ base: 4, md: 6 }} align="stretch">
                        <HStack spacing={{ base: 2, md: 3 }} mb={{ base: 4, md: 6 }}>
                          <Box p={{ base: 2, md: 3 }} bg="blue.500" borderRadius="xl">
                            <Icon as={Phone} w={{ base: 5, md: 6 }} h={{ base: 5, md: 6 }} color="white" />
                          </Box>
                          <Heading size={{ base: "md", md: "lg" }} color="gray.800">
                            Contato
                          </Heading>
                        </HStack>
                        <VStack align="stretch" spacing={3}>
                          <Text fontWeight="semibold" color="gray.700" fontSize={{ base: "sm", md: "md" }}>
                            Telefone
                          </Text>
                          <InputGroup size={{ base: "md", md: "lg" }}>
                            <InputLeftElement>
                              <Icon as={Phone} color="gray.400" />
                            </InputLeftElement>
                            <Input
                              as={IMaskInput}
                              mask="(00) 00000-0000"
                              name="phone"
                              placeholder="(99) 99999-9999"
                              value={formData.contact.phone}
                              onAccept={(value: any) => handleInputChange({ target: { name: 'phone', value } } as any, 'contact')}
                              bg="white"
                              borderColor="gray.200"
                              _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px blue.500" }}
                            />
                          </InputGroup>
                          <Select
                            name="phoneType"
                            value={formData.contact.phoneType}
                            onChange={(e) => handleInputChange(e, 'contact')}
                            size={{ base: "md", md: "lg" }}
                            bg="white"
                            borderColor="gray.200"
                            _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px blue.500" }}
                          >
                            <option value="WhatsApp">WhatsApp</option>
                            <option value="Celular">Celular</option>
                            <option value="Fixo">Fixo</option>
                          </Select>
                        </VStack>
                        <VStack align="stretch" spacing={3}>
                          <Text fontWeight="semibold" color="gray.700" fontSize={{ base: "sm", md: "md" }}>
                            Instagram
                          </Text>
                          <InputGroup size={{ base: "md", md: "lg" }}>
                            <InputLeftElement>
                              <Icon as={Instagram} color="gray.400" />
                            </InputLeftElement>
                            <Input
                              name="instagram"
                              placeholder="@usuario"
                              value={formData.contact.instagram}
                              onChange={(e) => handleInputChange(e, 'contact')}
                              bg="white"
                              borderColor="gray.200"
                              _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px blue.500" }}
                            />
                          </InputGroup>
                        </VStack>
                      </VStack>
                    )}

                    {/* Step 4: Informações Pessoais */}
                {currentStep === 4 && (
                      <VStack spacing={{ base: 4, md: 6 }} align="stretch">
                        <HStack spacing={{ base: 2, md: 3 }} mb={{ base: 4, md: 6 }}>
                          <Box p={{ base: 2, md: 3 }} bg="blue.500" borderRadius="xl">
                            <Icon as={Shield} w={{ base: 5, md: 6 }} h={{ base: 5, md: 6 }} color="white" />
                          </Box>
                          <Heading size={{ base: "md", md: "lg" }} color="gray.800">
                            Informações Pessoais
                          </Heading>
                        </HStack>
                        <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={{ base: 4, md: 6 }}>
                          <VStack align="stretch" spacing={3}>
                            <Text fontWeight="semibold" color="gray.700" fontSize={{ base: "sm", md: "md" }}>
                              Data de Nascimento
                            </Text>
                            <Input
                              as={IMaskInput}
                              mask="00/00/0000"
                        name="birthDate"
                              placeholder="dd/mm/aaaa"
                        value={formData.personal.birthDate}
                              onAccept={(value: any) => handleInputChange({ target: { name: 'birthDate', value } } as any, 'personal')}
                              size={{ base: "md", md: "lg" }}
                              bg="white"
                              borderColor="gray.200"
                              _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px blue.500" }}
                            />
                          </VStack>
                          <VStack align="stretch" spacing={3}>
                            <Text fontWeight="semibold" color="gray.700" fontSize={{ base: "sm", md: "md" }}>
                              CPF
                            </Text>
                            <Input
                              as={IMaskInput}
                              mask="000.000.000-00"
                        name="cpf"
                        placeholder="000.000.000-00"
                        value={formData.personal.cpf}
                              onAccept={(value: any) => handleInputChange({ target: { name: 'cpf', value } } as any, 'personal')}
                              size={{ base: "md", md: "lg" }}
                              bg="white"
                              borderColor="gray.200"
                              _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px blue.500" }}
                            />
                          </VStack>
                          <VStack align="stretch" spacing={3}>
                            <Text fontWeight="semibold" color="gray.700" fontSize={{ base: "sm", md: "md" }}>
                              RG
                            </Text>
                            <Input
                              as={IMaskInput}
                              mask="00.000.000-0"
                          name="rg"
                          placeholder="00.000.000-0"
                          value={formData.personal.rg}
                              onAccept={(value: any) => handleInputChange({ target: { name: 'rg', value } } as any, 'personal')}
                              size={{ base: "md", md: "lg" }}
                              bg="white"
                              borderColor="gray.200"
                              _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px blue.500" }}
                            />
                          </VStack>
                          <VStack align="stretch" spacing={3}>
                            <Text fontWeight="semibold" color="gray.700" fontSize={{ base: "sm", md: "md" }}>
                              Órgão Expedidor
                            </Text>
                            <Input
                              name="issuingBody"
                              placeholder="SSP"
                              value={formData.personal.issuingBody}
                              onChange={(e) => handleInputChange(e, 'personal')}
                              size={{ base: "md", md: "lg" }}
                              bg="white"
                              borderColor="gray.200"
                              _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px blue.500" }}
                            />
                          </VStack>
                        </Grid>
                        <VStack align="stretch" spacing={3}>
                          <Text fontWeight="semibold" color="gray.700" fontSize={{ base: "sm", md: "md" }}>
                            Informações Adicionais
                          </Text>
                          <Textarea
                        name="additionalInfo"
                            placeholder="Observações, especialidades, etc."
                        value={formData.personal.additionalInfo}
                            onChange={(e) => handleInputChange(e, 'personal')}
                            size={{ base: "md", md: "lg" }}
                            bg="white"
                            borderColor="gray.200"
                            _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px blue.500" }}
                            rows={3}
                          />
                        </VStack>
                      </VStack>
                    )}

                    {/* Step 5: Informações Bancárias */}
                {currentStep === 5 && (
                      <VStack spacing={{ base: 4, md: 6 }} align="stretch">
                        <HStack spacing={{ base: 2, md: 3 }} mb={{ base: 4, md: 6 }}>
                          <Box p={{ base: 2, md: 3 }} bg="blue.500" borderRadius="xl">
                            <Icon as={CreditCard} w={{ base: 5, md: 6 }} h={{ base: 5, md: 6 }} color="white" />
                          </Box>
                          <Heading size={{ base: "md", md: "lg" }} color="gray.800">
                            Informações Bancárias
                          </Heading>
                        </HStack>
                        <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={{ base: 4, md: 6 }}>
                          <VStack align="stretch" spacing={3}>
                            <Text fontWeight="semibold" color="gray.700" fontSize={{ base: "sm", md: "md" }}>
                              Chave Pix
                            </Text>
                            <Input
                        name="pixKey"
                              placeholder="Chave Pix"
                        value={formData.banking.pixKey}
                              onChange={(e) => handleInputChange(e, 'banking')}
                              size={{ base: "md", md: "lg" }}
                              bg="white"
                              borderColor="gray.200"
                              _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px blue.500" }}
                            />
                          </VStack>
                          <VStack align="stretch" spacing={3}>
                            <Text fontWeight="semibold" color="gray.700" fontSize={{ base: "sm", md: "md" }}>
                              Banco
                            </Text>
                            <Input
                        name="bank"
                              placeholder="Banco"
                        value={formData.banking.bank}
                              onChange={(e) => handleInputChange(e, 'banking')}
                              size={{ base: "md", md: "lg" }}
                              bg="white"
                              borderColor="gray.200"
                              _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px blue.500" }}
                            />
                          </VStack>
                          <VStack align="stretch" spacing={3}>
                            <Text fontWeight="semibold" color="gray.700" fontSize={{ base: "sm", md: "md" }}>
                              Agência
                            </Text>
                            <Input
                              as={IMaskInput}
                              mask="0000"
                          name="agency"
                              placeholder="Agência"
                          value={formData.banking.agency}
                              onAccept={(value: any) => handleInputChange({ target: { name: 'agency', value } } as any, 'banking')}
                              size={{ base: "md", md: "lg" }}
                              bg="white"
                              borderColor="gray.200"
                              _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px blue.500" }}
                            />
                          </VStack>
                          <VStack align="stretch" spacing={3}>
                            <Text fontWeight="semibold" color="gray.700" fontSize={{ base: "sm", md: "md" }}>
                              Conta
                            </Text>
                            <Input
                              as={IMaskInput}
                              mask="000000"
                          name="account"
                              placeholder="Conta"
                          value={formData.banking.account}
                              onAccept={(value: any) => handleInputChange({ target: { name: 'account', value } } as any, 'banking')}
                              size={{ base: "md", md: "lg" }}
                              bg="white"
                              borderColor="gray.200"
                              _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px blue.500" }}
                            />
                          </VStack>
                          <VStack align="stretch" spacing={3}>
                            <Text fontWeight="semibold" color="gray.700" fontSize={{ base: "sm", md: "md" }}>
                              Dígito
                            </Text>
                            <Input
                          name="digit"
                              placeholder="Dígito"
                          value={formData.banking.digit}
                              onChange={(e) => handleInputChange(e, 'banking')}
                              size={{ base: "md", md: "lg" }}
                              bg="white"
                              borderColor="gray.200"
                              _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px blue.500" }}
                            />
                          </VStack>
                          <VStack align="stretch" spacing={3}>
                            <Text fontWeight="semibold" color="gray.700" fontSize={{ base: "sm", md: "md" }}>
                              Tipo de Conta
                            </Text>
                            <Select
                            name="accountType"
                            value={formData.banking.accountType}
                              onChange={(e) => handleInputChange(e, 'banking')}
                              size={{ base: "md", md: "lg" }}
                              bg="white"
                              borderColor="gray.200"
                              _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px blue.500" }}
                            >
                            <option value="corrente">Corrente</option>
                            <option value="poupanca">Poupança</option>
                            </Select>
                          </VStack>
                          <VStack align="stretch" spacing={3}>
                            <Text fontWeight="semibold" color="gray.700" fontSize={{ base: "sm", md: "md" }}>
                              Tipo de Pessoa
                            </Text>
                            <Select
                            name="personType"
                            value={formData.banking.personType}
                              onChange={(e) => handleInputChange(e, 'banking')}
                              size={{ base: "md", md: "lg" }}
                              bg="white"
                              borderColor="gray.200"
                              _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px blue.500" }}
                            >
                            <option value="fisica">Física</option>
                            <option value="juridica">Jurídica</option>
                            </Select>
                          </VStack>
                        </Grid>
                      </VStack>
                    )}

                    {/* Step 6: Endereço */}
                {currentStep === 6 && (
                      <VStack spacing={{ base: 4, md: 6 }} align="stretch">
                        <HStack spacing={{ base: 2, md: 3 }} mb={{ base: 4, md: 6 }}>
                          <Box p={{ base: 2, md: 3 }} bg="blue.500" borderRadius="xl">
                            <Icon as={MapPin} w={{ base: 5, md: 6 }} h={{ base: 5, md: 6 }} color="white" />
                          </Box>
                          <Heading size={{ base: "md", md: "lg" }} color="gray.800">
                            Endereço
                          </Heading>
                        </HStack>
                        <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={{ base: 4, md: 6 }}>
                          <VStack align="stretch" spacing={3}>
                            <Text fontWeight="semibold" color="gray.700" fontSize={{ base: "sm", md: "md" }}>
                              CEP
                            </Text>
                            <Input
                              name="zipCode"
                              placeholder="00000000"
                              value={formData.address.zipCode}
                              onChange={(e) => handleInputChange(e, 'address')}
                              size={{ base: "md", md: "lg" }}
                              bg="white"
                              borderColor="gray.200"
                              _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px blue.500" }}
                              maxLength={8}
                            />
                          </VStack>
                          <VStack align="stretch" spacing={3}>
                            <Text fontWeight="semibold" color="gray.700" fontSize={{ base: "sm", md: "md" }}>
                              Rua
                            </Text>
                            <Input
                        name="street"
                              placeholder="Rua"
                        value={formData.address.street}
                              onChange={(e) => handleInputChange(e, 'address')}
                              size={{ base: "md", md: "lg" }}
                              bg="white"
                              borderColor="gray.200"
                              _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px blue.500" }}
                            />
                          </VStack>
                          <VStack align="stretch" spacing={3}>
                            <Text fontWeight="semibold" color="gray.700" fontSize={{ base: "sm", md: "md" }}>
                              Número
                            </Text>
                            <Input
                          name="number"
                              placeholder="Número"
                          value={formData.address.number}
                              onChange={(e) => handleInputChange(e, 'address')}
                              size={{ base: "md", md: "lg" }}
                              bg="white"
                              borderColor="gray.200"
                              _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px blue.500" }}
                            />
                          </VStack>
                          <VStack align="stretch" spacing={3}>
                            <Text fontWeight="semibold" color="gray.700" fontSize={{ base: "sm", md: "md" }}>
                              Complemento
                            </Text>
                            <Input
                          name="complement"
                              placeholder="Complemento"
                          value={formData.address.complement}
                              onChange={(e) => handleInputChange(e, 'address')}
                              size={{ base: "md", md: "lg" }}
                              bg="white"
                              borderColor="gray.200"
                              _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px blue.500" }}
                            />
                          </VStack>
                          <VStack align="stretch" spacing={3}>
                            <Text fontWeight="semibold" color="gray.700" fontSize={{ base: "sm", md: "md" }}>
                              Bairro
                            </Text>
                            <Input
                        name="neighborhood"
                        placeholder="Bairro"
                        value={formData.address.neighborhood}
                              onChange={(e) => handleInputChange(e, 'address')}
                              size={{ base: "md", md: "lg" }}
                              bg="white"
                              borderColor="gray.200"
                              _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px blue.500" }}
                            />
                          </VStack>
                          <VStack align="stretch" spacing={3}>
                            <Text fontWeight="semibold" color="gray.700" fontSize={{ base: "sm", md: "md" }}>
                              Cidade
                            </Text>
                            <Input
                        name="city"
                        placeholder="Cidade"
                        value={formData.address.city}
                              onChange={(e) => handleInputChange(e, 'address')}
                              size={{ base: "md", md: "lg" }}
                              bg="white"
                              borderColor="gray.200"
                              _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px blue.500" }}
                            />
                          </VStack>
                          <VStack align="stretch" spacing={3}>
                            <Text fontWeight="semibold" color="gray.700" fontSize={{ base: "sm", md: "md" }}>
                              Estado
                            </Text>
                            <Input
                            name="state"
                              placeholder="Estado"
                            value={formData.address.state}
                              onChange={(e) => handleInputChange(e, 'address')}
                              size={{ base: "md", md: "lg" }}
                              bg="white"
                              borderColor="gray.200"
                              _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px blue.500" }}
                            />
                          </VStack>
                        </Grid>
                      </VStack>
                    )}

                    {/* Modal Footer */}
                    <Flex 
                      direction={{ base: "column", md: "row" }}
                      justify="space-between" 
                      pt={{ base: 4, md: 8 }} 
                      borderTop="1px" 
                      borderColor="gray.200" 
                      mt={{ base: 4, md: 8 }}
                      gap={{ base: 3, md: 0 }}
                    >
                      <Box>
                {currentStep > 1 && (
                          <Button variant="outline" size={{ base: "md", md: "lg" }} onClick={handlePrevStep} px={{ base: 4, md: 8 }}>
                    Voltar
                          </Button>
                )}
                      </Box>
                      <HStack spacing={{ base: 2, md: 4 }}>
                {currentStep < 6 && (
                          <Button colorScheme="blue" size={{ base: "md", md: "lg" }} onClick={handleNextStep} px={{ base: 4, md: 8 }}>
                    Próximo
                          </Button>
                )}
                {currentStep === 6 && (
                          <Button
                            type="submit"
                            colorScheme="green"
                            size={{ base: "md", md: "lg" }}
                            leftIcon={<Check size={20} />}
                            px={{ base: 4, md: 8 }}
                            shadow="lg"
                          >
                    {editingCollaboratorId ? "Salvar Alterações" : "Criar Colaborador"}
                          </Button>
                )}
                      </HStack>
                    </Flex>
            </form>
                </Box>
              </Box>
            </Box>
      )}
        </VStack>
      </Container>
    </Box>
  )
}
