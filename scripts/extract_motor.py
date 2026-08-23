#!/usr/bin/env python3
"""Extract 35 Behran MOTOR oil products.
Exact CIDs come from the content stream (in order); positions come from
pdfplumber (which aligns with the same content order)."""
import pypdf, pdfplumber, re, io, json
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import RecordingPen

IND = '/home/user/uploads/-4871449746678866176_481451154662404.pdf'
MOT = '/home/user/uploads/_⁨لیست_محصولات_موتوری_شرکت_نفت_بهران_اردیبهشت_۱۴۰۵⁩.pdf'

# ── glyph matcher (same as before) ──────────────────────────────
def contours_of(tt, gname):
    pen = RecordingPen()
    tt.getGlyphSet()[gname].draw(pen)
    out = []
    for op, arg in pen.value:
        if op == 'moveTo': out.append([(x, y) for x, y in arg])
        elif out: out[-1].extend((x, y) for x, y in arg)
    return [c for c in out if len(c) >= 1]

def signature(contours):
    n = len(contours); above = below = 0
    for c in contours:
        xs=[p[0] for p in c]; ys=[p[1] for p in c]
        w=max(xs)-min(xs); h=max(ys)-min(ys)
        if w < 320 and h < 320:
            cy=(min(ys)+max(ys))/2
            if cy > 40: above+=1
            elif cy < -40: below+=1
    return (n, above, below)

def bitmap(contours, size=96):
    pts=[p for c in contours for p in c]
    if not pts: return frozenset()
    minx=min(p[0] for c in contours for p in c); maxx=max(p[0] for c in contours for p in c)
    miny=min(p[1] for c in contours for p in c); maxy=max(p[1] for c in contours for p in c)
    w=maxx-minx or 1; h=maxy-miny or 1
    scale=(size-6)/max(w,h)
    ox=(size-w*scale)/2-minx*scale; oy=(size-h*scale)/2-miny*scale
    polys=[[(x*scale+ox, y*scale+oy) for x,y in c] for c in contours if len(c)>=2]
    bits=set()
    for poly in polys:
        ys=[p[1] for p in poly]
        for yy in range(int(min(ys))-1, int(max(ys))+2):
            xs=[]
            for i in range(len(poly)):
                x1,y1=poly[i]; x2,y2=poly[(i+1)%len(poly)]
                if (y1<=yy<y2) or (y2<=yy<y1):
                    if y2!=y1: xs.append(x1+(yy-y1)*(x2-x1)/(y2-y1))
            xs.sort()
            for i in range(0,len(xs)-1,2):
                for xx in range(int(xs[i]), int(xs[i+1])+1): bits.add((xx,yy))
    return frozenset(bits)

def overlap(a,b):
    if not a or not b: return 0.0
    return len(a&b)/min(len(a),len(b))

ri = pypdf.PdfReader(IND); ipage = ri.pages[0]
ind_refs = {}
for name, ref in ipage['/Resources']['/Font'].items():
    f = ref.get_object()
    if f.get('/Subtype') != '/Type0': continue
    desc = f['/DescendantFonts'][0].get_object()
    fd = desc['/FontDescriptor'].get_object()
    tt = TTFont(io.BytesIO(fd['/FontFile2'].get_data()))
    order = tt.getGlyphOrder()
    tu = f.get('/ToUnicode').get_object().get_data().decode('latin-1')
    c2g = desc.get('/CIDToGIDMap')
    gids=None
    if c2g is not None and hasattr(c2g,'get_data'):
        gd=c2g.get_data(); gids=[int.from_bytes(gd[i:i+2],'big') for i in range(0,len(gd),2)]
    for m in re.finditer(r'<([0-9a-fA-F]{4})>\s*<([0-9a-fA-F]{4})>', tu):
        cid=int(m.group(1),16); letter=chr(int(m.group(2),16))
        gid=(gids[cid] if gids and cid<len(gids) else cid)
        if gid>=len(order): continue
        cs=contours_of(tt, order[gid])
        ind_refs.setdefault(letter, []).append((signature(cs), bitmap(cs)))

rm = pypdf.PdfReader(MOT); mpage = rm.pages[0]
mot_tt={}
for name,ref in mpage['/Resources']['/Font'].items():
    f=ref.get_object(); base=str(f.get('/BaseFont'))
    fd=f['/FontDescriptor'].get_object()
    mot_tt[base]=TTFont(io.BytesIO(fd['/FontFile2'].get_data()))

def font_of_tt(base):
    tt = mot_tt[base]
    cmap = {}
    for t in tt['cmap'].tables:
        if t.platformID == 1: cmap = t.cmap
    return tt, cmap

