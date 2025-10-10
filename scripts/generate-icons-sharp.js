const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputImage = path.join(__dirname, '../public/OTWLogocolor.png');
const outputDir = path.join(__dirname, '../public/icons');

// Create output directory
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generateIcons() {
  console.log('🎨 Generating PWA icons with Sharp...\n');
  
  try {
    for (const size of sizes) {
      // Regular icon
      await sharp(inputImage)
        .resize(size, size, { 
          fit: 'contain', 
          background: { r: 0, g: 0, b: 0, alpha: 0 } 
        })
        .png()
        .toFile(path.join(outputDir, `icon-${size}x${size}.png`));
      console.log(`✓ Generated icon-${size}x${size}.png`);
      
      // Maskable icon (with padding) - only for 192 and 512
      if (size === 192 || size === 512) {
        const paddedSize = Math.floor(size * 0.8);
        const padding = Math.floor((size - paddedSize) / 2);
        
        await sharp({
          create: {
            width: size,
            height: size,
            channels: 4,
            background: { r: 155, g: 135, b: 245, alpha: 1 } // #9b87f5
          }
        })
        .composite([{
          input: await sharp(inputImage)
            .resize(paddedSize, paddedSize, { 
              fit: 'contain', 
              background: { r: 0, g: 0, b: 0, alpha: 0 } 
            })
            .toBuffer(),
          top: padding,
          left: padding
        }])
        .png()
        .toFile(path.join(outputDir, `icon-${size}x${size}-maskable.png`));
        console.log(`✓ Generated icon-${size}x${size}-maskable.png`);
      }
    }
    
    console.log('\n✅ All icons generated successfully!');
    console.log(`📁 Icons saved to: ${outputDir}\n`);
    console.log('📋 Generated files:');
    console.log('   - icon-72x72.png');
    console.log('   - icon-96x96.png');
    console.log('   - icon-128x128.png');
    console.log('   - icon-144x144.png');
    console.log('   - icon-152x152.png');
    console.log('   - icon-192x192.png');
    console.log('   - icon-192x192-maskable.png');
    console.log('   - icon-384x384.png');
    console.log('   - icon-512x512.png');
    console.log('   - icon-512x512-maskable.png\n');
  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    console.error('\n💡 Try alternative methods in PWA_SETUP_GUIDE.md');
    process.exit(1);
  }
}

generateIcons();