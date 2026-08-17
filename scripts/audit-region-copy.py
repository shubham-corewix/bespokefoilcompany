#!/usr/bin/env python3
"""
Find place names in a region's prose that belong to a DIFFERENT region.

The bolton-wigan page ends its "Why" copy with Norfolk content - the Royal
connection, Burnham Market, the north Norfolk coast, NCT Norfolk. That is a
paste from another region's row. This looks for the same thing across all 112.

Method: every region declares its own place names in coverage_areas, city_name
and region. A name owned by exactly ONE region, appearing in ANOTHER region's
prose, is a paste. Names shared by several regions (Maidstone sits in two Kent
territories) are ignored, because a shared name proves nothing.
"""
import re, json, sys
from collections import defaultdict

SRC = 'supabase/seed-franchise-regions.sql'

# ---- split the file into one statement per region ---------------------------
sql = open(SRC, encoding='utf-8').read()
stmts = re.findall(r"insert into public\.franchise_regions[^)]*\) values \((.*?)\)\s*\n\s*on conflict",
                   sql, re.S)

def split_values(s):
    """Split a SQL VALUES list on top-level commas, respecting '' escapes."""
    out, buf, in_str, i = [], [], False, 0
    while i < len(s):
        c = s[i]
        if c == "'":
            if in_str and i + 1 < len(s) and s[i+1] == "'":
                buf.append("'"); i += 2; continue
            in_str = not in_str; i += 1; continue
        if c == ',' and not in_str:
            out.append(''.join(buf).strip()); buf = []; i += 1; continue
        buf.append(c); i += 1
    out.append(''.join(buf).strip())
    return out

COLS = ['slug','city_name','region','is_available','buy_in','franchise_potential',
        'hero_subtitle','coverage_areas','card_profile_summary','baby_classes_in_area',
        'why_area','region_coverage_desc','baby_classes_list','community_note',
        'franchisee_bio','meta_title','meta_description','latitude','longitude','population']

regions = []
for st in stmts:
    vals = split_values(st)
    if len(vals) != len(COLS):
        continue
    regions.append(dict(zip(COLS, vals)))

print(f"parsed {len(regions)} regions\n")

# ---- pull readable text out of the Wix rich-text JSON ------------------------
def plain(v):
    if not v or v == 'null':
        return ''
    if v.lstrip().startswith('{'):
        try:
            return ' '.join(m for m in re.findall(r'"text":"((?:[^"\\]|\\.)*)"', v))
        except Exception:
            return v
    return v

# ---- who owns which place name ----------------------------------------------
owner = defaultdict(set)
for r in regions:
    names = set()
    for part in r['coverage_areas'].split(','):
        n = part.strip()
        if len(n) > 3:
            names.add(n)
    for extra in (r['city_name'], r['region']):
        for chunk in re.split(r'[:,]| and ', extra):
            n = chunk.strip()
            if len(n) > 3:
                names.add(n)
    r['_names'] = names
    for n in names:
        owner[n].add(r['slug'])

exclusive = {n: list(s)[0] for n, s in owner.items() if len(s) == 1}
print(f"{len(owner)} place names, {len(exclusive)} owned by exactly one region\n")

# ---- scan each region's prose for names owned by someone else ----------------
FIELDS = ['hero_subtitle','card_profile_summary','baby_classes_in_area','why_area',
          'region_coverage_desc','baby_classes_list','community_note',
          'meta_title','meta_description']

hits = defaultdict(list)
for r in regions:
    own = r['_names']
    for f in FIELDS:
        text = plain(r[f])
        if not text:
            continue
        for name, home in exclusive.items():
            if home == r['slug'] or name in own:
                continue
            if re.search(r'\b' + re.escape(name) + r'\b', text):
                hits[r['slug']].append((f, name, home))

if not hits:
    print("No cross-region place names found.")
    sys.exit(0)

print(f"{len(hits)} region(s) mention another region's places:\n")
for slug in sorted(hits, key=lambda s: -len(hits[s])):
    rows = hits[slug]
    by_home = defaultdict(set)
    for f, name, home in rows:
        by_home[home].add(name)
    fields = sorted({f for f, _, _ in rows})
    print(f"  {slug}")
    for home, names in sorted(by_home.items(), key=lambda x: -len(x[1])):
        print(f"     mentions {home}: {', '.join(sorted(names))}")
    print(f"     fields: {', '.join(fields)}")
    print()
