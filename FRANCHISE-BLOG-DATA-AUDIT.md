# Franchise Region + Blog modules - data audit and questions

For Dixit, 4 August 2026. Written before any code, per your note: *"If any
required data is missing or ambiguous in the CSV, ask for clarification before
implementing."*

Short version: **the CSV is in good shape.** 111 rows, all 111 slugs unique and
already URL-safe, no empty fields except one. Five things need a decision before
the schema is finalised, and one of them is a real blocker.

---

## 1. Postcode search - the data is already here

You said *"This is not working, its just doing text based search not zipcode base."*
Correct, and the reason is that the current `regions.json` has **no postcode field
at all** - only region, city, lat and lon. Text search was all it could do.

**The CSV solves this on its own.** Every row has a `Postcodes` column of
space-separated outcodes:

```
ipswich-suffolk         IP1 IP2 IP3 IP4 IP5 IP6 IP7 IP8 IP11 IP12 ...
waltham-forest-redbridge E4 E10 E11 E17 E18 IG1 IG2 IG3 IG4 IG5 ...
york-harrogate          YO1 YO10 YO23 YO24 YO26 YO30 YO31 HG1 HG2 ...
```

**1,473 postcode entries across 111 regions.** No external lookup service is
needed. Normalise the visitor's input to its outcode (`IP1 2AB` -> `IP1`) and
match against the array.

**Recommend a child table rather than a text column**, so the match is an indexed
equality test rather than a `LIKE '%IP1%'` scan - which would also wrongly match
`IP11` when someone types `IP1`.

```sql
create table franchise_postcodes (
  region_id  uuid references franchise_regions(id) on delete cascade,
  outcode    text not null,
  primary key (region_id, outcode)
);
create index on franchise_postcodes (outcode);
```

### QUESTION 1 - 30 outcodes belong to two regions each

These are claimed by two regions in the CSV:

| Outcode | Regions |
|---|---|
| TN12, ME17 | `kent-mid`, `kent-west` |
| BN15 | `sussex-west`, `brighton` |
| SR7 | `county-durham`, `sunderland-south-tyneside` |
| BT27, BT28 | `down-lisburn`, `belfast` |
| ...and 24 more | |

That may well be deliberate - real territories do overlap at the boundary. But it
means a postcode search can return two Memory Catchers.

**Which behaviour do you want?**
- (a) Show all matching regions - honest, but a visitor may not know which to pick
- (b) One region owns each outcode - needs a tie-break rule and a data fix
- (c) Rank by something (nearest by lat/lon, or a priority column)

The child-table design supports all three, so this does not block the schema. It
does block the listing page's search behaviour.

---

## 2. BLOCKER - the 111 territory maps are Wix-hosted

Every row has a `Map` value, and **all 111 are `wix:image://` references**:

```
wix:image://v1/cc6e5a_29d8bbab6f774883aa57e5f5a444b62a~mv2.png/ipswich-suffolk_territory.png
```

That is Wix's internal media protocol, not a public URL. It cannot be fetched by
the site, and it dies with the Wix account.

**These need exporting from Wix media manager before that account closes**, then
uploading to Supabase Storage. 111 territory maps is not a small job and nothing
else can render them in the meantime.

### QUESTION 2
Can someone bulk-export the territory maps from Wix? If they can be pulled as a
folder named by slug (`ipswich-suffolk_territory.png` etc, which is already the
filename inside the reference), the import is straightforward.

The schema should store a Supabase Storage path, not the Wix reference:

```sql
map_image_path text   -- e.g. 'territories/ipswich-suffolk.png'
```

---

## 3. Slug mismatch worth knowing about

The CSV slug for that region is **`norfolk-west`**. The existing built page is
`franchise-region-west-norfolk-kings-lynn.html` and `_redirects` maps
`/franchises/norfolk-west` to it, so **the live route already matches the CSV.**
Good - no redirect needed.