_cache={}
def decode(base, cid):
    key=(base,cid)
    if key in _cache: return _cache[key]
    tt, cmap = font_of_tt(base)
    gname = cmap.get(cid)
    if gname is None: _cache[key]=('?',0.0); return ('?',0.0)
    try: cs=contours_of(tt,gname)
    except KeyError: _cache[key]=('?',0.0); return ('?',0.0)
    sig=signature(cs); bmp=bitmap(cs)
    best,best_score=None,0.0
    for letter,refs in ind_refs.items():
        for rsig,rbmp in refs:
            if rsig==sig:
                sc=overlap(bmp,rbmp)
                if sc>best_score: best,best_score=letter,sc
    _cache[key]=(best,best_score)
    return best,best_score

# ── 1. content-stream cids in order ─────────────────────────────
page = mpage
content = page.get_contents()
fonts_res = page['/Resources']['/Font']
name_map = { str(k): str(ref.get_object().get('/BaseFont')) for k,ref in fonts_res.items() }
cur_font = None
stream_glyphs = []  # (base_font, cid)
def as_bytes(item):
    if hasattr(item, 'original_bytes'): return bytes(item.original_bytes)
    if isinstance(item, (bytes, bytearray)): return bytes(item)
    return b''
for operands, op in content.operations:
    if op == b'Tf':
        cur_font = name_map.get(str(operands[0]), str(operands[0]))
    elif op == b'Tj':
        for b in as_bytes(operands[0]):
            stream_glyphs.append((cur_font, b))
    elif op == b'TJ':
        for item in operands[0]:
            if isinstance(item, (int, float)): continue
            for b in as_bytes(item):
                stream_glyphs.append((cur_font, b))

# ── 2. pdfplumber chars (positions) ─────────────────────────────
with pdfplumber.open(MOT) as pdf:
    p = pdf.pages[0]
    pchars = p.chars

def pl_base(fontname):
    if 'BTitr' in fontname: return '/HAJJFA+BTitr,Bold'
    if 'BNazanin' in fontname: return '/DYZHPE+BNazanin'
    return '/YSMEYU+Cambria'

# zip by order: iterate both; skip font mismatches
aligned = []  # (base_font, cid, x, top)
n = min(len(pchars), len(stream_glyphs))
for i in range(n):
    pc = pchars[i]
    sbase, cid = stream_glyphs[i]
    base = pl_base(pc.get('fontname') or '')
    if cid == 32:
        letter = ' '
    else:
        letter, score = decode(base, cid)
        if score < 0.6: letter = '?'
    aligned.append((base, cid, pc['x0'], pc['top'], letter))

print('aligned glyphs:', len(aligned), 'of stream', len(stream_glyphs))

# ── 3. decode + group rows ──────────────────────────────────────
from collections import defaultdict
rows = defaultdict(list)
for base, cid, x, top, letter in aligned:
    rows[round(top, 0)].append((x, letter, base))

def rtl(items): return ''.join(reversed(items))

data = []
for top in sorted(rows):
    items = sorted(rows[top], key=lambda t: t[0])
    cells = {}
    for x, letter, base in items:
        if x < 130: col='consumer'
        elif x < 200: col='base'
        elif x < 310: col='pack'
        elif x < 460: col='name'
        elif x < 505: col='code'
        else: col='row'
        cells.setdefault(col, []).append((x, letter))
    row = ''.join(t[1] for t in cells.get('row', []))
    code = ''.join(t[1] for t in cells.get('code', []))
    if not code and not row: continue
    consumer = ''.join(t[1] for t in cells.get('consumer', []))
    base_p = ''.join(t[1] for t in cells.get('base', []))
    packaging = rtl([t[1] for t in cells.get('pack', [])])
    name_items = cells.get('name', [])
    # split name into words by gap
    words=[]; cur=[]
    for t in name_items:
        if cur and t[0]-cur[-1][0] > 6:
            words.append(rtl([c[1] for c in cur])); cur=[]
        cur.append(t)
    if cur: words.append(rtl([c[1] for c in cur]))
    name = ' '.join(w for w in words if w)
    def clean_price(s):
        s = ''.join(ch for ch in s if ch.isdigit())
        return int(s) if s else None
    data.append(dict(row=row.strip(), code=code.strip(), name=name.strip(),
                     packaging=packaging.strip(),
                     base_price=clean_price(base_p),
                     consumer_price=clean_price(consumer)))

data = [d for d in data if d['code'].isdigit() and d['code']]
with open('data/motor_products.json','w',encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=1)
print('TOTAL:', len(data))
for d in data:
    print(f"{d['row']:>3} | {d['code']:<11} | {d['name']:<30} | {d['packaging']:<24} | {d['base_price']} / {d['consumer_price']}")
