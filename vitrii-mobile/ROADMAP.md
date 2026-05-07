# 🗺️ Roadmap Visual - Desenvolvimento React Native

Este documento mostra **visualmente** cada passo do desenvolvimento, quanto tempo leva, e como tudo se encaixa.

---

## 📊 Timeline Geral

```
SEMANA 1                    SEMANA 2                SEMANA 3
├─────────────────────┬──────────────────────┬──────────────────┐
│  Setup & Básico     │  Funcionalidades    │  Publicação      │
│  (8-10 horas)       │  (12-15 horas)      │  (4-6 horas)     │
└─────────────────────┴──────────────────────┴──────────────────┘

Total: 24-31 horas de desenvolvimento
```

---

## 🏗️ FASE 1: Setup & Configuração Inicial (8-10 horas)

```
┌─────────────────────────────────────────────────────┐
│ DIA 1: Preparar Ambiente                    (3h)    │
├─────────────────────────────────────────────────────┤
│ □ Instalar Node.js, Java                  30min    │
│ □ Ler GUIA-COMPLETO (Fase 1-2)            1h       │
│ □ npm install + verificar              30min    │
│ □ Criar .env                              15min    │
│ □ Testar conexão com backend           30min    │
│ □ Resultado: App conectando na API       ✅      │
│                                                    │
│ Arquivos modificados:                              │
│  - .env                                            │
│  - src/services/api.ts                             │
│  - Nenhum outro por enquanto                       │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ DIA 2: Autenticação                        (2.5h)  │
├─────────────────────────────────────────────────────┤
│ □ Ler GUIA-COMPLETO (Fase 3)               45min   │
│ □ Criar authService.ts                    30min   │
│ □ Criar AuthContext.tsx                   45min   │
│ □ Testar login no emulador                30min   │
│ □ Resultado: Login/Logout funcionando      ✅     │
│                                                    │
│ Arquivos criados:                                  │
│  - src/services/authService.ts                     │
│  - src/contexts/AuthContext.tsx                    │
│ Arquivos modificados:                              │
│  - App.tsx (adicionar AuthProvider)                │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ DIA 3: Telas Básicas                      (2.5h)  │
├─────────────────────────────────────────────────────┤
│ □ Ler GUIA-COMPLETO (Fase 4)               45min   │
│ □ Atualizar LoginScreen                    30min   │
│ □ Criar SignUpScreen                       45min   │
│ □ Criar HomeScreen básica                  30min   │
│ □ Testar fluxo login → home                15min   │
│ □ Resultado: Navegação básica funcionando  ✅     │
│                                                    │
│ Arquivos modificados:                              │
│  - src/screens/LoginScreen.tsx                     │
│  - src/screens/SignUpScreen.tsx (novo)             │
│  - src/screens/HomeScreen.tsx                      │
│  - App.tsx (atualizar routes)                      │
└─────────────────────────────────────────────────────┘
```

---

## 🎨 FASE 2: Funcionalidades Principais (12-15 horas)

