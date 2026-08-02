import sharp from 'sharp';
import fs from 'fs';

const input = 'public/logo.png';
const manifest = {
  "name": "LEXCC | Luxury Streetwear",
  "short_name": "LEXCC",
  "icons": [
    {
      "src": "/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "theme_color": "#000000",
  "background_color": "#000000",
  "display": "standalone"
};

async function generate() {
  try {
    await sharp(input).resize(16, 16).toFile('public/favicon-16x16.png');
    await sharp(input).resize(32, 32).toFile('public/favicon-32x32.png');
    await sharp(input).resize(48, 48).toFile('public/favicon-48x48.png');
    await sharp(input).resize(180, 180).toFile('public/apple-touch-icon.png');
    await sharp(input).resize(192, 192).toFile('public/android-chrome-192x192.png');
    await sharp(input).resize(512, 512).toFile('public/android-chrome-512x512.png');
    
    fs.copyFileSync('public/favicon-32x32.png', 'public/favicon.ico');
    fs.writeFileSync('public/manifest.json', JSON.stringify(manifest, null, 2));
    console.log('Favicons generated');
  } catch(e) {
    console.error(e);
  }
}

generate();
