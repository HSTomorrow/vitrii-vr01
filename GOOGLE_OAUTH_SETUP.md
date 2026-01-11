# Configuração Google OAuth2 para Vitrii

## 🔐 Pré-requisitos

1. **Google Cloud Project** criado
2. **Credenciais OAuth2** geradas (Client ID e Client Secret)
3. **Variáveis de ambiente** configuradas

---

## 📋 Passo 1: Criar Google Cloud Project

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie um novo projeto chamado "Vitrii Marketplace"
3. Aguarde a criação do projeto

---

## 🔑 Passo 2: Habilitar Google+ API

1. No console, vá para **APIs & Services** > **Library**
2. Procure por "Google+ API"
3. Clique em **Enable**

---

## 🎫 Passo 3: Criar Credenciais OAuth2

1. Vá para **APIs & Services** > **Credentials**
2. Clique em **Create Credentials** > **OAuth client ID**
3. Escolha **Web Application**
4. Configure as **Authorized Redirect URIs**:
   ```
   http://localhost:5173/auth/callback
   https://seu-dominio.com/auth/callback
   https://seu-dominio.com/api/oauth/google/callback
   ```
5. Clique em **Create**
6. Você receberá:
   - **Client ID**
   - **Client Secret**

---

## 🔧 Passo 4: Configurar Variáveis de Ambiente

Adicione ao seu `.env`:

```bash
# Google OAuth
GOOGLE_OAUTH_CLIENT_ID=seu_client_id_aqui
GOOGLE_OAUTH_CLIENT_SECRET=seu_client_secret_aqui
GOOGLE_OAUTH_CALLBACK_URL=https://seu-dominio.com/api/oauth/google/callback
```

---

## 🔗 Passo 5: Endpoints Disponíveis

### Autorizar via Google

```
GET /api/oauth/google/authorize
```

### Callback do Google (automático)

```
GET /api/oauth/google/callback?code=...&state=...
```

### Vincular Google a conta existente

```
POST /api/oauth/google/link
Body: {
  "usuarioId": 1,
  "accessToken": "..."
}
```

---

## 💻 Passo 6: Implementar no Frontend

### Exemplo de link para autenticação:

```html
<a href="/api/oauth/google/authorize" class="btn btn-google">
  Login com Google
</a>
```

### Exemplo com JavaScript:

```javascript
const googleLogin = async () => {
  window.location.href = "/api/oauth/google/authorize";
};
```

---

## ✅ Testar Autenticação

1. Clique no botão "Login com Google"
2. Você será redirecionado para Google
3. Após autorizar, será redirecionado de volta
4. Um novo usuário será criado automaticamente ou você fará login

---

## 📝 Notas Importantes

- ⚠️ **Client Secret deve ser SEMPRE confidencial** (armazenado apenas no servidor)
- 🔐 As senhas de usuários OAuth são deixadas vazias (autenticação é feita via Google)
- 📱 Para dispositivos móveis, use OAuth2 com PKCE (implementação futura)
- 🛡️ State é armazenado em cookies seguros (httpOnly) para prevenção de CSRF

---

## 🚀 Próximos Passos

1. Adicionar tabela `oauth_tokens` para armazenar tokens (opcional)
2. Implementar refresh de tokens
3. Suporte para outros provedores (GitHub, Facebook, etc)
4. UI para vincular/desvincular contas sociais no perfil

---

## 🐛 Troubleshooting

### Erro: "Invalid redirect URI"

- Verifique se a URI no .env matches com a configurada no Google Console

### Erro: "Client ID inválido"

- Confirme se GOOGLE_OAUTH_CLIENT_ID está correto no .env

### Erro: "Usuário não encontrado"

- O usuário será criado automaticamente na primeira autenticação

---

## 📞 Suporte

Para dúvidas ou problemas, consulte:

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com)
