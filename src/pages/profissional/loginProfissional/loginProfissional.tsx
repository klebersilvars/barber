"use client"

import type React from "react"

import { useState, useEffect } from "react"
import "./loginProfissional.css"
import { Calendar, User, Eye, EyeOff, Briefcase } from "lucide-react"
import { getAuth, signInWithEmailAndPassword } from "firebase/auth"
import EsqueciSenha from "../../esqueciSenha/esqueciSenha"
import { useNavigate } from "react-router-dom"
import { collection, query, where, getDocs } from "firebase/firestore"
import { firestore } from "../../../firebase/firebase"
import LogoBranca from "../../../assets/logo_branca.png"

export default function LoginProfissional() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigation = useNavigate()

  useEffect(() => {
    const savedEmail = localStorage.getItem("email_profissional")
    if (savedEmail) {
      setEmail(savedEmail)
      setRememberMe(true)
    }
  }, [])

  async function acessarConta(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      // Buscar colaborador na coleção 'colaboradores' pelo e-mail
      const colaboradoresRef = collection(firestore, "colaboradores")
      const q = query(colaboradoresRef, where("email", "==", email))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        throw new Error("Colaborador não encontrado!")
      }

      const colaborador = querySnapshot.docs[0].data()

      // Verificar se colaborador está ativo
      if (colaborador.ativo === false) {
        throw new Error("Seu acesso foi desativado pelo administrador do sistema.")
      }

      // Verificar se possui o cargo de Profissional
      if (!colaborador.cargos || !colaborador.cargos.includes("Profissional")) {
        throw new Error("Apenas profissionais podem acessar esta área!")
      }

      // Prosseguir com o login normalmente
      const auth = getAuth()
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      if (rememberMe) {
        localStorage.setItem("email_profissional", user.email ?? "")
      } else {
        localStorage.removeItem("email_profissional")
      }

      navigation(`/dashboardProfissional/${user.uid}`)
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

  function irProprietario(e: React.MouseEvent) {
    e.preventDefault()
    navigation("/login")
  }

  return (
    <main className="profissional-main-login">
      <div className="profissional-container-login">
        <div className="profissional-login-left">
          <div className="profissional-login-left-content">
            <div className="profissional-logo">
              <img src={LogoBranca} alt="logoTrezu" className="logo_branca" />
            </div>

            <p>Acesse sua agenda, gerencie seus horários e atenda seus clientes com excelência.</p>
            <div className="profissional-features">
              <div className="profissional-feature">
                <Calendar className="profissional-feature-icon" />
                <span>Sua agenda pessoal</span>
              </div>
              <div className="profissional-feature">
                <User className="profissional-feature-icon" />
                <span>Histórico de clientes</span>
              </div>
              <div className="profissional-feature">
                <Briefcase className="profissional-feature-icon" />
                <span>Gestão de serviços</span>
              </div>
            </div>
          </div>
        </div>

        <div className="profissional-login-right">
          <div className="profissional-login-form-container">
            <div className="profissional-form-header">
              <h3>Acesso Profissional</h3>
              <p className="profissional-login-subtitle">Entre com suas credenciais para acessar sua área</p>
            </div>

            <form className="profissional-login-form" onSubmit={acessarConta}>
              <div className="profissional-form-group">
                <label htmlFor="email">Email</label>
                <div className="profissional-input-container">
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

              <div className="profissional-form-group">
                <label htmlFor="password">Senha</label>
                <div className="profissional-input-container">
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
                    className="profissional-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="profissional-eye-icon" />
                    ) : (
                      <Eye className="profissional-eye-icon" />
                    )}
                  </button>
                </div>
              </div>

              <div className="profissional-form-options">
                <div className="profissional-remember-me">
                  <input
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    type="checkbox"
                    id="remember"
                    disabled={loading}
                  />
                  <label htmlFor="remember">Lembrar-me</label>
                </div>
                <button
                  type="button"
                  onClick={functionAcessarSenha}
                  className="profissional-forgot-password"
                  disabled={loading}
                >
                  Esqueceu a senha?
                </button>
              </div>

              <button type="submit" className="profissional-login-button" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </button>

              
            </form>

            {/* Opções de acesso */}
            <div className="profissional-other-access-options">
              <div className="profissional-register-option">
                É proprietário do estabelecimento?{" "}
                <button
                  type="button"
                  className="profissional-register-link"
                  disabled={loading}
                  onClick={irProprietario}
                >
                  Acesse como Proprietário
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {modalAberto && (
        <div
          className="profissional-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalAberto(false)
          }}
        >
          <div className="profissional-modal-content">
            <button className="profissional-modal-close" onClick={() => setModalAberto(false)} type="button">
              ×
            </button>
            <EsqueciSenha />
            <button className="profissional-modal-close-mobile" onClick={() => setModalAberto(false)} type="button">
              Fechar
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
