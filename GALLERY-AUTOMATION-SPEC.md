# Bespoke Baby Gallery - automated content pipeline

Spec for Dixit. Written 31/07/2026.

Goal: customer uploads reach `/bespoke-baby-gallery` with no manual step. Ryan's
decision is that content is not gated before publication; the wall is reviewed
after the fact and individual items are corrected or pulled in Supabase.

---

## 1. Two problems in the current build that must be solved first

**`status` is the submission lifecycle, not a publication state.** It is
`pending | complete | failed | purged` and it tracks whether the order was
received and processed. It cannot double as gallery state without breaking the
purge interlock. Gallery state needs its own column.

**`upload-portal-purge.js` deletes the gallery's source files.** It removes
`social_photo_path` and `social_video_path` once `downloaded_at` is set and the
cutoff has passed. If the gallery pointed at those paths, every photo on the wall
would disappear on a rolling basis, silently, weeks after it went live.

The fix for the second is the important architectural decision below: derived
gallery media lives in a **separate bucket**, and originals stay purgeable.

---

## 2. Buckets

| Bucket | Visibility | Contents | Purged? |
|---|---|---|---|
| `upload-portal` | private | customer originals, print sheets, social uploads | yes, existing job |
| `gallery` | **public** | derived square photos and 9:16 clips only | no |

The pipeline reads from `upload-portal` and writes derived copies to `gallery`.
Purge continues untouched. The wall is unaffected by it.

---

## 3. Schema additions

```sql
alter table public.upload_submissions
  add column gallery_state text not null default 'new'
    check (gallery_state in ('new','processing','live','hidden','failed')),
  add column gallery_photo_path text,
  add column gallery_video_path text,
  add column gallery_error text,
  add column gallery_published_at timestamptz;

-- Only rows the customer consented to are ever eligible.
create index on public.upload_submissions (gallery_state)
  where social_consent = true;
```

`gallery_state` meanings:

- `new` - eligible, not yet processed
- `processing` - claimed by a worker (guards against double-processing)
- `live` - derived media exists and is on the wall
- `hidden` - pulled. Never deleted, so it cannot be re-picked up by a later run
- `failed` - processing errored, see `gallery_error`

---

## 4. Pipeline

### 4.1 Trigger

Supabase database webhook on `upload_submissions` update, firing when
`status` becomes `complete`. Posts the row id to a Netlify background function.

Eligibility, checked by the worker not the webhook:

```
social_consent = true
AND status = 'complete'
AND gallery_state = 'new'
AND (social_photo_path IS NOT NULL OR social_video_path IS NOT NULL)
```

Claim the row by setting `gallery_state = 'processing'` with a conditional
update on `gallery_state = 'new'`. If zero rows come back, another worker has it.

### 4.2 Image processing

Standard Netlify Function is fine, `sharp` handles this in well under a second.

```
1. Download social_photo_path from `upload-portal`
2. rotate()                 -- bake in EXIF orientation FIRST
3. Centre square crop. For portrait sources bias the crop 32% from the top;
   faces sit above centre in phone photos.
4. resize(1000, 1000)
5. .webp({ quality: 80 })
6. Write to `gallery` as bb-<reference>.webp
```

**`sharp` drops all metadata by default.** Do not pass `withMetadata()`. In the
initial hand-processed batch, **24 of 43 customer photos carried GPS
coordinates** - home addresses. This is not a theoretical risk.

### 4.3 Video processing

This is the hard part and the reason the pipeline needs a **background**
function. Standard functions time out at 10 seconds; a 30MB phone video will not
transcode in that. Background functions allow 15 minutes.

Target spec, matching the existing Memory Catcher clips:

```
ffmpeg -ss <start> -t <src_seconds> -i in.mp4 \
  -vf "setpts=PTS/<speed>,scale=576:1024:force_original_aspect_ratio=increase,crop=576:1024" \
  -an \
  -c:v libx264 -preset medium -profile:v high -pix_fmt yuv420p \
  -crf 30 -maxrate 620k -bufsize 1240k \
  -movflags +faststart out.mp4
```

Notes that cost real time to learn:

- **`-ss` and `-t` must come BEFORE `-i`.** After the speed filter they limit
  the OUTPUT, so every clip comes out at `speed` times the intended length.
- **`-an` is not optional.** Autoplay requires muted. Stripping the track rather
  than muting also removes the bytes.
- **`-maxrate` is not optional either.** Without a ceiling, one grainy handheld
  clip encoded at 3.4MB against a 416KB benchmark.
- `+faststart` puts the moov atom at the front so playback can begin before the
  file finishes downloading.

Automatic parameter choice, since nobody is reviewing cuts:

| Source length | Take | Speed | Result |
|---|---|---|---|
| under 5s | all | 1.0x | as-is |
| 5 to 20s | from 1s, up to 12s | 1.5x | ~8s |
| 20 to 60s | from 2s, up to 14s | 1.6x | ~9s |
| over 60s | from 10%, 16s | 2.0x | 8s |

If ffmpeg in a background function proves unreliable at volume, the escape hatch
is Mux or Cloudinary. Both do this transformation natively and remove the
timeout question entirely, at a per-minute cost.

### 4.4 Publish

On success: write the derived paths, set `gallery_state = 'live'` and
`gallery_published_at = now()`. On failure: `gallery_state = 'failed'` with the
error in `gallery_error`, so it can be found rather than vanishing.

---

## 5. Getting it onto the page

The wall currently ships with its feed baked into the HTML. Keep that. It is the
fastest option, needs no client-side fetch, caches perfectly at the CDN and works
without JavaScript.

**Nightly Netlify build hook.** A scheduled function queries the live rows,
regenerates the `MEDIA` array in `bespoke-baby-gallery.html` and triggers a
deploy. Uploads appear within 24 hours, which for a gallery wall is fine, and it
costs one build a day rather than one per upload.

Add a manual trigger too, for when Ashley wants something up immediately.

Feed shape, already implemented on the page:

```js
{ type: "img" | "vid", src, poster?, alt }
```

Order is shuffled with a **fixed seed** so the mix looks varied but does not
reorder on every deploy. Keep that behaviour; use the row id as the seed input
so new items distribute through the wall rather than all landing at the end.

---

## 6. Pulling something down

Set `gallery_state = 'hidden'` and trigger a rebuild. The item leaves the wall on
the next deploy, roughly two to three minutes.

Never delete the row. A deleted row with `gallery_state = 'new'` semantics could
be re-processed by a later run and reappear.

For a genuinely urgent takedown that cannot wait for a build, an edge function
filtering the feed against a small denylist would be needed. Not built; noted in
case it is ever wanted.

---

## 7. Consent

The step 8 tick was widened on 31/07 to cover the website as well as social
media. Rows created before that date consented only to social use. If any are
backfilled onto the wall, that needs a separate conversation with those
customers.

`social_consent = false` must be a hard filter at every stage.

Customers can withdraw consent; the tick now says so. Withdrawal means
`gallery_state = 'hidden'` plus deleting the derived files from the `gallery`
bucket.

---

## 8. Order of work

1. Schema columns and the `gallery` bucket
2. Image path end to end, including the webhook and the claim logic
3. Nightly build hook and feed generation
4. Video path in a background function
5. Manual publish-now and hide controls

Steps 1 to 3 deliver a self-filling wall of photos on their own. Video can
follow once volume is understood.
