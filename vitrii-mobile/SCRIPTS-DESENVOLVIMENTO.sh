#!/bin/bash

# 🚀 Scripts Úteis para Desenvolvimento do App React Native
# Executar com: bash SCRIPTS-DESENVOLVIMENTO.sh

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ==========================================
# SCRIPT 1: Setup Inicial
# ==========================================
setup_inicial() {
  echo -e "${BLUE}🚀 SETUP INICIAL${NC}"
  echo "Este script vai:"
  echo "  1. Limpar tudo (node_modules, cache)"
  echo "  2. Instalar dependências"
  echo "  3. Verificar que tudo funciona"
  echo ""
  read -p "Continuar? (s/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}1. Removendo node_modules e cache...${NC}"
    rm -rf node_modules .expo package-lock.json
    
    echo -e "${YELLOW}2. Instalando dependências (isso pode levar 2-3 minutos)...${NC}"
    npm install
    
    echo -e "${YELLOW}3. Verificando instalação...${NC}"
    npm list --depth=0
    
    echo -e "${GREEN}✅ Setup inicial concluído!${NC}"
    echo ""
    echo "Próximo passo:"
    echo "  npm start"
  fi
}

# ==========================================
# SCRIPT 2: Limpar Cache Completo
# ==========================================
limpar_cache() {
  echo -e "${BLUE}🧹 LIMPANDO CACHE${NC}"
  
  echo "Removendo:"
  echo "  - node_modules"
  echo "  - .expo"
  echo "  - package-lock.json"
  echo "  - Cache Metro"
  
  rm -rf node_modules
  rm -rf .expo
  rm -rf .next
  rm package-lock.json
  rm -rf ~/Library/Caches/expo 2>/dev/null || true
  rm -rf ~/.expo 2>/dev/null || true
  
  echo -e "${GREEN}✅ Cache limpo!${NC}"
  echo ""
  echo "Próximo: npm install && npm start"
}

# ==========================================
# SCRIPT 3: Iniciar Dev Server
# ==========================================
dev_server() {
  echo -e "${BLUE}▶️  INICIANDO DEV SERVER${NC}"
  echo ""
  echo "Opcões:"
  echo "  1) Iniciar Metro (padrão)"
  echo "  2) Iniciar e abrir Android"
  echo "  3) Iniciar e abrir iOS"
  echo "  4) Iniciar modo web"
  echo ""
  read -p "Escolha (1-4): " choice
  
  case $choice in
    1)
      echo -e "${YELLOW}Metro Server...${NC}"
      npm start
      ;;
    2)
      echo -e "${YELLOW}Abrindo no Android...${NC}"
      npm run android
      ;;
    3)
      echo -e "${YELLOW}Abrindo no iOS (requer Mac)...${NC}"
      npm run ios
      ;;
    4)
      echo -e "${YELLOW}Abrindo no Web...${NC}"
      npm run web
      ;;
    *)
      echo -e "${RED}Opção inválida${NC}"
      ;;
  esac
}

# ==========================================
# SCRIPT 4: Atualizar Variáveis de Ambiente
# ==========================================
config_env() {
  echo -e "${BLUE}🔧 CONFIGURAR VARIÁVEIS DE AMBIENTE${NC}"
  echo ""
  
  if [ ! -f .env ]; then
    echo -e "${YELLOW}Arquivo .env não encontrado. Criando...${NC}"
    cat > .env << 'EOF'
# DESENVOLVIMENTO
EXPO_PUBLIC_API_URL=http://localhost:3000/api

# EMULADOR ANDROID
# EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api

# CELULAR REAL (trocar 192.168.1.100 por seu IP)
# EXPO_PUBLIC_API_URL=http://192.168.1.100:3000/api

# PRODUÇÃO
# EXPO_PUBLIC_API_URL=https://seu-backend.com/api
EOF
    echo -e "${GREEN}✅ .env criado!${NC}"
  fi
  
  echo -e "${YELLOW}Abrindo .env no editor...${NC}"
  
  # Tentar abrir com editor padrão
  if command -v code &> /dev/null; then
    code .env
  elif command -v vim &> /dev/null; then
    vim .env
  elif command -v nano &> /dev/null; then
    nano .env
  else
    echo "Abra o arquivo .env manualmente"
  fi
}

# ==========================================
# SCRIPT 5: Build Android Preview
# ==========================================
build_android_preview() {
  echo -e "${BLUE}📦 BUILD ANDROID (PREVIEW)${NC}"
  echo ""
  echo "Isso vai compilar o app na nuvem (Expo)"
  echo "Tempo estimado: 10-15 minutos"
  echo ""
  read -p "Continuar? (s/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Ss]$ ]]; then
    eas build --platform android --profile preview
  fi
}

# ==========================================
# SCRIPT 6: Build Android Production
# ==========================================
build_android_prod() {
  echo -e "${BLUE}🚀 BUILD ANDROID (PRODUCTION)${NC}"
  echo ""
  echo "Aviso: Isso é para publicar no Google Play!"
  echo "Tempo estimado: 10-15 minutos"
  echo ""
  read -p "Tem certeza? (s/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Ss]$ ]]; then
    eas build --platform android --profile production
  fi
}

# ==========================================
# SCRIPT 7: Verificar Versão
# ==========================================
check_versions() {
  echo -e "${BLUE}📋 VERIFICANDO VERSÕES${NC}"
  echo ""
  
  echo "Node.js:"
  node --version
  echo ""
  
  echo "npm:"
  npm --version
  echo ""
  
  echo "Java:"
  java -version
  echo ""
  
  echo "EAS CLI:"
  eas --version 2>/dev/null || echo "❌ EAS CLI não instalado (instalar com: npm install -g eas-cli)"
  echo ""
  
  echo "Expo:"
  npx expo --version
  echo ""
  
  echo -e "${GREEN}✅ Verificação concluída!${NC}"
}

