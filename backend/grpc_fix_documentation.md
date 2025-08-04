# 🔧 Correção do Erro gRPC no Cron Job

## 🚨 Problema Identificado
O cron job de decrementação estava falhando com erro gRPC:
```
2 UNKNOWN: Getting metadata from plugin failed with error: error:1E08010C:DECODER routines::unsupported
```

## 🛠️ Soluções Implementadas

### **1. Configuração Firebase Mais Robusta**
- ✅ Aumentado `timeoutSeconds` para 180s (3 minutos)
- ✅ Aumentado `maxRetries` para 10 tentativas
- ✅ Configurações de retry mais agressivas
- ✅ Configurações de rede específicas para gRPC
- ✅ Pool de conexões otimizado

### **2. Abordagem de Processamento em Lotes**
- ✅ Processamento de 10 documentos por vez
- ✅ Operações individuais em vez de batch operations
- ✅ Retry individual para cada documento
- ✅ Pausas entre lotes para evitar sobrecarga

### **3. Tratamento de Erros Melhorado**
- ✅ Detecção específica de erros gRPC
- ✅ Pausas maiores quando erro gRPC é detectado
- ✅ Continuação do processamento mesmo com erros
- ✅ Logs detalhados para debug

### **4. Endpoint de Teste**
- ✅ `/api/test-firestore` para verificar conectividade
- ✅ Testes de leitura e escrita
- ✅ Validação da configuração Firebase

## 📋 Configurações Firebase Atualizadas

### **firebase-config.js**
```javascript
// Configurações de rede mais robustas
httpAgent: {
  keepAlive: true,
  keepAliveMsecs: 30000,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 120000,
  freeSocketTimeout: 60000,
  family: 4, // Forçar IPv4
  rejectUnauthorized: false
}

// Configurações Firestore
db.settings({
  timeoutSeconds: 180,
  maxRetries: 10,
  retryOptions: {
    initialRetryDelayMillis: 500,
    maxRetryDelayMillis: 30000,
    retryDelayMultiplier: 1.5,
    maxRetries: 10
  },
  preferRest: false,
  requestTimeout: 120000,
  poolSize: 10
});
```

## 🔄 Nova Abordagem do Cron Job

### **Processamento em Lotes**
```javascript
const batchSize = 10; // Processar 10 documentos por vez
let lastDoc = null;

while (true) {
  // Buscar lote de documentos
  let query = db.collection('contas').where('premium', '==', true).limit(batchSize);
  
  if (lastDoc) {
    query = query.startAfter(lastDoc);
  }
  
  const snapshot = await query.get();
  
  if (snapshot.empty) {
    break;
  }
  
  // Processar cada documento individualmente
  for (const doc of snapshot.docs) {
    // Lógica de decrementação
    // Retry individual para cada documento
  }
  
  // Pausa entre lotes
  await new Promise(resolve => setTimeout(resolve, 500));
}
```

### **Retry Individual**
```javascript
// Usar updateDoc com retry individual
let updateRetryCount = 0;
const maxUpdateRetries = 3;

while (updateRetryCount < maxUpdateRetries) {
  try {
    await doc.ref.update(updates);
    break;
  } catch (updateError) {
    updateRetryCount++;
    
    if (updateRetryCount >= maxUpdateRetries) {
      console.error(`Falha ao atualizar ${doc.id} após ${maxUpdateRetries} tentativas`);
      errorCount++;
    } else {
      await new Promise(resolve => setTimeout(resolve, 1000 * updateRetryCount));
    }
  }
}
```

## 🧪 Como Testar

### **1. Teste de Conectividade**
```bash
curl https://barber-backend-qlt6.onrender.com/api/test-firestore
```

### **2. Teste do Cron Job**
```bash
curl "https://barber-backend-qlt6.onrender.com/api/cron/decrementar-dias?token=123456"
```

### **3. Verificar Logs**
- Monitorar logs do Render para erros gRPC
- Verificar se o processamento está funcionando
- Confirmar que documentos estão sendo atualizados

## 📊 Melhorias Esperadas

### **Antes:**
- ❌ Erro gRPC constante
- ❌ Falha após 3 tentativas
- ❌ Processamento em lote único
- ❌ Timeout de 60s

### **Depois:**
- ✅ Processamento em lotes pequenos
- ✅ Retry individual por documento
- ✅ Timeout de 180s
- ✅ Detecção específica de erros gRPC
- ✅ Continuação mesmo com erros

## 🔍 Monitoramento

### **Logs de Sucesso:**
```
Iniciando decremento automático de dias...
Documento fKS6MwoQGQYSFIUiwNOqmQkx4iw2 atualizado com sucesso
Decrementado dias grátis 5 -> 4
Resposta do cron job: { processed: 10, decremented: 3, errors: 0 }
```

### **Logs de Erro (Esperados):**
```
Erro gRPC detectado, aguardando 5 segundos antes de tentar novamente...
Tentativa 2 de atualizar fKS6MwoQGQYSFIUiwNOqmQkx4iw2 falhou: 2 UNKNOWN
```

## 🚀 Próximos Passos

1. **Deploy das alterações** no Render
2. **Monitorar logs** por 24-48 horas
3. **Verificar se erros gRPC diminuíram**
4. **Ajustar configurações** se necessário
5. **Remover logs de debug** após estabilização

A nova abordagem deve resolver o problema gRPC e tornar o cron job mais estável! 🎯 