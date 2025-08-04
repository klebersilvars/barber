# Diagnóstico do Erro 500 - Upload de Logo

## 🔍 Problema Atual
O CORS está funcionando, mas agora temos um erro 500 no servidor. Vamos diagnosticar o que está causando isso.

## 🧪 Testes para Diagnosticar

### 1. Teste de Configurações
```javascript
// No console do navegador
fetch('https://barber-backend-qlt6.onrender.com/api/test-config')
  .then(response => response.json())
  .then(data => console.log('✅ Configurações:', data))
  .catch(error => console.error('❌ Erro:', error));
```

### 2. Teste CORS (para confirmar que está funcionando)
```javascript
fetch('https://barber-backend-qlt6.onrender.com/api/test-cors')
  .then(response => response.json())
  .then(data => console.log('✅ CORS:', data))
  .catch(error => console.error('❌ Erro:', error));
```

### 3. Teste Upload Simples
```javascript
// Criar arquivo de teste
const file = new File(['test'], 'test.png', { type: 'image/png' });
const formData = new FormData();
formData.append('logo', file);
formData.append('uid', 'test-user');

fetch('https://barber-backend-qlt6.onrender.com/api/upload-logo', {
  method: 'POST',
  body: formData
})
.then(response => {
  console.log('Status:', response.status);
  return response.json();
})
.then(data => console.log('✅ Upload:', data))
.catch(error => console.error('❌ Erro:', error));
```

## 🔍 Possíveis Causas do Erro 500

### 1. Configuração do Cloudinary
- ❌ `CLOUDINARY_CLOUD_NAME` não configurado
- ❌ `CLOUDINARY_API_KEY` não configurado  
- ❌ `CLOUDINARY_API_SECRET` não configurado

### 2. Configuração do Firebase
- ❌ `FIREBASE_PROJECT_ID` não configurado
- ❌ `FIREBASE_CLIENT_EMAIL` não configurado
- ❌ `FIREBASE_PRIVATE_KEY` não configurado

### 3. Problemas de Rede
- ❌ Cloudinary não acessível
- ❌ Firebase não acessível
- ❌ Timeout na requisição

## 📋 Como Verificar

### 1. No Render Dashboard
1. Acesse [Render Dashboard](https://dashboard.render.com/)
2. Vá para seu serviço backend
3. Clique em **Logs**
4. Procure por:
   - `=== INÍCIO DO UPLOAD DE LOGO ===`
   - `🔍 Verificando configuração do Cloudinary...`
   - `❌ Configuração do Cloudinary incompleta`
   - `❌ Erro no upload da logo:`

### 2. Verificar Variáveis de Ambiente
No Render Dashboard > Environment Variables, verifique se estão configuradas:
```
CLOUDINARY_CLOUD_NAME=seu-cloud-name
CLOUDINARY_API_KEY=sua-api-key
CLOUDINARY_API_SECRET=sua-api-secret
FIREBASE_PROJECT_ID=seu-projeto
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@seu-projeto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...
```

## 🚀 Próximos Passos

1. **Execute o teste de configurações** primeiro
2. **Verifique os logs no Render**
3. **Confirme se as variáveis de ambiente estão configuradas**
4. **Me informe os resultados** para ajustar a solução

## 📝 Logs Esperados

Se tudo estiver configurado corretamente, você deve ver:
```
=== INÍCIO DO UPLOAD DE LOGO ===
🔍 Verificando configuração do Cloudinary...
🔄 Convertendo arquivo para base64...
🔄 Fazendo upload para Cloudinary...
✅ Upload para Cloudinary concluído: https://res.cloudinary.com/...
🔍 Verificando configuração do Firestore...
🔄 Salvando URL no Firestore...
✅ URL salva no Firestore com sucesso
=== FIM DO UPLOAD DE LOGO ===
```

Se houver problemas, você verá:
```
❌ Configuração do Cloudinary incompleta
❌ Erro do Cloudinary: 401 Unauthorized
❌ Erro do Firebase: permission-denied
```

Execute os testes e me informe os resultados! 🔍 