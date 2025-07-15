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
      console.log("Cliente excluído com sucesso!")
      // The onSnapshot listener will automatically update the UI
    } catch (error) {
      console.error("Erro ao excluir cliente:", error)
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

      console.log("Cliente atualizado com sucesso!")
      alert("Cliente atualizado com sucesso!")
      setShowEditModal(false) // Close the edit modal
      setSelectedClient(null) // Clear selected client
      setEditFormData({}) // Clear form data
    } catch (error) {
      console.error("Erro ao atualizar cliente:", error)
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
      console.error("Error formatting date:", error)
      return "Data inválida"
    }
  }

  // Function to get initials from name
  const getInitials = (name: string, surname: string) => {
    if (!name) return "?"
    const firstInitial = name.charAt(0).toUpperCase()
    const secondInitial = surname ? surname.charAt(0).toUpperCase() : ""
    return secondInitial ? `${firstInitial}${secondInitial}` : firstInitial
  }

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

  return (
    <div className="cliente-container">
      {/* Header flutuante responsivo */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 12,
          margin: '0 auto 24px auto',
          maxWidth: 600,
          background: 'white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
          borderRadius: 12,
          padding: '12px 20px',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 2,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontWeight: 700,
            fontSize: 20,
            color: '#5d3fd3',
            letterSpacing: 1,
            fontFamily: 'Inter, sans-serif',
            marginRight: 24,
            display: 'flex',
            alignItems: 'center',
            flex: 1,
            justifyContent: 'flex-start',
            minWidth: 120,
          }}
        >
          Clientes
        </span>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: 12,
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
            flex: 2,
            minWidth: 180,
          }}
        >
          <button className="btn-secondary" onClick={() => setShowFilters(!showFilters)} style={{ minWidth: 90 }}>
            <Filter size={18} />
            Filtros
          </button>
          <button className="btn-primary" onClick={handleOpenModal} style={{ minWidth: 120 }}>
            <UserPlus size={18} />
            Cadastrar Cliente
          </button>
        </div>
      </div>

      {/* Input de pesquisa responsivo */}
      <div
        className="search-container"
        style={{
          margin: '0 auto 20px auto',
          maxWidth: 600,
          width: '100%',
          padding: '0 8px',
        }}
      >
        
      </div>

      {/* CSS responsivo para mobile */}
      <style>{`
        @media (max-width: 600px) {
          .search-container {
            max-width: 98vw !important;
            padding: 0 2vw !important;
          }
          .search-input input {
            font-size: 14px !important;
            padding: 12px 12px 12px 40px !important;
          }
          /* Header flutuante */
          div[style*='box-shadow'] {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 8px !important;
            padding: 10px 6px !important;
          }
          div[style*='box-shadow'] > span {
            justify-content: center !important;
            font-size: 17px !important;
            margin-right: 0 !important;
            margin-bottom: 6px !important;
          }
          div[style*='box-shadow'] > div {
            flex-direction: column !important;
            gap: 8px !important;
            align-items: stretch !important;
          }
          .btn-secondary, .btn-primary {
            min-width: 0 !important;
            width: 100% !important;
            font-size: 15px !important;
          }
        }
      `}</style>

      {/* Filters */}
      {showFilters && (
        <div className="filters-container">
          <div className="filter-group">
            <label>Status</label>
            <div className="filter-options">
              <button className={filterStatus === "all" ? "active" : ""} onClick={() => setFilterStatus("all")}>
                Todos
              </button>
              <button className={filterStatus === "active" ? "active" : ""} onClick={() => setFilterStatus("active")}>
                Ativos
              </button>
              <button
                className={filterStatus === "inactive" ? "active" : ""}
                onClick={() => setFilterStatus("inactive")}
              >
                Inativos
              </button>
            </div>
          </div>
          <div className="filter-group">
            <label>Tags</label>
            <div className="filter-tags">
              <span className={selectedTags.includes("VIP") ? "tag active" : "tag"} onClick={() => toggleTag("VIP")}>
                VIP
              </span>
              <span className={selectedTags.includes("Novo") ? "tag active" : "tag"} onClick={() => toggleTag("Novo")}>
                Novo
              </span>
              <span
                className={selectedTags.includes("Cabelo") ? "tag active" : "tag"}
                onClick={() => toggleTag("Cabelo")}
              >
                Cabelo
              </span>
              <span
                className={selectedTags.includes("Manicure") ? "tag active" : "tag"}
                onClick={() => toggleTag("Manicure")}
              >
                Manicure
              </span>
              <span
                className={selectedTags.includes("Barba") ? "tag active" : "tag"}
                onClick={() => toggleTag("Barba")}
              >
                Barba
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="search-container">
        <div className="search-input">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por nome"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search" onClick={() => setSearchQuery("")}>
              <X size={16} />
            </button>
          )}
        </div>
        <div className="search-results">
          {filteredClients && filteredClients.length > 0 ? (
            <div className="results-count">
              <span>{filteredClients.length} cliente(s) encontrado(s)</span>
            </div>
          ) : filteredClients && filteredClients.length === 0 && searchQuery ? (
            <div className="empty-state">
              <Users size={48} />
              <h3>Nenhum cliente encontrado para sua busca</h3>
              <p>Tente ajustar sua busca ou cadastre um novo cliente</p>
              <button className="btn-primary" onClick={handleOpenModal}>
                <UserPlus size={18} />
                Cadastrar Cliente
              </button>
            </div>
          ) : filteredClients && filteredClients.length === 0 && !searchQuery ? (
            <div className="empty-state">
              <Users size={48} />
              <h3>Nenhum cliente cadastrado</h3>
              <p>Cadastre seu primeiro cliente para começar!</p>
              <button className="btn-primary" onClick={handleOpenModal}>
                <UserPlus size={18} />
                Cadastrar Cliente
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Client List */}
      {Array.isArray(filteredClients) && filteredClients.length > 0 && (
        <div className="client-list">
          {filteredClients.map((client) => (
            <div key={client.id} className="client-card">
              {/* Informações Principais */}
              <div className="client-info-principal">
                <h3>
                  {client.nome} {client.sobrenome}
                </h3>

                <p>
                  <strong>Telefone:</strong>
                  <Phone size={16} style={{ marginRight: "6px", color: "var(--primary)" }} />
                  {client.telefone || "Não informado"}
                </p>

                <p>
                  <strong>Email:</strong>
                  {client.email || "Não informado"}
                </p>

                <p>
                  <strong>CPF:</strong>
                  <User size={16} style={{ marginRight: "6px", color: "var(--primary)" }} />
                  {client.cpf || "Não informado"}
                </p>

                {client.cidade && (
                  <p>
                    <strong>Endereço:</strong>
                    <MapPin size={16} style={{ marginRight: "6px", color: "var(--primary)" }} />
                    {client.cidade}
                  </p>
                )}

                {client.dataCriacao && (
                  <p>
                    <strong>Cadastro:</strong>
                    <Clock size={16} style={{ marginRight: "6px", color: "var(--primary)" }} />
                    {formatDate(client.dataCriacao)}
                  </p>
                )}

                {/* Tags do cliente */}
                {client.tags && client.tags.length > 0 && (
                  <div className="client-tags">
                    <Tag size={16} style={{ color: "var(--primary)", marginRight: "8px" }} />
                    {client.tags.map((tag: string, index: number) => (
                      <span key={index} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {client.estabelecimento && (
                  <p style={{ fontSize: '11px', color: '#888', marginTop: '8px' }}>
                    cliente cadastrado por {client.estabelecimento}
                  </p>
                )}
              </div>

              {/* Ações */}
              <div className="client-actions">
                <button className="btn-icon" onClick={() => handleDeleteClient(client.id)}>
                  <Trash2 size={18} color="#ef4444" />
                </button>
                <button className="btn-icon">
                  <Phone size={18} />
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setSelectedClient(client)
                    setShowEditModal(true)
                  }}
                >
                  Editar perfil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Client Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <button className="modal-back" onClick={formStep > 1 ? handlePrevStep : handleCloseModal}>
                <ArrowLeft size={20} />
              </button>
              <h2>
                {formStep === 1 && "Novo Cliente"}
                {formStep === 2 && "Informações de Contato"}
                {formStep === 3 && "Preferências e Detalhes"}
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
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="name">Nome*</label>
                      <input
                        type="text"
                        id="name"
                        placeholder="Nome do cliente"
                        required
                        value={nomeClinte}
                        onChange={(e) => setNomeCliente(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="surname">Sobrenome</label>
                      <input
                        type="text"
                        id="surname"
                        placeholder="Sobrenome do cliente"
                        value={sobreNomeClinte}
                        onChange={(e) => setSobreNomeCliente(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="cpf">CPF</label>
                      <input
                        type="text"
                        id="cpf"
                        placeholder="000.000.000-00"
                        value={cpfClinte}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "") // Remove non-digits
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
                          // Limit to 11 digits + formatting
                          if (maskedValue.length > 14) {
                            maskedValue = maskedValue.slice(0, 14)
                          }

                          setCpfCliente(maskedValue)
                        }}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="birthdate">Data de Nascimento</label>
                      <input
                        type="date"
                        id="birthdate"
                        value={dataNascimentoClinte}
                        onChange={(e) => setDataNascimentoCliente(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Agendamento Online</label>
                    <div className="toggle-switch">
                      <input
                        type="checkbox"
                        id="online-scheduling"
                        checked={agendamentoOnline}
                        onChange={(e) => setAgendamentoOnline(e.target.checked)}
                      />
                      <label htmlFor="online-scheduling"></label>
                      <span>{agendamentoOnline ? "Habilitado" : "Desabilitado"}</span>
                    </div>
                    <p className="form-help">Este cliente poderá marcar agendamentos online.</p>
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

              {/* Step 2: Contact Information */}
              {formStep === 2 && (
                <div className="modal-body">
                  <div className="form-section">
                    <h3>Informações de Contato</h3>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="phone">Telefone*</label>
                        <div className="input-with-icon">
                          <Phone size={18} />
                          <input
                            type="tel"
                            id="phone"
                            placeholder="(00) 00000-0000"
                            required
                            value={telefoneContato}
                            onChange={(e) => setTelefoneContato(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label htmlFor="whatsapp">WhatsApp</label>
                        <div className="input-with-icon">
                          <Phone size={18} />
                          <input
                            type="tel"
                            id="whatsapp"
                            placeholder="(00) 00000-0000"
                            value={whatsappContato}
                            onChange={(e) => setWhatsappContato(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="email">E-mail</label>
                      <div className="input-with-icon">
                        <Mail size={18} />
                        <input
                          type="email"
                          id="email"
                          placeholder="email@exemplo.com"
                          value={emailContato}
                          onChange={(e) => setEmailContato(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="instagram">Instagram</label>
                      <div className="input-with-icon">
                        <Instagram size={18} />
                        <input
                          type="text"
                          id="instagram"
                          placeholder="@usuario"
                          value={instagramContato}
                          onChange={(e) => setInstagramContato(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                    <h3>Endereço</h3>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="cep">CEP</label>
                        <input
                          type="text"
                          id="cep"
                          placeholder="00000-000"
                          value={cepCliente}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "") // Remove non-digits
                            let maskedValue = value
                            if (value.length > 5) {
                              maskedValue = `${value.slice(0, 5)}-${value.slice(5, 8)}`
                            }
                            setCepCliente(maskedValue)
                          }}
                          onBlur={(e) => fetchAddressByCep(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="city">Cidade</label>
                        <input
                          type="text"
                          id="city"
                          placeholder="Cidade"
                          value={cidadeCliente}
                          onChange={(e) => setCidadeCliente(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="street">Rua</label>
                        <input
                          type="text"
                          id="street"
                          placeholder="Rua, Avenida, etc"
                          value={ruaClinte}
                          onChange={(e) => setRuaCliente(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="number">Número</label>
                        <input
                          type="text"
                          id="number"
                          placeholder="Número"
                          value={numeroCasaClinte}
                          onChange={(e) => setNumeroCasaCliente(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="complement">Complemento</label>
                      <input
                        type="text"
                        id="complement"
                        placeholder="Apartamento, bloco, etc"
                        value={complementoCasaClinte}
                        onChange={(e) => setComplementoCasaCliente(e.target.value)}
                      />
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

              {/* Step 3: Preferences and Details */}
              {formStep === 3 && (
                <div className="modal-body">
                  <div className="form-section">
                    <h3>Preferências e Detalhes</h3>

                    <div className="form-group">
                      <label htmlFor="referral">Como Conheceu</label>
                      <div className="select-wrapper">
                        <select id="referral" value={comoConheceu} onChange={(e) => setComoConheceu(e.target.value)}>
                          <option value="">Selecione uma opção</option>
                          <option value="indicacao">Indicação</option>
                          <option value="redes-sociais">Redes Sociais</option>
                          <option value="google">Google</option>
                          <option value="passagem">Passagem</option>
                          <option value="outro">Outro</option>
                        </select>
                        <ChevronDown size={18} />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Tags</label>
                      <div className="tags-container">
                        <span
                          className={selectedTags.includes("VIP") ? "tag active" : "tag"}
                          onClick={() => toggleTag("VIP")}
                        >
                          VIP
                        </span>
                        <span
                          className={selectedTags.includes("Novo") ? "tag active" : "tag"}
                          onClick={() => toggleTag("Novo")}
                        >
                          Novo
                        </span>
                        <span
                          className={selectedTags.includes("Cabelo") ? "tag active" : "tag"}
                          onClick={() => toggleTag("Cabelo")}
                        >
                          Cabelo
                        </span>
                        <span
                          className={selectedTags.includes("Manicure") ? "tag active" : "tag"}
                          onClick={() => toggleTag("Manicure")}
                        >
                          Manicure
                        </span>
                        <span
                          className={selectedTags.includes("Barba") ? "tag active" : "tag"}
                          onClick={() => toggleTag("Barba")}
                        >
                          Barba
                        </span>
                        <span className="tag add-tag">+ Nova Tag</span>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="notes">Anotações Importantes</label>
                      <textarea
                        id="notes"
                        placeholder="Adicione informações importantes sobre o cliente, como alergias, preferências, etc."
                        rows={4}
                        value={anotacoesImportantes}
                        onChange={(e) => setAnotacoesImportantes(e.target.value)}
                      ></textarea>
                    </div>

                    <div className="form-group">
                      <label>Notificações</label>
                      <div className="checkbox-group">
                        <div className="checkbox-item">
                          <input type="checkbox" id="notify-sms" />
                          <label htmlFor="notify-sms">Enviar SMS</label>
                        </div>
                        <div className="checkbox-item">
                          <input type="checkbox" id="notify-email" />
                          <label htmlFor="notify-email">Enviar E-mail</label>
                        </div>
                        <div className="checkbox-item">
                          <input type="checkbox" id="notify-whatsapp" />
                          <label htmlFor="notify-whatsapp">Enviar WhatsApp</label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="form-footer">
                    <button type="button" className="btn-secondary" onClick={handlePrevStep}>
                      <ChevronDown size={18} className="rotate-90" />
                      Voltar
                    </button>
                    <button type="submit" className="btn-primary">
                      <Check size={18} />
                      Salvar Cliente
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {showEditModal && selectedClient && (
        <div className="modal-overlay profile-modal" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Perfil do Cliente</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </button>
            </div>

            {/* Profile Header */}
            <div className="profile-header">
              <div className="profile-avatar">{getInitials(selectedClient.nome, selectedClient.sobrenome)}</div>
              <div className="profile-info">
                <h3>
                  {selectedClient.nome} {selectedClient.sobrenome}
                </h3>
                <div className="profile-meta">
                  <div className="profile-meta-item">
                    <Phone size={16} />
                    <span>{selectedClient.telefone || "Não informado"}</span>
                  </div>
                  <div className="profile-meta-item">
                    <Mail size={16} />
                    <span>{selectedClient.email || "Não informado"}</span>
                  </div>
                  <div className="profile-meta-item">
                    <Calendar size={16} />
                    <span>Cliente desde {formatDate(selectedClient.dataCriacao)}</span>
                  </div>
                </div>
                <div className="profile-status active">
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "currentColor" }}></div>
                  Ativo
                </div>
              </div>
            </div>

            <form onSubmit={handleUpdateClient}>
              <div className="modal-body">
                <div className="form-section">
                  <h3>
                    <User size={20} />
                    Informações Básicas
                  </h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="edit-name">
                        <User size={16} />
                        Nome*
                      </label>
                      <input
                        type="text"
                        id="edit-name"
                        placeholder="Nome do cliente"
                        required
                        value={editFormData.nome || ""}
                        onChange={(e) => setEditFormData({ ...editFormData, nome: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="edit-surname">
                        <User size={16} />
                        Sobrenome
                      </label>
                      <input
                        type="text"
                        id="edit-surname"
                        placeholder="Sobrenome do cliente"
                        value={editFormData.sobrenome || ""}
                        onChange={(e) => setEditFormData({ ...editFormData, sobrenome: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="edit-cpf">
                        <User size={16} />
                        CPF
                      </label>
                      <input
                        type="text"
                        id="edit-cpf"
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
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="edit-birthdate">
                        <Calendar size={16} />
                        Data de Nascimento
                      </label>
                      <input
                        type="date"
                        id="edit-birthdate"
                        value={editFormData.dataNascimento || ""}
                        onChange={(e) => setEditFormData({ ...editFormData, dataNascimento: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>
                      <Calendar size={16} />
                      Agendamento Online
                    </label>
                    <div className="toggle-switch">
                      <input
                        type="checkbox"
                        id="edit-online-scheduling"
                        checked={editFormData.agendamentoOnline || false}
                        onChange={(e) => setEditFormData({ ...editFormData, agendamentoOnline: e.target.checked })}
                      />
                      <label htmlFor="edit-online-scheduling"></label>
                      <span>{editFormData.agendamentoOnline ? "Habilitado" : "Desabilitado"}</span>
                    </div>
                    <p className="form-help">Este cliente poderá marcar agendamentos online.</p>
                  </div>
                </div>

                <div className="form-section">
                  <h3>
                    <Phone size={20} />
                    Informações de Contato
                  </h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="edit-phone">
                        <Phone size={16} />
                        Telefone*
                      </label>
                      <input
                        type="tel"
                        id="edit-phone"
                        placeholder="(00) 00000-0000"
                        required
                        value={editFormData.telefone || ""}
                        onChange={(e) => setEditFormData({ ...editFormData, telefone: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="edit-whatsapp">
                        <Phone size={16} />
                        WhatsApp
                      </label>
                      <input
                        type="tel"
                        id="edit-whatsapp"
                        placeholder="(00) 00000-0000"
                        value={editFormData.whatsapp || ""}
                        onChange={(e) => setEditFormData({ ...editFormData, whatsapp: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-email">
                      <Mail size={16} />
                      E-mail
                    </label>
                    <input
                      type="email"
                      id="edit-email"
                      placeholder="email@exemplo.com"
                      value={editFormData.email || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-instagram">
                      <Instagram size={16} />
                      Instagram
                    </label>
                    <input
                      type="text"
                      id="edit-instagram"
                      placeholder="@usuario"
                      value={editFormData.instagram || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, instagram: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-section">
                  <h3>
                    <MapPin size={20} />
                    Endereço
                  </h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="edit-cep">
                        <MapPin size={16} />
                        CEP
                      </label>
                      <input
                        type="text"
                        id="edit-cep"
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
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="edit-city">
                        <MapPin size={16} />
                        Cidade
                      </label>
                      <input
                        type="text"
                        id="edit-city"
                        placeholder="Cidade"
                        value={editFormData.cidade || ""}
                        onChange={(e) => setEditFormData({ ...editFormData, cidade: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="edit-street">
                        <MapPin size={16} />
                        Rua
                      </label>
                      <input
                        type="text"
                        id="edit-street"
                        placeholder="Rua, Avenida, etc"
                        value={editFormData.rua || ""}
                        onChange={(e) => setEditFormData({ ...editFormData, rua: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="edit-number">
                        <MapPin size={16} />
                        Número
                      </label>
                      <input
                        type="text"
                        id="edit-number"
                        placeholder="Número"
                        value={editFormData.numeroCasa || ""}
                        onChange={(e) => setEditFormData({ ...editFormData, numeroCasa: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-complement">
                      <MapPin size={16} />
                      Complemento
                    </label>
                    <input
                      type="text"
                      id="edit-complement"
                      placeholder="Apartamento, bloco, etc"
                      value={editFormData.complementoCasa || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, complementoCasa: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-section">
                  <h3>
                    <Tag size={20} />
                    Preferências e Detalhes
                  </h3>
                  <div className="form-group">
                    <label htmlFor="edit-referral">
                      <User size={16} />
                      Como Conheceu
                    </label>
                    <div className="select-wrapper">
                      <select
                        id="edit-referral"
                        value={editFormData.comoConheceu || ""}
                        onChange={(e) => setEditFormData({ ...editFormData, comoConheceu: e.target.value })}
                      >
                        <option value="">Selecione uma opção</option>
                        <option value="indicacao">Indicação</option>
                        <option value="redes-sociais">Redes Sociais</option>
                        <option value="google">Google</option>
                        <option value="passagem">Passagem</option>
                        <option value="outro">Outro</option>
                      </select>
                      <ChevronDown size={18} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>
                      <Tag size={16} />
                      Tags
                    </label>
                    <div className="tags-container">
                      {editFormData.tags &&
                        Array.isArray(editFormData.tags) &&
                        editFormData.tags.map((tag: string, index: number) => (
                          <span key={index} className="tag">
                            {tag}
                            <X
                              size={12}
                              style={{ cursor: "pointer" }}
                              onClick={() => {
                                setEditFormData({
                                  ...editFormData,
                                  tags: editFormData.tags.filter((t: string) => t !== tag),
                                })
                              }}
                            />
                          </span>
                        ))}
                      <input
                        type="text"
                        placeholder="+ Nova Tag"
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
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-notes">
                      <Edit size={16} />
                      Anotações Importantes
                    </label>
                    <textarea
                      id="edit-notes"
                      placeholder="Adicione informações importantes sobre o cliente, como alergias, preferências, etc."
                      rows={4}
                      value={editFormData.anotacoesImportantes || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, anotacoesImportantes: e.target.value })}
                    ></textarea>
                  </div>
                </div>

                {/* Informações do Cadastro */}
                <div className="form-section">
                  <h3>
                    <Clock size={20} />
                    Detalhes do Cadastro
                  </h3>
                  <div className="info-display">
                    <p>
                      <strong>Cadastrado por:</strong> {editFormData.cadastradoPor || "N/A"}
                    </p>
                    <p>
                      <strong>Data de Cadastro:</strong> {formatDate(editFormData.dataCriacao) || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="form-footer">
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
    </div>
  )
}
