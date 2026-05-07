# ✅ Checklist Prático - Fase por Fase

Este documento é um **checklist executável** que você pode seguir para levantar o app passo-a-passo.

---

## 🎯 FASE 1: Setup Inicial (30 minutos)

### [ ] 1.1 Verificar dependências

```bash
# Abra um terminal na pasta raiz (code/)
node --version        # Deve ser 16+
npm --version         # Deve ser 8+
java -version         # Deve ser 11+
```

**Resultado esperado:**
```
v18.17.0              (Node)
9.6.7                 (npm)
openjdk version "11"  (Java)
```

### [ ] 1.2 Limpar e instalar dependências

```bash
cd code/vitrii-mobile

# Remover tudo antigo
rm -rf node_modules .expo package-lock.json

# Instalar novamente
npm install
```

**⏱️ Tempo:** 2-3 minutos  
**Resultado:** `added X packages in X seconds`

### [ ] 1.3 Criar conta Expo (uma vez)

```bash
# Ir para https://expo.dev e criar conta (GRATUITA)
# Depois fazer login

npx expo login
# Pedir email/senha
```

### [ ] 1.4 Verificar que funciona

```bash
npm start

# Você deve ver:
# ✓ Exporting TypeScript...
# ✓ Metro waiting on exp://192.168.x.x:8081
# 
# Pressione 'a' para Android, 'i' para iOS, 'w' para web
```

**✅ Status:** Pronto para próxima fase

---

## 🔌 FASE 2: Conectar ao Backend (20 minutos)

### [ ] 2.1 Verificar que backend está rodando

Em **um outro terminal**, rode:

```bash
cd code
npm run dev

# Deve mostrar:
# ✓ Dev server running at: http://localhost:8080
```

### [ ] 2.2 Criar arquivo `.env`

Na pasta `code/vitrii-mobile/`, crie arquivo `.env`:

```bash
# DESENVOLVIMENTO (localhost)
EXPO_PUBLIC_API_URL=http://localhost:3000/api

# Se está usando emulador Android (10.0.2.2 = localhost do emulador)
# EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api

# Se está em celular real (trocar IP pela sua máquina)
# EXPO_PUBLIC_API_URL=http://192.168.1.100:3000/api

# PRODUÇÃO (depois)
# EXPO_PUBLIC_API_URL=https://seu-backend-production.com/api
```

### [ ] 2.3 Atualizar `src/services/api.ts`

Abra o arquivo e atualize para usar a variável de ambiente:

```typescript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Usar variável de ambiente
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

console.log('🔌 API conectando em:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Adicionar token automaticamente em cada requisição
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Erro ao obter token:', error);
  }
  return config;
});

// Tratar erros (como token expirado)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token inválido ou expirado
      await AsyncStorage.removeItem('authToken');
    }
    return Promise.reject(error);
  }
);

export default api;
```

### [ ] 2.4 Testar conexão

```bash
# No terminal da app (onde rodou npm start)
# Pressionar 'a' para Android ou 'i' para iOS

# Na tela você deve ver:
# "🔌 API conectando em: http://localhost:3000/api"
# (ou o valor que colocou no .env)
```

**✅ Status:** Backend conectado!

---

## 🔐 FASE 3: Autenticação (40 minutos)

### [ ] 3.1 Criar `src/services/authService.ts`

```bash
# Criar arquivo novo
touch code/vitrii-mobile/src/services/authService.ts
```

Copiar conteúdo do guia (seção Fase 5, Passo 5.1)

### [ ] 3.2 Criar `src/contexts/AuthContext.tsx`

```bash
touch code/vitrii-mobile/src/contexts/AuthContext.tsx
```

Copiar conteúdo do guia (seção Fase 5, Passo 5.2)

### [ ] 3.3 Atualizar `App.tsx`

Certifique-se que está usando `AuthProvider`:

```typescript
import { AuthProvider } from './src/contexts/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
```

### [ ] 3.4 Testar Login

1. Abra a app no emulador/simulador
2. Vá para tela de Login
3. Tente fazer login com:
   - Email: `test@example.com`
   - Senha: `senha123` (ou um usuário que existe no seu banco)
4. Se conseguir fazer login:
   - ✅ Token é salvo
   - ✅ Navega para Home
   - ✅ Pode navegar entre abas

**Resultado esperado:**
```
Login com sucesso!
→ Navegar para Home
→ Token salvo em AsyncStorage
```

**✅ Status:** Autenticação funcionando!

---

## 🎨 FASE 4: Telas Básicas (1 hora)

### [ ] 4.1 Verificar LoginScreen

