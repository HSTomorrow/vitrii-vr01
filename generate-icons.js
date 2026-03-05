#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

// Logo URL (pode ser substituído depois)
const LOGO_URL = 'https://cdn.builder.io/api/v1/image/assets%2Ff2e9e91d4cc44d4bae5b9dac3bb6abe8%2F4f9f90c2ca714384b9d14f4f1b8ee68a?format=webp&width=800&height=1200';
const TEMP_LOGO = './temp-logo.webp';
const OUTPUT_DIR = './public/icons';

// Criar diretório de output se não existir
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`✅ Diretório criado: ${OUTPUT_DIR}`);
}

// Tamanhos de ícones necessários
const ICON_SIZES = [16, 32, 70, 72, 96, 128, 144, 150, 152, 167, 180, 192, 310, 384, 512];
const MASKABLE_SIZES = [192, 512];

console.log('📥 Baixando logo...');

// Baixar logo
https.get(LOGO_URL, (response) => {
  if (response.statusCode !== 200) {
    console.error(`❌ Erro ao baixar: ${response.statusCode}`);
    process.exit(1);
  }

  const file = fs.createWriteStream(TEMP_LOGO);
  response.pipe(file);

  file.on('finish', () => {
    file.close();
    console.log('✅ Logo baixado com sucesso');
    
    // Agora vamos gerar os ícones
    generateIcons();
  });
}).on('error', (err) => {
  console.error('❌ Erro ao baixar:', err);
  process.exit(1);
});

async function generateIcons() {
  try {
    // Importar sharp dinamicamente
    const sharp = require('sharp');

    console.log('\n🎨 Gerando ícones...\n');

    // Gerar ícones normais
    for (const size of ICON_SIZES) {
      const filename = `icon-${size}x${size}.png`;
      
      await sharp(TEMP_LOGO)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png()
        .toFile(path.join(OUTPUT_DIR, filename));
      
      console.log(`✅ Gerado: ${filename}`);
    }

    // Gerar maskable icons (para Android Adaptive Icons)
    console.log('\n🎯 Gerando maskable icons...\n');
    for (const size of MASKABLE_SIZES) {
      const filename = `icon-maskable-${size}x${size}.png`;
      
      await sharp(TEMP_LOGO)
        .resize(size * 0.8, size * 0.8, { fit: 'contain' })
        .png()
        .toFile(path.join(OUTPUT_DIR, filename));
      
      console.log(`✅ Gerado: ${filename}`);
    }

    // Gerar screenshots
    console.log('\n📸 Gerando screenshots...\n');
    
    // Screenshot narrow (540x720)
    await sharp(TEMP_LOGO)
      .resize(540, 720, { fit: 'cover', position: 'center' })
      .png()
      .toFile(path.join(OUTPUT_DIR, 'screenshot-540x720.png'));
    console.log('✅ Gerado: screenshot-540x720.png');

    // Screenshot wide (1280x720)
    await sharp(TEMP_LOGO)
      .resize(1280, 720, { fit: 'cover', position: 'center' })
      .png()
      .toFile(path.join(OUTPUT_DIR, 'screenshot-1280x720.png'));
    console.log('✅ Gerado: screenshot-1280x720.png');

    // Limpar temp logo
    fs.unlinkSync(TEMP_LOGO);

    console.log('\n✨ Todos os ícones foram gerados com sucesso!');
    console.log(`📁 Localização: ${path.resolve(OUTPUT_DIR)}`);
    console.log('\n✅ Você pode fazer commit dos ícones agora!');
    
  } catch (error) {
    console.error('❌ Erro ao gerar ícones:', error.message);
    process.exit(1);
  }
}
