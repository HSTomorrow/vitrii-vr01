# ⚡ Dicas Rápidas e Troubleshooting

---

## 🚀 Antes de Começar

### Verificação Rápida (1 minuto)

```bash
# Verificar que tudo está instalado
node -v      # Deve ser 16+
npm -v       # Deve ser 8+
java -version # Deve ser 11+
```

### Primeira Execução

```bash
cd code/vitrii-mobile

# 1. Instalar dependências
npm install

# 2. Iniciar dev server
npm start

# 3. Pressionar 'a' para Android ou 'i' para iOS
```

---

## 📱 Testando em Diferentes Ambientes

### No Emulador Android

```bash
# Abrir Android Studio e criar emulador

# Depois rodar:
npm start
# Pressionar 'a'
```

**URL da API para emulador:**
```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api
```
(10.0.2.2 = localhost no emulador)

### No Simulador iOS (Mac apenas)

```bash
npm start
# Pressionar 'i'
```

**URL da API no simulador:**
```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

### No Celular Real (Expo Go)

```bash
# 1. Instalar Expo Go app:
# - iOS: App Store
# - Android: Google Play

# 2. Seu celular e computador no mesmo WiFi

# 3. Obter IP local:
ifconfig | grep inet          # Mac/Linux
ipconfig getifaddr en0        # Mac alternativo

# 4. Criar .env com seu IP:
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000/api

# 5. Rodar:
npm start

# 6. Escanear QR code com Expo Go
```

---

## 🔌 Problemas de Conexão com API

### ❌ "Network request failed"

**Checklist:**

1. **Backend está rodando?**
   ```bash
   # Em outro terminal
   cd code
   npm run dev
   
   # Deve mostrar: ✓ Dev server running at: http://localhost:8080
   ```

2. **URL da API está correta?**
   - Verificar `.env` tem `EXPO_PUBLIC_API_URL` definido
   - Certificar que é `http://localhost:3000/api` (DEV)

