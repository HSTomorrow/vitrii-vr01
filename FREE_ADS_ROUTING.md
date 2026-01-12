# Roteirização de Anúncios Gratuitos

## Feature Implementada
Anúncios com a opção "Este produto/serviço/evento é gratuito" (`isDoacao=true`) OU com preço igual a 0 (`preco=0`) agora aparecem **apenas na seção "Doações, Brindes e Serviços Gratuitos"** e não aparecem mais na seção "Anúncios em Destaque".

## O Que Mudou

### Antes
- Anúncios gratuitos podiam aparecer tanto em "Anúncios em Destaque" quanto em "Doações"
- A filtragem só verificava `isDoacao` e não considerava anúncios com `preco=0`

### Depois
- ✅ Anúncios gratuitos aparecem APENAS em "Doações, Brindes e Serviços Gratuitos"
- ✅ Anúncios com preço 0 são tratados como gratuitos
- ✅ Seções de "Anúncios em Destaque", "Eventos" e "Agendas Recorrentes" excluem anúncios gratuitos

## Implementação Técnica

### Arquivo Modificado
**File:** `client/pages/Index.tsx`

### Lógica de Filtragem

#### Função Helper
```typescript
// Helper to check if an anuncio is free (donation or price = 0)
const isGratis = (anuncio: any) => 
  anuncio.isDoacao || (anuncio.preco === 0 || anuncio.preco === "0");
```

#### Filtros Aplicados

**1. Destacados (Produtos e Serviços)**
```typescript
const destacados = allAnuncios
  .filter(
    (anuncio: any) =>
      anuncio.destaque &&
      anuncio.isActive &&
      !isGratis(anuncio) &&           // ← Exclui gratuitos
      ["produto", "servico"].includes(anuncio.tipo),
  )
  .slice(0, 20);
```

**2. Doações (Anúncios Gratuitos)**
```typescript
const destaqueDoacoes = allAnuncios
  .filter(
    (anuncio: any) =>
      anuncio.destaque &&
      anuncio.isActive &&
      isGratis(anuncio),               // ← Inclui APENAS gratuitos
  )
  .slice(0, 20);
```

**3. Eventos**
```typescript
const destaqueEventos = allAnuncios
  .filter(
    (anuncio: any) =>
      anuncio.destaque &&
      anuncio.isActive &&
      !isGratis(anuncio) &&           // ← Exclui gratuitos
      anuncio.tipo === "evento",
  )
  .slice(0, 20);
```

**4. Agendas Recorrentes**
```typescript
const destaqueAgendas = allAnuncios
  .filter(
    (anuncio: any) =>
      anuncio.destaque &&
      anuncio.isActive &&
      !isGratis(anuncio) &&           // ← Exclui gratuitos
      anuncio.tipo === "agenda_recorrente",
  )
  .slice(0, 20);
```

## Comportamento por Tipo de Anúncio

### Anúncio Pago (preco > 0 e isDoacao=false)
- ✅ Aparece em "Anúncios em Destaque" (se destaque=true)
- ❌ NÃO aparece em "Doações"

### Anúncio Evento Pago (preco > 0, tipo=evento, isDoacao=false)
- ✅ Aparece em "Eventos" (se destaque=true)
- ❌ NÃO aparece em "Doações"

### Anúncio Gratuito - Opção 1 (isDoacao=true)
- ❌ NÃO aparece em "Anúncios em Destaque"
- ✅ Aparece em "Doações, Brindes e Serviços Gratuitos" (se destaque=true)

### Anúncio Gratuito - Opção 2 (preco=0)
- ❌ NÃO aparece em "Anúncios em Destaque"
- ✅ Aparece em "Doações, Brindes e Serviços Gratuitos" (se destaque=true)

### Evento Gratuito (tipo=evento, isDoacao=true OU preco=0)
- ❌ NÃO aparece em "Eventos"
- ✅ Aparece em "Doações, Brindes e Serviços Gratuitos" (se destaque=true)

## Exemplos de Cenários

### Cenário 1: Produto com preco=0 e isDoacao=false
```json
{
  "titulo": "Camiseta Usada",
  "preco": 0,
  "isDoacao": false,
  "destaque": true,
  "tipo": "produto"
}
```
**Resultado**: Aparece em "Doações, Brindes e Serviços Gratuitos"

### Cenário 2: Serviço com isDoacao=true e preco=100
```json
{
  "titulo": "Consulta Gratuita",
  "preco": 100,
  "isDoacao": true,
  "destaque": true,
  "tipo": "servico"
}
```
**Resultado**: Aparece em "Doações, Brindes e Serviços Gratuitos"

### Cenário 3: Produto com preco=50 e isDoacao=false
```json
{
  "titulo": "Livro",
  "preco": 50,
  "isDoacao": false,
  "destaque": true,
  "tipo": "produto"
}
```
**Resultado**: Aparece em "Anúncios em Destaque"

## Verificação de Preço

A função `isGratis` verifica ambos os formatos:
- `preco === 0` (número)
- `preco === "0"` (string)

Isso garante compatibilidade independentemente de como o preço é armazenado ou transmitido.

## Files Modified
- `client/pages/Index.tsx` - Atualizado lógica de filtragem de anúncios

## Testing

Para verificar a funcionalidade:

1. **Crie um anúncio com preco=0** (sem selecionar "gratuito")
   - ✅ Deve aparecer em "Doações, Brindes e Serviços Gratuitos"
   - ❌ NÃO deve aparecer em "Anúncios em Destaque"

2. **Crie um anúncio com isDoacao=true**
   - ✅ Deve aparecer em "Doações, Brindes e Serviços Gratuitos"
   - ❌ NÃO deve aparecer em "Anúncios em Destaque"

3. **Crie um anúncio com preco > 0**
   - ✅ Deve aparecer em "Anúncios em Destaque"
   - ❌ NÃO deve aparecer em "Doações"

4. **Crie um evento gratuito (preco=0 ou isDoacao=true)**
   - ✅ Deve aparecer em "Doações, Brindes e Serviços Gratuitos"
   - ❌ NÃO deve aparecer em "Eventos"

## Status
✅ **IMPLEMENTADO E ATIVO**
