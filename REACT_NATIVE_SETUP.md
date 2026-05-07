# 📱 Guia Completo: App Android React Native - Vitrii Marketplace

## Visão Geral da Solução

Este guia detalha como criar um aplicativo Android nativo usando React Native (Expo) que compartilha o mesmo backend e banco de dados da aplicação web.

```
Backend Compartilhado (Node.js/Express)
         ↓
    Database PostgreSQL
         ↑
    ┌────┴────┐
    ↓         ↓
 Web App   Mobile App
(React)   (React Native)
```

---

## 🎯 Fase 1: Preparação Inicial (30 minutos)

### Pré-requisitos

**Instalado no Computador:**
- Node.js 18+ com npm/pnpm
- Expo CLI: `npm install -g expo-cli`
- Android Studio (para emulador)
- Java JDK 17+
- Android SDK (API 34+)

**No Projeto:**
- Backend funcional ✅
- Database PostgreSQL ✅
- API endpoints testados ✅

### Estrutura Final

```
projeto/
├── code/
│   ├── server/          (backend - sem mudanças)
│   ├── client/          (web React - sem mudanças)
│   ├── shared/          (tipos e API - compartilhado)
│   └── package.json
│
├── mobile/              (NOVO - React Native)
│   ├── app/             (Expo Router)
│   ├── components/      (componentes mobile)
│   ├── contexts/        (Auth context)
│   ├── services/        (API, storage)
│   ├── app.json         (config Expo)
│   └── eas.json         (build Android)
```

---

## 🚀 Fase 2: Criar Projeto React Native

### Passo 1: Inicializar Projeto

```bash
# Sair da pasta code
cd ../

# Criar novo projeto Expo
npx create-expo-app mobile --template
cd mobile
```

### Passo 2: Instalar Dependências Essenciais

```bash
npm install \
  @react-native-async-storage/async-storage \
  @react-navigation/native \
  @react-navigation/bottom-tabs \
  @react-navigation/native-stack \
  react-native-screens \
  react-native-safe-area-context \
  react-native-gesture-handler \
  expo-router \
  expo-status-bar \
  expo-image-picker \
  expo-secure-store \
  @tanstack/react-query \
  zod \
  axios
```

### Passo 3: Instalar Dependências de UI

```bash
npm install \
  react-native-svg \
  lucide-react-native \
  react-native-vector-icons
```

---

## 📦 Fase 3: Criar Código Compartilhado

### Arquivo: `code/shared/apiClient.ts`

```typescript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

let authToken: string | null = null;
let userId: number | null = null;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  if (userId) {
    config.headers['X-User-Id'] = userId.toString();
  }
  if (authToken) {
    config.headers['Authorization'] = `Bearer ${authToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      setAuth(null, null);
    }
    return Promise.reject(error);
  }
);

export const setAuth = (token: string | null, id: number | null) => {
  authToken = token;
  userId = id;
};

export default apiClient;
```

### Arquivo: `code/shared/authService.ts`

```typescript
import apiClient from './apiClient';
import { z } from 'zod';

export const SignUpSchema = z.object({
  email: z.string().email('Email inválido'),
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  telefone: z.string().optional(),
});

export const SignInSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
});

export interface Usuario {
  id: number;
  email: string;
  nome: string;
  tipoUsuario: 'usuario' | 'adm';
  verified: boolean;
  ativo: boolean;
}

