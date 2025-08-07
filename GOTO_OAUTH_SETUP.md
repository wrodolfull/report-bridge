# Configuração OAuth GoTo

## Visão Geral

Este documento explica como configurar a integração OAuth com o GoTo para o Report Bridge.

## Pré-requisitos

1. Conta no GoTo Developer Portal
2. Aplicação registrada no GoTo
3. Credenciais OAuth (Client ID e Client Secret)

## Configuração no GoTo Developer Portal

### 1. Criar Aplicação

1. Acesse o [GoTo Developer Portal](https://developer.goto.com/)
2. Faça login com sua conta GoTo
3. Crie uma nova aplicação
4. Configure as seguintes informações:
   - **Nome da Aplicação**: Report Bridge
   - **Descrição**: Sistema de relatórios integrado com GoTo
   - **URL de Redirecionamento**: `http://localhost:3001/api/auth/goto/callback`

### 2. Obter Credenciais

Após criar a aplicação, você receberá:
- **Client ID**: Identificador único da aplicação
- **Client Secret**: Chave secreta para autenticação

## Configuração no Report Bridge

### 1. Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```env
# GoTo OAuth Configuration
GOTO_CLIENT_ID=seu_client_id_aqui
GOTO_CLIENT_SECRET=seu_client_secret_aqui
GOTO_REDIRECT_URI=http://localhost:3001/api/auth/goto/callback
```

### 2. URLs de Produção

Para produção, atualize a URL de redirecionamento:

```env
GOTO_REDIRECT_URI=https://seu-dominio.com/api/auth/goto/callback
```

## Fluxo OAuth

### 1. Início da Conexão

1. Usuário clica no botão "Conectar com GoTo" no header
2. Sistema gera URL de autorização
3. Nova janela abre com a página de login do GoTo

### 2. Autorização

1. Usuário faz login no GoTo
2. GoTo solicita permissões para a aplicação
3. Usuário autoriza o acesso

### 3. Callback

1. GoTo redireciona para `/api/auth/goto/callback`
2. Sistema troca código por token de acesso
3. Tokens são armazenados (implementar conforme necessário)
4. Usuário é redirecionado para o dashboard

## Rotas Implementadas

### GET `/api/auth/goto/oauth`
- Gera URL de autorização OAuth
- Requer autenticação

### GET `/api/auth/goto/callback`
- Callback do OAuth
- Processa código de autorização
- Troca código por tokens

### GET `/api/auth/goto/status`
- Verifica status da conexão
- Retorna se está conectado/configurado

### POST `/api/auth/goto/connect`
- Inicia fluxo OAuth
- Retorna URL de autorização

### POST `/api/auth/goto/disconnect`
- Desconecta do GoTo
- Revoga tokens (implementar)

## Segurança

### State Parameter

O sistema gera um parâmetro `state` para prevenir ataques CSRF:

```javascript
const state = Math.random().toString(36).substring(2, 15);
```

### Verificação de State

Implemente a verificação do state no callback:

```javascript
// Armazenar state na sessão
req.session.gotoState = state;

// Verificar no callback
if (state !== req.session.gotoState) {
  return res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=invalid_state`);
}
```

## Armazenamento de Tokens

### Opções de Implementação

1. **Sessão**: Armazenar tokens na sessão do usuário
2. **Banco de Dados**: Salvar tokens no Supabase
3. **Cache**: Usar Redis ou similar
4. **Criptografia**: Criptografar tokens antes de armazenar

### Exemplo com Supabase

```javascript
// Salvar tokens
const { data, error } = await supabase
  .from('user_tokens')
  .upsert({
    user_id: req.user.id,
    provider: 'goto',
    access_token: encryptedToken,
    refresh_token: encryptedRefreshToken,
    expires_at: new Date(Date.now() + tokenData.expires_in * 1000)
  });
```

## Tratamento de Erros

### Erros Comuns

1. **Configuração não encontrada**: Verificar variáveis de ambiente
2. **Código inválido**: Verificar redirect URI
3. **State inválido**: Implementar verificação de state
4. **Token expirado**: Implementar refresh token

### Redirecionamentos de Erro

```javascript
// Sucesso
res.redirect(`${process.env.FRONTEND_URL}/dashboard?success=goto_connected`);

// Erros
res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=oauth_failed`);
res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=no_code`);
res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=token_exchange_failed`);
```

## Testes

### Ambiente de Desenvolvimento

1. Configure as variáveis de ambiente
2. Inicie o servidor
3. Clique em "Conectar com GoTo"
4. Complete o fluxo OAuth
5. Verifique se o status muda para "Conectado"

### Debug

Habilite logs detalhados:

```javascript
console.log('Tokens GoTo obtidos:', {
  access_token: tokenData.access_token ? '***' : 'undefined',
  refresh_token: tokenData.refresh_token ? '***' : 'undefined',
  expires_in: tokenData.expires_in
});
```

## Próximos Passos

1. Implementar armazenamento seguro de tokens
2. Adicionar refresh token automático
3. Implementar revogação de tokens
4. Adicionar logs de auditoria
5. Implementar rate limiting
6. Adicionar testes automatizados

## Suporte

Para dúvidas sobre a integração OAuth do GoTo:

- [Documentação GoTo Developer](https://developer.goto.com/)
- [OAuth 2.0 RFC](https://tools.ietf.org/html/rfc6749)
- [OpenID Connect](https://openid.net/connect/)
