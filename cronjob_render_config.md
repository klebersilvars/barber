# Configuração do Cron Job no Render

## Endpoint Criado

O endpoint `/api/cron/decrementar-dias` foi implementado no backend com as seguintes características:

### Funcionalidades:
- ✅ Decrementa automaticamente os dias de planos premium
- ✅ Suporta planos grátis (`dias_restantes_teste_gratis`)
- ✅ Suporta planos pagos (`dias_plano_pago_restante`)
- ✅ Usa batch updates para performance
- ✅ Proteção por token de segurança
- ✅ Logs detalhados para monitoramento

### Segurança:
- Token obrigatório via query parameter ou header Authorization
- Variável de ambiente `CRON_TOKEN` (padrão: '123456')

## Como Configurar no Render

### 1. Configurar Variável de Ambiente

No painel do Render, vá em **Environment** e adicione:

```
CRON_TOKEN=seu_token_secreto_aqui
```

### 2. Configurar Cron Job

No painel do Render, vá em **Cron Jobs** e crie um novo:

#### Configurações:
- **Name**: `Decrementar Dias Premium`
- **Command**: 
```bash
curl -X GET "https://seu-app.onrender.com/api/cron/decrementar-dias?token=seu_token_secreto_aqui"
```
- **Schedule**: `0 0 * * *` (executa todos os dias à meia-noite UTC)
- **Timezone**: `UTC`

### 3. Alternativa com Header Authorization

Se preferir usar header em vez de query parameter:

```bash
curl -X GET "https://seu-app.onrender.com/api/cron/decrementar-dias" \
  -H "Authorization: Bearer seu_token_secreto_aqui"
```

## Testando o Endpoint

### Teste Manual (Desenvolvimento):
```bash
# Via query parameter
curl -X GET "http://localhost:3000/api/cron/decrementar-dias?token=123456"

# Via header
curl -X GET "http://localhost:3000/api/cron/decrementar-dias" \
  -H "Authorization: Bearer 123456"
```

### Resposta Esperada:
```json
{
  "message": "Decremento automático concluído",
  "processed": 5,
  "decrementado": 3,
  "timestamp": "2024-01-15T00:00:00.000Z"
}
```

## Logs do Sistema

O endpoint gera logs detalhados:

```
Iniciando decremento automático de dias...
Conta abc123: Decrementado dias grátis 6 -> 5
Conta def456: Decrementado dias individual 15 -> 14
Conta ghi789: Plano empresa expirou
Decremento concluído: 3 contas atualizadas
```

## Monitoramento

### Verificar se está funcionando:
1. Acesse os logs do Render
2. Verifique se o cron job está executando diariamente
3. Monitore os logs do endpoint para confirmar as atualizações

### Troubleshooting:
- **Erro 401**: Token incorreto
- **Erro 500**: Problema interno do servidor
- **Nenhuma conta processada**: Não há contas premium ativas

## Cronograma de Execução

- **Frequência**: Diária
- **Horário**: 00:00 UTC (meia-noite)
- **Duração**: ~1-5 segundos (dependendo do número de contas)

## Segurança

- ✅ Token obrigatório para acesso
- ✅ Logs de tentativas de acesso não autorizado
- ✅ Validação de dados antes de atualizar
- ✅ Tratamento de erros robusto

## Performance

- ✅ Usa batch updates do Firestore
- ✅ Processa todas as contas em uma única transação
- ✅ Logs otimizados para não impactar performance
- ✅ Timeout configurado para evitar travamentos

## Integração com Frontend

O frontend (`dashboardUser.tsx`) continuará funcionando normalmente:
- ✅ Exibe dias restantes corretamente
- ✅ Atualiza automaticamente quando os dados mudam
- ✅ Mantém a lógica de roteamento baseada no tipo de plano 