```
┌─────────────────────────────────────────────────────┐
│ DIA 4: Tela de Busca                      (2h)    │
├─────────────────────────────────────────────────────┤
│ □ Criar anunciosService.ts                 45min   │
│ □ Criar SearchScreen                       45min   │
│ □ Testar listar anúncios                   30min   │
│ □ Resultado: Pode buscar anúncios          ✅     │
│                                                    │
│ Arquivos novos:                                    │
│  - src/services/anunciosService.ts                 │
│  - src/screens/SearchScreen.tsx                    │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ DIA 5: Detalhe do Anúncio                 (2.5h)  │
├─────────────────────────────────────────────────────┤
│ □ Criar AnuncioDetailScreen                1h     │
│ □ Criar AnuncioCard componente             45min  │
│ □ Testar navegação entre telas             30min  │
│ □ Resultado: Ver detalhe de anúncio        ✅     │
│                                                    │
│ Arquivos novos:                                    │
│  - src/components/AnuncioCard.tsx                  │
│  - src/screens/AnuncioDetailScreen.tsx             │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ DIA 6: Chat/Mensagens                     (3h)    │
├─────────────────────────────────────────────────────┤
│ □ Criar chatService.ts                     45min   │
│ □ Criar ChatScreen                         1h 15min│
│ □ Integrar with backend mensagens          45min   │
│ □ Testar envio/recebimento                 15min   │
│ □ Resultado: Pode conversar com outros     ✅     │
│                                                    │
│ Arquivos novos:                                    │
│  - src/services/chatService.ts                     │
│  - src/screens/ChatScreen.tsx                      │
│  - src/components/MessageBubble.tsx                │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ DIA 7: Publicar Anúncio                   (3h)    │
├─────────────────────────────────────────────────────┤
│ □ Criar PublishScreen                      1h 30min│
│ □ Integrar image picker (fotos)            45min   │
│ □ POST anúncio ao backend                  30min   │
│ □ Testar publicação                        15min   │
│ □ Resultado: Pode publicar anúncios        ✅     │
│                                                    │
│ Arquivos novos:                                    │
│  - src/screens/PublishScreen.tsx                   │
│ Arquivos modificados:                              │
│  - src/services/anunciosService.ts (POST)          │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ DIA 8: Perfil e Configurações             (1.5h)  │
├─────────────────────────────────────────────────────┤
│ □ Criar ProfileScreen                      1h     │
│ □ Mostrar dados do usuário                 30min   │
│ □ Resultado: Pode ver perfil               ✅     │
│                                                    │
│ Arquivos novos:                                    │
│  - src/screens/ProfileScreen.tsx                   │
└─────────────────────────────────────────────────────┘
```

---

## 📦 FASE 3: Build & Publicação (4-6 horas)

```
┌─────────────────────────────────────────────────────┐
│ DIA 9: Preparar para Build                (1.5h)  │
├─────────────────────────────────────────────────────┤
│ □ Criar ícones (512x512 e 1024x1024)      30min   │
│ □ Criar splash screens                    30min   │
│ □ Atualizar app.json com versão           15min   │
│ □ Resultado: App pronta para compilar     ✅     │
│                                                    │
│ Arquivos atualizados:                              │
│  - app.json                                        │
│  - assets/icon.png                                 │
│  - assets/splash.png                               │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ DIA 10: Build Android                     (1.5h)  │
├─────────────────────────────────────────────────────┤
│ □ Instalar EAS CLI                        15min   │
│ □ Configurar EAS (eas init)                15min   │
│ □ Fazer build preview                      1h     │
│ □ Resultado: APK pronto para testar       ✅     │
│                                                    │
│ Comandos:                                          │
│  - npm install -g eas-cli                          │
│  - eas init                                        │
│  - eas build --platform android --profile preview  │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ DIA 11: Build iOS (somente Mac)           (1.5h)  │
├─────────────────────────────────────────────────────┤
│ □ Configurar certificados Apple           30min   │
│ □ Fazer build para TestFlight              1h     │
│ □ Resultado: .ipa pronto para testar      ✅     │
│                                                    │
│ Nota: Requer subscição Apple ($99/ano)             │
└─────────────────────────────────────────────────────┘
```

---

## 🔄 Estrutura de Desenvolvimento Diário

### Cada Dia de Desenvolvimento

```
09:00 - Planejamento (15 min)
        □ O que fazer hoje?
        □ Quais recursos preciso?

09:15 - Coding (2-3 horas)
        □ Implementar funcionalidade
        □ Console.logs para debugging
        □ Testes manuais

12:15 - Pausa (30 min)

12:45 - Continuação (1-2 horas)
        □ Refinamento
        □ Testes mais completos
        □ Tratamento de erros

14:45 - Documentação (15 min)
        □ Notas sobre o que fez
        □ Problemas encontrados
        □ Próximas tarefas

15:00 - Fim do dia
```

---

## 📈 Progresso Visual por Semana

### SEMANA 1: Fundações

