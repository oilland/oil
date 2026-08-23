// Generates deterministic SVG placeholder assets into public/images/.
// No copyrighted assets — everything is original vector artwork.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = (p) => join(root, 'public', 'images', p);
mkdirSync(join(root, 'public', 'images', 'products'), { recursive: true });
mkdirSync(join(root, 'public', 'images', 'brands'), { recursive: true });
mkdirSync(join(root, 'public', 'images', 'banners'), { recursive: true });

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function bottleSVG({ main, sub, color, bg = '#eef2f7' }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="640" viewBox="0 0 600 640">
  <defs>
    <radialGradient id="g" cx="50%" cy="30%" r="90%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="${bg}"/>
    </radialGradient>
    <linearGradient id="b" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${color}"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <filter id="s" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0" dy="14" stdDeviation="18" flood-color="#0f172a" flood-opacity="0.18"/>
    </filter>
  </defs>
  <rect width="600" height="640" rx="26" fill="url(#g)"/>
  <ellipse cx="300" cy="505" rx="120" ry="18" fill="#0f172a" opacity="0.08"/>
  <g filter="url(#s)">
    <rect x="262" y="96" width="76" height="62" rx="10" fill="#0f172a"/>
    <rect x="268" y="126" width="64" height="30" rx="6" fill="#334155"/>
    <path d="M268 158 h64 l6 18 h-76 z" fill="url(#b)"/>
    <path d="M268 176 h64 v30 c0 14 16 20 16 34 v190 c0 20 -16 36 -36 36 h-24 c-20 0 -36 -16 -36 -36 v-190 c0 -14 16 -20 16 -34 z" fill="url(#b)"/>
    <rect x="200" y="252" width="200" height="214" rx="16" fill="#ffffff" opacity="0.96"/>
    <rect x="200" y="252" width="200" height="52" rx="16" fill="${color}"/>
    <text x="300" y="286" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" font-weight="bold" fill="#ffffff">${esc(main)}</text>
    <text x="300" y="336" text-anchor="middle" font-family="Arial, sans-serif" font-size="19" font-weight="bold" fill="#0f172a">${esc(sub)}</text>
    <line x1="248" y1="368" x2="352" y2="368" stroke="#cbd5e1" stroke-width="2"/>
    <text x="300" y="398" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" fill="#475569">PREMIUM</text>
    <text x="300" y="424" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" fill="#475569">LUBRICANT</text>
    <rect x="252" y="444" width="96" height="14" rx="7" fill="#e2e8f0"/>
  </g>
</svg>`;
}

const products = [
  ['5W-30', 'FULL SYNTHETIC', '#26425f', 'oil-1.svg'],
  ['10W-40', 'SEMI SYNTHETIC', '#2f608c', 'oil-2.svg'],
  ['5W-40', 'FULL SYNTHETIC', '#0e7490', 'oil-3.svg'],
  ['20W-50', 'MINERAL', '#b45309', 'oil-4.svg'],
  ['5W-30', 'EDGE FULL SYNTHETIC', '#047857', 'oil-5.svg'],
  ['5W-50', 'FULL SYNTHETIC', '#7c3aed', 'oil-6.svg'],
  ['5W-40', 'FULL SYNTHETIC', '#be123c', 'oil-7.svg'],
  ['ATF', 'AUTOMATIC', '#1d4ed8', 'oil-8.svg'],
  ['80W-90', 'GEAR OIL', '#374151', 'oil-9.svg'],
  ['COOLANT', 'ANTIFREEZE', '#16a34a', 'oil-10.svg'],
  ['DOT 4', 'BRAKE FLUID', '#dc2626', 'oil-11.svg'],
  ['68', 'HYDRAULIC', '#0891b2', 'oil-12.svg'],
  ['MoS2', 'ADDITIVE', '#4d7c0f', 'oil-13.svg'],
  ['10W-40', 'MAGNATEC', '#334155', 'oil-14.svg']
];
for (const [main, sub, color, file] of products) {
  writeFileSync(out('products/' + file), bottleSVG({ main, sub, color }));
}

function brandSVG(name, color, textColor = '#ffffff') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="160" viewBox="0 0 320 160">
  <rect width="320" height="160" rx="22" fill="${color}"/>
  <circle cx="38" cy="40" r="58" fill="#ffffff" opacity="0.08"/>
  <circle cx="290" cy="130" r="70" fill="#000000" opacity="0.10"/>
  <text x="160" y="92" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="800" fill="${textColor}">${esc(name)}</text>
</svg>`;
}

const brands = [
  ['IRANOL', '#c8102e', 'iran'],
  ['BEHRAN', '#0f4c81', 'behran'],
  ['Castrol', '#00a651', 'castrol'],
  ['Shell', '#fbcb00', 'shell', '#1f2937'],
  ['Mobil', '#e6222e', 'mobil'],
  ['TOTAL', '#ff6e30', 'total'],
  ['elf', '#e6000f', 'elf'],
  ['LIQUI MOLY', '#1f2937', 'liquimoly']
];
for (const b of brands) {
  const [name, color, file, textColor] = b;
  writeFileSync(out('brands/brand-' + file + '.svg'), brandSVG(name, color, textColor || '#ffffff'));
}

function bannerSVG(theme) {
  const { c1, c2, accent } = theme;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="620" viewBox="0 0 1600 620">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="620" fill="url(#bg)"/>
  <circle cx="1330" cy="80" r="240" fill="${accent}" opacity="0.12"/>
  <circle cx="1400" cy="560" r="180" fill="#ffffff" opacity="0.05"/>
  <circle cx="240" cy="560" r="260" fill="#000000" opacity="0.15"/>
  <g stroke="${accent}" stroke-width="3" opacity="0.35">
    <path d="M0 430 L1600 250" />
    <path d="M0 470 L1600 290" />
    <path d="M0 510 L1600 330" />
  </g>
  <g transform="translate(1180 320)">
    <path d="M0 -140 C 60 -120 90 -60 70 0 C 55 45 15 70 -10 95 C -45 130 -70 150 -60 175 C -45 210 15 215 40 205 C 70 193 85 160 80 130" stroke="#ffffff" stroke-width="10" fill="none" stroke-linecap="round" opacity="0.9"/>
    <circle cx="0" cy="-140" r="16" fill="${accent}"/>
  </g>
</svg>`;
}

const banners = [
  { c1: '#0f2350', c2: '#2563eb', accent: '#f97316' },
  { c1: '#7c2d12', c2: '#ea580c', accent: '#fde68a' },
  { c1: '#0f172a', c2: '#0ea5e9', accent: '#fbbf24' }
];
banners.forEach((t, i) => writeFileSync(out('banners/banner-' + (i + 1) + '.svg'), bannerSVG(t)));

// generic placeholder
writeFileSync(
  out('placeholder.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="640" viewBox="0 0 600 640">
  <rect width="600" height="640" rx="26" fill="#eef2f7"/>
  <path d="M300 180 l30 60 v240 c0 20 -14 34 -30 34 s-30 -14 -30 -34 v-240 z" fill="#cbd5e1"/>
  <rect x="280" y="140" width="40" height="46" rx="8" fill="#94a3b8"/>
</svg>`
);

console.log('Images generated.');
