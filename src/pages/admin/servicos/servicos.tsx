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
} from "lucide-react"
import './servicos.css'
import { collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc, onSnapshot } from 'firebase/firestore'
import { firestore } from '../../../firebase/firebase'
import { getAuth } from "firebase/auth"

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

  // Form states
  const [nomeServico, setNomeServico] = useState("")
  const [descricaoServico, setDescricaoServico] = useState("")
  const [valorServico, setValorServico] = useState("")
  const [duracaoServico, setDuracaoServico] = useState("")
  const [categoriaServico, setCategoriaServico] = useState("")
  const [profissionaisSelecionados, setProfissionaisSelecionados] = useState<string[]>([])
  const [servicoAtivo, setServicoAtivo] = useState(true)

  const categorias = [
    { id: "cabelo", nome: "Cabelo", icon: Scissors, color: "#8b5cf6" },
    { id: "unha", nome: "Unhas", icon: Sparkles, color: "#ec4899" },
    { id: "estetica", nome: "Estética", icon: Palette, color: "#06b6d4" },
    { id: "barba", nome: "Barba", icon: User, color: "#f59e0b" },
  ]

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
  const servicosInativos = servicos.filter((s) => !s.servicoAtivo).length
  const valorMedio = servicos.reduce((sum, s) => sum + s.valorServico, 0) / (servicos.length || 1)

  if (!auth.currentUser) {
    return <div>Você precisa estar logado para acessar esta página.</div>
  }

  return (
    <div className="servicos-container">
      {/* Header */}
      <div className="servicos-header">
        <div className="header-title">
          <h1>Gestão de Serviços</h1>
          <p>Gerencie o catálogo de serviços oferecidos</p>
        </div>
        <div className="header-actions">
          <button className="btn-action filter" onClick={() => setShowFilters(!showFilters)}>
            <div className="btn-icon-wrapper">
              <Filter size={18} />
            </div>
            <span className="btn-text">Filtros</span>
            <div className="btn-badge">
              {Object.values({ filterCategoria, filterStatus, filterProfissional }).filter((f) => f !== "all").length ||
                ""}
            </div>
          </button>

          <button className="btn-action primary" onClick={handleOpenModal}>
            <div className="btn-icon-wrapper">
              <Plus size={18} />
            </div>
            <span className="btn-text">Novo Serviço</span>
            <div className="btn-shine"></div>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-header">
            <div className="stat-icon">
              <Scissors size={24} />
            </div>
            <span className="stat-change positive">+{((servicosAtivos / totalServicos) * 100).toFixed(0)}%</span>
          </div>
          <div className="stat-content">
            <h3>{totalServicos}</h3>
            <p>Total de Serviços</p>
            <small style={{ color: "var(--text-light)", fontSize: "12px" }}>
              {servicosAtivos} ativos, {servicosInativos} inativos
            </small>
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-header">
            <div className="stat-icon">
              <DollarSign size={24} />
            </div>
          </div>
          <div className="stat-content">
            <h3>{formatCurrency(valorMedio)}</h3>
            <p>Valor Médio</p>
          </div>
        </div>

        <div className="stat-card purple">
          <div className="stat-header">
            <div className="stat-icon">
              <Users size={24} />
            </div>
          </div>
          <div className="stat-content">
            <h3>{colaboradores.length}</h3>
            <p>Profissionais</p>
          </div>
        </div>

        <div className="stat-card orange">
          <div className="stat-header">
            <div className="stat-icon">
              <Scissors size={24} />
            </div>
          </div>
          <div className="stat-content">
            <h3>{categorias.length}</h3>
            <p>Categorias</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="filters-container">
          <div className="filter-group">
            <label>Categoria</label>
            <div className="filter-options">
              <button className={filterCategoria === "all" ? "active" : ""} onClick={() => setFilterCategoria("all")}>
                Todas
              </button>
              {categorias.map((cat) => (
                <button
                  key={cat.id}
                  className={filterCategoria === cat.id ? "active" : ""}
                  onClick={() => setFilterCategoria(cat.id)}
                >
                  {(() => {
                    const IconComponent = cat.icon
                    return IconComponent ? <IconComponent size={14} /> : null
                  })()}
                  {cat.nome}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <label>Status</label>
            <div className="filter-options">
              <button className={filterStatus === "all" ? "active" : ""} onClick={() => setFilterStatus("all")}>
                Todos
              </button>
              <button className={filterStatus === "ativo" ? "active" : ""} onClick={() => setFilterStatus("ativo")}>
                Ativos
              </button>
              <button className={filterStatus === "inativo" ? "active" : ""} onClick={() => setFilterStatus("inativo")}>
                Inativos
              </button>
            </div>
          </div>
          <div className="filter-group">
            <label>Profissional</label>
            <div className="filter-options">
              <button
                className={filterProfissional === "all" ? "active" : ""}
                onClick={() => setFilterProfissional("all")}
              >
                Todos
              </button>
              {colaboradores.map((colab) => (
                <button
                  key={colab.id}
                  className={filterProfissional === colab.nome ? "active" : ""}
                  onClick={() => setFilterProfissional(colab.nome)}
                >
                  {colab.nome}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search and View Toggle */}
      <div className="search-container">
        <div className="search-input">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por nome ou descrição..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search" onClick={() => setSearchQuery("")}>
              <X size={16} />
            </button>
          )}
        </div>
        <div className="view-toggle">
          <button className={`view-btn ${viewMode === "grid" ? "active" : ""}`} onClick={() => setViewMode("grid")}>
            <div className="grid-icon"></div>
          </button>
          <button className={`view-btn ${viewMode === "list" ? "active" : ""}`} onClick={() => setViewMode("list")}>
            <div className="list-icon"></div>
          </button>
        </div>
        <div className="search-results">
          {filteredServicos.length > 0 ? (
            <div className="results-count">
              <span>{filteredServicos.length} serviço(s) encontrado(s)</span>
            </div>
          ) : (
            <div className="empty-state">
              <Scissors size={48} />
              <h3>Nenhum serviço encontrado</h3>
              <p>Cadastre seu primeiro serviço para começar!</p>
              <button className="btn-primary" onClick={handleOpenModal}>
                <Plus size={18} />
                Novo Serviço
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Services List */}
      {filteredServicos.length > 0 && (
        <div className={`servicos-list ${viewMode}`}>
          {filteredServicos.map((servico) => {
            const categoriaInfo = getCategoriaInfo(servico.categoriaServico)
            return (
              <div key={servico.id} className={`servico-card ${!servico.servicoAtivo ? "inactive" : ""}`}>
                <div className="servico-image">
                  <div className="servico-placeholder" style={{ backgroundColor: categoriaInfo.color }}>
                    {categoriaInfo.icon &&
                      (() => {
                        const IconComponent = categoriaInfo.icon
                        return IconComponent ? <IconComponent size={32} color="white" /> : null
                      })()}
                  </div>
                  <div className="servico-category">
                    {categoriaInfo.icon &&
                      (() => {
                        const IconComponent = categoriaInfo.icon
                        return IconComponent ? <IconComponent size={14} /> : null
                      })()}
                    <span>{categoriaInfo.nome}</span>
                  </div>
                </div>

                <div className="servico-info">
                  <div className="servico-header">
                    <h3>{servico.nomeServico}</h3>
                    <div className="servico-status">
                      <button
                        className={`status-toggle ${servico.servicoAtivo ? "active" : ""}`}
                        onClick={() => handleToggleStatus(servico.id)}
                      >
                        {servico.servicoAtivo ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                      </button>
                    </div>
                  </div>

                  <p className="servico-description">{servico.descricaoServico}</p>

                  <div className="servico-details">
                    <div className="detail-item">
                      <DollarSign size={16} />
                      <span className="price">{formatCurrency(servico.valorServico)}</span>
                    </div>
                    <div className="detail-item">
                      <Clock size={16} />
                      <span>{formatDuration(servico.duracaoServico)}</span>
                    </div>
                    <div className="detail-item">
                      <Users size={16} />
                      <span>{servico.profissionaisServico.length} profissionais</span>
                    </div>
                  </div>

                  <div className="servico-profissionais">
                    <span className="label">Profissionais:</span>
                    <div className="profissionais-list">
                      {servico.profissionaisServico.map((prof, index) => (
                        <span key={index} className="profissional-tag">
                          {prof}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="servico-actions">
                  <button className="btn-icon" onClick={() => handleDeleteServico(servico.id)}>
                    <Trash2 size={18} color="#ef4444" />
                  </button>
                  <button className="btn-icon" onClick={() => handleEditServico(servico)}>
                    <Edit size={18} />
                  </button>
                  <button className="btn-icon" onClick={() => handleViewServico(servico)}>
                    <Eye size={18} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* View Service Modal */}
      {showViewModal && selectedServico && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detalhes do Serviço</h2>
              <button className="modal-close" onClick={() => setShowViewModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="servico-details-view">
                <div className="detail-section">
                  <div className="service-image-large">
                    <div
                      className="service-placeholder-large"
                      style={{ backgroundColor: getCategoriaInfo(selectedServico.categoriaServico).color }}
                    >
                      {(() => {
                        const IconComponent = getCategoriaInfo(selectedServico.categoriaServico).icon
                        return IconComponent ? <IconComponent size={48} color="white" /> : null
                      })()}
                    </div>
                  </div>

                  <div className="service-info-large">
                    <h3>{selectedServico.nomeServico}</h3>
                    <p className="service-description-large">{selectedServico.descricaoServico}</p>

                    <div className="service-stats">
                      <div className="stat-item">
                        <DollarSign size={20} />
                        <div>
                          <span className="stat-value">{formatCurrency(selectedServico.valorServico)}</span>
                          <span className="stat-label">Valor</span>
                        </div>
                      </div>
                      <div className="stat-item">
                        <Clock size={20} />
                        <div>
                          <span className="stat-value">{formatDuration(selectedServico.duracaoServico)}</span>
                          <span className="stat-label">Duração</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Profissionais Habilitados</h4>
                  <div className="profissionais-grid">
                    {selectedServico.profissionaisServico.map((prof, index) => (
                      <div key={index} className="profissional-card">
                        <div className="profissional-avatar">
                          <User size={20} />
                        </div>
                        <span>{prof}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Informações Adicionais</h4>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">Categoria:</span>
                      <span className="info-value">{getCategoriaInfo(selectedServico.categoriaServico).nome}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Status:</span>
                      <span className={`info-value ${selectedServico.servicoAtivo ? "active" : "inactive"}`}>
                        {selectedServico.servicoAtivo ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowViewModal(false)}>
                Fechar
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  setShowViewModal(false)
                  handleEditServico(selectedServico)
                }}
              >
                <Edit size={18} />
                Editar Serviço
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {showEditModal && selectedServico && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Editar Serviço</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateServico}>
              <div className="modal-body">
                <div className="form-section">
                  <div className="form-group">
                    <label htmlFor="nome">Nome do Serviço*</label>
                    <input
                      type="text"
                      id="nome"
                      required
                      value={nomeServico}
                      onChange={(e) => setNomeServico(e.target.value)}
                      placeholder="Ex: Corte Masculino"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="descricao">Descrição</label>
                    <textarea
                      id="descricao"
                      value={descricaoServico}
                      onChange={(e) => setDescricaoServico(e.target.value)}
                      placeholder="Breve descrição do serviço..."
                      rows={3}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="valor">Valor (R$)*</label>
                      <input
                        type="number"
                        id="valor"
                        step="0.01"
                        min="0"
                        required
                        value={valorServico}
                        onChange={(e) => setValorServico(e.target.value)}
                        placeholder="0,00"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="duracao">Duração (minutos)*</label>
                      <input
                        type="number"
                        id="duracao"
                        min="1"
                        required
                        value={duracaoServico}
                        onChange={(e) => setDuracaoServico(e.target.value)}
                        placeholder="30"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="categoria">Categoria*</label>
                    <div className="select-wrapper">
                      <select
                        id="categoria"
                        required
                        value={categoriaServico}
                        onChange={(e) => setCategoriaServico(e.target.value)}
                      >
                        <option value="">Selecione uma categoria</option>
                        {categorias.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.nome}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={18} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Profissionais Habilitados*</label>
                    <p className="form-help">Selecione quais profissionais podem executar este serviço</p>
                    <div className="profissionais-selection">
                      {colaboradores.length > 0 ? (
                        colaboradores.map((colab) => (
                          <label key={colab.id} className="checkbox-item">
                            <input
                              type="checkbox"
                              checked={profissionaisSelecionados.includes(colab.nome)}
                              onChange={() => handleProfissionalToggle(colab.nome)}
                            />
                            <span className="checkmark"></span>
                            {colab.nome}
                          </label>
                        ))
                      ) : (
                        <p className="no-professionals">Nenhum profissional encontrado. Cadastre um profissional primeiro.</p>
                      )}
                    </div>
                    {profissionaisSelecionados.length === 0 && (
                      <small style={{ color: "var(--error)", fontSize: "12px" }}>
                        Selecione pelo menos um profissional
                      </small>
                    )}
                  </div>

                  <div className="form-group">
                    <div className="checkbox-group">
                      <input
                        type="checkbox"
                        id="ativo"
                        checked={servicoAtivo}
                        onChange={(e) => setServicoAtivo(e.target.checked)}
                      />
                      <label htmlFor="ativo">Serviço ativo</label>
                    </div>
                    <small style={{ color: "var(--text-secondary)", fontSize: "12px" }}>
                      Serviços inativos não aparecem para agendamento
                    </small>
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

      {/* Add Service Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <button className="modal-back" onClick={formStep > 1 ? handlePrevStep : handleCloseModal}>
                <ArrowLeft size={20} />
              </button>
              <h2>
                {formStep === 1 && "Novo Serviço"}
                {formStep === 2 && "Configurações"}
                {formStep === 3 && "Finalizar"}
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
                      <label htmlFor="nome">Nome do Serviço*</label>
                      <input
                        type="text"
                        id="nome"
                        placeholder="Ex: Corte Masculino, Unha em Gel..."
                        required
                        value={nomeServico}
                        onChange={(e) => setNomeServico(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="descricao">Descrição</label>
                      <textarea
                        id="descricao"
                        placeholder="Breve descrição do serviço oferecido..."
                        rows={4}
                        value={descricaoServico}
                        onChange={(e) => setDescricaoServico(e.target.value)}
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="valor">Valor (R$)*</label>
                        <input
                          type="number"
                          id="valor"
                          placeholder="0,00"
                          step="0.01"
                          min="0"
                          required
                          value={valorServico}
                          onChange={(e) => setValorServico(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="duracao">Duração (minutos)*</label>
                        <input
                          type="number"
                          id="duracao"
                          placeholder="30"
                          min="1"
                          required
                          value={duracaoServico}
                          onChange={(e) => setDuracaoServico(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="categoria">Categoria*</label>
                      <div className="select-wrapper">
                        <select
                          id="categoria"
                          required
                          value={categoriaServico}
                          onChange={(e) => setCategoriaServico(e.target.value)}
                        >
                          <option value="">Selecione uma categoria</option>
                          {categorias.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.nome}
                            </option>
                          ))}
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

              {/* Step 2: Professionals and Settings */}
              {formStep === 2 && (
                <div className="modal-body">
                  <div className="form-section">
                    <h3>Configurações do Serviço</h3>

                    <div className="form-group">
                      <label>Profissionais Habilitados*</label>
                      <p className="form-help">Selecione quais profissionais podem executar este serviço</p>
                      <div className="profissionais-selection">
                        {colaboradores.length > 0 ? (
                          colaboradores.map((colab) => (
                            <label key={colab.id} className="checkbox-item">
                              <input
                                type="checkbox"
                                checked={profissionaisSelecionados.includes(colab.nome)}
                                onChange={() => handleProfissionalToggle(colab.nome)}
                              />
                              <span className="checkmark"></span>
                              {colab.nome}
                            </label>
                          ))
                        ) : (
                          <p className="no-professionals">Nenhum profissional encontrado. Cadastre um profissional primeiro.</p>
                        )}
                      </div>
                      {profissionaisSelecionados.length === 0 && (
                        <small style={{ color: "var(--error)", fontSize: "12px" }}>
                          Selecione pelo menos um profissional
                        </small>
                      )}
                    </div>

                    <div className="form-group">
                      <div className="checkbox-group">
                        <input
                          type="checkbox"
                          id="ativo"
                          checked={servicoAtivo}
                          onChange={(e) => setServicoAtivo(e.target.checked)}
                        />
                        <label htmlFor="ativo">Serviço ativo</label>
                      </div>
                      <small style={{ color: "var(--text-secondary)", fontSize: "12px" }}>
                        Serviços inativos não aparecem para agendamento
                      </small>
                    </div>
                  </div>

                  <div className="form-footer">
                    <button type="button" className="btn-secondary" onClick={handlePrevStep}>
                      <ChevronDown size={18} className="rotate-90" />
                      Voltar
                    </button>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleNextStep}
                      disabled={profissionaisSelecionados.length === 0}
                    >
                      Próximo
                      <ChevronDown size={18} className="rotate-270" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Review */}
              {formStep === 3 && (
                <div className="modal-body">
                  <div className="form-section">
                    <h3>Revisar Informações</h3>

                    <div className="service-preview">
                      <div className="preview-image">
                        <div
                          className="preview-placeholder"
                          style={{ backgroundColor: getCategoriaInfo(categoriaServico).color }}
                        >
                          {(() => {
                            const IconComponent = getCategoriaInfo(categoriaServico).icon
                            return IconComponent ? <IconComponent size={32} color="white" /> : null
                          })()}
                        </div>
                      </div>

                      <div className="preview-info">
                        <h4>{nomeServico}</h4>
                        <p>{descricaoServico || "Sem descrição"}</p>

                        <div className="preview-details">
                          <div className="preview-item">
                            <DollarSign size={16} />
                            <span>{formatCurrency(Number.parseFloat(valorServico || "0"))}</span>
                          </div>
                          <div className="preview-item">
                            <Clock size={16} />
                            <span>{formatDuration(Number.parseInt(duracaoServico || "0"))}</span>
                          </div>
                          <div className="preview-item">
                            <Tag size={16} />
                            <span>{getCategoriaInfo(categoriaServico).nome}</span>
                          </div>
                        </div>

                        <div className="preview-profissionais">
                          <span className="preview-label">Profissionais:</span>
                          <div className="preview-tags">
                            {profissionaisSelecionados.map((prof, index) => (
                              <span key={index} className="preview-tag">
                                {prof}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="preview-status">
                          <span className={`status-indicator ${servicoAtivo ? "active" : "inactive"}`}>
                            {servicoAtivo ? "Ativo" : "Inativo"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {nomeEstabelecimento === "" && (
                    <div style={{ color: 'red', marginBottom: 8 }}>
                      O nome do estabelecimento não foi carregado. Aguarde ou recarregue a página.
                    </div>
                  )}
                  <div className="form-footer">
                    <button type="button" className="btn-secondary" onClick={handlePrevStep}>
                      <ChevronDown size={18} className="rotate-90" />
                      Voltar
                    </button>
                    <button type="submit" className="btn-primary" disabled={nomeEstabelecimento === ""}>
                      <Check size={18} />
                      Cadastrar Serviço
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Servicos
