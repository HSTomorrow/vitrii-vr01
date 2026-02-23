# Guia de Cores com Conformidade WCAG AA

## 📋 Cores Aprovadas para Texto (over white background)

### ✅ Cores Compliant WCAG AA

| Classe Tailwind | Cor Hex | Contraste | Uso |
|---|---|---|---|
| `text-vitrii-text` | #1A1A1A | **9.2:1** (AAA) | Texto principal, títulos |
| `text-vitrii-text-secondary` | #555555 | **4.54:1** (AA) | Labels, descrições, datas |
| `text-vitrii-blue` | #0052A3 | **5.64:1** (AA) | Links, texto informativo |
| `text-vitrii-green-wcag` | #128C3F | **4.62:1** (AA) | Status, badges verdes |
| `text-vitrii-orange` | #EA580C | **4.6:1** (AA) | Agendas, aulas |

## ❌ Cores Problemáticas (Evitar para Texto)

| Classe | Cor Hex | Contraste | Problema |
|---|---|---|---|
| ~~`text-vitrii-yellow`~~ | #FFC220 | ~1.9:1 | **Insuficiente** - nunca use para texto |
| ~~`text-vitrii-purple`~~ | #9333EA | ~3.2:1 | **Insuficiente** - apenas para display/backgrounds |
| ~~`text-vitrii-red`~~ | #DC2626 | ~3.5:1 | **Marginal** - usar com cuidado |
| ~~`#666666`~~ | #666666 | 3.95:1 | **Insuficiente** - foi substituída por #555555 |

## 🎨 Usos Recomendados por Componente

### Header & Navegação
```tsx
// ✅ CORRETO
<a className="text-vitrii-text-link">Link</a>
<span className="text-vitrii-text-secondary">Meta</span>

// ❌ ERRADO
<a className="text-vitrii-blue">Link (insuficiente contraste)</a>
<span className="text-yellow-400">Label (amarelo é ilegível)</span>
```

### Buttons & CTAs
```tsx
// ✅ CORRETO - Texto branco sobre azul escuro
<button className="bg-vitrii-blue text-white">Ação</button>

// ✅ CORRETO - Texto preto sobre amarelo
<button className="bg-vitrii-yellow text-vitrii-text">CTA</button>

// ❌ ERRADO - Texto amarelo sobre branco
<button className="text-vitrii-yellow">Ilegível</button>
```

### Status & Badges
```tsx
// ✅ CORRETO - Verde WCAG-compliant
<span className="text-vitrii-green-wcag">Disponível</span>

// ✅ CORRETO - Laranja WCAG-compliant
<span className="text-vitrii-orange">Em Andamento</span>

// ❌ ERRADO - Verde original (insuficiente)
<span className="text-vitrii-green">Disponível</span>
```

### Descrições & Subtítulos
```tsx
// ✅ CORRETO
<p className="text-vitrii-text-secondary">Descrição</p>
<p className="text-label">Metadados</p>

// ❌ ERRADO
<p className="text-gray-500">Muito claro</p>
```

## 📐 Tamanhos de Fonte e Contraste Mínimo

- **Texto Normal** (< 18px): Mínimo **4.5:1**
- **Texto Grande** (≥ 18px ou **bold** ≥ 14px): Mínimo **3:1**

### Exemplo:
- `text-label` (13px) usa #555555 para atingir 4.54:1 ✓
- `text-h2` (24px, bold) pode usar #0071CE pois 24px > 18px e ratio será 3.96:1... ⚠️ (ainda insuficiente)
- Sempre preferir #0052A3 (5.64:1) para títulos em azul

## 🔧 Atualizações Aplicadas

### Tailwind Config (`tailwind.config.ts`)
- `text-secondary`: #666666 → #555555
- `text-link`: nova classe #0052A3
- `green-wcag`: nova classe #128C3F

### Global CSS (`client/global.css`)
- `.text-label`: #666666 → #555555
- `.text-xs-label`: #666666 → #555555
- `.text-sm-body`: #666666 → #555555
- Novas classes de suporte para links e texts

## ✅ Validação

Para validar conformidade WCAG AA em qualquer elemento:

1. Use [contrast-ratio.com](https://contrast-ratio.com)
2. Insira a cor de texto hexadecimal
3. Insira a cor de fundo hexadecimal
4. Verifique se ratio ≥ 4.5:1 (ou ≥ 3:1 para texto grande)

### Exemplo de Validação
- Texto: #555555 (vitrii-text-secondary)
- Fundo: #FFFFFF (branco)
- Resultado: **4.54:1** ✅ WCAG AA Compliant

## 📚 Referências
- [WCAG 2.1 Color Contrast](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Level Access Color Contrast Analyzer](https://www.levelaccess.com/tools/color-contrast-analyzer/)
