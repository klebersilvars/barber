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
import { collection, query, where, doc, updateDoc, getDoc, onSnapshot } from 'firebase/firestore';
import Modal from "./Modal"
import { 
  Box, 
  Heading, 
  Text, 
  Stack,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack,
  HStack,
  IconButton,
  useDisclosure,
  Button,
  useColorModeValue
} from "@chakra-ui/react";

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
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [tipoPlano, setTipoPlano] = useState<string | null>(null)
  const [dataInicioTesteGratis, setDataInicioTesteGratis] = useState<string | null>(null)
  // Adicionar estado para diasPlanoPagoRestante
  const [diasPlanoPagoRestante, setDiasPlanoPagoRestante] = useState<number | null>(null);
  const [jaPegouPremiumGratis, setJaPegouPremiumGratis] = useState<boolean | null>(null);
  const [dataTerminoPlano, setDataTerminoPlano] = useState<string | null>(null);

  // Cores responsivas
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.300');

  // Função para formatar a data de término
  const formatarDataTermino = (dataISO: string) => {
    if (!dataISO) return '-';
    try {
      // Se vier só a data, adiciona T00:00:00 para evitar problemas de fuso
      const dataFormatada = dataISO.length === 10 ? `${dataISO}T00:00:00` : dataISO;
      const data = new Date(dataFormatada);
      if (isNaN(data.getTime())) return 'Data inválida';
      return data.toLocaleDateString('pt-BR');
    } catch {
      return 'Data inválida';
    }
  };

  // Função para verificar se o plano expirou baseado na data de término
  const verificarExpiracaoPlano = async () => {
    if (!auth.currentUser?.uid) return;
    
    try {
      const docRef = doc(firestore, 'contas', auth.currentUser.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const dataTermino = data.data_termino_plano_premium;
        
        if (dataTermino) {
          const dataTerminoObj = new Date(dataTermino);
          const hoje = new Date();
          
          // Comparar apenas a data (sem hora) para ser mais preciso
          const hojeData = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
          const terminoData = new Date(dataTerminoObj.getFullYear(), dataTerminoObj.getMonth(), dataTerminoObj.getDate());
          
          console.log('=== VERIFICAÇÃO AUTOMÁTICA DE EXPIRAÇÃO ===');
          console.log('Data de término do plano:', dataTermino);
          console.log('Data de término processada:', terminoData.toISOString());
          console.log('Data atual:', hojeData.toISOString());
          console.log('Plano expirou?', hojeData >= terminoData);
          console.log('Premium atual:', data.premium);
          
          // Se a data de término já passou, desativar premium
          if (hojeData >= terminoData) {
            console.log('🚨 PLANO EXPIRADO - Desativando premium para:', auth.currentUser.uid);
            
            await updateDoc(docRef, {
              premium: false,
              data_termino_plano_premium: null,
              dias_plano_pago_restante: 0,
              dias_restantes_teste_gratis: 0,
              tipoPlano: ''
            });
            
            console.log('✅ Premium desativado com sucesso!');
            console.log('✅ Campos resetados: premium=false, data_termino=null, dias=0, tipoPlano=""');
          } else {
            console.log('✅ Plano ainda ativo - Premium mantido');
          }
          
          console.log('=== FIM VERIFICAÇÃO ===');
        } else {
          console.log('ℹ️ Nenhuma data de término encontrada para verificação');
        }
      }
    } catch (error) {
      console.error('❌ Erro ao verificar expiração do plano:', error);
    }
  };

  // Unificar busca dos dados da conta para evitar duplicidade e garantir atualização dos dias
  useEffect(() => {
    if (!uid) return;

    console.log('=== INICIANDO CARREGAMENTO DO DASHBOARD ===');
    console.log('UID do usuário:', uid);

    // Verificar expiração do plano ao carregar
    verificarExpiracaoPlano();

    // Verificar a cada 5 minutos se o plano expirou
    const intervalId = setInterval(() => {
      console.log('🔄 Verificação periódica de expiração (5 min)');
      verificarExpiracaoPlano();
    }, 5 * 60 * 1000); // 5 minutos

    // Usar onSnapshot para atualização em tempo real
    const contasRef = collection(firestore, 'contas');
    const qConta = query(contasRef, where('__name__', '==', uid));
    
    const unsubscribe = onSnapshot(qConta, (snapshot) => {
      if (!snapshot.empty) {
        const contaData = snapshot.docs[0].data();
        
        console.log('=== DADOS DA CONTA CARREGADOS ===');
        console.log('Nome do estabelecimento:', contaData.nomeEstabelecimento);
        console.log('Premium:', contaData.premium);
        console.log('Tipo de plano:', contaData.tipoPlano);
        console.log('Data de término:', contaData.data_termino_plano_premium);
        console.log('Dias restantes teste:', contaData.dias_restantes_teste_gratis);
        console.log('Dias plano pago restante:', contaData.dias_plano_pago_restante);
        
        setEstabelecimentoNome(contaData.nomeEstabelecimento || '');
        setIsPremium(contaData.premium === true);
        setTipoPlano(contaData.tipoPlano || null);
        setDataInicioTesteGratis(contaData.data_inicio_teste_gratis || null);
        setDiasPlanoPagoRestante(contaData.dias_plano_pago_restante ?? null);
        setJaPegouPremiumGratis(contaData.ja_pegou_premium_gratis ?? false);
        setDiasRestantesTeste(contaData.dias_restantes_teste_gratis ?? null);
        setDataTerminoPlano(contaData.data_termino_plano_premium || null);
        
        // Debug específico para data de término
        if (contaData.data_termino_plano_premium) {
          console.log('=== DEBUG DATA DE TÉRMINO ===');
          console.log('Data bruta do Firebase:', contaData.data_termino_plano_premium);
          console.log('Tipo da data:', typeof contaData.data_termino_plano_premium);
          console.log('Data é válida?', !isNaN(new Date(contaData.data_termino_plano_premium).getTime()));
          
          try {
            const dataObj = new Date(contaData.data_termino_plano_premium);
            console.log('Data convertida:', dataObj);
            console.log('Data formatada:', dataObj.toLocaleDateString('pt-BR'));
            console.log('Data ISO:', dataObj.toISOString());
            
            // Verificar se a data de término já passou
            const hoje = new Date();
            const hojeData = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
            const terminoData = new Date(dataObj.getFullYear(), dataObj.getMonth(), dataObj.getDate());
            
            console.log('Data atual (sem hora):', hojeData.toISOString());
            console.log('Data término (sem hora):', terminoData.toISOString());
            console.log('Plano expirou?', hojeData >= terminoData);
            
          } catch (error) {
            console.error('Erro ao processar data:', error);
          }
          
          console.log('Estado dataTerminoPlano será:', contaData.data_termino_plano_premium || null);
          console.log('=== FIM DEBUG ===');
        } else {
          console.log('ℹ️ Nenhuma data de término encontrada para:', contaData.tipoPlano);
        }
        
        console.log('=== FIM DADOS CARREGADOS ===');
      }
    });

    // Cleanup function
    return () => {
      console.log('🧹 Cleanup: Desconectando listeners');
      unsubscribe();
      clearInterval(intervalId);
    };
  }, [uid]);

  // Função para ativar o teste grátis
  const ativarTesteGratis = async () => {
    if (!auth.currentUser?.uid) return
    const docRef = doc(firestore, 'contas', auth.currentUser.uid)
    const hoje = new Date()
    const dataTermino = new Date(hoje)
    dataTermino.setDate(hoje.getDate() + 7) // 7 dias de teste grátis
    
    console.log('=== ATIVANDO TESTE GRÁTIS ===');
    console.log('Data atual:', hoje.toISOString());
    console.log('Data de término calculada:', dataTermino.toISOString());
    console.log('Dias restantes: 7');
    
    await updateDoc(docRef, {
      premium: true,
      tipoPlano: 'gratis', // DEFINIR COMO GRATIS
      data_inicio_teste_gratis: hoje.toISOString(),
      dias_restantes_teste_gratis: 7,
      ja_pegou_premium_gratis: true,
      data_termino_plano_premium: dataTermino.toISOString() // ✅ Data de término correta
    })
    
    console.log('Teste grátis ativado com sucesso!');
    console.log('Data de término salva:', dataTermino.toISOString());
    
    setTesteGratisAtivo(true)
    setJaPegouPremiumGratis(true)
    setDataTerminoPlano(dataTermino.toISOString());
    // Redirecionar para o dashboard para liberar as rotas
    navigate(`/dashboard/${auth.currentUser.uid}`)
  }

  // Lógica para calcular dias restantes e atualizar Firestore
  useEffect(() => {
    if (!uid) return;
    const checkTesteGratis = async () => {
      const docRef = doc(firestore, 'contas', uid)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const data = docSnap.data()
        
        // Se está em teste grátis (tipoPlano === 'gratis')
        if (data.tipoPlano === 'gratis' && data.data_inicio_teste_gratis) {
          setTesteGratisAtivo(true)
          setDiasRestantesTeste(data.dias_restantes_teste_gratis ?? null)
          setDataTerminoPlano(data.data_termino_plano_premium || null);
          
          // Se acabou o teste grátis (verificação do backend)
          if (data.dias_restantes_teste_gratis <= 0) {
            setIsPremium(false)
            setTipoPlano('')
            setShowPromotion(false)
            setTesteGratisAtivo(false)
            setDiasRestantesTeste(null)
            setDataTerminoPlano(null);
          }
        } else {
          // Se não está em teste grátis
          setTesteGratisAtivo(false)
          setDiasRestantesTeste(null)
          setDataTerminoPlano(null);
          setShowPromotion(true)
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
    `/dashboard/${uid}/cliente`,
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
    `/dashboard/${uid}/cliente`,
    `/dashboard/${uid}`
  ];
  // Empresa: todas as rotas liberadas

  // Função para checar se o plano está expirado (usando dias_plano_pago_restante para planos pagos)
  function isPlanoExpirado(tipo: string | null, dataInicio: string | null) {
    if (!tipo) return false;
    
    // Plano vitalício nunca expira
    if (tipo === 'vitalicio') {
      return false;
    }
    
    // Para planos pagos, usar dias_plano_pago_restante
    if (tipo === 'individual' || tipo === 'empresa') {
      return diasPlanoPagoRestante !== null && diasPlanoPagoRestante <= 0;
    }
    
    // Para plano grátis, usar cálculo de data
    if (tipo === 'gratis' || tipo === '') {
      if (!dataInicio) return false;
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
  
  // SEMPRE permitir acesso às páginas de plano e configurações
  const alwaysAllowedPaths = [`/dashboard/${uid}/plano`, `/dashboard/${uid}/configuracoes`];
  
  if (tipoPlano === 'vitalicio') {
    // Plano vitalício: libera todas as rotas
    filteredMenuItems = menuItems.map(item => ({
      ...item,
      disabled: false
    }));
  } else if ((tipoPlano === 'gratis' || tipoPlano === '' || !tipoPlano) && isPremium && diasRestantesTeste && diasRestantesTeste > 0) {
    // Teste grátis ativo: libera as rotas do allowedPathsGratis
    filteredMenuItems = menuItems.map(item => ({
      ...item,
      disabled: !allowedPathsGratis.includes(item.path)
    }));
  } else if (tipoPlano === 'gratis' || tipoPlano === '' || !tipoPlano) {
    if (isPlanoExpirado('gratis', dataInicioTesteGratis)) {
      // Grátis expirado: só Plano
      filteredMenuItems = menuItems.map(item => ({
        ...item,
        disabled: !allowedPathsGratisExpirado.includes(item.path)
      }));
    } else {
      // Grátis ativo sem premium: libera as rotas básicas incluindo cliente
      filteredMenuItems = menuItems.map(item => ({
        ...item,
        disabled: !['/dashboard/${uid}/plano', '/dashboard/${uid}/cliente', '/dashboard/${uid}/servicos', '/dashboard/${uid}/configuracoes', '/dashboard/${uid}/agenda', `/dashboard/${uid}`, '#logout'].includes(item.path)
      }));
    }
  } else if (tipoPlano === 'individual') {
    if (isPlanoExpirado('individual', dataInicioTesteGratis)) {
      // Individual expirado: bloqueia tudo EXCETO plano e configurações
      filteredMenuItems = menuItems.map(item => ({
        ...item,
        disabled: !alwaysAllowedPaths.includes(item.path)
      }));
    } else {
      // Individual ativo: Serviços, Agenda Online, Configurações, Plano e Pagamento, Cliente, Dashboard
      filteredMenuItems = menuItems.map(item => ({
        ...item,
        disabled: !allowedPathsIndividual.includes(item.path)
      }));
    }
  } else if (tipoPlano === 'empresa') {
    if (isPlanoExpirado('empresa', dataInicioTesteGratis)) {
      // Empresa expirado: bloqueia tudo EXCETO plano e configurações
      filteredMenuItems = menuItems.map(item => ({
        ...item,
        disabled: !alwaysAllowedPaths.includes(item.path)
      }));
    } else {
      // Empresa ativo: libera tudo
      filteredMenuItems = menuItems.map(item => ({
        ...item,
        disabled: false
      }));
    }
  } else {
    // Caso não tenha plano, permite apenas plano e configurações
    filteredMenuItems = menuItems.map(item => ({
      ...item,
      disabled: !alwaysAllowedPaths.includes(item.path)
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

    // SEMPRE permitir acesso às páginas de plano e configurações
    const alwaysAllowedPaths = [`/dashboard/${uid}/plano`, `/dashboard/${uid}/configuracoes`, `#logout`];
    
    // Se estiver em uma página sempre permitida, não fazer nada
    if (alwaysAllowedPaths.some(path => location.pathname.startsWith(path))) {
      return;
    }

    let allowedPaths: string[] = [];
    
    if (tipoPlano === 'vitalicio') {
      // Para plano vitalício, permitir tudo
      allowedPaths = [
        ...menuItems.map(item => item.path)
      ];
    } else if (tipoPlano === 'gratis' || tipoPlano === '') {
      // Para plano grátis, sempre permitir cliente, serviços, agenda e configurações
      allowedPaths = [
        `/dashboard/${uid}/plano`,
        `/dashboard/${uid}/cliente`,
        `/dashboard/${uid}/servicos`,
        `/dashboard/${uid}/configuracoes`,
        `/dashboard/${uid}/agenda`,
        `/dashboard/${uid}`,
        `#logout`
      ];
    } else if (tipoPlano === 'individual') {
      // Para plano individual, permitir cliente, serviços, agenda e configurações
      allowedPaths = [
        `/dashboard/${uid}/servicos`,
        `/dashboard/${uid}/cliente`,
        `/dashboard/${uid}/agenda`,
        `/dashboard/${uid}/configuracoes`,
        `/dashboard/${uid}/plano`,
        `/dashboard/${uid}`,
        `#logout`
      ];
    } else if (tipoPlano === 'empresa') {
      // Para plano empresa, permitir tudo
      allowedPaths = [
        ...menuItems.map(item => item.path)
      ];
    } else {
      // Caso não tenha plano, permite apenas plano e configurações
      allowedPaths = [...alwaysAllowedPaths];
    }
    
    const isAllowed = allowedPaths.some(path => location.pathname.startsWith(path));
    
    if (!isAllowed) {
      console.log('Redirecionando para plano - rota não permitida:', location.pathname);
      navigate(`/dashboard/${uid}/plano`);
    }
  }, [uid, tipoPlano, location.pathname]);

  return (
    <div className="dashboard-container">
      {/* Drawer lateral do menu mobile */}
      <Drawer isOpen={isOpen} onClose={onClose} placement="left">
        <DrawerOverlay />
        <DrawerContent bg={bgColor} color={textColor}>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px" pb={4}>
            <VStack align="center">
              <HStack spacing={3}>
              <Scissors className="logo-icon" />
                <Heading size="md">Trezu</Heading>
              </HStack>
            </VStack>
          </DrawerHeader>
          <DrawerBody>
            <VStack spacing={4}>
              {filteredMenuItems.map((item, index) => {
                const isDisabled = item.disabled;
              return (
                  <Button
                  key={index}
                    variant="ghost"
                    w="100%"
                    justifyContent="start"
                    onClick={() => {
                      onClose();
                    if (isDisabled) {
                      return;
                    }
                    if (item.path === "#logout") {
                      handleLogout();
                    } else {
                      navigate(item.path);
                    }
                  }}
                  disabled={isDisabled}
                    _hover={{ bg: borderColor }}
                    _active={{ bg: borderColor }}
                    p={3}
                    borderRadius="md"
                    fontWeight="normal"
                    color={isDisabled ? secondaryTextColor : textColor}
                    fontSize="md"
                    textAlign="left"
                    display="flex"
                    alignItems="center"
                    gap={3}
                  >
                    <item.icon size={20} />
                    {item.label}
                  </Button>
                );
              })}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
      {/* Promotion Banner */}
      {tipoPlano === 'gratis' && showPromotion && jaPegouPremiumGratis !== true && !testeGratisAtivo && (
        <div className="promotion-banner">
          <div className="promotion-content">
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
          {/* Header Mobile com Hamburger */}
          <Box 
            display={{ base: "flex", md: "none" }} 
            position="sticky" 
            top={0} 
            zIndex={10}
            bg={bgColor}
            borderBottom="1px"
            borderColor={borderColor}
            px={4}
            py={3}
            alignItems="center"
            justifyContent="space-between"
          >
            <HStack spacing={3}>
              <IconButton
                aria-label="Abrir menu"
                icon={<HamburgerIcon />}
                variant="ghost"
                onClick={onOpen}
                color={textColor}
                _hover={{ bg: borderColor }}
              />
              <HStack spacing={2}>
                <Scissors size={24} />
                <Text fontWeight="bold" fontSize="lg">Trezu</Text>
              </HStack>
            </HStack>
            <VStack spacing={0} align="end">
              <Text fontSize="sm" fontWeight="medium" color={textColor}>
                {estabelecimentoNome || 'Carregando...'}
              </Text>
              <Text fontSize="xs" color={secondaryTextColor}>
                Proprietário
              </Text>
            </VStack>
          </Box>

          {location.pathname === `/dashboard/${uid}` || location.pathname === `/dashboard/${uid}/` ? (
            <Box maxW="md" mx="auto" mt={12} p={8} borderRadius="lg" boxShadow="lg" bg="white" textAlign="center">
              <Heading as="h1" size="lg" mb={6} color="purple.700">
                Bem-vindo à tela de administração do salão!
              </Heading>
              <Stack spacing={2} align="center">
                <Text fontSize="xl" fontWeight="bold">
                  Tipo de Plano: <Text as="span" color="purple.500" fontWeight="extrabold">{
                    tipoPlano === 'vitalicio' ? 'Vitalício' :
                    tipoPlano === 'gratis' ? 'Avaliação' : 
                    (tipoPlano === '' ? 'Grátis' : 
                    (tipoPlano ? tipoPlano.charAt(0).toUpperCase() + tipoPlano.slice(1) : 'Nenhum'))
                  }</Text>
                </Text>
                <Text fontSize="xl" fontWeight="bold">
                  Data de Término:
                  <Text as="span" color="green.500" fontWeight="extrabold">
                    {dataTerminoPlano ? formatarDataTermino(dataTerminoPlano) : '-'}
                  </Text>
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
