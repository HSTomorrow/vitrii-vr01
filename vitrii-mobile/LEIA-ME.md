# 📚 Documentação Completa - React Native + Backend Express

**Bem-vindo!** Você recebeu um guia passo-a-passo **COMPLETO e DETALHADO** para criar um app React Native conectado ao seu backend Express.

---

## 📖 Documentação Disponível

### 1️⃣ **GUIA-COMPLETO-REACT-NATIVE.md** (1000+ linhas)
**👉 COMECE AQUI SE FOR PRIMEIRA VEZ**

Guia detalhado **passo-a-passo** cobrindo:
- Visão geral da arquitetura
- Pré-requisitos e setup inicial
- Entender o backend existente
- Configurar conexão com API
- Estrutura de pastas
- Implementar autenticação (login/signup)
- Criar telas principais
- Testar localmente
- Build Android
- Build iOS
- Troubleshooting

**Tempo estimado:** 2-3 horas para ler + implementar

📍 **Quando usar:** Primeira implementação, entender conceitos

---

### 2️⃣ **CHECKLIST-PRATICO.md** (800 linhas)
**👉 USE ESTE PARA EXECUTAR FASE POR FASE**

Checklist **executável** com 8 fases:
- ✅ Fase 1: Setup Inicial (30 min)
- ✅ Fase 2: Conectar Backend (20 min)
- ✅ Fase 3: Autenticação (40 min)
- ✅ Fase 4: Telas Básicas (1 hora)
- ✅ Fase 5: Testar Completo (30 min)
- ✅ Fase 6: Preparar Build (20 min)
- ✅ Fase 7: Build Android (30 min)
- ✅ Fase 8: Build iOS (somente Mac)

**Cada fase:**
- [ ] Passos numerados
- [ ] Código pronto para copiar/colar
- [ ] Tempo estimado
- [ ] Resultado esperado
- [ ] Próximo passo

📍 **Quando usar:** Implementação prática, dia a dia

---

### 3️⃣ **ARQUITETURA.md** (500+ linhas)
**👉 USE PARA ENTENDER A ESTRUTURA**

Diagramas e explicações de:
- Arquitetura geral (diagrama ASCII)
- Fluxo de dados (login, busca de anúncios)
- Estrutura de pastas detalhada
- Fluxo HTTP com token
- Estrutura JSON de respostas
- Componentes React Native usados
- Dependências principais
- Ciclo de vida da app
- Performance e boas práticas
- Implementações de segurança

📍 **Quando usar:** Compreender como tudo se conecta

---

### 4️⃣ **DICAS-RAPIDAS.md** (500+ linhas)
**👉 USE QUANDO TIVER PROBLEMAS**

Troubleshooting rápido:
- Testes em diferentes ambientes (emulador, simulador, celular real)
- Problemas de conexão com API
- Problemas de autenticação
- Problemas de build
- Problemas de UI/estilos
- Tips de debugging
- Dicas de performance
- Checklist antes de publicar
- Dúvidas comuns

📍 **Quando usar:** Tem um problema? Procure aqui primeiro

---

### 5️⃣ **SCRIPTS-DESENVOLVIMENTO.sh** (390 linhas)
**👉 USE PARA AUTOMATIZAR TAREFAS**

12 scripts úteis no menu interativo:

```bash
bash SCRIPTS-DESENVOLVIMENTO.sh
```

Scripts disponíveis:
1. 🚀 Setup Inicial
2. 🧹 Limpar Cache
3. ▶️ Dev Server
4. 🔧 Configurar .env
5. 📦 Build Android Preview
6. 🚀 Build Android Production
7. 📋 Verificar Versões
8. 🔌 Testar Conexão API
9. 🌐 Obter IP Local
10. 📱 Ver Logs Android
11. 📊 Status de Builds
12. ⚠️ Reset Completo

📍 **Quando usar:** Quer automatizar tarefas repetitivas

