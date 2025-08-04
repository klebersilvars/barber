# Correções no Cron Job - Erro gRPC

## Problema Identificado
O cron job estava falhando com erro `DECODER routines::unsupported` devido a problemas de conectividade gRPC com o Firestore.

## Soluções Implementadas

### 1. Configurações Robustas do Firebase
- ✅ Adicionado `httpAgent` com configurações de keep-alive
- ✅ Configurado timeout e retry automático
- ✅ Implementado `experimentalForceLongPolling` para estabilidade

### 2. Sistema de Retry no Cron Job
- ✅ Máximo de 3 tentativas para buscar documentos
- ✅ Delay exponencial entre tentativas (2s, 4s, 6s)
- ✅ Retry para operações de batch
- ✅ Tratamento individual de erros por documento

### 3. Melhor Tratamento de Erros
- ✅ Logs detalhados de cada tentativa
- ✅ Contagem de erros por documento
- ✅ Continuação do processamento mesmo com erros individuais
- ✅ Resposta com estatísticas completas

### 4. Configurações de Rede
- ✅ Keep-alive connections
- ✅ Timeout de 60 segundos
- ✅ Máximo de 10 conexões simultâneas
- ✅ Cache ilimitado para melhor performance

## Como Testar

### 1. Teste Manual
```bash
curl -X GET "https://seu-backend.onrender.com/api/cron/decrementar-dias?token=123456"
```

### 2. Verificar Logs
```bash
# No Render Dashboard > Logs
# Procurar por:
# - "Iniciando decremento automático de dias..."
# - "Decremento concluído: X contas atualizadas"
# - "Erro no cron job de decremento:" (se houver)
```

### 3. Monitoramento
- ✅ Contas processadas
- ✅ Contas decrementadas
- ✅ Erros individuais
- ✅ Timestamp da execução

## Configuração do Cron Job

### No Render (Recomendado)
```bash
# Adicionar no Render Dashboard > Environment Variables
CRON_TOKEN=123456

# Configurar cron job para executar às 00:00
0 0 * * * curl -X GET "https://seu-backend.onrender.com/api/cron/decrementar-dias?token=123456"
```

### Variáveis de Ambiente Necessárias
```bash
FIREBASE_PROJECT_ID=seu-projeto
FIREBASE_PRIVATE_KEY_ID=chave-privada-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@seu-projeto.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=123456789
FIREBASE_CLIENT_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/...
CRON_TOKEN=123456
```

## Status Atual
- ✅ Configurações robustas implementadas
- ✅ Sistema de retry funcionando
- ✅ Tratamento de erros melhorado
- ✅ Logs detalhados para monitoramento
- ✅ Compatibilidade com Node.js 18+

## Próximos Passos
1. Fazer deploy das mudanças
2. Testar o endpoint manualmente
3. Configurar cron job no Render
4. Monitorar logs por alguns dias
5. Ajustar configurações se necessário 