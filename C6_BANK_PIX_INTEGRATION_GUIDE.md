# Guia de Integração PIX - Banco C6

## 1. Visão Geral

O Banco C6 oferece uma **API PIX** completa para receber pagamentos via QR Code dinâmico. Esta documentação detalha como integrar o sistema de recebimento de pagamentos de anúncios com o C6 Bank.

**Status da Integração C6 com PIX Padrão:**
- C6 oferece API de PIX, mas com APIs **não padrão** (não segue exatamente o padrão BACEN)
- Suporte a: PIX dinâmico, PIX estático, cobrança com vencimento
- Webhooks disponíveis para notificações de pagamento

---

## 2. Pré-requisitos

### 2.1 Conta no C6 Bank
1. Abrir conta PJ no C6 Bank (https://www.c6bank.com.br)
2. Sua empresa deve estar registrada como CNPJ ativo
3. Realizar verificação de identidade

### 2.2 Acessar Portal de Desenvolvedores
1. Ir para: https://developers.c6bank.com.br/
2. Registrar a aplicação
3. Solicitar acesso ao ambiente **Sandbox** (testes) primeiro
4. Após validação, solicitar ambiente **Produção**

---

## 3. Gerar Credenciais de API

### 3.1 Passos para Gerar API Key no C6 Bank

1. **Acessar Web Banking:**
   - Faça login no Web Banking do C6 (https://app.c6bank.com.br)
   - Navegue até o menu financeiro

2. **Gerar Chave de API:**
   - Clique nos **três pontinhos** (⋯) no menu
   - Selecione "Configurações" ou "Integrações"
   - Escolha "API - PIX"
   - Clique em "Criar nova chave"

3. **Configurar Permissões:**
   - Em "Descrição da chave": coloque um nome identificador (ex: "Vitrii Pagamentos")
   - Em "Permissões da chave": selecione as permissões relacionadas a PIX
   - Para recebimentos PIX, você precisa de:
     - **Pix.Receber** (criar cobranças/QR codes)
     - **Pix.Consultar** (verificar status dos pagamentos)
     - **Webhooks.Registrar** (receber notificações)

4. **Salvar Credenciais:**
   - Copie a **API Key** gerada
   - Copie o **Client ID** (se fornecido)
   - Guarde em local seguro (não compartilhe publicamente)

### 3.2 Configurar Webhooks

1. No portal de desenvolvedores (developers.c6bank.com.br):
   - Registre a URL webhook: `https://seudominio.com/api/webhooks/pagamentos`
   - Ative notificações para eventos: `pix.pagamento.recebido`
   - Copie o **Webhook Secret** para validar assinaturas

---

## 4. Endpoints da API C6 PIX

### 4.1 Criar Cobrança PIX Dinâmica

**Endpoint:** `POST https://api.c6bank.com.br/v1/pix/cobrancas`

**Headers:**
```
Authorization: Bearer {API_KEY}
Content-Type: application/json
```

**Body (Requisição):**
```json
{
  "valor": 9.90,
  "descricao": "Anúncio - Produto XYZ",
  "devedor": {
    "cpf": "12345678900",
    "nome": "João Silva"
  },
  "vencimento": {
    "data": "2025-02-20",
    "multa": 2.0,
    "juros": 1.0
  },
  "identificacao": "ANO_000061"
}
```

**Resposta (200 OK):**
```json
{
  "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "txid": "12345678901234567890123456789012",
  "pixCopiaECola": "00020126580014br.gov.bcb.brcode...",
  "qrCode": "data:image/png;base64,iVBORw0KGgo...",
  "urlQrCode": "https://api.c6bank.com.br/qr/...",
  "status": "pendente",
  "dataCriacao": "2025-02-13T10:30:00Z"
}
```

### 4.2 Consultar Status de Cobrança

**Endpoint:** `GET https://api.c6bank.com.br/v1/pix/cobrancas/{id}`

**Headers:**
```
Authorization: Bearer {API_KEY}
```

**Resposta (200 OK):**
```json
{
  "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "status": "pago",
  "dataPagamento": "2025-02-13T11:00:00Z",
  "valorPago": 9.90,
  "pixRecebido": {
    "e2eid": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "cpf": "98765432100",
    "nome": "Maria Santos"
  }
}
```

**Possíveis Status:**
- `pendente` - Aguardando pagamento
- `pago` - Pagamento recebido
- `cancelado` - Cobrança cancelada
- `expirado` - Prazo de vencimento expirado

### 4.3 Cancelar Cobrança

**Endpoint:** `PATCH https://api.c6bank.com.br/v1/pix/cobrancas/{id}`

**Headers:**
```
Authorization: Bearer {API_KEY}
Content-Type: application/json
```

**Body:**
```json
{
  "status": "cancelado"
}
```

---

## 5. Webhook - Receber Notificações

### 5.1 Configuração

O C6 Bank enviará POST para sua URL webhook quando um pagamento for recebido.

**Headers que C6 envia:**
```
X-Webhook-Signature: {HMAC_SHA256}
Content-Type: application/json
```

**Body (Exemplo):**
```json
{
  "evento": "pix.pagamento.recebido",
  "timestamp": "2025-02-13T11:00:00Z",
  "dados": {
    "cobrancaId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "txid": "12345678901234567890123456789012",
    "valor": 9.90,
    "status": "pago",
    "dataPagamento": "2025-02-13T11:00:00Z",
    "pagador": {
      "cpf": "98765432100",
      "nome": "Maria Santos"
    }
  }
}
```

### 5.2 Validação de Assinatura

No servidor (Node.js):
```typescript
import crypto from 'crypto';

function validarAssinatura(
  payload: string,
  signature: string,
  webhookSecret: string
): boolean {
  const hash = crypto
    .createHmac('sha256', webhookSecret)
    .update(payload)
    .digest('hex');
  
  return hash === signature;
}
```

---

## 6. Implementação no Projeto Vitrii

### 6.1 Variáveis de Ambiente

Adicionar ao `.env`:
```env
# C6 Bank PIX Integration
C6_API_KEY="sua_api_key_aqui"
C6_API_BASE_URL="https://api.c6bank.com.br"
C6_WEBHOOK_SECRET="seu_webhook_secret_aqui"
C6_WEBHOOK_URL="https://seudominio.com/api/webhooks/c6-pix"
```

### 6.2 Atualizar Prisma Schema

Já existe tabela `pagamentos` no schema. Confirmar que possui os campos:

```prisma
model pagamento {
  id              String   @id @default(cuid())
  anuncioId       Int      @unique
  anuncio         anuncio  @relation(fields: [anuncioId], references: [id])
  
  valor           Decimal  @db.Decimal(10, 2)
  status          String   @default("pendente") // pendente, pago, cancelado, expirado
  tipo            String   @default("pix") // tipo de pagamento
  
  // C6 Bank specific
  provedor        String   @default("c6bank")
  idExterno       String?  // ID da cobrança no C6
  pixCopiaECola   String?  @db.Text // Chave PIX para copiar e colar
  qrCode          String?  @db.Text // QR Code em base64 ou URL
  pixId           String?  // Identificação interna do PIX
  
  // Vencimento
  dataExpiracao   DateTime?
  dataPagamento   DateTime?
  
  // Controle
  erroMsg         String?
  criadoEm        DateTime @default(now())
  atualizadoEm    DateTime @updatedAt

  @@map("pagamentos")
}
```

### 6.3 Implementar Serviço C6 PIX

Criar arquivo: `server/lib/c6pixService.ts`

```typescript
import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';

interface CobrancaDTO {
  valor: number;
  descricao: string;
  cpf?: string;
  nome?: string;
  identificacao: string; // ID do anúncio
}

interface CobrancaResponse {
  id: string;
  txid: string;
  pixCopiaECola: string;
  qrCode: string;
  status: string;
}

export class C6PIXService {
  private client: AxiosInstance;
  private webhookSecret: string;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.C6_API_BASE_URL,
      headers: {
        Authorization: `Bearer ${process.env.C6_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.webhookSecret = process.env.C6_WEBHOOK_SECRET || '';
  }

  /**
   * Criar cobrança PIX dinâmica
   */
  async criarCobranca(dados: CobrancaDTO): Promise<CobrancaResponse> {
    try {
      const response = await this.client.post('/v1/pix/cobrancas', {
        valor: dados.valor,
        descricao: dados.descricao,
        devedor: dados.cpf ? {
          cpf: dados.cpf.replace(/\D/g, ''),
          nome: dados.nome || 'Cliente',
        } : undefined,
        identificacao: dados.identificacao,
      });

      return {
        id: response.data.id,
        txid: response.data.txid,
        pixCopiaECola: response.data.pixCopiaECola,
        qrCode: response.data.qrCode || response.data.urlQrCode,
        status: response.data.status,
      };
    } catch (error) {
      console.error('Erro ao criar cobrança C6:', error);
      throw new Error('Falha ao gerar QR Code PIX');
    }
  }

  /**
   * Consultar status de cobrança
   */
  async consultarCobranca(cobrancaId: string) {
    try {
      const response = await this.client.get(`/v1/pix/cobrancas/${cobrancaId}`);
      return {
        status: response.data.status,
        dataPagamento: response.data.dataPagamento,
        valorPago: response.data.valorPago,
        pagador: response.data.pixRecebido,
      };
    } catch (error) {
      console.error('Erro ao consultar cobrança C6:', error);
      throw new Error('Falha ao consultar status do pagamento');
    }
  }

  /**
   * Cancelar cobrança
   */
  async cancelarCobranca(cobrancaId: string) {
    try {
      await this.client.patch(`/v1/pix/cobrancas/${cobrancaId}`, {
        status: 'cancelado',
      });
      return { sucesso: true };
    } catch (error) {
      console.error('Erro ao cancelar cobrança C6:', error);
      throw new Error('Falha ao cancelar pagamento');
    }
  }

  /**
   * Validar assinatura do webhook
   */
  validarAssinatura(payload: string, signature: string): boolean {
    const hash = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(hash),
      Buffer.from(signature)
    );
  }
}

export const c6PixService = new C6PIXService();
```

### 6.4 Atualizar Rota de Pagamentos

Modificar: `server/routes/pagamentos.ts`

```typescript
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { c6PixService } from '@/lib/c6pixService';
import { toast } from 'sonner';

const router = Router();

// POST /api/pagamentos - Criar novo pagamento
router.post('/', async (req, res) => {
  try {
    const { anuncioId, valor } = req.body;

    // Validar anúncio existe
    const anuncio = await prisma.anuncio.findUnique({
      where: { id: anuncioId },
    });

    if (!anuncio) {
      return res.status(404).json({ error: 'Anúncio não encontrado' });
    }

    // Verificar se já existe pagamento pendente
    const pagamentoExistente = await prisma.pagamento.findFirst({
      where: {
        anuncioId,
        status: { in: ['pendente', 'processando'] },
      },
    });

    if (pagamentoExistente) {
      return res.status(400).json({ 
        error: 'Já existe um pagamento pendente para este anúncio',
        pagamento: pagamentoExistente,
      });
    }

    // Criar cobrança no C6
    const cobranca = await c6PixService.criarCobranca({
      valor,
      descricao: `Anúncio - ${anuncio.titulo}`,
      cpf: anuncio.usuariosCpf, // Se tiver CPF do usuário
      nome: anuncio.usuariosNome, // Se tiver nome do usuário
      identificacao: `ANO_${anuncioId.toString().padStart(6, '0')}`,
    });

    // Salvar no banco
    const pagamento = await prisma.pagamento.create({
      data: {
        anuncioId,
        valor: new Decimal(valor.toString()),
        tipo: 'pix',
        status: 'pendente',
        provedor: 'c6bank',
        idExterno: cobranca.id, // ID do C6
        pixCopiaECola: cobranca.pixCopiaECola,
        qrCode: cobranca.qrCode,
        pixId: cobranca.txid,
        dataExpiracao: new Date(Date.now() + 60 * 60 * 1000), // 1 hora
      },
      include: { anuncio: true },
    });

    res.json({ data: pagamento });
  } catch (error) {
    console.error('Erro ao criar pagamento:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erro ao processar pagamento',
    });
  }
});

// GET /api/pagamentos/:id/status - Consultar status
router.get('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;

    const pagamento = await prisma.pagamento.findUnique({
      where: { id },
    });

    if (!pagamento) {
      return res.status(404).json({ error: 'Pagamento não encontrado' });
    }

    // Se já está pago, retornar status
    if (pagamento.status === 'pago') {
      return res.json({ data: pagamento });
    }

    // Se tem ID externo (C6), consultar status
    if (pagamento.idExterno && pagamento.provedor === 'c6bank') {
      const statusC6 = await c6PixService.consultarCobranca(pagamento.idExterno);
      
      // Atualizar status local se mudou
      if (statusC6.status !== pagamento.status) {
        const atualizado = await prisma.pagamento.update({
          where: { id },
          data: { 
            status: statusC6.status,
            dataPagamento: statusC6.dataPagamento ? new Date(statusC6.dataPagamento) : null,
          },
        });
        return res.json({ data: atualizado });
      }
    }

    res.json({ data: pagamento });
  } catch (error) {
    console.error('Erro ao consultar status:', error);
    res.status(500).json({ error: 'Erro ao consultar status' });
  }
});

// POST /api/webhooks/c6-pix - Receber notificações do C6
router.post('/webhooks/c6-pix', async (req, res) => {
  try {
    const signature = req.headers['x-webhook-signature'] as string;
    const payload = JSON.stringify(req.body);

    // Validar assinatura
    if (!c6PixService.validarAssinatura(payload, signature)) {
      return res.status(401).json({ error: 'Assinatura inválida' });
    }

    const { evento, dados } = req.body;

    if (evento === 'pix.pagamento.recebido') {
      // Buscar pagamento pelo ID externo do C6
      const pagamento = await prisma.pagamento.findFirst({
        where: { idExterno: dados.cobrancaId },
      });

      if (!pagamento) {
        return res.status(404).json({ error: 'Pagamento não encontrado' });
      }

      // Atualizar status
      const atualizado = await prisma.pagamento.update({
        where: { id: pagamento.id },
        data: {
          status: 'pago',
          dataPagamento: new Date(dados.dataPagamento),
        },
      });

      // Atualizar status do anúncio
      await prisma.anuncio.update({
        where: { id: pagamento.anuncioId },
        data: { statusPagamento: 'pago' },
      });

      console.log(`✅ Pagamento confirmado: Anúncio ${pagamento.anuncioId}`);
      return res.json({ sucesso: true });
    }

    res.json({ recebido: true });
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    res.status(500).json({ error: 'Erro ao processar webhook' });
  }
});

export default router;
```

### 6.5 Registrar Rota no Server

Em `server/index.ts`:

```typescript
import pagamentosRouter from './routes/pagamentos';

app.use('/api/pagamentos', pagamentosRouter);
app.post('/api/webhooks/c6-pix', pagamentosRouter);
```

### 6.6 Frontend - Página de Checkout

Usar a página existente `client/pages/Checkout.tsx` e atualizar para:

```typescript
// Substituir a chamada de criação por:
const response = await fetch("/api/pagamentos", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    anuncioId: parsedAnuncioId,
    valor: anuncio.preco || 9.9 // Usar preço do anúncio
  })
});
```

---

## 7. Fluxo Completo de Pagamento

```
1. Usuário clica "Publicar Anúncio"
   ↓
2. Sistema valida anúncio e redireciona para /checkout?anuncioId=X
   ↓
3. Frontend faz POST /api/pagamentos com {anuncioId, valor}
   ↓
4. Backend chama C6PIXService.criarCobranca()
   ↓
5. C6 retorna QR Code + PixCopiaECola
   ↓
6. Frontend exibe QR Code e timer (30min)
   ↓
7. Usuário escaneia QR ou copia chave PIX
   ↓
8. Usuário paga via app bancário
   ↓
9. C6 envia webhook para POST /api/webhooks/c6-pix
   ↓
