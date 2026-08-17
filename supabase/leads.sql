-- ===========================================================================
-- leads.sql - REQUIRED by the submit-lead.js rewrite of 11/08/2026
-- ===========================================================================
--
-- Until now every form submission existed only as an email. If Mandrill was
-- down, rate-limited, or the address was wrong, the enquiry was gone with no
-- record that it had ever arrived. submit-lead.js now writes here FIRST and
-- emails second, so a mail failure costs a notification rather than a lead.
--
-- TWO TABLES, deliberately:
--
--   leads              franchise, mc-enquiry, contact and slot submissions
--   community_signups  the newsletter sign-up on 25 pages
--
-- The split is Dixit's request (11/08) and it earns its keep: a Supabase
-- trigger fires the welcome automation on insert into community_signups, so
-- that table needs a clean single-purpose shape rather than a form_type column
-- every trigger and query would have to filter on. Everything else shares one
-- table, per Ryan's earlier "one leads table, not four" decision.
--
-- Run the whole file in the Supabase SQL editor. Idempotent - safe to re-run.
-- ===========================================================================

-- 1. Shared leads table ------------------------------------------------------

create table if not exists public.leads (
  id           uuid primary key default gen_random_uuid(),
  form_type    text not null check (form_type in ('franchise','mc-enquiry','contact','slot')),
  name         text,
  email        text,
  mobile       text,
  town         text,
  -- Everything the form actually submitted, verbatim. The email renders every
  -- key in here, so a new field on a form cannot silently go missing the way
  -- `notes` did - it was written by three forms and read by nothing.
  fields       jsonb not null default '{}'::jsonb,
  source_url   text,
  client_ip    text,
  event_id     text,
  -- Set after the notification is attempted. 'failed' rows are the ones worth
  -- looking at: the data is safe, but nobody was told about it.
  email_status text check (email_status in ('sent','failed')),
  email_error  text,
  created_at   timestamptz not null default now()
);

create index if not exists leads_created_idx on public.leads (created_at desc);
create index if not exists leads_form_type_idx on public.leads (form_type);
create index if not exists leads_email_idx on public.leads (lower(email));
-- Find everything that was captured but never announced.
create index if not exists leads_email_failed_idx
  on public.leads (created_at desc) where email_status is distinct from 'sent';

-- 2. Community sign-ups ------------------------------------------------------

create table if not exists public.community_signups (
  id              uuid primary key default gen_random_uuid(),
  email           text not null unique,
  source_url      text,
  client_ip       text,
  -- For the automation to stamp once the welcome has gone out, so a replay or
  -- a manual re-run does not email the same person twice.
  welcome_sent_at timestamptz,
  unsubscribed_at timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists community_created_idx on public.community_signups (created_at desc);

-- The unique constraint on email is what makes the welcome automation safe.
-- submit-lead.js sends `Prefer: resolution=merge-duplicates`, so someone
-- signing up twice UPDATES their row instead of erroring - and because it is
-- an update, an INSERT trigger does not fire again and they do not get a
-- second welcome email.
drop trigger if exists community_signups_touch on public.community_signups;
create trigger community_signups_touch
  before update on public.community_signups
  for each row execute function public.touch_updated_at();

-- 3. Row level security ------------------------------------------------------
--
-- Both tables hold personal data submitted in confidence. Enable RLS and add
-- NO anon policy: the only writer is submit-lead.js using the service role
-- key, which bypasses RLS. Without this, anon could read every enquiry.

alter table public.leads             enable row level security;
alter table public.community_signups enable row level security;

-- 4. Verify ------------------------------------------------------------------

-- select form_type, count(*), max(created_at) from leads group by 1 order by 1;
-- select count(*) from community_signups;
-- -- captured but never announced:
-- select id, form_type, email, email_error, created_at
--   from leads where email_status is distinct from 'sent' order by created_at desc;
