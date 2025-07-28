# Configuração do Cronjob para Decremento Diário

## Visão Geral
O sistema precisa decrementar os dias premium diariamente às 00:00. Isso deve ser feito via cronjob no servidor.

## Endpoint Disponível
- **URL**: `POST /api/decrement-premium-days`
- **Função**: Decrementa 1 dia de todos os planos premium ativos
- **Frequência**: Uma vez por dia às 00:00

## Configuração do Cronjob

### 1. No Render (Recomendado)
```bash
# Adicionar no Render Dashboard > Environment Variables
CRONJOB_URL=https://seu-backend.onrender.com/api/decrement-premium-days
```

### 2. Usando cURL (Teste Manual)
```bash
curl -X POST https://seu-backend.onrender.com/api/decrement-premium-days
```

### 3. Usando Cronjob no Linux
```bash
# Editar crontab
crontab -e

# Adicionar linha (executa às 00:00 todos os dias)
0 0 * * * curl -X POST https://seu-backend.onrender.com/api/decrement-premium-days
```

### 4. Usando Cronjob no Windows
```cmd
# Criar arquivo .bat
echo curl -X POST https://seu-backend.onrender.com/api/decrement-premium-days > decrement.bat

# Agendar no Agendador de Tarefas do Windows
# Programar para executar diariamente às 00:00
```

## Lógica do Decremento

### Planos Pagos (Individual/Empresa)
- Decrementa `dias_plano_pago_restante`
- Quando chega a 0: desativa premium e limpa campos
- Para plano "empresa": desativa colaboradores

### Teste Grátis
- Decrementa `dias_restantes_teste_gratis`
- Quando chega a 0: desativa premium e limpa campos

## Teste Manual
```bash
# Verificar dados atuais
curl -X POST https://seu-backend.onrender.com/api/test-decrement
```

## Monitoramento
- Verificar logs do backend para confirmar execução
- Monitorar contas premium no Firestore
- Alertas se o cronjob falhar

## Importante
- O frontend NÃO faz decremento
- Apenas o backend via cronjob
- Executar uma vez por dia às 00:00
- Verificar se está funcionando regularmente 