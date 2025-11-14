# 🔐 Configuração de Variáveis de Ambiente

Este projeto usa variáveis de ambiente para armazenar credenciais sensíveis. **NUNCA** commite o arquivo `.env` no Git!

## 📋 Passos para Configurar

### 1. Criar o arquivo `.env`

Na pasta `backend`, crie um arquivo chamado `.env` (sem extensão).

### 2. Copiar o template

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

### 3. Preencher as credenciais

Abra o arquivo `.env` e preencha todas as variáveis com suas credenciais reais:

```env
# Firebase
FIREBASE_PROJECT_ID=seu_project_id
FIREBASE_PRIVATE_KEY="sua_chave_privada_completa"
# ... etc
```

## ⚠️ IMPORTANTE

- ✅ O arquivo `.env` está no `.gitignore` e **NÃO será commitado**
- ✅ O arquivo `.env.example` pode ser commitado (é apenas um template)
- ❌ **NUNCA** commite o arquivo `.env` com credenciais reais
- ❌ **NUNCA** compartilhe o arquivo `.env` publicamente

## 🔑 Variáveis Obrigatórias

### Firebase
- `FIREBASE_PROJECT_ID`
- `FIREBASE_PRIVATE_KEY` (chave privada completa com `\n` para quebras de linha)
- `FIREBASE_PRIVATE_KEY_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_CLIENT_ID`
- `FIREBASE_CLIENT_X509_CERT_URL`

### Asaas
- `ASAAS_API_KEY` (sua chave de API do Asaas)

### WhatsApp (Belkit)
- `WHATSAPP_API_KEY`

### Cloudinary
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

## 🚀 Deploy

Para deploy em produção (ex: Render.com, Heroku, etc.), configure as variáveis de ambiente diretamente no painel do serviço de hospedagem.

**NÃO** faça upload do arquivo `.env` para o servidor. Configure as variáveis através da interface do serviço de hospedagem.

