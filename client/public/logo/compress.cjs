const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const inputPath = path.join(__dirname, 'IMG_7728.PNG');
const outputPath = path.join(__dirname, 'IMG_7728.webp');

console.log('Iniciando compressão de IMG_7728 com sharp...');
sharp(inputPath)
  .webp({ quality: 85 })
  .toFile(outputPath)
  .then(info => {
    console.log('Sucesso! Imagem comprimida.');
    console.log('Detalhes:', info);
    const origSize = fs.statSync(inputPath).size;
    const newSize = fs.statSync(outputPath).size;
    console.log(`Tamanho original: ${(origSize / 1024).toFixed(2)} KB`);
    console.log(`Novo tamanho: ${(newSize / 1024).toFixed(2)} KB`);
    
    // Apagar o PNG original para economizar espaço
    fs.unlinkSync(inputPath);
    console.log('PNG original removido.');
  })
  .catch(err => {
    console.error('Erro durante a compressão:', err);
    process.exit(1);
  });
