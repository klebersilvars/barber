# Configuração do Sistema WhatsApp

## Visão Geral

O sistema de WhatsApp foi implementado com uma interface completa que permite:
1. **Gerar QR Code** para conectar um dispositivo WhatsApp
2. **Enviar mensagens** via WhatsApp após a conexão
3. **Desconectar dispositivo** quando necessário

## Configuração da API Key

### Backend

1. Adicione a variável de ambiente `WHATSAPP_API_KEY` no seu arquivo de configuração (`.env` ou `keys.env`):
```env
WHATSAPP_API_KEY=Lyu6H6ADzWn3KqqQofyhFlmT96UBs3
```

**Nota**: A API key já está configurada como fallback no código, mas é recomendado usar a variável de ambiente para maior segurança.

2. A API key será usada automaticamente pelos endpoints:
   - `/api/whatsapp/generate-qr` - Gerar QR Code
   - `/api/whatsapp/send-message` - Enviar mensagem
   - `/api/whatsapp/disconnect` - Desconectar dispositivo
   - `/api/whatsapp/api-key` - Obter API key (para o frontend)

### Frontend

O frontend automaticamente busca a API key do backend através do endpoint `/api/whatsapp/api-key`, então não é necessário configurar nada no frontend.

## Endpoints Implementados

### 1. Gerar QR Code
- **URL**: `POST /api/whatsapp/generate-qr`
- **Body**: 
  ```json
  {
    "device": "5521987654321",
    "api_key": "sua_api_key"
  }
  ```
- **Resposta**:
  ```json
  {
    "success": true,
    "qr_code_url": "https://...",
    "device": "5521987654321",
    "message": "QR Code gerado com sucesso"
  }
  ```

### 2. Enviar Mensagem
- **URL**: `POST /api/whatsapp/send-message`
- **Body**:
  ```json
  {
    "api_key": "sua_api_key",
    "sender": "5521987654321",
    "number": "5521987654322",
    "message": "Sua mensagem aqui",
    "footer": "Rodapé opcional"
  }
  ```

### 3. Desconectar Dispositivo
- **URL**: `POST /api/whatsapp/disconnect`
- **Body**:
  ```json
  {
    "api_key": "sua_api_key",
    "sender": "5521987654321"
  }
  ```

## Fluxo de Uso

1. **Acesso**: O usuário acessa a página WhatsApp Atendente
2. **Verificação**: Sistema verifica permissões de plano (Gratuito, Ouro ou Diamante)
3. **Conexão**: 
   - Usuário digita número do telefone
   - Clica em "Gerar QR Code"
   - Sistema faz requisição para `https://belkit.pro/generate-qr`
   - QR Code é exibido na tela
   - Usuário escaneia com WhatsApp
   - Clica em "Já Escaneei o QR Code"
4. **Envio de Mensagens**:
   - Interface muda para formulário de envio
   - Usuário preenche número do destinatário e mensagem
   - Clica em "Enviar Mensagem"
   - Sistema faz requisição para `https://belkit.pro/send-message`
5. **Desconexão**:
   - Usuário clica em "Desconectar"
   - Sistema faz requisição para `https://belkit.pro/logout-device`

## Segurança

- A API key é armazenada apenas no backend
- O frontend não tem acesso direto à API key
- Todas as requisições passam pelo backend para evitar CORS
- Logs detalhados para debugging

## Tratamento de Erros

- Validação de campos obrigatórios
- Feedback visual com alertas
- Estados de loading durante operações
- Mensagens de erro específicas
- Fallbacks para problemas de conexão

## Dependências

- **Backend**: `axios` para requisições HTTP
- **Frontend**: `@chakra-ui/react` para interface
- **API Externa**: `https://belkit.pro` (WhatsApp API)

## Teste

Para testar o sistema:

1. Configure a `WHATSAPP_API_KEY` no backend
2. Inicie o servidor backend
3. Acesse a página WhatsApp Atendente
4. Siga o fluxo de conexão e envio de mensagens

## Troubleshooting

- **Erro de API Key**: Verifique se a variável `WHATSAPP_API_KEY` está configurada
- **Erro de CORS**: Todas as requisições passam pelo backend, não deve haver problemas
- **QR Code não aparece**: Verifique os logs do backend para erros da API externa
- **Mensagem não envia**: Verifique se o dispositivo está conectado e a API key é válida
