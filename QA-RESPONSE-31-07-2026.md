# QA list response - 31/07/2026

Triage of Dixit's 16 QA items against the code. Split by who does what.

---

## Already fixed (3)

Dixit tested `rainbow-lily-b43c61.netlify.app`, which is the **30 July** build. These
were done earlier today and are in the 31 July package:

| Item | Status |
|---|---|
| Remove cart icon from header | Done. Removed from all 44 pages. No JavaScript was ever bound to it on any page, so it was a dead affordance implying a basket flow that does not exist. |
| Add a video to the Our Story page | Done. `assets/our-story.mp4`, 720p, faststart, mounts on click. |
| Add Trustpilot link to Print Quality Guarantee | Done. It existed but was `<a href="#">` - a dead link. Now points at the live profile. |

---

## Blocked on content, not broken (2)

These cannot be fixed by changing code. The targets do not exist.

### View Region buttons should link to their corresponding region pages

`regions.json` holds **112 regions**. **One** region page exists
(`franchise-region-west-norfolk-kings-lynn.html`). The card template already carries
the explanation:

```
TEMP for nav testing: all View Region buttons point to the one built region page.
Revert to href="/franchises/${esc(r.slug)}" once per-region pages / CMS exist.
```

And `_redirects` line 43 says the same: *"Dixit wires remaining 108 CMS routes"*.

Making the links dynamic today would 404 for 111 of 112 regions, which is worse than
the current state. **It is a one-line change the moment the pages or CMS routes
exist.** Until then it is correctly parked.

### View Profile buttons on Find a Memory Catcher

Same shape. One bio page exists (Ashley). The network has one franchisee beyond her
(Salamata Bah), and no page for her yet. Needs the bio pages before the links can go
anywhere.

---

## Backend - Dixit (6)

Ryan's call: all backend goes to Dixit.

### The four forms are not broken, they were never wired

| Form | Submit JS | Endpoint |
|---|---|---|
| Slot Reservation | **none** | none |
| Memory Catcher Enquiry | **none** | none |
| Contact | handler present, no `fetch()` | none |
| Join Community (on `/franchise`) | partial | none |

`functions/submit-lead.js` exists but **is not routed in `_redirects`**, so nothing
could reach it even if the forms did post. Needs a route plus per-form wiring.

Worth reusing the pattern already proven in `upload-portal-submit.js`: post JSON,
write the row first so a failure still leaves a record, return a reference.

### Franchisee login page

No endpoint, no auth. This is a build, not a fix. Worth deciding whether it uses
Supabase Auth (the franchisee hub already reads from Supabase) or a simpler
magic-link approach, before any code is written.

### Blog list and detail pages via Supabase

Ryan: do this now, alongside the gallery pipeline.

**Read this before starting.** There are **16 static post pages** and they carry live
SEO. `_redirects` maps `/post/<slug>` for each, and the SEO metadata was ported from a
Screaming Frog crawl of the Wix site specifically so those rankings survived migration.

Moving them to Supabase must not change a single URL. Safest shape is to keep the
static pages generated **at build time** from Supabase rather than fetched in the
browser: the CMS becomes the source of truth, the output stays static HTML, URLs and
rankings are untouched, and there is no client-side fetch before content paints.
Client-side rendering of blog content would mean Google seeing an empty page on first
crawl, which is the one outcome to avoid here.

Same build-hook pattern as the gallery in `GALLERY-AUTOMATION-SPEC.md`.

---

## Front end - mine (3, one blocked on info)

### Postcode search on Find a Memory Catcher and Franchise Region

`regions.json` has 112 entries with fields `region, city, avail, potential, coverage,
link, lat, lon, pop`. **No postcode field of any kind**, which is why postcode search
does not work while town and name search do.

Ryan's call: use **postcodes.io**, which is free, open, no key required and covers the
whole UK. Approach: postcode in, lat/lon back, then nearest region by distance against
the `lat`/`lon` already in `regions.json`. That works for all 112 regions immediately
with no data entry, and it degrades gracefully - if the lookup fails, fall back to the
existing town/name search rather than showing an error.

### Facebook and Instagram links missing

`https://www.facebook.com/TheBespokeFoilCompany` is already in the codebase.
**No Instagram URL exists anywhere in the repo.** Need it from Ryan before this can be
done properly. Once supplied: footer on all pages plus the franchise bio template.

### Slider buttons on Foil Fusion, hamburger on Franchise

**Cannot reproduce by inspection, and everything checks out:**

- Foil Fusion: `#tstTrack` and `#revTrack` both exist, 3 and 6 cards respectively,
  both tracks are `overflow-x: auto` with scroll-snap, all four button IDs exist and
  are wired, all script blocks parse clean, nothing preceding them in the same block
  can throw.
- Franchise: `#navMenu`, `.burger` and `#navMenuClose` all present exactly once, the
  toggle script runs after the markup, the page loads `shared/styles.css` which
  carries the `.nav-menu.open` rule, all seven script blocks parse clean.

Rather than guess at a fix and risk introducing a regression, **need from Dixit**: the
browser console error, the browser and version, and whether it fails on mobile,
desktop or both. One line of console output will settle it.

One hypothesis worth him checking first: `scroll-snap-type: x mandatory` can fight
programmatic `scrollTo({behavior:'smooth'})` in some browsers, and the symptom is
exactly "the buttons do nothing". If the console is clean, that is where to look.
