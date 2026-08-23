#!/usr/bin/env python3
"""Process motor-oil images to WebP."""
import os
from PIL import Image

SRC = '/home/user/image-search'
DST = '/home/user/oil-shop/public/images/motor'
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
    '20w-50-1.jpg': 'rana.webp',       # رانا 20W-50
    '20w-50-1.webp': 'taktaz.webp',    # تکتاز 20W-50
    '10w-40-1.jpg': 'super-pishtaz.webp',  # سوپر پیشتاز 10W-40
    '15w-40-1.jpg': 'extra-turbo.webp',    # اکسترا توربو دیزل 15W-40
    '15w-40-2.png': 'extra-turbo-barrel.webp',  # اکسترا توربو دیزل 20L
    '5w-30-1.jpg': 'super-rana.webp',  # سوپر رانا 5W-30
    '5w-30-2.jpg': 'super-rana-plus.webp',  # سوپر رانا پلاس 5W-30
    'results-1.jpg': 'turbo-diesel.webp',  # توربو دیزل (دیزلی عمومی)
    'results-2.png': 'super-turbo-ran.webp',  # سوپر توربو ران
}
for src, dst in MAP.items():
    p = os.path.join(SRC, src)
    if os.path.exists(p):
        to_webp(p, dst)
    else:
        print('MISSING:', src)
print('done')
