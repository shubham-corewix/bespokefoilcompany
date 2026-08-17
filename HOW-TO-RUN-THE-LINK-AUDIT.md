# How to run the migration link audit

**Run this while the old site is still live.** Once DNS moves, the comparison
becomes impossible and section 1 is not recoverable.

Takes about a minute. No dependencies, no install beyond Node itself.

---

## 1. Check you have Node

```bash
node -v
```

Needs **v18 or higher** (the script uses native `fetch`). If the command isn't
found, get the LTS installer from https://nodejs.org — nothing else is needed.

If you'd rather not install anything, send this file and the site zip to Dixit;
it's a two-minute job for him.

## 2. Unzip the site somewhere

```bash
cd ~/Downloads
unzip thebespokefoilcompany.co.uk-07-08-2026.zip -d bfc-audit
cd bfc-audit
```

## 3. Run it

```bash
node scripts/migration-link-audit.js
```

You'll see `crawling 12/47` tick along, then a summary. It writes
**`MIGRATION-LINK-AUDIT.md`** into that folder.

To point it at a different address:

```bash
node scripts/migration-link-audit.js --old https://www.thebespokefoilcompany.co.uk
```

---

## What you'll get

**Section 1 — old URLs with no route or redirect.** The expensive one. These 404
the moment DNS moves and every backlink pointing at them is thrown away
permanently. It gives you a paste-ready `_redirects` block:

```
/faqs                    TODO   301
/stories-inspiration     TODO   301
```

Replace each `TODO` with the new path, paste into `_redirects`, redeploy.

**Section 2** — internal link targets the new site can't serve, with how many
inbound links each had.

**Section 3** — pages that lost inbound internal links, old count vs new. This is
the one to send Mark: it's the direct answer to "has all the internal linking
been added?"

**Section 4** — anchor text that didn't carry over.

The script **exits with code 1 if section 1 has anything in it**, and 0
otherwise. Sections 2 to 4 are judgement calls for a human to read, not reasons
to block a deploy.

---

## If it fails

It now prints exactly what it tried and why each attempt failed. The three you
might see:

- **ECONNREFUSED / ENOTFOUND** — the machine can't reach the site. VPN or proxy.
- **HTTP 403** — the site is blocking an unrecognised user agent. Tell me and
  I'll add one.
- **HTTP 404 on every sitemap path** — Wix isn't serving a sitemap where expected.
  Check `https://www.thebespokefoilcompany.co.uk/sitemap.xml` in a browser and
  tell me what you see.

An earlier version swallowed all three and reported "no sitemap found" for every
one of them, which told you nothing. That's fixed.

---

## Tested

Verified end to end against a mock Wix-style site with a sitemap **index**
pointing at `pages-sitemap.xml` and `blog-posts-sitemap.xml`, which is the shape
Wix actually serves. It correctly merged both, crawled every page, and flagged
the three renamed slugs with no redirect.