```
Domingo    Seg  Ter  Qua  Qui  Sex  Sab
                    ■ Setup
                       ■ Auth
                          ■ Telas
                             ■ Testes
█ 20%  █ 40%  █ 60%  █ 80%  █ █ 95%
```

### SEMANA 2: Funcionalidades

```
Domingo    Seg  Ter  Qua  Qui  Sex  Sab
█ █       ■ Busca
             ■ Detalhe
                ■ Chat
                   ■ Publish
                      ■ Profile
█ █ 35%  █ █ 50%  █ █ 65%  █ █ 80%
```

### SEMANA 3: Build & Publicação

```
Domingo    Seg  Ter  Qua  Qui  Sex  Sab
█ █       ■ Preparar
             ■ Build Android
                ■ Build iOS
█ █ 85%  █ █ 90%  █ █ 100%  🎉
```

---

## 💡 Dependências Entre Tarefas

```
START
  │
  ├─→ Setup & .env ────────────────────┐
  │        │                           │
  │        └─→ Testar Conexão ─────────┼─→ Auth Service
  │                                    │
  ├─→ Criar AuthContext ───────────────┤
  │        │                           │
  │        └─→ LoginScreen ────────────┼─→ SignUpScreen
  │                                    │
  │                                    └─→ HomeScreen
  │
  ├─→ AnunciosService ─────────────────┐
  │        │                           │
  │        ├─→ SearchScreen ───────────┼─→ AnuncioDetailScreen
  │        │                           │
  │        └─→ PublishScreen ──────────┘
  │
  ├─→ ChatService ─────────────────────→ ChatScreen
  │
  ├─→ ProfileScreen
  │
  └─→ Preparar Assets ─────────────────┐
           │                           │
           ├─→ Build Android ──────────┼─→ Test APK
           │                           │
           └─→ Build iOS ──────────────┘
                     │
                     └─→ PUBLICAÇÃO
                          ↓
                        🎉 LIVE!
```

---

## 📁 Arquivos Novos por Dia

### Dia 1: Setup
```
✓ Modificado: .env, src/services/api.ts
✓ Nenhum novo
```

### Dia 2: Autenticação
```
✓ Novo: src/services/authService.ts
✓ Novo: src/contexts/AuthContext.tsx
✓ Modificado: App.tsx
```

### Dia 3: Telas Básicas
```
✓ Novo: src/screens/SignUpScreen.tsx
✓ Modificado: src/screens/LoginScreen.tsx
✓ Modificado: src/screens/HomeScreen.tsx
✓ Modificado: App.tsx
```

### Dia 4: Busca
```
✓ Novo: src/services/anunciosService.ts
✓ Novo: src/screens/SearchScreen.tsx
✓ Modificado: App.tsx
```

### Dia 5: Detalhe
```
✓ Novo: src/components/AnuncioCard.tsx
✓ Novo: src/screens/AnuncioDetailScreen.tsx
✓ Modificado: App.tsx
✓ Modificado: src/screens/SearchScreen.tsx
```

### Dia 6: Chat
```
✓ Novo: src/services/chatService.ts
✓ Novo: src/screens/ChatScreen.tsx
✓ Novo: src/components/MessageBubble.tsx
✓ Modificado: App.tsx
```

### Dia 7: Publicar
```
✓ Novo: src/screens/PublishScreen.tsx
✓ Modificado: src/services/anunciosService.ts (POST)
✓ Modificado: App.tsx
```

### Dia 8: Perfil
```
✓ Novo: src/screens/ProfileScreen.tsx
✓ Modificado: App.tsx
```

### Dias 9-11: Build
```
✓ Modificado: app.json
✓ Novo: eas.json (via eas init)
✓ Assets atualizados (icon, splash)
```

---

## 🎯 Milestones e Checkpoints