---

## 🎯 Por Onde Começar?

### Se você é iniciante em React Native:

```
1. Ler: GUIA-COMPLETO-REACT-NATIVE.md (Fase 1-3)
   ↓
2. Fazer: CHECKLIST-PRATICO.md (Fase 1-5)
   ↓
3. Referência: ARQUITETURA.md (para dúvidas)
   ↓
4. Problemas: DICAS-RAPIDAS.md (troubleshooting)
```

**Tempo total:** 6-8 horas

---

### Se você tem experiência com React:

```
1. Ler: ARQUITETURA.md (visão geral)
   ↓
2. Fazer: CHECKLIST-PRATICO.md (executar tudo)
   ↓
3. Problemas: DICAS-RAPIDAS.md (se tiver dúvidas)
```

**Tempo total:** 3-4 horas

---

### Se só quer um checklist rápido:

```
1. Ir direto para: CHECKLIST-PRATICO.md
   ↓
2. Seguir fase por fase
   ↓
3. Se tiver erro: DICAS-RAPIDAS.md
```

**Tempo total:** 2-3 horas

---

## 🔑 Informações Importantes

### Backend Existente
- **Local:** `code/server/`
- **Porta:** 3000 (com Vite proxy em 8080)
- **Banco:** PostgreSQL + Prisma
- **Autenticação:** JWT token

### App React Native
- **Local:** `code/vitrii-mobile/`
- **Framework:** Expo
- **Navegação:** React Navigation
- **HTTP:** Axios

### URLs Importantes
- **Dev local:** `http://localhost:3000/api`
- **Emulador Android:** `http://10.0.2.2:3000/api`
- **Celular real:** `http://SEU_IP:3000/api`

---

## 📋 Estrutura de Arquivos

```
code/vitrii-mobile/
├── LEIA-ME.md                          ← Você está aqui
├── GUIA-COMPLETO-REACT-NATIVE.md       ← Guia completo
├── CHECKLIST-PRATICO.md                ← Checklist executável
├── ARQUITETURA.md                      ← Diagramas e estrutura
├── DICAS-RAPIDAS.md                    ← Troubleshooting
├── SCRIPTS-DESENVOLVIMENTO.sh           ← Scripts úteis
│
├── src/
│   ├── screens/                        (Telas)
│   ├── components/                     (Componentes reutilizáveis)
│   ├── services/                       (Chamadas à API)
│   ├── contexts/                       (State global)
│   ├── types/                          (TypeScript types)
│   ├── constants/                      (Constantes)
│   └── utils/                          (Funções utilitárias)
│
├── App.tsx                             (Componente raiz)
├── app.json                            (Configuração Expo)
├── package.json                        (Dependências)
├── tsconfig.json                       (Configuração TypeScript)
├── .env                                (Variáveis de ambiente)
└── eas.json                            (Configuração EAS Build)
```

---

## ⚡ Quick Start (5 minutos)

```bash
cd code/vitrii-mobile

# 1. Instalar dependências
npm install

# 2. Criar .env
cat > .env << 'EOF'
EXPO_PUBLIC_API_URL=http://localhost:3000/api
EOF

# 3. Em outro terminal, iniciar backend
cd code
npm run dev

# 4. Voltar ao terminal anterior e iniciar app
cd code/vitrii-mobile
npm start

# 5. Pressionar 'a' para Android ou 'i' para iOS
```

---

## 📚 Documentação de Referência

### Conceitos Importantes

**React Native:** Componentes nativos (iOS/Android) usando React
**Expo:** Ferramenta que facilita desenvolvimento e build
**Context API:** Estado global (autenticação, usuário, etc)
**AsyncStorage:** LocalStorage nativo (salvar token, dados)
**Axios:** HTTP client para fazer requisições à API
**JWT Token:** Autenticação stateless (login sem cookies)

### Links Úteis

