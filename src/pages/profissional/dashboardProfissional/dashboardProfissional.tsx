"use client"

import { useState, useEffect } from "react"
import "./dashboardProfissional.css"
import { useNavigate, useParams, Outlet, useLocation } from "react-router-dom"
import {
  Scissors,
  Users,
  Calendar,
  LogOut,
  User,
  Star,
  Clock,
  ChevronRight,
  X,
  Gift,
  Menu,
  CheckCircle,
  AlertCircle,
} from "lucide-react"

// Importar as funções de autenticação do Firebase
import { getAuth, signOut } from "firebase/auth"
import { firestore } from "../../../firebase/firebase"
import { collection, query, where, getDocs } from "firebase/firestore"

export default function DashboardProfissional() {
  const [menuCollapsed, setMenuCollapsed] = useState(false)
  const [showWelcome, setShowWelcome] = useState(true)
  const [profissionalNome, setProfissionalNome] = useState("")
  const [nomeEstabelecimento, setNomeEstabelecimento] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()
  const { uid } = useParams()
  const location = useLocation()
  const auth = getAuth()

  // Buscar dados do colaborador logado e nome do estabelecimento
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Buscar colaborador pelo authUserId
    const colaboradoresRef = collection(firestore, "colaboradores");
    const qColab = query(colaboradoresRef, where("authUserId", "==", user.uid));
    getDocs(qColab)
      .then((snapshot) => {
        if (!snapshot.empty) {
          const colaboradorData = snapshot.docs[0].data();
          setProfissionalNome(colaboradorData.nome || "");
          setNomeEstabelecimento(colaboradorData.estabelecimento || "");
        }
      })
      .catch(() => {
        setProfissionalNome("Erro ao carregar");
        setNomeEstabelecimento("");
      });
  }, []);

  const navigationItems = [
    { icon: Calendar, label: "Agenda Online", path: `/profissional/${uid}/agendaProfissional` },
    { icon: LogOut, label: "Sair da Conta", path: "#logout", className: "prof-logout-item" },
  ]

  const metricas = [
    {
      title: "Atendimentos Hoje",
      value: "0",
      change: "+5%",
      icon: Clock,
      color: "azul",
    },
    {
      title: "Próximos Agendamentos",
      value: "8",
      change: "+12%",
      icon: Calendar,
      color: "verde",
    },
    {
      title: "Clientes Atendidos",
      value: "45",
      change: "+18%",
      icon: Users,
      color: "roxo",
    },
    {
      title: "Avaliação Média",
      value: "4.9",
      change: "+0.1",
      icon: Star,
      color: "amarelo",
    },
  ]

  const proximosAtendimentos = [
    { horario: "14:00", cliente: "Ana Silva", servico: "Corte Feminino", status: "confirmado" },
    { horario: "15:30", cliente: "Carlos Santos", servico: "Barba", status: "em-andamento" },
    { horario: "16:00", cliente: "Maria Costa", servico: "Escova", status: "pendente" },
    { horario: "17:30", cliente: "João Oliveira", servico: "Corte Masculino", status: "confirmado" },
  ]

  const isItemAtivo = (itemPath: string) => {
    if (itemPath === `/profissional/${uid}`) {
      return location.pathname === itemPath || location.pathname === `/profissional/${uid}/`
    }
    return location.pathname.startsWith(itemPath)
  }

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        console.log("Profissional deslogado com sucesso!")
        navigate("/loginProfissional")
      })
      .catch((error) => {
        console.error("Erro ao deslogar:", error)
        alert("Erro ao deslogar: " + error.message)
      })
  }

  return (
    <div className="prof-dashboard-wrapper">
      {/* Banner de Boas-vindas */}
      {showWelcome && (
        <div className="prof-welcome-banner">
          <div className="prof-welcome-content">
            <Gift className="prof-welcome-icon" />
            <span>
              👋 Bem-vindo, <strong>{profissionalNome}</strong>! Gerencie seus atendimentos com facilidade.
            </span>
            <button className="prof-welcome-btn">Ver Agenda</button>
          </div>
          <button className="prof-welcome-close" onClick={() => setShowWelcome(false)}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Layout Principal */}
      <div className="prof-main-layout">
        {/* Menu Lateral */}
        <nav className={`prof-sidebar ${menuCollapsed ? "prof-collapsed" : ""}`}>
          <div className="prof-sidebar-header">
            <div className="prof-brand">
              <Scissors className="prof-brand-icon" />
              {!menuCollapsed && <span>Trezu</span>}
            </div>
            <button className="prof-sidebar-toggle" onClick={() => setMenuCollapsed(!menuCollapsed)}>
              <ChevronRight className={menuCollapsed ? "" : "prof-rotated"} />
            </button>
          </div>

          <div className="prof-sidebar-nav">
            {navigationItems.map((item, index) => (
              <a
                key={index}
                href="#"
                className={`prof-nav-item ${isItemAtivo(item.path) ? "prof-active" : ""} ${item.className || ""}`}
                onClick={(e) => {
                  e.preventDefault()
                  if (item.path === "#logout") {
                    handleLogout()
                  } else {
                    navigate(item.path)
                  }
                  setMobileMenuOpen(false)
                }}
              >
                <item.icon className="prof-nav-icon" />
                {!menuCollapsed && <span>{item.label}</span>}
              </a>
            ))}
          </div>

          <div className="prof-sidebar-footer">
            <div className="prof-user-profile">
              <div className="prof-user-avatar">
                <User size={20} />
              </div>
              {!menuCollapsed && (
                <div className="prof-user-info">
                  <span className="prof-user-name">{profissionalNome || "Carregando..."}</span>
                  <span className="prof-user-role">
                    Profissional{nomeEstabelecimento ? ` do ${nomeEstabelecimento}` : ""}
                  </span>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Menu Mobile Fixo */}
        <div className="prof-mobile-nav">
          <button className="prof-mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <Menu size={24} />
          </button>

          <div className="prof-mobile-brand">
            <Scissors className="prof-mobile-brand-icon" />
            <span>Trezu Pro</span>
          </div>

          <div className="prof-mobile-user">
            <User size={20} />
          </div>
        </div>

        {/* Overlay Menu Mobile */}
        {mobileMenuOpen && (
          <div className="prof-mobile-overlay" onClick={() => setMobileMenuOpen(false)}>
            <div className="prof-mobile-menu" onClick={(e) => e.stopPropagation()}>
              <div className="prof-mobile-menu-header">
                <div className="prof-mobile-menu-brand">
                  <Scissors className="prof-mobile-menu-brand-icon" />
                  <span>Trezu Pro</span>
                </div>
                <button className="prof-mobile-menu-close" onClick={() => setMobileMenuOpen(false)}>
                  <X size={24} />
                </button>
              </div>

              <div className="prof-mobile-menu-nav">
                {navigationItems.map((item, index) => (
                  <a
                    key={index}
                    href="#"
                    className={`prof-mobile-nav-item ${isItemAtivo(item.path) ? "prof-active" : ""} ${item.className || ""}`}
                    onClick={(e) => {
                      e.preventDefault()
                      if (item.path === "#logout") {
                        handleLogout()
                      } else {
                        navigate(item.path)
                      }
                      setMobileMenuOpen(false)
                    }}
                  >
                    <item.icon className="prof-mobile-nav-icon" />
                    <span>{item.label}</span>
                  </a>
                ))}
              </div>

              <div className="prof-mobile-menu-footer">
                <div className="prof-mobile-user-profile">
                  <div className="prof-mobile-user-avatar">
                    <User size={24} />
                  </div>
                  <div className="prof-mobile-user-info">
                    <span className="prof-mobile-user-name">{profissionalNome || "Carregando..."}</span>
                    <span className="prof-mobile-user-role">Profissional</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Conteúdo Principal */}
        <main className="prof-main-content">
          {location.pathname === `/profissional/${uid}` || location.pathname === `/profissional/${uid}/` ? (
            <>
              {/* Header do Dashboard */}
              <div className="prof-dashboard-header">
                <div className="prof-header-left">
                  <h1>Área do Profissional</h1>
                  <p>Gerencie seus atendimentos e clientes de forma eficiente</p>
                </div>
              </div>

              {/* Grid de Métricas */}
              <div className="prof-metrics-grid">
                {metricas.map((metrica, index) => (
                  <div key={index} className={`prof-metric-card prof-${metrica.color}`}>
                    <div className="prof-metric-header">
                      <span className="prof-metric-title">{metrica.title}</span>
                      <metrica.icon className="prof-metric-icon" />
                    </div>
                    <div className="prof-metric-value">{metrica.value}</div>
                    <div className="prof-metric-change">
                      <span className="prof-change-positive">{metrica.change}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Conteúdo do Dashboard */}
              <div className="prof-content-grid">
                <div className="prof-content-card">
                  <div className="prof-card-header">
                    <h3>Próximos Atendimentos</h3>
                    <button className="prof-action-btn">
                      <Calendar size={16} />
                      Ver Agenda
                    </button>
                  </div>
                  <div className="prof-appointments-list">
                    {proximosAtendimentos.map((atendimento, index) => (
                      <div key={index} className="prof-appointment-item">
                        <div className="prof-appointment-time">
                          <Clock size={16} />
                          {atendimento.horario}
                        </div>
                        <div className="prof-appointment-details">
                          <div className="prof-client-name">{atendimento.cliente}</div>
                          <div className="prof-service-name">{atendimento.servico}</div>
                        </div>
                        <div className={`prof-appointment-status prof-${atendimento.status}`}>
                          {atendimento.status === "confirmado" && <CheckCircle size={12} />}
                          {atendimento.status === "em-andamento" && <Clock size={12} />}
                          {atendimento.status === "pendente" && <AlertCircle size={12} />}
                          {atendimento.status.charAt(0).toUpperCase() + atendimento.status.slice(1)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="prof-content-card">
                  <div className="prof-card-header">
                    <h3>Ações Rápidas</h3>
                  </div>
                  <div className="prof-quick-actions">
                    <button className="prof-quick-action" onClick={() => navigate(`/profissional/${uid}/clientes`)}>
                      <Users className="prof-action-icon" />
                      <span>Gerenciar Clientes</span>
                    </button>
                    <button className="prof-quick-action" onClick={() => navigate(`/profissional/${uid}/agendaProfissional`)}>
                      <Calendar className="prof-action-icon" />
                      <span>Ver Agenda</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  )
}
