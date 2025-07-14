"use client"
import "./pageErro.css"
import { useLocation } from "react-router-dom"
import { MessageCircle } from "lucide-react"

export default function PageErro() {
  const handleGoHome = () => {
    // Aqui você pode adicionar a navegação para a página principal
    window.location.href = "/"
  }

  const location = useLocation();
  // Extrai o slug da URL se existir
  const slug = location.pathname.startsWith('/agendar/') ? location.pathname.replace('/agendar/', '') : '';
  const whatsappNumber = '+5521982410516';
  const whatsappMessage = `não consegui encontrar a loja${slug ? `: ${slug}` : ''}`;
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <>
      <div className="error-container">
        <div className="error-card">
          {/* Ícone de erro */}
          <div className="error-icon-container">
            <div className="error-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <path d="M12 9v4" />
                <path d="m12 17 .01 0" />
              </svg>
            </div>
          </div>

          {/* Logo/Nome da loja */}
          <div className="brand-section">
            <h1 className="brand-name">CliqAgenda</h1>
            <div className="brand-underline"></div>
          </div>

          {/* Mensagem de erro */}
          <div className="error-message">
            <h2 className="error-title">Oops! Algo deu errado</h2>
            <p className="error-description">
              Parece que esse estabelecimento não existe!
            </p>
          </div>

          {/* Botão para voltar */}
          <button onClick={handleGoHome} className="back-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9,22 9,12 15,12 15,22" />
            </svg>
            Voltar para a Página Principal
          </button>

          {/* Informação adicional */}
          <div className="error-info">
            <p className="error-contact">
              Se o problema persistir, entre em contato conosco
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', marginLeft: 8, color: '#25D366', fontWeight: 600, textDecoration: 'none', fontSize: 16 }}
              >
                <MessageCircle size={20} style={{ marginRight: 4 }} /> WhatsApp
              </a>
            </p>
          </div>
        </div>

        {/* Elementos decorativos de fundo */}
        <div className="bg-decoration bg-decoration-1"></div>
        <div className="bg-decoration bg-decoration-2"></div>
        <div className="bg-decoration bg-decoration-3"></div>
      </div>
    </>
  )
}
