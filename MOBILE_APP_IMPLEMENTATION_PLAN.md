# 📱 Mobile App Implementation Plan
## React Native + Expo para Android

---

## 📊 Visão Geral do Projeto

### Objetivo
Criar app Android nativo que compartilha backend, database e lógica de negócio com web app React.

### Tecnologia Stack
- **Frontend Mobile**: React Native + Expo
- **Backend**: Express.js (existente - sem mudanças)
- **Database**: PostgreSQL (existente - sem mudanças)
- **API Communication**: Axios + TypeScript
- **State Management**: React Query + Context API
- **Authentication**: Token JWT (via SecureStore)
- **Storage**: AsyncStorage + SecureStore

### Timeline Estimado
- **Semana 1**: Setup + Auth (40h)
- **Semana 2**: Telas Principais (40h)
- **Semana 3**: Funcionalidades Core (40h)
- **Semana 4**: Polish + Deploy (30h)
- **Total**: ~3-4 semanas para MVP

---

## 📋 Arquitetura

```
┌─────────────────────────────────────┐
│      Mobile App (React Native)      │
├─────────────────────────────────────┤
│  Screens │ Components │ Hooks       │
└────────────┬────────────────────────┘
             │
     ┌───────┴────────┐
     │  Shared Code   │
     │  (./code/shared)
     │  - apiClient   │
     │  - authService │
     │  - utils       │
     └───────┬────────┘
             │
┌───────────┴──────────────┐
│   Express API            │
│   (./code/server)        │
└───────────┬──────────────┘
             │
     ┌───────┴────────┐
     │  PostgreSQL DB │
     └────────────────┘
```

---

## 🎯 Fase 1: Inicial & Setup (Semana 1)

### 1.1 Preparação Ambiental (2-3 horas)

**Tarefas:**
- [ ] Instalar Expo CLI globalmente
- [ ] Instalar EAS CLI para builds
- [ ] Instalar Android SDK (se não tiver)
- [ ] Criar novo projeto Expo: `npx create-expo-app mobile`
- [ ] Instalar todas as dependências npm

**Arquivos Criados:**
- `mobile/` (nova pasta raiz do app)
- `mobile/app.json` (config Expo)
- `mobile/.env` (variáveis de ambiente)
- `mobile/package.json` (com dependências)

**Comandos:**
```bash
npm install -g expo-cli eas-cli
npx create-expo-app mobile --template
cd mobile && npm install [deps...]
```

---

### 1.2 Código Compartilhado (3-4 horas)

**Tarefas:**
- [ ] Criar `code/shared/apiClient.ts` (cliente HTTP)
- [ ] Criar `code/shared/authService.ts` (serviços auth)
- [ ] Criar `code/shared/mobileUtils.ts` (utilitários)
- [ ] Organizar tipos TypeScript compartilhados
- [ ] Testes básicos dos serviços

**Arquivos:**
- `code/shared/apiClient.ts` - Interceptadores axios ✅
- `code/shared/authService.ts` - Serviços auth ✅
- `code/shared/mobileUtils.ts` - Utilitários compartilhados ✅

**Exportar de Web:**
```typescript
// Já existentes em code/client/:
// - contexts/AuthContext.tsx (adaptar)
// - utils/formatCurrency.ts
// - utils/imageFallback.ts
// - constants/ (reutilizar)
```

---

### 1.3 Auth Context Mobile (2-3 horas)

**Tarefas:**
- [ ] Criar `mobile/contexts/AuthContext.tsx`
- [ ] Implementar login/logout
- [ ] Implementar signup
- [ ] Usar SecureStore para tokens
- [ ] Usar AsyncStorage para user data
- [ ] Testes de autenticação

**Features:**
- Login com email + senha
- Signup com validação
- Sessão persistente
- Logout seguro
- Error handling

---

### 1.4 Navigation Setup (2-3 horas)

**Tarefas:**
- [ ] Criar `mobile/app/_layout.tsx` (root)
- [ ] Criar auth stack (`mobile/app/auth/_layout.tsx`)
- [ ] Criar app stack (`mobile/app/(tabs)/_layout.tsx`)
- [ ] Configurar bottom tab navigation
- [ ] Routing entre autenticado/não autenticado

