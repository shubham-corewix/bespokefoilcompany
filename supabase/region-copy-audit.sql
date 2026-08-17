-- =============================================================================
-- Region copy: find and fix cross-region contamination
-- -----------------------------------------------------------------------------
-- Ryan spotted Norfolk copy on the Bolton and Wigan page, 16/08:
--   "The Royal connection lends prestige... Burnham Market and the north
--    Norfolk coast add ultra-premium holiday visitors."
--   "NCT Norfolk runs occasional groups."
--
-- WHAT THE AUDIT FOUND
--
-- The seed file is CLEAN. All 112 rows were checked, sentence by sentence, for
-- prose mentioning another region's exclusive place names. Every one of those
-- Norfolk phrases lives in `norfolk-west` in the seed and nowhere else, and
-- bolton-wigan's seeded copy is entirely about Bolton and Wigan.
--
-- So this was introduced into the LIVE database after seeding - it is not a bug
-- in the data we generated. Which means it could have happened to any row, and
-- only the live database can say. Section 1 finds them.
--
-- The other 21 flagged sentences across 12 regions were checked by hand and are
-- legitimate: a territory naturally refers to the city next door. Bristol North
-- and Somerset mentions Bristol, Edinburgh and Lothians mentions Edinburgh,
-- Bolton and Wigan mentions Greater Manchester. Those are correct and must not
-- be "fixed".
--
-- One genuine oddity worth a decision, not a fix: `sutton-merton` describes
-- Wimbledon's baby class scene, but Wimbledon belongs to
-- `richmond-kingston-wimbledon`. Two territories describing the same town is a
-- boundary question, not a paste.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Find contaminated rows
-- -----------------------------------------------------------------------------
-- Any row OTHER than norfolk-west containing Norfolk-only copy.

select slug,
       region,
       case
         when why_area            ilike '%Burnham Market%'      then 'why_area'
         when why_area            ilike '%Royal connection%'    then 'why_area'
         when why_area            ilike '%NCT Norfolk%'         then 'why_area'
         when community_note      ilike '%Norfolk%'             then 'community_note'
         when card_profile_summary ilike '%Norfolk%'            then 'card_profile_summary'
         when baby_classes_in_area ilike '%NCT Norfolk%'        then 'baby_classes_in_area'
         when baby_classes_list    ilike '%NCT Norfolk%'        then 'baby_classes_list'
       end as contaminated_field
  from public.franchise_regions
 where slug <> 'norfolk-west'
   and (why_area             ilike '%Burnham Market%'
     or why_area             ilike '%Royal connection%'
     or why_area             ilike '%NCT Norfolk%'
     or community_note       ilike '%Norfolk%'
     or card_profile_summary ilike '%Norfolk%'
     or baby_classes_in_area ilike '%NCT Norfolk%'
     or baby_classes_list    ilike '%NCT Norfolk%')
 order by slug;


-- -----------------------------------------------------------------------------
-- 2. A wider sweep - any region naming a county it does not cover
-- -----------------------------------------------------------------------------
-- Broader than the Norfolk case, in case the same paste happened with a
-- different source row. Expect some legitimate hits where a territory borders a
-- county; read the results rather than acting on them blindly.

select slug, region, 'mentions ' || c as flag
  from public.franchise_regions,
       unnest(array['Norfolk','Suffolk','Cornwall','Devon','Dorset','Cumbria',
                    'Northumberland','Lincolnshire','Shropshire','Herefordshire']) as c
 where why_area ilike '%' || c || '%'
   and region  not ilike '%' || c || '%'
   and coverage_areas not ilike '%' || c || '%'
 order by slug;


-- -----------------------------------------------------------------------------
-- 3. Repair
-- -----------------------------------------------------------------------------
-- The seed file is the clean source, and it upserts on slug - so re-running
-- `seed-franchise-regions.sql` restores every row to its correct copy.
--
-- BEFORE DOING THAT, note what it would overwrite: is_available, and any
-- editorial changes made in Supabase since 04/08. Camille's and Ashley's taken
-- flags would be reset to available, and their region pages would start
-- inviting applications again.
--
-- So the safe order is:
--
--   1. run section 1 above and note which slugs are affected
--   2. re-run supabase/seed-franchise-regions.sql
--   3. re-run supabase/region-handover.sql, which sets the taken flags back
--
-- Step 3 is not optional. Doing 2 without it silently un-takes every region.
--
-- To repair a single row instead, without touching anything else, take that
-- region's why_area value from the seed file and update just that column.