Abra `src/screens/LoginScreen.tsx` e certifique-se que:
- ✅ Campos de email/senha
- ✅ Botão "Entrar"
- ✅ Link "Cadastre-se"
- ✅ Chama `login()` do contexto

### [ ] 4.2 Implementar SignUpScreen

Crie `src/screens/SignUpScreen.tsx`:

```typescript
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function SignUpScreen({ navigation }: any) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { signup } = useAuth();

  const handleSignUp = async () => {
    // Validar campos
    if (!nome || !email || !telefone || !senha) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    if (senha !== confirmaSenha) {
      Alert.alert('Erro', 'Senhas não conferem');
      return;
    }

    setIsLoading(true);
    try {
      await signup({
        nome,
        email,
        telefonePrincipal: telefone,
        senha,
      });
      // Se conseguir, o contexto redireciona automaticamente
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Criar Conta</Text>

      <TextInput
        style={styles.input}
        placeholder="Nome Completo"
        value={nome}
        onChangeText={setNome}
        editable={!isLoading}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        editable={!isLoading}
      />

      <TextInput
        style={styles.input}
        placeholder="Telefone"
        value={telefone}
        onChangeText={setTelefone}
        keyboardType="phone-pad"
        editable={!isLoading}
      />

      <TextInput
        style={styles.input}
        placeholder="Senha"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
        editable={!isLoading}
      />

      <TextInput
        style={styles.input}
        placeholder="Confirmar Senha"
        value={confirmaSenha}
        onChangeText={setConfirmaSenha}
        secureTextEntry
        editable={!isLoading}
      />

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleSignUp}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Criar Conta</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Já tem conta? Faça login</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#025CB6',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 14,
  },
  button: {
    backgroundColor: '#025CB6',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  link: {
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 40,
    color: '#025CB6',
  },
});
```

### [ ] 4.3 Implementar HomeScreen básico

Crie `src/screens/HomeScreen.tsx`:

```typescript
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function HomeScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const [anuncios, setAnuncios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    carregarAnuncios();
  }, []);

  const carregarAnuncios = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/anuncios');
      setAnuncios(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar anúncios:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Bem-vindo, {user?.nome}!</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutButton}>Sair</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#025CB6" />
      ) : (
        <FlatList
          data={anuncios}
          keyExtractor={(item: any) => item.id.toString()}
          renderItem={({ item }: any) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('AnuncioDetail', { id: item.id })}
            >
              <Text style={styles.cardTitle}>{item.titulo}</Text>
              <Text style={styles.cardPrice}>R$ {item.preco}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nenhum anúncio encontrado</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutButton: {
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  card: {
    padding: 15,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  cardPrice: {
    fontSize: 12,
    color: '#025CB6',
    marginTop: 5,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
  },
});
```

**✅ Status:** Telas básicas implementadas!

---

## 📱 FASE 5: Testar Completo (30 minutos)

### [ ] 5.1 Iniciar tudo

Abra **3 terminais**:

**Terminal 1 - Backend:**
```bash
cd code
npm run dev
# Deve mostrar: ✓ Dev server running at: http://localhost:8080
```

**Terminal 2 - React Native:**
```bash
cd code/vitrii-mobile
npm start
```

**Terminal 3 - Emulador (opcional):**
```bash
# Se usando Android Studio, abra emulador de lá
# Se usando adb:
emulator -avd Pixel_6_API_35
```

### [ ] 5.2 Testar fluxo completo

1. **Tela inicial → Login**
   - ✅ Campos de email/senha aparecem
   - ✅ Botão "Entrar" visível

2. **Fazer login com usuário teste**
   - ✅ Email: `test@example.com`
   - ✅ Senha: `senha123`
   - ✅ Botão carregando (spinning loader)
   - ✅ Navega para Home após sucesso

3. **Na Home**
   - ✅ Mostra "Bem-vindo, [nome]!"
   - ✅ Lista de anúncios carrega
   - ✅ Botão "Sair" funciona
   - ✅ Logout retorna para tela de login

4. **Criar nova conta**
   - ✅ Clicar "Cadastre-se"
   - ✅ Preencher formulário
   - ✅ Criar conta com sucesso
   - ✅ Fazer login com nova conta

### [ ] 5.3 Monitorar logs

Se tiver problemas, verificar console:

```bash
# Android (em outro terminal)
adb logcat | grep ReactNativeJS

# iOS (no Xcode)
# Ver "Console" tab
```

**✅ Status:** App funcionando!

---

## 🔨 FASE 6: Preparar para Build (20 minutos)

