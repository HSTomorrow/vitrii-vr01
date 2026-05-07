# 🚀 Quick Start: App Android com React Native

## ⏱️ Tempo: 30 minutos para começar

---

## PASSO 1: Instalações Globais (10 minutos)

Rode **uma vez** no seu computador:

```bash
# Instalar Expo CLI
npm install -g expo-cli

# Instalar EAS CLI (para build)
npm install -g eas-cli

# Verificar instalação
expo --version
eas --version
```

### Pré-requisitos Verificar

```bash
# Node.js 18+
node --version

# npm
npm --version

# Java JDK 17+
java -version
```

---

## PASSO 2: Criar Projeto Mobile (10 minutos)

### No Terminal, fazer:

```bash
# Sair da pasta code
cd ..

# Criar novo projeto Expo
npx create-expo-app mobile --template
cd mobile

# Instalar dependências principais
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
  axios \
  react-native-svg \
  lucide-react-native
```

### Tempo Espera: ~3-5 minutos para npm install

---

## PASSO 3: Configurar app.json (2 minutos)

Editar `mobile/app.json` e substituir por:

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
    "ios": {
      "supportsTabletMode": true,
      "bundleIdentifier": "com.herstomorrow.vitrii"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.herstomorrow.vitrii",
      "permissions": [
        "INTERNET",
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    "plugins": [
      "expo-router",
      "expo-image-picker"
    ],
    "extra": {
      "router": {
        "origin": false
      }
    }
  }
}
```

---

## PASSO 4: Criar .env Mobile (1 minuto)

Criar arquivo `mobile/.env`:

```
EXPO_PUBLIC_API_URL=http://localhost:8080
EXPO_PUBLIC_APP_ENV=development
```

---

## PASSO 5: Copiar Código Compartilhado (2 minutos)

Na pasta `mobile/`, criar a estrutura:

```bash
mkdir -p contexts services utils constants

# Copiar código compartilhado
cp ../code/shared/apiClient.ts ./services/
cp ../code/shared/authService.ts ./services/
cp ../code/shared/mobileUtils.ts ./utils/
```

---

## PASSO 6: Criar Auth Context (3 minutos)

Criar arquivo `mobile/contexts/AuthContext.tsx`:

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService, { Usuario, setAuth as setApiAuth, clearAuth } from '../services/authService';

interface AuthContextType {
  user: Usuario | null;
  isLoading: boolean;
  isSignedIn: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Restaurar sessão ao iniciar app
  useEffect(() => {
    bootstrapAsync();
  }, []);

  const bootstrapAsync = async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      const userData = await AsyncStorage.getItem('userData');

      if (token && userData) {
        const user = JSON.parse(userData);
        setApiAuth(token, user.id);
        setUser(user);
      }
    } catch (err) {
      console.error('Failed to restore session:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.signIn(email, password) as any;
      const { usuario, token } = response;

      await SecureStore.setItemAsync('authToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(usuario));

      setApiAuth(token, usuario.id);
      setUser(usuario);
    } catch (err: any) {
      const message = err.response?.data?.error || 'Erro ao fazer login';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    await SecureStore.deleteItemAsync('authToken');
    await AsyncStorage.removeItem('userData');
    clearAuth();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isSignedIn: !!user, signIn, signOut, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve estar dentro de AuthProvider');
  }
  return context;
};
```

---

## PASSO 7: Criar Root Layout (3 minutos)

Criar `mobile/app/_layout.tsx`:

```typescript
import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

function RootLayoutNav() {
  const { isSignedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="loading" />
      </Stack>
    );
  }

  return isSignedIn ? <AppStack /> : <AuthStack />;
}

function AuthStack() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="auth/signin" />
      <Stack.Screen name="auth/signup" />
    </Stack>
  );
}

function AppStack() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function Root() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
```

---

## PASSO 8: Criar Navegação (2 minutos)

Criar `mobile/app/(tabs)/_layout.tsx`:

