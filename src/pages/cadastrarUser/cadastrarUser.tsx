"use client"

import type React from "react"
import { useState } from "react"
import "./cadastrarUser.css"
import { Scissors, Calendar, Eye, EyeOff, UserPlus } from "lucide-react"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { auth, firestore } from "../../firebase/firebase"
import { doc, setDoc } from "firebase/firestore"
import { useNavigate } from "react-router-dom"
import { Alert, Stack, AlertIcon, AlertTitle } from '@chakra-ui/react'

export default function CadastrarUser() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [nomeEstabelecimento, setNomeEstabelecimento] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showAlertCreateAccount, setShowAlertCreateAccount] = useState<boolean>(false)
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
    telefone: "",
    nomeEstabelecimento: "",
  })
  const [loading, setLoading] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const navigation = useNavigate()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Função para criar slug sem acentos e espaços
  const createSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/\s+/g, '') // Remove espaços
      .replace(/[^a-z0-9]/g, ''); // Remove caracteres especiais
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Criar usuário no Authentication
      const userCriado = await createUserWithEmailAndPassword(auth, email, password)
      const idUserCriado = userCriado.user.uid

      // Criar documento na coleção "contas"
      await setDoc(doc(firestore, "contas", idUserCriado), {
        nome: formData.nome,
        email: email,
        telefone: formData.telefone,
        nomeEstabelecimento: nomeEstabelecimento,
        slug: createSlug(nomeEstabelecimento),
        premium: false,
        tipoPlano: 'nenhum',
        avaliacao_gratis: false,
        max_colaborador: 1,
        dataCriacao: new Date().toISOString(),
        cargo: 'proprietario',
        ja_pegou_premium_gratis: false,
      })

      setLoading(false)
      setShowAlertCreateAccount(true)
    } catch (error) {
      setLoading(false)
      alert("Erro ao criar conta: " + error)
    }
  }

  const handleLogin = () => {
    // Aqui você pode adicionar a navegação para login
    navigation('/login')
  }

  return (
    <main className="main-signup">
      <div className="container-signup">
      {showAlertCreateAccount && (
          <Stack className='stack-container-chakra'>
            <Alert status="success">
              <AlertIcon />
              <AlertTitle>Conta criada com sucesso!</AlertTitle>
            </Alert>
          </Stack>
        )}
        
        {/* Formulário à esquerda */}
        <div className="signup-left">
          <div className="signup-form-container">
          
            <div className="form-header">
            
              <h3>Crie sua conta</h3>
              <p className="signup-subtitle">Comece a gerenciar seu estabelecimento hoje mesmo</p>
            </div>

            <form className="signup-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="nome">Nome completo</label>
                  <div className="input-container">
                    <input
                      type="text"
                      id="nome"
                      name="nome"
                      value={formData.nome}
                      onChange={handleInputChange}
                      placeholder="Seu nome completo"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="telefone">Telefone</label>
                  <div className="input-container">
                    <input
                      type="tel"
                      id="telefone"
                      name="telefone"
                      value={formData.telefone}
                      onChange={handleInputChange}
                      placeholder="(11) 99999-9999"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <div className="input-container">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    onChange={(e) => { setEmail(e.target.value) }}
                    placeholder="seu@email.com"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="nomeEstabelecimento">Nome do estabelecimento</label>
                <div className="input-container">
                  <input
                    type="text"
                    id="nomeEstabelecimento"
                    name="nomeEstabelecimento"
                    onChange={(e) => { setNomeEstabelecimento(e.target.value) }}
                    placeholder="Nome do seu salão/clínica"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="senha">Senha</label>
                  <div className="input-container">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="senha"
                      name="senha"
                      onChange={(e) => { setPassword(e.target.value) }}
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

                <div className="form-group">
                  <label htmlFor="confirmarSenha">Confirmar senha</label>
                  <div className="input-container">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmarSenha"
                      name="confirmarSenha"
                      placeholder="Confirme sua senha"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={loading}
                    >
                      {showConfirmPassword ? <EyeOff className="eye-icon" /> : <Eye className="eye-icon" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="terms-section">
                <div className="terms-checkbox">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    disabled={loading}
                  />
                  <label htmlFor="terms">
                    Aceito os{" "}
                    <a href="#" className="terms-link">
                      termos de uso
                    </a>{" "}
                    e{" "}
                    <a href="#" className="terms-link">
                      política de privacidade
                    </a>
                  </label>
                </div>
              </div>

              <button type="submit" className="signup-button" disabled={loading || !acceptTerms}>
                {loading ? "Criando conta..." : "Criar conta"}
              </button>

              <div className="login-option">
                Já tem uma conta?{" "}
                <button type="button" onClick={handleLogin} className="login-link" disabled={loading}>
                  Faça login
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Branding à direita */}
        <div className="signup-right">
          <div className="signup-right-content">
            <div className="logo-large">
              <Scissors className="scissors-icon-large" />
              <span>Trezu</span>
            </div>
            <h2>Transforme seu negócio</h2>
            <p>Junte-se a milhares de profissionais que já revolucionaram a gestão de seus estabelecimentos.</p>

            <div className="benefits">
              <div className="benefit">
                <div className="benefit-icon">
                  <UserPlus className="icon" />
                </div>
                <div className="benefit-content">
                  <h4>Cadastro simples</h4>
                  <p>Configure sua conta em poucos minutos</p>
                </div>
              </div>
              <div className="benefit">
                <div className="benefit-icon">
                  <Calendar className="icon" />
                </div>
                <div className="benefit-content">
                  <h4>Agenda inteligente</h4>
                  <p>Organize horários sem conflitos</p>
                </div>
              </div>
              <div className="benefit">
                <div className="benefit-icon">
                  <Scissors className="icon" />
                </div>
                <div className="benefit-content">
                  <h4>Gestão completa</h4>
                  <p>Controle total do seu estabelecimento</p>
                </div>
              </div>
            </div>

            <div className="stats">
              <div className="stat">
                <span className="stat-number">10k+</span>
                <span style={{ color: 'white' }} className="stat-label">Profissionais</span>
              </div>
              <div className="stat">
                <span className="stat-number">50k+</span>
                <span style={{ color: 'white' }} className="stat-label">Agendamentos</span>
              </div>
              <div className="stat">
                <span className="stat-number">98%</span>
                <span style={{ color: 'white' }} className="stat-label">Satisfação</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
