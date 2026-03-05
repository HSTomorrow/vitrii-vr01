# Vitrii Mobile App - Setup Completo

## 📱 Projeto React Native com Expo + EAS Build

Este guia mostra como configurar, testar e publicar o aplicativo Vitrii nos iOS e Android.

---

## 🚀 FASE 1: Configuração Inicial

### 1. Pré-requisitos
- Node.js 16+ instalado
- npm ou yarn
- Conta Expo (gratuita em https://expo.dev)
- Conta Google Play (para Android)
- Conta Apple Developer (para iOS)

### 2. Instalar Dependências

```bash
cd code/vitrii-mobile
npm install
# ou
yarn install
```

### 3. Criar Conta Expo e Login

```bash
npx expo signup
# ou se já tem conta
npx expo login
```

### 4. Inicializar EAS Build

```bash
npm install -g eas-cli
eas init
```

Este comando vai:
- Pedir seu projeto ID do Expo
- Criar arquivo `eas.json`
- Vincular ao seu projeto Expo

---

## 🔧 FASE 2: Configuração do Backend

### Atualize a URL da API

No arquivo `src/services/api.ts`, atualize:

```typescript
const API_BASE_URL = 'https://seu-backend-aqui.com/api';
```

Certifique-se que seu backend está HTTPS (obrigatório para produção).

---

## 📱 FASE 3: Testar Localmente

### 3.1 No Simulador (iOS) ou Emulador (Android)

```bash
# iOS (requer Mac com Xcode)
npm run ios

# Android
npm run android
```

### 3.2 No Seu Dispositivo (Expo Go)

```bash
npm run web
# ou
npm start
```

Escaneie o QR code com seu dispositivo usando **Expo Go** app (disponível nas lojas).

---

## 🔐 FASE 4: Credenciais para Publicação

### 4.1 Google Play (Android)

1. **Criar Keystore** (apenas uma vez)
```bash
eas build:configure --platform android
```

2. **Preparar conta Google Play**
   - Ir para https://play.google.com/console
   - Criar novo app
   - Adicionar pricing (free)
   - Preencher store listing
   - Aceitar políticas

### 4.2 Apple App Store (iOS)

1. **Criar Apple Developer Account**
   - Ir para https://developer.apple.com
   - Criar "App ID" com Bundle ID: `com.herestomorrow.vitrii`
   - Gerar certificados e provisioning profiles

2. **No Expo, EAS configurará automaticamente**:
```bash
eas build:configure --platform ios
```

---

## 🔨 FASE 5: Build para Publicação

### 5.1 Build Android

```bash
npm run build:android
# ou
eas build --platform android
```

Este comando:
- Compila o app na nuvem
- Gera o APK/AAB
- Coloca em fila para compilação

### 5.2 Build iOS

```bash
npm run build:ios
# ou
eas build --platform ios
```

Aguarde a compilação (pode levar 15-30 minutos).

### 5.3 Ambos

```bash
npm run build:all
```

---

## 📦 FASE 6: Publicar nas Lojas

### 6.1 Google Play Store

1. **Fazer login no Google Play Console**
   - https://play.google.com/console

2. **Enviar seu app**
   - Ir para "Releases" > "Production"
   - Upload do arquivo AAB/APK
   - Preencher detalhes do app (descrição, screenshots, etc)
   - Revisar conteúdo
   - Submeter para review

3. **Tempo de aprovação**: 2-4 horas até alguns dias

### 6.2 Apple App Store

1. **Fazer login no App Store Connect**
   - https://appstoreconnect.apple.com

2. **Criar novo app**
   - Bundle ID: `com.herestomorrow.vitrii`
   - Preencher informações (nome, descrição, screenshots, icon)
   - Adicionar versão

3. **Upload do build**
   - Usar Xcode ou Transporter
   - EAS pode enviar automaticamente com:
   ```bash
   eas submit --platform ios
   ```

4. **Submit for Review**
   - Responder aos "Export Compliance" questions
   - Submeter para review da Apple

5. **Tempo de aprovação**: 24-48 horas (geralmente)

---

## 🔄 FASE 7: Atualizações Futuras

### Atualizar versão

No `app.json`:
```json
{
  "version": "1.0.1",
  "ios": {
    "buildNumber": "2"
  },
  "android": {
    "versionCode": 2
  }
}
```

### Fazer novo build e submeter

```bash
eas build --platform all
eas submit
```

---

## 🐛 Troubleshooting

### Build falha com erro de certificado
```bash
eas build --platform ios --clear-cache
```

### App não se conecta à API
- Verificar se backend está HTTPS
- Verificar firewall/CORS
- Verificar URL da API em `src/services/api.ts`

### Erro de permissões no Android
- Verificar `app.json` > `android.permissions`
- Adicionar permissões obrigatórias

---

## 📋 Checklist Antes de Publicar

### Android
- [ ] `versionCode` incrementado em `app.json`
- [ ] `package` correto: `com.herestomorrow.vitrii`
- [ ] Icon 512x512px em `assets/icon.png`
- [ ] Splash 1200x1200px em `assets/splash.png`
- [ ] API URL confirmada (HTTPS)
- [ ] Testado no emulador Android

### iOS
- [ ] `buildNumber` incrementado em `app.json`
- [ ] `bundleIdentifier` correto
- [ ] Icon 1024x1024px
- [ ] Splash
- [ ] API URL confirmada (HTTPS)
- [ ] Testado no simulador iOS

### Ambos
- [ ] Testar login/logout
- [ ] Testar publicação de anúncio
- [ ] Testar busca
- [ ] Testar chat
- [ ] Geolocalização funcionando
- [ ] Fotos/câmera funcionando

---

## 📚 Recursos Úteis

- Docs Expo: https://docs.expo.dev
- EAS Build: https://docs.expo.dev/eas-update/
- Google Play Publishing: https://play.google.com/console
- Apple App Store: https://appstoreconnect.apple.com
- React Native Docs: https://reactnative.dev

---

## ❓ Dúvidas?

Para suporte:
1. Verificar documentação oficial (links acima)
2. Consultar comunidade Expo: https://forums.expo.dev
3. GitHub Issues do React Native

Sucesso! 🚀
