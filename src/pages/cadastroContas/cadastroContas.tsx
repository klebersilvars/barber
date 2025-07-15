"use client"

import type React from "react"

import { useState } from "react"
import "./cadastroContas.css"
import { User, Shield, Crown, ChevronDown, Check, X } from "lucide-react"
import { getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth"
import { getFirestore, collection, addDoc } from "firebase/firestore"
import { auth } from "../../firebase/firebase"

export default function CadastroContas() {
  const [avaliacaoAtiva, setAvaliacaoAtiva] = useState(false)
  const [premiumAtivo, setPremiumAtivo] = useState(false)
  const [avaliacaoAberto, setAvaliacaoAberto] = useState(false)
  const [premiumAberto, setPremiumAberto] = useState(false)
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)

  async function cadastrarConta(e: React.FormEvent) {
    e.preventDefault()

    if (!email.trim()) {
      alert("Por favor, insira um email válido.")
      return
    }

    setLoading(true)

    try {
      const auth = getAuth()
      const db = getFirestore()

      // Cria o usuário com uma senha temporária
      const userCredential = await createUserWithEmailAndPassword(auth, email, "senha-temporaria-123")

      // Salva os dados no Firestore
      await addDoc(collection(db, "contas"), {
        email,
        userId: userCredential.user.uid,
        avaliacao_gratis: avaliacaoAtiva,
        premium: premiumAtivo,
        createdAt: new Date().toISOString(),
      })

      // Envia o e-mail para o usuário cadastrar a senha dele
      await sendPasswordResetEmail(auth, email)

      alert("Conta criada com sucesso! E-mail enviado para definir a senha.")

      // Limpa o formulário
      setEmail("")
      setAvaliacaoAtiva(false)
      setPremiumAtivo(false)
    } catch (error: any) {
      console.error("Erro ao cadastrar:", error)

      if (error.code === "auth/email-already-in-use") {
        try {
          // Se o usuário já existe, apenas envia o e-mail de redefinição
          await sendPasswordResetEmail(auth, email)
          alert("Usuário já existe. E-mail para redefinir senha enviado!")
        } catch (resetError: any) {
          alert("Erro ao enviar e-mail de redefinição: " + resetError.message)
        }
      } else if (error.code === "auth/invalid-email") {
        alert("E-mail inválido. Verifique o formato do e-mail.")
      } else if (error.code === "auth/weak-password") {
        alert("Senha muito fraca. Use uma senha mais forte.")
      } else {
        alert("Erro ao cadastrar: " + (error.message || "Tente novamente"))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="main-cadastro-contas">
      <div className="container-cadastro-contas">
        <div className="cadastro-contas-content">
          <div className="cadastro-contas-form-container">
            <div className="cadastro-contas-form-header">
              <h3>Configuração da Conta</h3>
              <p className="cadastro-contas-subtitle">Configure sua conta pessoal no sistema</p>
            </div>

            <form className="cadastro-contas-form" onSubmit={cadastrarConta}>
              <div className="cadastro-contas-form-group">
                <label htmlFor="email">Email</label>
                <div className="cadastro-contas-input-container">
                  <User className="cadastro-contas-input-icon" />
                  <input
                    type="email"
                    id="email"
                    placeholder="seu@email.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="cadastro-contas-form-group">
                <label htmlFor="avaliacao">Avaliação de 7 dias</label>
                <div className="cadastro-contas-select-container">
                  <div
                    className="cadastro-contas-custom-select"
                    onClick={() => !loading && setAvaliacaoAberto(!avaliacaoAberto)}
                  >
                    <div className="cadastro-contas-select-value">
                      <div className={`cadastro-contas-status-indicator ${avaliacaoAtiva ? "active" : "inactive"}`}>
                        {avaliacaoAtiva ? <Check size={16} /> : <X size={16} />}
                      </div>
                      <span>{avaliacaoAtiva ? "Ativado" : "Desativado"}</span>
                    </div>
                    <ChevronDown className={`cadastro-contas-select-icon ${avaliacaoAberto ? "open" : ""}`} />
                  </div>
                  {avaliacaoAberto && !loading && (
                    <div className="cadastro-contas-select-dropdown">
                      <div
                        className={`cadastro-contas-select-option ${!avaliacaoAtiva ? "selected" : ""}`}
                        onClick={() => {
                          setAvaliacaoAtiva(false)
                          setAvaliacaoAberto(false)
                        }}
                      >
                        <div className="cadastro-contas-status-indicator inactive">
                          <X size={16} />
                        </div>
                        <span>Desativado</span>
                      </div>
                      <div
                        className={`cadastro-contas-select-option ${avaliacaoAtiva ? "selected" : ""}`}
                        onClick={() => {
                          setAvaliacaoAtiva(true)
                          setAvaliacaoAberto(false)
                        }}
                      >
                        <div className="cadastro-contas-status-indicator active">
                          <Check size={16} />
                        </div>
                        <span>Ativado</span>
                      </div>
                    </div>
                  )}
                </div>
                <p className="cadastro-contas-field-description">
                  <Shield size={14} />
                  <span>Permite que os clientes avaliem o serviço após 7 dias</span>
                </p>
              </div>

              <div className="cadastro-contas-form-group">
                <label htmlFor="premium">Conta Premium</label>
                <div className="cadastro-contas-select-container">
                  <div
                    className="cadastro-contas-custom-select premium"
                    onClick={() => !loading && setPremiumAberto(!premiumAberto)}
                  >
                    <div className="cadastro-contas-select-value">
                      <div
                        className={`cadastro-contas-status-indicator ${premiumAtivo ? "premium-active" : "inactive"}`}
                      >
                        {premiumAtivo ? <Crown size={16} /> : <X size={16} />}
                      </div>
                      <span>{premiumAtivo ? "Premium Ativo" : "Desativado"}</span>
                    </div>
                    <ChevronDown className={`cadastro-contas-select-icon ${premiumAberto ? "open" : ""}`} />
                  </div>
                  {premiumAberto && !loading && (
                    <div className="cadastro-contas-select-dropdown">
                      <div
                        className={`cadastro-contas-select-option ${!premiumAtivo ? "selected" : ""}`}
                        onClick={() => {
                          setPremiumAtivo(false)
                          setPremiumAberto(false)
                        }}
                      >
                        <div className="cadastro-contas-status-indicator inactive">
                          <X size={16} />
                        </div>
                        <span>Desativado</span>
                      </div>
                      <div
                        className={`cadastro-contas-select-option ${premiumAtivo ? "selected" : ""}`}
                        onClick={() => {
                          setPremiumAtivo(true)
                          setPremiumAberto(false)
                        }}
                      >
                        <div className="cadastro-contas-status-indicator premium-active">
                          <Crown size={16} />
                        </div>
                        <span>Premium Ativo</span>
                      </div>
                    </div>
                  )}
                </div>
                <p className="cadastro-contas-field-description">
                  <Crown size={14} />
                  <span>Acesso a recursos exclusivos e sem limitações</span>
                </p>
              </div>

              <button type="submit" className="cadastro-contas-button" disabled={loading}>
                {loading ? "Cadastrando..." : "Cadastrar conta"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}
