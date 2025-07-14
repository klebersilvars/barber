"use client"
import "./modal.css"

interface ModalProps {
  showPremiumModal: boolean
  setShowPremiumModal: (show: boolean) => void
  navigate: (path: string) => void
  uid: string
  ativarTesteGratis: () => void
  testeGratisAtivo: boolean
  diasRestantesTeste: number | null
}

export default function Modal({ showPremiumModal, setShowPremiumModal, navigate, uid, ativarTesteGratis, testeGratisAtivo, diasRestantesTeste }: ModalProps) {
  return (
    <>
      {showPremiumModal && (
        <div className="premium-modal-overlay" onClick={() => setShowPremiumModal(false)}>
          <div className="premium-modal" onClick={(e) => e.stopPropagation()}>
            <button className="premium-modal-close" onClick={() => setShowPremiumModal(false)}>
              ×
            </button>

            <div className="premium-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
              </svg>
            </div>

            <h2>Funcionalidade Premium</h2>

            {testeGratisAtivo && diasRestantesTeste !== null && diasRestantesTeste > 0 && (
              <div style={{marginBottom: 16, color: '#2563eb', fontWeight: 600, fontSize: 18}}>
                🕒 Teste grátis ativo: <strong>{diasRestantesTeste} {diasRestantesTeste === 1 ? 'dia restante' : 'dias restantes'}</strong>
              </div>
            )}

            <p>Você precisa ser Premium para acessar esta funcionalidade.</p>

            <div className="premium-buttons">
              <button
                className="btn-primary"
                onClick={() => {
                  setShowPremiumModal(false)
                  navigate(`/dashboard/${uid}/plano`)
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4" />
                  <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3" />
                  <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3" />
                </svg>
                Ir para planos
              </button>

              {!testeGratisAtivo && (
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setShowPremiumModal(false)
                    ativarTesteGratis()
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                  Testar grátis por 7 dias
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
} 