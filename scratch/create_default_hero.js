const fs = require('fs');
const path = require('path');

// A 1x1 / small valid JPEG base64 expand or standard high-res SVG / PNG buffer
const heroJpegBase64 = "iVBORw0KGgoAAAANSU2EUgAABLAAAAMgCAYAAACW7+52AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAMbSURBVHic7cExAQAAAMKg9U9tDB8gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAdD84AAe0p3dQAAAAASUVORK5CYII=";

// Let's create an SVG that renders a modern Islamic emerald gradient pattern
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="800" viewBox="0 0 1920 800">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f766e;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#064e3b;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#022c22;stop-opacity:1" />
    </linearGradient>
    <pattern id="pattern" width="80" height="80" patternUnits="userSpaceOnUse">
      <path d="M40 0 L80 40 L40 80 L0 40 Z" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="2"/>
      <circle cx="40" cy="40" r="15" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="2"/>
    </pattern>
  </defs>
  <rect width="1920" height="800" fill="url(#grad)" />
  <rect width="1920" height="800" fill="url(#pattern)" />
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="48" font-weight="bold" fill="rgba(255,255,255,0.85)">SIMASJID - Sistem Informasi Manajemen Masjid</text>
</svg>`;

const targetSvg = path.join(__dirname, '../public/images/hero-default.svg');
const targetJpg = path.join(__dirname, '../public/images/hero-default.jpg');

fs.writeFileSync(targetSvg, svgContent, 'utf8');

// Copy logo as fallback JPG or write valid image
const logoPath = path.join(__dirname, '../logo.png');
if (fs.existsSync(logoPath)) {
    fs.copyFileSync(logoPath, targetJpg);
} else {
    fs.writeFileSync(targetJpg, Buffer.from(heroJpegBase64, 'base64'));
}

console.log('✅ hero-default.jpg dan hero-default.svg berhasil dibuat!');
