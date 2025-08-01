"use client"

import type React from "react"
import './vendas.css'
import { useState, useEffect } from "react"
import {
  Search,
  Plus,
  ShoppingCart,
  Filter,
  Download,
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
} from "lucide-react"
import { firestore } from '../../firebase/firebase';
import { collection, addDoc, getDocs, query, where, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useParams } from 'react-router-dom';

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
  const [vendedoresMap, setVendedoresMap] = useState<{ [key: string]: string }>({});

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
    <div className="cliente-container">
      {/* Header */}
      <div className="cliente-header">
        <div className="header-title">
          <h1>Vendas</h1>
          <p>Gerencie suas vendas e acompanhe o faturamento</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={() => setShowFilters(!showFilters)}>
            <Filter size={18} />
            Filtros
          </button>
          <button className="btn-secondary">
            <Download size={18} />
            Exportar
          </button>
          <button className="btn-primary" onClick={handleOpenModal}>
            <Plus size={18} />
            Nova Venda
          </button>
        </div>
      </div>

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

      {/* Filters */}
      {showFilters && (
        <div className="filters-container">
          <div className="filter-group">
            <label>Status</label>
            <div className="filter-options">
              <button className={filterStatus === "all" ? "active" : ""} onClick={() => setFilterStatus("all")}>
                Todos
              </button>
              <button
                className={filterStatus === "concluida" ? "active" : ""}
                onClick={() => setFilterStatus("concluida")}
              >
                Concluídas
              </button>
              <button
                className={filterStatus === "pendente" ? "active" : ""}
                onClick={() => setFilterStatus("pendente")}
              >
                Pendentes
              </button>
              <button
                className={filterStatus === "cancelada" ? "active" : ""}
                onClick={() => setFilterStatus("cancelada")}
              >
                Canceladas
              </button>
            </div>
          </div>
          <div className="filter-group">
            <label>Forma de Pagamento</label>
            <div className="filter-options">
              <button className={filterPayment === "all" ? "active" : ""} onClick={() => setFilterPayment("all")}>
                Todas
              </button>
              <button
                className={filterPayment === "Dinheiro" ? "active" : ""}
                onClick={() => setFilterPayment("Dinheiro")}
              >
                Dinheiro
              </button>
              <button className={filterPayment === "PIX" ? "active" : ""} onClick={() => setFilterPayment("PIX")}>
                PIX
              </button>
              <button
                className={filterPayment === "Cartão de Crédito" ? "active" : ""}
                onClick={() => setFilterPayment("Cartão de Crédito")}
              >
                Cartão
              </button>
            </div>
          </div>
        </div>
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

      {/* Sales List */}
      {filteredSales.length > 0 && (
        <div className="client-list">
          {filteredSales.map((sale) => (
            <div key={sale.id} className="client-card">
              <div className="client-info-principal">
                <h3>{sale.produto}</h3>

                <p>
                  <strong>Cliente:</strong>
                  <User size={16} style={{ marginRight: "6px", color: "var(--primary)" }} />
                  {clientesMap[sale.clienteUid || ''] || "Cliente não encontrado"}
                </p>

                <p>
                  <strong>Quantidade:</strong>
                  <Package size={16} style={{ marginRight: "6px", color: "var(--primary)" }} />
                  {sale.quantidade} un.
                </p>

                <p>
                  <strong>Valor Unit.:</strong>
                  <DollarSign size={16} style={{ marginRight: "6px", color: "var(--primary)" }} />
                  {formatCurrency(sale.precoUnitario)}
                </p>

                <p>
                  <strong>Total:</strong>
                  <DollarSign size={16} style={{ marginRight: "6px", color: "var(--success)" }} />
                  <span style={{ color: "var(--success)", fontWeight: "700" }}>{formatCurrency(sale.precoTotal)}</span>
                </p>

                <p>
                  <strong>Pagamento:</strong>
                  <CreditCard size={16} style={{ marginRight: "6px", color: "var(--primary)" }} />
                  {sale.formaPagamento}
                </p>

                <p>
                  <strong>Data:</strong>
                  <Clock size={16} style={{ marginRight: "6px", color: "var(--primary)" }} />
                  {formatDate(sale.dataVenda)}
                </p>

                <div className="client-tags">
                  <span
                    className={`tag ${sale.status === "concluida" ? "success" : sale.status === "pendente" ? "warning" : "error"}`}
                  >
                    {sale.status === "concluida" ? "Concluída" : sale.status === "pendente" ? "Pendente" : "Cancelada"}
                  </span>
                  {sale.categoria && <span className="tag">{sale.categoria}</span>}
                </div>
              </div>

              <div className="client-actions">
                <button className="btn-icon" onClick={() => handleDeleteSale(sale.id)}>
                  <Trash2 size={18} color="#ef4444" />
                </button>
                <button className="btn-icon" onClick={() => handleEditSale(sale)}>
                  <Edit size={18} />
                </button>
                <button className="btn-icon" onClick={() => handleViewSale(sale)}>
                  <Eye size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Sale Modal */}
      {showViewModal && selectedSale && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detalhes da Venda</h2>
              <button className="modal-close" onClick={() => setShowViewModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="sale-details">
                <div className="detail-group">
                  <h3>Informações do Produto</h3>
                  <p><strong>Produto:</strong> {selectedSale.produto}</p>
                  <p><strong>Quantidade:</strong> {selectedSale.quantidade} un.</p>
                  <p><strong>Preço Unitário:</strong> {formatCurrency(selectedSale.precoUnitario)}</p>
                  <p><strong>Total:</strong> {formatCurrency(selectedSale.precoTotal)}</p>
                  <p><strong>Categoria:</strong> {selectedSale.categoria || 'Não especificada'}</p>
                </div>

                <div className="detail-group">
                  <h3>Informações da Venda</h3>
                  <p><strong>Cliente:</strong> {clientesMap[selectedSale.clienteUid || ''] || 'Cliente não encontrado'}</p>
                  <p><strong>Vendedor:</strong> {vendedoresMap[selectedSale.vendedorUid || ''] || 'Vendedor não encontrado'}</p>
                  <p><strong>Forma de Pagamento:</strong> {selectedSale.formaPagamento}</p>
                  <p><strong>Status:</strong> {selectedSale.status}</p>
                  <p><strong>Data:</strong> {formatDate(selectedSale.dataVenda)}</p>
                </div>

                {selectedSale.observacoes && (
                  <div className="detail-group">
                    <h3>Observações</h3>
                    <p>{selectedSale.observacoes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Sale Modal */}
      {showEditModal && selectedSale && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Editar Venda</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateSale}>
              <div className="modal-body">
                <div className="form-section">
                  <div className="form-group">
                    <label htmlFor="produto">Produto</label>
                    <input
                      type="text"
                      id="produto"
                      value={produto}
                      onChange={(e) => setProduto(e.target.value)}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="quantidade">Quantidade</label>
                      <input
                        type="number"
                        id="quantidade"
                        min="1"
                        value={quantidade}
                        onChange={(e) => setQuantidade(Number.parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="precoUnitario">Preço Unitário</label>
                      <input
                        type="number"
                        id="precoUnitario"
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

                  <div className="form-group">
                    <label htmlFor="cliente">Cliente</label>
                    <div className="select-wrapper">
                      <select id="cliente" value={clienteUid} onChange={handleClienteChange}>
                        <option value="">Selecione o cliente</option>
                        {clientes.map(c => (
                          <option key={c.id} value={c.id}>{c.nome}</option>
                        ))}
                      </select>
                      <ChevronDown size={18} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="vendedor">Vendedor</label>
                    <div className="select-wrapper">
                      <input
                        type="text"
                        id="vendedor"
                        value={vendedor}
                        disabled
                        className="disabled-input"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="formaPagamento">Forma de Pagamento</label>
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
                    <label htmlFor="status">Status</label>
                    <div className="select-wrapper">
                      <select id="status" value={status} onChange={(e) => setStatus(e.target.value)}>
                        <option value="concluida">Concluída</option>
                        <option value="pendente">Pendente</option>
                        <option value="cancelada">Cancelada</option>
                      </select>
                      <ChevronDown size={18} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="observacoes">Observações</label>
                    <textarea
                      id="observacoes"
                      rows={4}
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="form-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  <Check size={18} />
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                      <label htmlFor="vendedor">Vendedor</label>
                      <div className="select-wrapper">
                        <input
                          type="text"
                          id="vendedor"
                          value={vendedor}
                          disabled
                          className="disabled-input"
                        />
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
    </div>
  )
}

export default VendasAtendente