**Estrutura:**
```
app/
├── _layout.tsx           (root com AuthProvider)
├── auth/
│   ├── _layout.tsx       (auth stack)
│   ├── signin.tsx        (login screen)
│   ├── signup.tsx        (signup screen)
│   └── forgot-password.tsx
├── (tabs)/
│   ├── _layout.tsx       (tab navigator)
│   ├── index.tsx         (home)
│   ├── search.tsx        (buscar)
│   ├── publish.tsx       (publicar)
│   ├── chat.tsx          (chat)
│   └── profile.tsx       (perfil)
└── ...
```

---

### 1.5 Testes Iniciais (1-2 horas)

**Tarefas:**
- [ ] Emulador Android funcional
- [ ] `npx expo start` rodando
- [ ] Login/logout funcionando
- [ ] Navegação entre telas funcionando

**Verificações:**
- App inicia sem erros
- Tela de login aparece
- Pode fazer login com credenciais válidas
- Pode fazer logout
- Navegação funciona

---

## 🎨 Fase 2: Telas Principais (Semana 2)

### 2.1 Home Screen (4 horas)

**Tarefas:**
- [ ] Layout básico (header + scroll)
- [ ] Buscar anúncios em destaque
- [ ] Mostrar lista de anúncios
- [ ] Banner carousel
- [ ] Localidade seletor
- [ ] Pull-to-refresh

**Componentes:**
```typescript
// mobile/app/(tabs)/index.tsx
- Header (título, localidade)
- BannerCarousel
- CategoryFilter
- AnunciosList
- LoadingState
- EmptyState
```

**API Calls:**
- GET `/api/anuncios?destaque=true&limit=10`
- GET `/api/localidades`

---

### 2.2 Detalhe do Anúncio (4 horas)

**Tarefas:**
- [ ] Criar screen detalhe
- [ ] Mostrar imagens em gallery
- [ ] Mostrar info do anunciante
- [ ] Botão de reserva
- [ ] Botão lista de desejos
- [ ] Chat com anunciante

**Componentes:**
```typescript
// mobile/app/anuncio/[id].tsx
- ImageGallery
- AnuncioInfo
- PriceSection
- SellerInfo
- ReserveButton
- WishlistButton
- ChatButton
```

**API Calls:**
- GET `/api/anuncios/:id`
- POST `/api/reservas`
- POST `/api/listas-desejos`

---

### 2.3 Busca de Anúncios (3 horas)

**Tarefas:**
- [ ] Criar search screen
- [ ] Filtros básicos
- [ ] Search por texto
- [ ] Filtrar por categoria
- [ ] Filtrar por preço
- [ ] Ordenação

**Componentes:**
```typescript
// mobile/app/(tabs)/search.tsx
- SearchBar
- FilterButton
- ResultsList
- SortDropdown
```

**API Calls:**
- GET `/api/anuncios?search=texto&categoria=X&preco_min=Y&preco_max=Z`

---

### 2.4 Perfil do Usuário (3 horas)

**Tarefas:**
- [ ] Mostrar info do usuário
- [ ] Editar perfil
- [ ] Meus anúncios
- [ ] Minha lista de desejos
- [ ] Minhas reservas
- [ ] Logout

**Componentes:**
```typescript
// mobile/app/(tabs)/profile.tsx
- UserHeader
- ProfileInfo
- MenuOptions
- MyListingsButton
- WishlistButton
- ReservationsButton
- LogoutButton
```

---

### 2.5 Gerenciamento de Anunciantes (3 horas)

**Tarefas:**
- [ ] Listar anunciantes do usuário
- [ ] Criar novo anunciante
- [ ] Editar anunciante
- [ ] Deletar anunciante
- [ ] Seletor de anunciante para publicação

**API Calls:**
- GET `/api/anunciantes/do-usuario/listar`
- POST `/api/anunciantes`
- PUT `/api/anunciantes/:id`
- DELETE `/api/anunciantes/:id`

---

## 🚀 Fase 3: Funcionalidades Core (Semana 3)

### 3.1 Upload de Imagens (4 horas)

**Tarefas:**
- [ ] Image picker
- [ ] Múltiplas imagens
- [ ] Crop/resize
- [ ] Upload para backend
- [ ] Mostrar preview
- [ ] Error handling

**Componentes:**
```typescript
// mobile/components/ImagePicker.tsx
- ImageSelector
- ImagePreviewList
- RemoveButton
- UploadProgress
```

**Dependências:**
```bash
npm install expo-image-picker expo-image
```

---

### 3.2 Criar/Editar Anúncio (5 horas)

