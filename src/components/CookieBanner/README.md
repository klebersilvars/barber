# Sistema de Cookies - Trezu

## 📋 Visão Geral

Sistema profissional de gerenciamento de cookies implementado com Chakra UI, oferecendo uma experiência moderna e responsiva para conformidade com LGPD e outras regulamentações de privacidade.

## 🚀 Funcionalidades

### ✅ Banner de Cookies
- **Design Responsivo**: Adapta-se perfeitamente a dispositivos móveis e desktop
- **Múltiplas Opções**: Aceitar todos, apenas necessários ou personalizar
- **Integração com Chakra UI**: Design consistente e profissional
- **Persistência**: Salva preferências no localStorage

### ✅ Modal de Preferências
- **Controle Granular**: 4 tipos de cookies (Necessários, Analíticos, Funcionais, Marketing)
- **Interface Intuitiva**: Checkboxes com badges coloridos e descrições claras
- **Validação**: Cookies necessários sempre ativos

### ✅ Botão Flutuante
- **Acesso Rápido**: Botão flutuante para reconfigurar cookies a qualquer momento
- **Tooltip Informativo**: Explica a funcionalidade do botão
- **Posicionamento Inteligente**: Não interfere com o conteúdo

### ✅ Hook Personalizado
- **Gerenciamento Centralizado**: `useCookies` para toda a lógica
- **TypeScript**: Tipagem completa para segurança
- **Persistência**: Integração com localStorage

## 🛠️ Componentes

### 1. CookieBanner
```tsx
import CookieBanner from './components/CookieBanner/CookieBanner';

// Usado automaticamente no App.tsx
```

### 2. CookieSettings
```tsx
import CookieSettings from './components/CookieSettings/CookieSettings';

// Modal para configurações detalhadas
```

### 3. CookieSettingsButton
```tsx
import CookieSettingsButton from './components/CookieSettingsButton/CookieSettingsButton';

// Botão flutuante para acesso rápido
```

### 4. useCookies Hook
```tsx
import { useCookies } from './hooks/useCookies';

const { 
  cookiesAccepted, 
  preferences, 
  acceptAllCookies, 
  acceptNecessaryCookies,
  updatePreferences,
  resetCookies,
  isCookieEnabled 
} = useCookies();
```

## 📊 Tipos de Cookies

| Tipo | Status | Descrição | Badge |
|------|--------|-----------|-------|
| **Necessários** | Sempre Ativo | Essenciais para funcionamento básico | 🟢 Verde |
| **Analíticos** | Opcional | Análise de uso e melhorias | 🔵 Azul |
| **Funcionais** | Opcional | Personalização e funcionalidades | 🟣 Roxo |
| **Marketing** | Opcional | Publicidade e marketing | 🟠 Laranja |

## 🎨 Design System

### Cores
- **Primária**: Blue.500 (Chakra UI)
- **Sucesso**: Green.500
- **Aviso**: Orange.500
- **Info**: Blue.500
- **Erro**: Red.500

### Responsividade
- **Mobile**: Layout em coluna, botões empilhados
- **Desktop**: Layout em linha, botões lado a lado
- **Breakpoints**: Chakra UI padrão

### Animações
- **Hover**: Scale(1.1) no botão flutuante
- **Transições**: Suaves em todos os elementos
- **Feedback**: Toasts para confirmações

## 🔧 Integração

### App.tsx
```tsx
import { ChakraProvider } from '@chakra-ui/react';
import CookieBanner from './components/CookieBanner/CookieBanner';
import CookieSettingsButton from './components/CookieSettingsButton/CookieSettingsButton';

function App() {
  return (
    <ChakraProvider>
      <AppRoutes />
      <CookieBanner />
      <CookieSettingsButton />
    </ChakraProvider>
  );
}
```

### Verificação de Cookies
```tsx
import { useCookies } from './hooks/useCookies';

function MyComponent() {
  const { isCookieEnabled } = useCookies();
  
  // Só carrega analytics se o usuário aceitou
  if (isCookieEnabled('analytics')) {
    // Carregar Google Analytics, etc.
  }
}
```

## 📱 Experiência do Usuário

### Primeira Visita
1. Banner aparece automaticamente
2. Usuário pode escolher entre 3 opções:
   - **Aceitar Todos**: Todos os cookies ativos
   - **Apenas Necessários**: Só cookies essenciais
   - **Personalizar**: Modal com controle granular

### Visitas Subsequentes
- Banner não aparece (preferências salvas)
- Botão flutuante disponível para reconfigurar
- Preferências mantidas entre sessões

### Conformidade Legal
- ✅ **LGPD**: Conformidade com regulamentação brasileira
- ✅ **GDPR**: Compatível com regulamentação europeia
- ✅ **Transparência**: Informações claras sobre cada tipo
- ✅ **Controle**: Usuário tem controle total sobre preferências

## 🚀 Benefícios

### Para o Usuário
- **Transparência**: Sabe exatamente quais cookies são usados
- **Controle**: Pode personalizar suas preferências
- **Experiência**: Interface moderna e intuitiva
- **Privacidade**: Conformidade com leis de proteção de dados

### Para o Desenvolvedor
- **Reutilizável**: Componentes modulares
- **Tipado**: TypeScript para segurança
- **Responsivo**: Funciona em todos os dispositivos
- **Manutenível**: Código limpo e bem estruturado

### Para o Negócio
- **Conformidade**: Atende requisitos legais
- **Profissionalismo**: Interface moderna e confiável
- **Conversão**: Não bloqueia a experiência do usuário
- **Analytics**: Permite coleta de dados (com consentimento)

## 🔄 Próximos Passos

1. **Integração com Analytics**: Conectar com Google Analytics
2. **A/B Testing**: Testar diferentes versões do banner
3. **Analytics**: Medir taxa de aceitação de cookies
4. **Personalização**: Temas customizáveis por cliente
5. **Internacionalização**: Suporte a múltiplos idiomas

---

**Desenvolvido com ❤️ para Trezu** 