# 🏗️ Arquitetura do App React Native + Backend

---

## Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                 DISPOSITIVO MÓVEL (iOS/Android)             │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │            React Native App (Expo)                    │  │
│  │                                                       │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │  Screens (Telas Visuais)                     │   │  │
│  │  │  ├─ LoginScreen                              │   │  │
│  │  │  ├─ SignUpScreen                             │   │  │
│  │  │  ├─ HomeScreen                               │   │  │
│  │  │  ├─ SearchScreen                             │   │  │
│  │  │  ├─ PublishScreen                            │   │  │
│  │  │  ├─ ChatScreen                               │   │  │
│  │  │  └─ ProfileScreen                            │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  │                       ▲                              │  │
│  │                       │ (leitura)                    │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │  Context API (Estado Global)                 │   │  │
│  │  │  ├─ AuthContext (autenticação)               │   │  │
│  │  │  ├─ AnunciosContext (anúncios)               │   │  │
│  │  │  └─ ChatContext (mensagens)                  │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  │                       ▲                              │  │
│  │                       │ (atualização)               │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │  Services (Chamadas à API)                   │   │  │
│  │  │  ├─ authService.ts                           │   │  │
│  │  │  ├─ anunciosService.ts                       │   │  │
│  │  │  ├─ chatService.ts                           │   │  │
│  │  │  └─ api.ts (configuração Axios)              │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  │                       ▲                              │  │
│  │              HTTP GET/POST/PUT/DELETE               │  │
│  │                       │                              │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │  AsyncStorage (Armazenamento Local)          │   │  │
│  │  │  ├─ authToken (token JWT)                    │   │  │
│  │  │  ├─ user (dados usuário)                     │   │  │
│  │  │  └─ cache de dados                           │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  │                                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                             │
                    HTTP HTTPS (encriptado)
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js + Express)              │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Routes (Endpoints API)                              │  │
│  │  ├─ POST   /api/auth/signin                          │  │
│  │  ├─ POST   /api/auth/signup                          │  │
│  │  ├─ GET    /api/anuncios                             │  │
│  │  ├─ POST   /api/anuncios                             │  │
│  │  ├─ GET    /api/mensagens                            │  │
│  │  └─ ... (mais 50+ endpoints)                         │  │
│  └───────────────────────────────────────────────────────┘  │
│                       ▲                                      │
│                       │                                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Middleware                                           │  │
│  │  ├─ CORS (permitir requisições do app)               │  │
│  │  ├─ extractUserId (extrair token JWT)                │  │
│  │  ├─ requireAdmin (validar permissão)                 │  │
│  │  └─ Error handling                                   │  │
│  └───────────────────────────────────────────────────────┘  │
│                       ▲                                      │
│                       │                                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Serviços / Lógica de Negócio                        │  │
│  │  ├─ authService (validar credenciais)                │  │
│  │  ├─ anunciosService (CRUD anúncios)                  │  │
│  │  ├─ chatService (enviar mensagens)                   │  │
│  │  ├─ emailService (enviar emails)                     │  │
│  │  └─ uploadService (salvar fotos)                     │  │
│  └───────────────────────────────────────────────────────┘  │
│                       ▲                                      │
│                       │ (SQL queries)                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Prisma ORM (Mapeamento Banco de Dados)              │  │
│  │  ├─ Models (User, Anuncio, Chat, etc)                │  │
│  │  └─ Migrations (histórico de mudanças)               │  │
│  └───────────────────────────────────────────────────────┘  │
│                       ▲                                      │
│                       │ SQL queries                          │
└────────────┬──────────┴──────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│              BANCO DE DADOS (PostgreSQL)                    │
│                                                              │
│  Tables:                                                    │
│  ├─ usracessos (usuários)                                   │
│  ├─ anuncios (anúncios de produtos)                         │
│  ├─ conversas (chats)                                       │
│  ├─ mensagens (mensagens em chats)                          │
│  ├─ anunciantes (lojas/vendedores)                          │
│  └─ ... (mais tabelas)                                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Fluxo de Dados - Login

