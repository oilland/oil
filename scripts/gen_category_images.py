#!/usr/bin/env python3
"""Generate colorful SVG tile images for every category + assign in DB."""
import os, json, subprocess

DST = '/home/user/oil-shop/public/images/categories'
os.makedirs(DST, exist_ok=True)

# icon builders (100x100 viewBox, white on gradient)
def _teeth(c, n=8, inner=15, out=8):
    teeth = ''.join(
        f'<rect x="46" y="6" width="8" height="14" rx="3" transform="rotate({i*360/n} 50 50)"/>'
        for i in range(n)
    )
    return teeth + f'<circle cx="50" cy="50" r="{inner}"/><circle cx="50" cy="50" r="5" fill="{c}"/>'

ICONS = {
    'drop': lambda c: f'<path d="M50 12 C50 12 24 50 24 68 a26 26 0 0 0 52 0 C76 50 50 12 50 12 Z" fill="#fff"/><path d="M38 66 a12 12 0 0 0 24 0 c0 -6 -12 -20 -12 -20 s-12 14 -12 20 Z" fill="{c}"/>',
    'gear': lambda c: _teeth(c, 8, 15, 8),
    'car': lambda c: (f'<path d="M14 58 h12 l7 -16 h34 l7 16 h12 v9 h-7 a6.5 6.5 0 0 1 -13 0 h-34 a6.5 6.5 0 0 1 -13 0 h-5 Z" fill="#fff"/>'
                       f'<rect x="26" y="44" width="10" height="7" rx="2" fill="{c}"/><rect x="64" y="44" width="10" height="7" rx="2" fill="{c}"/>'),
    'tractor': lambda c: (f'<circle cx="72" cy="72" r="14" fill="#fff"/><circle cx="72" cy="72" r="6" fill="{c}"/>'
                          f'<circle cx="30" cy="76" r="9" fill="#fff"/><circle cx="30" cy="76" r="3.5" fill="{c}"/>'
                          f'<path d="M20 44 h40 l10 -14 h10 v14 l8 6 v14 h-68 Z" fill="#fff"/>'
                          f'<rect x="22" y="46" width="10" height="10" rx="2" fill="{c}"/>'),
    'turbine': lambda c: (''.join(f'<ellipse cx="50" cy="30" rx="9" ry="18" transform="rotate({i*120} 50 50)"/>' for i in range(3))
                          + f'<circle cx="50" cy="50" r="10"/><circle cx="50" cy="50" r="4" fill="{c}"/>'),
    'piston': lambda c: (f'<rect x="22" y="24" width="16" height="52" rx="4" fill="#fff"/>'
                         f'<rect x="22" y="30" width="16" height="6" fill="{c}"/><rect x="22" y="46" width="16" height="6" fill="{c}"/>'
                         f'<rect x="38" y="40" width="26" height="10" rx="2" fill="#fff"/>'
                         f'<circle cx="74" cy="45" r="12" fill="#fff"/><circle cx="74" cy="45" r="4" fill="{c}"/>'),
    'snowflake': lambda c: (''.join(f'<line x1="50" y1="14" x2="50" y2="86" stroke="#fff" stroke-width="6" stroke-linecap="round" transform="rotate({i*60} 50 50)"/>' for i in range(3))
                            + f'<circle cx="50" cy="50" r="5" fill="#fff"/>'),
    'flame': lambda c: (f'<path d="M50 10 c6 14 20 18 20 34 a20 20 0 0 1 -40 0 c0 -10 6 -16 10 -24 c4 6 8 8 10 16 c4 -8 2 -18 0 -26 Z" fill="#fff"/>'
                        f'<path d="M46 52 a10 10 0 0 0 12 9 c-2 -4 -4 -6 -2 -11 Z" fill="{c}"/>'),
    'drill': lambda c: (f'<rect x="16" y="42" width="44" height="16" rx="4" fill="#fff"/>'
                        f'<path d="M60 42 l18 8 l-18 8 Z" fill="#fff"/>'
                        f'<rect x="16" y="44" width="10" height="12" rx="2" fill="{c}"/><circle cx="72" cy="50" r="3" fill="{c}"/>'),
    'spool': lambda c: (f'<rect x="18" y="16" width="64" height="10" rx="4" fill="#fff"/>'
                        f'<rect x="18" y="74" width="64" height="10" rx="4" fill="#fff"/>'
                        f'<rect x="38" y="26" width="24" height="48" fill="#fff"/>'
                        f'<rect x="44" y="26" width="12" height="48" fill="{c}"/>'),
    'shield': lambda c: (f'<path d="M50 8 L80 18 v22 c0 20 -12 36 -30 48 C32 76 20 60 20 40 V18 Z" fill="#fff"/>'
                         f'<path d="M50 16 L72 23 v17 c0 14 -8 26 -22 36 c-14 -10 -22 -22 -22 -36 V23 Z" fill="{c}"/>'),
    'bolt': lambda c: f'<path d="M56 6 L24 54 h18 L40 94 L76 42 h-20 Z" fill="#fff"/>',
    'waves': lambda c: (f'<path d="M10 34 q10 -10 20 0 t20 0 t20 0" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round"/>'
                        f'<path d="M10 50 q10 -10 20 0 t20 0 t20 0" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round"/>'
                        f'<path d="M10 66 q10 -10 20 0 t20 0 t20 0" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round"/>'),
}