But `regions.json` (which the current listing page reads) has **112 entries where
the CSV has 111**. The extra one is **`isle-of-man`**, marked Available.

### RESOLVED 04/08 - Isle of Man was simply missed

Ryan confirms it is a live, available territory. Row written and appended:
**`Franchises_Region-with-isle-of-man.csv`, 112 rows.** Use that file for the
import, not the 111-row original.

Modelled on the existing `isle-of-wight` row, which is the natural analogue
(island, self-contained, "Either"). Postcodes `IM1`-`IM9`, no clash with any
existing region. The rich-text JSON round-trips cleanly. The CSV and
`regions.json` now reconcile exactly at 112 regions each.

Two things deliberately left open on that row:
- **`Map` is blank.** All 111 others have a territory map; this one needs making
  the same way as the rest.
- **No baby class providers are named.** The `isle-of-wight` row uses generic
  wording too. Naming businesses on an island nobody has checked would put
  invented claims on a live commercial page - better that Ashley supplies real
  operators if she has them.

**Worth flagging for whoever sells this territory:** the Isle of Man is a Crown
Dependency, not part of the UK. It shares a customs and VAT union so most things
behave normally, but several couriers surcharge it as offshore. Worth confirming
the real cost of sending a kit and returning a framed keepsake before anyone buys
the territory expecting mainland pricing.

---

## 4. Schema notes

Two columns need cleaning on the way in:

- **`Availability Status`** is a JSON array string: `["Available"]`, not
  `Available`. 110 Available, 1 Unavailable. Recommend importing as a plain enum
  or boolean.
- **`Buy-In`** is `£3,445` on all 111 rows - a formatted string. Recommend storing
  as `integer` pence (`344500`) and formatting in the UI, so the Founders Pricing
  change to £6,995 after the first ten franchisees is a single value update rather
  than 111 string edits.

`Franchise Potential` is `Full-Time` (100), `Either` (10), `Part-Time` (1) - clean
enough for an enum.

**`Franchisee Bio` is empty on 110 of 111 rows**, which is expected - only Ashley
has one. Worth confirming it should be nullable and that bios live on the Memory
Catcher record rather than the region record, since a franchisee could hold more
than one territory.

### QUESTION 4
Should `franchise_regions` hold the franchisee, or should there be a separate
`memory_catchers` table with a foreign key? The affiliate edge function already
reads a Memory Catcher record from Supabase, so there may be a table to join to
rather than duplicate.

---

## 5. Blog module - one thing to preserve

No issues with the requirements as written. One caveat that matters more than
anything else in that document:

**Those 16 posts carry live SEO.** Their metadata was ported from a Screaming Frog
crawl of the Wix site specifically so the rankings survived migration.

**Build the pages at build time from Supabase, not in the browser.** Supabase
becomes the source of truth, the output stays static HTML, the URLs are untouched
and Google sees fully-rendered content. Client-side fetching would mean the
crawler getting an empty shell on first pass, which would undo that work.

Same build-hook pattern as `GALLERY-AUTOMATION-SPEC.md`. The requirement that
"newly added posts need no frontend changes" is still met - a new row triggers a
rebuild.

### QUESTION 5
Is a build-time rebuild acceptable for the blog, or is there a reason it needs to
be live-fetched? A nightly or webhook-triggered build gives the same authoring
experience without the SEO risk.

---

## Summary of what is needed

| # | Question | Blocks |
|---|---|---|
| 1 | Behaviour for the 30 overlapping outcodes | listing page search |
| 2 | Can the 111 territory maps be exported from Wix? | **region profile pages** |
| 3 | Is Isle of Man live? Missing from CSV | data import |
| 4 | Franchisee on the region row, or a separate table? | schema |
| 5 | Build-time rendering acceptable for the blog? | blog approach |

Question 2 is the hard blocker - the profile pages cannot render a territory map
without those files, and the window closes when the Wix account does.
