# Vitrii PWA Setup Guide

## O que foi criado?

Uma Progressive Web App (PWA) completa que permite instalar o Vitrii como um app nativo no Android e iOS.

### Arquivos Criados:

1. **`/public/manifest.json`** - Configuração do app PWA
2. **`/public/sw.js`** - Service Worker (offline support, caching)
3. **`/public/browserconfig.xml`** - Configuração para Windows
4. **`/client/hooks/usePWA.ts`** - Hook React para gerenciar PWA
5. **`/client/components/PWAInstallButton.tsx`** - Botão de instalação
6. **`/index.html`** - Metadados de PWA atualizados

---

## Próximo Passo: Gerar Ícones

Você precisa gerar ícones em diferentes tamanhos. Use uma dessas opções:

### Opção 1: Usar PWA Image Generator Online (Recomendado)
1. Acesse: https://www.pwabuilder.com/imageGenerator
2. Upload seu logo (quadrado, min 512x512px)
3. Escolha as cores (Tema: #025CB6, Fundo: #FFFFFF)
4. Download os ícones
5. Extraia em `/public/icons/`

### Opção 2: Usar Script Node (Local)

```bash
# Install sharp for image processing
npm install -D sharp

# Run script para gerar ícones (crie o script abaixo)
node generate-icons.js
```

Crie `generate-icons.js` na raiz:

```javascript
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [16, 32, 70, 72, 96, 128, 144, 150, 152, 167, 180, 192, 310, 384, 512];
const logoPath = './logo.png'; // Seu logo original
const outputDir = './public/icons';

// Criar diretório se não existir
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Gerar ícones para cada tamanho
Promise.all(
  sizes.map(size =>
    sharp(logoPath)
      .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(path.join(outputDir, `icon-${size}x${size}.png`))
      .then(() => console.log(`✅ Gerado: icon-${size}x${size}.png`))
  )
).then(() => {
  // Gerar maskable icons (para Android)
  return Promise.all(
    [192, 512].map(size =>
      sharp(logoPath)
        .resize(size * 0.8, size * 0.8, { fit: 'contain' })
        .png()
        .toFile(path.join(outputDir, `icon-maskable-${size}x${size}.png`))
        .then(() => console.log(`✅ Gerado: icon-maskable-${size}x${size}.png`))
    )
  );
});
```

### Opção 3: Usar ImageMagick/GraphicsMagick

```bash
# MacOS
brew install imagemagick

# Ubuntu/Debian
sudo apt-get install imagemagick

# Então execute:
for size in 16 32 72 96 128 144 152 192 384 512; do
  convert logo.png -resize ${size}x${size} -background white -gravity center -extent ${size}x${size} public/icons/icon-${size}x${size}.png
done
```

---

## Estrutura de Ícones Esperada

```
/public/icons/
├── icon-16x16.png
├── icon-32x32.png
├── icon-72x72.png
├── icon-96x96.png
├── icon-128x128.png
├── icon-144x144.png
├── icon-152x152.png
├── icon-192x192.png
├── icon-384x384.png
├── icon-512x512.png
├── icon-maskable-192x192.png
├── icon-maskable-512x512.png
├── icon-70x70.png (Windows)
├── icon-150x150.png (Windows)
├── icon-310x310.png (Windows)
├── screenshot-540x720.png (Narrow)
└── screenshot-1280x720.png (Wide)
```

---

## Como Usar a PWA

### 1. No Navegador (Desktop/Mobile)
- Abra https://app.vitrii.com.br
- O botão de instalação aparecerá automaticamente
- Clique em "Instalar Agora" ou use o menu do navegador

### 2. Android
**Opção A: Via Navegador**
- Chrome, Edge, ou Firefox
- Menu (⋮) → "Instalar app"
- O app aparecerá na home

**Opção B: Via Google Play (Futura)**
- Pode enviar a PWA para Google Play usando Bubblewrap

### 3. iOS (Safari)
- Abra em Safari
- Toque o botão de compartilhamento (↑)
- Toque "Adicionar à tela inicial"
- O app aparecerá na home

---

## Features do Service Worker

✅ **Offline Support**
- Acessa dados em cache quando offline
- Exibe mensagem apropriada

✅ **Intelligent Caching**
- Static assets: Cache First
- API calls: Network First
- Retira dados cacheados como fallback

✅ **Background Sync**
- Re-sincroniza dados quando conexão volta
- Tag: `sync-data`

✅ **Periodic Background Sync**
- Atualiza conteúdo periodicamente
- Tag: `update-content`

---

## Testar a PWA Localmente

```bash
# Build para produção
npm run build

# Servir com HTTPS (PWA requer HTTPS)
npx http-server dist/spa -p 8080 --cors

# Ou use ngrok para HTTPS
npx ngrok http 8080
```

### Checklist de Teste

- [ ] Service Worker registrado (DevTools > Application > Service Workers)
- [ ] Manifest carregado (DevTools > Application > Manifest)
- [ ] Ícones exibindo (DevTools > Application > Icons)
- [ ] Botão de instalação aparece
- [ ] Funciona offline (Devtools > Network > Offline)
- [ ] Aparece na home do celular após instalar
- [ ] Push notifications funcionam (se implementado)

---

## Performance Tips

### Lighthouse Audit
```bash
# Instale Lighthouse
npm install -D lighthouse

# Execute audit
npx lighthouse https://app.vitrii.com.br --view
```

Mire em:
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90
- PWA: 100 ✓

---

## Updates da App

O Service Worker verifica updates a cada minuto. Quando uma nova versão é disponível:

1. Service Worker baixa a nova versão
2. Mostra notificação para o usuário
3. Usuário pode clicar para atualizar
4. App recarrega com nova versão

---

## Segurança

✅ Service Worker valida URLs de origem
✅ API requests requerem HTTPS
✅ Cache controla expirações (você pode configurar)
✅ Offline fallback seguro

---

## Próximos Passos

1. ✅ Gerar ícones (veja acima)
2. ✅ Testar localmente
3. **Deploy para produção (HTTPS obrigatório)**
4. **Enviar para Google Play (Bubblewrap)**
5. **Submeter para App Store (TestFlight)**

---

## Referências

- [PWA Builder](https://www.pwabuilder.com/)
- [Web.dev PWA](https://web.dev/progressive-web-apps/)
- [MDN Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Google Play PWA](https://github.com/GoogleChromeLabs/bubblewrap)

---

## Troubleshooting

### Service Worker não registra
- Verificar HTTPS em produção
- Verificar console para erros
- Clear cache: `Ctrl+Shift+Delete`

### Manifest não carrega
- Verificar caminho: `/manifest.json`
- Verificar MIME type: `application/manifest+json`
- Validar JSON em https://jsonlint.com/

### Ícones não aparecem
- Confirmar arquivo em `/public/icons/`
- Verificar extensão (deve ser .png)
- Verificar tamanhos: 192x192 e 512x512 mínimo

### Install button não aparece
- PWA requer HTTPS
- Manifest válido
- Service Worker registrado
- Min 2 ícones diferentes tamanhos