```
┌──────────────────┐
│ Usuário digita   │
│ email/senha      │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────┐
│ LoginScreen.tsx              │
│ Chama: login(email, senha)   │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ AuthContext                  │
│ Chama: authService.login()   │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ authService.ts               │
│ POST /api/auth/signin        │
└────────┬─────────────────────┘
         │
         ▼
    ╔════════════════╗
    ║ Backend        ║
    ║ Valida email   ║
    ║ Valida senha   ║
    ║ Gera JWT token ║
    ╚════────┬───────╝
             │
             ▼
    ╔═══════════════════════════╗
    ║ Retorna:                  ║
    ║ {                         ║
    ║   usuario: {...},         ║
    ║   token: "eyJhbG..."      ║
    ║ }                         ║
    ╚════════────┬──────────────╝
                 │
                 ▼
    ┌─────────────────────────────┐
    │ AuthService salva em:       │
    │ AsyncStorage:               │
    │ - authToken                 │
    │ - user                      │
    └────────────┬────────────────┘
                 │
                 ▼
    ┌─────────────────────────────┐
    │ AuthContext atualiza estado │
    │ - user = dados usuário      │
    │ - isLoading = false         │
    └────────────┬────────────────┘
                 │
                 ▼
    ┌─────────────────────────────┐
    │ RootNavigator verifica:     │
    │ Se user != null             │
    │ → Navega para HomeScreen    │
    └────────────┬────────────────┘
                 │
                 ▼
    ┌─────────────────────────────┐
    │ HomeScreen carregado        │
    │ Token incluído em:          │
    │ Authorization: Bearer token │
    └─────────────────────────────┘
```

---

## Fluxo de Dados - Buscar Anúncios

```
┌──────────────────────┐
│ HomeScreen renderiza │
│ useEffect fetch data │
└─────────┬────────────┘
          │
          ▼
┌─────────────────────────────────────┐
│ Service: anunciosService.ts         │
│ Chama: api.get('/anuncios')         │
└─────────────┬───────────────────────┘
              │
              ▼
┌──────────────────────────────────┐
│ api.ts (Axios interceptor)       │
│ Adiciona header:                 │
│ Authorization: Bearer <token>    │
└─────────────┬────────────────────┘
              │
         HTTP GET
         HTTPS (encriptado)
              │
              ▼
         ╔═══════════════════╗
         ║ Backend           ║
         ║ GET /api/anuncios ║
         ║                   ║
         ║ 1. Verifica token ║
         ║ 2. Query BD       ║
         ║ 3. Retorna JSON   ║
         ╚═════────┬─────────╝
                   │
                   ▼
         ╔═══════════════════════════════════╗
         ║ Response:                         ║
         ║ [                                 ║
         ║   {id: 1, titulo: "...", ...},   ║
         ║   {id: 2, titulo: "...", ...},   ║
         ║   ...                            ║
         ║ ]                                ║
         ╚═════────┬──────────────────────────╝
                   │
                   ▼
┌──────────────────────────────┐
│ Service trata resposta       │
│ setState(anuncios)           │
└─────────┬────────────────────┘
          │
          ▼
┌──────────────────────────────┐
│ Context atualiza             │
│ AnunciosContext.anuncios =[] │
└─────────┬────────────────────┘
          │
          ▼
┌──────────────────────────────┐
│ HomeScreen re-renderiza      │
│ <FlatList data={anuncios} /> │
└──────────────────────────────┘
```

---

## Estrutura de Pastas Detalhada

