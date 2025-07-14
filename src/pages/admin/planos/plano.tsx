"use client"

import { useState } from "react"
import "./plano.css"
import { ArrowLeft, Check, X, Star, Crown, CreditCard, Smartphone, HeadphonesIcon, ChevronRight } from "lucide-react"
import { auth } from '../../../firebase/firebase'

export default function Plano() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");

  const plans = [
    
    {
      id: "empresa",
      name: "Empresa",
      description: "Para estabelecimentos em crescimento",
      monthlyPrice: 20.0,
      yearlyPrice: 200.0,
      popular: true,
      features: [
        "Colaboradores ilimitados",
        "Relatórios avançados",
        "Relatórios personalizados",
        "Suporte prioritário 24/7",
        "Treinamento incluído",
        "Gestão financeira completa",
      ],
      limitations: [],
      color: "blue",
      icon: Crown,
    },
  ]

  const benefits = [
    "Administre sua agenda, parceiros e estoque",
    "Crie relatórios para analisar o seu negócio",
    "Habilite agendamentos online",
    "Gestão financeira avançada",
    "Suporte especializado",
  ]

  const getPrice = (plan: any) => {
    return billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice
  }

  const getSavings = (plan: any) => {
    const monthlyCost = plan.monthlyPrice * 12
    const yearlyCost = plan.yearlyPrice
    return monthlyCost - yearlyCost
  }

  const handleWhatsAppClick = () => {
    const phoneNumber = "5521982410516"
    const message = "Olá, tudo bem? quero conversar sobre os planos que vi na plataforma CliqAgenda"
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
  }

  // URL do backend no Render
  const BACKEND_URL = "https://barber-backend-qlt6.onrender.com"; // Troque pelo seu domínio do Render

  // Função para iniciar o pagamento Mercado Pago
  const handleCheckout = async (plan: any) => {
    try {
      setPaymentMessage("");
      setLoadingPayment(true);
      const userEmail = auth.currentUser?.email;
      if (!userEmail) {
        setPaymentMessage("Você precisa estar logado para assinar um plano. Faça login e tente novamente.");
        setLoadingPayment(false);
        return;
      }
      setPaymentMessage("Redirecionando para o Mercado Pago. Aguarde...");
      const response = await fetch(`${BACKEND_URL}/api/create-preference`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          planName: plan.name,
          price: getPrice(plan),
          email: userEmail,
        }),
      });
      const data = await response.json();
      if (data.init_point) {
        setPaymentMessage("");
        window.location.href = data.init_point;
      } else {
        setPaymentMessage("Não foi possível iniciar o pagamento. Tente novamente em instantes ou entre em contato com o suporte.");
      }
    } catch (err) {
      setPaymentMessage("Erro ao conectar com o Mercado Pago. Verifique sua conexão ou tente novamente mais tarde.");
    } finally {
      setLoadingPayment(false);
    }
  };

  return (
    <div className="plano-container">
      {/* Header */}
      <header className="plano-header">
        <button className="back-button">
          <ArrowLeft size={20} />
        </button>
        <h1>Plano e Pagamento</h1>
      </header>

      {/* Plans Section */}
      <section className="plans-section">
        <div className="plans-header">
          <h2>Conheça nossos planos e preços</h2>
          <p>Escolha o plano ideal para o seu negócio e comece a transformar sua gestão hoje mesmo!</p>

          {/* Billing Toggle */}
          <div className="billing-toggle">
            <button className={billingCycle === "monthly" ? "active" : ""} onClick={() => setBillingCycle("monthly")}>
              Mensal
            </button>
            <button className={billingCycle === "yearly" ? "active" : ""} onClick={() => setBillingCycle("yearly")}>
              Anual
              <span className="savings-badge">Economize até 17%</span>
            </button>
          </div>
        </div>

        {/* Benefits List */}
        <div className="benefits-list">
          {benefits.map((benefit, index) => (
            <div key={index} className="benefit-item">
              <Check className="benefit-icon" />
              <span>{benefit}</span>
            </div>
          ))}
        </div>

        {/* Plans Grid */}
        <div className="plans-grid-two">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`plan-card ${plan.color} ${plan.popular ? "popular" : ""} ${
                selectedPlan === plan.id ? "selected" : ""
              }`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && (
                <div className="popular-badge">
                  <Star size={16} />
                  Mais Popular
                </div>
              )}

              <div className="plan-header">
                <div className="plan-icon">
                  <plan.icon size={28} />
                </div>
                <h3>{plan.name}</h3>
                <p>{plan.description}</p>
              </div>

              <div className="plan-pricing">
                <div className="price">
                  <span className="currency">R$</span>
                  <span className="amount">{getPrice(plan).toFixed(2).replace(".", ",")}</span>
                  <span className="period">/{billingCycle === "monthly" ? "mês" : "ano"}</span>
                </div>
                {billingCycle === "yearly" && (
                  <div className="savings">Economize R$ {getSavings(plan).toFixed(2).replace(".", ",")} por ano</div>
                )}
              </div>

              <div className="plan-features">
                {plan.features.map((feature, index) => (
                  <div key={index} className="feature-item">
                    <Check className="feature-icon" />
                    <span>{feature}</span>
                  </div>
                ))}
                {plan.limitations.map((limitation, index) => (
                  <div key={index} className="limitation-item">
                    <X className="limitation-icon" />
                    <span>{limitation}</span>
                  </div>
                ))}
              </div>

              <button
                className={`plan-button ${plan.color}`}
                onClick={e => {
                  e.stopPropagation();
                  handleCheckout(plan);
                }}
                disabled={loadingPayment}
                style={loadingPayment ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
              >
                {loadingPayment ? "Processando..." : "Selecionar Plano"}
                <ChevronRight size={16} />
              </button>
              {paymentMessage && (
                <div style={{ color: paymentMessage.includes('Erro') || paymentMessage.includes('não foi possível') ? 'red' : '#333', marginTop: 8, fontSize: 14, textAlign: 'center' }}>
                  {paymentMessage}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Payment Methods */}
      <section className="payment-section">
        <h3>Métodos de pagamento aceitos</h3>
        <div className="payment-methods">
          <div className="payment-method">
            <CreditCard size={24} />
            <span>Cartão de Crédito</span>
          </div>
          <div className="payment-method">
            <Smartphone size={24} />
            <span>PIX</span>
          </div>
        </div>
      </section>

      {/* Support */}
      <section className="support-section">
        <div className="support-content">
          <HeadphonesIcon size={32} />
          <h3>Precisa de ajuda para escolher?</h3>
          <p>Nossa equipe está pronta para te ajudar a encontrar o plano ideal para o seu negócio.</p>
          <button className="support-button" onClick={handleWhatsAppClick}>
            Falar com Especialista
          </button>
        </div>
      </section>
    </div>
  )
}
