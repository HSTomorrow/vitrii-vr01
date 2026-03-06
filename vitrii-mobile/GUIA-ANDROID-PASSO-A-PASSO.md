# 🚀 GUIA COMPLETO PASSO-A-PASSO: Criar APK Android Vitrii

**Tempo estimado:** 30-45 minutos  
**Dificuldade:** Intermediária  
**Requisitos:** Node.js, npm, conta Expo, conta Google Play (opcional)

---

## 📋 PRÉ-REQUISITOS

### ✅ Verificar se você tem tudo

```bash
# Verificar Node.js
node --version        # Deve ser v16+ (16.0.0 ou maior)

# Verificar npm
npm --version         # Deve ser v8+

# Verificar Node módulos globais
npm list -g expo-cli  # Se tiver: expo (command not found), instale
```

Se Node.js não estiver instalado, baixe em: https://nodejs.org (versão LTS)

---

## 🔑 PASSO 1: Criar Conta Expo (5 minutos)

### 1.1 Acessar o site
- Vá para: https://expo.dev
- Clique em **"Sign Up"** (canto superior direito)

### 1.2 Preencher formulário
```
Email:    seu-email@gmail.com
Username: seu-nome-usuario (ex: vitrii-user)
Password: senha-segura (min 8 caracteres)
```

### 1.3 Confirmar email
- Abra seu email
- Clique no link de confirmação do Expo
- Volta para Expo.dev

### ✅ Pronto! Você tem conta Expo

---

## 💻 PASSO 2: Preparar Seu Computador (10 minutos)

### 2.1 Abrir Terminal/Prompt de Comando

**Windows:**
- Procure por "Prompt de Comando" ou "PowerShell"
- Clique com botão direito → "Executar como administrador"

**Mac:**
- Pressione `Cmd + Space`
- Digite "Terminal" e aperte Enter

**Linux:**
- Procure por "Terminal" ou pressione `Ctrl + Alt + T`

### 2.2 Navegar para o diretório do projeto

```bash
# Mudar para o diretório vitrii-mobile
cd code/vitrii-mobile

# Verificar se estamos no lugar certo (deve mostrar package.json)
ls            # Mac/Linux
dir           # Windows
```

### 2.3 Instalar dependências

```bash
# Instalar todas as dependências do projeto
npm install

# Vai levar 5-10 minutos
# Aparecerão várias linhas com "added XXX packages"
```

**Se receber erro:**
```bash
# Tente limpar cache
npm cache clean --force

# E instale novamente
npm install
```

### ✅ Dependências instaladas!

---

## 🔐 PASSO 3: Login no Expo (5 minutos)

### 3.1 Fazer Login

```bash
# Abrir login do Expo
npx expo login

# Vai pedir:
# ✔ Username or email address: [USUARIO_EXPO]
# ✔ Password: [SUA_SENHA]

# Exemplo:
# ✔ Username or email address: vitrii-user
# ✔ Password: ••••••••
```

### 3.2 Verificar login

```bash
# Confirmar que está logado
npx expo whoami

# Deve retornar seu username
```

### ✅ Você está logado no Expo!

---

## ⚙️ PASSO 4: Inicializar EAS Build (5 minutos)

### 4.1 Instalar EAS CLI

```bash
# Instalar ferramenta de build
npm install -g eas-cli

# Pode demorar 1-2 minutos
```

### 4.2 Inicializar EAS no projeto

```bash
# Iniciar EAS Build
eas init

# Vai fazer perguntas:
# ✔ What would you like your project ID to be? 
#   (pressione Enter para aceitar a sugestão)

# ✔ Would you like to use npm for this project?
#   ✓ Yes, use npm
```

### 4.3 Verificar se funcionou

```bash
# Procurar pelo arquivo criado
ls -la eas.json    # Mac/Linux
dir eas.json       # Windows

# Deve mostrar o arquivo "eas.json" (novo arquivo criado)
```

### ✅ EAS inicializado!

---

## 🔧 PASSO 5: Configurar API Backend (3 minutos)

### 5.1 Abrir arquivo de configuração

No seu editor de código, abra:
```
code/vitrii-mobile/src/services/api.ts
```

### 5.2 Verificar URL da API

Procure pela linha:
```typescript
const API_BASE_URL = 'https://app.vitrii.com.br/api';
```

**Certifique-se que:**
- ✅ Começa com `https://` (seguro)
- ✅ Aponta para seu backend correto
- ✅ Termina com `/api`

Se precisar mudar:
```typescript
// Exemplo: se seu backend está em outro lugar
const API_BASE_URL = 'https://seu-dominio.com/api';
```

### ✅ API configurada!

---

## 🧪 PASSO 6: Testar Localmente com Expo Go (OPCIONAL - 10 minutos)

### 6.1 Instalar Expo Go no seu celular

**Android:**
- Abra Google Play Store
- Procure por "Expo Go"
- Clique em "Instalar"

**iPhone:**
- Abra App Store
- Procure por "Expo Go"
- Clique em "Obter"

### 6.2 Iniciar servidor de desenvolvimento

```bash
# No terminal, na pasta vitrii-mobile
npm start

# Vai mostrar:
# ✔ Expo server running on http://localhost:19000
# Scan the QR code below with Expo Go
```

### 6.3 Escanear QR Code

