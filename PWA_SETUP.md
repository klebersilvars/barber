# Configuração do PWA - Trezu

## ✅ O que já foi implementado:

1. **Service Worker** (`public/sw.js`)
   - Cache de recursos
   - Estratégia Network First
   - Sincronização em background
   - Notificações push

2. **Manifest** (`public/manifest.json`)
   - Configuração completa do PWA
   - Ícones, cores, orientação
   - Shortcuts para ações rápidas

3. **Página Offline** (`public/offline.html`)
   - Página de fallback quando offline

4. **Registro do SW** (`src/registerSW.ts`)
   - Funções para gerenciar o PWA
   - Verificação de instalação
   - Notificações

5. **Integração no App**
   - Modal de instalação no agendaAdmin
   - Botões para notificações
   - Meta tags no index.html

## 🔧 O que você precisa fazer:

### 1. Criar os Ícones
Você precisa criar ícones PNG nos seguintes tamanhos:
- `public/icon-72x72.png`
- `public/icon-96x96.png`
- `public/icon-128x128.png`
- `public/icon-144x144.png`
- `public/icon-152x152.png`
- `public/icon-192x192.png`
- `public/icon-384x384.png`
- `public/icon-512x512.png`

**Ferramentas recomendadas:**
- https://realfavicongenerator.net/
- https://www.favicon-generator.org/
- https://favicon.io/

### 2. Criar Screenshots (Opcional)
Para melhor experiência na loja de apps:
- `public/screenshot-wide.png` (1280x720)
- `public/screenshot-narrow.png` (750x1334)

### 3. Testar em Produção
O PWA só funciona completamente em HTTPS. Teste em:
- https://seu-dominio.com

### 4. Verificar no Lighthouse
Use o Chrome DevTools > Lighthouse para verificar se o PWA está configurado corretamente.

## 🚀 Como testar:

### Em Desenvolvimento (HTTP):
1. Abra o DevTools
2. Simule um dispositivo móvel
3. O modal PWA aparecerá automaticamente após 2 segundos
4. Use o botão "Testar Modal PWA" no header

### Em Produção (HTTPS):
1. Acesse em um dispositivo móvel real
2. O modal aparecerá automaticamente após 3 segundos
3. Use o botão "Instalar App" no header

## 📱 Funcionalidades do PWA:

- ✅ **Instalação na tela inicial**
- ✅ **Funcionamento offline**
- ✅ **Notificações push**
- ✅ **Sincronização em background**
- ✅ **Cache inteligente**
- ✅ **Atualizações automáticas**

## 🔍 Debug:

Verifique o console do navegador para logs detalhados:
- ✅ Service Worker registrado
- ✅ Manifest carregado
- ✅ PWA instalado
- 🔔 Notificações funcionando

## 📝 Notas:

- O PWA só funciona em HTTPS em produção
- Em desenvolvimento, o modal é simulado para teste
- As notificações precisam de permissão do usuário
- O cache é atualizado automaticamente quando há novas versões 