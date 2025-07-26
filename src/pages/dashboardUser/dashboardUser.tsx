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
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import Modal from "./Modal"
import { Box, Heading, Text, Stack } from "@chakra-ui/react";

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
  // Adicionar estado para diasPlanoPagoRestante
  const [diasPlanoPagoRestante, setDiasPlanoPagoRestante] = useState<number | null>(null);

  // Unificar busca dos dados da conta para evitar duplicidade e garantir atualização dos dias
  useEffect(() => {
    if (!uid) return;
    const contasRef = collection(firestore, 'contas');
    const qConta = query(contasRef, where('__name__', '==', uid));
    getDocs(qConta).then(snapshot => {
      if (!snapshot.empty) {
        const contaData = snapshot.docs[0].data();
        setEstabelecimentoNome(contaData.nomeEstabelecimento || '');
        setIsPremium(contaData.premium === true);
        setTipoPlano(contaData.tipoPlano || null);
        setDataInicioTesteGratis(contaData.data_inicio_teste_gratis || null);
        setDiasPlanoPagoRestante(contaData.dias_plano_pago_restante ?? null);
        // Calcular dias restantes do teste grátis
        if (contaData.data_inicio_teste_gratis && (!contaData.tipoPlano || contaData.tipoPlano === '')) {
          const inicio = new Date(contaData.data_inicio_teste_gratis);
          const hoje = new Date();
          const inicioDia = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
          const hojeDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
          const diff = Math.floor((hojeDia.getTime() - inicioDia.getTime()) / (1000 * 60 * 60 * 24));
          setDiasRestantesTeste(Math.max(0, 7 - diff));
        } else {
          setDiasRestantesTeste(null);
        }
      }
    });
  }, [uid]);

  // NOVA LÓGICA: Decrementar dias do plano pago e verificar expiração
  useEffect(() => {
    if (!uid) return;
    
    const verificarEAtualizarPlanoPago = async () => {
      const docRef = doc(firestore, 'contas', uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Se tem plano pago (individual ou empresa)
        if ((data.tipoPlano === 'individual' || data.tipoPlano === 'empresa') && data.dias_plano_pago_restante > 0) {
          const hoje = new Date();
          const dataInicio = new Date(data.data_inicio_teste_gratis);
          const inicioDia = new Date(dataInicio.getFullYear(), dataInicio.getMonth(), dataInicio.getDate());
          const hojeDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
          const diasPassados = Math.floor((hojeDia.getTime() - inicioDia.getTime()) / (1000 * 60 * 60 * 24));
          
          // Calcular dias restantes baseado nos dias passados
          const diasRestantes = Math.max(0, 30 - diasPassados);
          
          // Se os dias restantes mudaram, atualizar no Firestore
          if (data.dias_plano_pago_restante !== diasRestantes) {
            await updateDoc(docRef, { 
              dias_plano_pago_restante: diasRestantes 
            });
            setDiasPlanoPagoRestante(diasRestantes);
            
            // Se chegou a 0 dias, desativar premium
            if (diasRestantes <= 0) {
              await updateDoc(docRef, {
                premium: false,
                dias_plano_pago: 0,
                dias_plano_pago_restante: 0
              });
              setIsPremium(false);
            }
          }
        }
      }
    };
    
    verificarEAtualizarPlanoPago();
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
        // Se está em teste grátis (apenas para plano grátis)
        if (data.data_inicio_teste_gratis && (!data.tipoPlano || data.tipoPlano === '')) {
          const inicio = new Date(data.data_inicio_teste_gratis)
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

  // NOVA LÓGICA DE ROTAS POR PLANO
  // Definição dos caminhos permitidos para cada plano
  const allowedPathsGratis = [
    `/dashboard/${uid}/plano`,
    `/dashboard/${uid}/servicos`,
    `/dashboard/${uid}/configuracoes`,
    `/dashboard/${uid}/agenda`,
    `/dashboard/${uid}`
  ];
  const allowedPathsGratisExpirado = [
    `/dashboard/${uid}/plano`
  ];
  const allowedPathsIndividual = [
    `/dashboard/${uid}/servicos`,
    `/dashboard/${uid}/agenda`,
    `/dashboard/${uid}/configuracoes`,
    `/dashboard/${uid}/plano`,
    `/dashboard/${uid}`
  ];
  // Empresa: todas as rotas liberadas

  // Função para checar se o plano está expirado (usando dias_plano_pago_restante para planos pagos)
  function isPlanoExpirado(tipo: string | null, dataInicio: string | null) {
    if (!tipo || !dataInicio) return false;
    
    // Para planos pagos, usar dias_plano_pago_restante
    if (tipo === 'individual' || tipo === 'empresa') {
      return diasPlanoPagoRestante !== null && diasPlanoPagoRestante <= 0;
    }
    
    // Para plano grátis, usar cálculo de data
    if (tipo === 'gratis' || tipo === '') {
      const inicio = new Date(dataInicio);
      const hoje = new Date();
      const inicioDia = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
      const hojeDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
      const diff = Math.floor((hojeDia.getTime() - inicioDia.getTime()) / (1000 * 60 * 60 * 24));
      return diff >= 7;
    }
    
    return false;
  }

  let filteredMenuItems = menuItems.map(item => ({ ...item, disabled: false }));
  if (tipoPlano === 'gratis' || tipoPlano === '') {
    if (isPlanoExpirado('gratis', dataInicioTesteGratis)) {
      // Grátis expirado: só Plano e Pagamento
      filteredMenuItems = menuItems.map(item => ({
        ...item,
        disabled: !allowedPathsGratisExpirado.includes(item.path)
      }));
    } else {
      // Grátis ativo: Plano, Serviços, Configurações, Agenda Online, Dashboard
      filteredMenuItems = menuItems.map(item => ({
        ...item,
        disabled: !allowedPathsGratis.includes(item.path)
      }));
    }
  } else if (tipoPlano === 'individual') {
    if (isPlanoExpirado('individual', dataInicioTesteGratis)) {
      // Individual expirado: bloqueia tudo
      filteredMenuItems = menuItems.map(item => ({
        ...item,
        disabled: true
      }));
    } else {
      // Individual ativo: Serviços, Agenda Online, Configurações, Plano e Pagamento, Dashboard
      filteredMenuItems = menuItems.map(item => ({
        ...item,
        disabled: !allowedPathsIndividual.includes(item.path)
      }));
    }
  } else if (tipoPlano === 'empresa') {
    if (isPlanoExpirado('empresa', dataInicioTesteGratis)) {
      // Empresa expirado: bloqueia tudo
      filteredMenuItems = menuItems.map(item => ({
        ...item,
        disabled: true
      }));
    } else {
      // Empresa ativo: libera tudo
      filteredMenuItems = menuItems.map(item => ({
        ...item,
        disabled: false
      }));
    }
  } else {
    // Caso não tenha plano, bloqueia tudo menos plano e pagamento
    filteredMenuItems = menuItems.map(item => ({
      ...item,
      disabled: item.path !== `/dashboard/${uid}/plano`
    }));
  }

  // Após montar filteredMenuItems:
  filteredMenuItems = filteredMenuItems.map(item =>
    item.path === '#logout' ? { ...item, disabled: false } : item
  );

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

  useEffect(() => {
    if (!uid || !tipoPlano) return;

    let allowedPaths: string[] = [];
    if (tipoPlano === 'gratis' || tipoPlano === '') {
      allowedPaths = isPlanoExpirado('gratis', dataInicioTesteGratis)
        ? [`/dashboard/${uid}/plano`, `#logout`]
        : [
            `/dashboard/${uid}/plano`,
            `/dashboard/${uid}/servicos`,
            `/dashboard/${uid}/configuracoes`,
            `/dashboard/${uid}/agenda`,
            `/dashboard/${uid}`,
            `#logout`
          ];
    } else if (tipoPlano === 'individual') {
      allowedPaths = isPlanoExpirado('individual', dataInicioTesteGratis)
        ? [`#logout`]
        : [
            `/dashboard/${uid}/servicos`,
            `/dashboard/${uid}/agenda`,
            `/dashboard/${uid}/configuracoes`,
            `/dashboard/${uid}/plano`,
            `/dashboard/${uid}`,
            `#logout`
          ];
    } else if (tipoPlano === 'empresa') {
      allowedPaths = isPlanoExpirado('empresa', dataInicioTesteGratis)
        ? []
        : [
            ...menuItems.map(item => item.path)
          ];
    } else {
      allowedPaths = [`/dashboard/${uid}/plano`];
    }

    if (location.pathname === '#logout') return; // Nunca bloqueie o logout
    const isAllowed = allowedPaths.some(path => location.pathname.startsWith(path));
    if (!isAllowed) {
      navigate(`/dashboard/${uid}/plano`);
    }
  }, [uid, tipoPlano, dataInicioTesteGratis, location.pathname, diasPlanoPagoRestante]);

  // Buscar dias_plano_pago_restante do Firestore
  useEffect(() => {
    if (!uid) return;
    const contasRef = collection(firestore, 'contas');
    const qConta = query(contasRef, where('__name__', '==', uid));
    getDocs(qConta).then(snapshot => {
      if (!snapshot.empty) {
        const contaData = snapshot.docs[0].data();
        setDiasPlanoPagoRestante(contaData.dias_plano_pago_restante ?? null);
      }
    });
  }, [uid]);

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
              const isDisabled = item.disabled;
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
      {tipoPlano === 'gratis' && showPromotion && !testeGratisAtivo && (
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
      {tipoPlano === 'gratis' && showPromotion && testeGratisAtivo && diasRestantesTeste !== null && diasRestantesTeste > 0 && (
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
              const isDisabled = item.disabled;
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
            <Box maxW="md" mx="auto" mt={12} p={8} borderRadius="lg" boxShadow="lg" bg="white" textAlign="center">
              <Heading as="h1" size="lg" mb={6} color="purple.700">
                Bem-vindo à tela de administração do salão!
              </Heading>
              <Stack spacing={2} align="center">
                <Text fontSize="xl" fontWeight="bold">
                  Tipo de Plano: <Text as="span" color="purple.500" fontWeight="extrabold">{
                    tipoPlano === '' ? 'Grátis' : (tipoPlano ? tipoPlano.charAt(0).toUpperCase() + tipoPlano.slice(1) : 'Nenhum')
                  }</Text>
                </Text>
                <Text fontSize="xl" fontWeight="bold">
                  Dias Restantes: <Text as="span" color="green.500" fontWeight="extrabold">{
                    tipoPlano === 'gratis'
                      ? (diasRestantesTeste !== null ? diasRestantesTeste : '-')
                      : (diasPlanoPagoRestante !== null ? diasPlanoPagoRestante : '-')
                  }</Text>
                </Text>
              </Stack>
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
              {tipoPlano === 'gratis' && testeGratisAtivo && diasRestantesTeste !== null && diasRestantesTeste > 0 && (
                <div style={{ fontSize: 20, color: '#2563eb', fontWeight: 600, marginTop: 16 }}>
                  🕒 Seu teste grátis está ativo! <strong>{diasRestantesTeste} {diasRestantesTeste === 1 ? 'dia restante' : 'dias restantes'}</strong> de Premium.
                </div>
              )}
            </Box>
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