1. Abra o Expo Go no seu celular
2. Clique em "Scan QR Code"
3. Aponte a câmera para o código QR no terminal
4. Espere carregar (30-60 segundos)

### 6.4 Testar o app

- Você deve ver a tela de login do Vitrii
- Teste navegação, login, etc.

**Se tudo funcionar:** parabéns! Seu app está pronto para build.

**Se algo não funcionar:** pressione `Ctrl + C` no terminal e vá para Passo 7.

### ✅ App testado localmente!

---

## 📱 PASSO 7: Fazer Build do Android (15 minutos)

### 7.1 Preparar para build

```bash
# Limpar cache Expo
npx expo prebuild --clean

# Vai fazer download de dependências nativas
# Isso pode demorar 5-10 minutos
```

### 7.2 Fazer build da APK

```bash
# Iniciar build na nuvem Expo (EAS)
npm run build:android

# OU comando equivalente:
# eas build --platform android --profile preview

# Vai mostrar:
# ℹ  Using remote build service
# ✔ Logging in...
# ✔ Creating Android app...
# 📦 Build queued...
```

### 7.3 Monitorar o progresso

**Opção 1: No terminal**
```bash
# Continuar monitorando no mesmo terminal
# Você verá atualizações conforme a build progride
```

**Opção 2: Na web**
- Abra: https://expo.dev/builds
- Veja o progresso em tempo real
- Pode demorar **10-20 minutos**

### 7.4 Quando estiver pronto

```
# Quando terminar, você verá:
✔ Build finished
📥 Your APK is ready: https://...
```

### ✅ APK criada!

---

## 📥 PASSO 8: Baixar e Instalar a APK (5 minutos)

### 8.1 Copiar link de download

```bash
# No terminal, você verá algo como:
# Download URL: https://storage.googleapis.com/expo-builds/...apk

# Copie essa URL
```

### 8.2 Baixar no seu computador

1. Cole o link no navegador
2. A APK vai baixar em `Downloads/`
3. Espere terminar (pode ser 100-200 MB)

### 8.3 Transferir para o celular Android

**Opção 1: Cabo USB**
```bash
# Conectar celular com cabo USB
# Arquivo: Downloads/vitrii.apk
# Copiar para celular (qualquer pasta)
```

**Opção 2: Via Email**
- Envie o arquivo APK para si mesmo
- Abra no celular
- Clique para instalar

**Opção 3: Via WhatsApp**
- Envie para si mesmo no WhatsApp
- Abra no celular
- Clique para instalar

### 8.4 Instalar no celular

1. No celular, procure pelo arquivo `vitrii.apk`
2. Clique para abrir
3. Clique em "Instalar"
4. Aguarde conclusão

**Aviso de segurança:**
- Se receber "Aplicativo não verificado"
- Clique em "Instalar assim mesmo" ou "Detalhes → Instalar"

### ✅ App instalado no celular!

---

## 🧪 PASSO 9: Testar o App (5 minutos)

### 9.1 Abrir o app

1. Procure pelo ícone do Vitrii na tela inicial
2. Clique para abrir
3. Espere carregar

### 9.2 Testes básicos

- [ ] Tela de login aparece?
- [ ] Consegue digitar email e senha?
- [ ] Consegue fazer login?
- [ ] Consegue navegar entre abas (Home, Search, Publish, etc)?
- [ ] Consegue voltar/navegar?
- [ ] Consegue fazer logout?

**Se tudo funcionar:** parabéns! 🎉

**Se algo não funcionar:**
```bash
# Verificar logs
npm start

# Ou entrar em contato com suporte
```

### ✅ App testado e funcionando!

---

## 🎉 PARABÉNS!

Você construiu com sucesso um app Android nativo do Vitrii!

### O que você conseguiu:

✅ Conta Expo criada  
✅ Projeto configurado  
✅ APK gerada  
✅ App instalado no celular  
✅ App testado e funcionando  

### Próximos passos (OPCIONAL):

1. **Melhorar ícones e splash screens**
   - Editar `assets/icon.png` (192x192)
   - Editar `assets/splash.png` (1170x2340)
   - Rebuild: `npm run build:android`

2. **Publicar na Google Play Store**
   - Criar conta Google Play Developer ($25)
   - Fazer build de produção: `eas build --platform android --profile production`
   - Fazer upload no Google Play Console

3. **Adicionar mais features**
   - Câmera para fotografias
   - QR Code scanner
   - Mapas
   - Notificações push

---

## 🆘 TROUBLESHOOTING

### Erro: "npm not found"
```bash
# Reinstale Node.js do site: https://nodejs.org
```

### Erro: "expo command not found"
```bash
# Instale expo globalmente
npm install -g expo-cli
```

### Erro: "Build failed"
```bash
# Tente limpar cache
npx expo prebuild --clean

# E refaça a build
npm run build:android
```

### Erro: "Network error"
```bash
# Verifique conexão de internet
# Espere 5 minutos
# Tente novamente
```

### App não abre
```bash
# Verificar logs:
npm start

# Ou: desinstale e reinstale a APK
```

---

## 📞 SUPORTE

Se tiver dúvidas:
- Expo Docs: https://docs.expo.dev
- React Native Docs: https://reactnative.dev
- Expo Discord: https://chat.expo.dev

**Você consegue! 🚀**
