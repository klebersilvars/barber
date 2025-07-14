"use client"

import type React from "react"

import { useState } from "react"
import "./esqueciSenha.css"
import { Mail, Send, CheckCircle } from "lucide-react"
import { getAuth, sendPasswordResetEmail } from "firebase/auth"

export default function EsqueciSenha() {
  const [email, setEmail] = useState("")
  const [enviado, setEnviado] = useState(false)
  const [carregando, setCarregando] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCarregando(true)

    const auth = getAuth()
    try {
      await sendPasswordResetEmail(auth, email)
      setEnviado(true)
    } catch (error: any) {
      alert("Erro ao enviar e-mail de redefinição: " + (error.message || "Tente novamente."))
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="esqueci-senha-modal-container">
      {!enviado ? (
        <>
          <div className="esqueci-senha-modal-header">
            <h3>Redefinir Senha</h3>
            <p className="esqueci-senha-modal-subtitle">Digite seu email para receber as instruções de redefinição</p>
          </div>

          <form className="esqueci-senha-modal-form" onSubmit={handleSubmit}>
            <div className="esqueci-senha-modal-form-group">
              <label htmlFor="email">Email</label>
              <div className="esqueci-senha-modal-input-container">
                <Mail className="esqueci-senha-modal-input-icon" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className={`esqueci-senha-modal-button ${carregando ? "loading" : ""}`}
              disabled={carregando}
            >
              {carregando ? (
                <>
                  <div className="esqueci-senha-modal-loading-spinner"></div>
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span>Enviar Instruções</span>
                </>
              )}
            </button>

            <div className="esqueci-senha-modal-info-box">
              <p>Você receberá um email com um link para redefinir sua senha. Verifique também sua caixa de spam.</p>
            </div>
          </form>
        </>
      ) : (
        <div className="esqueci-senha-modal-sucesso-container">
          <div className="esqueci-senha-modal-sucesso-icon">
            <CheckCircle size={64} />
          </div>
          <h3>Email Enviado!</h3>
          <p className="esqueci-senha-modal-sucesso-texto">Enviamos as instruções para redefinir sua senha para:</p>
          <div className="esqueci-senha-modal-email-enviado">{email}</div>
          <p className="esqueci-senha-modal-sucesso-instrucoes">
            Verifique sua caixa de entrada e siga as instruções no email. Se não receber em alguns minutos, verifique
            sua caixa de spam.
          </p>
        </div>
      )}
    </div>
  )
}
