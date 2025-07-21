"use client"

import { useState, useEffect } from "react"
import "./dashboardUser.css"
import { useNavigate, useParams, Outlet, useLocation } from "react-router-dom"
import {
  Scissors,
  Home,
  CreditCard,
  ShoppingCart,
  TrendingDown,
  Package,
  Shield,
  HelpCircle,
  Bell,
  Search,
  ChevronRight,
  User,
  X,
  Clock
} from "lucide-react"
import { HamburgerIcon } from "@chakra-ui/icons"

// Importar as funções de autenticação do Firebase
import { getAuth, signOut } from "firebase/auth";
import { firestore } from '../../firebase/firebase';
import { collection, query, where, getDocs, Timestamp, doc, updateDoc, getDoc } from 'firebase/firestore';
import Modal from "./Modal"

export default function DashboardUser() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showPromotion, setShowPromotion] = useState(true)
  const [estabelecimentoNome, setEstabelecimentoNome] = useState("")
  const [isPremium, setIsPremium] = useState(true)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [diasRestantesTeste, setDiasRestantesTeste] = useState<number | null>(null)
  const [testeGratisAtivo, setTesteGratisAtivo] = useState(false)
  const navigate = useNavigate()
  const { uid } = useParams()
  const location = useLocation()
  const auth = getAuth(); // Inicializar o Auth
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [tipoPlano, setTipoPlano] = useState<string | null>(null)
  const [dataInicioTesteGratis, setDataInicioTesteGratis] = useState<string | null>(null)

  // Buscar nome do estabelecimento e receita do dia
  useEffect(() => {
    if (!uid) return;

    // Buscar nome do estabelecimento e status premium
    const contasRef = collection(firestore, 'contas');
    const qConta = query(contasRef, where('__name__', '==', uid));
    getDocs(qConta).then(snapshot => {
      if (!snapshot.empty) {
        const contaData = snapshot.docs[0].data();
        const nomeDoEstabelecimento = contaData.nomeEstabelecimento || '';
        setEstabelecimentoNome(nomeDoEstabelecimento);
        setIsPremium(contaData.premium === true); // premium só se for true MESMO
        setTipoPlano(contaData.tipoPlano || null);
        setDataInicioTesteGratis(contaData.data_inicio_teste_gratis || null);

        // Obter data atual e data 24 horas atrás
        const agora = new Date();
        const vinteQuatroHorasAtras = new Date(agora.getTime() - 24 * 60 * 60 * 1000);

        // Converter para Timestamps do Firestore
        const timestampVinteQuatroHorasAtras = Timestamp.fromDate(vinteQuatroHorasAtras);
        const timestampAgora = Timestamp.fromDate(agora);

        // Buscar receita das últimas 24 horas usando o nome do estabelecimento
        const vendasRef = collection(firestore, 'vendas');
        const qVendas = query(
          vendasRef,
          where('empresaNome', '==', nomeDoEstabelecimento), // Filtrar pelo nome da empresa
          where('dataVenda', '>=', timestampVinteQuatroHorasAtras),
          where('dataVenda', '<=', timestampAgora) // Incluir vendas até o momento atual
        );

        getDocs(qVendas).then(snapshot => {
          let totalReceita = 0;
          snapshot.docs.forEach(doc => {
            const venda = doc.data();
            totalReceita += venda.valor || 0;
          });
          // setReceitaHoje(totalReceita); // Removido
        }).catch(error => {
          console.error("Erro ao buscar vendas por nome da empresa (últimas 24h): ", error);
          // setReceitaHoje(0); // Removido
        });
      }
    }).catch(error => {
      console.error("Erro ao buscar nome do estabelecimento: ", error);
      setEstabelecimentoNome('Erro ao carregar nome');
      // setReceitaHoje(0); // Removido
    });
  }, [uid]);

  // Função para ativar o teste grátis
  const ativarTesteGratis = async () => {
    if (!auth.currentUser?.uid) return
    const docRef = doc(firestore, 'contas', auth.currentUser.uid)
    const hoje = new Date()
    await updateDoc(docRef, {
      premium: true,
      data_inicio_teste_gratis: hoje.toISOString(),
      dias_restantes_teste_gratis: 7
    })
    setIsPremium(true)
    setShowPromotion(false)
    setTesteGratisAtivo(true)
    setDiasRestantesTeste(7)
  }

  // Lógica para calcular dias restantes e atualizar Firestore
  useEffect(() => {
    if (!uid) return;
    const checkTesteGratis = async () => {
      const docRef = doc(firestore, 'contas', uid)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const data = docSnap.data()
        // Se nunca usou o teste grátis
        if (!data.data_inicio_teste_gratis) {
          setTesteGratisAtivo(false)
          setDiasRestantesTeste(null)
          setShowPromotion(true)
          return;
        }
        // Se está em teste grátis
        if (data.data_inicio_teste_gratis) {
          const inicio = new Date(data.data_inicio_teste_gratis)
          // setDataInicioTeste(inicio) // Removido
          setTesteGratisAtivo(true)
          const hoje = new Date()
          // Zera hora/min/seg para comparar só o dia
          const inicioDia = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate())
          const hojeDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
          const diff = Math.floor((hojeDia.getTime() - inicioDia.getTime()) / (1000 * 60 * 60 * 24))
          const diasRestantes = Math.max(0, 7 - diff)
          setDiasRestantesTeste(diasRestantes)
          // Só atualiza no Firestore se mudou E for um novo dia
          if (data.dias_restantes_teste_gratis !== diasRestantes && hoje.getHours() === 0) {
            await updateDoc(docRef, { dias_restantes_teste_gratis: diasRestantes })
          }
          // Se acabou o teste grátis
          if (diasRestantes <= 0 && data.premium && data.data_inicio_teste_gratis) {
            await updateDoc(docRef, {
              premium: false,
              data_inicio_teste_gratis: null,
              dias_restantes_teste_gratis: null
            })
            setIsPremium(false)
            setShowPromotion(false)
            setTesteGratisAtivo(false)
            setDiasRestantesTeste(null)
            // setDataInicioTeste(null) // Removido
          }
        }
      }
    }
    checkTesteGratis()
  }, [uid])

  // Removido: const formatCurrency = (value: number) => { ... }

  const menuItems = [
    { icon: Home, label: "Início", active: true, path: `/dashboard/${uid}`, premiumRequired: true },
    { icon: CreditCard, label: "Plano e Pagamento", path: `/dashboard/${uid}/plano` },
    { icon: ShoppingCart, label: "Vendas", path: `/dashboard/${uid}/vendas`, premiumRequired: true },
    { icon: TrendingDown, label: "Despesas", path: `/dashboard/${uid}/despesas`, premiumRequired: true },
    { icon: Shield, label: "Clientes", path: `/dashboard/${uid}/cliente`, premiumRequired: true },
    { icon: HelpCircle, label: "Colaboradores", path: `/dashboard/${uid}/colaboradores`, premiumRequired: true },
    { icon: Package, label: "Serviços", path: `/dashboard/${uid}/servicos`, premiumRequired: true },
    { icon: Clock, label: "Agenda Online", path: `/dashboard/${uid}/agenda`, premiumRequired: true },
    { icon: Search, label: "Configurações", path: `/dashboard/${uid}/configuracoes` },
    { icon: Bell, label: "Sair da Conta", path: "#logout", className: "logout-item" },
  ]

  // Páginas permitidas para plano individual
  const allowedPathsIndividual = [
    `/dashboard/${uid}/agenda`,
    `/dashboard/${uid}/cliente`,
    `/dashboard/${uid}/vendas`,
    `/dashboard/${uid}/despesas`,
    `/dashboard/${uid}`
  ];

  // Páginas permitidas para premium grátis (7 dias)
  const allowedPathsTesteGratis = [
    `/dashboard/${uid}/agenda`,
    `/dashboard/${uid}/configuracoes`,
    `/dashboard/${uid}/servicos`,
    `/dashboard/${uid}`
  ];

  const isMenuItemActive = (itemPath: string) => {
    if (itemPath === `/dashboard/${uid}`) {
      return location.pathname === itemPath || location.pathname === `/dashboard/${uid}/`;
    }
    return location.pathname.startsWith(itemPath);
  };

  // Função para lidar com o logout
  const handleLogout = () => {
    signOut(auth).then(() => {
      // Logout bem-sucedido
      console.log("Usuário deslogado com sucesso!");
      navigate('/login'); // Redirecionar para a página de login
    }).catch((error) => {
      // Ocorreu um erro durante o logout
      console.error("Erro ao deslogar:", error);
      alert("Erro ao deslogar: " + error.message);
    });
  };

  // Garante que todos os itens têm 'disabled' para evitar erro de tipagem
  const menuItemsWithDisabled = menuItems.map(item => ({ ...item, disabled: false }));
  let filteredMenuItems = menuItemsWithDisabled;
  if (tipoPlano === 'individual') {
    filteredMenuItems = menuItemsWithDisabled.map(item => ({
      ...item,
      disabled: !allowedPathsIndividual.includes(item.path)
    }));
  } else if (dataInicioTesteGratis && isPremium) {
    filteredMenuItems = menuItemsWithDisabled.map(item => ({
      ...item,
      disabled: !allowedPathsTesteGratis.includes(item.path)
    }));
  }

  return (
    <div className="dashboard-container">
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
              <Scissors className="logo-icon" />
              <span style={{ fontWeight: 700, fontSize: 20 }}>Trezu</span>
            </div>
            <button onClick={() => setMobileMenuOpen(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}><X size={24} /></button>
          </div>
          <nav style={{ flex: 1, padding: '16px 0' }}>
            {filteredMenuItems.map((item, index) => {
              const isDisabled = (tipoPlano === 'individual' && item.disabled) || (item.premiumRequired && !isPremium);
              return (
                <button
                  key={index}
                  className={`dashboard-mobile-menu-item${isDisabled ? ' nav-item-disabled' : ''}`}
                  style={{
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    padding: '12px 24px',
                    fontSize: 16,
                    color: isDisabled ? '#aaa' : '#222',
                    opacity: isDisabled ? 0.5 : 1,
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                  onClick={e => {
                    e.preventDefault();
                    if (isDisabled) {
                      return;
                    }
                    setMobileMenuOpen(false);
                    if (item.path === "#logout") {
                      handleLogout();
                    } else {
                      navigate(item.path);
                    }
                  }}
                  disabled={isDisabled}
                >
                  <item.icon className="nav-icon" />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>
          <div style={{ padding: 16, borderTop: '1px solid #eee', fontSize: 14, color: '#888' }}>
            <div style={{ fontWeight: 600 }}>{estabelecimentoNome || 'Carregando...'}</div>
            <div>Proprietário</div>
          </div>
        </div>
      </div>
      {/* Promotion Banner */}
      {showPromotion && !testeGratisAtivo && (
        <div className="promotion-banner" style={{ position: 'relative' }}>
          <button
            className="dashboard-hamburger-btn"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Abrir menu"
            type="button"
          >
            <HamburgerIcon fontSize="28px" color="#5d3fd3" aria-hidden="true" />
            <span style={{ display: 'none' }}>Abrir menu</span>
          </button>
          <div className="promotion-content" style={{ marginLeft: 48 }}>
            <Package className="promotion-icon" />
            <span>
              🎉 Você tem acesso à <strong>Avaliação Grátis</strong> da sua conta! Aproveite agora!
            </span>
            <button
              className="promotion-btn"
              onClick={ativarTesteGratis}
              disabled={diasRestantesTeste === 0 || diasRestantesTeste === null}
              style={diasRestantesTeste === 0 || diasRestantesTeste === null ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            >
              Ativar Agora
            </button>
          </div>
          <button className="promotion-close" onClick={() => setShowPromotion(false)}>
            <X size={16} />
          </button>
        </div>
      )}
      {showPromotion && testeGratisAtivo && diasRestantesTeste !== null && diasRestantesTeste > 0 && (
        <div className="promotion-banner" style={{ position: 'relative' }}>
          <button
            className="dashboard-hamburger-btn"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Abrir menu"
            type="button"
          >
            <HamburgerIcon fontSize="28px" color="#5d3fd3" aria-hidden="true" />
            <span style={{ display: 'none' }}>Abrir menu</span>
          </button>
          <div className="promotion-content" style={{ marginLeft: 48 }}>
            <Package className="promotion-icon" />
            <span>
              🕒 Seu teste grátis está ativo! <strong>{diasRestantesTeste} {diasRestantesTeste === 1 ? 'dia restante' : 'dias restantes'}</strong> de Premium.
            </span>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="main-layout">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
          <div className="sidebar-header">
            <div className="logo">
              <Scissors className="logo-icon" />
              {!sidebarCollapsed && <span>Trezu</span>}
            </div>
            <button className="sidebar-toggle" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
              <ChevronRight className={sidebarCollapsed ? "" : "rotated"} />
            </button>
          </div>

          <nav className="sidebar-nav">
            {filteredMenuItems.map((item, index) => {
              const isDisabled = (tipoPlano === 'individual' && item.disabled) || (item.premiumRequired && !isPremium);
              return (
                <a
                  key={index}
                  href="#"
                  className={`nav-item ${isMenuItemActive(item.path) ? "active" : ""} ${item.className || ""} ${isDisabled ? "nav-item-disabled" : ""}`}
                  onClick={e => {
                    e.preventDefault();
                    if (isDisabled) {
                      return;
                    }
                    if (item.path === "#logout") {
                      handleLogout();
                    } else {
                      navigate(item.path);
                    }
                  }}
                  style={isDisabled ? { pointerEvents: 'auto', opacity: 0.5, cursor: 'not-allowed' } : {}}
                  tabIndex={isDisabled ? -1 : 0}
                  aria-disabled={isDisabled}
                >
                  <item.icon className="nav-icon" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </a>
              )
            })}
          </nav>

          <div className="sidebar-footer">
            <div className="user-profile">
              <div className="user-avatar">
                <User size={20} />
              </div>
              {!sidebarCollapsed && (
                <div className="user-info">
                  <span className="user-name">{estabelecimentoNome || 'Carregando...'}</span>
                  <span className="user-role">Proprietário</span>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {location.pathname === `/dashboard/${uid}` || location.pathname === `/dashboard/${uid}/` ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              padding: '48px 0',
              textAlign: 'center',
            }}>
              <h1 style={{ fontSize: 32, marginBottom: 16 }}>Bem-vindo à tela de administração do salão!</h1>
              {!isPremium && (
                <>
                  <p style={{ fontSize: 18, color: '#6366f1', marginBottom: 32 }}>
                    Para liberar todos os recursos, ative o <strong>Premium</strong> agora mesmo e tenha acesso completo à plataforma.
                  </p>
                  <button className="btn-primary" style={{ fontSize: 18, padding: '12px 32px' }} onClick={() => navigate(`/dashboard/${uid}/plano`)}>
                    Ativar Premium
                  </button>
                </>
              )}
              {isPremium && testeGratisAtivo && diasRestantesTeste !== null && diasRestantesTeste > 0 && (
                <div style={{ fontSize: 20, color: '#2563eb', fontWeight: 600, marginTop: 16 }}>
                  🕒 Seu teste grátis está ativo! <strong>{diasRestantesTeste} {diasRestantesTeste === 1 ? 'dia restante' : 'dias restantes'}</strong> de Premium.
                </div>
              )}
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>

      {/* Modal de bloqueio Premium */}
      <Modal showPremiumModal={showPremiumModal} setShowPremiumModal={setShowPremiumModal} navigate={navigate} uid={uid as string} ativarTesteGratis={ativarTesteGratis} testeGratisAtivo={testeGratisAtivo} diasRestantesTeste={diasRestantesTeste} />
    </div>
  )
}