3. **Backend em HTTPS ou HTTP?**
   - Para produção: HTTPS (https://...)
   - Para desenvolvimento: HTTP (http://...)

4. **Firewall está bloqueando?**
   - Mac: Configurações > Segurança > Firewall
   - Windows: Windows Defender Firewall

5. **Testando manualmente:**
   ```bash
   # Terminal - testar se API responde
   curl http://localhost:3000/api/ping
   
   # Deve retornar: {"message":"ping"}
   ```

### ❌ "Cross-Origin Request Blocked"

**Causa:** CORS não habilitado no backend

**Solução:** Verificar que `server/index.ts` tem:
```typescript
import cors from 'cors';

app.use(cors());
```

### ❌ App conecta mas Login falha

1. **Verificar se usuário existe no banco**
   ```bash
   # Verificar database conectado:
   curl http://localhost:3000/api/db-test
   ```

2. **Verificar credenciais**
   - Email e senha devem estar exatos
   - Verificar se usuário está ativado

3. **Ver logs do backend**
   ```bash
   # No terminal onde rodou npm run dev
   # Ver mensagens de erro
   ```

---

## 🔐 Problemas de Autenticação

### ❌ "Invalid token" ou Token expirado

**Solução:**
```typescript
// Em AuthContext.tsx, adicionar:
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token inválido - fazer logout
      await AsyncStorage.removeItem('authToken');
      // App redireciona para Login
    }
    return Promise.reject(error);
  }
);
```

### ❌ "AsyncStorage is undefined"

**Causa:** AsyncStorage não importado corretamente

**Solução:**
```typescript
// ✅ CORRETO
import AsyncStorage from '@react-native-async-storage/async-storage';

// ❌ ERRADO
import AsyncStorage from 'AsyncStorage';
```

### ❌ Login funciona mas não navega para Home

**Verificar:**
1. AuthContext está retornando user?
2. RootNavigator verifica `user` corretamente?
3. Tela de Home existe?

```typescript
// Adicionar debug
useEffect(() => {
  console.log('🔍 User state:', user);
  console.log('🔍 IsLoading:', isLoading);
}, [user, isLoading]);
```

---

## 📦 Problemas de Build

### ❌ "Metro has encountered an error"

**Solução rápida:**
```bash
cd code/vitrii-mobile

# 1. Limpar cache Metro
rm -rf node_modules .expo
npm install

# 2. Reiniciar
npm start
```

### ❌ "Couldn't find "tsconfig.json""

**Solução:** Certificar que está na pasta correta
```bash
# Deve estar em code/vitrii-mobile/
cd code/vitrii-mobile
ls tsconfig.json  # Deve existir
```

### ❌ "Cannot find module '@react-native-async-storage'"

**Solução:**
```bash
npm install @react-native-async-storage/async-storage
```

### ❌ Build EAS falha

```bash
# Limpar cache EAS
eas build --platform android --clean

# Ou reset completo
rm -rf node_modules .expo
npm install
eas build --platform android
```

---

## 🎨 Problemas de UI

### ❌ Estilos não funcionam

React Native **não usa CSS**. Usa StyleSheet:

```typescript
// ❌ ERRADO
<View style="padding: 10px">

// ✅ CORRETO
<View style={styles.container}>

const styles = StyleSheet.create({
  container: {
    padding: 10,
  }
});
```

### ❌ Layout desalinhado em alguns celulares

**Usar flexbox corretamente:**
```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

### ❌ Texto cortado ou estouro de linha

```typescript
// ✅ Usar numberOfLines e ellipsizeMode
<Text 
  numberOfLines={1}
  ellipsizeMode="tail"
  style={{maxWidth: 200}}
>
  Texto muito longo
</Text>
```

---

## 🐛 Debugging

### Ver Logs do App

```bash
# Android (em novo terminal)
adb logcat | grep ReactNativeJS

# iOS (no Xcode)
# View > Debug Area > Show Console
```

### Adicionar console.log em toda parte

```typescript
// No serviço de API
console.log('📡 Enviando:', url, data);

// No Context
console.log('🔍 Estado atualizado:', state);

// Na Screen
console.log('📱 Componente montado');
```

### React Developer Tools

```bash
# Para web (npm run web)
# Abrir DevTools do navegador (F12)
```

### Expo DevTools

```bash
# Shake device para abrir menu
# Ou pressionar 'j' no terminal
```

---

## ⚡ Dicas de Performance

### 1. Usar FlatList em vez de ScrollView para listas

```typescript
// ✅ CORRETO - renderiza apenas itens visíveis
<FlatList
  data={anuncios}
  renderItem={({item}) => <AnuncioCard {...item} />}
  keyExtractor={item => item.id.toString()}
/>

// ❌ LENTO - renderiza tudo
<ScrollView>
  {anuncios.map(item => <AnuncioCard key={item.id} />)}
</ScrollView>
```

### 2. Memoizar componentes pesados

```typescript
export default React.memo(AnuncioCard);
```

### 3. Lazy load imagens

```typescript
Image.prefetch(imageUrl).then(() => {
  // Imagem carregada na memória
});
```

### 4. Usar InteractionManager para operações longas

```typescript
import { InteractionManager } from 'react-native';

const handleUpload = () => {
  InteractionManager.runAfterInteractions(() => {
    // Operação pesada após UI pronta
    heavyComputation();
  });
};
```

---

## 📋 Checklist Antes de Publicar

### Preparação da App

- [ ] Todas telas funcionam
- [ ] Login/Logout funciona
- [ ] API conecta corretamente
- [ ] Sem console.log de debug
- [ ] Versão incrementada em app.json
- [ ] Ícone 512x512px
- [ ] Splash 1200x1200px

### Android Específico

- [ ] `package` correto: `com.herestomorrow.vitrii`
- [ ] `versionCode` incrementado
- [ ] `targetSdkVersion` 35
- [ ] `minSdkVersion` 24
- [ ] Permissões em `app.json`
- [ ] Testado em múltiplos tamanhos de tela

### iOS Específico (Mac)

- [ ] `bundleIdentifier` correto
- [ ] `buildNumber` incrementado
- [ ] Icon 1024x1024px
- [ ] Certificados Apple atualizados

### Segurança

- [ ] API URL em HTTPS (produção)
- [ ] Sem dados sensíveis em código
- [ ] Sem tokens hardcoded
- [ ] CORS configurado corretamente

---

## 🆘 Dúvidas Comuns

### "Como adicionar permissão de câmera?"

```json
{
  "android": {
    "permissions": ["android.permission.CAMERA"]
  }
}
```

### "Como usar geolocalização?"

```typescript
import * as Location from 'expo-location';

const getLocation = async () => {
  const location = await Location.getCurrentPositionAsync({});
  console.log(location.coords);
};
```

### "Como fazer upload de fotos?"

```typescript
import * as ImagePicker from 'expo-image-picker';

const pickImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync();
  if (!result.cancelled) {
    // Enviar result.uri ao backend
  }
};
```

### "Como adicionar notificações push?"

```bash
npm install expo-notifications
```

```typescript
import * as Notifications from 'expo-notifications';

await Notifications.scheduleNotificationAsync({
  content: {
    title: 'Título',
    body: 'Corpo da notificação',
  },
  trigger: { seconds: 5 },
});
```

---

## 📞 Suporte Rápido

| Problema | Solução Rápida |
|----------|---|
| Não consegue conectar | `npm start` em DEV; verificar URL |
| Login não funciona | Usuário existe? Backend rodando? |
| Build falha | `rm -rf node_modules && npm install` |
| App travado/congelado | Ver logs com `adb logcat` |
| Erro de permissão | Adicionar em `app.json` android.permissions |
| Estilos errados | Usar `StyleSheet.create()` não CSS |
| TypeScript errors | `npm run typecheck` para ver todos |

---

## 🎓 Recursos de Aprendizado

- **Docs React Native:** https://reactnative.dev
- **Docs Expo:** https://docs.expo.dev
- **React Navigation:** https://reactnavigation.org
- **Axios:** https://axios-http.com
- **TypeScript:** https://www.typescriptlang.org

---

## 🎉 Você Conseguiu!

Se chegou aqui, conseguiu entender toda a arquitetura e está pronto para:

✅ Desenvolver o app React Native  
✅ Conectar com seu backend  
✅ Testar localmente  
✅ Fazer build para Android/iOS  
✅ Publicar nas lojas  

**Próximo passo:** Seguir o CHECKLIST-PRATICO.md fase por fase.

---

**Boa sorte! 🚀**
