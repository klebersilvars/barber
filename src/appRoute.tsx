import { BrowserRouter, Routes, Route } from "react-router-dom"
import PageLogin from "./pages/pageLogin"
import CadastroContas from "./pages/cadastroContas/cadastroContas"
import PageHome from "./pages/pageHome/pageHome"
import CadastrarUser from "./pages/cadastrarUser/cadastrarUser"
import DashboardUser from "./pages/dashboardUser/dashboardUser"
import DashboardContent from "./pages/dashboardUser/dashboardContent"
import Plano from "./pages/admin/planos/plano"
import Cliente from "./pages/admin/clientes/cliente"
import Colaboradores from "./pages/admin/colaboradores/colaboradores"
import Atendente from "./pages/atendente/atendente"
import DashboardAtendente from "./pages/dashboardAtendente/dashboardAtendente"
import Vendas from "./pages/admin/vendas/vendas"
import VendasAtendente from "./pages/vendasAtendente/vendasAtendente"
import DespesasAdmin from "./pages/admin/despesasAdmin/despesasAdmin"
import Servicos from './pages/admin/servicos/servicos'
import AgendaAdmin from "./pages/admin/agendaAdmin/agendaAdmin"
import ConfiguracoesAdmin from "./pages/admin/configuracoesAdmin/configuracoesAdmin"
import LoginProfissional from "./pages/profissional/loginProfissional/loginProfissional"
import DashboardProfissional from "./pages/profissional/dashboardProfissional/dashboardProfissional"
import AgendaProfissional from "./pages/profissional/agendaProfissional/agendaProfissional"
import ClienteAtendente from "./pages/configAtendente/clienteAtendente/clienteAtendente"
import AgendaAtendente from "./pages/configAtendente/agendaAtendente/agendaAtendente"
import AgendaCliente from "./pages/cliente/pageAgendaCliente/agendaCliente"
import RequireAuth from "./components/RequireAuth"
import PageErro from "./pages/pageErro/pageErro"
import LoginFundador from "./pages/fundador/LoginPage/LoginFundador"

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PageLogin />} />
        <Route path="/loginProfissional" element={<LoginProfissional />} />
        <Route path="/cadastro" element={<CadastrarUser />} />
        <Route path="/agendar/:slug" element={<AgendaCliente />} />
        <Route path="/clienteAtendente" element={<RequireAuth><ClienteAtendente /></RequireAuth>} />
        <Route path="/dashboardProfissional/:uid" element={<RequireAuth><DashboardProfissional /></RequireAuth>} />
        <Route path="/agenda" element={<RequireAuth><AgendaProfissional /></RequireAuth>} />
        <Route path="/atendente" element={<Atendente />} />
        <Route path="/cadastroadmin" element={<RequireAuth><CadastroContas /></RequireAuth>} />
        <Route path="/acessoAtendente/:uid" element={<RequireAuth><DashboardAtendente /></RequireAuth>} >
          <Route path="vendas" element={<RequireAuth><VendasAtendente /></RequireAuth>} />
          <Route path="clientes" element={<RequireAuth><ClienteAtendente /></RequireAuth>} />
          <Route path="agendaAtendente" element={<RequireAuth><AgendaAtendente /></RequireAuth>} />
        </Route>
        <Route path="/dashboard/:uid" element={<RequireAuth><DashboardUser /></RequireAuth>} >
          <Route index element={<DashboardContent />} />
          <Route path="plano" element={<Plano />} />
          <Route path="cliente" element={<Cliente />} />
          <Route path="colaboradores" element={<Colaboradores />} />
          <Route path="vendas" element={<Vendas />} />
          <Route path="despesas" element={<DespesasAdmin />} />
          <Route path="servicos" element={<Servicos />} />
          <Route path="agenda" element={<AgendaAdmin />} />
          <Route path="configuracoes" element={<ConfiguracoesAdmin />} />
        </Route>
        <Route path="/profissional/:uid" element={<RequireAuth><DashboardProfissional /></RequireAuth>} >
          <Route path="agendaProfissional" element={<AgendaProfissional />} />
        </Route>
        <Route path="/" element={<PageHome />} />
        <Route path="*" element={<PageErro />} />
        <Route path="/fundador" element={<LoginFundador />} />
      </Routes>
    </BrowserRouter>
  )
}
