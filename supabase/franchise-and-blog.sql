-- =============================================================================
-- Franchise regions + blog  -  schema and migration
-- Written 04/08/2026. Run in order.
--
-- Decisions already agreed with Dixit:
--   * Supabase is the single source of truth; no static page generation
--   * availability stored as boolean (the CSV holds '["Available"]')
--   * buy_in kept as the formatted string, per his call
--   * franchisee_bio optional - rendered only when set
--   * postcodes in a child table so an outcode match is an indexed equality
--     test, not LIKE '%IP1%' (which would wrongly match IP11 when someone
--     types IP1)
--   * an outcode may belong to more than one region; the search returns all
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. FRANCHISE REGIONS
-- ---------------------------------------------------------------------------
create table if not exists public.franchise_regions (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text        not null unique,
  city_name             text        not null,
  region                text        not null,
  is_available          boolean     not null default true,
  buy_in                text        not null default '£3,445',
  franchise_potential   text        not null default 'Either'
                          check (franchise_potential in ('Full-Time','Part-Time','Either')),

  hero_subtitle         text,
  coverage_areas        text,            -- comma separated, as in the CSV
  card_profile_summary  text,
  baby_classes_in_area  text,
  why_area              text,            -- rich text
  region_coverage_desc  text,
  baby_classes_list     text,            -- rich text
  community_note        text,

  -- optional: only rendered when present. 110 of 111 CSV rows are empty.
  franchisee_bio        text,

  -- SEO, unique per region. Injected server-side by the edge function, which is
  -- what makes Open Graph work - social scrapers do not run JavaScript.
  meta_title            text,
  meta_description      text,

  -- The territory map is an iframe that takes the slug, so no image column is
  -- needed. Coordinates stay because the map positions from them.
  latitude              numeric(9,6),
  longitude             numeric(9,6),
  population            integer,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists franchise_regions_available_idx
  on public.franchise_regions (is_available) where is_available;

-- Fast case-insensitive search across the fields Dixit listed.
create index if not exists franchise_regions_search_idx
  on public.franchise_regions
  using gin (to_tsvector('english',
    coalesce(region,'') || ' ' || coalesce(city_name,'') || ' ' ||
    coalesce(coverage_areas,'') || ' ' || coalesce(card_profile_summary,'')));

-- ---------------------------------------------------------------------------
-- 2. POSTCODES  (child table)
-- ---------------------------------------------------------------------------
create table if not exists public.franchise_postcodes (
  region_id  uuid not null references public.franchise_regions(id) on delete cascade,
  outcode    text not null,
  primary key (region_id, outcode)
);

-- The whole point of the child table: outcode lookup is an index seek.
create index if not exists franchise_postcodes_outcode_idx
  on public.franchise_postcodes (outcode);

-- ---------------------------------------------------------------------------
-- 3. BLOG
-- ---------------------------------------------------------------------------
create table if not exists public.blog_posts (
  id               uuid primary key default gen_random_uuid(),
  slug             text        not null unique,
  title            text        not null,
  excerpt          text,
  body             text        not null,          -- HTML
  hero_image_path  text,                          -- storage path or /assets/...
  hero_image_alt   text,
  category         text,
  author           text        default 'The Bespoke Foil Company',
  published        boolean     not null default false,
  published_at     timestamptz,
  meta_title       text,
  meta_description text,

  -- The existing post-template.html is already fully placeholder-driven, so the
  -- schema mirrors its tokens exactly. Anything nullable renders as empty.
  final_thoughts   text,                          -- {{final_thoughts}}
  read_time        integer,                       -- {{read_time}}, minutes; computed if null
  tags             text[]      default '{}',      -- {{tags_html}}
  faqs             jsonb       default '[]',      -- {{faqs_html}} + {{faqs_jsonld}}
  author_avatar    text,                          -- {{author_avatar}}

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists blog_posts_published_idx
  on public.blog_posts (published, published_at desc) where published;

-- ---------------------------------------------------------------------------
-- 4. updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end $$ language plpgsql;

drop trigger if exists franchise_regions_touch on public.franchise_regions;
create trigger franchise_regions_touch before update on public.franchise_regions
  for each row execute function public.touch_updated_at();

drop trigger if exists blog_posts_touch on public.blog_posts;
create trigger blog_posts_touch before update on public.blog_posts
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- 5. RLS
--     The edge functions read with the ANON key. That is correct here - these
--     are public pages - but RLS must limit the anon role to rows that are
--     actually published, or an unpublished draft becomes fetchable.
-- ---------------------------------------------------------------------------
alter table public.franchise_regions   enable row level security;
alter table public.franchise_postcodes enable row level security;
alter table public.blog_posts          enable row level security;

drop policy if exists "regions readable" on public.franchise_regions;
create policy "regions readable" on public.franchise_regions
  for select to anon, authenticated using (true);

drop policy if exists "postcodes readable" on public.franchise_postcodes;
create policy "postcodes readable" on public.franchise_postcodes
  for select to anon, authenticated using (true);

-- NOTE the difference: only PUBLISHED posts are exposed to anon.
drop policy if exists "published posts readable" on public.blog_posts;
create policy "published posts readable" on public.blog_posts
  for select to anon, authenticated using (published = true);

-- Writes are service-role only (no policy granted to anon).

-- ---------------------------------------------------------------------------
-- 6. Postcode search helper
--     Returns every region claiming the outcode. 30 outcodes are shared between
--     two regions (TN12 is both kent-mid and kent-west, etc) - Ryan's call was
--     to show them all rather than pick one.
-- ---------------------------------------------------------------------------
create or replace function public.regions_by_outcode(p_outcode text)
returns setof public.franchise_regions
language sql stable as $$
  select r.*
  from public.franchise_regions r
  join public.franchise_postcodes p on p.region_id = r.id
  where p.outcode = upper(trim(p_outcode))
  order by r.region;
$$;


-- ===========================================================================
-- blog_posts.featured - added 11/08/2026
-- ===========================================================================
--
-- Dixit's blog hub (blog.html + functions/blog-posts.js, 11/08) selects
-- `featured` alongside the other card fields. PostgREST rejects the WHOLE
-- select if any column is unknown, so without this the blog list returns 400
-- and the page renders empty - not "no featured post", no posts at all.
--
-- Idempotent. If the column was already added by hand in the live project
-- this is a no-op, which is the point: the repo's SQL must always be able to
-- build the schema the repo's code reads.
-- ===========================================================================

alter table public.blog_posts
  add column if not exists featured boolean not null default false;

-- Only one post should carry the flag. A partial unique index enforces that
-- without blocking the many rows where it is false.
create unique index if not exists blog_posts_one_featured
  on public.blog_posts (featured) where featured;

-- select slug, title, featured, published from blog_posts order by published_at desc;