**Tarefas:**
- [ ] Form de criação
- [ ] Seletor de anunciante
- [ ] Seletor de categoria
- [ ] Input de título
- [ ] Input de descrição
- [ ] Input de preço
- [ ] Upload de imagens
- [ ] Seletor de disponibilidade
- [ ] Submit e validação

**Componentes:**
```typescript
// mobile/app/(tabs)/publish.tsx
- SelectAnunciante
- SelectCategory
- TitleInput
- DescriptionInput
- PriceInput
- ImageUpload
- AvailabilitySelector
- SubmitButton
```

**Validação:**
- Zod schemas (compartilhado)
- Mensagens de erro em português

---

### 3.3 Chat/Mensagens (5 horas)

**Tarefas:**
- [ ] Lista de conversas
- [ ] Chat screen
- [ ] Enviar mensagens
- [ ] Receber mensagens
- [ ] Websocket ou polling
- [ ] Notificações

**Componentes:**
```typescript
// mobile/app/(tabs)/chat.tsx
- ConversationList
- ChatScreen
- MessageInput
- MessageBubble
- TypingIndicator
```

**API/Real-time:**
- GET `/api/conversas`
- POST `/api/mensagens`
- WebSocket para real-time (opcional)

---

### 3.4 Reservas e Agenda (4 horas)

**Tarefas:**
- [ ] Minhas reservas
- [ ] Detalhes da reserva
- [ ] Cancelar reserva
- [ ] Agenda do anunciante
- [ ] Seletor de horário para reserva

**Componentes:**
```typescript
// mobile/app/reservas/index.tsx
- ReservationsList
- ReservationDetails
- CancelButton

// mobile/components/ScheduleSelector.tsx
- CalendarPicker
- TimePicker
- ConfirmButton
```

---

### 3.5 Lista de Desejos (2 horas)

**Tarefas:**
- [ ] Mostrar wishlist
- [ ] Adicionar/remover items
- [ ] Compartilhar
- [ ] Novas notificações para itens na wishlist

**API Calls:**
- GET `/api/listas-desejos`
- POST `/api/listas-desejos/items`
- DELETE `/api/listas-desejos/items/:id`

---

## 🎨 Fase 4: Polish & Deployment (Semana 4)

### 4.1 UI/UX Polish (8 horas)

**Tarefas:**
- [ ] Design consistente
- [ ] Animações suaves
- [ ] Loading states
- [ ] Error messages amigáveis
- [ ] Dark mode (opcional)
- [ ] Accessibility

**Dependências:**
```bash
npm install react-native-reanimated react-native-gesture-handler
```

---

### 4.2 Performance Otimization (4 horas)

**Tarefas:**
- [ ] Image optimization
- [ ] Code splitting
- [ ] Lazy loading
- [ ] Memoization onde necessário
- [ ] Cache strategy

---

### 4.3 Testes (4 horas)

**Tarefas:**
- [ ] Testes em emulador Android
- [ ] Testes em dispositivo real
- [ ] Testar internet lento
- [ ] Testar offline mode
- [ ] Bug fixes

---

### 4.4 Build & Publicação (8 horas)

**Tarefas:**
- [ ] Configurar EAS
- [ ] Criar chave de assinatura
- [ ] Build APK (teste)
- [ ] Build AAB (produção)
- [ ] Publicar no Google Play
- [ ] Setup Google Play Console
- [ ] Criar listing na Play Store

**Comandos:**
```bash
eas build --platform android --profile production
eas submit --platform android
```

---

### 4.5 Documentação & Handoff (4 horas)

**Tarefas:**
- [ ] Documentar código
- [ ] Criar README
- [ ] Guias de deployment
- [ ] Troubleshooting
- [ ] Release notes

---

