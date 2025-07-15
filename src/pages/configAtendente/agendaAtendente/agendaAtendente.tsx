"use client"

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
  Check,
  X,
  User,
  Scissors,
  BarChart3,
  Zap,
  PlayIcon,
  Menu,
  Home,
  UserCheck,
  CreditCard,
  LogOut,
  Square,
  MessageCircle,
} from "lucide-react"
import "./agendaAtendente.css"
import { firestore } from "../../../firebase/firebase"
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, getDoc, getDocs } from "firebase/firestore"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { useNavigate } from "react-router-dom"
import { auth } from "../../../firebase/firebase"

const AgendaAtendente = () => {
  const [currentView, setCurrentView] = useState("dashboard")
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedProfessional, setSelectedProfessional] = useState("todos")
  const [showFilters, setShowFilters] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

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

  // Available times
  const availableTimes = [
    "08:00",
    "08:30",
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
    "17:30",
    "18:00",
    "18:30",
  ]

  const navigate = useNavigate()
  const [clientesLoading, setClientesLoading] = useState(true)
  const [servicosFirestore, setServicosFirestore] = useState<any[]>([])
  const [servicosLoading, setServicosLoading] = useState(true)

  // Agendamentos do Firestore
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [showDayModal, setShowDayModal] = useState(false)

  // Profissionais ativos
  const [colaboradoresEstab, setColaboradoresEstab] = useState<any[]>([])
  const [colaboradoresLoading, setColaboradoresLoading] = useState(true)

  // Buscar nome do estabelecimento do atendente logado (igual admin)
  const [estabelecimento, setEstabelecimento] = useState("")

  // Adicionar os states corretos
  const [clientesEstab, setClientesEstab] = useState<any[]>([])
  const [agendamentosEstab, setAgendamentosEstab] = useState<any[]>([])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user || !user.email) {
        console.log("Usuário não está logado ou sem e-mail.");
        return;
      }
      // Buscar colaborador pelo e-mail logado
      const colaboradoresRef = collection(firestore, "colaboradores");
      const q = query(colaboradoresRef, where("email", "==", user.email));
      getDocs(q)
        .then((snapshot) => {
          if (!snapshot.empty) {
            const docData = snapshot.docs[0].data();
            setEstabelecimento(docData.estabelecimento || "");
            console.log("Colaborador encontrado:", docData);
          } else {
            setEstabelecimento("");
            console.log("Nenhum colaborador encontrado com o e-mail:", user.email);
          }
        })
        .catch((error) => {
          console.error("Erro ao buscar colaborador:", error);
        });
    });
    return () => unsubscribe();
  }, []);

  // Buscar clientes do mesmo estabelecimento
  useEffect(() => {
    if (!estabelecimento) return;
    setClientesLoading(true);
    const clientesRef = collection(firestore, 'clienteUser');
    const q = query(clientesRef, where('estabelecimento', '==', estabelecimento));
    const unsub = onSnapshot(q, (snapshot) => {
      setClientesEstab(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setClientesLoading(false);
    });
    return () => unsub();
  }, [estabelecimento]);

  // Buscar profissionais do mesmo estabelecimento
  useEffect(() => {
    if (!estabelecimento) return
    const colaboradoresRef = collection(firestore, 'colaboradores')
    const q = query(colaboradoresRef, where('estabelecimento', '==', estabelecimento))
    const unsub = onSnapshot(q, (snapshot) => {
      setColaboradoresEstab(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    })
    return () => unsub()
  }, [estabelecimento])

  // Buscar agendamentos do estabelecimento
  useEffect(() => {
    console.log('=== BUSCANDO AGENDAMENTOS (ATENDENTE) ===')
    console.log('Estabelecimento carregado:', estabelecimento)
    if (!estabelecimento) return
    const agendamentosRef = collection(firestore, 'agendaAdmin')
    const q = query(agendamentosRef, where('nomeEstabelecimento', '==', estabelecimento))
    const unsub = onSnapshot(q, (snapshot) => {
      console.log('Snapshot retornou:', snapshot.size, 'documentos')
      const ags = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      console.log('=== DADOS DOS AGENDAMENTOS (ATENDENTE) ===')
      console.log('Estabelecimento buscado:', estabelecimento)
      console.log('Total de agendamentos encontrados:', ags.length)
      console.log('Agendamentos encontrados:', ags)
      ags.forEach((agendamento: any, index) => {
        console.log(`Agendamento ${index + 1}:`, {
          id: agendamento.id,
          cliente: agendamento.clientName,
          servico: agendamento.service,
          data: agendamento.date,
          horario: agendamento.time,
          profissional: agendamento.professional,
          estabelecimento: agendamento.nomeEstabelecimento,
          status: agendamento.status
        })
      })
      console.log('=== FIM DOS DADOS ===')
      
      setAgendamentosEstab(ags)
    })
    return () => unsub()
  }, [estabelecimento])

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setColaboradoresLoading(true)
      const colaboradoresRef = collection(firestore, "colaboradoresAtendente")
      const q = query(colaboradoresRef, where("createdBy", "==", user.uid))
      const unsub = onSnapshot(q, (snapshot) => {
        setColaboradoresEstab(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
        setColaboradoresLoading(false)
      })
      return () => unsub()
    }
  }, [])

  // Buscar serviços do mesmo estabelecimento
  useEffect(() => {
    if (!estabelecimento) return;
    setServicosLoading(true);
    const servicosRef = collection(firestore, 'servicosAdmin');
    const q = query(servicosRef, where('nomeEstabelecimento', '==', estabelecimento));
    const unsub = onSnapshot(q, (snapshot) => {
      setServicosFirestore(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setServicosLoading(false);
    });
    return () => unsub();
  }, [estabelecimento]);

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
    console.log("Tentando confirmar agendamento...");
    const user = auth.currentUser;
    if (!user) {
      alert("Usuário não logado!");
      return;
    }
    if (!appointmentData.clientId) {
      alert("Selecione um cliente!");
      return;
    }
    if (!appointmentData.service) {
      alert("Selecione um serviço!");
      return;
    }
    if (!appointmentData.professional) {
      alert("Selecione um profissional!");
      return;
    }
    if (!appointmentData.date) {
      alert("Selecione uma data!");
      return;
    }
    if (!appointmentData.time) {
      alert("Selecione um horário!");
      return;
    }

    const servicoSelecionado = servicosFirestore.find(s => s.nomeServico === appointmentData.service);
    if (!servicoSelecionado) {
      alert("Serviço não encontrado!");
      return;
    }

    const emailProprietario = servicoSelecionado?.emailProprietario || user.email;
    const uidProprietario = servicoSelecionado?.uidProprietario || user.uid;
    const nomeEstabelecimento = servicoSelecionado?.nomeEstabelecimento || estabelecimento;
    const admin = [emailProprietario, uidProprietario, nomeEstabelecimento];

    const responsavel = [
      user.email,
      user.uid,
      estabelecimento
    ];

    const novoAgendamento = {
      ...appointmentData,
      admin,
      responsavel,
      nomeEstabelecimento: estabelecimento,
      createdAt: new Date(),
    };
    try {
      await addDoc(collection(firestore, 'agendaAdmin'), novoAgendamento);
      console.log("Agendamento criado:", novoAgendamento);
      handleModalClose();
      alert("Agendamento criado com sucesso!");
    } catch (error: any) {
      console.error('Erro ao cadastrar agendamento:', error);
      alert('Erro ao cadastrar agendamento: ' + (error.message || error));
    }
  };

  // Função para filtrar agendamentos do dia selecionado
  const agendamentosDoDia = (date: Date) => {
    const dia = date.toISOString().split("T")[0]
    return agendamentosEstab.filter((a) => a.date === dia)
  }

  // Função para abrir modal do dia
  const handleDayClick = (date: Date) => {
    setSelectedDay(date)
    setShowDayModal(true)
  }

  // Mock data
  const todayISO = new Date(selectedDate).toISOString().split("T")[0]
  const todayAppointments = agendamentosEstab.filter((a) => a.date === todayISO)
  const receitaPrevistaHoje = todayAppointments.reduce((sum, a) => sum + (a.price || 0), 0)
  const confirmadosHoje = todayAppointments.filter((a) => a.status === "confirmado").length
  const pendentesHoje = todayAppointments.filter((a) => a.status !== "confirmado").length

  // Receita confirmada do dia
  const receitaConfirmadaHoje = todayAppointments
    .filter((a) => a.status === "finalizado")
    .reduce((sum, a) => sum + (a.price || 0), 0)

  // Filtrar atendimentos iniciados e finalizados
  const atendimentosIniciados = agendamentosEstab.filter(a => a.status === "em_andamento")
  const atendimentosFinalizados = agendamentosEstab.filter(a => a.status === "finalizado")
  const agendaHoje = todayAppointments.filter((a) => a.status !== "finalizado" && a.status !== "em_andamento")

  // Filtrar atendimentos finalizados do dia selecionado
  const selectedDayISO = selectedDate.toISOString().split('T')[0]
  const atendimentosFinalizadosDoDia = atendimentosFinalizados.filter(a => a.date === selectedDayISO)

  // Histórico geral: todos finalizados
  const [showHistoricoModal, setShowHistoricoModal] = useState(false)
  const historicoGeral = agendamentosEstab.filter((a) => a.status === "finalizado")

  // Atualizar função de iniciar atendimento
  const handleIniciarAtendimento = async (id: string) => {
    await updateDoc(doc(firestore, "agendaAdmin", id), { status: "em_andamento" })
  }

  // Atualizar função de finalizar atendimento
  const handleFinalizarAtendimento = async (id: string) => {
    await updateDoc(doc(firestore, "agendaAdmin", id), { status: "finalizado" })
    const agendamentoDoc = await getDoc(doc(firestore, "agendaAdmin", id))
    if (agendamentoDoc.exists()) {
      const agendamentoData = agendamentoDoc.data()
      await addDoc(collection(firestore, "historicoAgendamentoFinalizadoAdmin"), {
        ...agendamentoData,
        status: "finalizado",
        dataFinalizacao: new Date(),
        agendamentoId: id
      })
      // Excluir o agendamento da coleção agendaAdmin
      await (await import('firebase/firestore')).deleteDoc(doc(firestore, "agendaAdmin", id))
    }
  }

  // Profissionais habilitados para o serviço selecionado
  const profissionaisHabilitados = (() => {
    const servicoSelecionado = servicosFirestore.find((s) => s.nomeServico === appointmentData.service)
    if (servicoSelecionado && Array.isArray(servicoSelecionado.profissionaisServico)) {
      return servicoSelecionado.profissionaisServico
    }
    return []
  })()

  // Menu de navegação mobile
  const menuItems = [
    { icon: Home, label: "Dashboard", path: `/dashboardProfissional/${auth.currentUser?.uid}` },
    { icon: Calendar, label: "Agenda", path: `/dashboardProfissional/${auth.currentUser?.uid}/agenda` },
    { icon: Users, label: "Clientes", path: `/dashboardProfissional/${auth.currentUser?.uid}/clientes` },
    { icon: CreditCard, label: "Financeiro", path: `/dashboardProfissional/${auth.currentUser?.uid}/financeiro` },
    { icon: UserCheck, label: "Perfil", path: `/dashboardProfissional/${auth.currentUser?.uid}/perfil` },
  ]

  // Funções para navegação do calendário
  const handlePrev = () => {
    if (currentView === 'month') {
      setSelectedDate(prev => {
        const newDate = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
        return newDate;
      });
    } else if (currentView === 'week') {
      setSelectedDate(prev => {
        const newDate = new Date(prev);
        newDate.setDate(newDate.getDate() - 7);
        return newDate;
      });
    } else if (currentView === 'day') {
      setSelectedDate(prev => {
        const newDate = new Date(prev);
        newDate.setDate(newDate.getDate() - 1);
        return newDate;
      });
    }
  };
  const handleNext = () => {
    if (currentView === 'month') {
      setSelectedDate(prev => {
        const newDate = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
        return newDate;
      });
    } else if (currentView === 'week') {
      setSelectedDate(prev => {
        const newDate = new Date(prev);
        newDate.setDate(newDate.getDate() + 7);
        return newDate;
      });
    } else if (currentView === 'day') {
      setSelectedDate(prev => {
        const newDate = new Date(prev);
        newDate.setDate(newDate.getDate() + 1);
        return newDate;
      });
    }
  };

  // Função para gerar os dias do mês corretamente
  const getMonthDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startDay = firstDayOfMonth.getDay(); // 0 (Dom) - 6 (Sáb)
    const days: Date[] = [];
    // Dias do mês anterior para preencher o início
    for (let i = 0; i < startDay; i++) {
      days.push(new Date(year, month, i - startDay + 1));
    }
    // Dias do mês atual
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    // Dias do próximo mês para completar 42 células (6 semanas)
    while (days.length % 7 !== 0) {
      days.push(new Date(year, month + 1, days.length - daysInMonth - startDay + 1));
    }
    return days;
  };

  return (
    <div className="atendente-agenda-container">
      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="atendente-mobile-menu-overlay" onClick={() => setShowMobileMenu(false)}>
          <div className="atendente-mobile-menu" onClick={(e) => e.stopPropagation()}>
            <div className="atendente-mobile-menu-header">
              <div className="atendente-mobile-menu-logo">
                <Scissors className="atendente-mobile-menu-logo-icon" />
                <span>CliqAgenda</span>
              </div>
              <button className="atendente-mobile-menu-close" onClick={() => setShowMobileMenu(false)}>
                <X size={24} />
              </button>
            </div>
            <nav className="atendente-mobile-menu-nav">
              {menuItems.map((item, index) => (
                <button
                  key={index}
                  className="atendente-mobile-menu-item"
                  onClick={() => {
                    navigate(item.path)
                    setShowMobileMenu(false)
                  }}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </button>
              ))}
              <button
                className="atendente-mobile-menu-item atendente-mobile-menu-logout"
                onClick={() => {
                  const auth = getAuth()
                  auth.signOut()
                  navigate("/")
                }}
              >
                <LogOut size={20} />
                <span>Sair</span>
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="atendente-agenda-header">
        <div className="atendente-header-left">
          <button className="atendente-mobile-menu-trigger" onClick={() => setShowMobileMenu(true)}>
            <Menu size={24} />
          </button>
          <div className="atendente-logo-section">
            <Scissors className="atendente-logo-icon" />
            <div className="atendente-logo-text">
              <h1>CliqAgenda</h1>
              <p>Atendente</p>
            </div>
          </div>
        </div>

        <div className="atendente-header-center">
          <div className="atendente-date-display">
            <Calendar size={20} />
            <div className="atendente-date-info">
              <h2>{selectedDate.toLocaleDateString("pt-BR")}</h2>
              <p>Hoje • {agendaHoje.length + historicoGeral.length} agendamentos</p>
            </div>
          </div>
        </div>

        <div className="atendente-header-right">
          <div className="atendente-header-actions">
            <button className="atendente-btn-primary" onClick={() => setShowAppointmentModal(true)}>
              <Plus size={18} />
              <span>Novo Agendamento</span>
            </button>
            <button
              className="atendente-btn-secondary"
              style={{ marginLeft: 8 }}
              onClick={() => setShowHistoricoModal(true)}
            >
              <Clock size={18} />
              Histórico
            </button>
          </div>

          {/* Notifications Dropdown */}
          {/* Removed as per edit hint */}
        </div>
      </header>

      {/* Navigation */}
      <nav className="atendente-agenda-nav">
        <div className="atendente-nav-items">
          <button
            className={`atendente-nav-item ${currentView === "dashboard" ? "active" : ""}`}
            onClick={() => setCurrentView("dashboard")}
          >
            <BarChart3 size={18} />
            <span>Dashboard</span>
          </button>
          <button
            className={`atendente-nav-item ${currentView === "calendar" ? "active" : ""}`}
            onClick={() => setCurrentView("calendar")}
          >
            <Calendar size={18} />
            <span>Calendário</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="atendente-agenda-main">
        {/* Dashboard View */}
        {currentView === "dashboard" && (
          <div className="atendente-dashboard-content">
            {/* Stats Cards */}
            <div className="atendente-stats-grid">
              <div className="atendente-stat-card primary">
                <div className="atendente-stat-header">
                  <div className="atendente-stat-icon">
                    <Calendar size={24} />
                  </div>
                  <span className="atendente-stat-trend positive">+{todayAppointments.length * 10}%</span>
                </div>
                <div className="atendente-stat-content">
                  <h3>{todayAppointments.length}</h3>
                  <p>Agendamentos Hoje</p>
                  <small>
                    {confirmadosHoje} confirmados • {pendentesHoje} pendentes
                  </small>
                </div>
              </div>

              <div className="atendente-stat-card success">
                <div className="atendente-stat-header">
                  <div className="atendente-stat-icon">
                    <DollarSign size={24} />
                  </div>
                  <span className="atendente-stat-trend positive">+{receitaPrevistaHoje > 0 ? 8 : 0}%</span>
                </div>
                <div className="atendente-stat-content">
                  <h3>{receitaPrevistaHoje.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</h3>
                  <p>Receita Prevista Hoje</p>
                  <small>{receitaConfirmadaHoje.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} já confirmados</small>
                </div>
              </div>

              <div className="atendente-stat-card info">
                <div className="atendente-stat-header">
                  <div className="atendente-stat-icon">
                    <Users size={24} />
                  </div>
                  <span className="atendente-stat-trend neutral">
                    {colaboradoresEstab.length}/{colaboradoresEstab.length}
                  </span>
                </div>
                <div className="atendente-stat-content">
                  <h3>{colaboradoresEstab.length}</h3>
                  <p>Profissionais Ativos</p>
                  <small>{colaboradoresLoading ? "Carregando..." : `${colaboradoresEstab.length} cadastrados`}</small>
                </div>
              </div>
            </div>

            {/* Today's Schedule */}
            <div className="atendente-dashboard-section">
              <div className="atendente-section-header">
                <h2>Agenda de Hoje</h2>
                <div className="atendente-section-actions">
                  <button className="atendente-btn-filter" onClick={() => setShowFilters(!showFilters)}>
                    <Filter size={16} />
                    Filtros
                  </button>
                  <button className="atendente-btn-export">
                    <Download size={16} />
                    Exportar
                  </button>
                </div>
              </div>

              {/* Filters */}
              {showFilters && (
                <div className="atendente-filters-bar">
                  <div className="atendente-filter-group">
                    <label>Profissional:</label>
                    <select value={selectedProfessional} onChange={(e) => setSelectedProfessional(e.target.value)}>
                      <option value="todos">Todos</option>
                      <option value="carlos">Carlos</option>
                      <option value="ana">Ana</option>
                      <option value="fernanda">Fernanda</option>
                    </select>
                  </div>
                  <div className="atendente-filter-group">
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
              <div className="atendente-appointments-list">
                {agendaHoje.map((appointment) => (
                  <div key={appointment.id} className="atendente-appointment-card">
                    <div className="atendente-appointment-time">
                      <Clock size={16} />
                      <span>{appointment.time}</span>
                    </div>

                    <div className="atendente-appointment-info">
                      <div className="atendente-client-info">
                        <h4>{appointment.clientName}</h4>
                        <p>{appointment.service}</p>
                        <div className="atendente-appointment-meta">
                          <span className="atendente-professional">
                            <User size={14} />
                            {appointment.professional}
                          </span>
                          <span className="atendente-price">
                            <DollarSign size={14} />
                            {receitaPrevistaHoje.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </span>
                        </div>
                      </div>

                      <div className="atendente-appointment-status">
                        <span className={`atendente-status-badge`}>Agendado</span>
                      </div>
                    </div>

                    <div className="atendente-appointment-actions">
                      <button className="atendente-btn-action-sm" title="Iniciar Atendimento" onClick={() => handleIniciarAtendimento(appointment.id)}>
                        <PlayIcon size={16} />
                      </button>
                      <button className="atendente-btn-action-sm" title="Ver detalhes">
                        <Eye size={16} />
                      </button>
                      <button className="atendente-btn-action-sm danger" title="Cancelar">
                        <X size={16} />
                      </button>
                      <button className="atendente-btn-action-sm" title="WhatsApp" onClick={() => {
                        const phone = appointment.clientPhone?.replace(/\D/g, '');
                        if (!phone) {
                          alert('Telefone do cliente não encontrado!');
                          return;
                        }
                        const phoneWithCountry = phone.length === 11 ? `55${phone}` : phone;
                        const message = 'Olá, tudo bem? vim aqui para confirmar o seu agendamento de hoje, posso contar com a sua presença?';
                        const whatsappUrl = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
                        window.open(whatsappUrl, '_blank');
                      }}>
                        <MessageCircle size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Atendimentos Iniciados */}
            {atendimentosIniciados.length > 0 && (
              <div className="atendente-iniciados-section">
                <h3>Atendimentos Iniciados</h3>
                {atendimentosIniciados.map((appointment) => (
                  <div key={appointment.id} className="atendente-appointment-card iniciado">
                    <div className="atendente-appointment-time">
                      <Clock size={16} />
                      <span>{appointment.time}</span>
                    </div>
                    <div className="atendente-appointment-info">
                      <div className="atendente-client-info">
                        <h4>{appointment.clientName}</h4>
                        <p>{appointment.service}</p>
                        <div className="atendente-appointment-meta">
                          <span className="atendente-professional">
                            <User size={14} />
                            {appointment.professional}
                          </span>
                          <span className="atendente-price">
                            <DollarSign size={14} />
                            {receitaPrevistaHoje.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </span>
                        </div>
                      </div>
                      <div className="atendente-appointment-status">
                        <span className="atendente-status-badge" style={{ color: 'green', fontWeight: 'bold' }}>Atendimento iniciado</span>
                      </div>
                    </div>
                    <div className="atendente-appointment-actions">
                      <button className="atendente-btn-action-sm" title="Finalizar Atendimento" onClick={() => handleFinalizarAtendimento(appointment.id)}>
                        <Square size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Atendimentos Finalizados */}
            {atendimentosFinalizadosDoDia.length > 0 && (
              <div className="atendente-finalizados-section">
                <h3>Atendimentos Encerrados</h3>
                {atendimentosFinalizadosDoDia.map((appointment) => (
                  <div key={appointment.id} className="atendente-appointment-card finalizado">
                    <div className="atendente-appointment-time">
                      <Clock size={16} />
                      <span>{appointment.time}</span>
                    </div>
                    <div className="atendente-appointment-info">
                      <div className="atendente-client-info">
                        <h4>{appointment.clientName}</h4>
                        <p>{appointment.service}</p>
                        <div className="atendente-appointment-meta">
                          <span className="atendente-professional">
                            <User size={14} />
                            {appointment.professional}
                          </span>
                          <span className="atendente-price">
                            <DollarSign size={14} />
                            {receitaPrevistaHoje.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </span>
                        </div>
                      </div>
                      <div className="atendente-appointment-status">
                        <span className="atendente-status-badge" style={{ color: 'red', fontWeight: 'bold' }}>Atendimento finalizado</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Calendar View */}
        {currentView === "calendar" && (
          <div className="atendente-calendar-content">
            <div className="atendente-calendar-header">
              <div className="atendente-calendar-navigation">
                <button className="atendente-btn-nav" onClick={handlePrev}>
                  <ChevronLeft size={20} />
                </button>
                <h2>{selectedDate.toLocaleDateString("pt-BR")}</h2>
                <button className="atendente-btn-nav" onClick={handleNext}>
                  <ChevronRight size={20} />
                </button>
              </div> 
            </div>
            <div className="atendente-calendar-grid">
              <div className="atendente-calendar-weekdays">
                <div className="atendente-weekday">Dom</div>
                <div className="atendente-weekday">Seg</div>
                <div className="atendente-weekday">Ter</div>
                <div className="atendente-weekday">Qua</div>
                <div className="atendente-weekday">Qui</div>
                <div className="atendente-weekday">Sex</div>
                <div className="atendente-weekday">Sáb</div>
              </div>
              <div className="atendente-calendar-days">
                {currentView === 'calendar' && getMonthDays(selectedDate).map((day, i) => {
                  const dayISO = day.toISOString().split('T')[0];
                  const isToday = day.toDateString() === new Date().toDateString();
                  const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
                  const hasAppointments = agendamentosEstab.some(a => a.date === dayISO);
                  
                  return (
                    <div
                      key={i}
                      className={`atendente-calendar-day ${isToday ? "today" : ""} ${!isCurrentMonth ? "other-month" : ""}`}
                      onClick={() => handleDayClick(day)}
                      style={{ cursor: 'pointer', border: hasAppointments ? '2px solid #0ea5e9' : undefined }}
                    >
                      <span className="atendente-day-number">{day.getDate()}</span>
                      {hasAppointments && <div className="atendente-day-appointments"><div className="atendente-appointment-dot confirmed"></div></div>}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="atendente-calendar-legend">
              <div className="atendente-legend-item">
                <div className="atendente-legend-dot confirmed"></div>
                <span>Agendamento</span>
              </div>
            </div>
          </div>
        )}

        {/* Other views would go here */}
        {currentView !== "dashboard" && currentView !== "calendar" && (
          <div className="atendente-placeholder-content">
            <div className="atendente-placeholder-icon">
              <Zap size={48} />
            </div>
            <h2>Em Desenvolvimento</h2>
            <p>Esta seção está sendo desenvolvida e estará disponível em breve!</p>
          </div>
        )}
      </main>

      {/* Appointment Modal */}
      {showAppointmentModal && (
        <div className="atendente-modal-overlay" onClick={handleModalClose}>
          <div className="atendente-appointment-modal" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="atendente-modal-header">
              <div className="atendente-modal-title">
                <h2>Novo Agendamento</h2>
                <p>Passo {modalStep} de 4</p>
              </div>

              <div className="atendente-modal-progress">
                <div className="atendente-progress-bar">
                  <div className="atendente-progress-fill" style={{ width: `${(modalStep / 4) * 100}%` }}></div>
                </div>
                <div className="atendente-progress-steps">
                  {[1, 2, 3, 4].map((step) => (
                    <div key={step} className={`atendente-progress-step ${modalStep >= step ? "active" : ""}`}>
                      {modalStep > step ? <Check size={16} /> : step}
                    </div>
                  ))}
                </div>
              </div>

              <button className="atendente-modal-close" onClick={handleModalClose}>
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="atendente-modal-content">
              {/* Step 1: Client Information */}
              {modalStep === 1 && (
                <div className="atendente-modal-step">
                  <div className="atendente-step-header">
                    <div className="atendente-step-icon">
                      <User size={24} />
                    </div>
                    <div className="atendente-step-info">
                      <h3>Selecione o Cliente</h3>
                      <p>Escolha um cliente cadastrado para o agendamento</p>
                    </div>
                  </div>
                  {clientesLoading ? (
                    <div>Carregando clientes...</div>
                  ) : clientesEstab.length === 0 ? (
                    <div style={{ color: "red", margin: "16px 0" }}>
                      Nenhum cliente cadastrado.
                      <br />
                      <button
                        className="atendente-btn-primary"
                        onClick={() => navigate("/dashboardProfissional/" + auth.currentUser?.uid + "/clientes")}
                      >
                        Cadastrar Cliente
                      </button>
                    </div>
                  ) : (
                    <div className="atendente-clientes-list-modal">
                      {clientesEstab.map((cliente) => (
                        <label
                          key={cliente.id}
                          className={`atendente-cliente-select-card ${appointmentData.clientId === cliente.id ? "selected" : ""}`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            cursor: "pointer",
                            border: appointmentData.clientId === cliente.id ? "2px solid #0ea5e9" : "1px solid #ccc",
                            borderRadius: 8,
                            padding: 12,
                            marginBottom: 8,
                          }}
                        >
                          <input
                            type="radio"
                            name="selectCliente"
                            checked={appointmentData.clientId === cliente.id}
                            onChange={() =>
                              setAppointmentData((prev) => ({
                                ...prev,
                                clientId: cliente.id,
                                clientName: cliente.nome,
                                clientPhone: cliente.telefone,
                                clientEmail: cliente.email,
                              }))
                            }
                            style={{ marginRight: 12 }}
                          />
                          <div>
                            <div>
                              <strong>{cliente.nome}</strong>
                            </div>
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
                <div className="atendente-modal-step">
                  <div className="atendente-step-header">
                    <div className="atendente-step-icon">
                      <Scissors size={24} />
                    </div>
                    <div className="atendente-step-info">
                      <h3>Escolha o Serviço</h3>
                      <p>Selecione o serviço desejado</p>
                    </div>
                  </div>
                  {servicosLoading ? (
                    <div>Carregando serviços...</div>
                  ) : servicosFirestore.length === 0 ? (
                    <div style={{ color: "red", margin: "16px 0" }}>
                      Nenhum serviço cadastrado para este estabelecimento.
                      <br />
                    </div>
                  ) : (
                    <div className="atendente-services-grid">
                      {servicosFirestore.map((service) => (
                        <div
                          key={service.id}
                          className={`atendente-service-card ${appointmentData.service === service.nomeServico ? "selected" : ""}`}
                          onClick={() =>
                            setAppointmentData((prev) => ({
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
                            }))
                          }
                        >
                          <div className="atendente-service-info">
                            <h4>{service.nomeServico}</h4>
                            <p className="atendente-service-category">{service.categoriaServico}</p>
                            <div className="atendente-service-details">
                              <span className="atendente-service-duration">
                                <Clock size={14} />
                                {service.duracaoServico} min
                              </span>
                              <span className="atendente-service-price">
                                <DollarSign size={14} />
                                {receitaPrevistaHoje.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                              </span>
                            </div>
                            <div className="atendente-service-extra">
                              <div>
                                <strong>Profissionais:</strong>{" "}
                                {Array.isArray(service.profissionaisServico)
                                  ? service.profissionaisServico.join(", ")
                                  : ""}
                              </div>
                              <div>
                                <strong>Status:</strong> {service.servicoAtivo ? "Ativo" : "Inativo"}
                              </div>
                              <div>
                                <strong>Estabelecimento:</strong> {service.nomeEstabelecimento}
                              </div>
                            </div>
                          </div>
                          {appointmentData.service === service.nomeServico && (
                            <div className="atendente-service-selected">
                              <Check size={20} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Professional & Date/Time */}
              {modalStep === 3 && (
                <div className="atendente-modal-step">
                  <div className="atendente-step-header">
                    <div className="atendente-step-icon">
                      <Calendar size={24} />
                    </div>
                    <div className="atendente-step-info">
                      <h3>Data, Hora e Profissional</h3>
                      <p>Escolha quando e com quem</p>
                    </div>
                  </div>

                  <div className="atendente-datetime-grid">
                    <div className="atendente-form-group">
                      <label htmlFor="professional">Profissional *</label>
                      <select
                        id="professional"
                        value={appointmentData.professional}
                        onChange={(e) => setAppointmentData((prev) => ({ ...prev, professional: e.target.value }))}
                        required
                      >
                        <option value="">Selecione um profissional</option>
                        {profissionaisHabilitados.map((prof: string, idx: number) => (
                          <option key={idx} value={prof}>
                            {prof}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="atendente-form-group">
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

                    <div className="atendente-time-selection">
                      <label>Horário Disponível *</label>
                      <div className="atendente-time-grid">
                        {availableTimes.map((time) => (
                          <button
                            key={time}
                            type="button"
                            className={`atendente-time-slot ${appointmentData.time === time ? "selected" : ""}`}
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
                <div className="atendente-modal-step">
                  <div className="atendente-step-header">
                    <div className="atendente-step-icon">
                      <Check size={24} />
                    </div>
                    <div className="atendente-step-info">
                      <h3>Confirmação</h3>
                      <p>Revise os dados e finalize</p>
                    </div>
                  </div>

                  <div className="atendente-confirmation-content">
                    <div className="atendente-appointment-summary">
                      <h4>Resumo do Agendamento</h4>

                      <div className="atendente-summary-section">
                        <h5>Cliente</h5>
                        <p>{appointmentData.clientName}</p>
                        <p>{appointmentData.clientPhone}</p>
                        {appointmentData.clientEmail && <p>{appointmentData.clientEmail}</p>}
                      </div>

                      <div className="atendente-summary-section">
                        <h5>Serviço</h5>
                        <p>{appointmentData.service}</p>
                        <p>Duração: {appointmentData.duration} minutos</p>
                        <p className="atendente-price-highlight">Valor: {receitaPrevistaHoje.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                      </div>

                      <div className="atendente-summary-section">
                        <h5>Agendamento</h5>
                        <p>Profissional: {appointmentData.professional}</p>
                        <p>
                          Data: {appointmentData.date ? new Date(appointmentData.date).toLocaleDateString("pt-BR") : ""}
                        </p>
                        <p>Horário: {appointmentData.time}</p>
                      </div>
                    </div>

                    <div className="atendente-additional-options">
                      <div className="atendente-form-group">
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

                      <div className="atendente-form-group full-width">
                        <label htmlFor="notes">Observações</label>
                        <textarea
                          id="notes"
                          value={appointmentData.notes}
                          onChange={(e) => setAppointmentData((prev) => ({ ...prev, notes: e.target.value }))}
                          placeholder="Observações especiais, preferências do cliente..."
                          rows={3}
                        />
                      </div>

                      <div className="atendente-checkbox-group">
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
            <div className="atendente-modal-footer">
              <div className="atendente-footer-actions">
                {modalStep > 1 && (
                  <button className="atendente-btn-secondary" onClick={handlePrevStep}>
                    <ChevronLeft size={16} />
                    Voltar
                  </button>
                )}

                <div className="atendente-primary-actions">
                  <button className="atendente-btn-cancel" onClick={handleModalClose}>
                    Cancelar
                  </button>

                  {modalStep < 4 ? (
                    <button
                      className="atendente-btn-primary"
                      onClick={handleNextStep}
                      disabled={
                        (modalStep === 1 && !appointmentData.clientId) ||
                        (modalStep === 2 && !appointmentData.service) ||
                        (modalStep === 3 &&
                          (!appointmentData.professional || !appointmentData.date || !appointmentData.time))
                      }
                    >
                      Próximo
                      <ChevronRight size={16} />
                    </button>
                  ) : (
                    <button className="atendente-btn-success" onClick={handleSubmitAppointment}>
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
        <div className="atendente-modal-overlay" onClick={() => setShowDayModal(false)}>
          <div className="atendente-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="atendente-modal-header">
              <h2>Agendamentos de {selectedDay.toLocaleDateString("pt-BR")}</h2>
              <button className="atendente-modal-close" onClick={() => setShowDayModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="atendente-modal-body">
              {agendamentosDoDia(selectedDay).length === 0 ? (
                <p>Nenhum agendamento para este dia.</p>
              ) : (
                <ul>
                  {agendamentosDoDia(selectedDay).map((a, idx) => (
                    <li key={idx} style={{ marginBottom: 12, borderBottom: "1px solid #eee", paddingBottom: 8 }}>
                      <strong>Cliente:</strong> {a.clientName}
                      <br />
                      <strong>Serviço:</strong> {a.service}
                      <br />
                      <strong>Profissional:</strong> {a.professional}
                      <br />
                      <strong>Horário:</strong> {a.time}
                      <br />
                      <strong>Status:</strong> {a.status || "agendado"}
                      <br />
                      <strong>Telefone:</strong> {a.clientPhone}
                      <br />
                      <strong>Valor:</strong> {receitaPrevistaHoje.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Histórico Geral Modal */}
      {showHistoricoModal && (
        <div className="atendente-modal-overlay" onClick={() => setShowHistoricoModal(false)}>
          <div className="atendente-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="atendente-modal-header">
              <h2>Histórico de Atendimentos</h2>
              <button className="atendente-modal-close" onClick={() => setShowHistoricoModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="atendente-modal-body">
              {historicoGeral.length === 0 ? (
                <p>Nenhum atendimento finalizado ainda.</p>
              ) : (
                <ul>
                  {historicoGeral.map((a, idx) => (
                    <li key={idx} style={{ marginBottom: 12, borderBottom: "1px solid #eee", paddingBottom: 8 }}>
                      <strong>Cliente:</strong> {a.clientName}
                      <br />
                      <strong>Serviço:</strong> {a.service}
                      <br />
                      <strong>Profissional:</strong> {a.professional}
                      <br />
                      <strong>Data:</strong> {a.date}
                      <br />
                      <strong>Horário:</strong> {a.time}
                      <br />
                      <strong>Valor:</strong> {receitaPrevistaHoje.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AgendaAtendente
