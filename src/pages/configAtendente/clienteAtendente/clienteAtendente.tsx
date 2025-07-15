"use client"

import type React from "react"
import { useState, useEffect } from "react"
import "./clienteAtendente.css"
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
      const clientDocRef = doc(firestore, "clienteAtendente", clientId)
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
      const clientDocRef = doc(firestore, "clienteAtendente", selectedClient.id)
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

  const getInitials = (name: string, surname: string) => {
    if (!name) return "?"
    const firstInitial = name.charAt(0).toUpperCase()
    const secondInitial = surname ? surname.charAt(0).toUpperCase() : ""
    return secondInitial ? `${firstInitial}${secondInitial}` : firstInitial
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
    } else {
      setEditFormData({})
    }
  }, [selectedClient])

  return (
    <div className="atendente-cliente-container">
      {/* Header */}
      <div className="atendente-cliente-header">
        <div className="atendente-header-title">
          <h1>Clientes</h1>
          <p>Gerencie seus clientes e histórico de atendimentos</p>
        </div>
        <div className="atendente-header-actions">
          <button className="atendente-btn-secondary" onClick={() => setShowFilters(!showFilters)}>
            <Filter size={18} />
            Filtros
          </button>
          <button className="atendente-btn-primary" onClick={handleOpenModal}>
            <UserPlus size={18} />
            Cadastrar Cliente
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="atendente-filters-container">
          <div className="atendente-filter-group">
            <label>Status</label>
            <div className="atendente-filter-options">
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
          <div className="atendente-filter-group">
            <label>Tags</label>
            <div className="atendente-filter-tags">
              <span
                className={selectedTags.includes("VIP") ? "atendente-tag active" : "atendente-tag"}
                onClick={() => toggleTag("VIP")}
              >
                VIP
              </span>
              <span
                className={selectedTags.includes("Novo") ? "atendente-tag active" : "atendente-tag"}
                onClick={() => toggleTag("Novo")}
              >
                Novo
              </span>
              <span
                className={selectedTags.includes("Cabelo") ? "atendente-tag active" : "atendente-tag"}
                onClick={() => toggleTag("Cabelo")}
              >
                Cabelo
              </span>
              <span
                className={selectedTags.includes("Manicure") ? "atendente-tag active" : "atendente-tag"}
                onClick={() => toggleTag("Manicure")}
              >
                Manicure
              </span>
              <span
                className={selectedTags.includes("Barba") ? "atendente-tag active" : "atendente-tag"}
                onClick={() => toggleTag("Barba")}
              >
                Barba
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="atendente-search-container">
        <div className="atendente-search-input">
          <Search size={20} className="atendente-search-icon" />
          <input
            type="text"
            placeholder="Buscar por nome"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="atendente-clear-search" onClick={() => setSearchQuery("")}>
              <X size={16} />
            </button>
          )}
        </div>
        <div className="atendente-search-results">
          {filteredClients && filteredClients.length > 0 ? (
            <div className="atendente-results-count">
              <span>{filteredClients.length} cliente(s) encontrado(s)</span>
            </div>
          ) : filteredClients && filteredClients.length === 0 && searchQuery ? (
            <div className="atendente-empty-state">
              <Users size={48} />
              <h3>Nenhum cliente encontrado para sua busca</h3>
              <p>Tente ajustar sua busca ou cadastre um novo cliente</p>
              <button className="atendente-btn-primary" onClick={handleOpenModal}>
                <UserPlus size={18} />
                Cadastrar Cliente
              </button>
            </div>
          ) : filteredClients && filteredClients.length === 0 && !searchQuery ? (
            <div className="atendente-empty-state">
              <Users size={48} />
              <h3>Nenhum cliente cadastrado</h3>
              <p>Cadastre seu primeiro cliente para começar!</p>
              <button className="atendente-btn-primary" onClick={handleOpenModal}>
                <UserPlus size={18} />
                Cadastrar Cliente
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Client List */}
      {Array.isArray(filteredClients) && filteredClients.length > 0 && (
        <div className="atendente-client-list">
          {filteredClients.map((client) => (
            <div key={client.id} className="atendente-client-card">
              <div className="atendente-client-info-principal">
                <h3>
                  {client.nome} {client.sobrenome}
                </h3>

                <p>
                  <strong>Telefone:</strong>
                  <Phone size={16} style={{ marginRight: "6px", color: "var(--atendente-primary)" }} />
                  {client.telefone || "Não informado"}
                </p>

                <p>
                  <strong>Email:</strong>
                  {client.email || "Não informado"}
                </p>

                <p>
                  <strong>CPF:</strong>
                  <User size={16} style={{ marginRight: "6px", color: "var(--atendente-primary)" }} />
                  {client.cpf || "Não informado"}
                </p>

                {client.cidade && (
                  <p>
                    <strong>Endereço:</strong>
                    <MapPin size={16} style={{ marginRight: "6px", color: "var(--atendente-primary)" }} />
                    {client.cidade}
                  </p>
                )}

                {client.dataCriacao && (
                  <p>
                    <strong>Cadastro:</strong>
                    {formatDate(client.dataCriacao)}
                  </p>
                )}

                {client.tags && client.tags.length > 0 && (
                  <div className="atendente-client-tags">
                    <Tag size={16} style={{ color: "var(--atendente-primary)", marginRight: "8px" }} />
                    {client.tags.map((tag: string, index: number) => (
                      <span key={index} className="atendente-tag">
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

              <div className="atendente-client-actions">
                <button className="atendente-btn-icon" onClick={() => handleDeleteClient(client.id)}>
                  <Trash2 size={18} color="#ef4444" />
                </button>
                <button className="atendente-btn-icon">
                  <Phone size={18} />
                </button>
                <button
                  className="atendente-btn-secondary"
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
        <div className="atendente-modal-overlay" onClick={handleCloseModal}>
          <div className="atendente-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="atendente-modal-header">
              <button className="atendente-modal-back" onClick={formStep > 1 ? handlePrevStep : handleCloseModal}>
                <ArrowLeft size={20} />
              </button>
              <h2>
                {formStep === 1 && "Novo Cliente"}
                {formStep === 2 && "Informações de Contato"}
                {formStep === 3 && "Preferências e Detalhes"}
              </h2>
              <div className="atendente-modal-steps">
                <div className={`atendente-step ${formStep >= 1 ? "active" : ""}`}>1</div>
                <div className="atendente-step-line"></div>
                <div className={`atendente-step ${formStep >= 2 ? "active" : ""}`}>2</div>
                <div className="atendente-step-line"></div>
                <div className={`atendente-step ${formStep >= 3 ? "active" : ""}`}>3</div>
              </div>
              <button className="atendente-modal-close" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Step 1: Basic Information */}
              {formStep === 1 && (
                <div className="atendente-modal-body">
                  <div className="atendente-form-row">
                    <div className="atendente-form-group">
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
                    <div className="atendente-form-group">
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

                  <div className="atendente-form-row">
                    <div className="atendente-form-group">
                      <label htmlFor="cpf">CPF</label>
                      <input
                        type="text"
                        id="cpf"
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
                    </div>
                    <div className="atendente-form-group">
                      <label htmlFor="birthdate">Data de Nascimento</label>
                      <input
                        type="date"
                        id="birthdate"
                        value={dataNascimentoClinte}
                        onChange={(e) => setDataNascimentoCliente(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="atendente-form-group">
                    <label>Agendamento Online</label>
                    <div className="atendente-toggle-switch">
                      <input
                        type="checkbox"
                        id="online-scheduling"
                        checked={agendamentoOnline}
                        onChange={(e) => setAgendamentoOnline(e.target.checked)}
                      />
                      <label htmlFor="online-scheduling"></label>
                      <span>{agendamentoOnline ? "Habilitado" : "Desabilitado"}</span>
                    </div>
                    <p className="atendente-form-help">Este cliente poderá marcar agendamentos online.</p>
                  </div>

                  <div className="atendente-form-footer">
                    <button type="button" className="atendente-btn-secondary" onClick={handleCloseModal}>
                      Cancelar
                    </button>
                    <button type="button" className="atendente-btn-primary" onClick={handleNextStep}>
                      Próximo
                      <ChevronDown size={18} className="atendente-rotate-270" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Contact Information */}
              {formStep === 2 && (
                <div className="atendente-modal-body">
                  <div className="atendente-form-section">
                    <h3>Informações de Contato</h3>

                    <div className="atendente-form-row">
                      <div className="atendente-form-group">
                        <label htmlFor="phone">Telefone*</label>
                        <div className="atendente-input-with-icon">
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
                      <div className="atendente-form-group">
                        <label htmlFor="whatsapp">WhatsApp</label>
                        <div className="atendente-input-with-icon">
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

                    <div className="atendente-form-group">
                      <label htmlFor="email">E-mail</label>
                      <div className="atendente-input-with-icon">
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

                    <div className="atendente-form-group">
                      <label htmlFor="instagram">Instagram</label>
                      <div className="atendente-input-with-icon">
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

                  <div className="atendente-form-section">
                    <h3>Endereço</h3>

                    <div className="atendente-form-row">
                      <div className="atendente-form-group">
                        <label htmlFor="cep">CEP</label>
                        <input
                          type="text"
                          id="cep"
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
                      </div>
                      <div className="atendente-form-group">
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

                    <div className="atendente-form-row">
                      <div className="atendente-form-group">
                        <label htmlFor="street">Rua</label>
                        <input
                          type="text"
                          id="street"
                          placeholder="Rua, Avenida, etc"
                          value={ruaClinte}
                          onChange={(e) => setRuaCliente(e.target.value)}
                        />
                      </div>
                      <div className="atendente-form-group">
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

                    <div className="atendente-form-group">
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

                  <div className="atendente-form-footer">
                    <button type="button" className="atendente-btn-secondary" onClick={handlePrevStep}>
                      <ChevronDown size={18} className="atendente-rotate-90" />
                      Voltar
                    </button>
                    <button type="button" className="atendente-btn-primary" onClick={handleNextStep}>
                      Próximo
                      <ChevronDown size={18} className="atendente-rotate-270" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Preferences and Details */}
              {formStep === 3 && (
                <div className="atendente-modal-body">
                  <div className="atendente-form-section">
                    <h3>Preferências e Detalhes</h3>

                    <div className="atendente-form-group">
                      <label htmlFor="referral">Como Conheceu</label>
                      <div className="atendente-select-wrapper">
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

                    <div className="atendente-form-group">
                      <label>Tags</label>
                      <div className="atendente-tags-container">
                        <span
                          className={selectedTags.includes("VIP") ? "atendente-tag active" : "atendente-tag"}
                          onClick={() => toggleTag("VIP")}
                        >
                          VIP
                        </span>
                        <span
                          className={selectedTags.includes("Novo") ? "atendente-tag active" : "atendente-tag"}
                          onClick={() => toggleTag("Novo")}
                        >
                          Novo
                        </span>
                        <span
                          className={selectedTags.includes("Cabelo") ? "atendente-tag active" : "atendente-tag"}
                          onClick={() => toggleTag("Cabelo")}
                        >
                          Cabelo
                        </span>
                        <span
                          className={selectedTags.includes("Manicure") ? "atendente-tag active" : "atendente-tag"}
                          onClick={() => toggleTag("Manicure")}
                        >
                          Manicure
                        </span>
                        <span
                          className={selectedTags.includes("Barba") ? "atendente-tag active" : "atendente-tag"}
                          onClick={() => toggleTag("Barba")}
                        >
                          Barba
                        </span>
                        <span className="atendente-tag atendente-add-tag">+ Nova Tag</span>
                      </div>
                    </div>

                    <div className="atendente-form-group">
                      <label htmlFor="notes">Anotações Importantes</label>
                      <textarea
                        id="notes"
                        placeholder="Adicione informações importantes sobre o cliente, como alergias, preferências, etc."
                        rows={4}
                        value={anotacoesImportantes}
                        onChange={(e) => setAnotacoesImportantes(e.target.value)}
                      ></textarea>
                    </div>

                    <div className="atendente-form-group">
                      <label>Notificações</label>
                      <div className="atendente-checkbox-group">
                        <div className="atendente-checkbox-item">
                          <input type="checkbox" id="notify-sms" />
                          <label htmlFor="notify-sms">Enviar SMS</label>
                        </div>
                        <div className="atendente-checkbox-item">
                          <input type="checkbox" id="notify-email" />
                          <label htmlFor="notify-email">Enviar E-mail</label>
                        </div>
                        <div className="atendente-checkbox-item">
                          <input type="checkbox" id="notify-whatsapp" />
                          <label htmlFor="notify-whatsapp">Enviar WhatsApp</label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="atendente-form-footer">
                    <button type="button" className="atendente-btn-secondary" onClick={handlePrevStep}>
                      <ChevronDown size={18} className="atendente-rotate-90" />
                      Voltar
                    </button>
                    <button type="submit" className="atendente-btn-primary">
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
        <div className="atendente-modal-overlay atendente-profile-modal" onClick={() => setShowEditModal(false)}>
          <div className="atendente-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="atendente-modal-header">
              <h2>Perfil do Cliente</h2>
              <button className="atendente-modal-close" onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="atendente-profile-header">
              <div className="atendente-profile-avatar">
                {getInitials(selectedClient.nome, selectedClient.sobrenome)}
              </div>
              <div className="atendente-profile-info">
                <h3>
                  {selectedClient.nome} {selectedClient.sobrenome}
                </h3>
                <div className="atendente-profile-meta">
                  <div className="atendente-profile-meta-item">
                    <Phone size={16} />
                    <span>{selectedClient.telefone || "Não informado"}</span>
                  </div>
                  <div className="atendente-profile-meta-item">
                    <Mail size={16} />
                    <span>{selectedClient.email || "Não informado"}</span>
                  </div>
                  <div className="atendente-profile-meta-item">
                    <Calendar size={16} />
                    <span>Cliente desde {formatDate(selectedClient.dataCriacao)}</span>
                  </div>
                </div>
                <div className="atendente-profile-status active">
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "currentColor" }}></div>
                  Ativo
                </div>
              </div>
            </div>

            <form onSubmit={handleUpdateClient}>
              <div className="atendente-modal-body">
                <div className="atendente-form-section">
                  <h3>
                    <User size={20} />
                    Informações Básicas
                  </h3>
                  <div className="atendente-form-row">
                    <div className="atendente-form-group">
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
                    <div className="atendente-form-group">
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
                  <div className="atendente-form-row">
                    <div className="atendente-form-group">
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
                    <div className="atendente-form-group">
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
                  <div className="atendente-form-group">
                    <label>
                      <Calendar size={16} />
                      Agendamento Online
                    </label>
                    <div className="atendente-toggle-switch">
                      <input
                        type="checkbox"
                        id="edit-online-scheduling"
                        checked={editFormData.agendamentoOnline || false}
                        onChange={(e) => setEditFormData({ ...editFormData, agendamentoOnline: e.target.checked })}
                      />
                      <label htmlFor="edit-online-scheduling"></label>
                      <span>{editFormData.agendamentoOnline ? "Habilitado" : "Desabilitado"}</span>
                    </div>
                    <p className="atendente-form-help">Este cliente poderá marcar agendamentos online.</p>
                  </div>
                </div>

                <div className="atendente-form-section">
                  <h3>
                    <Phone size={20} />
                    Informações de Contato
                  </h3>
                  <div className="atendente-form-row">
                    <div className="atendente-form-group">
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
                    <div className="atendente-form-group">
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
                  <div className="atendente-form-group">
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
                  <div className="atendente-form-group">
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

                <div className="atendente-form-section">
                  <h3>
                    <MapPin size={20} />
                    Endereço
                  </h3>
                  <div className="atendente-form-row">
                    <div className="atendente-form-group">
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
                    <div className="atendente-form-group">
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
                  <div className="atendente-form-row">
                    <div className="atendente-form-group">
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
                    <div className="atendente-form-group">
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
                  <div className="atendente-form-group">
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

                <div className="atendente-form-section">
                  <h3>
                    <Tag size={20} />
                    Preferências e Detalhes
                  </h3>
                  <div className="atendente-form-group">
                    <label htmlFor="edit-referral">
                      <User size={16} />
                      Como Conheceu
                    </label>
                    <div className="atendente-select-wrapper">
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
                  <div className="atendente-form-group">
                    <label>
                      <Tag size={16} />
                      Tags
                    </label>
                    <div className="atendente-tags-container">
                      {editFormData.tags &&
                        Array.isArray(editFormData.tags) &&
                        editFormData.tags.map((tag: string, index: number) => (
                          <span key={index} className="atendente-tag">
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
                  <div className="atendente-form-group">
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

                <div className="atendente-form-section">
                  <h3>
                    <Clock size={20} />
                    Detalhes do Cadastro
                  </h3>
                  <div className="atendente-info-display">
                    <p>
                      <strong>Cadastrado por:</strong> {editFormData.cadastradoPor || "N/A"}
                    </p>
                    <p>
                      <strong>Data de Cadastro:</strong> {formatDate(editFormData.dataCriacao) || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="atendente-form-footer">
                <button type="button" className="atendente-btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="atendente-btn-primary">
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
