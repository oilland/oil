#!/usr/bin/env python3
"""Decode the CID-encoded Behran MOTOR oil price list by glyph matching:
signature = (contour count, dots above, dots below) + bitmap overlap,
referenced against the correctly-decoded INDUSTRIAL price list."""
import pypdf, pdfplumber, re, io, json
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import RecordingPen

IND = '/home/user/uploads/-4871449746678866176_481451154662404.pdf'
MOT = '/home/user/uploads/_⁨لیست_محصولات_موتوری_شرکت_نفت_بهران_اردیبهشت_۱۴۰۵⁩.pdf'
SIZE = 96

def contours_of(tt, gname):
    pen = RecordingPen()
    tt.getGlyphSet()[gname].draw(pen)
    out = []
    for op, arg in pen.value:
        if op == 'moveTo':
            out.append([(x, y) for x, y in arg])
        elif out:
            out[-1].extend((x, y) for x, y in arg)
    return [c for c in out if len(c) >= 1]

def signature(contours):
    n = len(contours)
    above = below = 0
    for c in contours:
        xs = [p[0] for p in c]; ys = [p[1] for p in c]
        w = max(xs) - min(xs); h = max(ys) - min(ys)
        if w < 320 and h < 320:
            cy = (min(ys) + max(ys)) / 2
            if cy > 40:
                above += 1
            elif cy < -40:
                below += 1
    return (n, above, below)

def bitmap(contours, size=SIZE):
    pts = [p for c in contours for p in c]
    if not pts:
        return frozenset()
    minx = min(p[0] for c in contours for p in c)
    maxx = max(p[0] for c in contours for p in c)
    miny = min(p[1] for c in contours for p in c)
    maxy = max(p[1] for c in contours for p in c)
    w = maxx - minx or 1; h = maxy - miny or 1
    scale = (size - 6) / max(w, h)
    ox = (size - w * scale) / 2 - minx * scale
    oy = (size - h * scale) / 2 - miny * scale
    polys = [[(x * scale + ox, y * scale + oy) for x, y in c] for c in contours if len(c) >= 2]
    bits = set()
    for poly in polys:
        ys = [p[1] for p in poly]
        for yy in range(int(min(ys)) - 1, int(max(ys)) + 2):
            xs = []
            for i in range(len(poly)):
                x1, y1 = poly[i]; x2, y2 = poly[(i + 1) % len(poly)]
                if (y1 <= yy < y2) or (y2 <= yy < y1):
                    if y2 != y1:
                        xs.append(x1 + (yy - y1) * (x2 - x1) / (y2 - y1))
            xs.sort()
            for i in range(0, len(xs) - 1, 2):
                for xx in range(int(xs[i]), int(xs[i + 1]) + 1):
                    bits.add((xx, yy))
    return frozenset(bits)

def overlap(a, b):
    if not a or not b:
        return 0.0
    return len(a & b) / min(len(a), len(b))

# ── industrial reference ─────────────────────────────────────────
ri = pypdf.PdfReader(IND)
ipage = ri.pages[0]
ind_refs = {}  # letter -> [(sig, bitmap)]
for name, ref in ipage['/Resources']['/Font'].items():
    f = ref.get_object()
    if f.get('/Subtype') != '/Type0':
        continue
    desc = f['/DescendantFonts'][0].get_object()
    fd = desc['/FontDescriptor'].get_object()
    tt = TTFont(io.BytesIO(fd['/FontFile2'].get_data()))
    order = tt.getGlyphOrder()
    tu = f.get('/ToUnicode').get_object().get_data().decode('latin-1')
    c2g = desc.get('/CIDToGIDMap')
    gids = None
    if c2g is not None and hasattr(c2g, 'get_data'):
        gd = c2g.get_data()
        gids = [int.from_bytes(gd[i:i+2], 'big') for i in range(0, len(gd), 2)]
    for m in re.finditer(r'<([0-9a-fA-F]{4})>\s*<([0-9a-fA-F]{4})>', tu):
        cid = int(m.group(1), 16); letter = chr(int(m.group(2), 16))
        gid = (gids[cid] if gids and cid < len(gids) else cid)
        if gid >= len(order):
            continue
        cs = contours_of(tt, order[gid])
        ind_refs.setdefault(letter, []).append((signature(cs), bitmap(cs)))

print('industrial letters:', len(ind_letters := ind_refs))

# ── motor ────────────────────────────────────────────────────────
rm = pypdf.PdfReader(MOT)
mpage = rm.pages[0]
mot_tt = {}
for name, ref in mpage['/Resources']['/Font'].items():
    f = ref.get_object()
    base = str(f.get('/BaseFont'))
    fd = f['/FontDescriptor'].get_object()
    mot_tt[base] = TTFont(io.BytesIO(fd['/FontFile2'].get_data()))

_cache = {}
def motor_features(base, cid):
    key = (base, cid)
    if key in _cache:
        return _cache[key]
    tt = mot_tt[base]
    gname = f'uniF{cid:03X}'
    try:
        cs = contours_of(tt, gname)
        feats = (signature(cs), bitmap(cs))
    except KeyError:
        feats = ((0, 0, 0), frozenset())
    _cache[key] = feats
    return feats

def decode_cid(base, cid):
    sig, bmp = motor_features(base, cid)
    if not bmp:
        return None, 0.0
    best, best_score = None, 0.0
    for letter, refs in ind_refs.items():
        for rsig, rbmp in refs:
            if rsig != sig:
                continue
            sc = overlap(bmp, rbmp)
            if sc > best_score:
                best, best_score = letter, sc
    return best, best_score

# ── decode ───────────────────────────────────────────────────────
with pdfplumber.open(MOT) as pdf:
    chars = pdf.pages[0].chars

decoded = []
for c in chars:
    fn = c.get('fontname') or ''
    text = c['text']
    top, x0 = round(c['top']), round(c['x0'])
    if 'BTitr' in fn:
        m = re.match(r'\(cid:(\d+)\)', text)
        if m:
            letter, score = decode_cid('/HAJJFA+BTitr,Bold', int(m.group(1)))
            if score < 0.75: letter = '▯'
            decoded.append((top, x0, letter, 'B'))
    elif 'BNazanin' in fn:
        m = re.match(r'\(cid:(\d+)\)', text)
        if m:
            letter, score = decode_cid('/DYZHPE+BNazanin', int(m.group(1)))
            if score < 0.75: letter = '▯'
            decoded.append((top, x0, letter, 'N'))
    else:
        decoded.append((top, x0, text, 'L'))

from collections import defaultdict
rows = defaultdict(list)
for top, x0, letter, f in decoded:
    rows[top].append((x0, letter, f))

out = []
for top in sorted(rows):
    items = sorted(rows[top], key=lambda t: t[0])
    parts, run, run_f = [], [], None
    for x0, letter, f in items:
        if run_f is not None and f != run_f and abs(x0 - run[-1][0]) > 12:
            parts.append(''.join(reversed([t[1] for t in run])) if run_f in ('N','B') else ''.join(t[1] for t in run))
            run, run_f = [], None
        run.append((x0, letter, f)); run_f = f
    if run:
        parts.append(''.join(reversed([t[1] for t in run])) if run_f in ('N','B') else ''.join(t[1] for t in run))
    out.append((top, items[0][0], ' '.join(parts).strip()))

with open('/home/user/oil-shop/data/motor_decoded.txt', 'w', encoding='utf-8') as fh:
    for top, x0, s in out:
        fh.write(f'{top:4d} | {x0:4d} | {s}\n')
        print(f'{top:4d} | {x0:4d} | {s}')
