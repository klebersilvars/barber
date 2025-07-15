import { useState, useEffect } from "react"
import {
  Calendar,
  Clock,
  Users,
  DollarSign,
  Plus,
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
  Scissors,
  Phone,
  Star,
  BarChart3,
  Zap,
  Play as PlayIcon,
} from "lucide-react"
import "./agendaProfissonal.css"
import { firestore } from '../../../firebase/firebase'
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, getDoc } from 'firebase/firestore'
import { getAuth } from "firebase/auth"
import { useNavigate } from "react-router-dom"

const AgendaProfissional = () => {
  const [currentView, setCurrentView] = useState("dashboard")
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showFilters, setShowFilters] = useState(false)

  // Modal states
  const [showAppointmentModal, setShowAppointmentModal] = useState(false)
  const [modalStep, setModalStep] = useState(1)
  const [appointmentData, setAppointmentData] = useState({
    clientId: "",
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    service: "",
    professional: "",
    date: "",
    time: "",
    duration: 60,
    price: 0,
    notes: "",
    paymentMethod: "",
    reminderEnabled: true,
  })

  // Services data
  const [servicosFirestore, setServicosFirestore] = useState<any[]>([])
  const [servicosLoading, setServicosLoading] = useState(true)
  const [clientes, setClientes] = useState<any[]>([])
  const [clientesLoading, setClientesLoading] = useState(true)
  const [agendamentos, setAgendamentos] = useState<any[]>([])
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [showDayModal, setShowDayModal] = useState(false)

  const auth = getAuth()
  const navigate = useNavigate()
  const [profissionalNome, setProfissionalNome] = useState("")
  const [estabelecimento, setEstabelecimento] = useState("")

  // Buscar nome do profissional logado
  useEffect(() => {
    if (!auth.currentUser?.uid) return
    
    const colaboradoresRef = collection(firestore, 'colaboradores')
    const q = query(colaboradoresRef, where('authUserId', '==', auth.currentUser.uid))
    
    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const colaboradorData = snapshot.docs[0].data()
        const nome = colaboradorData.nome || ""
        setProfissionalNome(nome)
        setEstabelecimento(colaboradorData.estabelecimento || "")
      }
    }, (error) => {
      console.error('Erro ao buscar nome do profissional:', error)
    })
    
    return () => unsub()
  }, [auth.currentUser])

  // Buscar clientes do Firestore pelo nome do estabelecimento
  useEffect(() => {
    if (!estabelecimento) return
    setClientesLoading(true)
    const clientesRef = collection(firestore, 'clienteUser')
    const q = query(clientesRef, where('estabelecimento', '==', estabelecimento))
    const unsub = onSnapshot(q, (snapshot) => {
      setClientes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      setClientesLoading(false)
    })
    return () => unsub()
  }, [estabelecimento])

  // Buscar serviços do Firestore pelo UID do profissional logado
  useEffect(() => {
    if (!auth.currentUser?.uid) return
    setServicosLoading(true)
    const servicosRef = collection(firestore, 'servicosAdmin')
    const q = query(servicosRef, where('profissionaisServico', 'array-contains', auth.currentUser.uid))
    const unsub = onSnapshot(q, (snapshot) => {
      setServicosFirestore(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      setServicosLoading(false)
    })
    return () => unsub()
  }, [auth.currentUser])

  // Buscar agendamentos do Firestore pelo NOME do estabelecimento
  useEffect(() => {
    if (!estabelecimento) return
    const agendamentosRef = collection(firestore, 'agendaAdmin')
    
    // Buscar agendamentos onde o campo 'nomeEstabelecimento' é igual ao estabelecimento do profissional
    const q = query(
      agendamentosRef, 
      where('nomeEstabelecimento', '==', estabelecimento)
    )
    
    const unsub = onSnapshot(q, (snapshot) => {
      const agendamentosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      setAgendamentos(agendamentosData)
    }, (error) => {
      console.error('Erro ao buscar agendamentos:', error)
    })
    
    return () => unsub()
  }, [estabelecimento])

  const handleModalClose = () => {
    setShowAppointmentModal(false)
    setModalStep(1)
    setAppointmentData({
      clientId: "",
      clientName: "",
      clientPhone: "",
      clientEmail: "",
      service: "",
      professional: "",
      date: "",
      time: "",
      duration: 60,
      price: 0,
      notes: "",
      paymentMethod: "",
      reminderEnabled: true,
    })
  }

  const handleNextStep = () => {
    if (modalStep < 4) {
      setModalStep(modalStep + 1)
    }
  }

  const handlePrevStep = () => {
    if (modalStep > 1) {
      setModalStep(modalStep - 1)
    }
  }

  const handleSubmitAppointment = async () => {
    if (!auth.currentUser || !profissionalNome) return
    const novoAgendamento = {
      ...appointmentData,
      professional: profissionalNome,
      createdAt: new Date(),
    }
    try {
      await addDoc(collection(firestore, 'agendaAdmin'), novoAgendamento)
      handleModalClose()
    } catch (error) {
      alert('Erro ao cadastrar agendamento: ' + error)
    }
  }

  const agendamentosDoDia = (date: Date) => {
    const dia = date.toISOString().split('T')[0]
    const agendamentosFiltrados = agendamentos.filter(a => a.date === dia)
    return agendamentosFiltrados
  }

  const handleDayClick = (date: Date) => {
    setSelectedDay(date)
    setShowDayModal(true)
  }

  const todayISO = new Date(selectedDate).toISOString().split('T')[0]
  const todayAppointments = agendamentos.filter(a => a.date === todayISO)
  const receitaPrevistaHoje = todayAppointments.reduce((sum, a) => sum + (a.price || 0), 0)
  const confirmadosHoje = todayAppointments.filter(a => a.status === 'confirmado').length
  const pendentesHoje = todayAppointments.filter(a => a.status !== 'confirmado').length
  const receitaConfirmadaHoje = todayAppointments.filter(a => a.status === 'finalizado').reduce((sum, a) => sum + (a.price || 0), 0)
  const historicoHoje = todayAppointments.filter(a => a.status === 'finalizado')
  const agendaHoje = todayAppointments.filter(a => a.status !== 'finalizado')

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
        status: 'finalizado',
        dataFinalizacao: new Date(),
        agendamentoId: id
      })
    }
  }

  const getStatusColor = (status:string) => {
    switch (status) {
      case "confirmado":
        return "success"
      case "agendado":
        return "warning"
      case "finalizado":
        return "info"
      case "cancelado":
        return "error"
      default:
        return "neutral"
    }
  }

  const getStatusIcon = (status:string) => {
    switch (status) {
      case "confirmado":
        return <Check size={16} />
      case "agendado":
        return <Clock size={16} />
      case "finalizado":
        return <Star size={16} />
      case "cancelado":
        return <X size={16} />
      default:
        return <AlertTriangle size={16} />
    }
  }

  const formatCurrency = (value:number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDate = (date:Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date)
  }

  // Função para gerar os dias do mês (com dias do mês anterior/próximo para completar a grade)
  function getMonthDays(date: Date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startDay = firstDayOfMonth.getDay(); // 0 (Dom) - 6 (Sáb)
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

  // Filtrar atendimentos iniciados e finalizados do dia selecionado
  const selectedDayISO = selectedDate.toISOString().split('T')[0];
  const atendimentosIniciados = agendamentos.filter(a => a.status === 'em_andamento' && a.date === selectedDayISO);
  const atendimentosFinalizados = agendamentos.filter(a => a.status === 'finalizado' && a.date === selectedDayISO);

  // --- INÍCIO DO JSX ---
  return (
    <div className="agenda-profissional-container">
      {/* Header */}
      <header className="agenda-profissional-header">
        <div className="header-left">
          <div className="logo-section">
            <Scissors className="logo-icon" />
            <div className="logo-text">
              <h1>CliqAgenda</h1>
              <p>Profissional</p>
            </div>
          </div>
        </div>

        <div className="header-center">
          <div className="date-display">
            <Calendar size={20} />
            <div className="date-info">
              <h2>{formatDate(selectedDate)}</h2>
              <p>Hoje • {agendaHoje.length + historicoHoje.length} agendamentos</p>
            </div>
          </div>
        </div>

        <div className="header-right">
          <div className="header-actions">
            <button className="btn-primary" onClick={() => setShowAppointmentModal(true)}>
              <Plus size={18} />
              <span>Novo Agendamento</span>
            </button>
            <button className="btn-secondary" style={{marginLeft: 8}} onClick={() => setShowDayModal(true)}>
              <Clock size={18} />
              Histórico
            </button>
          </div>

          {/* Notifications Dropdown */}
          {/* Removed as per edit hint */}
        </div>
      </header>

      {/* Navigation */}
      <nav className="agenda-profissional-nav">
        <div className="nav-items">
          <button
            className={`nav-item ${currentView === "dashboard" ? "active" : ""}`}
            onClick={() => setCurrentView("dashboard")}
          >
            <BarChart3 size={18} />
            <span>Dashboard</span>
          </button>
          <button
            className={`nav-item ${currentView === "calendar" ? "active" : ""}`}
            onClick={() => setCurrentView("calendar")}
          >
            <Calendar size={18} />
            <span>Calendário</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="agenda-profissional-main">
        {/* Dashboard View */}
        {currentView === "dashboard" && (
          <div className="dashboard-content">
            {/* Stats Cards */}
            <div className="stats-grid">
              <div className="stat-card primary">
                <div className="stat-header">
                  <div className="stat-icon">
                    <Calendar size={24} />
                  </div>
                  <span className="stat-trend positive">+{todayAppointments.length * 10}%</span>
                </div>
                <div className="stat-content">
                  <h3>{todayAppointments.length}</h3>
                  <p>Agendamentos Hoje</p>
                  <small>{confirmadosHoje} confirmados • {pendentesHoje} pendentes</small>
                </div>
              </div>

              <div className="stat-card success">
                <div className="stat-header">
                  <div className="stat-icon">
                    <DollarSign size={24} />
                  </div>
                  <span className="stat-trend positive">+{receitaPrevistaHoje > 0 ? 8 : 0}%</span>
                </div>
                <div className="stat-content">
                  <h3>{formatCurrency(receitaPrevistaHoje)}</h3>
                  <p>Receita Prevista Hoje</p>
                  <small>{formatCurrency(receitaConfirmadaHoje)} já confirmados</small>
                </div>
              </div>

              <div className="stat-card info">
                <div className="stat-header">
                  <div className="stat-icon">
                    <Users size={24} />
                  </div>
                  <span className="stat-trend neutral">1/1</span>
                </div>
                <div className="stat-content">
                  <h3>1</h3>
                  <p>Profissional Ativo</p>
                  <small>Você</small>
                </div>
              </div>
            </div>

            {/* Today's Schedule */}
            <div className="dashboard-section">
              <div className="section-header">
                <h2>Agenda de Hoje</h2>
                <div className="section-actions">
                  <button className="btn-filter" onClick={() => setShowFilters(!showFilters)}>
                    <Filter size={16} />
                    Filtros
                  </button>
                  <button className="btn-export">
                    <Download size={16} />
                    Exportar
                  </button>
                </div>
              </div>

              {/* Filters */}
              {showFilters && (
                <div className="filters-bar">
                  <div className="filter-group">
                    <label>Status:</label>
                    <select>
                      <option value="todos">Todos</option>
                      <option value="confirmado">Confirmados</option>
                      <option value="agendado">Agendados</option>
                      <option value="finalizado">Finalizados</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Appointments List */}
              <div className="appointments-list">
                {agendaHoje.map((appointment) => (
                  <div key={appointment.id} className="appointment-card">
                    <div className="appointment-time">
                      <Clock size={16} />
                      <span>{appointment.time}</span>
                    </div>

                    <div className="appointment-info">
                      <div className="client-info">
                        <h4>{appointment.clientName}</h4>
                        <p>{appointment.service}</p>
                        <div className="appointment-meta">
                          <span className="professional">
                            <User size={14} />
                            {auth.currentUser?.displayName || "Profissional"}
                          </span>
                          <span className="price">
                            <DollarSign size={14} />
                            {formatCurrency(appointment.price)}
                          </span>
                        </div>
                      </div>

                      <div className="appointment-status">
                        <span className={`status-badge ${getStatusColor(appointment.status)}`}>
                          {getStatusIcon(appointment.status)}
                          {appointment.status}
                        </span>
                      </div>
                    </div>

                    <div className="appointment-actions">
                      {appointment.status !== 'em_andamento' && (
                        <button className="btn-action-sm" title="Iniciar Atendimento" onClick={() => handleIniciarAtendimento(appointment.id)}>
                          <PlayIcon size={16} />
                        </button>
                      )}
                      {appointment.status === 'em_andamento' && (
                        <button className="btn-action-sm success" title="Finalizar Atendimento" onClick={() => handleFinalizarAtendimento(appointment.id)}>
                          <Check size={16} />
                        </button>
                      )}
                      <button className="btn-action-sm" title="Ver detalhes">
                        <Eye size={16} />
                      </button>
                      <button className="btn-action-sm" title="Editar">
                        <Edit size={16} />
                      </button>
                      <button className="btn-action-sm" title="Ligar">
                        <Phone size={16} />
                      </button>
                      <button className="btn-action-sm danger" title="Cancelar">
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Atendimentos Iniciados */}
              {atendimentosIniciados.length > 0 && (
                <div className="iniciados-section">
                  <h3>Atendimentos Iniciados</h3>
                  {atendimentosIniciados.map((appointment) => (
                    <div key={appointment.id} className="appointment-card iniciado">
                      <div className="appointment-time">
                        <Clock size={16} />
                        <span>{appointment.time}</span>
                      </div>
                      <div className="appointment-info">
                        <div className="client-info">
                          <h4>{appointment.clientName}</h4>
                          <p>{appointment.service}</p>
                          <div className="appointment-meta">
                            <span className="professional">
                              <User size={14} />
                              {auth.currentUser?.displayName || "Profissional"}
                            </span>
                            <span className="price">
                              <DollarSign size={14} />
                              {formatCurrency(appointment.price)}
                            </span>
                          </div>
                        </div>
                        <div className="appointment-status">
                          <span className="status-badge" style={{ color: 'green', fontWeight: 'bold' }}>Atendimento iniciado</span>
                        </div>
                      </div>
                      <div className="appointment-actions">
                        <button className="btn-action-sm success" title="Finalizar Atendimento" onClick={() => handleFinalizarAtendimento(appointment.id)}>
                          <Check size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Atendimentos Finalizados */}
              {atendimentosFinalizados.length > 0 && (
                <div className="finalizados-section" style={{
                  border: '2px solid #60a5fa',
                  background: '#f0f7ff',
                  borderRadius: 12,
                  padding: 20,
                  marginTop: 32,
                  marginBottom: 24,
                  boxShadow: '0 2px 8px 0 rgba(96,165,250,0.08)'
                }}>
                  <h3 style={{
                    color: '#2563eb',
                    fontWeight: 700,
                    fontSize: 20,
                    marginBottom: 18,
                    letterSpacing: 0.5
                  }}>Atendimentos Encerrados</h3>
                  {atendimentosFinalizados.map((appointment) => (
                    <div key={appointment.id} className="appointment-card finalizado" style={{
                      marginBottom: 18,
                      background: '#e0e7ef',
                      borderRadius: 8,
                      border: '1.5px solid #93c5fd',
                      boxShadow: '0 1px 4px 0 rgba(96,165,250,0.06)',
                      padding: 14,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16
                    }}>
                      <div className="appointment-time">
                        <Clock size={16} />
                        <span>{appointment.time}</span>
                      </div>
                      <div className="appointment-info" style={{ flex: 1 }}>
                        <div className="client-info">
                          <h4 style={{ color: '#1e293b', fontWeight: 600 }}>{appointment.clientName}</h4>
                          <p style={{ color: '#334155', marginBottom: 2 }}>{appointment.service}</p>
                          <div className="appointment-meta">
                            <span className="professional">
                              <User size={14} />
                              {auth.currentUser?.displayName || "Profissional"}
                            </span>
                            <span className="price">
                              <DollarSign size={14} />
                              {formatCurrency(appointment.price)}
                            </span>
                          </div>
                        </div>
                        <div className="appointment-status">
                          <span className="status-badge" style={{
                            color: '#fff',
                            background: '#dc2626',
                            fontWeight: 'bold',
                            borderRadius: 6,
                            padding: '4px 12px',
                            marginTop: 6,
                            display: 'inline-block',
                            fontSize: 14
                          }}>Atendimento finalizado</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Histórico de Atendimento do Dia */}
            {historicoHoje.length > 0 && (
              <div className="dashboard-section">
                <div className="section-header">
                  <h2>Histórico de Atendimento do Dia</h2>
                </div>
                <div className="appointments-list">
                  {historicoHoje.map((appointment) => (
                    <div key={appointment.id} className="appointment-card finalizado">
                      <div className="appointment-time">
                        <Clock size={16} />
                        <span>{appointment.time}</span>
                      </div>
                      <div className="appointment-info">
                        <div className="client-info">
                          <h4>{appointment.clientName}</h4>
                          <p>{appointment.service}</p>
                          <div className="appointment-meta">
                            <span className="professional">
                              <User size={14} />
                              {auth.currentUser?.displayName || "Profissional"}
                            </span>
                            <span className="price">
                              <DollarSign size={14} />
                              {formatCurrency(appointment.price)}
                            </span>
                          </div>
                        </div>
                        <div className="appointment-status">
                          <span className={`status-badge info`}>
                            <Check size={16} />
                            Finalizado
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Calendar View */}
        {currentView === "calendar" && (
          <div className="calendar-content">
            <div className="calendar-header">
              <div className="calendar-navigation" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <button className="btn-nav" onClick={handlePrevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                  <ChevronLeft size={24} />
                </button>
                <h2 style={{ margin: 0 }}>{formatDate(selectedDate)}</h2>
                <button className="btn-nav" onClick={handleNextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                  <ChevronRight size={24} />
                </button>
              </div>
              <div className="calendar-views">
                <button className="btn-view active">Mês</button>
                <button className="btn-view">Semana</button>
                <button className="btn-view">Dia</button>
              </div>
            </div>
            <div className="calendar-grid">
              <div className="calendar-weekdays">
                <div className="weekday">Dom</div>
                <div className="weekday">Seg</div>
                <div className="weekday">Ter</div>
                <div className="weekday">Qua</div>
                <div className="weekday">Qui</div>
                <div className="weekday">Sex</div>
                <div className="weekday">Sáb</div>
              </div>
              <div className="calendar-days">
                {getMonthDays(selectedDate).map((day, idx) => {
                  const dayISO = day.toISOString().split('T')[0];
                  const isToday = day.toDateString() === new Date().toDateString();
                  const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
                  const hasAppointments = agendamentos.some(a => a.date === dayISO);
                  return (
                    <div
                      key={idx}
                      className={`calendar-day${isToday ? " today" : ""}${!isCurrentMonth ? " other-month" : ""}`}
                      onClick={() => handleDayClick(day)}
                      style={{
                        cursor: 'pointer',
                        border: hasAppointments ? '2px solid #6366f1' : undefined,
                        background: isToday ? '#e0f2fe' : undefined,
                        color: !isCurrentMonth ? '#bbb' : undefined
                      }}
                    >
                      <span className="day-number">{day.getDate()}</span>
                      {hasAppointments && <div className="day-appointments"><div className="appointment-dot confirmed"></div></div>}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="calendar-legend">
              <div className="legend-item">
                <div className="legend-dot confirmed"></div>
                <span>Agendamento</span>
              </div>
            </div>
          </div>
        )}

        {/* Outras views */}
        {currentView !== "dashboard" && currentView !== "calendar" && (
          <div className="placeholder-content">
            <div className="placeholder-icon">
              <Zap size={48} />
            </div>
            <h2>Em Desenvolvimento</h2>
            <p>Esta seção está sendo desenvolvida e estará disponível em breve!</p>
          </div>
        )}
      </main>

      {/* Modal de Novo Agendamento */}
      {showAppointmentModal && (
        <div className="modal-overlay" onClick={handleModalClose}>
          <div className="appointment-modal" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="modal-header">
              <div className="modal-title">
                <h2>Novo Agendamento</h2>
                <p>Passo {modalStep} de 4</p>
              </div>

              <div className="modal-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${(modalStep / 4) * 100}%` }}></div>
                </div>
                <div className="progress-steps">
                  {[1, 2, 3, 4].map((step) => (
                    <div key={step} className={`progress-step ${modalStep >= step ? "active" : ""}`}>
                      {modalStep > step ? <Check size={16} /> : step}
                    </div>
                  ))}
                </div>
              </div>

              <button className="modal-close" onClick={handleModalClose}>
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="modal-content">
              {/* Step 1: Client Information */}
              {modalStep === 1 && (
                <div className="modal-step">
                  <div className="step-header">
                    <div className="step-icon">
                      <User size={24} />
                    </div>
                    <div className="step-info">
                      <h3>Selecione o Cliente</h3>
                      <p>Escolha um cliente cadastrado para o agendamento</p>
                    </div>
                  </div>
                  {clientesLoading ? (
                    <div>Carregando clientes...</div>
                  ) : clientes.length === 0 ? (
                    <div style={{ color: 'red', margin: '16px 0' }}>
                      Nenhum cliente cadastrado.<br />
                      <button className="btn-primary" onClick={() => navigate('/dashboardProfissional/' + auth.currentUser?.uid + '/cliente')}>
                        Cadastrar Cliente
                      </button>
                    </div>
                  ) : (
                    <div className="clientes-list-modal">
                      {clientes.map((cliente) => (
                        <label
                          key={cliente.id}
                          className={`cliente-select-card ${appointmentData.clientId === cliente.id ? 'selected' : ''}`}
                          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', border: appointmentData.clientId === cliente.id ? '2px solid #6366f1' : '1px solid #ccc', borderRadius: 8, padding: 12, marginBottom: 8 }}
                        >
                          <input
                            type="radio"
                            name="selectCliente"
                            checked={appointmentData.clientId === cliente.id}
                            onChange={() => setAppointmentData((prev) => ({ ...prev, clientId: cliente.id, clientName: cliente.nome, clientPhone: cliente.telefone, clientEmail: cliente.email }))}
                            style={{ marginRight: 12 }}
                          />
                          <div>
                            <div><strong>{cliente.nome}</strong></div>
                            <div>{cliente.telefone}</div>
                            <div>{cliente.email}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Service Selection */}
              {modalStep === 2 && (
                <div className="modal-step">
                  <div className="step-header">
                    <div className="step-icon">
                      <Scissors size={24} />
                    </div>
                    <div className="step-info">
                      <h3>Escolha o Serviço</h3>
                      <p>Selecione o serviço desejado</p>
                    </div>
                  </div>
                  {servicosLoading ? (
                    <div>Carregando serviços...</div>
                  ) : servicosFirestore.length === 0 ? (
                    <div style={{ color: 'red', margin: '16px 0' }}>
                      Nenhum serviço cadastrado para este profissional.<br />
                    </div>
                  ) : (
                    <div className="services-grid">
                      {servicosFirestore.map((service) => (
                        <div
                          key={service.id}
                          className={`service-card ${appointmentData.service === service.nomeServico ? "selected" : ""}`}
                          onClick={() => setAppointmentData((prev) => ({
                            ...prev,
                            service: service.nomeServico,
                            duration: service.duracaoServico,
                            price: service.valorServico,
                            categoriaServico: service.categoriaServico,
                            profissionaisServico: service.profissionaisServico,
                            servicoAtivo: service.servicoAtivo,
                            nomeEstabelecimento: service.nomeEstabelecimento,
                            uidProprietario: service.uidProprietario,
                            emailProprietario: service.emailProprietario,
                          }))}
                        >
                          <div className="service-info">
                            <h4>{service.nomeServico}</h4>
                            <p className="service-category">{service.categoriaServico}</p>
                            <div className="service-details">
                              <span className="service-duration">
                                <Clock size={14} />
                                {service.duracaoServico} min
                              </span>
                              <span className="service-price">
                                <DollarSign size={14} />
                                {formatCurrency(service.valorServico)}
                              </span>
                            </div>
                            <div className="service-extra">
                              <div><strong>Profissionais:</strong> {Array.isArray(service.profissionaisServico) ? service.profissionaisServico.join(', ') : ''}</div>
                              <div><strong>Status:</strong> {service.servicoAtivo ? 'Ativo' : 'Inativo'}</div>
                              <div><strong>Estabelecimento:</strong> {service.nomeEstabelecimento}</div>
                            </div>
                          </div>
                          {appointmentData.service === service.nomeServico && (
                            <div className="service-selected">
                              <Check size={20} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Data/Hora */}
              {modalStep === 3 && (
                <div className="modal-step">
                  <div className="step-header">
                    <div className="step-icon">
                      <Calendar size={24} />
                    </div>
                    <div className="step-info">
                      <h3>Data e Hora</h3>
                      <p>Escolha quando</p>
                    </div>
                  </div>

                  <div className="datetime-grid">
                    <div className="form-group">
                      <label htmlFor="date">Data *</label>
                      <input
                        type="date"
                        id="date"
                        value={appointmentData.date}
                        onChange={(e) => setAppointmentData((prev) => ({ ...prev, date: e.target.value }))}
                        min={new Date().toISOString().split("T")[0]}
                        required
                      />
                    </div>

                    <div className="time-selection">
                      <label>Horário Disponível *</label>
                      <div className="time-grid">
                        {["08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30"].map((time) => (
                          <button
                            key={time}
                            type="button"
                            className={`time-slot ${appointmentData.time === time ? "selected" : ""}`}
                            onClick={() => setAppointmentData((prev) => ({ ...prev, time }))}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Confirmation & Payment */}
              {modalStep === 4 && (
                <div className="modal-step">
                  <div className="step-header">
                    <div className="step-icon">
                      <Check size={24} />
                    </div>
                    <div className="step-info">
                      <h3>Confirmação</h3>
                      <p>Revise os dados e finalize</p>
                    </div>
                  </div>

                  <div className="confirmation-content">
                    <div className="appointment-summary">
                      <h4>Resumo do Agendamento</h4>

                      <div className="summary-section">
                        <h5>Cliente</h5>
                        <p>{appointmentData.clientName}</p>
                        <p>{appointmentData.clientPhone}</p>
                        {appointmentData.clientEmail && <p>{appointmentData.clientEmail}</p>}
                      </div>

                      <div className="summary-section">
                        <h5>Serviço</h5>
                        <p>{appointmentData.service}</p>
                        <p>Duração: {appointmentData.duration} minutos</p>
                        <p className="price-highlight">Valor: {formatCurrency(appointmentData.price)}</p>
                      </div>

                      <div className="summary-section">
                        <h5>Agendamento</h5>
                        <p>Profissional: {auth.currentUser?.displayName || "Profissional"}</p>
                        <p>
                          Data: {appointmentData.date ? new Date(appointmentData.date).toLocaleDateString("pt-BR") : ""}
                        </p>
                        <p>Horário: {appointmentData.time}</p>
                      </div>
                    </div>

                    <div className="additional-options">
                      <div className="form-group">
                        <label htmlFor="paymentMethod">Forma de Pagamento</label>
                        <select
                          id="paymentMethod"
                          value={appointmentData.paymentMethod}
                          onChange={(e) => setAppointmentData((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                        >
                          <option value="">Definir no atendimento</option>
                          <option value="dinheiro">Dinheiro</option>
                          <option value="pix">PIX</option>
                          <option value="cartao">Cartão</option>
                        </select>
                      </div>

                      <div className="form-group full-width">
                        <label htmlFor="notes">Observações</label>
                        <textarea
                          id="notes"
                          value={appointmentData.notes}
                          onChange={(e) => setAppointmentData((prev) => ({ ...prev, notes: e.target.value }))}
                          placeholder="Observações especiais, preferências do cliente..."
                          rows={3}
                        />
                      </div>

                      <div className="checkbox-group">
                        <input
                          type="checkbox"
                          id="reminder"
                          checked={appointmentData.reminderEnabled}
                          onChange={(e) =>
                            setAppointmentData((prev) => ({ ...prev, reminderEnabled: e.target.checked }))
                          }
                        />
                        <label htmlFor="reminder">Enviar lembrete por WhatsApp</label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              <div className="footer-actions">
                {modalStep > 1 && (
                  <button className="btn-secondary" onClick={handlePrevStep}>
                    <ChevronLeft size={16} />
                    Voltar
                  </button>
                )}

                <div className="primary-actions">
                  <button className="btn-cancel" onClick={handleModalClose}>
                    Cancelar
                  </button>

                  {modalStep < 4 ? (
                    <button
                      className="btn-primary"
                      onClick={handleNextStep}
                      disabled={
                        (modalStep === 1 && (!appointmentData.clientId)) ||
                        (modalStep === 2 && !appointmentData.service) ||
                        (modalStep === 3 && (!appointmentData.date || !appointmentData.time))
                      }
                    >
                      Próximo
                      <ChevronRight size={16} />
                    </button>
                  ) : (
                    <button className="btn-success" onClick={handleSubmitAppointment}>
                      <Check size={16} />
                      Confirmar Agendamento
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de agendamentos do dia */}
      {showDayModal && selectedDay && (
        <div className="modal-overlay" onClick={() => setShowDayModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Agendamentos de {selectedDay.toLocaleDateString('pt-BR')}</h2>
              <button className="modal-close" onClick={() => setShowDayModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {agendamentosDoDia(selectedDay).length === 0 ? (
                <p>Nenhum agendamento para este dia.</p>
              ) : (
                <ul>
                  {agendamentosDoDia(selectedDay).map((a, idx) => (
                    <li key={idx} style={{ marginBottom: 12, borderBottom: '1px solid #eee', paddingBottom: 8 }}>
                      <strong>Cliente:</strong> {a.clientName}<br />
                      <strong>Serviço:</strong> {a.service}<br />
                      <strong>Horário:</strong> {a.time}<br />
                      <strong>Status:</strong> {a.status || 'agendado'}<br />
                      <strong>Telefone:</strong> {a.clientPhone}<br />
                      <strong>Valor:</strong> {formatCurrency(a.price)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Histórico Geral Modal */}
      {/* Removed as per edit hint */}
    </div>
  )
}

export default AgendaProfissional