# slug -> (color1, color2, icon)
CATS = {
    'industrial-oils': ('#0f8270', '#062e2b', 'gear'),
    'automotive-fluids': ('#9cc32a', '#4a5e1b', 'car'),
    'agricultural-lubricants': ('#f59e0b', '#92400e', 'tractor'),
    'engine-oil': ('#10b981', '#065f46', 'drop'),
    'turbine-oils': ('#06b6d4', '#155e75', 'turbine'),
    'hydraulic-oils': ('#3b82f6', '#1e3a8a', 'piston'),
    'industrial-gear-oils': ('#64748b', '#0f172a', 'gear'),
    'compressor-oils': ('#0ea5e9', '#075985', 'piston'),
    'refrigeration-oils': ('#38bdf8', '#0c4a6e', 'snowflake'),
    'heat-transfer-oils': ('#ef4444', '#7f1d1d', 'flame'),
    'heat-treatment-oils': ('#f43f5e', '#9f1239', 'flame'),
    'metalworking-oils': ('#7c8aa0', '#1e293b', 'drill'),
    'textile-oils': ('#8b5cf6', '#4c1d95', 'spool'),
    'rust-preventives': ('#fb923c', '#7c2d12', 'shield'),
    'transformer-oils': ('#6366f1', '#312e81', 'bolt'),
    'general-purpose': ('#14b8a6', '#134e4a', 'waves'),
    'gear-oils': ('#f59e0b', '#78350f', 'gear'),
    'atf': ('#ec4899', '#9d174d', 'car'),
    'tractor-oils': ('#16a34a', '#14532d', 'tractor'),
    'engine-oil-gasoline': ('#f97316', '#7c2d12', 'drop'),
    'engine-oil-diesel': ('#57534e', '#1c1917', 'drop'),
}

def make_svg(slug, c1, c2, icon):
    icon_svg = ICONS[icon](c2)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="{c1}"/>
      <stop offset="100%" stop-color="{c2}"/>
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(#g)"/>
  <circle cx="330" cy="60" r="120" fill="#ffffff" opacity="0.08"/>
  <circle cx="40" cy="360" r="90" fill="#000000" opacity="0.10"/>
  <g transform="translate(150 150) scale(1)">
    <g transform="translate(0 0)">
      <g transform="translate(0 0)">{icon_svg}</g>
    </g>
  </g>
</svg>'''

written = []
for slug, (c1, c2, icon) in CATS.items():
    p = os.path.join(DST, f'{slug}.svg')
    with open(p, 'w', encoding='utf-8') as f:
        f.write(make_svg(slug, c1, c2, icon))
    written.append(slug)

print('generated', len(written), 'category images')
# store slug list for the DB step
with open('/tmp/cat_slugs.json', 'w') as f:
    json.dump(written, f)
