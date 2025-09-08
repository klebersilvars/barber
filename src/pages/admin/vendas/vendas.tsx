"use client"

import './vendas.css'
import { useState, useEffect } from "react"
import {
  Box,
  Container,
  Heading,
  Text,
  Flex,
  HStack,
  Spacer,
  Button,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  InputGroup,
  Input,
  InputLeftElement,
  InputRightElement,
  IconButton,
  useColorModeValue,
  VStack,
  Badge,
  Tag,
  TagLabel,
  Avatar,
  Wrap,
  WrapItem,
  ButtonGroup,
  Divider,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Select,
  Textarea,
  GridItem
} from "@chakra-ui/react"
import {
  Search,
  Plus,
  ShoppingCart,
  Filter,
  DollarSign,
  Package,
  User,
  X,
  ChevronDown,
  Check,
  ArrowLeft,
  Trash2,
  Edit,
  CreditCard,
  Clock,
  Calendar,
} from "lucide-react"
import { firestore } from '../../../firebase/firebase';
import { collection, addDoc, getDocs, query, where, onSnapshot, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import { getAuth } from "firebase/auth"

interface Sale {
  id: string
  produto: string
  quantidade: number
  precoUnitario: number
  precoTotal: number
  cliente: string
  clienteUid?: string
  vendedor: string
  vendedorUid?: string
  dataVenda: Date
  formaPagamento: string
  status: string
  observacoes: string
  categoria: string
}

interface Colaborador {
  id: string;
  nome: string;
}

interface Cliente {
  id: string;
  nome: string;
}

// Função utilitária para obter o mês/ano de uma data
function getMonthYear(date: Date) {
  return dayjs(date).format('MM/YYYY')
}

const Vendas: React.FC = () => {
  const [showModal, setShowModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [formStep, setFormStep] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPayment, setFilterPayment] = useState("all")
  const [sales, setSales] = useState<Sale[]>([])
  const { uid } = useParams(); // UID da empresa
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [vendedorUid, setVendedorUid] = useState("");
  const [empresaNome, setEmpresaNome] = useState("");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteUid, setClienteUid] = useState("");
  const [clientesMap, setClientesMap] = useState<{ [key: string]: string }>({});
  const [vendedoresMap, setVendedoresMap] = useState<{ [key: string]: string }>({});
  const [tipoPlano, setTipoPlano] = useState<string | null>(null)
  const [isPremium, setIsPremium] = useState<boolean>(true)
  const navigate = useNavigate()
  const auth = getAuth()
  useEffect(() => {
    if (!auth.currentUser?.uid) return
    const docRef = doc(firestore, 'contas', auth.currentUser.uid)
    getDoc(docRef).then((docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data()
        setTipoPlano(data.tipoPlano || null)
        setIsPremium(data.premium === true)
      }
    })
  }, [auth.currentUser])
  useEffect(() => {
    if (tipoPlano === 'individual' && !window.location.pathname.includes('vendas')) {
      navigate(`/dashboard/${auth.currentUser?.uid}`)
    }
    if (!isPremium) {
      navigate(`/dashboard/${auth.currentUser?.uid}`)
    }
  }, [tipoPlano, isPremium, navigate, auth.currentUser])

  // Form states
  const [produto, setProduto] = useState("")
  const [quantidade, setQuantidade] = useState(1)
  const [precoUnitario, setPrecoUnitario] = useState("")
  const [vendedor, setVendedor] = useState("")
  const [formaPagamento, setFormaPagamento] = useState("")
  const [status, setStatus] = useState("concluida")
  const [observacoes, setObservacoes] = useState("")
  const [categoria, setCategoria] = useState("")

  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // Estado para o mês selecionado
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  // Estado para modal de histórico
  const [showHistorico, setShowHistorico] = useState(false)
  // Estado para armazenar totais por mês
  const [historicoMeses, setHistoricoMeses] = useState<{ mes: string, total: number }[]>([])

  const [showMobileMenu, setShowMobileMenu] = useState(false)

  // Buscar colaboradores e nome da empresa
  useEffect(() => {
    if (!uid) return;
    // Buscar colaboradores criados por este UID
    const colaboradoresRef = collection(firestore, 'colaboradores');
    const q = query(colaboradoresRef, where('createdBy', '==', uid));
    getDocs(q).then(snapshot => {
      setColaboradores(snapshot.docs.map(doc => ({ id: doc.id, nome: doc.data().nome })));
    });
    // Buscar nome da empresa
    getDocs(query(collection(firestore, 'contas'), where('__name__', '==', uid))).then(snapshot => {
      if (!snapshot.empty) setEmpresaNome(snapshot.docs[0].data().nomeEstabelecimento || '');
    });
  }, [uid]);

  // Buscar vendas reais do Firestore
  useEffect(() => {
    if (!uid) return;
    const vendasRef = collection(firestore, 'vendas');
    const q = query(vendasRef, where('empresaUid', '==', uid));
    const unsub = onSnapshot(q, (snapshot) => {
      setSales(snapshot.docs.map(doc => {
        const data = doc.data();
        const clienteUid = data.clienteUid || data.cliente || "";
        const precoTotalFromData = (typeof data.precoTotal === 'number' ? data.precoTotal : undefined) ?? (typeof data.valor === 'number' ? data.valor : 0);
        const quantidadeFromData = typeof data.quantidade === 'number' && data.quantidade > 0 ? data.quantidade : 0;
        const precoUnitarioFromData = typeof data.precoUnitario === 'number'
          ? data.precoUnitario
          : (quantidadeFromData > 0 && precoTotalFromData
            ? Number(precoTotalFromData) / Number(quantidadeFromData)
            : 0);
        return {
          id: doc.id,
          produto: data.produto || "",
          quantidade: quantidadeFromData || 0,
          precoUnitario: precoUnitarioFromData,
          precoTotal: precoTotalFromData || 0,
          cliente: clienteUid,
          clienteUid: clienteUid,
          vendedor: data.vendedorNome || data.vendedor || "",
          vendedorUid: data.vendedorUid || "",
          dataVenda: data.dataVenda?.toDate ? data.dataVenda.toDate() : new Date(data.dataVenda),
          formaPagamento: data.formaPagamento || "",
          status: data.status || "",
          observacoes: data.observacoes || "",
          categoria: data.categoria || "",
        };
      }));
    });
    return () => unsub();
  }, [uid]);

  // Buscar clientes cadastrados pela empresa logada
  useEffect(() => {
    if (!uid) return;
    const clientesRef = collection(firestore, 'clienteUser');
    const q = query(clientesRef, where('cadastradoPor', '==', uid));
    getDocs(q).then(snapshot => {
      const clientesData = snapshot.docs.map(doc => ({
        id: doc.id,
        nome: doc.data().nome || '',
      }));
      setClientes(clientesData);
      // Criar um mapa de clientes para fácil acesso
      const clientesMap: { [key: string]: string } = {};
      clientesData.forEach(cliente => {
        clientesMap[cliente.id] = cliente.nome;
      });
      setClientesMap(clientesMap);
    });
  }, [uid]);

  // Buscar nomes dos vendedores em tempo real
  useEffect(() => {
    const vendedorUids = Array.from(new Set(sales.map(sale => sale.vendedorUid).filter(Boolean)));
    if (vendedorUids.length === 0) {
      setVendedoresMap({});
      return;
    }
    // Buscar todos os vendedores de uma vez
    const colaboradoresRef = collection(firestore, 'colaboradores');
    getDocs(colaboradoresRef).then(snapshot => {
      const map: { [key: string]: string } = {};
      snapshot.docs.forEach(doc => {
        if (vendedorUids.includes(doc.id)) {
          map[doc.id] = doc.data().nome;
        }
      });
      setVendedoresMap(map);
    });
  }, [sales]);

  // Atualizar histórico de vendas por mês
  useEffect(() => {
    // Agrupar vendas por mês/ano
    const map: { [mes: string]: number } = {}
    sales.forEach(sale => {
      const mes = getMonthYear(sale.dataVenda)
      map[mes] = (map[mes] || 0) + sale.precoTotal
    })
    const historico = Object.entries(map).map(([mes, total]) => ({ mes, total }))
    historico.sort((a, b) => dayjs(b.mes, 'MM/YYYY').toDate().getTime() - dayjs(a.mes, 'MM/YYYY').toDate().getTime())
    setHistoricoMeses(historico)
  }, [sales])

  // Filtrar vendas do mês selecionado
  const vendasDoMes = sales.filter(sale => {
    const data = sale.dataVenda
    const ano = data.getFullYear()
    const mes = String(data.getMonth() + 1).padStart(2, '0')
    return `${ano}-${mes}` === selectedMonth
  })

  const filteredSales = vendasDoMes.filter((sale) => {
    const clienteNome = sale.clienteUid ? clientesMap[sale.clienteUid] || '' : '';
    const matchesSearch =
      sale.produto.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clienteNome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.vendedor.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = filterStatus === "all" || sale.status === filterStatus
    const matchesPayment = filterPayment === "all" || sale.formaPagamento === filterPayment

    return matchesSearch && matchesStatus && matchesPayment
  })

  const handleOpenModal = () => {
    setShowModal(true)
    setFormStep(1)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    // Reset form
    setProduto("")
    setQuantidade(1)
    setPrecoUnitario("")
    setVendedor("")
    setFormaPagamento("")
    setStatus("concluida")
    setObservacoes("")
    setCategoria("")
    setFormStep(1)
  }

  const handleNextStep = () => {
    setFormStep(formStep + 1)
  }

  const handlePrevStep = () => {
    setFormStep(formStep - 1)
  }

  const handleVendedorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setVendedor(selectedId ? colaboradores.find(c => c.id === selectedId)?.nome || "" : "");
    setVendedorUid(selectedId);
  };

  const handleClienteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setClienteUid(selectedId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const precoTotal = quantidade * Number.parseFloat(precoUnitario || '0');
    const vendaData = {
      empresaUid: uid,
      empresaNome: empresaNome,
      vendedorNome: vendedor,
      vendedorUid: vendedorUid,
      valor: precoTotal,
      precoTotal: precoTotal,
      precoUnitario: Number.parseFloat(precoUnitario || '0'),
      formaPagamento,
      produto,
      quantidade,
      categoria,
      clienteUid: clienteUid,
      status,
      observacoes,
      dataVenda: new Date(),
    };
    await addDoc(collection(firestore, 'vendas'), vendaData);
    alert('Venda cadastrada com sucesso!');
    handleCloseModal();
  };

  const handleDeleteSale = async (saleId: string) => {
    if (confirm("Tem certeza que deseja excluir esta venda?")) {
      try {
        await deleteDoc(doc(firestore, 'vendas', saleId));
        alert('Venda excluída com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir venda:', error);
        alert('Erro ao excluir venda. Tente novamente.');
      }
    }
  };

  // Removido: função de visualização não está em uso no layout atual

  const handleEditSale = (sale: Sale) => {
    setSelectedSale(sale);
    setProduto(sale.produto);
    setQuantidade(sale.quantidade);
    setPrecoUnitario(sale.precoUnitario.toFixed(2));
    setClienteUid(sale.clienteUid || '');
    setVendedorUid(sale.vendedorUid || '');
    setVendedor(sale.vendedor);
    setFormaPagamento(sale.formaPagamento);
    setStatus(sale.status);
    setObservacoes(sale.observacoes);
    setCategoria(sale.categoria);
    setShowEditModal(true);
  };

  const handleUpdateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSale) return;

    try {
      const precoTotal = quantidade * Number.parseFloat(precoUnitario);
      const vendaData = {
        empresaUid: uid,
        empresaNome: empresaNome,
        vendedorNome: vendedor,
        vendedorUid: vendedorUid,
        valor: precoTotal,
        precoTotal: precoTotal,
        formaPagamento,
        produto,
        quantidade,
        categoria,
        clienteUid: clienteUid,
        status,
        observacoes,
        dataVenda: selectedSale.dataVenda,
        precoUnitario: Number.parseFloat(precoUnitario),
      };

      await updateDoc(doc(firestore, 'vendas', selectedSale.id), vendaData);
      alert('Venda atualizada com sucesso!');
      setShowEditModal(false);
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao atualizar venda:', error);
      alert('Erro ao atualizar venda. Tente novamente.');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date)
  }

  const totalVendas = filteredSales.reduce((sum, sale) => sum + sale.precoTotal, 0)

  const bgCard = useColorModeValue('white', 'gray.800')
  const border = useColorModeValue('gray.200', 'gray.700')

  return (
    <Container maxW="container.xl" px={{ base: 3, md: 10 }} py={{ base: 4, md: 6 }} minH={{ base: 'calc(80dvh + 200px)', md: 'calc(100vh + 140px)' }} overflowY="auto" pb={{ base: 40, md: 32 }}>
      <Flex align="center" mb={6} gap={4} wrap="wrap">
        <Box>
          <Heading size="lg" color="purple.700">Vendas</Heading>
          <Text color="gray.600">Gerencie suas vendas e acompanhe o faturamento</Text>
        </Box>
        <Spacer />
        <Wrap spacing={{ base: 2, md: 2 }} align="center">
          <WrapItem>
            <HStack spacing={{ base: 1, md: 2 }}>
              <Calendar size={18} color="#6366f1" />
              <Input
                type="month"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                size={{ base: 'sm', md: 'sm' }}
                width={{ base: '120px', md: 'auto' }}
              />
            </HStack>
          </WrapItem>
          <WrapItem>
            <Button size={{ base: 'sm', md: 'md' }} leftIcon={<Filter size={18} />} variant="outline" onClick={() => setShowFilters(!showFilters)}>
              Filtros
            </Button>
          </WrapItem>
          <WrapItem>
            <Button size={{ base: 'sm', md: 'md' }} leftIcon={<Clock size={18} />} variant="outline" onClick={() => setShowHistorico(true)}>
              Histórico
            </Button>
          </WrapItem>
          <WrapItem display={{ base: 'none', md: 'inline-flex' }}>
            <Button size={{ base: 'sm', md: 'md' }} colorScheme="purple" leftIcon={<Plus size={18} />} onClick={handleOpenModal}>
              Nova Venda
            </Button>
          </WrapItem>
        </Wrap>
      </Flex>

      {/* Botão flutuante para criar venda (mobile) */}
      <IconButton
        aria-label="Nova venda"
        colorScheme="purple"
        icon={<Plus size={20} />}
        position="fixed"
        bottom={{ base: 6, md: -9999 }}
        right={{ base: 6, md: -9999 }}
        borderRadius="full"
        size="lg"
        boxShadow="lg"
        zIndex={20}
        onClick={handleOpenModal}
      />

      <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={{ base: 3, md: 4 }} mb={{ base: 4, md: 6 }}>
        <Card bg={bgCard} border="1px" borderColor={border}><CardBody textAlign="center">
          <Heading size={{ base: 'sm', md: 'md' }} color="purple.600">{filteredSales.length}</Heading>
          <Text fontSize={{ base: 'xs', md: 'sm' }} color="gray.600">Total de Vendas</Text>
        </CardBody></Card>
        <Card bg={bgCard} border="1px" borderColor={border}><CardBody textAlign="center">
          <Heading size={{ base: 'sm', md: 'md' }} color="green.600">{formatCurrency(totalVendas)}</Heading>
          <Text fontSize={{ base: 'xs', md: 'sm' }} color="gray.600">Faturamento Total</Text>
        </CardBody></Card>
        <Card bg={bgCard} border="1px" borderColor={border}><CardBody textAlign="center">
          <Heading size={{ base: 'sm', md: 'md' }} color="orange.600">{formatCurrency(totalVendas / (filteredSales.length || 1))}</Heading>
          <Text fontSize={{ base: 'xs', md: 'sm' }} color="gray.600">Ticket Médio</Text>
        </CardBody></Card>
      </SimpleGrid>

      <Card bg={bgCard} border="1px" borderColor={border} mb={6}><CardBody>
        <Flex direction={{ base: 'column', md: 'row' }} align="center" gap={{ base: 3, md: 4 }}>
          <InputGroup size={{ base: 'sm', md: 'md' }} maxW={{ base: '100%', md: '500px' }}>
            <InputLeftElement pointerEvents="none">
              <Search size={18} color="#64748b" />
            </InputLeftElement>
            <Input placeholder="Buscar por produto, cliente ou vendedor..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            {searchQuery && (
              <InputRightElement>
                <IconButton aria-label="Limpar busca" size={{ base: 'sm', md: 'sm' }} variant="ghost" icon={<X size={16} />} onClick={() => setSearchQuery('')} />
              </InputRightElement>
            )}
          </InputGroup>
          <Spacer />
          <Text fontSize={{ base: 'xs', md: 'sm' }} color="gray.600">{filteredSales.length} venda(s) encontrada(s)</Text>
        </Flex>
      </CardBody></Card>
      {showMobileMenu && (
        <div className="mobile-menu-overlay" onClick={() => setShowMobileMenu(false)}>
          <div className="mobile-menu" onClick={e => e.stopPropagation()}>
            <button className="close-mobile-menu" onClick={() => setShowMobileMenu(false)}><X size={24} /></button>
            <nav className="mobile-nav">
              <a href="/dashboard" onClick={() => setShowMobileMenu(false)}>Dashboard</a>
              <a href="/agenda" onClick={() => setShowMobileMenu(false)}>Agenda</a>
              <a href="/vendas" onClick={() => setShowMobileMenu(false)}>Vendas</a>
              <a href="/clientes" onClick={() => setShowMobileMenu(false)}>Clientes</a>
              <a href="/servicos" onClick={() => setShowMobileMenu(false)}>Serviços</a>
            </nav>
          </div>
        </div>
      )}

    
      

      {/* Stats */}
      <div
        className="stats-container"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
          padding: "20px",
          background: "white",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="stat-item" style={{ textAlign: "center" }}>
          <div style={{ color: "var(--primary)", fontSize: "24px", fontWeight: "700" }}>{filteredSales.length}</div>
          <div style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Total de Vendas</div>
        </div>
        <div className="stat-item" style={{ textAlign: "center" }}>
          <div style={{ color: "var(--success)", fontSize: "24px", fontWeight: "700" }}>
            {formatCurrency(totalVendas)}
          </div>
          <div style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Faturamento Total</div>
        </div>
        <div className="stat-item" style={{ textAlign: "center" }}>
          <div style={{ color: "var(--warning)", fontSize: "24px", fontWeight: "700" }}>
            {formatCurrency(totalVendas / (filteredSales.length || 1))}
          </div>
          <div style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Ticket Médio</div>
        </div>
      </div>

      {/* Modal de Histórico - Chakra */}
      <Modal isOpen={showHistorico} onClose={() => setShowHistorico(false)} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Histórico de Vendas por Mês</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {historicoMeses.length === 0 ? (
              <Text>Nenhum histórico encontrado.</Text>
            ) : (
              <VStack align="stretch" spacing={3}>
                {historicoMeses.map(h => (
                  <Flex key={h.mes} justify="space-between" py={2} borderBottom="1px" borderColor={border}>
                    <Text fontWeight="medium">{h.mes}</Text>
                    <Text color="green.600" fontWeight="bold">{formatCurrency(h.total)}</Text>
                  </Flex>
                ))}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => setShowHistorico(false)}>Fechar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Filtros - Chakra */}
      {showFilters && (
        <Card bg={bgCard} border="1px" borderColor={border} mb={6}>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <HStack spacing={3} flexWrap="wrap">
                <Text fontWeight="semibold">Status:</Text>
                <Button size="sm" variant={filterStatus === 'all' ? 'solid' : 'outline'} colorScheme="purple" onClick={() => setFilterStatus('all')}>Todos</Button>
                <Button size="sm" variant={filterStatus === 'concluida' ? 'solid' : 'outline'} colorScheme="purple" onClick={() => setFilterStatus('concluida')}>Concluídas</Button>
                <Button size="sm" variant={filterStatus === 'pendente' ? 'solid' : 'outline'} colorScheme="purple" onClick={() => setFilterStatus('pendente')}>Pendentes</Button>
                <Button size="sm" variant={filterStatus === 'cancelada' ? 'solid' : 'outline'} colorScheme="purple" onClick={() => setFilterStatus('cancelada')}>Canceladas</Button>
              </HStack>
              <HStack spacing={3} flexWrap="wrap">
                <Text fontWeight="semibold">Pagamento:</Text>
                <Button size="sm" variant={filterPayment === 'all' ? 'solid' : 'outline'} colorScheme="purple" onClick={() => setFilterPayment('all')}>Todas</Button>
                <Button size="sm" variant={filterPayment === 'Dinheiro' ? 'solid' : 'outline'} colorScheme="purple" onClick={() => setFilterPayment('Dinheiro')}>Dinheiro</Button>
                <Button size="sm" variant={filterPayment === 'PIX' ? 'solid' : 'outline'} colorScheme="purple" onClick={() => setFilterPayment('PIX')}>PIX</Button>
                <Button size="sm" variant={filterPayment === 'Cartão de Crédito' ? 'solid' : 'outline'} colorScheme="purple" onClick={() => setFilterPayment('Cartão de Crédito')}>Cartão</Button>
              </HStack>
            </SimpleGrid>
          </CardBody>
        </Card>
      )}

      {/* Search */}
      <div className="search-container">
        <div className="search-input">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por produto, cliente ou vendedor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search" onClick={() => setSearchQuery("")}>
              <X size={16} />
            </button>
          )}
        </div>
        <div className="search-results">
          {filteredSales.length > 0 ? (
            <div className="results-count">
              <span>{filteredSales.length} venda(s) encontrada(s)</span>
            </div>
          ) : (
            <div className="empty-state">
              <ShoppingCart size={48} />
              <h3>Nenhuma venda encontrada</h3>
              <p>Cadastre sua primeira venda para começar!</p>
              <button className="btn-primary" onClick={handleOpenModal}>
                <Plus size={18} />
                Nova Venda
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lista de Vendas - Chakra */}
      {filteredSales.length > 0 && (
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={{ base: 3, md: 5, lg: 6 }}>
          {filteredSales.map((sale) => (
            <Card
              key={sale.id}
              bg={bgCard}
              border="1px"
              borderColor={sale.status === 'concluida' ? 'green.200' : sale.status === 'pendente' ? 'yellow.200' : 'red.200'}
              boxShadow="sm"
              transition="all 0.25s ease"
              _hover={{ boxShadow: 'lg', transform: 'translateY(-4px)' }}
              borderRadius="xl"
            >
              <CardHeader pb={{ base: 2, md: 3 }}>
                <Flex align="center" justify="space-between" gap={3}>
                  <HStack spacing={{ base: 2, md: 3 }} overflow="hidden">
                    <Avatar size={{ base: 'xs', md: 'sm' }} name={sale.vendedor} bg="purple.500" color="white" />
                    <VStack align="start" spacing={0}>
                      <Heading size={{ base: 'xs', md: 'sm' }} color="purple.700">{sale.produto}</Heading>
                      {sale.categoria && (
                        <Tag size={{ base: 'xs', md: 'sm' }} colorScheme="purple" variant="subtle" borderRadius="full">
                          <TagLabel>{sale.categoria}</TagLabel>
                        </Tag>
                      )}
                    </VStack>
                  </HStack>
                  <Badge variant="subtle" colorScheme="gray" fontSize={{ base: '9px', md: 'xs' }} px={{ base: 1.5, md: 2 }}>{formatDate(sale.dataVenda)}</Badge>
                </Flex>
              </CardHeader>
              <CardBody pt={0}>
                <VStack align="stretch" spacing={{ base: 2, md: 3 }} fontSize={{ base: 'xs', md: 'sm' }}>
                  <HStack color="gray.700">
                    <User size={16} />
                    <Text><b>Cliente:</b> {clientesMap[sale.clienteUid || ''] || 'Cliente não encontrado'}</Text>
                  </HStack>
                  <HStack color="gray.700">
                    <Package size={16} />
                    <Text><b>Quantidade:</b> {sale.quantidade} un.</Text>
                  </HStack>
                  <HStack color="gray.700">
                    <DollarSign size={16} />
                    <Text><b>Valor Unit.:</b> {formatCurrency(sale.precoUnitario)}</Text>
                  </HStack>
                  <Flex align="center" justify="space-between" pt={{ base: 0.5, md: 1 }}>
                    <Wrap align="center">
                      <WrapItem>
                        <HStack color="gray.700">
                          <CreditCard size={16} />
                          <Text><b>Pagamento:</b></Text>
                          <Badge
                            ml={1}
                            variant="subtle"
                            colorScheme={
                              sale.formaPagamento === 'PIX' ? 'purple' :
                              (sale.formaPagamento === 'Dinheiro' ? 'green' : 'blue')
                            }
                          >
                            {sale.formaPagamento || '—'}
                          </Badge>
                        </HStack>
                      </WrapItem>
                    </Wrap>
                    <Box bg="green.50" color="green.700" px={{ base: 2, md: 3 }} py={{ base: 1.5, md: 2 }} borderRadius="md" border="1px" borderColor="green.200">
                      <Text fontSize={{ base: '10px', md: 'xs' }}>Total</Text>
                      <Text fontSize={{ base: 'md', md: 'lg' }} fontWeight="bold">{formatCurrency(sale.precoTotal)}</Text>
                    </Box>
                  </Flex>
                  <Divider />
                  <Wrap spacing={{ base: 1.5, md: 2 }} pt={{ base: 0.5, md: 1 }}>
                    <WrapItem>
                      <Badge fontSize={{ base: '10px', md: 'xs' }} colorScheme={sale.status === 'concluida' ? 'green' : sale.status === 'pendente' ? 'yellow' : 'red'} variant="subtle">
                        {sale.status === 'concluida' ? 'Concluída' : sale.status === 'pendente' ? 'Pendente' : 'Cancelada'}
                      </Badge>
                    </WrapItem>
                    {sale.vendedor && (
                      <WrapItem>
                        <Tag size={{ base: 'xs', md: 'sm' }} variant="subtle" colorScheme="gray">
                          <TagLabel>{sale.vendedor}</TagLabel>
                        </Tag>
                      </WrapItem>
                    )}
                  </Wrap>
                </VStack>
              </CardBody>
              <CardFooter pt={0}>
                <ButtonGroup variant="ghost" size={{ base: 'xs', md: 'sm' }}>
                  <IconButton aria-label="Excluir" colorScheme="red" icon={<Trash2 size={18} />} onClick={() => handleDeleteSale(sale.id)} />
                  <IconButton aria-label="Editar" icon={<Edit size={18} />} onClick={() => handleEditSale(sale)} />
                </ButtonGroup>
              </CardFooter>
            </Card>
          ))}
        </SimpleGrid>
      )}

      {/* Modal Ver Venda - Chakra */}
      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Detalhes da Venda</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedSale && (
              <VStack align="stretch" spacing={4}>
                <Box>
                  <Heading size="sm" mb={2}>Informações do Produto</Heading>
                  <Text><b>Produto:</b> {selectedSale.produto}</Text>
                  <Text><b>Quantidade:</b> {selectedSale.quantidade} un.</Text>
                  <Text><b>Preço Unitário:</b> {formatCurrency(selectedSale.precoUnitario)}</Text>
                  <Text><b>Total:</b> {formatCurrency(selectedSale.precoTotal)}</Text>
                  <Text><b>Categoria:</b> {selectedSale.categoria || 'Não especificada'}</Text>
                </Box>
                <Divider />
                <Box>
                  <Heading size="sm" mb={2}>Informações da Venda</Heading>
                  <Text><b>Cliente:</b> {clientesMap[selectedSale.clienteUid || ''] || 'Cliente não encontrado'}</Text>
                  <Text><b>Vendedor:</b> {vendedoresMap[selectedSale.vendedorUid || ''] || 'Vendedor não encontrado'}</Text>
                  <Text><b>Forma de Pagamento:</b> {selectedSale.formaPagamento}</Text>
                  <Text><b>Status:</b> {selectedSale.status}</Text>
                  <Text><b>Data:</b> {formatDate(selectedSale.dataVenda)}</Text>
                </Box>
                {selectedSale.observacoes && (
                  <Box>
                    <Heading size="sm" mb={2}>Observações</Heading>
                    <Text>{selectedSale.observacoes}</Text>
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => setShowViewModal(false)}>Fechar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Editar Venda - Chakra */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} size="xl">
        <ModalOverlay />
        <ModalContent borderRadius="xl" boxShadow="2xl" border="1px" borderColor={border}>
          <ModalHeader>
            <VStack align="start" spacing={1}>
              <Heading size="md">Editar Venda</Heading>
              <Text fontSize="sm" color="gray.500">Atualize as informações e salve as alterações</Text>
            </VStack>
          </ModalHeader>
          <ModalCloseButton />
          <form onSubmit={handleUpdateSale}>
            <ModalBody>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl>
                  <FormLabel>Produto</FormLabel>
                  <Input placeholder="Nome do produto" value={produto} onChange={(e) => setProduto(e.target.value)} variant="filled" size="sm" focusBorderColor="purple.400" borderRadius="md" />
                </FormControl>
                <FormControl>
                  <FormLabel>Quantidade</FormLabel>
                  <InputGroup>
                    <Input type="number" min={1} value={quantidade} onChange={(e) => setQuantidade(Number.parseInt(e.target.value) || 1)} variant="filled" size="sm" focusBorderColor="purple.400" borderRadius="md" pr="10" />
                    <InputRightElement pointerEvents="none" color="gray.500" fontSize="xs" mr={2}>un</InputRightElement>
                  </InputGroup>
                </FormControl>
                <FormControl>
                  <FormLabel>Preço Unitário</FormLabel>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none" color="gray.500" fontSize="sm" pl={2}>R$</InputLeftElement>
                    <Input type="number" step="0.01" min={0} value={precoUnitario} onChange={(e) => setPrecoUnitario(e.target.value)} variant="filled" size="sm" focusBorderColor="purple.400" borderRadius="md" pl={10} />
                  </InputGroup>
                </FormControl>
                <FormControl>
                  <FormLabel>Categoria</FormLabel>
                  <Select placeholder="Selecione uma categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)} variant="filled" size="sm" focusBorderColor="purple.400" borderRadius="md">
                    <option value="Cabelo">Cabelo</option>
                    <option value="Unhas">Unhas</option>
                    <option value="Barba">Barba</option>
                    <option value="Pele">Pele</option>
                    <option value="Acessórios">Acessórios</option>
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>Cliente</FormLabel>
                  <Select placeholder="Selecione o cliente" value={clienteUid} onChange={handleClienteChange} variant="filled" size="sm" focusBorderColor="purple.400" borderRadius="md">
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>Vendedor</FormLabel>
                  <Select placeholder="Selecione o vendedor" value={vendedorUid} onChange={handleVendedorChange} variant="filled" size="sm" focusBorderColor="purple.400" borderRadius="md">
                    {colaboradores.map(c => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>Forma de Pagamento</FormLabel>
                  <Select placeholder="Selecione a forma de pagamento" value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)} variant="filled" size="sm" focusBorderColor="purple.400" borderRadius="md">
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="PIX">PIX</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>Status</FormLabel>
                  <Select value={status} onChange={(e) => setStatus(e.target.value)} variant="filled" size="sm" focusBorderColor="purple.400" borderRadius="md">
                    <option value="concluida">Concluída</option>
                    <option value="pendente">Pendente</option>
                    <option value="cancelada">Cancelada</option>
                  </Select>
                </FormControl>
                <GridItem colSpan={{ base: 1, md: 2 }}>
                  <FormControl>
                    <FormLabel>Observações</FormLabel>
                    <Textarea rows={4} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Adicione observações sobre a venda..." variant="filled" size="sm" focusBorderColor="purple.400" borderRadius="md" />
                  </FormControl>
                </GridItem>
                <GridItem colSpan={{ base: 1, md: 2 }}>
                  <Box mt={2} p={4} border="1px" borderColor={border} borderRadius="md" bg={useColorModeValue('gray.50','whiteAlpha.50')}>
                    <Flex align="center" justify="space-between">
                      <Text color="gray.600">Total da Venda</Text>
                      <Heading size="md" color="green.600">{formatCurrency((quantidade || 0) * Number.parseFloat(precoUnitario || '0'))}</Heading>
                    </Flex>
                  </Box>
                </GridItem>
              </SimpleGrid>
            </ModalBody>
            <ModalFooter>
              <ButtonGroup>
                <Button variant="ghost" onClick={() => setShowEditModal(false)}>Cancelar</Button>
                <Button colorScheme="purple" type="submit">Salvar Alterações</Button>
              </ButtonGroup>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Add Sale Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <button className="modal-back" onClick={formStep > 1 ? handlePrevStep : handleCloseModal}>
                <ArrowLeft size={20} />
              </button>
              <h2>
                {formStep === 1 && "Nova Venda"}
                {formStep === 2 && "Detalhes da Venda"}
                {formStep === 3 && "Finalizar Venda"}
              </h2>
              <div className="modal-steps">
                <div className={`step ${formStep >= 1 ? "active" : ""}`}>1</div>
                <div className="step-line"></div>
                <div className={`step ${formStep >= 2 ? "active" : ""}`}>2</div>
                <div className="step-line"></div>
                <div className={`step ${formStep >= 3 ? "active" : ""}`}>3</div>
              </div>
              <button className="modal-close" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Step 1: Product Information */}
              {formStep === 1 && (
                <div className="modal-body">
                  <div className="form-section">
                    <h3>Informações do Produto</h3>

                    <div className="form-group">
                      <label htmlFor="produto">Produto*</label>
                      <input
                        type="text"
                        id="produto"
                        placeholder="Nome do produto"
                        value={produto}
                        onChange={(e) => setProduto(e.target.value)}
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="quantidade">Quantidade*</label>
                        <input
                          type="number"
                          id="quantidade"
                          placeholder="1"
                          min="1"
                          value={quantidade}
                          onChange={(e) => setQuantidade(Number.parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="precoUnitario">Preço Unitário*</label>
                        <input
                          type="number"
                          id="precoUnitario"
                          placeholder="0,00"
                          step="0.01"
                          min="0"
                          value={precoUnitario}
                          onChange={(e) => setPrecoUnitario(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="categoria">Categoria</label>
                      <div className="select-wrapper">
                        <select id="categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                          <option value="">Selecione uma categoria</option>
                          <option value="Cabelo">Cabelo</option>
                          <option value="Unhas">Unhas</option>
                          <option value="Barba">Barba</option>
                          <option value="Pele">Pele</option>
                          <option value="Acessórios">Acessórios</option>
                        </select>
                        <ChevronDown size={18} />
                      </div>
                    </div>

                    {precoUnitario && quantidade && (
                      <div className="info-display">
                        <p>
                          <strong>Total da Venda:</strong>{" "}
                          {formatCurrency(quantidade * Number.parseFloat(precoUnitario || "0"))}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="form-footer">
                    <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                      Cancelar
                    </button>
                    <button type="button" className="btn-primary" onClick={handleNextStep}>
                      Próximo
                      <ChevronDown size={18} className="rotate-270" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Customer and Seller Information */}
              {formStep === 2 && (
                <div className="modal-body">
                  <div className="form-section">
                    <h3>Informações da Venda</h3>

                    <div className="form-group">
                      <label htmlFor="cliente">Cliente*</label>
                      <div className="select-wrapper">
                        <select id="cliente" value={clienteUid} onChange={handleClienteChange} disabled={clientes.length === 0}>
                          {clientes.length === 0 ? (
                            <option value="">Nenhum cliente encontrado</option>
                          ) : (
                            <>
                              <option value="">Selecione o cliente</option>
                              {clientes.map(c => (
                                <option key={c.id} value={c.id}>{c.nome}</option>
                              ))}
                            </>
                          )}
                        </select>
                        <ChevronDown size={18} />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="vendedor">Vendedor*</label>
                      <div className="select-wrapper">
                        <select id="vendedor" value={vendedorUid} onChange={handleVendedorChange}>
                          <option value="">Selecione o vendedor</option>
                          {colaboradores.map(c => (
                            <option key={c.id} value={c.id}>{c.nome}</option>
                          ))}
                        </select>
                        <ChevronDown size={18} />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="formaPagamento">Forma de Pagamento*</label>
                      <div className="select-wrapper">
                        <select
                          id="formaPagamento"
                          value={formaPagamento}
                          onChange={(e) => setFormaPagamento(e.target.value)}
                        >
                          <option value="">Selecione a forma de pagamento</option>
                          <option value="Dinheiro">Dinheiro</option>
                          <option value="PIX">PIX</option>
                          <option value="Cartão de Débito">Cartão de Débito</option>
                          <option value="Cartão de Crédito">Cartão de Crédito</option>
                        </select>
                        <ChevronDown size={18} />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="status">Status da Venda</label>
                      <div className="select-wrapper">
                        <select id="status" value={status} onChange={(e) => setStatus(e.target.value)}>
                          <option value="concluida">Concluída</option>
                          <option value="pendente">Pendente</option>
                          <option value="cancelada">Cancelada</option>
                        </select>
                        <ChevronDown size={18} />
                      </div>
                    </div>
                  </div>

                  <div className="form-footer">
                    <button type="button" className="btn-secondary" onClick={handlePrevStep}>
                      <ChevronDown size={18} className="rotate-90" />
                      Voltar
                    </button>
                    <button type="button" className="btn-primary" onClick={handleNextStep}>
                      Próximo
                      <ChevronDown size={18} className="rotate-270" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Final Details */}
              {formStep === 3 && (
                <div className="modal-body">
                  <div className="form-section">
                    <h3>Finalizar Venda</h3>

                    <div className="form-group">
                      <label htmlFor="observacoes">Observações</label>
                      <textarea
                        id="observacoes"
                        placeholder="Adicione observações sobre a venda..."
                        rows={4}
                        value={observacoes}
                        onChange={(e) => setObservacoes(e.target.value)}
                      />
                    </div>

                    <div className="info-display">
                      <h4 style={{ marginBottom: "12px", color: "var(--text-primary)" }}>Resumo da Venda</h4>
                      <p>
                        <strong>Produto:</strong> {produto}
                      </p>
                      <p>
                        <strong>Quantidade:</strong> {quantidade} un.
                      </p>
                      <p>
                        <strong>Preço Unitário:</strong> {formatCurrency(Number.parseFloat(precoUnitario || "0"))}
                      </p>
                      <p>
                        <strong>Cliente:</strong> {clientesMap[clienteUid] || "Cliente não encontrado"}
                      </p>
                      <p>
                        <strong>Vendedor:</strong> {vendedor}
                      </p>
                      <p>
                        <strong>Forma de Pagamento:</strong> {formaPagamento}
                      </p>
                      <p style={{ fontSize: "18px", color: "var(--success)", fontWeight: "700", marginTop: "12px" }}>
                        <strong>Total: {formatCurrency(quantidade * Number.parseFloat(precoUnitario || "0"))}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="form-footer">
                    <button type="button" className="btn-secondary" onClick={handlePrevStep}>
                      <ChevronDown size={18} className="rotate-90" />
                      Voltar
                    </button>
                    <button type="submit" className="btn-primary">
                      <Check size={18} />
                      Finalizar Venda
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
      <Box display={{ base: 'block', md: 'block' }} height={{ base: 24, md: 16 }} />
    </Container>
  )
}

export default Vendas