## 📦 Dependências Finais

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-native": "^0.73.0",
    "@react-native-async-storage/async-storage": "^1.21.0",
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/bottom-tabs": "^6.5.20",
    "@react-navigation/native-stack": "^6.9.25",
    "react-native-screens": "^3.26.0",
    "react-native-safe-area-context": "^4.7.4",
    "react-native-gesture-handler": "^2.14.0",
    "react-native-reanimated": "^3.6.0",
    "expo-router": "^2.4.3",
    "expo-status-bar": "^1.7.0",
    "expo-image-picker": "^14.7.1",
    "expo-secure-store": "^12.8.1",
    "@tanstack/react-query": "^5.0.0",
    "zod": "^3.22.0",
    "axios": "^1.6.0",
    "react-native-svg": "^13.14.0",
    "lucide-react-native": "^0.263.0",
    "react-hook-form": "^7.48.0"
  }
}
```

---

## 🗂️ Estrutura Final de Pastas

```
projeto/
├── code/
│   ├── server/              (backend - SEM MUDANÇAS)
│   ├── client/              (web - SEM MUDANÇAS)
│   ├── shared/
│   │   ├── apiClient.ts         ✅ Criado
│   │   ├── authService.ts       ✅ Criado
│   │   ├── mobileUtils.ts       ✅ Criado
│   │   └── api.ts               (Existente)
│   ├── REACT_NATIVE_SETUP.md    ✅ Criado
│   └── MOBILE_APP_QUICKSTART.md ✅ Criado
│
└── mobile/                  (NOVO - App Android)
    ├── app/
    │   ├── _layout.tsx
    │   ├── auth/
    │   │   ├── signin.tsx
    │   │   ├── signup.tsx
    │   │   └── forgot-password.tsx
    │   ├── (tabs)/
    │   │   ├── index.tsx (home)
    │   │   ├── search.tsx
    │   │   ├── publish.tsx
    │   │   ├── chat.tsx
    │   │   └── profile.tsx
    │   ├── anuncio/
    │   │   └── [id].tsx
    │   ├── reservas/
    │   │   └── index.tsx
    │   └── ...
    │
    ├── components/
    │   ├── ImagePicker.tsx
    │   ├── ImageGallery.tsx
    │   ├── AnuncioCard.tsx
    │   ├── ScheduleSelector.tsx
    │   └── ...
    │
    ├── contexts/
    │   └── AuthContext.tsx
    │
    ├── services/
    │   ├── apiClient.ts (copy from code/shared)
    │   ├── authService.ts (copy from code/shared)
    │   └── anunciosService.ts (novo)
    │
    ├── hooks/
    │   ├── useAnuncios.ts
    │   ├── useAuth.ts
    │   └── ...
    │
    ├── utils/
    │   ├── mobileUtils.ts (copy from code/shared)
    │   └── ...
    │
    ├── constants/
    │   └── ...
    │
    ├── app.json
    ├── eas.json
    ├── .env
    ├── .env.production
    ├── package.json
    └── tsconfig.json
```

---

## ✅ Checkpoints & Milestones

### Milestone 1: Auth & Navigation (Fim Semana 1)
- [ ] Login/logout funcionando
- [ ] Navegação entre telas
- [ ] Sessão persistente
- **Deliverable**: App funcional com autenticação

### Milestone 2: Core Screens (Fim Semana 2)
- [ ] Home screen com anúncios
- [ ] Detalhe do anúncio
- [ ] Busca funcionando
- [ ] Perfil do usuário
- **Deliverable**: Todas telas principais de leitura

### Milestone 3: Funcionalidades (Fim Semana 3)
- [ ] Publicar anúncio completo
- [ ] Upload de imagens
- [ ] Chat funcionando
- [ ] Reservas funcionando
- **Deliverable**: App com funcionalidades completas

### Milestone 4: Release Ready (Fim Semana 4)
- [ ] Testes completos
- [ ] Sem bugs críticos
- [ ] Performance otimizado
- [ ] Publicado no Play Store
- **Deliverable**: App em produção

---

## 🔄 CI/CD Setup (Futuro)

```bash
# GitHub Actions para auto-build
.github/workflows/
├── build-android.yml    (build na push)
├── test.yml             (rodar testes)
└── deploy.yml           (publish na Play Store)
```

---

## 📊 Métricas de Sucesso

- [ ] App funcional em emulador
- [ ] Todos endpoints integrados
- [ ] Performance: <3s load time
- [ ] Crashes: zero
- [ ] Play Store: live
- [ ] Ratings: 4.5+ stars

---

## 🚀 Como Começar

1. **Ler**: `code/MOBILE_APP_QUICKSTART.md`
2. **Setup**: Seguir os 11 passos
3. **Develop**: Implementar cada fase
4. **Test**: Testar continuamente
5. **Deploy**: Publicar quando pronto

**Dúvidas?** Ver `code/REACT_NATIVE_SETUP.md` para detalhes

---

**Última atualização**: 2024-03-15
**Status**: Pronto para começar ✅
