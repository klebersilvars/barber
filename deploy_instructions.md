# Instruções para Deploy com Cloudinary

## 🔧 **Problema Resolvido:**

O erro `Cannot find package 'cloudinary'` foi causado porque as dependências não estavam no `package.json` do backend.

## ✅ **Solução Aplicada:**

1. **Adicionadas dependências no `backend/package.json`:**
   ```json
   "cloudinary": "^1.41.3",
   "multer": "^1.4.5-lts.1"
   ```

2. **Instaladas dependências localmente**

## 🚀 **Próximos Passos:**

### **1. Faça commit das mudanças:**
```bash
git add .
git commit -m "Add cloudinary and multer dependencies"
git push
```

### **2. Configure as variáveis no Render:**

Adicione estas variáveis no seu projeto do Render (Environment Variables):

```
CLOUDINARY_CLOUD_NAME = [seu-cloud-name]
CLOUDINARY_API_KEY = 424443771445132
CLOUDINARY_API_SECRET = kKhe6-uCB1NEScBo_1HkHPGpteE
```

### **3. Deploy automático:**

O Render fará deploy automático quando você fizer push das mudanças.

## 🔍 **Como verificar se funcionou:**

1. **Acesse os logs do Render** para ver se não há mais erros
2. **Teste o endpoint:** `https://trezu-backend.onrender.com/api/test-decrement`
3. **Teste o upload de logo** na página de configurações

## ⚠️ **Importante:**

- **Você ainda precisa fornecer o Cloud Name** do Cloudinary
- **O Cloud Name** aparece no dashboard do Cloudinary
- **Geralmente é algo como:** `dx123456` ou `seu-nome`

## 📋 **Checklist:**

- ✅ Dependências adicionadas ao package.json
- ✅ Dependências instaladas localmente
- ⏳ Aguardando commit e push
- ⏳ Aguardando configuração das variáveis no Render
- ⏳ Aguardando deploy automático

**Depois de fazer o commit e configurar as variáveis, o erro deve ser resolvido!** 🚀 