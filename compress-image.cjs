const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 安装 sharp
try {
  require('sharp');
} catch {
  console.log('安装 sharp...');
  execSync('npm i sharp --save-dev', { stdio: 'inherit' });
}

const sharp = require('sharp');

const imageDir = path.join(__dirname, 'assets', 'image');
const outputDir = path.join(__dirname, 'assets', 'image.compressed');

// 创建输出目录
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function compressImages() {
  const files = fs.readdirSync(imageDir);
  
  for (const file of files) {
    if (/\.(png)$/i.test(file)) {
      const inputPath = path.join(imageDir, file);
      const outputPath = path.join(outputDir, file.replace(/\.(png)$/i, '.webp'));
      
      try {
        await sharp(inputPath)
          .webp({ quality: 80 })
          .toFile(outputPath);
        
        const stats = fs.statSync(inputPath);
        const compressedStats = fs.statSync(outputPath);
        const reduction = ((stats.size - compressedStats.size) / stats.size * 100).toFixed(2);
        
        console.log(`✅ ${file}: ${(stats.size / 1024).toFixed(2)}KB → ${(compressedStats.size / 1024).toFixed(2)}KB (减少 ${reduction}%)`);
      } catch (error) {
        console.log(`❌ 压缩失败: ${file}`, error);
      }
    }
  }
}

compressImages();