# Configuração do Firebase Authentication

## Problema Identificado
O domínio `www.trezu.com.br` não está autorizado para operações OAuth no Firebase.

## Solução

### 1. Acessar Firebase Console
1. Vá para [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto
3. Vá para **Authentication** no menu lateral

### 2. Configurar Domínios Autorizados
1. Clique em **Settings** (ícone de engrenagem)
2. Vá para a aba **Authorized domains**
3. Clique em **Add domain**
4. Adicione os seguintes domínios:
   - `www.trezu.com.br`
   - `trezu.com.br`
   - `localhost` (para desenvolvimento)

### 3. Configurar Métodos de Login
1. Na aba **Sign-in method**
2. Verifique se os métodos desejados estão habilitados:
   - Email/Password
   - Google (se necessário)

### 4. Configurar URLs de Redirecionamento
1. Se estiver usando Google Sign-in:
   - Vá para **Settings > General**
   - Role até **Your apps**
   - Clique em **Add app** se necessário
   - Configure as URLs de redirecionamento

## URLs Necessárias
```
https://www.trezu.com.br
https://trezu.com.br
http://localhost:5173 (desenvolvimento)
```

## Verificação
Após configurar, teste o login para verificar se o erro de OAuth foi resolvido.

## Nota Importante
- As mudanças podem levar alguns minutos para propagar
- Limpe o cache do navegador após as mudanças
- Teste em modo incógnito para garantir que não há cache 