"use client"

import type React from "react"
import './vendas.css'
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  SimpleGrid,
  HStack,
  Spacer,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
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
  VStack,
  Badge,
  useColorModeValue,
  Icon,
  Divider,
  Progress,
  Stack,
} from '@chakra-ui/react'
import { useState, useEffect } from "react"
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
  Eye,
  CreditCard,
  Clock,
  Download
} from "lucide-react"
import { firestore } from '../../firebase/firebase';
import { collection, addDoc, getDocs, query, where, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

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

interface Cliente {
  id: string;
  nome: string;
}

const VendasAtendente: React.FC = () => {
  const [showModal, setShowModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [formStep, setFormStep] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPayment, setFilterPayment] = useState("all")
  const [sales, setSales] = useState<Sale[]>([])
  const { uid } = useParams(); // UID da empresa
  const [vendedorUid, setVendedorUid] = useState("");
  const [empresaNome, setEmpresaNome] = useState("");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteUid, setClienteUid] = useState("");
  const [clientesMap, setClientesMap] = useState<{ [key: string]: string }>({});

  // Form states
  const [produto, setProduto] = useState("")
  const [quantidade, setQuantidade] = useState(1)
  const [precoUnitario, setPrecoUnitario] = useState("")
  const [vendedor, setVendedor] = useState("Carregando...")
  const [formaPagamento, setFormaPagamento] = useState("")
  const [status, setStatus] = useState("concluida")
  const [observacoes, setObservacoes] = useState("")
  const [categoria, setCategoria] = useState("")

  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const [atendenteEmpresaUid, setAtendenteEmpresaUid] = useState("");

  // Buscar informações do atendente logado
  useEffect(() => {
    if (!uid) return;
    
    // Buscar o atendente na coleção colaboradores
    const colaboradoresRef = collection(firestore, 'colaboradores');
    const q = query(colaboradoresRef, where('__name__', '==', uid));
    getDocs(q).then((querySnapshot) => {
      if (!querySnapshot.empty) {
        const atendenteData = querySnapshot.docs[0].data();
        setAtendenteEmpresaUid(atendenteData.createdBy);
        setEmpresaNome(atendenteData.estabelecimento || '');
        setVendedor(atendenteData.nome || 'Nome não encontrado');
        setVendedorUid(uid);
      } else {
        setVendedor('Atendente não encontrado');
      }
    });
  }, [uid]);

  // Buscar colaboradores da empresa
  useEffect(() => {
    if (!atendenteEmpresaUid) return;
    const colaboradoresRef = collection(firestore, 'colaboradores');
    const q = query(colaboradoresRef, where('createdBy', '==', atendenteEmpresaUid));
    getDocs(q).then(() => {
      // setColaboradores(snapshot.docs.map(doc => ({ id: doc.id, nome: doc.data().nome }))); // Removido
    });
  }, [atendenteEmpresaUid]);

  // Buscar vendas da empresa
  useEffect(() => {
    if (!atendenteEmpresaUid) return;
    const vendasRef = collection(firestore, 'vendas');
    const q = query(vendasRef, where('empresaUid', '==', atendenteEmpresaUid));
    const unsub = onSnapshot(q, (snapshot) => {
      setSales(snapshot.docs.map(doc => {
        const data = doc.data();
        const clienteUid = data.clienteUid || data.cliente || "";
        return {
          id: doc.id,
          produto: data.produto || "",
          quantidade: data.quantidade || 0,
          precoUnitario: data.precoUnitario || 0,
          precoTotal: data.precoTotal || data.valor || 0,
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
  }, [atendenteEmpresaUid]);

  // Buscar clientes da empresa
  useEffect(() => {
    if (!atendenteEmpresaUid) return;
    const clientesRef = collection(firestore, 'clienteUser');
    const q = query(clientesRef, where('cadastradoPor', '==', atendenteEmpresaUid));
    getDocs(q).then(snapshot => {
      setClientes(snapshot.docs.map(doc => ({ id: doc.id, nome: doc.data().nome })));
    });
  }, [atendenteEmpresaUid]);

  // Buscar nomes dos clientes em tempo real para as vendas
  useEffect(() => {
    // Coletar todos os UIDs de clientes das vendas
    const clienteUids = Array.from(new Set(sales.map(sale => sale.clienteUid).filter(Boolean)));
    if (clienteUids.length === 0) {
      setClientesMap({});
      return;
    }
    // Buscar todos os clientes de uma vez
    const clientesRef = collection(firestore, 'clienteUser');
    getDocs(clientesRef).then(snapshot => {
      const map: { [key: string]: string } = {};
      snapshot.docs.forEach(doc => {
        if (clienteUids.includes(doc.id)) {
          map[doc.id] = doc.data().nome;
        }
      });
      setClientesMap(map);
    });
  }, [sales]);


  const filteredSales = sales.filter((sale) => {
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
    // Reset form (mantendo o vendedor que é o atendente logado)
    setProduto("")
    setQuantidade(1)
    setPrecoUnitario("")
    setClienteUid("")
    // setVendedor("") - Não resetar o vendedor pois é o atendente logado
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

  const handleClienteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setClienteUid(selectedId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const precoTotal = quantidade * Number.parseFloat(precoUnitario || '0');
    const vendaData = {
      empresaUid: atendenteEmpresaUid,
      empresaNome: empresaNome,
      vendedorNome: vendedor,
      vendedorUid: vendedorUid,
      valor: precoTotal,
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

  const handleViewSale = (sale: Sale) => {
    setSelectedSale(sale);
    setShowViewModal(true);
  };

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

  // Função para exportar vendas para Excel
  const handleExportToExcel = () => {
    try {
      // Preparar dados para exportação
      const exportData = filteredSales.map((sale, index) => {
        const clienteNome = sale.clienteUid ? clientesMap[sale.clienteUid] || 'Cliente não encontrado' : sale.cliente;
        const dataVenda = sale.dataVenda instanceof Date 
          ? sale.dataVenda.toLocaleDateString('pt-BR') 
          : new Date(sale.dataVenda).toLocaleDateString('pt-BR');
        
        return {
          'Nº': index + 1,
          'Produto': sale.produto,
          'Categoria': sale.categoria,
          'Quantidade': sale.quantidade,
          'Preço Unitário': `R$ ${sale.precoUnitario.toFixed(2).replace('.', ',')}`,
          'Preço Total': `R$ ${sale.precoTotal.toFixed(2).replace('.', ',')}`,
          'Cliente': clienteNome,
          'Vendedor': sale.vendedor,
          'Data da Venda': dataVenda,
          'Forma de Pagamento': sale.formaPagamento,
          'Status': sale.status === 'concluida' ? 'Concluída' : 
                   sale.status === 'pendente' ? 'Pendente' : 
                   sale.status === 'cancelada' ? 'Cancelada' : sale.status,
          'Observações': sale.observacoes || '-'
        };
      });

      // Criar workbook e worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      
      // Configurar largura das colunas
      const colWidths = [
        { wch: 5 },   // Nº
        { wch: 25 },  // Produto
        { wch: 15 },  // Categoria
        { wch: 10 },  // Quantidade
        { wch: 15 },  // Preço Unitário
        { wch: 15 },  // Preço Total
        { wch: 20 },  // Cliente
        { wch: 20 },  // Vendedor
        { wch: 12 },  // Data da Venda
        { wch: 15 },  // Forma de Pagamento
        { wch: 12 },  // Status
        { wch: 30 }   // Observações
      ];
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, 'Relatório de Vendas');
      
      // Gerar arquivo Excel
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Nome do arquivo com data atual
      const fileName = `relatorio_vendas_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Download do arquivo
      saveAs(data, fileName);
      
      alert('Relatório exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      alert('Erro ao exportar relatório. Tente novamente.');
    }
  };

  const handleUpdateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSale) return;

    try {
      const precoTotal = quantidade * Number.parseFloat(precoUnitario);
      const vendaData = {
        empresaUid: atendenteEmpresaUid,
        empresaNome: empresaNome,
        vendedorNome: vendedor,
        vendedorUid: vendedorUid,
        valor: precoTotal,
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

  return (
    <Box px={{ base: 4, md: 6 }} py={{ base: 4, md: 6 }} height='100vh' overflowY="auto">
      {/* Header */}
      <Flex direction={{ base: 'column', md: 'row' }} align={{ base: 'flex-start', md: 'center' }} gap={4} mb={6}>
        <Box>
          <Heading size="lg">Vendas</Heading>
          <Text color="gray.600">Gerencie suas vendas e acompanhe o faturamento</Text>
        </Box>
        <Spacer display={{ base: 'none', md: 'block' }} />
        <HStack spacing={3} w={{ base: 'full', md: 'auto' }}>
          <Button variant="outline" leftIcon={<Filter size={18} />} onClick={() => setShowFilters(!showFilters)} w={{ base: 'full', md: 'auto' }}>
            Filtros
          </Button>
          <Button variant="outline" leftIcon={<Download size={18} />} onClick={handleExportToExcel} w={{ base: 'full', md: 'auto' }}>
            Exportar
          </Button>
          <Button colorScheme="purple" leftIcon={<Plus size={18} />} onClick={handleOpenModal} w={{ base: 'full', md: 'auto' }}>
            Nova Venda
          </Button>
        </HStack>
      </Flex>

      {/* Stats */}
      <Box bg="white" borderWidth="1px" borderRadius="lg" p={{ base: 4, md: 5 }} mb={6}>
        <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={4}>
          <Flex direction="column" align="center">
            <Text color="purple.600" fontSize="2xl" fontWeight="bold">{filteredSales.length}</Text>
            <Text color="gray.500" fontSize="sm">Total de Vendas</Text>
          </Flex>
          <Flex direction="column" align="center">
            <Text color="green.600" fontSize="2xl" fontWeight="bold">{formatCurrency(totalVendas)}</Text>
            <Text color="gray.500" fontSize="sm">Faturamento Total</Text>
          </Flex>
          <Flex direction="column" align="center">
            <Text color="orange.500" fontSize="2xl" fontWeight="bold">{formatCurrency(totalVendas / (filteredSales.length || 1))}</Text>
            <Text color="gray.500" fontSize="sm">Ticket Médio</Text>
          </Flex>
        </SimpleGrid>
      </Box>

      {/* Filters */}
      {showFilters && (
        <Box borderWidth="1px" borderRadius="lg" p={4} mb={6} bg="white">
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <Box>
              <Text fontWeight="semibold" mb={2}>Status</Text>
              <HStack spacing={2} wrap="wrap">
                <Button size="sm" variant={filterStatus === 'all' ? 'solid' : 'outline'} colorScheme="purple" onClick={() => setFilterStatus('all')}>Todos</Button>
                <Button size="sm" variant={filterStatus === 'concluida' ? 'solid' : 'outline'} colorScheme="purple" onClick={() => setFilterStatus('concluida')}>Concluídas</Button>
                <Button size="sm" variant={filterStatus === 'pendente' ? 'solid' : 'outline'} colorScheme="purple" onClick={() => setFilterStatus('pendente')}>Pendentes</Button>
                <Button size="sm" variant={filterStatus === 'cancelada' ? 'solid' : 'outline'} colorScheme="purple" onClick={() => setFilterStatus('cancelada')}>Canceladas</Button>
              </HStack>
            </Box>
            <Box>
              <Text fontWeight="semibold" mb={2}>Forma de Pagamento</Text>
              <HStack spacing={2} wrap="wrap">
                <Button size="sm" variant={filterPayment === 'all' ? 'solid' : 'outline'} colorScheme="purple" onClick={() => setFilterPayment('all')}>Todas</Button>
                <Button size="sm" variant={filterPayment === 'Dinheiro' ? 'solid' : 'outline'} colorScheme="purple" onClick={() => setFilterPayment('Dinheiro')}>Dinheiro</Button>
                <Button size="sm" variant={filterPayment === 'PIX' ? 'solid' : 'outline'} colorScheme="purple" onClick={() => setFilterPayment('PIX')}>PIX</Button>
                <Button size="sm" variant={filterPayment === 'Cartão de Crédito' ? 'solid' : 'outline'} colorScheme="purple" onClick={() => setFilterPayment('Cartão de Crédito')}>Cartão</Button>
              </HStack>
            </Box>
          </SimpleGrid>
        </Box>
      )}

      {/* Search */}
      <Box mb={6}>
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <Search size={18} />
          </InputLeftElement>
          <Input
            placeholder="Buscar por produto, cliente ou vendedor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            bg="white"
          />
          {searchQuery && (
            <InputRightElement>
              <IconButton aria-label="Limpar busca" size="sm" variant="ghost" icon={<X size={16} />} onClick={() => setSearchQuery("")} />
            </InputRightElement>
          )}
        </InputGroup>
        <Box mt={3}>
          {filteredSales.length > 0 ? (
            <Text fontSize="sm" color="gray.600">{filteredSales.length} venda(s) encontrada(s)</Text>
          ) : (
            <Flex direction="column" align="center" justify="center" gap={2} py={8} bg="white" borderWidth="1px" borderRadius="lg">
              <ShoppingCart size={48} />
              <Heading as="h3" size="sm">Nenhuma venda encontrada</Heading>
              <Text color="gray.600">Cadastre sua primeira venda para começar!</Text>
              <Button colorScheme="purple" leftIcon={<Plus size={18} />} onClick={handleOpenModal}>Nova Venda</Button>
            </Flex>
          )}
        </Box>
      </Box>

      {/* Sales List */}
      {filteredSales.length > 0 && (
        <Box>
          {filteredSales.map((sale) => (
            <Box key={sale.id} bg="white" borderRadius="lg" borderWidth="1px" p={4} mb={3} boxShadow="sm">
              <Flex justify="space-between" align="flex-start">
                <Box flex="1">
                  <Heading size="sm" mb={3} color="purple.600">{sale.produto}</Heading>
                  
                  <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={2} mb={3}>
                    <Text fontSize="sm" color="gray.600">
                      <User size={14} style={{ display: 'inline', marginRight: '4px' }} />
                      <strong>Cliente:</strong> {clientesMap[sale.clienteUid || ''] || "Cliente não encontrado"}
                    </Text>
                    
                    <Text fontSize="sm" color="gray.600">
                      <Package size={14} style={{ display: 'inline', marginRight: '4px' }} />
                      <strong>Qtd:</strong> {sale.quantidade} un.
                    </Text>
                    
                    <Text fontSize="sm" color="gray.600">
                      <DollarSign size={14} style={{ display: 'inline', marginRight: '4px' }} />
                      <strong>Unit.:</strong> {formatCurrency(sale.precoUnitario)}
                    </Text>
                    
                    <Text fontSize="sm" color="green.600" fontWeight="bold">
                      <DollarSign size={14} style={{ display: 'inline', marginRight: '4px' }} />
                      <strong>Total:</strong> {formatCurrency(sale.precoTotal)}
                    </Text>
                    
                    <Text fontSize="sm" color="gray.600">
                      <CreditCard size={14} style={{ display: 'inline', marginRight: '4px' }} />
                      <strong>Pagamento:</strong> {sale.formaPagamento}
                    </Text>
                    
                    <Text fontSize="sm" color="gray.600">
                      <Clock size={14} style={{ display: 'inline', marginRight: '4px' }} />
                      <strong>Data:</strong> {formatDate(sale.dataVenda)}
                    </Text>
                  </SimpleGrid>

                  <HStack spacing={2} mb={3}>
                    <Box
                      bg={sale.status === "concluida" ? "green.100" : sale.status === "pendente" ? "yellow.100" : "red.100"}
                      color={sale.status === "concluida" ? "green.700" : sale.status === "pendente" ? "yellow.700" : "red.700"}
                      px={2}
                      py={1}
                      borderRadius="md"
                      fontSize="xs"
                      fontWeight="bold"
                    >
                      {sale.status === "concluida" ? "Concluída" : sale.status === "pendente" ? "Pendente" : "Cancelada"}
                    </Box>
                    {sale.categoria && (
                      <Box bg="purple.100" color="purple.700" px={2} py={1} borderRadius="md" fontSize="xs" fontWeight="bold">
                        {sale.categoria}
                      </Box>
                    )}
                  </HStack>
                </Box>

                <HStack spacing={2}>
                  <IconButton aria-label="Excluir" size="sm" variant="ghost" colorScheme="red" icon={<Trash2 size={16} />} onClick={() => handleDeleteSale(sale.id)} />
                  <IconButton aria-label="Editar" size="sm" variant="ghost" colorScheme="blue" icon={<Edit size={16} />} onClick={() => handleEditSale(sale)} />
                  <IconButton aria-label="Visualizar" size="sm" variant="ghost" colorScheme="green" icon={<Eye size={16} />} onClick={() => handleViewSale(sale)} />
                </HStack>
              </Flex>
            </Box>
          ))}
        </Box>
      )}

      {/* View Sale Modal */}
      <Modal isOpen={showViewModal && !!selectedSale} onClose={() => setShowViewModal(false)} size="xl" isCentered>
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent maxW={{ base: '95vw', md: '700px' }} mx={4}>
          <ModalHeader>
            <HStack spacing={3} align="center">
              <Icon as={Eye} color="green.500" />
              <Heading size="md" color={useColorModeValue('gray.800', 'white')}>
                Detalhes da Venda
              </Heading>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />

          {selectedSale && (
            <>
              <ModalBody py={4}>
                <VStack spacing={6} align="stretch">
                  {/* Informações da Venda - Header */}
                  <Box bg="green.50" borderWidth="1px" borderColor="green.200" borderRadius="md" p={4}>
                    <Heading size="sm" mb={3} color="green.700">Resumo da Venda</Heading>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                      <Text fontSize="sm" color="green.600">
                        <strong>ID:</strong> #{selectedSale.id.slice(-6)}
                      </Text>
                      <Text fontSize="sm" color="green.600">
                        <strong>Data:</strong> {formatDate(selectedSale.dataVenda)}
                      </Text>
                    </SimpleGrid>
                  </Box>

                  {/* Informações do Produto */}
                  <Box>
                    <Heading size="sm" mb={4} color="purple.600" display="flex" alignItems="center" gap={2}>
                      <Icon as={Package} />
                      Informações do Produto
                    </Heading>
                    <Divider mb={4} />
                    
                    <Box bg="gray.50" borderWidth="1px" borderColor="gray.200" borderRadius="md" p={4}>
                      <VStack spacing={3} align="stretch">
                        <HStack justify="space-between">
                          <Text fontWeight="500" color="gray.600">Produto:</Text>
                          <Text fontWeight="600" color="gray.800">{selectedSale.produto}</Text>
                        </HStack>
                        <Divider />
                        <HStack justify="space-between">
                          <Text fontWeight="500" color="gray.600">Quantidade:</Text>
                          <Text fontWeight="600" color="gray.800">{selectedSale.quantidade} un.</Text>
                        </HStack>
                        <Divider />
                        <HStack justify="space-between">
                          <Text fontWeight="500" color="gray.600">Preço Unitário:</Text>
                          <Text fontWeight="600" color="gray.800">{formatCurrency(selectedSale.precoUnitario)}</Text>
                        </HStack>
                        <Divider />
                        <HStack justify="space-between">
                          <Text fontWeight="500" color="gray.600">Categoria:</Text>
                          <Text fontWeight="600" color="gray.800">{selectedSale.categoria || 'Não especificada'}</Text>
                        </HStack>
                        <Divider />
                        <HStack justify="space-between">
                          <Text fontWeight="700" color="green.600" fontSize="lg">Total:</Text>
                          <Text fontWeight="bold" color="green.600" fontSize="lg">{formatCurrency(selectedSale.precoTotal)}</Text>
                        </HStack>
                      </VStack>
                    </Box>
                  </Box>

                  {/* Informações da Venda */}
                  <Box>
                    <Heading size="sm" mb={4} color="purple.600" display="flex" alignItems="center" gap={2}>
                      <Icon as={User} />
                      Informações da Venda
                    </Heading>
                    <Divider mb={4} />
                    
                    <Box bg="gray.50" borderWidth="1px" borderColor="gray.200" borderRadius="md" p={4}>
                      <VStack spacing={3} align="stretch">
                        <HStack justify="space-between">
                          <Text fontWeight="500" color="gray.600">Cliente:</Text>
                          <Text fontWeight="600" color="gray.800">{clientesMap[selectedSale.clienteUid || ''] || 'Cliente não encontrado'}</Text>
                        </HStack>
                        <Divider />
                        <HStack justify="space-between">
                          <Text fontWeight="500" color="gray.600">Vendedor:</Text>
                          <Text fontWeight="600" color="gray.800">{selectedSale.vendedor || 'Vendedor não encontrado'}</Text>
                        </HStack>
                        <Divider />
                        <HStack justify="space-between">
                          <Text fontWeight="500" color="gray.600">Forma de Pagamento:</Text>
                          <Text fontWeight="600" color="gray.800">{selectedSale.formaPagamento}</Text>
                        </HStack>
                        <Divider />
                        <HStack justify="space-between">
                          <Text fontWeight="500" color="gray.600">Status:</Text>
                          <Badge
                            colorScheme={
                              selectedSale.status === "concluida" ? "green" : 
                              selectedSale.status === "pendente" ? "yellow" : "red"
                            }
                            px={2}
                            py={1}
                            borderRadius="md"
                            fontSize="xs"
                            fontWeight="bold"
                          >
                            {selectedSale.status === "concluida" ? "Concluída" : 
                             selectedSale.status === "pendente" ? "Pendente" : "Cancelada"}
                          </Badge>
                        </HStack>
                      </VStack>
                    </Box>
                  </Box>

                  {/* Observações */}
                  {selectedSale.observacoes && (
                    <Box>
                      <Heading size="sm" mb={4} color="purple.600" display="flex" alignItems="center" gap={2}>
                        <Icon as={Eye} />
                        Observações
                      </Heading>
                      <Divider mb={4} />
                      
                      <Box bg="blue.50" borderWidth="1px" borderColor="blue.200" borderRadius="md" p={4}>
                        <Text color="blue.800" whiteSpace="pre-wrap">{selectedSale.observacoes}</Text>
                      </Box>
                    </Box>
                  )}
                </VStack>
              </ModalBody>

              <ModalFooter>
                <Stack direction={{ base: 'column', md: 'row' }} spacing={3} w="full">
                  <Button
                    variant="outline"
                    colorScheme="blue"
                    leftIcon={<Edit size={16} />}
                    onClick={() => {
                      setShowViewModal(false);
                      handleEditSale(selectedSale);
                    }}
                    w={{ base: 'full', md: 'auto' }}
                  >
                    Editar Venda
                  </Button>
                  <Button
                    colorScheme="gray"
                    onClick={() => setShowViewModal(false)}
                    w={{ base: 'full', md: 'auto' }}
                  >
                    Fechar
                  </Button>
                </Stack>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Edit Sale Modal */}
      <Modal isOpen={showEditModal && !!selectedSale} onClose={() => setShowEditModal(false)} size="xl" isCentered>
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent maxW={{ base: '95vw', md: '700px' }} mx={4}>
          <ModalHeader>
            <HStack spacing={3} align="center">
              <Icon as={Edit} color="blue.500" />
              <Heading size="md" color={useColorModeValue('gray.800', 'white')}>
                Editar Venda
              </Heading>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />

          {selectedSale && (
            <form onSubmit={handleUpdateSale}>
              <ModalBody py={4}>
                <VStack spacing={6} align="stretch">
                  {/* Informações da Venda Original */}
                  <Box bg="blue.50" borderWidth="1px" borderColor="blue.200" borderRadius="md" p={4}>
                    <Heading size="sm" mb={3} color="blue.700">Venda Original</Heading>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                      <Text fontSize="sm" color="blue.600">
                        <strong>Data:</strong> {formatDate(selectedSale.dataVenda)}
                      </Text>
                      <Text fontSize="sm" color="blue.600">
                        <strong>ID:</strong> #{selectedSale.id.slice(-6)}
                      </Text>
                    </SimpleGrid>
                  </Box>

                  {/* Informações do Produto */}
                  <Box>
                    <Heading size="sm" mb={4} color="purple.600" display="flex" alignItems="center" gap={2}>
                      <Icon as={Package} />
                      Informações do Produto
                    </Heading>
                    <Divider mb={4} />
                  </Box>

                  <FormControl isRequired>
                    <FormLabel fontWeight="600">Produto</FormLabel>
                    <Input
                      value={produto}
                      onChange={(e) => setProduto(e.target.value)}
                      size="lg"
                      borderRadius="md"
                    />
                  </FormControl>

                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl isRequired>
                      <FormLabel fontWeight="600">Quantidade</FormLabel>
                      <Input
                        type="number"
                        min="1"
                        value={quantidade}
                        onChange={(e) => setQuantidade(Number.parseInt(e.target.value) || 1)}
                        size="lg"
                        borderRadius="md"
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel fontWeight="600">Preço Unitário</FormLabel>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={precoUnitario}
                        onChange={(e) => setPrecoUnitario(e.target.value)}
                        size="lg"
                        borderRadius="md"
                      />
                    </FormControl>
                  </SimpleGrid>

                  <FormControl>
                    <FormLabel fontWeight="600">Categoria</FormLabel>
                    <Select
                      placeholder="Selecione uma categoria"
                      value={categoria}
                      onChange={(e) => setCategoria(e.target.value)}
                      size="lg"
                      borderRadius="md"
                    >
                      <option value="Cabelo">Cabelo</option>
                      <option value="Unhas">Unhas</option>
                      <option value="Barba">Barba</option>
                      <option value="Pele">Pele</option>
                      <option value="Acessórios">Acessórios</option>
                    </Select>
                  </FormControl>

                  {/* Informações da Venda */}
                  <Box>
                    <Heading size="sm" mb={4} color="purple.600" display="flex" alignItems="center" gap={2}>
                      <Icon as={User} />
                      Informações da Venda
                    </Heading>
                    <Divider mb={4} />
                  </Box>

                  <FormControl isRequired>
                    <FormLabel fontWeight="600">Cliente</FormLabel>
                    <Select
                      placeholder="Selecione o cliente"
                      value={clienteUid}
                      onChange={handleClienteChange}
                      size="lg"
                      borderRadius="md"
                    >
                      {clientes.map(c => (
                        <option key={c.id} value={c.id}>{c.nome}</option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontWeight="600">Vendedor</FormLabel>
                    <Input
                      value={vendedor}
                      isDisabled
                      size="lg"
                      borderRadius="md"
                      bg="gray.50"
                      color="gray.600"
                    />
                  </FormControl>

                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl isRequired>
                      <FormLabel fontWeight="600">Forma de Pagamento</FormLabel>
                      <Select
                        placeholder="Selecione a forma de pagamento"
                        value={formaPagamento}
                        onChange={(e) => setFormaPagamento(e.target.value)}
                        size="lg"
                        borderRadius="md"
                      >
                        <option value="Dinheiro">Dinheiro</option>
                        <option value="PIX">PIX</option>
                        <option value="Cartão de Débito">Cartão de Débito</option>
                        <option value="Cartão de Crédito">Cartão de Crédito</option>
                      </Select>
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel fontWeight="600">Status</FormLabel>
                      <Select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        size="lg"
                        borderRadius="md"
                      >
                        <option value="concluida">Concluída</option>
                        <option value="pendente">Pendente</option>
                        <option value="cancelada">Cancelada</option>
                      </Select>
                    </FormControl>
                  </SimpleGrid>

                  <FormControl>
                    <FormLabel fontWeight="600">Observações</FormLabel>
                    <Textarea
                      rows={4}
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      borderRadius="md"
                      resize="vertical"
                      placeholder="Adicione observações sobre a venda..."
                    />
                  </FormControl>

                  {/* Preview do Total */}
                  {precoUnitario && quantidade && (
                    <Box bg="green.50" borderWidth="1px" borderColor="green.200" borderRadius="md" p={4}>
                      <HStack justify="space-between" align="center">
                        <Text fontWeight="600" color="green.700">Total Atualizado:</Text>
                        <Text fontSize="xl" fontWeight="bold" color="green.600">
                          {formatCurrency(quantidade * Number.parseFloat(precoUnitario || "0"))}
                        </Text>
                      </HStack>
                    </Box>
                  )}
                </VStack>
              </ModalBody>

              <ModalFooter>
                <Stack direction={{ base: 'column', md: 'row' }} spacing={3} w="full">
                  <Button
                    variant="ghost"
                    onClick={() => setShowEditModal(false)}
                    w={{ base: 'full', md: 'auto' }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    colorScheme="blue"
                    leftIcon={<Check size={16} />}
                    w={{ base: 'full', md: 'auto' }}
                  >
                    Salvar Alterações
                  </Button>
                </Stack>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>

      {/* Add Sale Modal */}
      <Modal isOpen={showModal} onClose={handleCloseModal} size="xl" isCentered>
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent maxW={{ base: '95vw', md: '600px' }} mx={4}>
          <ModalHeader pb={2}>
            <VStack spacing={3} align="stretch">
              <HStack justify="space-between" align="center">
                <HStack spacing={3}>
                  {formStep > 1 && (
                    <IconButton
                      aria-label="Voltar"
                      icon={<ArrowLeft size={18} />}
                      variant="ghost"
                      size="sm"
                      onClick={handlePrevStep}
                    />
                  )}
                  <Heading size="md" color={useColorModeValue('gray.800', 'white')}>
                    {formStep === 1 && "Nova Venda"}
                    {formStep === 2 && "Detalhes da Venda"}
                    {formStep === 3 && "Finalizar Venda"}
                  </Heading>
                </HStack>
                <Badge colorScheme="purple" variant="subtle" px={2} py={1}>
                  {formStep}/3
                </Badge>
              </HStack>
              
              {/* Progress Bar */}
              <Box>
                <Progress value={(formStep / 3) * 100} colorScheme="purple" size="sm" borderRadius="md" />
                <HStack justify="space-between" mt={2}>
                  <Text fontSize="xs" color={formStep >= 1 ? 'purple.500' : 'gray.400'} fontWeight={formStep >= 1 ? 'bold' : 'normal'}>
                    Produto
                  </Text>
                  <Text fontSize="xs" color={formStep >= 2 ? 'purple.500' : 'gray.400'} fontWeight={formStep >= 2 ? 'bold' : 'normal'}>
                    Detalhes
                  </Text>
                  <Text fontSize="xs" color={formStep >= 3 ? 'purple.500' : 'gray.400'} fontWeight={formStep >= 3 ? 'bold' : 'normal'}>
                    Finalizar
                  </Text>
                </HStack>
              </Box>
            </VStack>
          </ModalHeader>
          <ModalCloseButton />

          <form onSubmit={handleSubmit}>
            <ModalBody py={4}>
              {/* Step 1: Product Information */}
              {formStep === 1 && (
                <VStack spacing={6} align="stretch">
                  <Box>
                    <Heading size="sm" mb={4} color="purple.600" display="flex" alignItems="center" gap={2}>
                      <Icon as={Package} />
                      Informações do Produto
                    </Heading>
                    <Divider mb={4} />
                  </Box>

                  <FormControl isRequired>
                    <FormLabel fontWeight="600">Produto</FormLabel>
                    <Input
                      placeholder="Nome do produto"
                      value={produto}
                      onChange={(e) => setProduto(e.target.value)}
                      size="lg"
                      borderRadius="md"
                    />
                  </FormControl>

                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl isRequired>
                      <FormLabel fontWeight="600">Quantidade</FormLabel>
                      <Input
                        type="number"
                        placeholder="1"
                        min="1"
                        value={quantidade}
                        onChange={(e) => setQuantidade(Number.parseInt(e.target.value) || 1)}
                        size="lg"
                        borderRadius="md"
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel fontWeight="600">Preço Unitário</FormLabel>
                      <Input
                        type="number"
                        placeholder="0,00"
                        step="0.01"
                        min="0"
                        value={precoUnitario}
                        onChange={(e) => setPrecoUnitario(e.target.value)}
                        size="lg"
                        borderRadius="md"
                      />
                    </FormControl>
                  </SimpleGrid>

                  <FormControl>
                    <FormLabel fontWeight="600">Categoria</FormLabel>
                    <Select
                      placeholder="Selecione uma categoria"
                      value={categoria}
                      onChange={(e) => setCategoria(e.target.value)}
                      size="lg"
                      borderRadius="md"
                    >
                      <option value="Cabelo">Cabelo</option>
                      <option value="Unhas">Unhas</option>
                      <option value="Barba">Barba</option>
                      <option value="Pele">Pele</option>
                      <option value="Acessórios">Acessórios</option>
                    </Select>
                  </FormControl>

                  {precoUnitario && quantidade && (
                    <Box bg="purple.50" borderWidth="1px" borderColor="purple.200" borderRadius="md" p={4}>
                      <HStack justify="space-between" align="center">
                        <Text fontWeight="600" color="purple.700">Total da Venda:</Text>
                        <Text fontSize="xl" fontWeight="bold" color="purple.600">
                          {formatCurrency(quantidade * Number.parseFloat(precoUnitario || "0"))}
                        </Text>
                      </HStack>
                    </Box>
                  )}
                </VStack>
              )}

              {/* Step 2: Customer and Seller Information */}
              {formStep === 2 && (
                <VStack spacing={6} align="stretch">
                  <Box>
                    <Heading size="sm" mb={4} color="purple.600" display="flex" alignItems="center" gap={2}>
                      <Icon as={User} />
                      Informações da Venda
                    </Heading>
                    <Divider mb={4} />
                  </Box>

                  <FormControl isRequired>
                    <FormLabel fontWeight="600">Cliente</FormLabel>
                    <Select
                      placeholder={clientes.length === 0 ? "Nenhum cliente encontrado" : "Selecione o cliente"}
                      value={clienteUid}
                      onChange={handleClienteChange}
                      isDisabled={clientes.length === 0}
                      size="lg"
                      borderRadius="md"
                    >
                      {clientes.map(c => (
                        <option key={c.id} value={c.id}>{c.nome}</option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontWeight="600">Vendedor</FormLabel>
                    <Input
                      value={vendedor}
                      isDisabled
                      size="lg"
                      borderRadius="md"
                      bg="gray.50"
                      color="gray.600"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel fontWeight="600">Forma de Pagamento</FormLabel>
                    <Select
                      placeholder="Selecione a forma de pagamento"
                      value={formaPagamento}
                      onChange={(e) => setFormaPagamento(e.target.value)}
                      size="lg"
                      borderRadius="md"
                    >
                      <option value="Dinheiro">Dinheiro</option>
                      <option value="PIX">PIX</option>
                      <option value="Cartão de Débito">Cartão de Débito</option>
                      <option value="Cartão de Crédito">Cartão de Crédito</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontWeight="600">Status da Venda</FormLabel>
                    <Select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      size="lg"
                      borderRadius="md"
                    >
                      <option value="concluida">Concluída</option>
                      <option value="pendente">Pendente</option>
                      <option value="cancelada">Cancelada</option>
                    </Select>
                  </FormControl>
                </VStack>
              )}

              {/* Step 3: Final Details */}
              {formStep === 3 && (
                <VStack spacing={6} align="stretch">
                  <Box>
                    <Heading size="sm" mb={4} color="purple.600" display="flex" alignItems="center" gap={2}>
                      <Icon as={Check} />
                      Finalizar Venda
                    </Heading>
                    <Divider mb={4} />
                  </Box>

                  <FormControl>
                    <FormLabel fontWeight="600">Observações</FormLabel>
                    <Textarea
                      placeholder="Adicione observações sobre a venda..."
                      rows={4}
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      borderRadius="md"
                      resize="vertical"
                    />
                  </FormControl>

                  <Box bg="gray.50" borderWidth="1px" borderColor="gray.200" borderRadius="lg" p={6}>
                    <Heading size="sm" mb={4} color="gray.700">Resumo da Venda</Heading>
                    <VStack spacing={3} align="stretch">
                      <HStack justify="space-between">
                        <Text fontWeight="500" color="gray.600">Produto:</Text>
                        <Text fontWeight="600">{produto}</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontWeight="500" color="gray.600">Quantidade:</Text>
                        <Text fontWeight="600">{quantidade} un.</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontWeight="500" color="gray.600">Preço Unitário:</Text>
                        <Text fontWeight="600">{formatCurrency(Number.parseFloat(precoUnitario || "0"))}</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontWeight="500" color="gray.600">Cliente:</Text>
                        <Text fontWeight="600">{clientesMap[clienteUid] || "Cliente não encontrado"}</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontWeight="500" color="gray.600">Vendedor:</Text>
                        <Text fontWeight="600">{vendedor}</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontWeight="500" color="gray.600">Forma de Pagamento:</Text>
                        <Text fontWeight="600">{formaPagamento}</Text>
                      </HStack>
                      <Divider />
                      <HStack justify="space-between">
                        <Text fontSize="lg" fontWeight="700" color="green.600">Total:</Text>
                        <Text fontSize="xl" fontWeight="bold" color="green.600">
                          {formatCurrency(quantidade * Number.parseFloat(precoUnitario || "0"))}
                        </Text>
                      </HStack>
                    </VStack>
                  </Box>
                </VStack>
              )}
            </ModalBody>

            <ModalFooter>
              <Stack direction={{ base: 'column', md: 'row' }} spacing={3} w="full">
                {formStep > 1 && (
                  <Button
                    variant="outline"
                    onClick={handlePrevStep}
                    leftIcon={<ArrowLeft size={16} />}
                    w={{ base: 'full', md: 'auto' }}
                  >
                    Voltar
                  </Button>
                )}
                <Button
                  variant="ghost"
                  onClick={handleCloseModal}
                  w={{ base: 'full', md: 'auto' }}
                >
                  Cancelar
                </Button>
                {formStep < 3 ? (
                  <Button
                    colorScheme="purple"
                    onClick={handleNextStep}
                    rightIcon={<ChevronDown size={16} style={{ transform: 'rotate(-90deg)' }} />}
                    w={{ base: 'full', md: 'auto' }}
                  >
                    Próximo
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    colorScheme="purple"
                    leftIcon={<Check size={16} />}
                    w={{ base: 'full', md: 'auto' }}
                  >
                    Finalizar Venda
                  </Button>
                )}
              </Stack>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </Box>
  )
}

export default VendasAtendente
