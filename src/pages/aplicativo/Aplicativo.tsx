import { useState } from 'react'
import { Download, Shield, Zap, Clock, ChevronDown } from 'lucide-react'
import { motion } from 'framer-motion'
import LogoTrezu from '../../assets/LOGOTIPO TREZU.svg'

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.2,
            delayChildren: 0.3,
        },
    },
}

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.8, ease: 'easeOut' },
    },
}


export default function Aplicativo() {
    const [isDownloading, setIsDownloading] = useState(false)
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

    const handleInstall = () => {
        setIsDownloading(true)
        setTimeout(() => {
            setIsDownloading(false)
            window.location.href = '../../public/aplicativo.apk'
        }, 1500)
    }

    const faqItems = [
        {
            question: 'Como faço para instalar o TREZU?',
            answer: 'Clique no botão "Instalar Agora" abaixo. O arquivo APK será baixado automaticamente. Após o download, abra o arquivo e siga as instruções de instalação.',
        },
        {
            question: 'Qual é o requisito mínimo de Android?',
            answer: 'TREZU requer Android 8.0 ou superior. Verifique sua versão do Android nas configurações do seu dispositivo.',
        },
        {
            question: 'Quanto espaço em armazenamento é necessário?',
            answer: 'O aplicativo ocupa aproximadamente 70 MB de espaço em armazenamento. Recomenda-se ter pelo menos 100 MB disponível para melhor desempenho.',
        },
        {
            question: 'O aplicativo é gratuito?',
            answer: 'Sim! TREZU é completamente gratuito. Oferecemos uma experiência completa sem cobranças ocultas.',
        },
        {
            question: 'Como reportar um bug?',
            answer: 'Você pode reportar bugs através do menu "Ajuda" dentro do aplicativo ou enviando um email para contato.trezu@gmail.com com detalhes do problema.',
        },
        {
            question: 'Meus dados estão seguros?',
            answer: 'Sim, utilizamos criptografia de ponta a ponta para proteger seus dados. Sua privacidade é nossa prioridade.',
        },
    ]

    return (
        <div style={{
            padding: '24px',
            maxWidth: '100%',
            backgroundColor: '#f8fafc',
            minHeight: '100vh',
            overflowY: 'auto',
            overflowX: 'hidden'
        }}>
            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                {/* Main Content */}
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    {/* Hero Section */}
                    <motion.div
                        variants={itemVariants}
                        style={{
                            textAlign: 'center',
                            paddingTop: '32px',
                            paddingBottom: '48px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <img
                            style={{
                                height: '200px',
                                width: '200px',
                                margin: '0 auto',
                                display: 'block',
                                marginBottom: '16px'
                            }}
                            src={LogoTrezu}
                            alt="Logo TREZU"
                        />
                        <p style={{
                            fontSize: 'clamp(1.25rem, 2vw, 1.5rem)',
                            color: '#1e293b',
                            marginBottom: '8px',
                            fontWeight: '600'
                        }}>
                            O aplicativo que coloca a gestão do seu estabelecimento na palma da sua mão!
                        </p>
                        <p style={{
                            fontSize: 'clamp(1rem, 1.5vw, 1.00rem)',
                            color: '#64748b',
                            maxWidth: '800px',
                            margin: '0 auto'
                        }}>
                            Controle total do seu estabelecimento, em qualquer hora e qualquer lugar.
                        </p>
                    </motion.div>

                    {/* App Card - Installation */}
                    <motion.div
                        variants={itemVariants}
                        style={{
                            marginBottom: '48px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '24px'
                        }}
                    >
                        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                            {/* Main Card */}
                            <motion.div
                                style={{
                                    flex: '2',
                                    minWidth: '300px',
                                    backgroundColor: '#ffffff',
                                    borderRadius: '16px',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                    padding: '32px',
                                    transition: 'all 0.3s ease'
                                }}
                                whileHover={{ y: -5 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0px'
                                }}>
                                    <img
                                        style={{
                                            height: '200px',
                                            width: '200px',
                                            margin: '0 auto',
                                            display: 'block',
                                            marginBottom: '0px'
                                        }}
                                        src={LogoTrezu}
                                        alt="Logo TREZU"
                                    />

                                    {/* Info Section */}
                                    <div style={{ flex: 1, textAlign: 'center' }}>
                                        <h2 style={{
                                            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                                            fontWeight: 'bold',
                                            color: '#1e293b',
                                            marginBottom: '16px',
                                            marginTop: '8px'
                                        }}>
                                            TREZU v1.0.0
                                        </h2>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                                                <Clock size={20} color="#3b82f6" />
                                                <span style={{ fontSize: '14px' }}>
                                                    Última atualização: <span style={{ fontWeight: '600' }}>15 de novembro, 2025</span>
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                                                <Download size={20} color="#4f46e5" />
                                                <span style={{ fontSize: '14px' }}>
                                                    Tamanho: <span style={{ fontWeight: '600' }}>70 MB</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Stats Card
                            <motion.div
                                style={{
                                    flex: '1',
                                    minWidth: '200px',
                                    backgroundColor: '#ffffff',
                                    borderRadius: '16px',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                    padding: '24px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center'
                                }}
                                whileHover={{ y: -5 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{
                                            fontSize: '2.5rem',
                                            fontWeight: 'bold',
                                            background: 'linear-gradient(to right, #2563eb, #4f46e5)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            backgroundClip: 'text'
                                        }}>
                                            4.8
                                        </p>
                                        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Avaliação no Google Play</p>
                                    </div>
                                    <div style={{ height: '1px', backgroundColor: '#e2e8f0' }}></div>
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>50K+</p>
                                        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Downloads ativos</p>
                                    </div>
                                </div>
                            </motion.div> */}
                        </div>
                    </motion.div>

                    {/* Install Button */}
                    <motion.div
                        variants={itemVariants}
                        style={{ marginBottom: '48px', textAlign: 'center' }}
                    >
                        <motion.button
                            onClick={handleInstall}
                            disabled={isDownloading}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '12px',
                                padding: '16px 48px',
                                background: isDownloading
                                    ? 'linear-gradient(to right, #4b5563, #374151)'
                                    : 'linear-gradient(to right, #2563eb, #4f46e5)',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: 'clamp(1rem, 1.5vw, 1.25rem)',
                                borderRadius: '9999px',
                                border: 'none',
                                cursor: isDownloading ? 'not-allowed' : 'pointer',
                                opacity: isDownloading ? 0.75 : 1,
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                transition: 'all 0.3s ease'
                            }}
                            whileHover={!isDownloading ? { scale: 1.05 } : {}}
                            whileTap={!isDownloading ? { scale: 0.98 } : {}}
                        >
                            {isDownloading ? (
                                <>
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    >
                                        <Download size={24} />
                                    </motion.div>
                                    <span>Baixando...</span>
                                </>
                            ) : (
                                <>
                                    <Download size={24} />
                                    <span>Instalar Agora</span>
                                </>
                            )}
                        </motion.button>
                        <p style={{ marginTop: '16px', fontSize: '14px', color: '#64748b' }}>
                            Android 8.0+ | Instalação segura e rápida
                        </p>
                    </motion.div>

                    {/* Features Section */}
                    <motion.div
                        variants={itemVariants}
                        style={{ marginBottom: '48px' }}
                    >
                        <h2 style={{
                            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                            fontWeight: 'bold',
                            color: '#1e293b',
                            textAlign: 'center',
                            marginBottom: '48px'
                        }}>
                            Recursos Principais
                        </h2>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '24px'
                        }}>
                            {[
                                {
                                    icon: Zap,
                                    title: 'Performance',
                                    description: 'Aplicativo otimizado e rápido',
                                },
                                {
                                    icon: Shield,
                                    title: 'Segurança',
                                    description: 'Dados protegidos com criptografia',
                                },
                                {
                                    icon: Clock,
                                    title: 'Atualizações',
                                    description: 'Novos recursos regularmente',
                                },

                            ].map((feature, index) => {
                                const Icon = feature.icon
                                return (
                                    <motion.div
                                        key={index}
                                        style={{
                                            backgroundColor: '#ffffff',
                                            borderRadius: '12px',
                                            padding: '24px',
                                            textAlign: 'center',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                            transition: 'all 0.3s ease'
                                        }}
                                        whileHover={{ y: -8 }}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1, duration: 0.6 }}
                                    >
                                        <motion.div
                                            style={{
                                                display: 'inline-block',
                                                padding: '12px',
                                                background: 'linear-gradient(to bottom right, #dbeafe, #e0e7ff)',
                                                borderRadius: '8px',
                                                marginBottom: '16px'
                                            }}
                                            animate={{ scale: [1, 1.1, 1] }}
                                            transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                                        >
                                            <Icon size={24} color="#2563eb" />
                                        </motion.div>
                                        <h3 style={{
                                            fontWeight: 'bold',
                                            color: '#1e293b',
                                            marginBottom: '8px',
                                            fontSize: '16px'
                                        }}>
                                            {feature.title}
                                        </h3>
                                        <p style={{
                                            color: '#64748b',
                                            fontSize: '14px'
                                        }}>
                                            {feature.description}
                                        </p>
                                    </motion.div>
                                )
                            })}
                        </div>
                    </motion.div>

                    {/* FAQ Section */}
                    <motion.div
                        variants={itemVariants}
                        style={{ marginBottom: '48px' }}
                    >
                        <h2 style={{
                            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                            fontWeight: 'bold',
                            color: '#1e293b',
                            textAlign: 'center',
                            marginBottom: '48px'
                        }}>
                            Perguntas Frequentes
                        </h2>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px',
                            maxWidth: '768px',
                            margin: '0 auto'
                        }}>
                            {faqItems.map((item, index) => (
                                <motion.div
                                    key={index}
                                    style={{
                                        backgroundColor: '#ffffff',
                                        borderRadius: '8px',
                                        border: '1px solid #e2e8f0',
                                        overflow: 'hidden',
                                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                                        transition: 'all 0.3s ease'
                                    }}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <button
                                        onClick={() =>
                                            setExpandedFaq(expandedFaq === index ? null : index)
                                        }
                                        style={{
                                            width: '100%',
                                            padding: '20px 24px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            backgroundColor: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            transition: 'background-color 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <h3 style={{
                                            fontWeight: '600',
                                            color: '#1e293b',
                                            textAlign: 'left',
                                            fontSize: '14px',
                                            flex: 1
                                        }}>
                                            {item.question}
                                        </h3>
                                        <motion.div
                                            animate={{ rotate: expandedFaq === index ? 180 : 0 }}
                                            transition={{ duration: 0.3 }}
                                            style={{ flexShrink: 0, marginLeft: '16px' }}
                                        >
                                            <ChevronDown size={20} color="#64748b" />
                                        </motion.div>
                                    </button>

                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{
                                            height: expandedFaq === index ? 'auto' : 0,
                                            opacity: expandedFaq === index ? 1 : 0,
                                        }}
                                        transition={{ duration: 0.3 }}
                                        style={{ overflow: 'hidden' }}
                                    >
                                        <div style={{
                                            padding: '20px 24px',
                                            borderTop: '1px solid #e2e8f0',
                                            backgroundColor: '#f8fafc',
                                            color: '#64748b',
                                            fontSize: '14px',
                                            lineHeight: '1.6'
                                        }}>
                                            {item.answer}
                                        </div>
                                    </motion.div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    )
}
