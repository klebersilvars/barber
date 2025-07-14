"use client"

import type React from "react"
import './dashboardAtendente.css'

import { useState, useEffect } from "react"
import {
  Headset,
  ShoppingCart,
  Users,
  Calendar,
  User,
  Gift,
  Bell,
  Search,
  BarChart3,
  Clock,
  Star,
  ChevronRight,
  Plus,
  Filter,
  Download,
  Eye,
  X,
  LogOut,
  MessageCircle,
  CheckCircle,
  Phone,
  Menu as MenuIcon,
} from "lucide-react"
import { useParams, useNavigate, Outlet, useLocation } from "react-router-dom"
import { firestore, auth } from "../../firebase/firebase"
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore"
import { getAuth, signOut } from "firebase/auth"

const DashboardAtendente: React.FC = () => {
  const { uid } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showPromotion, setShowPromotion] = useState(true)
  const [estabelecimento, setEstabelecimento] = useState<string>("")
  const [colaboradorNome, setColaboradorNome] = useState<string>("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const menuItems = [
    { icon: MessageCircle, label: "Página Inicial", active: true, path: `/acessoAtendente/${uid}` },
    { icon: ShoppingCart, label: "Vendas", path: `/acessoAtendente/${uid}/vendas` },
    { icon: Users, label: "Clientes", path: `/acessoAtendente/${uid}/clientes` },
    { icon: Calendar, label: "Agenda Online", path: `/acessoAtendente/${uid}/agendaAtendente` },
    { icon: LogOut, label: "Sair da Conta", path: "#logout", className: "logout-item" },
  ]

  const stats = [
    {
      title: "Atendimentos Hoje",
      value: "18",
      change: "+5%",
      icon: MessageCircle,
      color: "green",
    },
    {
      title: "Chamados Resolvidos",
      value: "42",
      change: "+12%",
      icon: CheckCircle,
      color: "blue",
    },
    {
      title: "Clientes Atendidos",
      value: "89",
      change: "+8%",
      icon: Users,
      color: "purple",
    },
    {
      title: "Avaliação Média",
      value: "4.9",
      change: "+0.1",
      icon: Star,
      color: "yellow",
    },
  ]

  const recentAppointments = [
    { time: "09:00", client: "Maria Silva", service: "Suporte Técnico", status: "confirmed" },
    { time: "10:30", client: "Ana Costa", service: "Dúvida sobre Produto", status: "in-progress" },
    { time: "11:00", client: "João Santos", service: "Reclamação", status: "pending" },
    { time: "14:00", client: "Carla Oliveira", service: "Cancelamento", status: "confirmed" },
    { time: "15:30", client: "Pedro Lima", service: "Informações", status: "confirmed" },
  ]

  useEffect(() => {
    async function fetchDados() {
      if (!uid) return
      // Busca o colaborador pelo uid
      const colaboradorDoc = await getDoc(doc(firestore, "colaboradores", uid))
      if (colaboradorDoc.exists()) {
        const data = colaboradorDoc.data()
        setColaboradorNome(data.nome || "")
        setEstabelecimento(data.estabelecimento || "Estabelecimento não encontrado")
        // Exportar para uso global (window)
        // @ts-ignore
        window.nomeEstabelecimentoAtendente = data.estabelecimento || ""
      }
    }
    fetchDados()
  }, [uid])

  useEffect(() => {
    if (!auth.currentUser || !auth.currentUser.email) return;
    const colaboradoresRef = collection(firestore, "colaboradores");
    const q = query(colaboradoresRef, where("email", "==", auth.currentUser.email));
    getDocs(q).then((snapshot) => {
      if (!snapshot.empty) {
        const docData = snapshot.docs[0].data();
      } else {
        console.log(
          "Nenhum colaborador encontrado com o e-mail:",
          auth.currentUser ? auth.currentUser.email : "usuário não logado"
        );
      }
    }).catch((error) => {
      console.error("Erro ao buscar colaborador:", error);
    });
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/atendente');
    } catch (error) {
      console.error('Erro ao deslogar:', error);
      alert('Erro ao sair da conta. Tente novamente.');
    }
  }

  const isMenuItemActive = (itemPath: string) => {
    if (itemPath === `/acessoAtendente/${uid}`) {
      return location.pathname === itemPath || location.pathname === `/acessoAtendente/${uid}/`;
    }
    return location.pathname.startsWith(itemPath);
  }

  return (
    <div className="dashboard-container">
      {/* Botão do menu hambúrguer - só exibe em mobile/tablet */}
      <button
        className="dashboard-hamburger-btn"
        onClick={() => setMobileMenuOpen(true)}
      >
        <MenuIcon size={28} />
      </button>

      {/* Drawer lateral do menu mobile */}
      <div
        className={`dashboard-mobile-menu-overlay${mobileMenuOpen ? ' active' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      >
        <div
          className={`dashboard-mobile-menu${mobileMenuOpen ? ' open' : ''}`}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottom: '1px solid #eee' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Headset className="logo-icon" />
              <span style={{ fontWeight: 700, fontSize: 20 }}>Trezu</span>
            </div>
            <button onClick={() => setMobileMenuOpen(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}><X /></button>
          </div>
          <nav style={{ flex: 1, padding: '16px 0' }}>
            {menuItems.map((item, index) => (
              <button
                key={index}
                className={`dashboard-mobile-menu-item${item.className ? ' ' + item.className : ''}`}
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  padding: '12px 24px',
                  fontSize: 16,
                  color: '#222',
                  opacity: 1,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
                onClick={e => {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                  if (item.path === "#logout") {
                    handleLogout();
                  } else {
                    navigate(item.path);
                  }
                }}
              >
                <item.icon className="nav-icon" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          <div style={{ padding: 16, borderTop: '1px solid #eee', fontSize: 14, color: '#888' }}>
            <div style={{ fontWeight: 600 }}>{colaboradorNome || 'Carregando...'}</div>
            <div>{estabelecimento ? `Atendente do ${estabelecimento}` : 'Atendente'}</div>
          </div>
        </div>
      </div>

      {/* Promotion Banner */}
      {showPromotion && (
        <div className="promotion-banner">
          <div className="promotion-content">
            <Gift className="promotion-icon" />
            <span>
              🎉 Você tem acesso ao <strong>Painel de Atendente Premium</strong>! Aproveite todas as funcionalidades!
            </span>
            <button className="promotion-btn">Explorar Agora</button>
          </div>
          <button className="promotion-close" onClick={() => setShowPromotion(false)}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Main Layout */}
      <div className="main-layout">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
          <div className="sidebar-header">
            <div className="logo">
              <Headset className="logo-icon" />
              {!sidebarCollapsed && <span>Trezu</span>}
            </div>
            <button className="sidebar-toggle" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
              <ChevronRight className={sidebarCollapsed ? "" : "rotated"} />
            </button>
          </div>

          <nav className="sidebar-nav">
            {menuItems.map((item, index) => (
              <a
                key={index}
                href="#"
                className={`nav-item ${isMenuItemActive(item.path) ? "active" : ""} ${item.className || ""}`}
                onClick={(e) => {
                  e.preventDefault()
                  if (item.path === "#logout") {
                    handleLogout()
                  } else {
                    navigate(item.path)
                  }
                }}
              >
                <item.icon className="nav-icon" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </a>
            ))}
          </nav>

          <div className="sidebar-footer">
            <div className="user-profile">
              <div className="user-avatar">
                <User size={20} />
              </div>
              {!sidebarCollapsed && (
                <div className="user-info">
                  <span className="user-name">{colaboradorNome}</span>
                  <span className="user-role">{estabelecimento ? `Atendente do ${estabelecimento}` : 'Atendente'}</span>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardAtendente
