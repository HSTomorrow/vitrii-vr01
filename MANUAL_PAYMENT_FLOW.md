# Fluxo de Pagamento Manual com Envio de Comprovante

## 📋 Visão Geral

Sistema de pagamento manual via PIX com upload de comprovante para validação. O fluxo permite que usuários:

1. Vejam o QR Code/PIX para pagar
2. Realizem o pagamento via app bancário
3. Enviem o comprovante de pagamento
4. Aguardem análise (até 24 horas)
5. Tenham o anúncio ativado após aprovação

---

## 🔄 Fluxo Completo

```
┌─────────────────────────────────────────────────────┐
│  Usuário clica "Publicar Anúncio"                   │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│  Sistema redireciona para /checkout?anuncioId=X    │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│  Tela 1: EXIBIR QR CODE + PIX                       │
│  - QR Code gerado dinamicamente                     │
│  - Código PIX para copiar/colar                     │
│  - Timer de expiração (30 minutos)                  │
│  - Botão "Pagamento Realizado"                      │
└──────────────────┬──────────────────────────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
         ▼                   ▼
┌──────────────────┐ ┌──────────────────┐
│ Clica Botão      │ │ Aguarda 30min    │
│ "Pagamento       │ │ para Expiração   │
│  Realizado"      │ │                  │
└────────┬─────────┘ └────────┬─────────┘
         │                   │
         ▼                   ▼
┌──────────────────────────────────────────┐
│  Tela 2: MODAL UPLOAD COMPROVANTE        │
│  - Input file (JPG, PNG, PDF)            │
│  - Preview do arquivo                    │
│  - Botão "Enviar Comprovante"            │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  Servidor valida e salva comprovante     │
│  - Atualiza status para "comprovante_    │
│    enviado"                              │
│  - Altera status anúncio para            │
│    "em_analise"                          │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  Tela 3: MENSAGEM CONFIRMAÇÃO            │
│  "Comprovante recebido! Análise em até   │
│   24 horas úteis"                        │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  ADMIN: Valida Comprovante               │
│  - POST /api/pagamentos/:id/aprovar      │
│  - POST /api/pagamentos/:id/rejeitar     │
└────────┬─────────────────────────────────┘
         │
    ┌────┴────┐
    │          │
    ▼          ▼
┌────────┐ ┌────────────┐
│APROVADO│ │ REJEITADO  │
└───┬────┘ └─────┬──────┘
    │            │
    ▼            ▼
ATIVAR      PEDIR NOVO
ANÚNCIO     COMPROVANTE
```

---

## 📊 Estados de Pagamento

| Estado | Descrição | Ação do Usuário |
|--------|-----------|-----------------|
| `pendente` | Aguardando pagamento | Escanear QR ou copiar PIX |
| `comprovante_enviado` | Comprovante recebido | Aguardar análise (24h) |
| `aprovado` | Anúncio ativado | Ver anúncio publicado |
| `rejeitado` | Comprovante inválido | Enviar novo comprovante |
| `expirado` | QR expirou (30min) | Voltar e criar novo pagamento |

---

## 🗄️ Estrutura do Banco de Dados

### Tabela: `pagamentos`

```sql
CREATE TABLE pagamentos (
  id SERIAL PRIMARY KEY,
  anuncio_id INTEGER NOT NULL UNIQUE,
  valor NUMERIC(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pendente',
  tipo VARCHAR(50) NOT NULL DEFAULT 'pix',
  comprovante_pagamento VARCHAR(500),
  data_comprovante TIMESTAMP,
  data_criacao TIMESTAMP NOT NULL DEFAULT NOW(),
  data_atualizacao TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (anuncio_id) REFERENCES anuncios(id)
);
```

### Modelo Prisma

```prisma
model pagamentos {
  id                    Int       @id @default(autoincrement())
  anuncioId             Int       @unique
  anuncio               anuncios  @relation(fields: [anuncioId], references: [id], onDelete: Cascade)
  
  valor                 Decimal   @db.Decimal(10, 2)
  status                String    @default("pendente") @db.VarChar(50)
  tipo                  String    @default("pix") @db.VarChar(50)
  
  comprovantePagamento  String?   @db.VarChar(500)
  dataComprovante       DateTime?
  
  dataCriacao           DateTime  @default(now())
  dataAtualizacao       DateTime  @updatedAt
  
  @@index([anuncioId])
  @@index([status])
  @@index([dataCriacao])
  @@map("pagamentos")
}
```

---

## 🔌 API Endpoints

### 1. Criar Pagamento

**POST** `/api/pagamentos`

```json
{
  "anuncioId": 61,
  "valor": 9.90
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "anuncioId": 61,
    "valor": 9.90,
    "status": "pendente",
    "tipo": "pix",
    "urlCopiaECola": "00020126580014br.gov.bcb...",
    "dataCriacao": "2025-02-13T12:00:00Z"
  }
}
```

### 2. Obter Pagamento

**GET** `/api/pagamentos/anuncio/:anuncioId`

```json
{
  "success": true,
  "data": {
    "id": 1,
    "anuncioId": 61,
    "status": "pendente",
    "valor": 9.90
  }
}
```

### 3. Enviar Comprovante

**POST** `/api/pagamentos/:id/comprovante`

```json
{
  "comprovantePagamento": "data:image/png;base64,iVBORw0KGgo..."
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Comprovante enviado com sucesso! Análise em até 24 horas.",
  "data": {
    "id": 1,
    "status": "comprovante_enviado",
    "comprovantePagamento": "data:image/png;base64,...",
    "dataComprovante": "2025-02-13T13:00:00Z"
  }
}
```

### 4. Aprovar Pagamento (Admin)

**POST** `/api/pagamentos/:id/aprovar`

```json
{
  "success": true,
  "message": "Pagamento aprovado! Anúncio ativado.",
  "data": {
    "id": 1,
    "status": "aprovado"
  }
}
```

Efeitos:
- Status pagamento → "aprovado"
- Status anúncio → "ativo"
- statusPagamento anúncio → "pago"

### 5. Rejeitar Pagamento (Admin)

**POST** `/api/pagamentos/:id/rejeitar`

```json
{
  "motivo": "Comprovante ilegível"
}
```

Efeitos:
- Status pagamento → "rejeitado"
- Status anúncio → "em_edicao"
- Usuário pode enviar novo comprovante

---

## 🎨 Interface Frontend

### Página: `/checkout?anuncioId=X`

#### Tela 1: QR Code + PIX

```
┌─────────────────────────────────┐
│ Escaneie o QR Code              │
├─────────────────────────────────┤
│                                 │
│        ███████████████          │
│        █ QR CODE IMG █          │
│        ███████████████          │
│                                 │
├─────────────────────────────────┤
│ Copiar Código Pix               │
│ [00020126580... COPIAR]         │
│                                 │
│ Tempo restante: 29:45           │
│ [Pagamento Realizado]           │
└─────────────────────────────────┘
```

#### Tela 2: Modal Upload

```
┌──────────────────────────────────────┐
│ ✕ Enviar Comprovante de Pagamento   │
├──────────────────────────────────────┤
│                                      │
│ ┌────────────────────────────────┐  │
│ │  📁 Clique ou arraste arquivo  │  │
│ │  JPG, PNG ou PDF • Máx 10MB    │  │
│ └────────────────────────────────┘  │
│                                      │
│ ℹ️ Informações:                      │
│ • Comprovante com data e valor      │
│ • PIX em nome de "Vitrii"           │
│ • Análise em até 24 horas           │
│                                      │
│ [Cancelar] [Enviar Comprovante]    │
└──────────────────────────────────────┘
```

#### Tela 3: Confirmação

```
┌─────────────────────────────────┐
│ ✓ Comprovante Enviado!          │
├─────────────────────────────────┤
│ Seu comprovante foi recebido.   │
│ Analisaremos em até 24 horas    │
│ e seu anúncio será ativado      │
│ em breve.                       │
│                                 │
│ 📧 Você receberá um email de    │
│ confirmação assim que validar.  │
└─────────────────────────────────┘
```

---

## 👨‍💼 Painel Admin (Futuro)

Para validar os pagamentos manualmente:

```
GET /admin/pagamentos?status=comprovante_enviado
```

**Listagem:**
- Anúncio: [Título]
- Usuário: [Nome]
- Valor: R$ 9.90
- Comprovante: [Visualizar]
- [Aprovar] [Rejeitar]

---

## 📝 Implementação Técnica

### Backend (Node.js + Express)

**Arquivo:** `server/routes/pagamentos.ts`

```typescript
// Enviar comprovante
export const uploadComprovantePagemento: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const { comprovantePagamento } = req.body;
  
  // Salvar comprovante
  const pagamento = await prisma.pagamentos.update({
    where: { id: parseInt(id) },
    data: {
      status: "comprovante_enviado",
      comprovantePagamento,
      dataComprovante: new Date(),
    },
  });
  
  // Atualizar anúncio para em_analise
  await prisma.anuncios.update({
    where: { id: pagamento.anuncioId },
    data: { status: "em_analise" },
  });
  
  res.json({
    success: true,
    message: "Comprovante enviado com sucesso! Análise em até 24 horas.",
  });
};

// Aprovar pagamento
export const aprovarPagamento: RequestHandler = async (req, res) => {
  const { id } = req.params;
  
  const pagamento = await prisma.pagamentos.update({
    where: { id: parseInt(id) },
    data: { status: "aprovado" },
  });
  
  // Ativar anúncio
  await prisma.anuncios.update({
    where: { id: pagamento.anuncioId },
    data: { 
      status: "ativo", 
      statusPagamento: "pago" 
    },
  });
  
  res.json({
    success: true,
    message: "Pagamento aprovado! Anúncio ativado.",
  });
};
```

### Frontend (React)

**Arquivo:** `client/pages/Checkout.tsx`

```typescript
// Estado
const [showProofModal, setShowProofModal] = useState(false);
const [proofFile, setProofFile] = useState<File | null>(null);

// Upload
const handleUploadProof = async () => {
  const reader = new FileReader();
  reader.onload = async () => {
    const response = await fetch(`/api/pagamentos/${payment.id}/comprovante`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        comprovantePagamento: reader.result,
      }),
    });
    
    if (response.ok) {
      toast.success("Comprovante enviado com sucesso!");
      // Atualizar estado
    }
  };
  reader.readAsDataURL(proofFile);
};
```

---

## 🔒 Segurança

### Validação de Arquivo

```typescript
// Tipo aceito
const acceptedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
if (!acceptedTypes.includes(file.type)) {
  throw new Error('Formato inválido');
}

// Tamanho máximo
if (file.size > 10 * 1024 * 1024) {
  throw new Error('Arquivo muito grande');
}
```

### Armazenamento

- Comprovantes salvos como **data URLs** (base64) no banco
- Futuro: Migrar para storage em nuvem (S3, Firebase)
- Apenas admin pode visualizar
- Soft delete de registros rejeitados

---

## 📋 Checklist de Implementação

- [x] Criar tabela `pagamentos` no banco
- [x] Adicionar modelo Prisma
- [x] Criar endpoints de pagamento
- [x] Atualizar página Checkout
- [x] Modal de upload de comprovante
- [x] Validação de arquivo
- [x] Estados de status
- [ ] Criar painel admin para validação
- [ ] Enviar email após aprovação
- [ ] Migrar para storage em nuvem
- [ ] Adicionar notificações em tempo real

---

## 🚀 Próximos Passos

1. **Criar Painel Admin:**
   - Listar pagamentos pendentes
   - Visualizar comprovantes
   - Botões Aprovar/Rejeitar

2. **Email de Confirmação:**
   - Notificar quando aprovado
   - Notificar quando rejeitado
   - Incluir link para re-enviar

3. **Storage em Nuvem:**
   - Substituir data URLs por upload para AWS S3
   - Gerar URLs assinadas
   - Limpeza automática de arquivos rejeitados

4. **Melhorias de UX:**
   - Drag-and-drop de arquivo
   - Compressão de imagem automática
   - Preview com zoom
   - Histórico de tentativas

---

## 📞 Suporte

Para dúvidas sobre o fluxo de pagamento:
- Email: support@vitrii.com.br
- Chat: Integrado no app (próximas versões)

---

**Versão:** 1.0  
**Data de Atualização:** 13 de fevereiro de 2025  
**Autor:** Equipe Vitrii
