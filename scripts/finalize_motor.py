#!/usr/bin/env python3
"""Final corrected decode + manual mapping of the 35 Behran MOTOR oil products."""
import pypdf, pdfplumber, re, io, json
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import RecordingPen

IND = '/home/user/uploads/-4871449746678866176_481451154662404.pdf'
MOT = '/home/user/uploads/_⁨لیست_محصولات_موتوری_شرکت_نفت_بهران_اردیبهشت_۱۴۰۵⁩.pdf'

# matcher (to identify cids for the manual map)
def contours_of(tt, gname):
    pen = RecordingPen(); tt.getGlyphSet()[gname].draw(pen)
    out=[]
    for op,arg in pen.value:
        if op=='moveTo': out.append([(x,y) for x,y in arg])
        elif out: out[-1].extend((x,y) for x,y in arg)
    return [c for c in out if len(c)>=1]
def signature(contours):
    n=len(contours); above=below=0
    for c in contours:
        xs=[p[0] for p in c]; ys=[p[1] for p in c]
        w=max(xs)-min(xs); h=max(ys)-min(ys)
        if w<320 and h<320:
            cy=(min(ys)+max(ys))/2
            if cy>40: above+=1
            elif cy<-40: below+=1
    return (n,above,below)
def bitmap(contours,size=96):
    pts=[p for c in contours for p in c]
    if not pts: return frozenset()
    minx=min(p[0] for c in contours for p in c); maxx=max(p[0] for c in contours for p in c)
    miny=min(p[1] for c in contours for p in c); maxy=max(p[1] for c in contours for p in c)
    w=maxx-minx or 1; h=maxy-miny or 1
    scale=(size-6)/max(w,h); ox=(size-w*scale)/2-minx*scale; oy=(size-h*scale)/2-miny*scale
    polys=[[(x*scale+ox,y*scale+oy) for x,y in c] for c in contours if len(c)>=2]
    bits=set()
    for poly in polys:
        ys=[p[1] for p in poly]
        for yy in range(int(min(ys))-1,int(max(ys))+2):
            xs=[]
            for i in range(len(poly)):
                x1,y1=poly[i]; x2,y2=poly[(i+1)%len(poly)]
                if (y1<=yy<y2) or (y2<=yy<y1):
                    if y2!=y1: xs.append(x1+(yy-y1)*(x2-x1)/(y2-y1))
            xs.sort()
            for i in range(0,len(xs)-1,2):
                for xx in range(int(xs[i]),int(xs[i+1])+1): bits.add((xx,yy))
    return frozenset(bits)
def overlap(a,b):
    if not a or not b: return 0.0
    return len(a&b)/min(len(a),len(b))

ri=pypdf.PdfReader(IND); ipage=ri.pages[0]
ind_refs={}
for name,ref in ipage['/Resources']['/Font'].items():
    f=ref.get_object()
    if f.get('/Subtype')!='/Type0': continue
    desc=f['/DescendantFonts'][0].get_object(); fd=desc['/FontDescriptor'].get_object()
    tt=TTFont(io.BytesIO(fd['/FontFile2'].get_data())); order=tt.getGlyphOrder()
    tu=f.get('/ToUnicode').get_object().get_data().decode('latin-1')
    c2g=desc.get('/CIDToGIDMap'); gids=None
    if c2g is not None and hasattr(c2g,'get_data'):
        gd=c2g.get_data(); gids=[int.from_bytes(gd[i:i+2],'big') for i in range(0,len(gd),2)]
    for m in re.finditer(r'<([0-9a-fA-F]{4})>\s*<([0-9a-fA-F]{4})>',tu):
        cid=int(m.group(1),16); letter=chr(int(m.group(2),16))
        gid=(gids[cid] if gids and cid<len(gids) else cid)
        if gid>=len(order): continue
        cs=contours_of(tt,order[gid]); ind_refs.setdefault(letter,[]).append((signature(cs),bitmap(cs)))

rm=pypdf.PdfReader(MOT); mpage=rm.pages[0]
mot_tt={}
for name,ref in mpage['/Resources']['/Font'].items():
    f=ref.get_object(); base=str(f.get('/BaseFont'))
    fd=f['/FontDescriptor'].get_object(); mot_tt[base]=TTFont(io.BytesIO(fd['/FontFile2'].get_data()))
def font_of(base):
    tt=mot_tt[base]; cmap={}
    for t in tt['cmap'].tables:
        if t.platformID==1: cmap=t.cmap
    return tt,cmap
_cache={}
def guess(base,cid):
    key=(base,cid)
    if key in _cache: return _cache[key]
    tt,cmap=font_of(base); gname=cmap.get(cid)
    if gname is None: _cache[key]=('?',0.0); return ('?',0.0)
    try: cs=contours_of(tt,gname)
    except KeyError: _cache[key]=('?',0.0); return ('?',0.0)
    sig=signature(cs); bmp=bitmap(cs); best,bs=None,0.0
    for letter,refs in ind_refs.items():
        for rsig,rbmp in refs:
            if rsig==sig:
                sc=overlap(bmp,rbmp)
                if sc>bs: best,bs=letter,sc
    _cache[key]=(best,bs); return best,bs

# print guesses for all BNazanin cids to finalize map
print('cid -> guess:')
for cid in range(1,60):
    g,s = guess('/DYZHPE+BNazanin', cid)
    print(f'{cid:2d}:{g}({s:.2f})', end=' ')
    if cid%8==0: print()
print()