- **React Native Docs:** https://reactnative.dev/docs/getting-started
- **Expo Docs:** https://docs.expo.dev
- **React Navigation:** https://reactnavigation.org/docs/getting-started
- **TypeScript:** https://www.typescriptlang.org/docs
- **Axios:** https://axios-http.com/docs/intro

---

## 🎓 Estrutura de Aprendizado Recomendada

### Dia 1: Setup e Conceitos
- [ ] Ler: GUIA-COMPLETO-REACT-NATIVE.md (Fase 1-2)
- [ ] Fazer: CHECKLIST-PRATICO.md (Fase 1-2)
- [ ] Resultado: App conectando na API

### Dia 2: Autenticação e Telas
- [ ] Ler: GUIA-COMPLETO-REACT-NATIVE.md (Fase 3-4)
- [ ] Fazer: CHECKLIST-PRATICO.md (Fase 3-4)
- [ ] Resultado: Login funcionando, navegar entre telas

### Dia 3: Testes e Build
- [ ] Ler: GUIA-COMPLETO-REACT-NATIVE.md (Fase 5-6)
- [ ] Fazer: CHECKLIST-PRATICO.md (Fase 5-7)
- [ ] Resultado: App rodando no celular/emulador

### Dia 4: Refinamento
- [ ] Ler: ARQUITETURA.md (para otimizações)
- [ ] Adicionar mais telas e funcionalidades
- [ ] Testes mais robustos
- [ ] Resultado: App pronto para publicação

---

## ✅ Checklist Inicial

Antes de começar, verifique:

- [ ] Node.js 16+ instalado (`node -v`)
- [ ] npm 8+ instalado (`npm -v`)
- [ ] Java 11+ instalado (`java -version`)
- [ ] Backend rodando em `localhost:3000`
- [ ] Pasta `code/vitrii-mobile/` acessível

---

## 🆘 Precisa de Ajuda?

### 1. Procure em DICAS-RAPIDAS.md
Tem uma seção completa de troubleshooting

### 2. Verifique os logs
```bash
# Android
adb logcat | grep ReactNativeJS

# iOS (no Xcode Console)
```

### 3. Teste a API manualmente
```bash
curl http://localhost:3000/api/ping
```

### 4. Verifique arquivo .env
```bash
cat code/vitrii-mobile/.env
```

---

## 🚀 Próximas Etapas Após Setup

Uma vez que o básico funciona:

1. **Implementar todas as telas** (Search, Publish, Chat, Profile)
2. **Integrar endpoints do backend** que faltam
3. **Adicionar validação de formulários** (Zod)
4. **Implementar upload de fotos** (expo-image-picker)
5. **Adicionar notificações push** (expo-notifications)
6. **Implementar busca com filtros**
7. **Adicionar pagamentos** (Stripe, PagSeguro)
8. **Testes automatizados** (Jest, React Native Testing Library)
9. **Otimizações de performance**
10. **Publicar no Google Play e App Store**

---

## 📞 Recursos Rápidos

| Recurso | Link |
|---------|------|
| React Native | https://reactnative.dev |
| Expo | https://expo.dev |
| React Navigation | https://reactnavigation.org |
| TypeScript | https://www.typescriptlang.org |
| Axios | https://axios-http.com |
| Comunidade Expo | https://forums.expo.dev |

---

## 🎉 Parabéns!

Você tem tudo que precisa para criar um app React Native profissional!

**Próximo passo:** Abrir **GUIA-COMPLETO-REACT-NATIVE.md** e começar a ler.

---

## 📝 Licença e Notas

- Documentação criada: Maio/2026
- Versão Expo: 51.0.0+
- Versão React Native: 0.74.0+
- Versão Node.js: 16+

---

**Sucesso no desenvolvimento! 🚀**

Dúvidas? Consulte a documentação ou os scripts de ajuda.

```bash
# Para menu interativo de scripts
bash SCRIPTS-DESENVOLVIMENTO.sh
```
