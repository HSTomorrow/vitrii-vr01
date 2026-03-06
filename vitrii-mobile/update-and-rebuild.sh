#!/bin/bash

# Script para atualizar dependências e fazer rebuild do Android
# Resolve: Google Play Protect - "App de risco bloqueado"

echo "🔄 Vitrii Mobile - Update & Rebuild Script"
echo "==========================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erro: package.json não encontrado!${NC}"
    echo "Execute este script do diretório code/vitrii-mobile"
    exit 1
fi

# 2. Instalar dependências
echo -e "${BLUE}📦 Etapa 1/4: Instalando dependências atualizadas...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao instalar dependências${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Dependências instaladas com sucesso${NC}"
echo ""

# 3. Verificar vulnerabilidades
echo -e "${BLUE}🔍 Etapa 2/4: Verificando vulnerabilidades...${NC}"
npm audit --production
echo -e "${GREEN}✅ Auditoria concluída${NC}"
echo ""

# 4. Limpar cache e prebuild
echo -e "${BLUE}🧹 Etapa 3/4: Limpando cache e preparando build...${NC}"
npx expo prebuild --clean
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao fazer prebuild${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Cache limpo e prebuild completo${NC}"
echo ""

# 5. Fazer build do Android
echo -e "${BLUE}🚀 Etapa 4/4: Compilando Android...${NC}"
echo ""
echo "Escolha o tipo de build:"
echo "1) Preview (APK local - para testes)"
echo "2) Production (Google Play - produção)"
read -p "Digite 1 ou 2: " BUILD_TYPE

if [ "$BUILD_TYPE" == "1" ]; then
    echo -e "${YELLOW}Compilando Preview Build...${NC}"
    npm run build:android
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Build Preview concluído!${NC}"
        echo "APK disponível para download"
    else
        echo -e "${RED}❌ Erro ao compilar Preview${NC}"
        exit 1
    fi
elif [ "$BUILD_TYPE" == "2" ]; then
    echo -e "${YELLOW}Compilando Production Build...${NC}"
    eas build --platform android --profile production
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Build Production enviado para EAS!${NC}"
        echo "Você pode monitorar o progresso em https://expo.dev"
    else
        echo -e "${RED}❌ Erro ao compilar Production${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Opção inválida${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}✅ Vitrii Mobile atualizado com segurança!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Alterações aplicadas:"
echo "  • targetSdkVersion: 35 (Android 15)"
echo "  • compileSdkVersion: 35"
echo "  • React Native: 0.74.0"
echo "  • Expo: 51.0.0+"
echo "  • HTTPS obrigatório (usesCleartextTraffic: false)"
echo ""
echo "O Google Play Protect não deve mais bloquear o app! 🎉"
