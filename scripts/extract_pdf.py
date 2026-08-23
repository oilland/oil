#!/usr/bin/env python3
"""Extract 141 Behran industrial products from the official price-list PDF.
Output: data/products.json (clean, normalized Persian, parsed grade/name/packaging/price).
"""
import pdfplumber, json, re

PDF = '/home/user/uploads/-4871449746678866176_481451154662404.pdf'

# Persian normalization (Arabic presentation forms -> standard Persian)
def norm(s):
    s = s.replace('ﻻ', 'لا').replace('ﻼ', 'لا').replace('ﻠ', 'ل')
    s = s.replace('ﻳ', 'ی').replace('ﻱ', 'ی').replace('ي', 'ی')
    s = s.replace('ﻛ', 'ک').replace('ك', 'ک').replace('ﻜ', 'ک').replace('ک', 'ک')
    s = s.replace('ة', 'ه').replace('ۀ', 'ه').replace('ﻪ', 'ه')
    s = s.replace('ﻩ', 'ه').replace('ﻫ', 'ه')
    s = s.replace('ﻤ', 'م').replace('ﻣ', 'م')
    s = s.replace('ﻨ', 'ن').replace('ﻧ', 'ن')
    s = s.replace('ﻮ', 'و').replace('ﻭ', 'و')
    s = s.replace('ﻪ', 'ه')
    s = s.replace('\u200c', ' ')  # ZWNJ -> space
    return re.sub(r'\s+', ' ', s).strip()

def is_ascii(s):
    return all(ord(c) < 128 for c in s)

def fix_word(w):
    return w if is_ascii(w) else w[::-1]

def extract_rows():
    rows = []
    with pdfplumber.open(PDF) as pdf:
        for pi, page in enumerate(pdf.pages):
            chars = sorted(page.chars, key=lambda c: (c['top'], c['x0']))
            clusters = []
            for c in chars:
                if clusters and abs(c['top'] - clusters[-1][0]) <= 8:
                    clusters[-1][1].append(c)
                else:
                    clusters.append([c['top'], [c]])
            for _, cl in clusters:
                def words_in(x0, x1):
                    cs = [c for c in cl if x0 <= c['x0'] < x1]
                    cs.sort(key=lambda c: c['x0'])
                    words, cur, prev_end = [], '', None
                    for c in cs:
                        if c['text'] == ' ':
                            if cur: words.append(cur); cur = ''
                            prev_end = None
                            continue
                        if prev_end is not None and c['x0'] - prev_end > 3.5:
                            if cur: words.append(cur); cur = ''
                        cur += c['text']
                        prev_end = c['x0'] + c.get('width', 0)
                    if cur: words.append(cur)
                    return words

                price = ''.join(w for w in words_in(0, 225)).replace(',', '').strip()
                price = re.sub(r'[^0-9]', '', price)
                pack_words = words_in(225, 320)
                name_words = words_in(320, 420)
                code = ''.join(words_in(420, 475)).strip()
                rownum = ''.join(words_in(475, 612)).strip()

                if not code or not code.isdigit():
                    continue
                if not price:
                    continue

                packaging = norm(' '.join(reversed([fix_word(w) for w in pack_words])))
                # name cell: visual LTR words
                visual = [fix_word(w) for w in name_words]
                # split: leading ASCII words = grade (keep visual order); rest Persian = name (RTL)
                grade_words, name_persian = [], []
                # find first non-ascii word index
                first_persian = next((i for i, w in enumerate(visual) if not is_ascii(w)), len(visual))
                grade_words = visual[:first_persian]
                name_words_p = visual[first_persian:]
                grade = norm(' '.join(grade_words)).strip()
                name = norm(' '.join(reversed(name_words_p)))
                rows.append(dict(page=pi + 1, row=rownum, code=code, name=name, grade=grade,
                                 packaging=packaging, price=int(price)))
    return rows

rows = extract_rows()

# ── Add the 5 rows (61-65) that have a special layout (floating W glyph, parentheses) ──
special = [
    dict(page=2, row='61', code='2110331', name='بهران گردان ویژه 56', grade='10W-30', packaging='بشکه', price=536757797),
    dict(page=2, row='62', code='2110327', name='بهران گردان ویژه 56', grade='10W-30', packaging='سطل', price=53675780),
    dict(page=2, row='63', code='2110431', name='بهران گردان ویژه 56', grade='15W-40', packaging='بشکه', price=557803192),
    dict(page=2, row='64', code='2110631', name='بهران گردان UTTO', grade='10W-30', packaging='بشکه', price=702558384),
    dict(page=2, row='65', code='2110831', name='بهران گردان UTTO', grade='15W-40', packaging='بشکه', price=690647778),
]
rows.extend(special)

# ── Fix grade letter/number ordering: "22 H" -> "H 22", "75/80 NFJ" -> "NFJ 75/80", etc. ──
def reorder_grade(g):
    if not g:
        return g
    parts = g.split()
    # if grade is like "<num> <letters>" swap to "<letters> <num>"
    if len(parts) == 2:
        a, b = parts
        a_num = bool(re.match(r'^[\d/.\-]+$', a))
        b_num = bool(re.match(r'^[\d/.\-]+$', b))
        if b_num and not a_num:
            return f'{a} {b}'
    # "75/80 NFJ" -> "NFJ 75/80"
    if len(parts) == 2 and re.match(r'^[\d/.\-]+$', parts[0]) and parts[1].isalpha():
        return f'{parts[1]} {parts[0]}'
    return g

for r in rows:
    r['grade'] = reorder_grade(r['grade'])

# ── Fix the "بهران محافظ 326" pail packaging (stray chars) ──
for r in rows:
    if 'کیلو' in r['packaging']:
        r['packaging'] = 'سطل پنجاه و پنج کیلویی'

# ── Fix truncated packaging words (trailing char bled into price column) ──
for r in rows:
    if r['packaging'].endswith('پلاستی'):
        r['packaging'] = r['packaging'] + 'کی'
    if r['packaging'].endswith('پلاستیک'):
        r['packaging'] = r['packaging'] + 'ی'

# sort by row number
rows.sort(key=lambda r: int(r['row']) if r['row'].isdigit() else 999)

with open('data/products.json', 'w', encoding='utf-8') as f:
    json.dump(rows, f, ensure_ascii=False, indent=1)

print('TOTAL:', len(rows))
print('unique names:', len(set(r['name'] for r in rows)))
print('unique grades:', len(set(r['grade'] for r in rows)))
print('packaging values:', sorted(set(r['packaging'] for r in rows)))
print()
for r in rows:
    g = f'[{r["grade"]}]' if r['grade'] else ''
    print(f"{r['row']:>3} | {r['name']:<22} {g:<12} | {r['packaging']:<22} | {r['price']:>12,}")