# ==========================================
# SCRIPT 8: Verificar API Connection
# ==========================================
check_api() {
  echo -e "${BLUE}🔌 TESTANDO CONEXÃO COM API${NC}"
  echo ""
  
  # Ler URL do .env
  if [ -f .env ]; then
    API_URL=$(grep EXPO_PUBLIC_API_URL .env | cut -d'=' -f2)
    echo "API URL: $API_URL"
  else
    API_URL="http://localhost:3000/api"
    echo "Usando URL padrão: $API_URL"
  fi
  
  echo ""
  echo "Testando conexão..."
  
  # Tentar ping na API
  if curl -s "$API_URL/ping" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API respondendo!${NC}"
    
    # Mostrar resposta
    echo ""
    echo "Response:"
    curl -s "$API_URL/ping" | head -20
  else
    echo -e "${RED}❌ API não respondendo${NC}"
    echo ""
    echo "Possíveis causas:"
    echo "  1. Backend não está rodando (npm run dev em code/)"
    echo "  2. URL errada no .env"
    echo "  3. Firewall bloqueando"
    echo ""
    echo "Solução:"
    echo "  1. Abrir outro terminal"
    echo "  2. cd code && npm run dev"
    echo "  3. Tentar novamente"
  fi
}

# ==========================================
# SCRIPT 9: Obter IP Local
# ==========================================
get_ip() {
  echo -e "${BLUE}🌐 OBTER IP LOCAL${NC}"
  echo ""
  echo "Use este IP para conectar a um celular real:"
  echo ""
  
  if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    IP=$(hostname -I | awk '{print $1}')
  elif [[ "$OSTYPE" == "darwin"* ]]; then
    IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
  else
    IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)
  fi
  
  echo "IP: $IP"
  echo ""
  echo "Use esta URL no .env:"
  echo "EXPO_PUBLIC_API_URL=http://$IP:3000/api"
  echo ""
  echo "Depois: npm start"
  echo "E escanear o QR code com seu celular"
}

# ==========================================
# SCRIPT 10: Ver Logs Android
# ==========================================
android_logs() {
  echo -e "${BLUE}📱 LOGS ANDROID${NC}"
  echo ""
  
  if command -v adb &> /dev/null; then
    echo "Exibindo logs (Ctrl+C para sair)..."
    adb logcat | grep -E "ReactNativeJS|Vitrii"
  else
    echo -e "${RED}❌ adb não encontrado${NC}"
    echo ""
    echo "Instalar Android SDK:"
    echo "  1. Baixar Android Studio: https://developer.android.com/studio"
    echo "  2. Instalar SDK"
    echo "  3. Adicionar 'adb' ao PATH"
  fi
}

# ==========================================
# SCRIPT 11: Status Build
# ==========================================
build_status() {
  echo -e "${BLUE}📊 STATUS DE BUILDS${NC}"
  echo ""
  
  echo "Android builds:"
  eas build --platform android --status
  echo ""
  
  echo "iOS builds:"
  eas build --platform ios --status
}

# ==========================================
# SCRIPT 12: Reset Project
# ==========================================
reset_project() {
  echo -e "${YELLOW}⚠️  RESET COMPLETO DO PROJETO${NC}"
  echo ""
  echo "Isso vai remover:"
  echo "  - node_modules"
  echo "  - .expo"
  echo "  - Cache Metro"
  echo "  - node_modules"
  echo ""
  read -p "Tem certeza? (s/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}Removendo tudo...${NC}"
    rm -rf node_modules
    rm -rf .expo
    rm -rf .next
    rm -rf ~/Library/Caches/expo 2>/dev/null || true
    rm package-lock.json
    
    echo -e "${YELLOW}Reinstalando...${NC}"
    npm install
    
    echo -e "${GREEN}✅ Projeto resetado!${NC}"
    echo ""
    echo "Próximo: npm start"
  fi
}

# ==========================================
# MENU PRINCIPAL
# ==========================================
main_menu() {
  while true; do
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║  VITRII MOBILE - Scripts Desenvolvimento║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo "1) 🚀 Setup Inicial (limpar + instalar)"
    echo "2) 🧹 Limpar Cache"
    echo "3) ▶️  Dev Server"
    echo "4) 🔧 Configurar .env"
    echo "5) 📦 Build Android Preview"
    echo "6) 🚀 Build Android Production"
    echo "7) 📋 Verificar Versões"
    echo "8) 🔌 Testar Conexão API"
    echo "9) 🌐 Obter IP Local"
    echo "10) 📱 Ver Logs Android"
    echo "11) 📊 Status de Builds"
    echo "12) ⚠️  Reset Completo"
    echo "0) ❌ Sair"
    echo ""
    read -p "Escolha uma opção (0-12): " choice
    
    case $choice in
      1) setup_inicial ;;
      2) limpar_cache ;;
      3) dev_server ;;
      4) config_env ;;
      5) build_android_preview ;;
      6) build_android_prod ;;
      7) check_versions ;;
      8) check_api ;;
      9) get_ip ;;
      10) android_logs ;;
      11) build_status ;;
      12) reset_project ;;
      0) 
        echo -e "${GREEN}Até logo!${NC}"
        exit 0
        ;;
      *)
        echo -e "${RED}Opção inválida${NC}"
        ;;
    esac
  done
}

# Executar menu principal
main_menu
