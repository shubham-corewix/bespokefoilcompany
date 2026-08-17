#!/usr/bin/env python3
"""Generate assets/og/*.jpg (1200x630) from each page's hero image.

Run from repo root after adding/changing a page hero:
  python3 scripts/generate-og-images.py

Requires: pip install Pillow
See scripts/README.md for crop rules (JPEG for WhatsApp, 0.32 vertical bias).
"""

import glob
import os
import re

from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), '..')
SKIP = {
    'component-library.html', 'snag-tool.html', 'gallery-upload.html',
    'memory-catcher-region-map-embed.html', 'post-template.html',
    'franchise-region-template.html', 'franchise-bio-template.html',
}
DEFAULT = 'assets/hero-slide-196-1800.webp'


def hero(path):
    with open(path, encoding='utf-8') as f:
        h = f.read()
    n = h.find('nav-menu-cards')
    if n > 0:
        e = h.find('</nav>', n)
        h = h[:n] + h[e if e > 0 else n:]
    for m in re.finditer(r'<img[^>]+src="(/assets/[^"]+\.(?:webp|jpg|jpeg|png))"', h):
        u = m.group(1)
        if any(k in u for k in ('logo', 'wordmark', 'lockup', '/pay/', 'tp-')):
            continue
        rel = u.lstrip('/')
        if os.path.exists(os.path.join(ROOT, rel)):
            return rel
    return DEFAULT


def main():
    os.chdir(ROOT)
    og_dir = os.path.join('assets', 'og')
    os.makedirs(og_dir, exist_ok=True)
    count = 0
    for name in sorted(glob.glob('*.html')):
        if name in SKIP:
            continue
        src = hero(name)
        im = Image.open(src).convert('RGB')
        w, h = im.size
        tr = 1200 / 630
        if w / h > tr:
            nw = int(h * tr)
            box = ((w - nw) // 2, 0, (w - nw) // 2 + nw, h)
        else:
            nh = int(w / tr)
            top = int((h - nh) * 0.32)
            box = (0, top, w, top + nh)
        out = os.path.join(og_dir, name[:-5] + '.jpg')
        im.crop(box).resize((1200, 630), Image.LANCZOS).save(
            out, 'JPEG', quality=82, optimize=True)
        count += 1
    print(f'generate-og-images: {count} JPEG crop(s) written to assets/og/')


if __name__ == '__main__':
    main()
