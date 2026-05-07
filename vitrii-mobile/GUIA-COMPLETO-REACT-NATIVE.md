# 📱 Guia Completo: App React Native com Expo e Backend Express

**Última atualização:** 2026-05-07  
**Versão do Guia:** 2.0  
**Plataformas:** Android 7.0+, iOS 13+

---

## 📋 Índice

1. [Visão Geral da Arquitetura](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Fase 1: Configuração Inicial](#fase-1)
4. [Fase 2: Entender o Backend](#fase-2)
5. [Fase 3: Configurar Conexão com API](#fase-3)
6. [Fase 4: Estrutura de Pastas](#fase-4)
7. [Fase 5: Autenticação](#fase-5)
8. [Fase 6: Telas Principais](#fase-6)
9. [Fase 7: Testar Localmente](#fase-7)
10. [Fase 8: Build Android](#fase-8)
11. [Fase 9: Build iOS](#fase-9)
12. [Troubleshooting](#troubleshooting)

---

## 🏗️ Visão Geral da Arquitetura {#visão-geral}

```
┌─────────────────────────────────────────────────────────┐
│                    React Native App                      │
│                  (iOS + Android - Expo)                 │
├─────────────────────────────────────────────────────────┤
│  ✅ Navegação: React Navigation (Tabs + Stack)          │
│  ✅ Estado: Context API + AsyncStorage                  │
│  ✅ HTTP: Axios (comunicação com backend)               │
│  ✅ Autenticação: JWT (token no AsyncStorage)           │
├─────────────────────────────────────────────────────────┤
│                  Backend Express (Node.js)              │
│              (Rodando em localhost ou cloud)            │
├─────────────────────────────────────────────────────────┤
│            Banco de Dados (PostgreSQL/Prisma)           │
└─────────────────────────────────────────────────────────┘
```

### Fluxo de Autenticação

```
1. Usuário entra email/senha na tela de Login
   ↓
2. App envia POST /api/auth/signin ao backend
   ↓
3. Backend valida credenciais e retorna token JWT
   ↓
4. App salva token em AsyncStorage
   ↓
5. Todas requisições posteriores incluem: Authorization: Bearer <token>
   ↓
6. App redireciona para Home (telas autenticadas)
```

---

## ✅ Pré-requisitos {#pré-requisitos}

### Software Necessário

```bash
# Verificar versões instaladas
node --version      # Precisa: 16+
npm --version       # Precisa: 8+
# ou
yarn --version

# Java (para Android)
java -version       # Precisa: 11+

# Android Studio (para emulador - opcional)
# Download: https://developer.android.com/studio
```

### Instalar Node.js

Se não tem Node.js:
- **Windows**: https://nodejs.org/
- **Mac**: `brew install node`
- **Linux**: `sudo apt-get install nodejs npm`

### Instalar Java (para Android)

```bash
# Mac
brew install openjdk@11

# Linux
sudo apt-get install openjdk-11-jdk

# Windows
# Download: https://www.oracle.com/java/technologies/downloads/
```

---

## 🚀 Fase 1: Configuração Inicial {#fase-1}

### Passo 1.1: Entrar na pasta do projeto

```bash
cd code/vitrii-mobile
```

### Passo 1.2: Limpar e reinstalar dependências

```bash
# Remover node_modules e lock files (limpa tudo)
rm -rf node_modules
rm -rf .expo
rm package-lock.json

# Instalar dependências (vai levar 2-3 minutos)
npm install

# Se tiver problemas, tente:
npm install --legacy-peer-deps
```

### Passo 1.3: Criar conta Expo (se não tiver)

```bash
# Ir para https://expo.dev e criar conta GRATUITA

# Depois fazer login no terminal
npx expo login

# Ou se quiser usar sem conta (localmente apenas):
npx expo start
```

### Passo 1.4: Verificar que tudo funciona

```bash
# Isso vai iniciar o dev server
npm start

# Você vai ver:
# ➜  Exporting TypeScript...
# ➜  Metro waiting on exp://192.168.x.x:8081
# 
# Escanear com Expo Go (iOS/Android) ou Pressionar 'i' para iOS / 'a' para Android
```

---

## 📚 Fase 2: Entender o Backend {#fase-2}

Seu backend Express está em `code/server/` e oferece vários endpoints:

### Endpoints de Autenticação (essenciais)

```
POST   /api/auth/signin              # Login
POST   /api/auth/signup              # Cadastro
POST   /api/auth/forgot-password     # Recuperar senha
POST   /api/auth/reset-password      # Resetar senha
GET    /api/auth/verify-email        # Verificar email
```

### Endpoints de Dados (exemplo)

```
GET    /api/anuncios                 # Listar todos anúncios
GET    /api/anuncios/:id             # Detalhe de um anúncio
POST   /api/anuncios                 # Criar novo anúncio
PUT    /api/anuncios/:id             # Atualizar anúncio
```

### Outros endpoints

```
GET    /api/usracessos/:id           # Dados do usuário
GET    /api/mensagens                # Mensagens/chat
POST   /api/conversas                # Criar conversa
GET    /api/upload                   # Upload de fotos
```

**Documentação completa**: Ver `code/server/index.ts`

---

## 🔌 Fase 3: Configurar Conexão com API {#fase-3}

### Passo 3.1: Atualizar URL da API

Abra `code/vitrii-mobile/src/services/api.ts`:

```typescript
import axios from 'axios';

// ⚠️ IMPORTANTE: Atualizar para seu backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Em produção (depois):
// const API_BASE_URL = 'https://seu-dominio.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Adicionar token ao header (será chamado automaticamente)
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### Passo 3.2: Atualizar arquivo `.env`

Crie arquivo `.env` na raiz de `code/vitrii-mobile/`:

```
# EXPO_PUBLIC_ prefix é obrigatório para expor variáveis ao app
EXPO_PUBLIC_API_URL=http://localhost:3000/api

# Em desenvolvimento no emulador Android:
# EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api

# Em desenvolvimento no simulador iOS:
# EXPO_PUBLIC_API_URL=http://localhost:3000/api

# Em produção:
# EXPO_PUBLIC_API_URL=https://seu-backend-production.com/api
```

### Passo 3.3: Atualizar `api.ts` para usar variáveis de ambiente

```typescript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

console.log('🔌 API conectando em:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Interceptor para adicionar token automaticamente
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

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      await AsyncStorage.removeItem('authToken');
      // Redirecionar para login (será tratado no AuthContext)
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## 📁 Fase 4: Estrutura de Pastas {#fase-4}

Organize seu projeto desta forma:

```
vitrii-mobile/
├── src/
│   ├── screens/                  # Telas (componentes página)
│   │   ├── LoginScreen.tsx
│   │   ├── SignUpScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── SearchScreen.tsx
│   │   ├── PublishScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   ├── ChatScreen.tsx
│   │   └── AnuncioDetailScreen.tsx
│   │
│   ├── components/               # Componentes reutilizáveis
│   │   ├── AnuncioCard.tsx       # Card de anúncio
│   │   ├── LoadingSpinner.tsx
│   │   ├── ErrorMessage.tsx
│   │   └── ...
│   │
│   ├── services/                 # Serviços (API calls)
│   │   ├── api.ts                # Configuração Axios
│   │   ├── authService.ts        # Login/Signup
│   │   ├── anunciosService.ts    # Anúncios API
│   │   ├── chatService.ts        # Chat API
│   │   └── ...
│   │
│   ├── contexts/                 # Context API
│   │   ├── AuthContext.tsx       # Autenticação global
│   │   ├── AnunciosContext.tsx   # Estado de anúncios
│   │   └── ...
│   │
│   ├── types/                    # TypeScript types
│   │   ├── index.ts              # Types globais
│   │   └── ...
│   │
│   ├── constants/                # Constantes
│   │   ├── colors.ts
│   │   ├── strings.ts
│   │   └── ...
│   │
│   └── utils/                    # Funções utilitárias
│       ├── formatters.ts
│       ├── validators.ts
│       └── ...
│
├── app.json                      # Configuração Expo
├── package.json
├── .env                          # Variáveis de ambiente
└── tsconfig.json
```

---

## 🔐 Fase 5: Autenticação {#fase-5}

### Passo 5.1: Criar Service de Autenticação

Crie `src/services/authService.ts`:

```typescript
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LoginResponse {
  usuario: {
    id: number;
    email: string;
    nome: string;
  };
  token: string;
}

interface SignUpData {
  email: string;
  senha: string;
  nome: string;
  telefonePrincipal: string;
}

export const authService = {
  // Login
  login: async (email: string, senha: string): Promise<LoginResponse> => {
    try {
      const response = await api.post<LoginResponse>('/auth/signin', {
        email,
        senha,
      });
      
      // Salvar token localmente
      if (response.data.token) {
        await AsyncStorage.setItem('authToken', response.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.data.usuario));
      }
      
      return response.data;
    } catch (error) {
      throw new Error('Erro ao fazer login. Verifique email e senha.');
    }
  },

  // Signup
  signup: async (data: SignUpData): Promise<LoginResponse> => {
    try {
      const response = await api.post<LoginResponse>('/auth/signup', data);
      
      // Salvar token
      if (response.data.token) {
        await AsyncStorage.setItem('authToken', response.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.data.usuario));
      }
      
      return response.data;
    } catch (error) {
      throw new Error('Erro ao criar conta. Tente outro email.');
    }
  },

  // Logout
  logout: async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  },

  // Recuperar senha
  forgotPassword: async (email: string) => {
    try {
      await api.post('/auth/forgot-password', { email });
    } catch (error) {
      throw new Error('Erro ao recuperar senha. Tente novamente.');
    }
  },

  // Resetar senha
  resetPassword: async (token: string, novaSenha: string) => {
    try {
      await api.post('/auth/reset-password', {
        token,
        novaSenha,
      });
    } catch (error) {
      throw new Error('Erro ao resetar senha.');
    }
  },
};
```

### Passo 5.2: Criar Context de Autenticação

Crie `src/contexts/AuthContext.tsx`:

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';

interface User {
  id: number;
  email: string;
  nome: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  
  // Métodos
  login: (email: string, senha: string) => Promise<void>;
  signup: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verificar se já está logado ao iniciar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('authToken');
        const storedUser = await AsyncStorage.getItem('user');
        
        if (storedToken && storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, senha: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login(email, senha);
      setUser(response.usuario);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.signup(data);
      setUser(response.usuario);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    setError(null);
    try {
      await authService.forgotPassword(email);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      error,
      login,
      signup,
      logout,
      forgotPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para usar contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};
```

---

## 🎨 Fase 6: Telas Principais {#fase-6}

### Exemplo: Tela de Login

Crie `src/screens/LoginScreen.tsx`:

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
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !senha) {
      Alert.alert('Erro', 'Email e senha são obrigatórios');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, senha);
      // Se conseguir, o contexto redireciona automaticamente
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vitrii</Text>
      <Text style={styles.subtitle}>Marketplace</Text>

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
        placeholder="Senha"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
        editable={!isLoading}
      />

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Entrar</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
        <Text style={styles.link}>Não tem conta? Cadastre-se</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#025CB6',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: '#999',
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
    color: '#025CB6',
  },
});
```

---

## 🧪 Fase 7: Testar Localmente {#fase-7}

### Passo 7.1: Iniciar servidor backend

```bash
# Em um terminal, na raiz do projeto
cd code
npm run dev

# Você deve ver:
# ✓ TypeScript compiled
# ✓ Dev server running at: http://localhost:8080
```

### Passo 7.2: Iniciar app React Native

```bash
# Em outro terminal
cd code/vitrii-mobile
npm start

# Você vai ver:
# ➜  Metro waiting on exp://192.168.x.x:8081
# 
# Pressionar 'a' para Android (emulador)
# Pressionar 'i' para iOS (simulador - somente Mac)
# Pressionar 'w' para web
```

### Passo 7.3: Testar no Emulador Android

Opção A: **Usando Emulador (recomendado)**

```bash
# Abrir Android Studio e abrir emulador (virtualmente um celular)
# Depois pressionar 'a' no terminal do Metro

# Você deve ver a app carregando
```

Opção B: **Usando seu celular real**

```bash
# 1. Instalar Expo Go (app gratuito)
#    - Google Play: https://play.google.com/store/apps/details?id=host.exp.exponent

# 2. Seu celular e computador precisam estar na mesma rede WiFi

# 3. No terminal, ele vai mostrar um QR code
#    Escanear com Expo Go

# 4. App vai carregar no seu celular!
```

### Passo 7.4: Testar Login

1. Usuário de teste (deve estar no banco):
   ```
   Email: test@example.com
   Senha: senha123
   ```

2. Ou criar novo usuário em Sign Up

3. Ao fazer login com sucesso:
   - Token é salvo em AsyncStorage
   - App redireciona para Home
   - Navegar entre abas deve funcionar

---

## 📦 Fase 8: Build Android {#fase-8}

### Passo 8.1: Instalar EAS CLI (uma vez)

```bash
npm install -g eas-cli

# Ou usar npx
npx eas-cli --version
```

### Passo 8.2: Configurar projeto EAS

```bash
cd code/vitrii-mobile

# Isso vai criar eas.json e pedir confirmação
eas init

# Escolher: Create a new project
# Nome do projeto: vitrii
```

### Passo 8.3: Preparar app.json

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
    "ios": {
      "supportsTabletMode": true,
      "bundleIdentifier": "com.herestomorrow.vitrii",
      "buildNumber": "1"
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
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-image-picker",
      "expo-camera",
      "expo-location"
    ],
    "extra": {
      "eas": {
        "projectId": "seu-project-id-aqui"
      }
    }
  }
}
```

### Passo 8.4: Build Preview (para testar no seu celular)

```bash
cd code/vitrii-mobile

# Build para Android (preview)
eas build --platform android --profile preview

# Isso vai:
# 1. Fazer upload do código para Expo
# 2. Compilar na nuvem (leva 10-15 minutos)
# 3. Retornar link para baixar APK
# 4. Você escaneia e instala no celular

# Durante o build, você pode ver status:
eas build --platform android --status
```

### Passo 8.5: Build Production (para Google Play)

```bash
eas build --platform android --profile production

# Mesmo processo, mas gera APK/AAB otimizado para publicação
```

---

## 🍎 Fase 9: Build iOS {#fase-9}

### ⚠️ Pré-requisito: Mac com Xcode

Se não tem Mac, pule esta seção. iOS só pode ser buildado em Mac.

### Passo 9.1: Criar Apple Developer Account

1. Ir para https://developer.apple.com
2. Pagar $99/ano (subscrição anual)
3. Criar "App ID" e provisioning profiles
4. Configurar no Xcode

### Passo 9.2: Build para testflight

```bash
cd code/vitrii-mobile

# Build iOS (preview para TestFlight)
eas build --platform ios --profile preview

# Isso vai:
# 1. Compilar na nuvem (15-30 minutos)
# 2. Gerar .ipa file
# 3. Você pode distribuir via TestFlight para testers
```

### Passo 9.3: Build Production (App Store)

```bash
eas build --platform ios --profile production

# Depois submeter via Transporter ou Xcode
eas submit --platform ios
```

---

## 🔧 Troubleshooting {#troubleshooting}

### "Metro has encountered an error: ...tried to find type definition"

**Solução:**
```bash
cd code/vitrii-mobile
rm -rf node_modules .expo
npm install --legacy-peer-deps
npm start
```

### "Can't find variable: process" ou "Can't find __dirname"

**Causa:** Código do Node.js rodando no React Native  
**Solução:** Não usar `process.env` diretamente. Use `EXPO_PUBLIC_` prefix:

```typescript
// ❌ ERRADO
const url = process.env.API_URL;

// ✅ CORRETO
const url = process.env.EXPO_PUBLIC_API_URL;
```

### API retorna "cors" error

**Solução:** Certificar que backend tem CORS habilitado:

```typescript
// Em code/server/index.ts
app.use(cors());
```

### "Network request failed" ao conectar ao backend

**Se está no emulador Android:**
```
# Use 10.0.2.2 em vez de localhost
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api
```

**Se está no simulador iOS:**
```
# Use localhost normalmente
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

**Se está em um celular real:**
```
# Use o IP da máquina (ex: 192.168.1.100)
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000/api

# Descobrir IP:
# Mac/Linux: ifconfig | grep inet
# Windows: ipconfig
```

### "Permission denied" ao fazer build

```bash
# Android
eas build --platform android --clean

# iOS
eas build --platform ios --clean
```

### App carrega mas não consegue fazer login

Checklist:
1. ✅ Backend está rodando? `npm run dev` em `code/`
2. ✅ URL da API está correta em `.env`?
3. ✅ Usuário existe no banco?
4. ✅ Verificar logs: `adb logcat` (Android) ou Xcode (iOS)

---

## 📱 Testando em Diferentes Dispositivos

### Emulador Android (sem celular real)

```bash
# 1. Instalar Android Studio: https://developer.android.com/studio

# 2. Criar virtual device em Android Studio > Device Manager

# 3. Rodar emulador:
emulator -avd Pixel_6_API_35

# 4. No terminal da app:
npm start
# Pressionar 'a'
```

### Simulador iOS (somente Mac)

```bash
npm start
# Pressionar 'i'
```

### Celular Real Android

```bash
# 1. Conectar USB
# 2. Ativar "Desenvolvedor" em Configurações > Sobre > Compilação
# 3. Ativar "Depuração USB"
# 4. No terminal:
npm start
# Escanear QR code com Expo Go
```

### Celular Real iOS

```bash
# 1. Instalar Expo Go
# 2. Mesmo WiFi que computador
# 3. Escanear QR code
```

---

## 🚀 Próximos Passos

1. ✅ Completar telas (Search, Publish, Chat, Profile)
2. ✅ Integrar todos endpoints do backend
3. ✅ Adicionar validação de formulários
4. ✅ Implementar upload de fotos
5. ✅ Adicionar notificações push
6. ✅ Testes (Jest + React Native Testing Library)
7. ✅ Publicar no Google Play e App Store

---

## 📚 Recursos Úteis

- **Docs Expo:** https://docs.expo.dev
- **React Native:** https://reactnative.dev
- **React Navigation:** https://reactnavigation.org
- **Axios:** https://axios-http.com
- **Comunidade Expo:** https://forums.expo.dev

---

## ❓ Dúvidas?

Se tiver dúvidas durante os passos, verifique:

1. Logs do console: `npm start` mostra mensagens de erro
2. Docs oficiais (links acima)
3. GitHub Issues do Expo: https://github.com/expo/expo/issues

**Boa sorte! 🚀**
