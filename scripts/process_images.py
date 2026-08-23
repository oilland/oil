#!/usr/bin/env python3
"""Process Behran product images: convert to WebP 800x800 (center-crop), and
generate neutral generic placeholders for families without a real image."""
import os
from PIL import Image

SRC = '/home/user/image-search'
DST = '/home/user/oil-shop/public/images/behran'
os.makedirs(DST, exist_ok=True)

def to_webp(src, dst_name, size=800, quality=82):
    im = Image.open(src).convert('RGB')
    w, h = im.size
    s = min(w, h)
    left, top = (w - s) // 2, (h - s) // 2
    im = im.crop((left, top, left + s, top + s)).resize((size, size), Image.LANCZOS)
    out = os.path.join(DST, dst_name)
    im.save(out, 'WEBP', quality=quality)
    print('webp:', dst_name, im.size)

MAP = {
    'behran-turbine-oil-1.jpg': 'torbin.webp',
    'behran-hydraulic-oil-h-1.jpg': 'hydraulic.webp',
    'behran-bordbar-gear-oil-1.jpg': 'bordbar.webp',
    'behran-bordbar-gear-oil-2.jpg': 'bordbar-pg.webp',
    'behran-derafsh-gear-oil-drum-2.jpg': 'derafsh.webp',
    'utto-1.png': 'gardan.webp',
    'needsanat-behran-brash-53-1.jpg': 'brash.webp',
    'behran-tarash-machining-1.jpg': 'tarash.webp',
    'behran-heat-transfer-oil-drum-1.jpg': 'hararat.webp',
    'quenching-oil-behran-1.jpg': 'abkar.webp',
    'vdl-behran-vdl-compressor-1.jpg': 'compressor.webp',
    'behran-refrigeration-oil-1.jpg': 'sard.webp',
    '85w-90-behran-samand-gear-oil-1.jpg': 'samand.webp',
    'atf-behran-automatic-transmission-fluid-1.jpg': 'atf.webp',
    'behran-rust-preventive-oil-1.jpg': 'mohafez.webp',
    'behran-oil-logo-1.png': 'logo.webp',
}
for src, dst in MAP.items():
    p = os.path.join(SRC, src)
    if os.path.exists(p):
        to_webp(p, dst)
    else:
        print('MISSING:', src)

# ── generic neutral placeholders (SVG — vector, square, brandless) ──
generic_svg = '''<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
<defs>
  <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#f1f5f9"/><stop offset="100%" stop-color="#e2e8f0"/>
  </linearGradient>
  <linearGradient id="d" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="#94a3b8"/><stop offset="35%" stop-color="#cbd5e1"/><stop offset="70%" stop-color="#94a3b8"/><stop offset="100%" stop-color="#64748b"/>
  </linearGradient>
</defs>
<rect width="800" height="800" fill="url(#g)"/>
<ellipse cx="400" cy="640" rx="150" ry="16" fill="#0f172a" opacity="0.08"/>
<rect x="300" y="240" width="200" height="380" rx="26" fill="url(#d)"/>
<rect x="300" y="240" width="200" height="46" rx="23" fill="#64748b"/>
<rect x="300" y="600" width="200" height="20" rx="10" fill="#64748b"/>
<line x1="330" y1="330" x2="470" y2="330" stroke="#ffffff" stroke-width="14" opacity="0.5" stroke-linecap="round"/>
<line x1="330" y1="372" x2="470" y2="372" stroke="#ffffff" stroke-width="14" opacity="0.35" stroke-linecap="round"/>
<line x1="330" y1="414" x2="470" y2="414" stroke="#ffffff" stroke-width="14" opacity="0.25" stroke-linecap="round"/>
</svg>'''
generic_pail_svg = '''<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
<defs>
  <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#f1f5f9"/><stop offset="100%" stop-color="#e2e8f0"/>
  </linearGradient>
  <linearGradient id="d" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="#94a3b8"/><stop offset="40%" stop-color="#cbd5e1"/><stop offset="100%" stop-color="#64748b"/>
  </linearGradient>
</defs>
<rect width="800" height="800" fill="url(#g)"/>
<ellipse cx="400" cy="640" rx="150" ry="16" fill="#0f172a" opacity="0.08"/>
<path d="M290 560 L300 360 C300 320 500 320 500 360 L510 560 Z" fill="url(#d)"/>
<rect x="280" y="330" width="240" height="40" rx="20" fill="#64748b"/>
<line x1="340" y1="430" x2="460" y2="430" stroke="#ffffff" stroke-width="12" opacity="0.4" stroke-linecap="round"/>
<line x1="340" y1="470" x2="460" y2="470" stroke="#ffffff" stroke-width="12" opacity="0.28" stroke-linecap="round"/>
<line x1="340" y1="510" x2="460" y2="510" stroke="#ffffff" stroke-width="12" opacity="0.16" stroke-linecap="round"/>
</svg>'''
with open(os.path.join(DST, 'generic-drum.svg'), 'w') as f:
    f.write(generic_svg)
with open(os.path.join(DST, 'generic-pail.svg'), 'w') as f:
    f.write(generic_pail_svg)
print('generic svg written')
