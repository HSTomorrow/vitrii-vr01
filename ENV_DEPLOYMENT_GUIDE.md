# Guia de Variáveis de Ambiente para Deployment

## Visão Geral

Este guia explica como configurar as variáveis de ambiente para diferentes ambientes (desenvolvimento, staging, produção).

## Ambientes Suportados

### 1. **Desenvolvimento Local**
- `NODE_ENV=development`
- `APP_URL=http://localhost:8080`
- API endpoints usam URLs relativas `/api/...`

### 2. **Fly.io (Produção)**
- `NODE_ENV=production`
- `APP_URL=https://your-app-name.fly.dev`
- Todos os outros serviços apontam para o domínio de produção

## Variáveis de Ambiente Essenciais

### URLs da Aplicação

```env
# Para desenvolvimento
APP_URL=http://localhost:8080
API_BASE_URL=http://localhost:8080

# Para produção em fly.dev
APP_URL=https://seu-app-nome.fly.dev
API_BASE_URL=https://seu-app-nome.fly.dev
```

**Onde é usado:**
- `APP_URL`: Links de reset de senha, verificação de email, email de boas-vindas
- `API_BASE_URL`: Configuração do frontend (atualmente não usado, pois usa URLs relativas)

### Banco de Dados

```env
DATABASE_URL=postgresql://user:password@host:port/database
```

**Importante:** Obter do Supabase em `Project Settings → Database → Connection string`

### Email (GoDaddy SMTP)

```env
SMTP_HOST=smtpout.secureserver.net
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=seu-email@seu-dominio.com.br
SMTP_PASS=sua-senha-godaddy
MAIL_FROM=seu-email@seu-dominio.com.br
```

### Pagamentos (Mercado Pago)

```env
MERCADO_PAGO_ACCESS_TOKEN=seu-token-aqui
MERCADO_PAGO_PUBLIC_KEY=sua-chave-publica-aqui
PAYMENT_PROVIDER=mercado-pago
PAYMENT_WEBHOOK_SECRET=seu-webhook-secret
```

### Configurações da Aplicação

```env
FREE_ADS_LIMIT=3
AD_COST=9.90
```

## Como Configurar no Fly.io

### Opção 1: Usando CLI do Fly.io

```bash
# Login no Fly.io
flyctl auth login

# Definir variáveis de ambiente
flyctl secrets set APP_URL=https://seu-app.fly.dev
flyctl secrets set DATABASE_URL=postgresql://...
flyctl secrets set SMTP_HOST=smtpout.secureserver.net
flyctl secrets set SMTP_PORT=465
flyctl secrets set SMTP_SECURE=true
flyctl secrets set SMTP_USER=seu-email@seu-dominio.com.br
flyctl secrets set SMTP_PASS=sua-senha
flyctl secrets set MAIL_FROM=seu-email@seu-dominio.com.br
# ... etc
```

### Opção 2: Usando Dashboard do Fly.io

1. Acesse https://fly.io/dashboard
2. Selecione seu app
3. Vá para `Settings → Secrets`
4. Clique em `Add secret` para cada variável

## Endpoints que Usam URLs

### Email Links

Todos os links de email são construídos usando `process.env.APP_URL`:

- **Reset de Senha**: `{APP_URL}/reset-senha?token={token}&email={email}`
- **Verificação de Email**: `{APP_URL}/verificar-email?token={token}&email={email}`

### Cliente (Frontend)

O cliente usa URLs **relativas** automaticamente:
- `/api/auth/signin`
- `/api/auth/signup`
- `/api/favoritos`
- etc.

Isso significa que não precisam de reconfiguração - apontam para o mesmo host.

## Checklist de Deployment

- [ ] `NODE_ENV` configurado como `production`
- [ ] `APP_URL` atualizado para o domínio de produção
- [ ] `DATABASE_URL` apontando para banco de dados de produção
- [ ] Credenciais SMTP configuradas corretamente
- [ ] Tokens Mercado Pago configurados (se usar pagamentos)
- [ ] SPF record no DNS: `v=spf1 include:secureserver.net -all`
- [ ] Testar envio de email com `/api/diagnostic-smtp`
- [ ] Testar reset de senha e verificação de email

## Troubleshooting

### Emails com localhost nos links

**Problema:** Os links de email contêm `localhost` ou IP interno

**Solução:** Verificar se `APP_URL` está configurado corretamente
```bash
flyctl config show  # Verifica variáveis de ambiente
```

### Falha ao enviar email

**Problema:** Erro de conexão SMTP ou autenticação

**Solução:**
1. Verificar credenciais SMTP
2. Testar conexão: `GET /api/diagnostic-smtp`
3. Verificar se SMTP Authentication está habilitado na conta GoDaddy
4. Adicionar SPF record ao DNS

### CORS ou erro de API

**Problema:** Frontend não consegue acessar API

**Solução:**
- URLs relativas funcionam automaticamente
- Verificar se servidor está respondendo em `GET /api/ping`

## Variáveis Opcionais

```env
# Para debug
NODE_ENV=development

# Customização
PING_MESSAGE=ping
```

## Referências

- [Documentação Fly.io - Secrets](https://fly.io/docs/reference/secrets/)
- [Documentação Supabase - Database](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [GoDaddy SMTP Settings](https://www.godaddy.com/help/send-an-smtp-email-4694)

---

**Última atualização:** Fevereiro 2026
**Versão:** 1.0
