-- ---------------------------------------------------------------------------
-- BFC - Memory Catcher affiliate commission ledger
-- Run in the Supabase SQL editor BEFORE registering the affiliate webhook.
-- Money is stored in INTEGER PENCE throughout. Never store money as float.
-- ---------------------------------------------------------------------------

-- Franchisees table (as described in the handover, section 6 step 5).
-- Create it first if it does not exist yet - commissions references it.
create table if not exists public.franchisees (
  -- id is REQUIRED by the Hub ledger writes in affiliate-commission-webhook.js
  -- (`franchisees?...select=id`). Without it that query 400s, the handler
  -- throws, and Stripe retries the event for three days.
  id            uuid not null unique default gen_random_uuid(),
  slug          text primary key check (slug ~ '^[a-z0-9-]{1,60}$'),
  name          text not null,
  discount_code text,
  email         text,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

create table if not exists public.commissions (
  id                        uuid primary key default gen_random_uuid(),

  -- IDEMPOTENCY KEY. One commission row per PaymentIntent, forever.
  -- This unique constraint is what makes Stripe webhook retries safe.
  payment_intent_id         text not null unique,

  affiliate_slug            text not null references public.franchisees(slug),
  order_number              text,               -- KS-XXXXXXXX, matches ShipStation

  currency                  text not null default 'gbp',
  gross_amount_pence        integer not null check (gross_amount_pence >= 0),
  commissionable_pence      integer not null check (commissionable_pence >= 0),
  commission_rate_bps       integer not null default 2000,  -- 2000 = 20.00%
  commission_pence          integer not null check (commission_pence >= 0),

  refunded_pence            integer not null default 0 check (refunded_pence >= 0),
  commission_reversed_pence integer not null default 0 check (commission_reversed_pence >= 0),

  -- pending  : earned, inside the refund window
  -- payable  : cleared, ready for the next payout run
  -- paid     : settled to the franchisee
  -- disputed : chargeback open, do not pay out
  -- reversed : refunded or dispute lost
  status                    text not null default 'pending'
                            check (status in ('pending','payable','paid','disputed','reversed')),

  sku                       text,
  quantity                  integer not null default 1,
  customer_email            text,
  payout_reference          text,
  paid_at                   timestamptz,        -- when the CUSTOMER paid
  settled_at                timestamptz,        -- when the FRANCHISEE was paid
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),

  constraint reversal_within_commission
    check (commission_reversed_pence <= commission_pence)
);

create index if not exists commissions_slug_idx    on public.commissions (affiliate_slug);
create index if not exists commissions_status_idx  on public.commissions (status);
create index if not exists commissions_paid_at_idx on public.commissions (paid_at desc);

-- Net position per franchisee - this is what the Hub dashboard should read.
create or replace view public.commission_totals as
select
  c.affiliate_slug,
  f.name,
  count(*)                                                            as order_count,
  sum(c.commission_pence - c.commission_reversed_pence)               as net_commission_pence,
  sum(c.commission_pence - c.commission_reversed_pence)
    filter (where c.status = 'payable')                               as payable_pence,
  sum(c.commission_pence - c.commission_reversed_pence)
    filter (where c.status = 'paid')                                  as paid_pence,
  max(c.paid_at)                                                      as last_order_at
from public.commissions c
join public.franchisees f on f.slug = c.affiliate_slug
group by c.affiliate_slug, f.name;

-- ---------------------------------------------------------------------------
-- RLS. The webhook uses the SERVICE ROLE key, which bypasses RLS entirely.
-- So we lock the table down completely to anon/authenticated and let nothing
-- through by default. A franchisee-facing read policy can be added later once
-- Hub auth exists; until then the Hub should read via a server-side function,
-- never straight from the browser with the anon key.
-- ---------------------------------------------------------------------------
alter table public.commissions enable row level security;
alter table public.franchisees enable row level security;

-- Public read of active franchisees only (the memory-catcher edge function
-- uses the ANON key for this and needs it).
drop policy if exists franchisees_public_read on public.franchisees;
create policy franchisees_public_read
  on public.franchisees for select
  to anon, authenticated
  using (active is true);

-- No anon/authenticated policy on commissions == no access at all.

-- Seed rows (per handover section 6 step 5).
insert into public.franchisees (slug, name, discount_code, active) values
  ('ashley-eccleston', 'Ashley Eccleston', 'ASHLEY10', true),
  ('salamata-bah',     'Salamata Bah',     'SALAMATA10', true)
on conflict (slug) do nothing;


-- ---------------------------------------------------------------------------
-- HUB LEDGER (Dixit, 28/07)
-- These two tables back the writes at the end of creditCommission() in
-- functions/affiliate-commission-webhook.js. The DDL is written to match that
-- code exactly - the column names, and both on_conflict targets, are load
-- bearing. If you rename a column here, rename it there in the same commit.
--
-- NOTE ON UNITS: `commissions` stores integer pence; these Hub tables store
-- POUNDS as numeric, because that is what the webhook writes
-- (`Math.round(base) / 100`). numeric(12,2) is used rather than float so the
-- pounds values stay exact. Do not "tidy" one side to match the other without
-- changing the webhook too.
-- ---------------------------------------------------------------------------

create table if not exists public.transactions (
  id            uuid primary key default gen_random_uuid(),
  franchisee_id uuid not null references public.franchisees(id),
  stream        text not null,                    -- 'affiliate' | 'session' | ...
  source        text not null,                    -- 'website' | 'shopify' | ...
  external_id   text not null,                    -- Stripe PaymentIntent id
  order_name    text,
  occurred_on   date not null,
  product       text,
  amount_paid   numeric(12,2) not null default 0, -- POUNDS
  rate          numeric(5,4)  not null default 0.2000,
  commission    numeric(12,2) not null default 0, -- POUNDS
  created_at    timestamptz not null default now(),

  -- Target of `transactions?on_conflict=source,external_id`. Without this
  -- exact unique constraint that upsert errors and the ledger write fails.
  constraint transactions_source_external_key unique (source, external_id)
);

create index if not exists transactions_franchisee_idx on public.transactions (franchisee_id, occurred_on desc);
create index if not exists transactions_stream_idx     on public.transactions (stream);

create table if not exists public.month_status (
  franchisee_id uuid not null references public.franchisees(id),
  month         text not null,                    -- 'YYYY-MM'
  status        text not null default 'pending',
  updated_at    timestamptz not null default now(),

  -- Target of `month_status?on_conflict=franchisee_id,month`.
  constraint month_status_pkey primary key (franchisee_id, month)
);

alter table public.transactions enable row level security;
alter table public.month_status enable row level security;
-- No anon/authenticated policies: service role only, same as commissions.

-- Keep updated_at honest.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists commissions_touch on public.commissions;
create trigger commissions_touch before update on public.commissions
  for each row execute function public.touch_updated_at();
