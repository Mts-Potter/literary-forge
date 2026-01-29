const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate a simple "LF" logo with gradient background
async function generateIcons() {
  console.log('Generating PWA icons and OG image...');

  // SVG template for the logo - Literary Forge "LF" on dark background
  const createSVG = (size) => `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1a1a1a;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#262626;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" fill="url(#grad)"/>
      <text
        x="50%"
        y="50%"
        font-family="Arial, sans-serif"
        font-size="${size * 0.35}"
        font-weight="bold"
        fill="#ffffff"
        text-anchor="middle"
        dominant-baseline="middle"
      >LF</text>
    </svg>
  `;

  try {
    // Generate 192x192 icon
    await sharp(Buffer.from(createSVG(192)))
      .png()
      .toFile(path.join(publicDir, 'icon-192.png'));
    console.log('✓ Generated icon-192.png');

    // Generate 512x512 icon
    await sharp(Buffer.from(createSVG(512)))
      .png()
      .toFile(path.join(publicDir, 'icon-512.png'));
    console.log('✓ Generated icon-512.png');

    // Generate OG Image (1200x630) with more text
    const ogSVG = `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#0a0a0a;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1a1a1a;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="1200" height="630" fill="url(#grad)"/>

        <!-- Logo "LF" -->
        <text
          x="600"
          y="200"
          font-family="Arial, sans-serif"
          font-size="120"
          font-weight="bold"
          fill="#ffffff"
          text-anchor="middle"
        >LF</text>

        <!-- Title -->
        <text
          x="600"
          y="320"
          font-family="Arial, sans-serif"
          font-size="56"
          font-weight="bold"
          fill="#ffffff"
          text-anchor="middle"
        >Literary Forge</text>

        <!-- Subtitle -->
        <text
          x="600"
          y="400"
          font-family="Arial, sans-serif"
          font-size="32"
          fill="#999999"
          text-anchor="middle"
        >KI-gestütztes Training für literarischen Stil</text>

        <!-- Bottom accent line -->
        <rect x="400" y="480" width="400" height="4" fill="#ffffff" opacity="0.5"/>
      </svg>
    `;

    await sharp(Buffer.from(ogSVG))
      .png()
      .toFile(path.join(publicDir, 'og-image.png'));
    console.log('✓ Generated og-image.png (1200x630)');

    // Also generate a logo.png for the Organization schema
    await sharp(Buffer.from(createSVG(512)))
      .png()
      .toFile(path.join(publicDir, 'logo.png'));
    console.log('✓ Generated logo.png');

    console.log('\n✅ All icons generated successfully!');
    console.log('Note: These are placeholder icons with "LF" branding.');
    console.log('You can replace them later with custom designs.\n');

  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
