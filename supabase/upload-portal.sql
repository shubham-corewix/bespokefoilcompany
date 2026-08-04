-- ---------------------------------------------------------------------------
-- BFC - Upload Portal submissions
-- Run in the Supabase SQL editor BEFORE deploying the upload portal functions.
--
-- DESIGN NOTES
-- 1. Files live in Storage, not here. This table holds the structured data and
--    the object PATHS. The browser uploads direct to Storage so nothing large
--    ever crosses a Netlify function (hard 6MB limit, cannot be raised).
-- 2. Rows are kept, files are purged. A row is ~2KB; the media is the expensive
--    part. Purging files but keeping the row preserves order history for
--    reorders and queries.
-- 3. No franchisee attribution by design (per Ryan, 28/07): Memory Catchers do
--    not touch anything after point of sale. `order_number` is the join key if
--    a submission ever needs tying back to a sale.
-- ---------------------------------------------------------------------------

create table if not exists public.upload_submissions (
  id                uuid primary key default gen_random_uuid(),
  reference         text not null unique,          -- UP-XXXXXXXX, shown to the customer

  -- Step 1
  full_name         text not null,
  email             text not null,
  phone_country     text not null default 'GB',    -- ISO-2 from the dropdown
  phone_dial_code   text not null default '+44',
  phone_national    text not null,                 -- digits as typed, leading 0 stripped
  phone_e164        text not null,                 -- +447700900123, what Zendesk gets

  -- Step 2
  purchased_from    text,
  order_number      text not null,

  -- Steps 4-8 (personalisation / customisation / proof / social)
  person_line1      text,
  person_line2      text,
  font_choice       text,
  layout_choice     text,
  frame_choice      text,
  card_foil         text,
  proof_channel     text,
  social_consent    boolean not null default false,

  -- Step 9
  addr1             text,
  addr2             text,
  town_city         text,
  postcode          text,

  -- Storage object paths (bucket 'upload-portal'), null when not supplied
  print_sheet_1_path text,
  print_sheet_2_path text,
  social_photo_path  text,
  social_video_path  text,

  -- Lifecycle
  -- pending  : row written, browser still uploading
  -- complete : all declared files uploaded, Zendesk ticket raised
  -- failed   : browser never came back to confirm (chase these)
  -- purged   : files deleted, row retained
  status            text not null default 'pending'
                    check (status in ('pending','complete','failed','purged')),

  zendesk_ticket_id text,

  -- RETENTION. Nothing is purgeable until downloaded_at is stamped. That single
  -- guard is what makes automated deletion safe: a batch nobody has pulled down
  -- yet can never be deleted out from under Ashley, however old it is.
  downloaded_at     timestamptz,
  files_purged_at   timestamptz,

  -- Diagnostics
  user_agent        text,
  submitted_at      timestamptz not null default now(),
  completed_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists upload_submissions_order_idx    on public.upload_submissions (order_number);
create index if not exists upload_submissions_status_idx   on public.upload_submissions (status);
create index if not exists upload_submissions_created_idx  on public.upload_submissions (created_at desc);
-- Drives the purge sweep: oldest downloaded-but-not-yet-purged first.
create index if not exists upload_submissions_purge_idx
  on public.upload_submissions (downloaded_at)
  where files_purged_at is null;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists upload_submissions_touch on public.upload_submissions;
create trigger upload_submissions_touch before update on public.upload_submissions
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- RLS: service role only. The functions use the service role key, which
-- bypasses RLS. Creating no anon/authenticated policy means the browser cannot
-- read or write this table at all, which is what we want - it contains names,
-- addresses and phone numbers of families.
-- ---------------------------------------------------------------------------
alter table public.upload_submissions enable row level security;

-- ---------------------------------------------------------------------------
-- WORKING VIEWS for Ashley
-- ---------------------------------------------------------------------------

-- Everything raised but not yet pulled down.
create or replace view public.uploads_awaiting_download as
select reference, full_name, order_number, email, phone_e164,
       zendesk_ticket_id, completed_at,
       (print_sheet_1_path is not null)::int
     + (print_sheet_2_path is not null)::int
     + (social_photo_path  is not null)::int
     + (social_video_path  is not null)::int as file_count
from public.upload_submissions
where status = 'complete' and downloaded_at is null
order by completed_at;

-- Submissions where the browser never confirmed. Usually a dropped upload on a
-- poor connection - the customer's details are still here, so they can be
-- chased rather than lost, which is the main win of writing the row first.
create or replace view public.uploads_incomplete as
select reference, full_name, email, phone_e164, order_number, submitted_at, user_agent
from public.upload_submissions
where status = 'pending' and submitted_at < now() - interval '2 hours'
order by submitted_at;

-- ---------------------------------------------------------------------------
-- STORAGE BUCKET
-- Private. Every read goes through a signed URL minted server-side.
-- file_size_limit is bytes. 52428800 = 50MB, the Supabase FREE plan ceiling.
-- On Pro raise this (and the project's global limit) to taste - 200MB is
-- 209715200. allowed_mime_types stops a leaked upload token being used to park
-- arbitrary files on your storage bill.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'upload-portal', 'upload-portal', false, 52428800,
  array['image/jpeg','image/png','image/webp','image/heic','image/heif',
        'video/mp4','video/quicktime','video/webm']
)
on conflict (id) do update
  set file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types,
      public             = false;

-- No storage policies for anon: uploads are authorised per-object by a
-- short-lived signed token minted by upload-portal-submit, and reads by a
-- signed URL minted by upload-portal-complete. Nothing is publicly listable.
