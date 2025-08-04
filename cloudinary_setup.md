# Configuração do Cloudinary para Upload de Logo

## 📋 **Variáveis de Ambiente Necessárias**

Adicione estas variáveis no Render (Environment Variables):

### **1. CLOUDINARY_CLOUD_NAME**
```
Seu cloud name do Cloudinary
```

### **2. CLOUDINARY_API_KEY**
```
Sua API Key do Cloudinary
```

### **3. CLOUDINARY_API_SECRET**
```
Seu API Secret do Cloudinary
```

## 🔧 **Como obter as credenciais do Cloudinary:**

1. **Acesse [cloudinary.com](https://cloudinary.com)**
2. **Crie uma conta gratuita**
3. **Vá para Dashboard**
4. **Copie as credenciais:**
   - Cloud Name
   - API Key
   - API Secret

## 📁 **Estrutura de Pastas no Cloudinary:**

O sistema criará automaticamente:
- **Pasta:** `barber-logos/`
- **Nome do arquivo:** `logo_{uid}` (onde `uid` é o ID do usuário)

## ⚙️ **Configurações do Upload:**

- **Tamanho máximo:** 2MB
- **Formatos aceitos:** JPG, PNG, SVG
- **Transformações automáticas:**
  - Redimensionamento para 300x300px
  - Otimização automática de qualidade
  - Sobrescreve arquivos existentes

## 🔄 **Funcionalidades Implementadas:**

### **Frontend:**
- ✅ Upload de imagem via explorador de arquivos
- ✅ Preview em tempo real
- ✅ Validação de tipo e tamanho
- ✅ Loading state durante upload
- ✅ Botão para remover logo
- ✅ Carregamento da logo salva

### **Backend:**
- ✅ Endpoint `/api/upload-logo`
- ✅ Upload para Cloudinary
- ✅ Salvar URL no Firestore (`logo_url`)
- ✅ Validação de arquivos
- ✅ Tratamento de erros

## 🚀 **Como usar:**

1. **Configure as variáveis no Render**
2. **Faça deploy do backend**
3. **Acesse a página de configurações**
4. **Clique em "Escolher Imagem"**
5. **Selecione uma imagem**
6. **A logo será enviada automaticamente**

## 📊 **Campos no Firestore:**

```javascript
{
  logo_url: "https://res.cloudinary.com/seu-cloud/image/upload/v123/barber-logos/logo_uid.jpg"
}
```

## 🔒 **Segurança:**

- ✅ Validação de tipo de arquivo
- ✅ Limite de tamanho (2MB)
- ✅ Autenticação via UID
- ✅ Transformações seguras no Cloudinary 