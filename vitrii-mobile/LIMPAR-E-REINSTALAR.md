# 🔧 Solução: Erro npm install - ETARGET

## ❌ Erro Recebido

```
npm error code ETARGET
npm error notarget No matching version found for @react-navigation/stack@^6.4.4.
```

## ✅ Causa

O arquivo `package-lock.json` está desatualizado ou corrompido, pedindo uma versão que não existe.

## 🔨 Solução (Passo-a-Passo)

### IMPORTANTE: Execute estes comandos **EXATAMENTE** nesta ordem

---

## PASSO 1: Abrir Terminal/Prompt de Comando

**Windows (PowerShell como Admin):**
1. Clique direito no ícone do Windows no canto inferior esquerdo
2. Selecione "Windows PowerShell (Admin)"
3. Clique em "Sim"

**Mac Terminal:**
1. Pressione `Cmd + Space`
2. Digite `Terminal`
3. Pressione Enter

**Linux:**
- Clique no ícone de Terminal ou pressione `Ctrl + Alt + T`

---

## PASSO 2: Navegar para a Pasta (OBRIGATÓRIO)

```bash
# Mudar para a pasta vitrii-mobile
cd code/vitrii-mobile

# Verificar que estamos no lugar certo
# Você deve ver os arquivos:
ls        # Mac/Linux
dir       # Windows
```

**Deve aparecer:**
- `package.json` ✅
- `App.tsx` ✅
- `app.json` ✅

Se não aparecer, você está na pasta errada. Tente:
```bash
# Voltar para raiz
cd ..

# Depois entre em vitrii-mobile
cd vitrii-mobile
```

---

## PASSO 3: Limpar Tudo (CRÍTICO!)

### 3.1 Remover pasta node_modules

**Windows (PowerShell):**
```powershell
# Remover pasta
Remove-Item -Recurse -Force node_modules

# Se der erro de permissão, tente:
rmdir /s /q node_modules
```

**Mac/Linux:**
```bash
rm -rf node_modules
```

**Se não funcionar nenhum dos comandos acima:**
- Abra o explorador de arquivos
- Vá para `code/vitrii-mobile`
- Clique direito em `node_modules`
- Selecione "Deletar"
- Confirme

### 3.2 Remover package-lock.json

**Windows (PowerShell):**
```powershell
Remove-Item -Force package-lock.json
# Se der erro:
del package-lock.json
```

**Mac/Linux:**
```bash
rm -f package-lock.json
```

**Se não funcionar:**
- Abra o explorador de arquivos
- Vá para `code/vitrii-mobile`
- Procure por `package-lock.json`
- Clique direito → Deletar

### 3.3 Limpar cache npm

```bash
# Limpar cache
npm cache clean --force

# Pode demorar 1-2 minutos
```

### ✅ Verificar se limpou

```bash
# Verificar que node_modules foi deletado
# (NÃO deve aparecer)
ls        # Mac/Linux - NÃO deve listar node_modules
dir       # Windows   - NÃO deve listar node_modules

# Deve mostrar somente:
# - app.json
# - package.json
# - src/
# - etc...
```

---

## PASSO 4: Reinstalar (AGORA SIM!)

```bash
# Instalar dependências LIMPAS
npm install

# Vai demorar 5-10 minutos
# Você verá muitas linhas como:
# added 450 packages in 8s
```

### ✅ Se terminar com sucesso

Você verá no final:
```
added XXX packages in Xms
```

**NÃO há mais erros!** ✅

---

## PASSO 5: Verificar Instalação

```bash
# Verificar que instalou tudo
npm list react react-native expo

# Deve mostrar:
# react@18.2.0
# react-native@0.73.0
# expo@50.0.0
```

---

## 🎉 Pronto!

Agora você pode continuar com:

```bash
# Próximo: fazer login no Expo
npx expo login

# Depois: inicializar EAS
eas init

# Depois: testar localmente
npm start
```

---

## 🆘 Se ainda der erro

### Se aparecer erro de permissão:

**Windows:**
```powershell
# Executar como Admin
# 1. Clique direito no PowerShell
# 2. "Run as Administrator"
# 3. Tente novamente
```

### Se aparecer erro de "file in use":

```bash
# Algumas vezes o antivírus bloqueia
# Tente:
npm install --no-save --legacy-peer-deps
```

### Se nada funcionar:

```bash
# Opção nuclear: reinstalar npm
npm install -g npm@latest

# Depois tente novamente:
npm install
```

---

## 📋 Resumo dos Comandos

**Copie e cole na ordem:**

```bash
# 1. Navegar
cd code/vitrii-mobile

# 2. Remover tudo antigo
Remove-Item -Recurse -Force node_modules  # Windows
# ou
rm -rf node_modules                        # Mac/Linux

# 3. Remover lock
Remove-Item -Force package-lock.json      # Windows
# ou
rm -f package-lock.json                    # Mac/Linux

# 4. Limpar cache
npm cache clean --force

# 5. Reinstalar
npm install

# 6. Verificar
npm list react react-native expo
```

---

## ✅ Checklist Final

- [ ] Pasta `node_modules` foi deletada
- [ ] Arquivo `package-lock.json` foi deletado
- [ ] Cache npm foi limpado
- [ ] `npm install` foi executado
- [ ] Viu "added XXX packages"
- [ ] Sem erros no final

Se tudo está OK, você está pronto! 🚀

**Próximo passo: `npx expo login`**
