-- =============================================================================
-- Onboarding a Memory Catcher: the data half
-- -----------------------------------------------------------------------------
-- Run this when a Memory Catcher takes a region. The code half is already
-- deployed and needs no change per franchisee - the region page and the finder
-- both read these columns.
--
-- WHAT HAPPENS AUTOMATICALLY once these rows are set:
--
--   * the finder card flips to "Unavailable" and stays CLICKABLE
--   * the region page status changes to "This region is taken"
--   * the Register Your Interest button becomes "View the Memory Catcher for
--     this region" and links to /franchises-bio/<her slug>
--
-- The link is resolved from `franchisees.map_region_slug`, so that column is
-- what actually connects a person to a region. Set it or the button silently
-- falls back to Register Your Interest - which is the safe way round, but not
-- what you want.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Camille - Blackburn and Burnley (East Lancashire)
-- -----------------------------------------------------------------------------
-- Ryan, 16/08: she is referred to as East Lancashire but primarily covers
-- Blackburn and Burnley, so the displayed name carries both. The SLUG does not
-- change - it is in the URL, and the region already exists as blackburn-burnley.
--
-- `region` is the display name: 14 places in the region template and the finder
-- card both read it, so changing this one column renames her area everywhere at
-- once.

update public.franchise_regions
   set region       = 'Blackburn and Burnley (East Lancashire)',
       is_available = false,
       updated_at   = now()
 where slug = 'blackburn-burnley';

-- Run tomorrow, once her onboarding form is in and her franchisees row exists.
-- Until this line runs, her region page shows "taken" with no way through to
-- her, which is the right failure: better a dead status than a dead link.
--
-- update public.franchisees
--    set map_region_slug = 'blackburn-burnley'
--  where slug = 'camille-ashforth';


-- -----------------------------------------------------------------------------
-- 2. Ashley - Bolton and Wigan
-- -----------------------------------------------------------------------------
-- Already unavailable and already linked, so this is belt and braces: it makes
-- the state explicit and is safe to re-run.

update public.franchise_regions
   set is_available = false, updated_at = now()
 where slug = 'bolton-wigan';

update public.franchisees
   set map_region_slug = 'bolton-wigan'
 where slug = 'ashley-eccleston';


-- -----------------------------------------------------------------------------
-- 3. Check it landed
-- -----------------------------------------------------------------------------
-- Every taken region should have a Memory Catcher pointing at it. Any row this
-- returns is a region whose page says "taken" with no one to send people to.

select r.slug,
       r.region,
       r.is_available,
       f.slug as memory_catcher
  from public.franchise_regions r
  left join public.franchisees f
         on f.map_region_slug = r.slug
        and f.active
 where r.is_available = false
 order by r.region;
