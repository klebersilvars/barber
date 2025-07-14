"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { User, Lock, Eye, EyeOff, Headset, Calendar, MessageCircle, CheckCircle } from "lucide-react"
import EsqueciSenha from "../esqueciSenha/esqueciSenha"
import { firestore } from '../../firebase/firebase';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import './atendente.css'; 
import { useNavigate, useParams } from 'react-router-dom';
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from '../../firebase/firebase';

const Atendente: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)
  const [estabelecimento, setEstabelecimento] = useState<any>(null);
  const navigation = useNavigate();
  const { uid: urlEstabelecimentoId } = useParams();

  useEffect(() => {
    const savedEmail = localStorage.getItem("atendente_email")
    if (savedEmail) {
      setEmail(savedEmail)
      setRememberMe(true)
    }
  }, [])

  async function acessarConta(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      // 1. Verificar se o e-mail existe e tem cargo 'Atendente'
      const colaboradoresRef = collection(firestore, 'colaboradores');
      const q = query(colaboradoresRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        throw new Error('Colaborador não encontrado!');
      }
      const colaboradorDoc = querySnapshot.docs[0];
      const colaborador = colaboradorDoc.data();
      if (!colaborador.cargos || !colaborador.cargos.includes('Atendente')) {
        throw new Error('Você não tem permissão para acessar esta página. Apenas atendentes podem acessar.');
      }
      // 2. Fazer login com o Authentication
      await signInWithEmailAndPassword(auth, email, password);

      // 3. Lógica do lembrar-me
      if (rememberMe) {
        localStorage.setItem("atendente_email", email);
      } else {
        localStorage.removeItem("atendente_email");
      }

      // 4. Redirecionar para o dashboard
      navigation(`/acessoAtendente/${colaboradorDoc.id}`);
      return;
    } catch (error: any) {
      alert('Erro ao fazer login: ' + (error.message || 'Tente novamente'));
      setLoading(false);
    }
  }

  function functionAcessarSenha(e: React.MouseEvent) {
    e.preventDefault()
    setModalAberto(true)
  }

  return (
    <div className="main-atendente">
      <div className="container-atendente">
        {/* Left side - Branding */}
        <div className="atendente-left">
          <div className="atendente-left-content">
            <div className="logo">
              <Headset className="user-icon" />
              <span>AtendePro</span>
            </div>

            <h2>Portal do Atendente</h2>
            <p>Acesse sua conta para gerenciar atendimentos e solicitações dos clientes.</p>

            <div className="features">
              <div className="feature">
                <Calendar className="feature-icon" />
                <span>Gestão de atendimentos</span>
              </div>
              <div className="feature">
                <MessageCircle className="feature-icon" />
                <span>Suporte ao cliente</span>
              </div>
              <div className="feature">
                <CheckCircle className="feature-icon" />
                <span>Resolução de chamados</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="atendente-right">
          <div className="atendente-form-container">
            <div className="form-header">
              <h3>Acesso de Atendente</h3>
              <p className="atendente-subtitle">Entre com suas credenciais para acessar o sistema</p>
            </div>

            <form className="atendente-form" onSubmit={acessarConta}>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <div className="input-container">
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    id="email"
                    placeholder="seu@email.com"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Senha</label>
                <div className="input-container">
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? "text" : "password"}
                    id="password"
                    placeholder="Sua senha"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="eye-icon" /> : <Eye className="eye-icon" />}
                  </button>
                </div>
              </div>

              <div className="form-options">
                <div className="remember-me">
                  <input
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    type="checkbox"
                    id="remember"
                    disabled={loading}
                  />
                  <label htmlFor="remember">Lembrar-me</label>
                </div>
                <button type="button" onClick={functionAcessarSenha} className="forgot-password" disabled={loading}>
                  Esqueceu a senha?
                </button>
              </div>

              <button type="submit" className="atendente-button" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </form>

            {/* Links adicionais */}
            <div className="other-access-options">
            </div>
          </div>
        </div>
      </div>

      {modalAberto && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalAberto(false)
          }}
        >
          <div className="modal-content">
            <button className="modal-close" onClick={() => setModalAberto(false)} type="button">
              ×
            </button>
            <EsqueciSenha />
            <button className="modal-close-mobile" onClick={() => setModalAberto(false)} type="button">
              Fechar
            </button>
          </div>
        </div>
      )}

      {estabelecimento && (
        <div className="estabelecimento-info">
          <h4>Estabelecimento:</h4>
          <p><b>Nome:</b> {estabelecimento.nome}</p>
          {/* Adicione outros campos que desejar exibir */}
        </div>
      )}
    </div>
  )
}

export default Atendente
