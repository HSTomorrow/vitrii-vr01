# GoDaddy SMTP Configuration Guide

## Configuração Atual do Servidor

```
SMTP Server:   smtpout.secureserver.net
Port:          465 (SSL) ou 587 (TLS/STARTTLS)
Authentication: Required
Username:      contato@herestomorrow.com
Password:      [Suas credenciais GoDaddy]
```

## Checklist de Configuração

### ✅ Configuração SMTP no Application
- [x] Host: `smtpout.secureserver.net`
- [x] Port: `465` (SSL)
- [x] User: `contato@herestomorrow.com`
- [x] Authentication: Enabled
- [x] SSL/TLS: Enabled

### ⚠️ Configuração Recomendada no GoDaddy Dashboard

Você deve verificar os seguintes itens no seu painel do GoDaddy:

1. **SMTP Authentication Habilitado**
   - Acesse: GoDaddy Email & Office Dashboard
   - Usuário: contato@herestomorrow.com
   - Verifique se SMTP Authentication está habilitado

2. **Adicionar SPF Record** (IMPORTANTE)
   - Tipo: SPF
   - Valor: `v=spf1 include:secureserver.net -all`
   - Onde adicionar: Configurações de DNS do seu domínio
   - Por que: Melhora a taxa de entrega e evita que seus emails sejam marcados como spam

3. **Verificar Registros DNS** (Opcional mas recomendado)
   - DKIM: Configurar chave DKIM no GoDaddy
   - DMARC: Política DMARC para proteção de email
   - MX Record: Aponta para os servidores de email do GoDaddy

## Testando a Configuração

Você pode testar o envio de emails através da página de teste em `/test-email`:

```
1. Acessar: http://localhost:8080/test-email
2. Clicar em "🔍 Testar Conexão SMTP"
3. Se conectar com sucesso, clicar em "📧 Enviar Email de Teste"
4. Verificar se o email chega em contato@herestomorrow.com (BCC)
```

## Informações de Log

Quando um email é enviado, o sistema imprime:

```
✅ Email de redefinição de senha enviado com sucesso
   - Para: [email do usuário]
   - De: contato@herestomorrow.com
   - BCC: contato@herestomorrow.com
   - Message ID: [ID único do email]
```

## Possíveis Problemas e Soluções

### Problema: "Connection timeout" ou "550 Authentication failed"

**Soluções:**
1. Verificar se SMTP Authentication está habilitado no GoDaddy
2. Confirmar que a senha está correta
3. Tentar porta 587 (TLS) se 465 (SSL) não funcionar
4. Aguardar 15-30 minutos após alterar configurações no GoDaddy

### Problema: Emails chegando na pasta de Spam

**Soluções:**
1. Adicionar SPF record ao DNS (ver acima)
2. Adicionar DKIM record
3. Configurar DMARC policy
4. Verificar se o domínio não está em listas de bloqueio

### Problema: "SMTP port 465 refused connection"

**Soluções:**
1. Verificar se firewall/ISP não está bloqueando porta 465
2. Tentar porta 587 (TLS/STARTTLS) em vez de 465 (SSL)
3. Alterar no `.env`:
   ```
   SMTP_PORT="587"
   SMTP_SECURE="false"  # TLS é negociado via STARTTLS
   ```

## Validação de Emails

O sistema agora valida o formato dos emails antes de enviar. Emails inválidos são rejeitados com erro:

```
❌ Email inválido: [email]
```

## BCC (Cópia Oculta) Automática

Todos os emails enviados incluem uma cópia oculta para:

```
contato@herestomorrow.com
```

Isso permite que você monitore todos os emails enviados pelo sistema.

## Tipos de Emails Enviados

1. **Password Reset** - Link de redefinição de senha (1 hora de validade)
2. **Email Verification** - Link de verificação de email para novos usuários
3. **Welcome Email** - Email de boas-vindas após verificação
4. **QR Code Expired** - Notificação quando QR code de anúncio expira
5. **Test Email** - Email de teste para diagnóstico

## Próximos Passos

1. [ ] Adicionar SPF record ao DNS do seu domínio
2. [ ] Testar conexão SMTP via página `/test-email`
3. [ ] Enviar email de teste para confirmação
4. [ ] Monitorar folder de spam/junk por 24 horas
5. [ ] Se necessário, configurar DKIM e DMARC records

---

**Última atualização:** 2025
**Versão:** 1.0
