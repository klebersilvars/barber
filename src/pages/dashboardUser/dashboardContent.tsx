import {
  Search,
  Bell,
  Plus,
  Eye,
  Users,
  Package,
  BarChart3,
  Download,
  Settings,
  Filter,
  DollarSign,
  Calendar,
  Star,
  Clock,
} from "lucide-react"

// Definir tipo para os agendamentos
interface Appointment {
  time: string;
  client: string;
  service: string;
  status: "confirmed" | "in-progress" | "pending";
}

export default function DashboardContent() {
  const stats = [
    {
      title: "Receita Hoje",
      value: "R$ 1.250,00",
      change: "+12%",
      icon: DollarSign,
      color: "green",
    },
    {
      title: "Agendamentos",
      value: "24",
      change: "+8%",
      icon: Calendar,
      color: "blue",
    },
    {
      title: "Clientes Ativos",
      value: "156",
      change: "+15%",
      icon: Users,
      color: "purple",
    },
    {
      title: "Avaliação Média",
      value: "4.8",
      change: "+0.2",
      icon: Star,
      color: "yellow",
    },
  ]

  const recentAppointments: Appointment[] = [
    /* Dados de agendamentos removidos */
  ]

  return (
    <>
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Painel de controle</h1>
          <p>Bem-vindo de volta! Aqui está o resumo do seu negócio hoje.</p>
        </div>
        <div className="header-right">
          <div className="search-box">
            <Search className="search-icon" />
            <input type="text" placeholder="Buscar..." />
          </div>
          <button className="notification-btn">
            <Bell size={20} />
            <span className="notification-badge">3</span>
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className={`stat-card ${stat.color}`}>
            <div className="stat-header">
              <span className="stat-title">{stat.title}</span>
              <stat.icon className="stat-icon" />
            </div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-change">
              <span className="change-positive">{stat.change}</span>
              <span>vs. ontem</span>
            </div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="content-grid">
        {/* Appointments Today */}
        <div className="content-card">
          <div className="card-header">
            <h3>Agendamentos de Hoje</h3>
            <div className="card-actions">
              <button className="action-btn">
                <Plus size={16} />
                Novo
              </button>
              <button className="action-btn secondary">
                <Eye size={16} />
                Ver Todos
              </button>
            </div>
          </div>
          <div className="appointments-list">
            {recentAppointments.map((appointment, index) => (
              <div key={index} className="appointment-item">
                <div className="appointment-time">
                  <Clock size={16} />
                  {appointment.time}
                </div>
                <div className="appointment-details">
                  <span className="client-name">{appointment.client}</span>
                  <span className="service-name">{appointment.service}</span>
                </div>
                <div className={`appointment-status ${appointment.status}`}>
                  {appointment.status === "confirmed" && "Confirmado"}
                  {appointment.status === "in-progress" && "Em Andamento"}
                  {appointment.status === "pending" && "Pendente"}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        {/* Seção removida */}

        {/* Recent Activity */}
        {/* Seção removida */}
      </div>
    </>
  )
} 