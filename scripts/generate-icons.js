const fs = require('fs');
const path = require('path');

// This script helps prepare icon directories
// Icons should be manually created from OTWLogocolor.png using an image editor
// or an online tool like https://realfavicongenerator.net/

const iconSizes = [
  72, 96, 128, 144, 152, 192, 384, 512
];

const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
  console.log('✓ Created public/icons directory');
}

console.log('\n📱 PWA Icon Generation Guide\n');
console.log('Please create the following icon sizes from public/OTWLogocolor.png:\n');

iconSizes.forEach(size => {
  console.log(`  ⚪ icon-${size}x${size}.png (${size}x${size})`);
});

console.log('\n  ⚪ icon-192x192-maskable.png (192x192 with safe zone)');
console.log('  ⚪ icon-512x512-maskable.png (512x512 with safe zone)\n');

console.log('💡 Quick options:\n');
console.log('  1. Use online tool: https://realfavicongenerator.net/');
console.log('  2. Use PWA Asset Generator: npx pwa-asset-generator public/OTWLogocolor.png public/icons');
console.log('  3. Use image editor (Photoshop, GIMP, Figma) to resize manually\n');
console.log('Note: Maskable icons need 20% safe zone padding around the logo\n');