```
code/vitrii-mobile/
│
├── src/
│   │
│   ├── screens/                    ← Telas (páginas completas)
│   │   ├── LoginScreen.tsx         (login)
│   │   ├── SignUpScreen.tsx        (cadastro)
│   │   ├── HomeScreen.tsx          (home com lista anúncios)
│   │   ├── SearchScreen.tsx        (buscar anúncios)
│   │   ├── PublishScreen.tsx       (publicar novo anúncio)
│   │   ├── ProfileScreen.tsx       (perfil do usuário)
│   │   ├── ChatScreen.tsx          (lista de conversas)
│   │   ├── AnuncioDetailScreen.tsx (detalhe de um anúncio)
│   │   └── SplashScreen.tsx        (tela inicial)
│   │
│   ├── components/                 ← Componentes reutilizáveis
│   │   ├── AnuncioCard.tsx         (card de anúncio)
│   │   ├── LoadingSpinner.tsx      (loader genérico)
│   │   ├── ErrorMessage.tsx        (mensagem de erro)
│   │   ├── Button.tsx              (botão customizado)
│   │   ├── TextInput.tsx           (input customizado)
│   │   └── ...
│   │
│   ├── services/                   ← Chamadas à API
│   │   ├── api.ts                  ← CONFIG AXIOS (IMPORTANTE!)
│   │   ├── authService.ts          (POST /auth/signin, signup)
│   │   ├── anunciosService.ts      (GET/POST anúncios)
│   │   ├── chatService.ts          (mensagens/chat)
│   │   ├── uploadService.ts        (upload de fotos)
│   │   └── ...
│   │
│   ├── contexts/                   ← Context API (estado global)
│   │   ├── AuthContext.tsx         ← IMPORTANTE! Autenticação
│   │   ├── AnunciosContext.tsx     (estado anúncios)
│   │   ├── ChatContext.tsx         (estado chat)
│   │   └── ...
│   │
│   ├── types/                      ← TypeScript types/interfaces
│   │   └── index.ts                (User, Anuncio, Chat, etc)
│   │
│   ├── constants/                  ← Constantes
│   │   ├── colors.ts               (cores do app)
│   │   ├── strings.ts              (textos hardcoded)
│   │   └── api.ts                  (endpoints da API)
│   │
│   └── utils/                      ← Funções utilitárias
│       ├── formatters.ts           (formatar datas, preços)
│       ├── validators.ts           (validar email, telefone)
│       └── ...
│
├── assets/
│   ├── icon.png                    (512x512 - ícone do app)
│   ├── splash.png                  (1200x1200 - tela inicial)
│   ├── adaptive-icon.png           (Android adaptive icon)
│   └── ...
│
├── .env                            ← VARIÁVEIS DE AMBIENTE
├── app.json                        ← Configuração Expo
├── package.json                    ← Dependências
├── tsconfig.json                   ← Configuração TypeScript
├── eas.json                        ← Configuração EAS Build
│
├── GUIA-COMPLETO-REACT-NATIVE.md   ← Guia passo-a-passo
├── CHECKLIST-PRATICO.md            ← Checklist executável
├── SCRIPTS-DESENVOLVIMENTO.sh       ← Scripts úteis
└── ARQUITETURA.md                  ← Este arquivo

```

---

## Fluxo de Requisições HTTP

### Padrão de Requisição com Token

```
Cliente (App)                          Servidor (Backend)
     │                                        │
     │ 1. POST /api/auth/signin              │
     │ (email, senha)                        │
     ├─────────────────────────────────────→ │
     │                                        │
     │                                  2. Validar credenciais
     │                                  3. Gerar JWT token
     │                                        │
     │ 4. Response: {token, usuario}         │
     │ ←─────────────────────────────────────┤
     │                                        │
     │ 5. Salvar token em AsyncStorage       │
     │                                        │
     │ 6. GET /api/anuncios                  │
     │ Header: Authorization: Bearer token   │
     ├─────────────────────────────────────→ │
     │                                        │
     │                                  7. Verificar token
     │                                  8. Query banco dados
     │                                        │
     │ 9. Response: [anuncios]               │
     │ ←─────────────────────────────────────┤
     │                                        │

```

### Estrutura JSON de Respostas

