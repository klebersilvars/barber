"use client"

import type React from "react"

import { useState, useEffect } from "react"
import "./pageLogin.css"
import { Scissors, Calendar, User, Eye, EyeOff, Building } from "lucide-react"
import { getAuth, signInWithEmailAndPassword } from "firebase/auth"
import EsqueciSenha from "./esqueciSenha/esqueciSenha"
import { useNavigate } from "react-router-dom"
import { collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { firestore } from '../firebase/firebase';

export default function PageLogin() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigation = useNavigate()

  useEffect(() => {
    const savedEmail = localStorage.getItem("email")
    if (savedEmail) {
      setEmail(savedEmail)
      setRememberMe(true)
    }
  }, [])

  async function acessarConta(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      // Buscar usuário na coleção 'contas' pelo e-mail
      const contasRef = collection(firestore, 'contas');
      const q = query(contasRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        throw new Error('Conta não encontrada!');
      }
      const conta = querySnapshot.docs[0].data();
      if (!conta.cargo || conta.cargo !== 'proprietario') {
        throw new Error('Apenas proprietários podem acessar por aqui!');
      }
      // Prosseguir com o login normalmente
      const auth = getAuth()
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      if (rememberMe) {
        localStorage.setItem("email", user.email ?? "")
      } else {
        localStorage.removeItem("email")
      }

      // NOVA LÓGICA: Se premium for false, desativar colaboradores do mesmo estabelecimento
      if (conta.premium === false) {
        const nomeEstabelecimento = conta.nomeEstabelecimento;
        if (nomeEstabelecimento) {
          // Buscar todos os colaboradores com o mesmo estabelecimento
          const colaboradoresRef = collection(firestore, 'colaboradores');
          const qColab = query(colaboradoresRef, where('estabelecimento', '==', nomeEstabelecimento));
          const colaboradoresSnap = await getDocs(qColab);
          for (const docColab of colaboradoresSnap.docs) {
            const colabRef = docColab.ref;
            await updateDoc(colabRef, { ativo: false });
          }
        }
      }

      navigation(`/dashboard/${user.uid}`)
    } catch (error: any) {
      console.error("Erro no login:", error)
      alert("Erro ao fazer login: " + (error.message || "Tente novamente"))
    } finally {
      setLoading(false)
    }
  }

  function functionAcessarSenha(e: React.MouseEvent) {
    e.preventDefault()
    setModalAberto(true)
  }

  function irCadastroUser(e: React.MouseEvent) {
    e.preventDefault()
    // Aqui você pode adicionar sua lógica de navegação
    navigation('/cadastro')
  }

  function irAtendente(e: React.MouseEvent) {
    e.preventDefault()
    navigation('/atendente')
  }

  function acessarProfissional(e: React.MouseEvent) {
    e.preventDefault()
    navigation('/loginProfissional')
  }

  return (
    <main className="main-login">
      <div className="container-login">
        <div className="login-left">
          <div className="login-left-content">
            <div className="logo">
              <Scissors className="scissors-icon" />
              <span style={{ color: "white" }}>Trezu</span>
            </div>
            <h2>Gerencie sua agenda com facilidade</h2>
            <p>Plataforma completa para profissionais de beleza controlarem agendamentos e clientes.</p>
            <div className="features">
              <div className="feature">
                <Calendar className="feature-icon" />
                <span>Agendamento simplificado</span>
              </div>
              <div className="feature">
                <User className="feature-icon" />
                <span>Gestão de clientes</span>
              </div>
              <div className="feature">
                <Building className="feature-icon" />
                <span>Gestão de profissionais</span>
              </div>
            </div>
          </div>
        </div>

        <div className="login-right">
          <div className="login-form-container">
            <div className="form-header">
              <h3>Gerencie seu estabelecimento</h3>
              <p className="login-subtitle">Acesse sua conta para gerenciar seus agendamentos</p>
            </div>

            <form className="login-form" onSubmit={acessarConta}>
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

              <button type="submit" className="login-button" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </button>

              <div className="register-option">
                Não tem uma conta?{" "}
                <button type="button" onClick={irCadastroUser} className="register-link" disabled={loading}>
                  Cadastre-se agora!
                </button>
              </div>
            </form>

            {/* Novos links adicionados aqui fora do formulário */}
            <div className="other-access-options">
              <div className="register-option">
                É um atendente?{" "}
                <button type="button" className="register-link" disabled={loading} onClick={irAtendente}>
                  Acesse como Atendente
                </button>
              </div>

              <div className="register-option">
                É um profissional?{" "}
                <button onClick={acessarProfissional} type="button" className="register-link" disabled={loading}>
                  Acesse como Profissional
                </button>
              </div>
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
    </main>
  )
}
