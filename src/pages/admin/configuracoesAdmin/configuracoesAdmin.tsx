"use client"

import { useState, useEffect } from "react"
import {
  Building2,
  Phone,
  Mail,
  Upload,
  Clock,
  Palette,
  Save,
  Settings,
  Camera,
  Globe,
  Trash2,
} from "lucide-react"
import "./configuracoesAdmin.css"
import { getAuth } from "firebase/auth"
import { firestore } from '../../../firebase/firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { useRef } from "react"

const ConfiguracoesAdmin = () => {
  // Estados para as configurações
  const [activeTab, setActiveTab] = useState("salon")
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [primaryColor, setPrimaryColor] = useState("#5d3fd3")
  const [showColorPicker, setShowColorPicker] = useState(false)

  // Estados dos formulários
  const [salonInfo, setSalonInfo] = useState({
    name: "",
    phone: "",
    email: "",
    description: "",
    cep: "",
    rua: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
    complemento: "",
    slug: ""
  })
  const auth = getAuth()

  // Buscar dados da conta logada ao entrar na página
  useEffect(() => {
    const fetchConta = async () => {
      if (!auth.currentUser?.uid) return
      const docRef = doc(firestore, 'contas', auth.currentUser.uid)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const data = docSnap.data()
        setSalonInfo((prev) => ({
          ...prev,
          name: data.nomeEstabelecimento || "",
          phone: data.telefone || "",
          email: data.email || "",
          description: data.descricaoEstabelecimento || "",
          cep: data.cep || "",
          rua: data.rua || "",
          numero: data.numero || "",
          bairro: data.bairro || "",
          cidade: data.cidade || "",
          estado: data.estado || "",
          complemento: data.complemento || "",
          slug: data.slug || ""
        }))
      }
    }
    fetchConta()
  }, [auth.currentUser])

  // Função para buscar endereço pelo CEP
  const buscarEnderecoPorCep = async (cep: string) => {
    if (!cep || cep.length < 8) return
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep.replace(/\D/g, '')}/json/`)
      const data = await response.json()
      if (!data.erro) {
        setSalonInfo((prev) => ({
          ...prev,
          rua: data.logradouro || "",
          bairro: data.bairro || "",
          cidade: data.localidade || "",
          estado: data.uf || "",
        }))
      }
    } catch (error) {
      // Não faz nada se derro
    }
  }

  type WeekDayKey = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
  type WorkingHour = { open: string; close: string; closed: boolean };
  const [workingHours, setWorkingHours] = useState<Record<WeekDayKey, WorkingHour>>({
    monday: { open: "08:00", close: "18:00", closed: false },
    tuesday: { open: "08:00", close: "18:00", closed: false },
    wednesday: { open: "08:00", close: "18:00", closed: false },
    thursday: { open: "08:00", close: "18:00", closed: false },
    friday: { open: "08:00", close: "18:00", closed: false },
    saturday: { open: "08:00", close: "16:00", closed: false },
    sunday: { open: "09:00", close: "15:00", closed: true },
  })

  const [policies, setPolicies] = useState({
    appointmentInterval: 15,
    maxAppointmentsPerDay: 8,
    cancellationHours: 24,
    rescheduleHours: 12,
    cancellationPolicy: "",
    reschedulePolicy: "",
  })

  const [appearance, setAppearance] = useState({
    displayName: "",
    bookingUrl: "",
    enableCustomPage: false,
    welcomeMessage: "",
    thankYouMessage: "",
  })

  const tabs = [
    { id: "salon", label: "Informações do Salão", icon: Building2 },
    { id: "schedule", label: "Horários e Políticas", icon: Clock },
    { id: "appearance", label: "Aparência e Identidade", icon: Palette },
  ]

  const weekDays = [
    { key: "monday", label: "Segunda-feira" },
    { key: "tuesday", label: "Terça-feira" },
    { key: "wednesday", label: "Quarta-feira" },
    { key: "thursday", label: "Quinta-feira" },
    { key: "friday", label: "Sexta-feira" },
    { key: "saturday", label: "Sábado" },
    { key: "sunday", label: "Domingo" },
  ]

  const predefinedColors = ["#5d3fd3", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16"]

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview((e.target?.result as string) || null)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleWorkingHourChange = (day: WeekDayKey, field: string, value: string) => {
    // Garantir que o valor do input seja salvo exatamente como está
    setWorkingHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }))
  }

  const handleSave = () => {
    // Aqui você implementaria a lógica para salvar as configurações
    if (!auth.currentUser?.uid) return
    const docRef = doc(firestore, 'contas', auth.currentUser.uid)
    updateDoc(docRef, {
      nomeEstabelecimento: salonInfo.name,
      telefone: salonInfo.phone,
      email: salonInfo.email,
      descricaoEstabelecimento: salonInfo.description,
      cep: salonInfo.cep,
      rua: salonInfo.rua,
      numero: salonInfo.numero,
      bairro: salonInfo.bairro,
      cidade: salonInfo.cidade,
      estado: salonInfo.estado,
      complemento: salonInfo.complemento,
    })
    alert("Configurações salvas com sucesso!")
  }

  const [copied, setCopied] = useState(false)
  const copyTimeout = useRef<NodeJS.Timeout | null>(null)

  const generateBookingUrl = () => {
    const baseUrl = "https://trezu.com.br/agendar/"
    const slug = salonInfo.slug || ""
    return baseUrl + slug
  }

  const handleCopyUrl = () => {
    const url = generateBookingUrl()
    navigator.clipboard.writeText(url)
      .then(() => {
        setCopied(true)
        if (copyTimeout.current) clearTimeout(copyTimeout.current)
        copyTimeout.current = setTimeout(() => setCopied(false), 2000)
      })
      .catch(() => {
        setCopied(false)
      })
  }

  // Função para montar o array de horários para o Firestore
  const montarHorariosFunc = () => {
    return Object.entries(workingHours).map(([dia, valor]) => ({
      dia,
      aberto: !valor.closed,
      abertura: valor.open,
      fechamento: valor.close,
    }))
  }

  // Função para salvar horários e políticas
  const handleSaveHorarios = async () => {
    if (!auth.currentUser?.uid) return
    const horariosParaSalvar = montarHorariosFunc();
    const docRef = doc(firestore, 'contas', auth.currentUser.uid)
    await updateDoc(docRef, {
      horariosFunc: horariosParaSalvar,
      configuracoesAtendimento: {
        appointmentInterval: policies.appointmentInterval,
        maxAppointmentsPerDay: policies.maxAppointmentsPerDay,
      },
      politicas: {
        cancellationHours: policies.cancellationHours,
        rescheduleHours: policies.rescheduleHours,
        cancellationPolicy: policies.cancellationPolicy,
        reschedulePolicy: policies.reschedulePolicy,
      }
    })
    alert('Horários e políticas salvos com sucesso!')
  }

  // Função para salvar aparência e identidade
  const handleSaveAparencia = async () => {
    if (!auth.currentUser?.uid) return
    const docRef = doc(firestore, 'contas', auth.currentUser.uid)
    await updateDoc(docRef, {
      aparenciaAgendamento: {
        corPrincipal: primaryColor,
        nomeExibicao: appearance.displayName,
        linkAgendamento: generateBookingUrl(),
        mensagemBoasVindas: appearance.welcomeMessage,
        mensagemAgradecimento: appearance.thankYouMessage,
      }
    })
    alert('Aparência e identidade salvas com sucesso!')
  }

  return (
    <div className="configuracoes-container">
      {/* Header */}
      <div className="configuracoes-header">
        <div className="header-content">
          <div className="header-title">
            <Settings className="header-icon" />
            <div>
              <h1>Configurações do Sistema</h1>
              <p>Personalize seu salão e defina suas políticas de atendimento</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn-save" onClick={handleSave}>
              <Save size={18} />
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="configuracoes-nav">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`nav-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={20} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="configuracoes-content">
        {/* Informações do Salão */}
        {activeTab === "salon" && (
          <div className="config-section">
            <div className="section-header">
              <Building2 size={24} />
              <div>
                <h2>Informações do Salão</h2>
                <p>Configure as informações básicas do seu estabelecimento</p>
              </div>
            </div>

            <div className="config-grid">
              {/* Logo Upload */}
              <div className="config-card full-width">
                <h3>Logo do Estabelecimento</h3>
                <div className="logo-upload-area">
                  <div className="logo-preview">
                    {logoPreview ? (
                      <img src={logoPreview || "/placeholder.svg"} alt="Logo preview" />
                    ) : (
                      <div className="logo-placeholder">
                        <Camera size={32} />
                        <span>Nenhuma imagem selecionada</span>
                      </div>
                    )}
                  </div>
                  <div className="upload-controls">
                    <input
                      type="file"
                      id="logo-upload"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      style={{ display: "none" }}
                    />
                    <label htmlFor="logo-upload" className="btn-upload">
                      <Upload size={18} />
                      Escolher Imagem
                    </label>
                    {logoPreview && (
                      <button className="btn-remove" onClick={() => setLogoPreview(null)}>
                        <Trash2 size={18} />
                        Remover
                      </button>
                    )}
                  </div>
                  <small>Formatos aceitos: JPG, PNG, SVG. Tamanho máximo: 2MB</small>
                </div>
              </div>

              {/* Informações Básicas */}
              <div className="config-card">
                <h3>Informações Básicas</h3>
                <div className="form-group">
                  <label htmlFor="salon-name">Nome do Salão *</label>
                  <input
                    type="text"
                    id="salon-name"
                    value={salonInfo.name}
                    onChange={(e) => setSalonInfo((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Digite o nome do seu salão"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="salon-phone">Telefone *</label>
                  <div className="input-with-icon">
                    <Phone size={18} />
                    <input
                      type="tel"
                      id="salon-phone"
                      value={salonInfo.phone}
                      onChange={(e) => setSalonInfo((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="salon-email">E-mail *</label>
                  <div className="input-with-icon">
                    <Mail size={18} />
                    <input
                      type="email"
                      id="salon-email"
                      value={salonInfo.email}
                      onChange={(e) => setSalonInfo((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="contato@seusalao.com"
                    />
                  </div>
                </div>

                {/* Endereço */}
                <div className="form-group">
                  <label htmlFor="salon-cep">CEP *</label>
                  <input
                    type="text"
                    id="salon-cep"
                    value={salonInfo.cep}
                    onChange={(e) => setSalonInfo((prev) => ({ ...prev, cep: e.target.value }))}
                    onBlur={() => buscarEnderecoPorCep(salonInfo.cep)}
                    placeholder="Digite o CEP"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="salon-rua">Rua</label>
                  <input
                    type="text"
                    id="salon-rua"
                    value={salonInfo.rua}
                    onChange={(e) => setSalonInfo((prev) => ({ ...prev, rua: e.target.value }))}
                    placeholder="Rua"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="salon-numero">Número</label>
                  <input
                    type="text"
                    id="salon-numero"
                    value={salonInfo.numero}
                    onChange={(e) => setSalonInfo((prev) => ({ ...prev, numero: e.target.value }))}
                    placeholder="Número"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="salon-bairro">Bairro</label>
                  <input
                    type="text"
                    id="salon-bairro"
                    value={salonInfo.bairro}
                    onChange={(e) => setSalonInfo((prev) => ({ ...prev, bairro: e.target.value }))}
                    placeholder="Bairro"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="salon-cidade">Cidade</label>
                  <input
                    type="text"
                    id="salon-cidade"
                    value={salonInfo.cidade}
                    onChange={(e) => setSalonInfo((prev) => ({ ...prev, cidade: e.target.value }))}
                    placeholder="Cidade"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="salon-estado">Estado</label>
                  <input
                    type="text"
                    id="salon-estado"
                    value={salonInfo.estado}
                    onChange={(e) => setSalonInfo((prev) => ({ ...prev, estado: e.target.value }))}
                    placeholder="Estado"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="salon-complemento">Complemento</label>
                  <input
                    type="text"
                    id="salon-complemento"
                    value={salonInfo.complemento}
                    onChange={(e) => setSalonInfo((prev) => ({ ...prev, complemento: e.target.value }))}
                    placeholder="Complemento"
                  />
                </div>
              </div>

              {/* Descrição */}
              <div className="config-card full-width">
                <h3>Descrição do Estabelecimento</h3>
                <div className="form-group">
                  <label htmlFor="salon-description">Conte um pouco sobre seu salão</label>
                  <textarea
                    id="salon-description"
                    value={salonInfo.description}
                    onChange={(e) => setSalonInfo((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva os serviços, ambiente, diferenciais do seu salão..."
                    rows={4}
                  />
                  <small>Esta descrição aparecerá na página de agendamento online</small>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Horários e Políticas */}
        {activeTab === "schedule" && (
          <div className="config-section">
            <div className="section-header">
              <Clock size={24} />
              <div>
                <h2>Horários e Políticas de Atendimento</h2>
                <p>Configure os horários de funcionamento e políticas do seu salão</p>
              </div>
            </div>

            <div className="config-grid">
              {/* Horários de Funcionamento */}
              <div className="config-card full-width">
                <h3>Horários de Funcionamento</h3>
                <div className="working-hours-grid">
                  {weekDays.map((day) => (
                    <div key={day.key} className="day-schedule">
                      <div className="day-header">
                        <label className="day-name">{day.label}</label>
                        <div className="day-toggle">
                          <input
                            type="checkbox"
                            id={`${day.key}-closed`}
                            checked={!workingHours[day.key as WeekDayKey].closed}
                            onChange={(e) => handleWorkingHourChange(day.key as WeekDayKey, "closed", (!e.target.checked).toString())}
                          />
                          <label htmlFor={`${day.key}-closed`}>Aberto</label>
                        </div>
                      </div>

                      {!workingHours[day.key as WeekDayKey].closed && (
                        <div className="time-inputs">
                          <div className="time-group">
                            <label>Abertura</label>
                            <input
                              type="time"
                              value={workingHours[day.key as WeekDayKey].open}
                              onChange={(e) => handleWorkingHourChange(day.key as WeekDayKey, "open", e.target.value)}
                            />
                          </div>
                          <div className="time-separator">até</div>
                          <div className="time-group">
                            <label>Fechamento</label>
                            <input
                              type="time"
                              value={workingHours[day.key as WeekDayKey].close}
                              onChange={(e) => handleWorkingHourChange(day.key as WeekDayKey, "close", e.target.value)}
                            />
                          </div>
                        </div>
                      )}

                      {workingHours[day.key as WeekDayKey].closed && (
                        <div className="closed-indicator">
                          <span>Fechado</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <button className="btn-save" style={{ marginTop: 24 }} onClick={handleSaveHorarios}>
                  <Save size={18} />
                  Salvar Horários e Políticas
                </button>
              </div>

              {/* Configurações de Atendimento */}
              <div className="config-card">
                <h3>Configurações de Atendimento</h3>

                <div className="form-group">
                  <label htmlFor="appointment-interval">Intervalo entre Atendimentos</label>
                  <select
                    id="appointment-interval"
                    value={policies.appointmentInterval}
                    onChange={(e) =>
                      setPolicies((prev) => ({ ...prev, appointmentInterval: Number.parseInt(e.target.value) }))
                    }
                  >
                    <option value={15}>15 minutos</option>
                    <option value={30}>30 minutos</option>
                    <option value={45}>45 minutos</option>
                    <option value={60}>1 hora</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="max-appointments">Limite de Atendimentos por Dia</label>
                  <input
                    type="number"
                    id="max-appointments"
                    value={policies.maxAppointmentsPerDay}
                    onChange={(e) =>
                      setPolicies((prev) => ({ ...prev, maxAppointmentsPerDay: Number.parseInt(e.target.value) }))
                    }
                    min="1"
                    max="20"
                  />
                  <small>Por profissional</small>
                </div>
              </div>

              {/* Políticas de Cancelamento */}
              <div className="config-card">
                <h3>Políticas de Cancelamento e Remarcação</h3>

                <div className="form-group">
                  <label htmlFor="cancellation-hours">Prazo para Cancelamento</label>
                  <select
                    id="cancellation-hours"
                    value={policies.cancellationHours}
                    onChange={(e) =>
                      setPolicies((prev) => ({ ...prev, cancellationHours: Number.parseInt(e.target.value) }))
                    }
                  >
                    <option value={2}>2 horas antes</option>
                    <option value={4}>4 horas antes</option>
                    <option value={12}>12 horas antes</option>
                    <option value={24}>24 horas antes</option>
                    <option value={48}>48 horas antes</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="reschedule-hours">Prazo para Remarcação</label>
                  <select
                    id="reschedule-hours"
                    value={policies.rescheduleHours}
                    onChange={(e) =>
                      setPolicies((prev) => ({ ...prev, rescheduleHours: Number.parseInt(e.target.value) }))
                    }
                  >
                    <option value={2}>2 horas antes</option>
                    <option value={4}>4 horas antes</option>
                    <option value={12}>12 horas antes</option>
                    <option value={24}>24 horas antes</option>
                  </select>
                </div>
              </div>

              {/* Textos das Políticas */}
              <div className="config-card full-width">
                <h3>Textos das Políticas</h3>

                <div className="form-group">
                  <label htmlFor="cancellation-policy">Política de Cancelamento</label>
                  <textarea
                    id="cancellation-policy"
                    value={policies.cancellationPolicy}
                    onChange={(e) => setPolicies((prev) => ({ ...prev, cancellationPolicy: e.target.value }))}
                    placeholder="Descreva sua política de cancelamento..."
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="reschedule-policy">Política de Remarcação</label>
                  <textarea
                    id="reschedule-policy"
                    value={policies.reschedulePolicy}
                    onChange={(e) => setPolicies((prev) => ({ ...prev, reschedulePolicy: e.target.value }))}
                    placeholder="Descreva sua política de remarcação..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Aparência e Identidade */}
        {activeTab === "appearance" && (
          <div className="config-section">
            <div className="section-header">
              <Palette size={24} />
              <div>
                <h2>Aparência e Identidade</h2>
                <p>Personalize a aparência da sua página de agendamento online</p>
              </div>
            </div>

            <div className="config-grid">
              {/* Cor Principal */}
              <div className="config-card">
                <h3>Cor Principal</h3>
                <div className="color-picker-section">
                  <div className="current-color">
                    <div
                      className="color-preview"
                      style={{ backgroundColor: primaryColor }}
                      onClick={() => setShowColorPicker(!showColorPicker)}
                    ></div>
                    <span>{primaryColor}</span>
                  </div>

                  <div className="predefined-colors">
                    {predefinedColors.map((color) => (
                      <button
                        key={color}
                        className={`color-option ${primaryColor === color ? "active" : ""}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setPrimaryColor(color)}
                      />
                    ))}
                  </div>

                  <div className="custom-color">
                    <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
                    <span>Cor personalizada</span>
                  </div>
                </div>
              </div>

              {/* Nome de Exibição */}
              <div className="config-card">
                <h3>Nome de Exibição</h3>
                <div className="form-group">
                  <label htmlFor="display-name">Nome para Agendamento Online</label>
                  <input
                    type="text"
                    id="display-name"
                    value={appearance.displayName}
                    onChange={(e) => setAppearance((prev) => ({ ...prev, displayName: e.target.value }))}
                    placeholder="Nome que aparecerá na página de agendamento"
                  />
                  <small>Pode ser diferente do nome oficial do salão</small>
                </div>
              </div>

              {/* Link de Agendamento */}
              <div className="config-card full-width">
                <h3>Link de Agendamento Online</h3>
                <div className="url-generator">
                  <div className="url-preview">
                    <Globe size={18} />
                    <span>{generateBookingUrl()}</span>
                    <button className="btn-copy" onClick={handleCopyUrl} type="button">
                      {copied ? "Copiado!" : "Copiar"}
                    </button>
                  </div>

                  <div className="url-toggle">
                    <input
                      type="checkbox"
                      id="enable-custom-page"
                      checked={appearance.enableCustomPage}
                      onChange={(e) => setAppearance((prev) => ({ ...prev, enableCustomPage: e.target.checked }))}
                    />
                    <label htmlFor="enable-custom-page">Ativar página personalizada de agendamento</label>
                  </div>
                </div>
              </div>

              {/* Mensagens Personalizadas */}
              <div className="config-card">
                <h3>Mensagem de Boas-vindas</h3>
                <div className="form-group">
                  <label htmlFor="welcome-message">Texto de Boas-vindas</label>
                  <textarea
                    id="welcome-message"
                    value={appearance.welcomeMessage}
                    onChange={(e) => setAppearance((prev) => ({ ...prev, welcomeMessage: e.target.value }))}
                    placeholder="Bem-vindo ao nosso salão! Escolha o melhor horário para você."
                    rows={3}
                  />
                </div>
              </div>

              <div className="config-card">
                <h3>Mensagem de Agradecimento</h3>
                <div className="form-group">
                  <label htmlFor="thank-you-message">Texto após Agendamento</label>
                  <textarea
                    id="thank-you-message"
                    value={appearance.thankYouMessage}
                    onChange={(e) => setAppearance((prev) => ({ ...prev, thankYouMessage: e.target.value }))}
                    placeholder="Obrigado por agendar conosco! Confirmaremos seu horário em breve."
                    rows={3}
                  />
                </div>
              </div>

              {/* Botão para salvar aparência */}
              <div className="config-card full-width" style={{ textAlign: 'right' }}>
                <button className="btn-save" onClick={handleSaveAparencia}>
                  <Save size={18} />
                  Salvar Aparência
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Save Button */}
      <div className="floating-save">
        <button className="btn-floating-save" onClick={handleSave}>
          <Save size={20} />
          Salvar Todas as Configurações
        </button>
      </div>
    </div>
  )
}

export default ConfiguracoesAdmin