10. Server valida assinatura e atualiza status para "pago"
   ↓
11. Frontend detecta mudança de status
   ↓
12. Sistema ativa o anúncio
   ↓
13. Redireciona para /sell ou dashboard
```

---

## 8. Segurança

### 8.1 Proteção de Dados

- **Nunca** exponha a API Key publicamente
- Use variáveis de ambiente para credenciais
- Valide sempre a assinatura do webhook
- Use HTTPS para todas as requisições

### 8.2 Validação de Assinatura do Webhook

```typescript
// Sempre validar antes de processar
if (!c6PixService.validarAssinatura(rawPayload, signature)) {
  return res.status(401).json({ error: 'Não autorizado' });
}
```

### 8.3 Rate Limiting

Implementar rate limiting na rota de webhook:

```typescript
import rateLimit from 'express-rate-limit';

const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 100, // 100 requisições
});

router.post('/webhooks/c6-pix', webhookLimiter, ...);
```

---

## 9. Testes

### 9.1 Ambiente Sandbox

1. Criar conta de teste no portal developers.c6bank.com.br
2. Usar API Key do sandbox
3. Registrar webhook sandbox

### 9.2 Testar Criação de Cobrança

```bash
curl -X POST https://api-sandbox.c6bank.com.br/v1/pix/cobrancas \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "valor": 9.90,
    "descricao": "Teste",
    "identificacao": "TEST_001"
  }'
```

### 9.3 Simular Webhook (para testes)

```bash
curl -X POST http://localhost:3000/api/webhooks/c6-pix \
  -H "X-Webhook-Signature: test_signature" \
  -H "Content-Type: application/json" \
  -d '{
    "evento": "pix.pagamento.recebido",
    "dados": {
      "cobrancaId": "test-id",
      "valor": 9.90,
      "status": "pago",
      "dataPagamento": "2025-02-13T12:00:00Z"
    }
  }'
```

---

## 10. Referências

- **Portal C6 Developers:** https://developers.c6bank.com.br/
- **Documentação C6 PIX:** https://developers.c6bank.com.br/docs/pix
- **Suporte C6:** suporte@c6bank.com.br
- **Blog C6 (APIs):** https://www.c6bank.com.br/blog/api-c6-bank

---

## 11. Checklist de Implementação

- [ ] Registrar conta no portal developers.c6bank.com.br
- [ ] Gerar API Key e Webhook Secret
- [ ] Configurar variáveis de ambiente (.env)
- [ ] Criar arquivo `C6PIXService.ts`
- [ ] Atualizar `server/routes/pagamentos.ts`
- [ ] Registrar rota webhook em `server/index.ts`
- [ ] Atualizar schema Prisma (se necessário)
- [ ] Testar em sandbox
- [ ] Configurar domínio HTTPS
- [ ] Registrar URL webhook em produção no C6
- [ ] Testar fluxo completo end-to-end
- [ ] Implementar testes automatizados
- [ ] Documentar processo para time

---

## 12. Próximos Passos Recomendados

1. **Homologação C6:** Passar por processo de homologação no C6 Bank
2. **Webhook em Produção:** Registrar URL webhook real no portal C6
3. **Monitoramento:** Implementar logs e alertas para falhas de pagamento
4. **Reconciliação:** Criar rotina de reconciliação diária com extratos C6
5. **Tratamento de Erros:** Implementar retry automático para falhas temporárias