**Login:**
```json
{
  "usuario": {
    "id": 1,
    "email": "user@example.com",
    "nome": "João Silva",
    "telefonePrincipal": "11999999999"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Anúncios:**
```json
[
  {
    "id": 1,
    "titulo": "iPhone 13",
    "descricao": "iPhone 13 128GB preto",
    "preco": 2500.00,
    "imagens": ["url1", "url2"],
    "usuarioId": 5,
    "dataCriacao": "2024-01-15T10:30:00Z"
  },
  ...
]
```

---

## Componentes do React Native Usados

| Componente | Uso | Exemplo |
|-----------|-----|---------|
| `View` | Container (div) | `<View style={...}>` |
| `Text` | Texto | `<Text>Olá</Text>` |
| `TextInput` | Campo input | `<TextInput placeholder="Email" />` |
| `TouchableOpacity` | Botão clicável | `<TouchableOpacity onPress={...}>` |
| `FlatList` | Lista otimizada | `<FlatList data={items} />` |
| `ScrollView` | Scroll vertical | `<ScrollView>` |
| `ActivityIndicator` | Loading spinner | `<ActivityIndicator />` |
| `Image` | Imagem | `<Image source={{uri: url}} />` |
| `StyleSheet` | Estilos (CSS) | `StyleSheet.create({...})` |
| `Alert` | Dialog popup | `Alert.alert("Título", "Mensagem")` |

---

## Dependências Principais

| Dependência | Versão | Uso |
|------------|--------|-----|
| `expo` | ^51.0.0 | Framework React Native |
| `react` | 18.2.0 | Framework UI |
| `react-native` | 0.74.0 | Componentes nativos |
| `@react-navigation/native` | 6.1.0 | Navegação |
| `@react-navigation/bottom-tabs` | 6.5.0 | Tab navigation |
| `axios` | 1.6.0 | HTTP client |
| `@react-native-async-storage/async-storage` | 1.21.0 | LocalStorage |
| `expo-image-picker` | 14.7.0 | Picker de fotos |
| `expo-camera` | 13.4.0 | Câmera |
| `expo-location` | 16.5.0 | Geolocalização |

---

## Ciclo de Vida da App

```
┌─────────────────────────────────────┐
│ 1. App.tsx - Componente Raiz        │
│    - AuthProvider envolvendo tudo   │
│    - NavigationContainer            │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ 2. RootNavigator                    │
│    - Verifica se user está logado   │
│    - Mostra Auth Stack ou App Stack │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ 3. AuthContext useEffect            │
│    - Verifica token em AsyncStorage │
│    - Recupera sessão anterior       │
│    - Atualiza estado de autenticação│
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ 4. Tela renderiza                   │
│    - Login (sem autenticação)       │
│    - ou Home (com autenticação)     │
└─────────────────────────────────────┘
```

---

## Performance e Boas Práticas

### Otimizações Implementadas

1. **FlatList em vez de ScrollView**
   - Para listas grandes, FlatList renderiza apenas itens visíveis
   - Economiza memória

2. **Memoização de Componentes**
   ```typescript
   export default React.memo(AnuncioCard);
   ```

3. **Lazy Loading de Imagens**
   - Usar `Image.prefetch()` antes de renderizar

4. **Tokens de Autenticação**
   - Armazenados em AsyncStorage (localStorage nativo)
   - Inclusos em todas requisições automaticamente

5. **Tratamento de Erros**
   - Interceptors no Axios para 401 (token expirado)
   - Try-catch em async operations

---

## Segurança

### Implementações de Segurança

1. **HTTPS Obrigatório**
   - Em produção, usar HTTPS
   - `usesCleartextTraffic: false` em android

2. **JWT Token**
   - Token armazenado localmente
   - Incluído em header Authorization
   - Backend valida em cada requisição

3. **CORS Habilitado**
   - Backend permite requisições do app
   - Protege contra requisições maliciosas

4. **Permissões de App**
   ```json
   "permissions": [
     "android.permission.INTERNET",
     "android.permission.CAMERA",
     "android.permission.READ_EXTERNAL_STORAGE"
   ]
   ```

---

## Próximos Passos de Desenvolvimento

- [ ] Implementar todas as telas
- [ ] Integrar todos endpoints do backend
- [ ] Adicionar upload de fotos
- [ ] Implementar geolocalização
- [ ] Adicionar notificações push
- [ ] Implementar busca com filtros
- [ ] Adicionar pagamentos (Stripe, PagSeguro)
- [ ] Testes automatizados
- [ ] Publicar no Google Play e App Store

---

**Sucesso! 🚀**
