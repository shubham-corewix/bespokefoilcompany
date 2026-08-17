# Deploy failure - what happened and what to do

## The build failed, and the check was right to fail it

`check-sitemap.js` blocked the deploy with 16 lines like:

```
- post-baby-wont-open-hand-for-handprints.html exists but no route points at it
- franchise-region-west-norfolk-kings-lynn.html exists but no route points at it
```

**Those files are not in the package.** They were deleted on 04/08 when the blog
and franchise regions moved to dynamic templates - one `post-template.html` and
one `franchise-region-template.html` now serve all of them from Supabase.

**They are still in the repo because copying a zip over a repo applies additions
and edits, but never deletions.** The new scripts landed; the removals did not.
That is worth knowing generally - it will happen again on any round where files
are removed rather than changed.

## What has changed in this package

**1. The orphan check is now a warning, not an error.**

Blocking a deploy over an unreferenced file is the wrong trade. It is untidy, not
harmful. The three checks that actually matter stay fatal:

- a route pointing at a file that does not exist
- a non-excluded route missing from `sitemap.html`
- any of the 112 regions or 15 posts missing from the sitemap

The build now prints the orphan list and carries on. Verified both ways: with
legacy files present it warns and exits 0; with the regions stripped out it still
fails with `112 of 112 franchise regions missing`.

**2. Legacy paths are now 301'd.**

This is the part that mattered. `/post-baby-wont-open-hand-for-handprints.html`
is crawlable at that literal path. Left alone it is a **duplicate of the live
`/post/<slug>` URL** with no canonical pointing anywhere - exactly the kind of
thing that quietly splits ranking signals.

16 redirects added covering all 15 posts and the old region page. They are
harmless if the files are absent; the rules simply never match.

## What to do

**Delete the orphaned files from the repo.** They are superseded and the 301s are
a safety net, not a substitute:

```
git rm post-baby-wont-open-hand-for-handprints.html \
       post-can-you-use-paint-for-baby-handprints.html \
       post-capture-baby-s-first-touch-with-foil-prints.html \
       post-create-lasting-memories-with-one-tiny-touch.html \
       post-don-t-let-your-memories-fade-away.html \
       post-foil-fusion-the-future-of-baby-keepsakes.html \
       post-foil-fusion-vs-toner-foiling-the-real-difference.html \
       post-handprints-or-footprints-newborn.html \
       post-how-to-take-your-babys-handprints-neatly.html \
       post-step-by-step-guide-to-a-beautiful-baby-keepsake.html \
       post-the-must-have-handprint-kit-for-new-parents.html \
       post-the-perfect-gift-for-new-mums-and-dads.html \
       post-tiny-hands-big-emotions-captured-forever.html \
       post-why-every-parent-needs-a-baby-footprint-keepsake.html \
       post-why-foil-prints-make-the-ultimate-baby-gift.html \
       franchise-region-west-norfolk-kings-lynn.html
```

**Keep `post-template.html` and `franchise-region-template.html`** - those are the
live templates the edge functions render into.

The build will pass either way now. Deleting them just removes the warning and
the duplicate-content exposure.
