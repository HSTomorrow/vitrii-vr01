# Anúncios Gratuitos com Preço Zero no Banco

## Feature Implementada
Quando um anúncio é marcado como "Este produto/serviço/evento é gratuito" (checkbox `isDoacao=true`), o valor é **sempre gravado como 0** no banco de dados, nunca como NULL.

## O Que Mudou

### Antes
- Quando `isDoacao=true`, o preço era gravado como `NULL` no banco
- O campo de preço no formulário era limpo para uma string vazia

### Depois
- ✅ Quando `isDoacao=true`, o preço é gravado como `0` no banco
- ✅ O campo de preço no formulário mostra `0` quando marcado como gratuito
- ✅ Consistência: preço sempre é um valor, nunca NULL para itens gratuitos

## Implementação Técnica

### Frontend Changes
**File:** `client/components/AnuncioForm.tsx` (linha 591)

**Antes:**
```typescript
if (isChecked) {
  handleInputChange("precoAnuncio", "");  // ← String vazia
}
```

**Depois:**
```typescript
if (isChecked) {
  handleInputChange("precoAnuncio", "0");  // ← Zero
}
```

### Backend Changes
**File:** `server/routes/anuncios.ts`

#### 1. Create Anúncio (linha 288)
**Antes:**
```typescript
const precoAnuncio = isDoacao ? null : validatedData.precoAnuncio;
```

**Depois:**
```typescript
const precoAnuncio = isDoacao ? 0 : validatedData.precoAnuncio;
```

#### 2. Update Anúncio (linha 377)
**Antes:**
```typescript
if (updateData.isDoacao === true) {
  updateData.status = "pago";
  updateData.precoAnuncio = null;  // ← NULL
}
```

**Depois:**
```typescript
if (updateData.isDoacao === true) {
  updateData.status = "pago";
  updateData.precoAnuncio = 0;  // ← Zero
}
```

## Fluxo Completo

### Criar Anúncio Gratuito
1. Usuário clica em "Publicar Grátis" 
2. Checkbox "Este produto/serviço/evento é gratuito" vem **pré-selecionado**
3. Campo de preço mostra **"0"** e está **desabilitado**
4. Usuário preenche dados e clica "Salvar"
5. **Banco de dados recebe:** `preco = 0` (não NULL)

### Editar Anúncio e Marcar como Gratuito
1. Usuário abre um anúncio pago
2. Seleciona o checkbox "Este produto/serviço/evento é gratuito"
3. Campo de preço muda para **"0"** e fica **desabilitado**
4. Clica "Salvar"
5. **Banco de dados recebe:** `preco = 0` (não NULL)

## Banco de Dados

### Antes (NULL)
```sql
SELECT id, titulo, preco, isDoacao FROM anuncios 
WHERE isDoacao = true;

id  | titulo           | preco | isDoacao
----|------------------|-------|----------
1   | Camiseta Usada   | NULL  | true
2   | Livro Gratuito   | NULL  | true
```

### Depois (Zero)
```sql
SELECT id, titulo, preco, isDoacao FROM anuncios 
WHERE isDoacao = true;

id  | titulo           | preco | isDoacao
----|------------------|-------|----------
1   | Camiseta Usada   | 0     | true
2   | Livro Gratuito   | 0     | true
```

## Benefícios

✅ **Consistência**: Todos os anúncios gratuitos tem preço = 0, nunca NULL
✅ **Filtragem Simples**: Fácil encontrar gratuitos: `WHERE preco = 0`
✅ **Sem Ambiguidade**: 0 é claramente "sem custo", NULL poderia ser "preço não informado"
✅ **Cálculos**: Cálculos financeiros funcionam melhor com 0 do que NULL
✅ **Display**: Exibições de preço mostram "R$ 0,00" em vez de vazio/NULL

## Files Modified

- `client/components/AnuncioForm.tsx` - Frontend: campo mostra "0" quando gratuito
- `server/routes/anuncios.ts` - Backend: cria e atualiza anúncios com preco = 0

## Testing

Para verificar a funcionalidade:

1. **Criar anúncio gratuito**:
   - Clique em "Publicar Grátis" (da seção de doações)
   - Verifique que o campo preço mostra "0"
   - Salve o anúncio
   - Confirme no banco: `SELECT preco FROM anuncios WHERE id = ? → 0`

2. **Editar anúncio pago para gratuito**:
   - Abra um anúncio pago (preco = 100)
   - Selecione o checkbox "Este produto/serviço/evento é gratuito"
   - Verifique que o campo preço muda para "0"
   - Salve
   - Confirme no banco: `SELECT preco FROM anuncios WHERE id = ? → 0`

3. **Filtro de gratuitos**:
   - A filtragem `isGratis(anuncio) = anuncio.isDoacao || (anuncio.preco === 0)`
   - Agora funciona com preco = 0 (antes era NULL)

## Status
✅ **IMPLEMENTADO E ATIVO**

Todos os anúncios gratuitos criados ou editados a partir de agora terão `preco = 0` no banco de dados.