```
CHECKPOINT 1 (Dia 1-2)
   ✅ App conecta na API
   ✅ Login funciona
   Tempo: 5 horas

CHECKPOINT 2 (Dia 3)
   ✅ Navegação entre telas
   ✅ SignUp funciona
   Tempo: 3 horas (Total: 8h)

CHECKPOINT 3 (Dia 4-5)
   ✅ Pode ver lista de anúncios
   ✅ Pode ver detalhe de anúncio
   Tempo: 4 horas (Total: 12h)

CHECKPOINT 4 (Dia 6-8)
   ✅ Pode conversar
   ✅ Pode publicar anúncios
   ✅ Pode ver perfil
   Tempo: 6.5 horas (Total: 18.5h)

CHECKPOINT 5 (Dia 9-11)
   ✅ APK buildado
   ✅ iOS buildado
   ✅ Pronto para publicação
   Tempo: 4.5 horas (Total: 23h)
```

---

## 📊 Horas Estimadas por Tipo de Tarefa

```
Leitura/Aprendizado        8-10 horas  (30-35%)
  ├─ GUIA-COMPLETO         5-6 horas
  ├─ ARQUITETURA           1-2 horas
  ├─ DICAS-RAPIDAS         0.5-1 hora
  └─ Documentação oficial  1-2 horas

Desenvolvimento            12-15 horas (40-50%)
  ├─ Setup & testes        2-3 horas
  ├─ Autenticação          2-2.5 horas
  ├─ Telas & navegação     4-5 horas
  └─ Funcionalidades       4-5 horas

Build & Publicação         4-6 horas   (15-20%)
  ├─ Preparação            1.5 horas
  ├─ Build Android         1.5 horas
  ├─ Build iOS             1.5 horas
  └─ Testes                0.5-1 hora

TOTAL                      24-31 horas
```

---

## 🚀 Aceleração Possível

Se você:
- ✅ Já conhece React
- ✅ Já conhece TypeScript
- ✅ Já conhece componentes funcionais

**Pode reduzir em ~40%:**
- Pular leitura de GUIA-COMPLETO
- Ler só CHECKLIST-PRATICO
- Usar SCRIPTS-DESENVOLVIMENTO para automação

**Tempo reduzido:** 14-18 horas

---

## 📝 Dicas para Manter o Ritmo

1. **Dedique 2-3 horas por dia** (mínimo)
2. **Faça um dia por vez** (não pule fases)
3. **Teste após cada mudança** (não deixe para depois)
4. **Use console.log agressivamente** (debug é importante)
5. **Referência DICAS-RAPIDAS quando travar** (não gaste tempo)
6. **Documente seus problemas** (para aprender)

---

## 🎓 Variações Possíveis

### Rota Rápida (14-18 horas)
Para quem já conhece React/TypeScript

```
Dia 1: Setup + Auth          (3h)
Dia 2: Telas básicas         (2h)
Dia 3: Busca + Detalhe       (2.5h)
Dia 4: Chat + Publish        (2h)
Dia 5: Perfil + Build        (2.5h)
TOTAL: 12h
```

### Rota Padrão (24-31 horas)
Para quem quer aprender tudo

```
(Como descrito acima)
```

### Rota Detalhada (40-50 horas)
Para quem quer entender profundamente

```
+ Adicionar testes (Jest)           5-8h
+ Adicionar validação (Zod)         3-4h
+ Adicionar mais features           5-10h
+ Performance optimization          3-5h
+ Documentação extra                2-3h
```

---

## ✅ Pronto Para Começar?

```
1. □ Você tem Node.js 16+ instalado?
2. □ Você tem Java 11+ instalado?
3. □ Backend está rodando?
4. □ Você leu LEIA-ME.md?
5. □ Você tem 2-3 horas para começar hoje?

Se respondeu SIM a todas:
→ Abra GUIA-COMPLETO-REACT-NATIVE.md
→ Comece pelo Passo 1
→ Sucesso! 🚀
```

---

**Estima-se 24-31 horas de trabalho para um app completo e funcional.**

**Dia 1 você já terá:**
- App conectando no backend ✅
- Login funcionando ✅
- Navegação básica ✅

**Pronto para começar? Vá para LEIA-ME.md!**