export const authService = {
  signUp: async (data: z.infer<typeof SignUpSchema>) => {
    return apiClient.post('/auth/signup', SignUpSchema.parse(data));
  },

  signIn: async (email: string, senha: string) => {
    return apiClient.post('/auth/signin', { email, senha });
  },

  forgotPassword: async (email: string) => {
    return apiClient.post('/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, newPassword: string) => {
    return apiClient.post('/auth/reset-password', { token, newPassword });
  },
};
```

### Arquivo: `code/shared/utils.ts`

```typescript
// Formatação de moeda
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const parseCurrency = (value: string): number => {
  const cleaned = value.replace(/[^\d.,]/g, '');
  const normalized = cleaned.replace(/\./g, '').replace(',', '.');
  return parseFloat(normalized) || 0;
};

// Formatação de datas
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR');
};
```

---

## 📱 Fase 4: Estrutura Mobile

### Arquivo: `mobile/app.json`

```json
{
  "expo": {
    "name": "Vitrii",
    "slug": "vitrii-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "android": {
      "package": "com.herstomorrow.vitrii",
      "versionCode": 1,
      "permissions": ["INTERNET", "CAMERA", "READ_EXTERNAL_STORAGE"]
    },
    "plugins": [
      "expo-router",
      "expo-image-picker"
    ]
  }
}
```

### Arquivo: `mobile/.env`

```
EXPO_PUBLIC_API_URL=http://localhost:8080
EXPO_PUBLIC_APP_ENV=development
```

---

## 🔐 Fase 5: Auth Context Mobile

### Arquivo: `mobile/contexts/AuthContext.tsx`

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Usuario, authService, setAuth as setApiAuth } from '../../code/shared/authService';

interface AuthContextType {
  user: Usuario | null;
  isLoading: boolean;
  isSignedIn: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    bootstrapAsync();
  }, []);

  const bootstrapAsync = async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      const userId = await AsyncStorage.getItem('userId');

      if (token && userId) {
        setApiAuth(token, parseInt(userId));
        setUser(JSON.parse(await AsyncStorage.getItem('userData') || '{}'));
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authService.signIn(email, password) as any;
      const { usuario, token } = response;

      await SecureStore.setItemAsync('authToken', token);
      await AsyncStorage.setItem('userId', usuario.id.toString());
      await AsyncStorage.setItem('userData', JSON.stringify(usuario));

      setApiAuth(token, usuario.id);
      setUser(usuario);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    await SecureStore.deleteItemAsync('authToken');
    await AsyncStorage.removeItem('userId');
    await AsyncStorage.removeItem('userData');
    setApiAuth(null, null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isSignedIn: !!user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve estar dentro de AuthProvider');
  return context;
};
```

---

## 🗺️ Fase 6: Navegação

### Arquivo: `mobile/app/_layout.tsx`

```typescript
import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

function RootLayout() {
  const { isSignedIn, isLoading } = useAuth();

  return isSignedIn ? <AppLayout /> : <AuthLayout />;
}

function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="auth/signin" />
      <Stack.Screen name="auth/signup" />
    </Stack>
  );
}

function AppLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function Root() {
  return (
    <AuthProvider>
      <RootLayout />
    </AuthProvider>
  );
}
```

### Arquivo: `mobile/app/(tabs)/_layout.tsx`

```typescript
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Search, Plus, MessageCircle, User } from 'lucide-react-native';

const Tab = createBottomTabNavigator();

export default function TabLayout() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home color={color} size={24} />,
        }}
      />
      <Tab.Screen
        name="search"
        options={{
          title: 'Buscar',
          tabBarIcon: ({ color }) => <Search color={color} size={24} />,
        }}
      />
      <Tab.Screen
        name="publish"
        options={{
          title: 'Publicar',
          tabBarIcon: ({ color }) => <Plus color={color} size={24} />,
        }}
      />
      <Tab.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color }) => <MessageCircle color={color} size={24} />,
        }}
      />
      <Tab.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <User color={color} size={24} />,
        }}
      />
    </Tab.Navigator>
  );
}
```

---

## 🚀 Rodando o App

### Modo Desenvolvimento

```bash
# Terminal 1: Backend (pasta code)
npm run dev

# Terminal 2: App Mobile (pasta mobile)
npx expo start

# Pressionar 'a' para Android Emulator
# Ou 's' para escanear QR code
```

### Emulador Android

```bash
npx expo start --android
```

### Dispositivo Real

1. Instalar "Expo Go" do Play Store
2. `npx expo start` na pasta mobile
3. Escanear QR code

---

## 📦 Build para Play Store

### Instalar EAS

```bash
npm install -g eas-cli
eas login
cd mobile && eas init
```

### Criar APK para Testes

```bash
eas build --platform android --profile preview
```

### Build para Produção

```bash
eas build --platform android --profile production
eas submit --platform android
```

---

## ✅ Checklist

- [ ] Projeto Expo criado
- [ ] Dependências instaladas
- [ ] Código compartilhado criado
- [ ] Auth Context funcionando
- [ ] Navegação setup
- [ ] Home screen básica
- [ ] Login/Signup funcionando
- [ ] Conectado ao backend
- [ ] Testado em emulador
- [ ] APK gerado
- [ ] Enviado para Play Store

---

## 📞 Suporte e Recursos

- React Native: https://reactnative.dev
- Expo: https://docs.expo.dev
- React Navigation: https://reactnavigation.org
