# Criar Anúncio Gratuito - Formulário Pré-preenchido

## Feature Implementada

Adicionado botão "Publicar Grátis" na seção "Doações, Brindes e Serviços Gratuitos" da homepage, que leva o usuário para o formulário de criação de anúncio com os campos já configurados para um item gratuito.

## O Que Funciona

### Desktop (md+)

- Novo botão verde "Publicar Grátis" aparece ao lado de "Ver Todos" na seção de gratuitos
- Botão leva para `/anuncio/criar?tipo=doacao`

### Mobile (<md)

- Botão "Publicar Grátis" aparece acima de "Ver Todos os Itens Gratuitos"
- Mesmo comportamento: leva para `/anuncio/criar?tipo=doacao`

## Fluxo do Usuário

1. **Usuário vê a seção "Doações, Brindes e Serviços Gratuitos" na homepage**

2. **Clica no botão "Publicar Grátis"**

3. **Formulário abre com:**
   - ✅ Checkbox "Este produto/serviço/evento é gratuito" já selecionado
   - ✅ Campo de valor zerado (desabilitado)
   - ✅ Todos os outros campos vazios para preenchimento

4. **Usuário preenche os dados e salva**

## Implementação Técnica

### Componentes Afetados

**File:** `client/pages/Index.tsx`

#### Adições na Seção de Gratuitos (Desktop)

```jsx
<div className="hidden md:flex items-center space-x-4">
  <Link
    to="/anuncio/criar?tipo=doacao"
    className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
  >
    <Plus className="w-4 h-4" />
    Publicar Grátis
  </Link>
  <Link
    to="/browse?filter=gratuito"
    className="inline-flex items-center space-x-2 text-walmart-blue font-semibold hover:space-x-3 transition-all"
  >
    <span>Ver Todos</span>
    <ArrowRight className="w-5 h-5" />
  </Link>
</div>
```

#### Adições na Seção de Gratuitos (Mobile)

```jsx
<div className="text-center mt-8 space-y-4">
  <Link
    to="/anuncio/criar?tipo=doacao"
    className="md:hidden inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
  >
    <Plus className="w-4 h-4" />
    Publicar Grátis
  </Link>
  <div>
    <Link
      to="/browse?filter=gratuito"
      className="inline-flex items-center space-x-2 text-walmart-blue font-semibold hover:space-x-3 transition-all"
    >
      <span>Ver Todos os Itens Gratuitos</span>
      <ArrowRight className="w-5 h-5" />
    </Link>
  </div>
</div>
```

### Componentes Existentes que Suportam Isso

#### CriarAnuncio.tsx

Já detecta o parâmetro `?tipo=doacao`:

```typescript
const isDonation = searchParams.get("tipo") === "doacao";
```

E passa para o formulário:

```jsx
<AnuncioForm onSuccess={() => navigate("/sell")} isDonation={isDonation} />
```

#### AnuncioForm.tsx

Já tem suporte para pré-preencher o campo:

```typescript
const [formData, setFormData] = useState({
  // ... outros campos
  isDoacao: isDonation || false, // ← Usa a prop
  // ... outros campos
});
```

## Comportamento Esperado

**Quando o usuário abre `/anuncio/criar?tipo=doacao`:**

1. ✅ Checkbox "Este produto/serviço/evento é gratuito" vem **selecionado**
2. ✅ Campo de "Valor" vem **zerado** e **desabilitado**
3. ✅ Todos os outros campos vazios para preenchimento
4. ✅ Ao preencher os dados e salvar, o anúncio é criado como gratuito

## Estilo do Botão

- **Cor**: Verde (#16A34A)
- **Hover**: Verde mais escuro (#15803D)
- **Ícone**: Plus (Lucide)
- **Texto**: "Publicar Grátis"
- **Responsividade**: Aparece no desktop ao lado de "Ver Todos", no mobile aparece acima

## Files Modified

- `client/pages/Index.tsx` - Adicionado botão "Publicar Grátis" nas seções desktop e mobile

## Testing

Para verificar a funcionalidade:

1. **Acesse a homepage** (`/`)
2. **Procure pela seção "Doações, Brindes e Serviços Gratuitos"**
3. **No desktop**: Clique no botão verde "Publicar Grátis" ao lado de "Ver Todos"
4. **No mobile**: Role até a seção e clique no botão "Publicar Grátis"
5. **Verifique**:
   - ✅ O formulário abre em `/anuncio/criar?tipo=doacao`
   - ✅ O checkbox "Este produto/serviço/evento é gratuito" está selecionado
   - ✅ O campo de valor está zerado e desabilitado

## Próximos Passos Opcionais

- Adicionar botão semelhante nas outras seções (Eventos, Agenda Recorrente)
- Adicionar tracking/analytics para monitorar quantos usuários clicam no botão
- Adicionar tooltip explicando a diferença entre anúncios pagos e gratuitos
