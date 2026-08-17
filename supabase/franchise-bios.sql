-- ===========================================================================
-- franchise-bios.sql - REQUIRED for the dynamic bio system added 11/08/2026
-- ===========================================================================
--
-- Dixit's franchise-bio edge function, find-memory-catcher function and the
-- sitemap bios query all read columns that public.franchisees does not have
-- (it was created by commissions.sql with only slug/name/discount_code/email/
-- active). Without this migration:
--
--   * /find-a-memory-catcher shows the "could not load" error for everyone
--     (both column selects 400 against PostgREST)
--   * every /franchises-bio/<slug> renders the "Profile coming soon" panel,
--     including Ashley's - which replaces her full static bio page
--   * bios never appear in sitemap.xml (the slug,updated_at select 400s)
--
-- Run the whole file in the Supabase SQL editor. Idempotent - safe to re-run.
-- RLS already allows anon SELECT of active rows (commissions.sql), so no
-- policy changes are needed here.
-- ===========================================================================

-- 1. Columns the bio system reads --------------------------------------------

alter table public.franchisees add column if not exists full_name        text;
alter table public.franchisees add column if not exists full_address     text;   -- display region, e.g. "Wigan, St Helens & Bolton"
alter table public.franchisees add column if not exists territory        text;   -- fallback used if full_address is null
alter table public.franchisees add column if not exists covering         text[]; -- area tags on the card and bio page
alter table public.franchisees add column if not exists sort_description text;   -- one-liner on the finder card
alter table public.franchisees add column if not exists tagline          text;   -- under the name on the bio page
alter table public.franchisees add column if not exists photo            text;   -- site-relative asset path
alter table public.franchisees add column if not exists founder          boolean not null default false;
alter table public.franchisees add column if not exists bio_lead         text;   -- opening line of the About section
alter table public.franchisees add column if not exists bio_about        text;   -- plain text; blank line = new paragraph
alter table public.franchisees add column if not exists bio_offer        text;   -- plain text; blank line = new paragraph
alter table public.franchisees add column if not exists join_blurb       text;   -- franchise CTA panel; null hides the panel
alter table public.franchisees add column if not exists map_region_slug  text;   -- region slug for the embedded map; null hides the map
alter table public.franchisees add column if not exists whatsapp         text;   -- digits with country code, e.g. 447506998934
alter table public.franchisees add column if not exists facebook_url     text;
alter table public.franchisees add column if not exists instagram_url    text;
alter table public.franchisees add column if not exists meta_title       text;   -- optional SEO override
alter table public.franchisees add column if not exists meta_description text;   -- optional SEO override
alter table public.franchisees add column if not exists updated_at       timestamptz not null default now();

-- Keep updated_at honest (touch_updated_at() is created by commissions.sql).
drop trigger if exists franchisees_touch on public.franchisees;
create trigger franchisees_touch
  before update on public.franchisees
  for each row execute function public.touch_updated_at();

-- 2. Ashley - full bio, lifted verbatim from franchise-bio-ashley-eccleston.html
--    so the dynamic page renders the same content the static page carried. ----

update public.franchisees set
  full_name        = 'Ashley Eccleston',
  full_address     = 'Wigan, St Helens & Bolton',
  covering         = array['Wigan','St Helens','Bolton','Leigh','Ashton-in-Makerfield'],
  sort_description = 'Co-founder and the very first Memory Catcher. Mum of two, keepsake obsessive, and the friendly face behind it all.',
  tagline          = 'Mum of two, keepsake obsessive, and the original Memory Catcher.',
  photo            = '/assets/mc-ashley-1000.webp',
  founder          = true,
  bio_lead         = 'Hi, I''m Ashley - co-founder of The Bespoke Foil Company and the very first Memory Catcher.',
  bio_about        = 'I started this journey in 2017 after becoming a mum to my son Tommy. Like most new parents, I wanted to capture those tiny newborn moments before they disappeared, but every handprint kit I tried was messy, faded, or just didn''t do the moment justice. So I created something better.

What began in our back bedroom in Wigan has grown into a business that''s helped thousands of families preserve the moments that matter most. I still attend baby classes every week, kit in hand, because nothing beats seeing a parent''s face when they hold their baby''s perfect little prints for the first time.

When I''m not at classes, you''ll usually find me chasing Tommy and Teddy around soft play or trying to drink a full cup of tea while it''s still hot.',
  bio_offer        = 'Every Memory Catcher session is a relaxed, hands-on experience where we capture your baby''s hand and footprints using our exclusive Foil Fusion Technology™. No mess, no stress, just a beautiful keepsake that lasts a lifetime.

I offer sessions at local baby classes, private bookings, and special events across my area. Whether it''s a newborn''s first prints, siblings side by side, or a gift for grandparents, I''m here to help you hold onto these fleeting moments.',
  join_blurb       = 'Ashley started exactly where you might be now. If you''d love a flexible, family-friendly way to bring these moments to families in your area, see which regions are available.',
  map_region_slug  = 'bolton-wigan',
  whatsapp         = '447506998934',
  facebook_url     = 'https://www.facebook.com/TheBespokeFoilCompany',
  instagram_url    = 'https://www.instagram.com/thebespokefoilco/',
  meta_title       = 'Ashley Eccleston: Baby Memory Catcher in Wigan, St Helens & Bolton',
  meta_description = 'Meet Ashley Eccleston, your local baby Memory Catcher in Wigan, St Helens & Bolton. Capturing baby hand & footprints for lasting memories.'
where slug = 'ashley-eccleston';

-- 3. Salamata - card-level details preserved from the hardcoded finder card
--    that this system replaces. Bio fields stay null on purpose: her page
--    shows the honest "Profile coming soon" panel (which now links correctly
--    to HER url rather than temporarily borrowing Ashley's). Fill in her bio
--    fields whenever her content is ready - no code change needed. -----------

update public.franchisees set
  full_name        = 'Salamata Bah',
  full_address     = 'Greenwich & Lewisham',
  covering         = array['Greenwich','Lewisham','Blackheath','Lee','Eltham','Catford','Forest Hill'],
  sort_description = 'Your South East London Memory Catcher, capturing tiny prints across Greenwich, Lewisham and the surrounding communities.',
  photo            = '/assets/mc-what-1100.webp',
  founder          = false,
  map_region_slug  = 'greenwich-lewisham'
where slug = 'salamata-bah';

-- 4. Camille Ashforth (East Lancashire) - NOT inserted here. Whether and when
--    she appears on the public finder is Ryan's call; when ready:
--
--    insert into public.franchisees (slug, name, full_name, active, ...)
--    values ('camille-ashforth', 'Camille Ashforth', 'Camille Ashforth', true, ...);

-- 5. Verify ------------------------------------------------------------------

-- select slug, full_name, full_address, founder,
--        (bio_about is not null) as has_bio, updated_at
-- from public.franchisees where active order by full_name;