```typescript
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Search, Plus, MessageCircle, User } from 'lucide-react-native';
import HomeScreen from './index';

const Tab = createBottomTabNavigator();

export default function TabLayout() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="index"
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="search"
        options={{
          title: 'Buscar',
          tabBarIcon: ({ color, size }) => <Search color={color} size={size} />,
        }}
      >
        {() => <SearchScreen />}
      </Tab.Screen>
      <Tab.Screen
        name="publish"
        options={{
          title: 'Publicar',
          tabBarIcon: ({ color, size }) => <Plus color={color} size={size} />,
        }}
      >
        {() => <PublishScreen />}
      </Tab.Screen>
      <Tab.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <MessageCircle color={color} size={size} />
          ),
        }}
      >
        {() => <ChatScreen />}
      </Tab.Screen>
      <Tab.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      >
        {() => <ProfileScreen />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// Placeholders para as screens
const SearchScreen = () => <Text>Buscar</Text>;
const PublishScreen = () => <Text>Publicar</Text>;
const ChatScreen = () => <Text>Chat</Text>;
const ProfileScreen = () => <Text>Perfil</Text>;
```

---

## PASSO 9: Home Screen Básica (3 minutos)

Criar `mobile/app/(tabs)/index.tsx`:

```typescript
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

export default function HomeScreen() {
  const { user } = useAuth();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bem-vindo!</Text>
        <Text style={styles.subtitle}>{user?.nome}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Anúncios em Destaque</Text>
        <Text style={styles.text}>Carregando...</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  text: {
    color: '#6b7280',
  },
});
```

---

## PASSO 10: Telas de Auth (5 minutos)

Criar `mobile/app/auth/signin.tsx`:

```typescript
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export default function SignInScreen() {
  const { signIn, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      await signIn(email, password);
    } catch (err) {
      Alert.alert('Erro', 'Email ou senha inválidos');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fazer Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        editable={!isLoading}
      />

      <TextInput
        style={styles.input}
        placeholder="Senha"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        editable={!isLoading}
      />

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Entrando...' : 'Entrar'}
        </Text>
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

---

## PASSO 11: Rodando o App ✅

```bash
# Na pasta mobile/
npx expo start

# Opções:
# - Pressione 'a' para Android Emulator
# - Pressione 's' para escanear QR Code (Expo Go)
# - Pressione 'i' para iOS
```

### Se usar Android Emulator:
1. Abra Android Studio
2. Crie ou inicie um emulador
3. Pressione 'a' no terminal

### Se usar Dispositivo Real:
1. Instale "Expo Go" do Play Store
2. Pressione 's' no terminal
3. Escaneie QR code com câmera ou Expo Go

---

## 🔗 Conectar ao Backend

### Backend já rodando?

```bash
# Terminal 1 (na pasta code/)
npm run dev

# Terminal 2 (na pasta mobile/)
npx expo start
```

### Testar autenticação:
1. Home screen carregou?
2. Email e senha aparecem?
3. Clique em "Entrar"
4. Deve fazer login com credenciais do banco

---

## ✅ Checklist - Conclusão

- [ ] Expo CLI instalado
- [ ] Projeto mobile criado
- [ ] Dependências instaladas
- [ ] app.json configurado
- [ ] .env criado
- [ ] Código compartilhado copiado
- [ ] Auth Context criado
- [ ] Layout criado
- [ ] Home screen funcionando
- [ ] Tela de login funcionando
- [ ] App rodando no emulador/dispositivo

---

## 🚀 Próximos Passos

1. **Implementar mais telas**: Busca, Publicar, Chat, Perfil
2. **Conectar API**: Buscar anúncios, criar anúncio
3. **Imagens**: Upload de fotos
4. **Build**: Gerar APK para testar

---

## 📞 Problemas Comuns

### "Cannot find module 'lucide-react-native'"
```bash
npm install lucide-react-native
npx expo start --clear
```

### "API connection refused"
```bash
# Verificar IP local
ifconfig | grep inet

# Atualizar .env com IP
EXPO_PUBLIC_API_URL=http://192.168.1.XXX:8080
```

### Emulador muito lento
- Aumentar RAM no AVD
- Desabilitar animations

---

## 📚 Recursos

- React Native: https://reactnative.dev/docs
- Expo: https://docs.expo.dev
- React Navigation: https://reactnavigation.org
- axios: https://axios-http.com

**Pronto para começar? Siga os 11 passos acima!** 🎉