### [ ] 6.1 Instalar EAS CLI

```bash
npm install -g eas-cli

# Ou usar com npx
eas --version
```

### [ ] 6.2 Configurar projeto EAS

```bash
cd code/vitrii-mobile

# Isso vai criar eas.json e vincular projeto
eas init

# Pedir:
# - Projeto ID Expo (deixar vazio para criar novo)
# - Nome do projeto: vitrii
```

### [ ] 6.3 Criar ícones e splash

Você precisa de 2 imagens:

```
✅ Icon (512x512 px): code/vitrii-mobile/assets/icon.png
✅ Splash (1200x1200 px): code/vitrii-mobile/assets/splash.png
```

Se não tiver:
```bash
# Usar imagens padrão Expo (para desenvolvimento)
# Depois trocar por suas imagens antes de publicar
```

### [ ] 6.4 Atualizar app.json

Abra `code/vitrii-mobile/app.json` e atualize:

```json
{
  "expo": {
    "name": "Vitrii",
    "slug": "vitrii",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.herestomorrow.vitrii",
      "versionCode": 1,
      "minSdkVersion": 24,
      "targetSdkVersion": 35,
      "usesCleartextTraffic": false,
      "permissions": [
        "android.permission.INTERNET",
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE"
      ]
    },
    "ios": {
      "supportsTabletMode": true,
      "bundleIdentifier": "com.herestomorrow.vitrii",
      "buildNumber": "1"
    },
    "extra": {
      "eas": {
        "projectId": "seu-project-id"
      }
    }
  }
}
```

**✅ Status:** Pronto para build!

---

## 📦 FASE 7: Build Android (30 minutos)

### [ ] 7.1 Fazer build preview

```bash
cd code/vitrii-mobile

# Build preview (para testar no seu celular)
eas build --platform android --profile preview

# Isso vai:
# 1. Fazer upload para Expo
# 2. Compilar na nuvem (10-15 minutos)
# 3. Retornar um link com APK para baixar
```

### [ ] 7.2 Acompanhar build

```bash
# Ver status em tempo real
eas build --platform android --status

# Ou abrir link que apareceu no terminal
# Exemplo: https://expo.dev/...
```

### [ ] 7.3 Baixar e testar APK

1. Quando compilação terminar, terá um link para download
2. Baixar arquivo `.apk`
3. Conectar celular via USB
4. Instalar:

```bash
# Se tem adb instalado
adb install seu-app.apk

# Ou clicar no arquivo apk no celular e instalar
```

### [ ] 7.4 Testar no celular real

- ✅ Abrir app
- ✅ Fazer login
- ✅ Navegar abas
- ✅ Testar funcionalidades

**✅ Status:** App rodando no celular!

---

## 🍎 FASE 8: Build iOS (somente Mac)

### ⚠️ Pré-requisito

- Ter Mac com Xcode instalado
- Subscrição Apple Developer ($99/ano)

### [ ] 8.1 Fazer build iOS

```bash
cd code/vitrii-mobile

# Build para TestFlight (preview)
eas build --platform ios --profile preview

# Vai compilar na nuvem (15-30 minutos)
# Gera arquivo .ipa
```

### [ ] 8.2 Testar via TestFlight

1. Quando compilação terminar, receberá link
2. Abrir no iPhone
3. Instalar via TestFlight
4. Testar no dispositivo real

**✅ Status:** iOS funcionando!

---

## 🎉 Checklist Final

Antes de publicar nas lojas:

### Android
- [ ] ✅ Versioncode incrementado
- [ ] ✅ Icon 512x512px
- [ ] ✅ Splash 1200x1200px
- [ ] ✅ API URL HTTPS (em produção)
- [ ] ✅ Testado em celular real
- [ ] ✅ Testado login/logout
- [ ] ✅ Testado navegação completa

### iOS
- [ ] ✅ buildNumber incrementado
- [ ] ✅ bundleIdentifier correto
- [ ] ✅ Icon 1024x1024px
- [ ] ✅ Testado em iPhone real
- [ ] ✅ Testado fluxo completo

---

## 🚨 Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| "Metro error: tried to find type" | `rm -rf node_modules && npm install` |
| "API connection failed" | Verificar `.env` e se backend está rodando |
| "Login não funciona" | Verificar se usuário existe no banco |
| "Build falha" | `eas build --clean --platform android` |
| "App não inicia" | Ver `adb logcat` (Android) ou Xcode console (iOS) |

---

**Sucesso! 🚀**

Se tiver dúvidas, verificar `GUIA-COMPLETO-REACT-NATIVE.md` para mais detalhes.
