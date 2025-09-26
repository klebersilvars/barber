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
  Search,
  ChevronRight,
  User,
  X,
  Clock,
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Star,
  CheckCircle,
  LogOut
} from "lucide-react"
import { HamburgerIcon } from "@chakra-ui/icons"
import trezuLogo from "../../assets/LOGOTIPO TREZU.svg"
import favRoxo from "../../assets/fav_roxo.png"


// Importar as funções de autenticação do Firebase
import { getAuth, signOut } from "firebase/auth";
import { firestore } from '../../firebase/firebase';
import { collection, query, where, doc, updateDoc, getDoc, onSnapshot } from 'firebase/firestore';
import Modal from "./Modal"
import { 
  Box, 
  Heading, 
  Text, 
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
  useColorModeValue,
  SimpleGrid,
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Badge,
  Flex,
  Avatar,
  Divider,
  Icon
} from "@chakra-ui/react";

// Função para obter saudação baseada na hora do dia
const getSaudacao = () => {
  const hora = new Date().getHours();
  if (hora >= 5 && hora < 12) return "Bom dia";
  if (hora >= 12 && hora < 18) return "Boa tarde";
  return "Boa noite";
};

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

  // Estados para dados reais do banco
  const [agendamentos, setAgendamentos] = useState<any[]>([])
  const [agendaStats, setAgendaStats] = useState({
    hoje: 0,
    amanha: 0,
    semana: 0
  })
  
  // Estados para estatísticas detalhadas (igual ao agendaAdmin)
  const [todayAppointments, setTodayAppointments] = useState<any[]>([])
  const [receitaPrevistaHoje, setReceitaPrevistaHoje] = useState(0)
  const [receitaConfirmadaHoje, setReceitaConfirmadaHoje] = useState(0)
  
  // Estados para dados do mês atual
  const [faturamentoMes, setFaturamentoMes] = useState(0)
  const [novosClientesMes, setNovosClientesMes] = useState(0)
  const [servicosRealizadosMes, setServicosRealizadosMes] = useState(0)
  const [colaboradoresStats, setColaboradoresStats] = useState<any[]>([])

  // Cores responsivas
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.300');

  // Função para formatar data local (igual ao agendaAdmin)
  const formatLocalISODate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Função para formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

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
          
          // Se a data de término já passou, desativar premium
          if (hojeData >= terminoData) {
            await updateDoc(docRef, {
              premium: false,
              tipoPlano: '', // String vazia sinalizando que não tem mais planos
              data_termino_plano_premium: null,
              dias_plano_pago_restante: 0,
              dias_restantes_teste_gratis: 0,
              avaliacao_gratis: false
            });
          }
        }
      }
    } catch (error) {
      // Erro silencioso - não exibir logs no console
    }
  };

  // Unificar busca dos dados da conta para evitar duplicidade e garantir atualização dos dias
  useEffect(() => {
    if (!uid) return;

    // Verificar expiração do plano ao carregar
    verificarExpiracaoPlano();

    // Verificar a cada 5 minutos se o plano expirou
    const intervalId = setInterval(() => {
      verificarExpiracaoPlano();
    }, 5 * 60 * 1000); // 5 minutos

    // Usar onSnapshot para atualização em tempo real
    const contasRef = collection(firestore, 'contas');
    const qConta = query(contasRef, where('__name__', '==', uid));
    
    const unsubscribe = onSnapshot(qConta, (snapshot) => {
      if (!snapshot.empty) {
        const contaData = snapshot.docs[0].data();
        
        setEstabelecimentoNome(contaData.nomeEstabelecimento || '');
        setIsPremium(contaData.premium === true);
        setTipoPlano(contaData.tipoPlano || null);
        setDataInicioTesteGratis(contaData.data_inicio_teste_gratis || null);
        setDiasPlanoPagoRestante(contaData.dias_plano_pago_restante ?? null);
        setJaPegouPremiumGratis(contaData.ja_pegou_premium_gratis ?? false);
        setDiasRestantesTeste(contaData.dias_restantes_teste_gratis ?? null);
        setDataTerminoPlano(contaData.data_termino_plano_premium || null);
      }
    });

    // Cleanup function
    return () => {
      unsubscribe();
      clearInterval(intervalId);
    };
  }, [uid]);

  // Buscar dados reais do banco de dados
  useEffect(() => {
    if (!uid || !estabelecimentoNome) return;

    // Buscar agendamentos (igual ao agendaAdmin)
    const agendamentosRef = collection(firestore, 'agendaAdmin');
    const qAgendamentos = query(agendamentosRef, where('nomeEstabelecimento', '==', estabelecimentoNome));
    
    const unsubscribeAgendamentos = onSnapshot(qAgendamentos, (snapshot) => {
      const agendamentosData: any[] = snapshot.docs.map(docSnap => {
        const data: any = docSnap.data()
        // Normalizar campo date para 'YYYY-MM-DD' (igual ao agendaAdmin)
        let normalizedDate: string = ''
        const rawDate = data.date
        if (rawDate && typeof rawDate === 'string') {
          // Se vier como string, tentar cortar apenas a parte da data
          normalizedDate = rawDate.includes('T') ? rawDate.split('T')[0] : rawDate
        } else if (rawDate && typeof rawDate === 'object' && typeof rawDate.toDate === 'function') {
          const d: Date = rawDate.toDate()
          normalizedDate = formatLocalISODate(d)
        }
        return {
          id: docSnap.id,
          ...data,
          date: normalizedDate || data.date,
          status: data.status || 'agendado',
        }
      });
      
      setAgendamentos(agendamentosData);
      
      // Calcular estatísticas usando a mesma lógica do agendaAdmin
      const hojeISO = formatLocalISODate(new Date());
      const amanhaISO = formatLocalISODate(new Date(Date.now() + 24 * 60 * 60 * 1000));
      
      // Agendamentos de hoje (todos os status)
      const agendamentosHoje = agendamentosData.filter((ag: any) => ag.date === hojeISO);
      setTodayAppointments(agendamentosHoje);
      
      // Receita prevista hoje (todos os agendamentos de hoje)
      const receitaPrevista = agendamentosHoje.reduce((sum, ag) => sum + (ag.price || 0), 0);
      setReceitaPrevistaHoje(receitaPrevista);
      
      // Receita confirmada hoje (apenas finalizados)
      const receitaConfirmada = agendamentosHoje.filter(ag => ag.status === 'finalizado').reduce((sum, ag) => sum + (ag.price || 0), 0);
      setReceitaConfirmadaHoje(receitaConfirmada);
      
      // Estatísticas para os cartões
      const agendamentosAmanha = agendamentosData.filter((ag: any) => ag.date === amanhaISO);
      
      // Calcular semana atual
      const inicioSemana = new Date();
      inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
      const fimSemana = new Date(inicioSemana);
      fimSemana.setDate(fimSemana.getDate() + 6);
      
      const agendamentosSemana = agendamentosData.filter((ag: any) => {
        const dataAgendamento = new Date(ag.date);
        return dataAgendamento >= inicioSemana && dataAgendamento <= fimSemana;
      });
      
      setAgendaStats({
        hoje: agendamentosHoje.length,
        amanha: agendamentosAmanha.length,
        semana: agendamentosSemana.length
      });
    });

    // Buscar colaboradores
    const colaboradoresRef = collection(firestore, 'colaboradores');
    const qColaboradores = query(colaboradoresRef, where('createdBy', '==', uid));
    
    const unsubscribeColaboradores = onSnapshot(qColaboradores, (snapshot) => {
      const colaboradoresData: any[] = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      
      // Calcular estatísticas dos colaboradores
      const colaboradoresStatsData = colaboradoresData.map((colab: any) => {
        const agendamentosColab = agendamentos.filter((ag: any) => 
          ag.professional === colab.nome && 
          ag.date === new Date().toISOString().split('T')[0] &&
          ag.status === 'confirmado'
        ).length;
        
        // Mock do valor a receber (pode ser calculado baseado em comissões reais)
        const valorReceber = agendamentosColab * 50; // R$ 50 por agendamento
        
        return {
          id: colab.id,
          nome: colab.nome,
          avatar: colab.avatar,
          agendamentos: agendamentosColab,
          valorReceber: valorReceber,
          status: 'online' // Mock - pode ser baseado em último login
        };
      });
      
      setColaboradoresStats(colaboradoresStatsData);
    });

    // Buscar vendas
    const vendasRef = collection(firestore, 'vendas');
    const qVendas = query(vendasRef, where('empresaUid', '==', uid));
    
    const unsubscribeVendas = onSnapshot(qVendas, () => {
      // Não usar mais resumoMes, usar os estados específicos
    });

    // Buscar clientes
    const clientesRef = collection(firestore, 'clienteUser');
    const qClientes = query(clientesRef, where('cadastradoPor', '==', uid));
    
    const unsubscribeClientes = onSnapshot(qClientes, () => {
      // Não usar mais resumoMes, usar os estados específicos
    });

    return () => {
      unsubscribeAgendamentos();
      unsubscribeColaboradores();
      unsubscribeVendas();
      unsubscribeClientes();
    };
  }, [uid, estabelecimentoNome]);

  // Buscar dados de vendas do mês atual
  useEffect(() => {
    if (!uid) return
    
    const vendasRef = collection(firestore, 'vendas');
    const qVendas = query(vendasRef, where('empresaUid', '==', uid));
    
    const unsubscribeVendas = onSnapshot(qVendas, (snapshot) => {
      const vendasData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      
      // Calcular faturamento do mês atual
      const agora = new Date();
      const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
      const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0);
      
      const vendasDoMes = vendasData.filter((venda: any) => {
        const dataVenda = venda.dataVenda?.toDate ? venda.dataVenda.toDate() : new Date(venda.dataVenda);
        return dataVenda >= inicioMes && dataVenda <= fimMes;
      });
      
      const faturamentoTotal = vendasDoMes.reduce((sum: number, venda: any) => sum + (venda.precoTotal || venda.valor || 0), 0);
      setFaturamentoMes(faturamentoTotal);
    });
    
    return () => unsubscribeVendas();
  }, [uid]);

  // Buscar dados de clientes do mês atual
  useEffect(() => {
    if (!uid || !estabelecimentoNome) return
    
    const clientesRef = collection(firestore, 'clienteUser');
    const qClientes = query(clientesRef, where('estabelecimento', '==', estabelecimentoNome));
    
    const unsubscribeClientes = onSnapshot(qClientes, (snapshot) => {
      const clientesData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      
      // Calcular novos clientes do mês atual
      const agora = new Date();
      const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
      const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0);
      
      const novosClientesDoMes = clientesData.filter((cliente: any) => {
        const dataCriacao = cliente.dataCriacao?.toDate ? cliente.dataCriacao.toDate() : new Date(cliente.dataCriacao);
        return dataCriacao >= inicioMes && dataCriacao <= fimMes;
      });
      
      setNovosClientesMes(novosClientesDoMes.length);
    });
    
    return () => unsubscribeClientes();
  }, [uid, estabelecimentoNome]);

  // Buscar serviços finalizados do mês atual
  useEffect(() => {
    if (!uid || !estabelecimentoNome) return
    
    const historicoRef = collection(firestore, 'historicoAgendamentoFinalizadoAdmin');
    const qHistorico = query(historicoRef, where('nomeEstabelecimento', '==', estabelecimentoNome));
    
    const unsubscribeHistorico = onSnapshot(qHistorico, (snapshot) => {
      const historicoData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      
      // Calcular serviços realizados do mês atual
      const agora = new Date();
      const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
      const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0);
      
      const servicosDoMes = historicoData.filter((servico: any) => {
        const dataFinalizacao = servico.dataFinalizacao?.toDate ? servico.dataFinalizacao.toDate() : new Date(servico.dataFinalizacao);
        return dataFinalizacao >= inicioMes && dataFinalizacao <= fimMes;
      });
      
      setServicosRealizadosMes(servicosDoMes.length);
    });
    
    return () => unsubscribeHistorico();
  }, [uid, estabelecimentoNome]);

  // Função para ativar o teste grátis
  const ativarTesteGratis = async () => {
    if (!auth.currentUser?.uid) return
    const docRef = doc(firestore, 'contas', auth.currentUser.uid)
    const hoje = new Date()
    const dataTermino = new Date(hoje)
    dataTermino.setDate(hoje.getDate() + 7) // 7 dias de teste grátis
    
    await updateDoc(docRef, {
      premium: true,
      tipoPlano: 'gratis', // DEFINIR COMO GRATIS
      data_inicio_teste_gratis: hoje.toISOString(),
      data_termino_plano_premium: dataTermino.toISOString(), // ✅ Data de término correta
      dias_restantes_teste_gratis: 7,
      ja_pegou_premium_gratis: true,
      avaliacao_gratis: true
    })
    
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
    { icon: LogOut, label: "Sair da Conta", path: "#logout", className: "logout-item" },
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
    // Caso não tenha plano, permite apenas: início, plano e configurações
    const allowedPathsSemPlano = [
      `/dashboard/${uid}`,
      `/dashboard/${uid}/plano`,
      `/dashboard/${uid}/configuracoes`,
      '#logout'
    ];
    filteredMenuItems = menuItems.map(item => ({
      ...item,
      disabled: !allowedPathsSemPlano.includes(item.path)
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
      navigate('/login'); // Redirecionar para a página de login
    }).catch((error) => {
      // Ocorreu um erro durante o logout
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
      // Caso não tenha plano, permite apenas: início, plano e configurações
      allowedPaths = [
        `/dashboard/${uid}`,
        `/dashboard/${uid}/plano`,
        `/dashboard/${uid}/configuracoes`,
        '#logout'
      ];
    }
    
    const isAllowed = allowedPaths.some(path => location.pathname.startsWith(path));
    
    if (!isAllowed) {
      navigate(`/dashboard/${uid}/plano`);
    }
  }, [uid, tipoPlano, location.pathname]);

  return (
    <div className="dashboard-container">
      {/* Drawer lateral do menu mobile */}
      <Drawer isOpen={isOpen} onClose={onClose} placement="left" size="md">
        <DrawerOverlay />
        <DrawerContent bg={bgColor} color={textColor}>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px" pb={4} minHeight="140px" display="flex" alignItems="center" justifyContent="center">
            <VStack align="center" spacing={4}>
              <HStack spacing={3}>
                <img 
                  src={trezuLogo} 
                  alt="Trezu Logo" 
                  className="logo-icon-no-bg"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const fallback = target.parentNode?.querySelector('.logo-fallback');
                    if (fallback) {
                      (fallback as HTMLElement).style.display = 'block';
                    }
                  }}
                />
                <Scissors className="logo-icon logo-fallback" style={{ display: 'none' }} />
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
              <img 
                src={trezuLogo} 
                alt="Trezu Logo" 
                className={`logo-icon-no-bg logo-img-full ${sidebarCollapsed ? 'hidden' : 'visible'}`}
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const fallback = target.parentNode?.querySelector('.logo-fallback');
                  if (fallback) {
                    (fallback as HTMLElement).style.display = 'block';
                  }
                }}
              />
              <img 
                src={favRoxo}
                alt="Trezu Icone"
                className={`logo-icon-fav logo-img-fav ${sidebarCollapsed ? 'visible' : 'hidden'}`}
              />
              <Scissors className="logo-icon logo-fallback" style={{ display: 'none' }} />
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
            py={4}
            alignItems="center"
            justifyContent="space-between"
            minHeight="100px"
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
              <div className="header-mobile-logo">
                <img 
                  src={trezuLogo} 
                  alt="Trezu Logo" 
                  className="header-logo-no-bg"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const fallback = target.parentNode?.querySelector('.header-fallback');
                    if (fallback) {
                      (fallback as HTMLElement).style.display = 'block';
                    }
                  }}
                />
                <Scissors className="header-logo header-fallback" style={{ display: 'none' }} />
              </div>
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
            <Box p={{ base: 4, md: 8 }} w="100%" overflow="auto" maxH="100vh">
              {/* Header com Saudação */}
              <Box mb={8}>
                <Heading as="h1" size="2xl" color="purple.700" mb={2}>
                  {getSaudacao()}, {estabelecimentoNome || 'Proprietário'}! 👋
                </Heading>
                <Text fontSize="lg" color="gray.600">
                  Aqui está o resumo do seu salão hoje
                </Text>
              </Box>

              {/* Cards de Agenda */}
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
                <Card bg="blue.500" color="white" shadow="lg" _hover={{ shadow: "xl", transform: "translateY(-2px)" }} transition="all 0.2s">
                  <CardBody p={6}>
                    <Flex justify="space-between" align="center">
                      <Stat>
                        <StatLabel color="blue.100" fontSize="sm">Agenda de Hoje</StatLabel>
                        <StatNumber fontSize="3xl">{todayAppointments.length}</StatNumber>
                        <StatHelpText color="blue.200">
                          {todayAppointments.filter(ag => ag.status === 'confirmado').length} confirmados • {todayAppointments.filter(ag => ag.status !== 'confirmado').length} pendentes
                        </StatHelpText>
                      </Stat>
                      <Icon as={Calendar} w={8} h={8} color="blue.200" />
                    </Flex>
                  </CardBody>
                </Card>

                <Card bg="green.500" color="white" shadow="lg" _hover={{ shadow: "xl", transform: "translateY(-2px)" }} transition="all 0.2s">
                  <CardBody p={6}>
                    <Flex justify="space-between" align="center">
                      <Stat>
                        <StatLabel color="green.100" fontSize="sm">Receita Prevista Hoje</StatLabel>
                        <StatNumber fontSize="3xl">R$ {receitaPrevistaHoje.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}</StatNumber>
                        <StatHelpText color="green.200">
                          R$ {receitaConfirmadaHoje.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} já confirmados
                        </StatHelpText>
                      </Stat>
                      <Icon as={DollarSign} w={8} h={8} color="green.200" />
                    </Flex>
                  </CardBody>
                </Card>

                <Card bg="purple.500" color="white" shadow="lg" _hover={{ shadow: "xl", transform: "translateY(-2px)" }} transition="all 0.2s">
                  <CardBody p={6}>
                    <Flex justify="space-between" align="center">
                      <Stat>
                        <StatLabel color="purple.100" fontSize="sm">Total da Semana</StatLabel>
                        <StatNumber fontSize="3xl">{agendaStats.semana}</StatNumber>
                        <StatHelpText color="purple.200">Agendamentos</StatHelpText>
                      </Stat>
                      <Icon as={TrendingUp} w={8} h={8} color="purple.200" />
                    </Flex>
                  </CardBody>
                </Card>
              </SimpleGrid>

              {/* Cards de Colaboradores */}
              <Box mb={8}>
                <Heading size="lg" color="gray.800" mb={6}>
                  Colaboradores e Agendamentos
                </Heading>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                  {colaboradoresStats.map((colaborador: any) => (
                    <Card key={colaborador.id} shadow="lg" _hover={{ shadow: "xl", transform: "translateY(-2px)" }} transition="all 0.2s">
                      <CardBody p={6}>
                        <Flex align="center" mb={4}>
                          <Avatar
                            size="md"
                            name={colaborador.nome}
                            bg="purple.500"
                            color="white"
                            mr={3}
                          />
                          <Box flex={1}>
                            <Text fontWeight="semibold" color="gray.800">
                              {colaborador.nome}
                            </Text>
                            <Badge
                              colorScheme={colaborador.status === "online" ? "green" : "gray"}
                              size="sm"
                            >
                              {colaborador.status === "online" ? "Online" : "Offline"}
                            </Badge>
                          </Box>
                        </Flex>
                        
                        <VStack spacing={3} align="stretch">
                          <Box>
                            <Text fontSize="sm" color="gray.600" mb={1}>
                              Agendamentos Hoje
                            </Text>
                            <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                              {colaborador.agendamentos}
                            </Text>
                          </Box>
                          
                          <Divider />
                          
                          <Box>
                            <Text fontSize="sm" color="gray.600" mb={1}>
                              Valor a Receber
                            </Text>
                            <Text fontSize="xl" fontWeight="bold" color="green.600">
                              R$ {colaborador.valorReceber.toFixed(2).replace('.', ',')}
                            </Text>
                          </Box>
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>
              </Box>

                             {/* Resumo do Mês */}
               <Box mb={8}>
                 <Heading size="lg" color="gray.800" mb={6}>
                   Resumo do Mês
                 </Heading>
                 <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                  <Card bg="yellow.500" color="white" shadow="lg" _hover={{ shadow: "xl", transform: "translateY(-2px)" }} transition="all 0.2s">
                    <CardBody p={6}>
                      <Flex justify="space-between" align="center">
                        <Stat>
                          <StatLabel color="yellow.100" fontSize="sm">Faturamento</StatLabel>
                          <StatNumber fontSize="2xl">{formatCurrency(faturamentoMes)}</StatNumber>
                          <StatHelpText color="yellow.200">Este mês</StatHelpText>
                        </Stat>
                        <Icon as={DollarSign} w={6} h={6} color="yellow.200" />
                      </Flex>
                    </CardBody>
                  </Card>

                  <Card bg="teal.500" color="white" shadow="lg" _hover={{ shadow: "xl", transform: "translateY(-2px)" }} transition="all 0.2s">
                    <CardBody p={6}>
                      <Flex justify="space-between" align="center">
                        <Stat>
                          <StatLabel color="teal.100" fontSize="sm">Novos Clientes</StatLabel>
                          <StatNumber fontSize="2xl">{novosClientesMes}</StatNumber>
                          <StatHelpText color="teal.200">Este mês</StatHelpText>
                        </Stat>
                        <Icon as={Users} w={6} h={6} color="teal.200" />
                      </Flex>
                    </CardBody>
                  </Card>

                  <Card bg="orange.500" color="white" shadow="lg" _hover={{ shadow: "xl", transform: "translateY(-2px)" }} transition="all 0.2s">
                    <CardBody p={6}>
                      <Flex justify="space-between" align="center">
                        <Stat>
                          <StatLabel color="orange.100" fontSize="sm">Serviços Realizados</StatLabel>
                          <StatNumber fontSize="2xl">{servicosRealizadosMes}</StatNumber>
                          <StatHelpText color="orange.200">Este mês</StatHelpText>
                        </Stat>
                        <Icon as={CheckCircle} w={6} h={6} color="orange.200" />
                      </Flex>
                    </CardBody>
                  </Card>
                </SimpleGrid>
              </Box>

              {/* Informações do Plano */}
              <Card bg="white" shadow="lg" border="1px" borderColor="gray.200">
                <CardBody p={6}>
                  <VStack spacing={4} align="stretch">
                    <Heading size="md" color="gray.800">
                      Informações do Plano
                    </Heading>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <Box>
                        <Text fontSize="sm" color="gray.600" mb={1}>
                          Tipo de Plano
                        </Text>
                        <Text fontSize="lg" fontWeight="bold" color="purple.600">
                          {tipoPlano === 'vitalicio' ? 'Vitalício' :
                           tipoPlano === 'gratis' ? 'Avaliação' : 
                           (tipoPlano === '' ? 'Grátis' : 
                           (tipoPlano ? tipoPlano.charAt(0).toUpperCase() + tipoPlano.slice(1) : 'Nenhum'))}
                        </Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.600" mb={1}>
                          Data de Término
                        </Text>
                        <Text fontSize="lg" fontWeight="bold" color="green.600">
                          {dataTerminoPlano ? formatarDataTermino(dataTerminoPlano) : '-'}
                        </Text>
                      </Box>
                    </SimpleGrid>
                    
                    {!isPremium && (
                      <Box mt={4} p={4} bg="blue.50" borderRadius="lg" border="1px" borderColor="blue.200">
                        <Text fontSize="md" color="blue.800" mb={3}>
                          💎 Para liberar todos os recursos, ative o <strong>Premium</strong> agora mesmo e tenha acesso completo à plataforma.
                        </Text>
                        <Button
                          colorScheme="blue"
                          size="lg"
                          onClick={() => navigate(`/dashboard/${uid}/plano`)}
                          leftIcon={<Star />}
                        >
                          Ativar Premium
                        </Button>
                      </Box>
                    )}
                  </VStack>
                </CardBody>
              </Card>
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
