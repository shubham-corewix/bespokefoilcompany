-- =============================================================================
-- email_queue - the handoff between "something happened" and "send this email"
-- -----------------------------------------------------------------------------
-- Dixit's automation setup built the SENDING side (email_content, email_config,
-- the bfc-shell template). This is the missing half: the rows that say WHAT to
-- send, TO WHOM, and WHEN.
--
-- Why a queue rather than sending inline:
--
--   * Most of the lifecycle is scheduled, not immediate. The Trustpilot
--     invitation is 7 days after despatch, the re-order nudge 10, "let's stay in
--     touch" 14. A webhook that fires once cannot send an email next week.
--   * It decouples our Netlify functions from n8n. Our code writes a row and is
--     done; n8n polls and sends. Neither has to know the other is healthy.
--   * It makes sends cancellable. A refund, an unsubscribe, or a customer who
--     replies to the proof unhappy should stop a cheerful nudge that is already
--     scheduled. You cannot un-send an email; you can cancel a queued row.
--
-- Idempotent - safe to run more than once.
-- =============================================================================

create table if not exists public.email_queue (
  id            uuid primary key default gen_random_uuid(),

  -- which copy row in email_content to render
  template_key  text        not null,

  to_email      text        not null,
  to_name       text,

  -- per-send values merged over email_content + email_config at send time,
  -- e.g. {"order_ref":"KS-A1B2C3D4","customer_name":"Jo","total":"54.90"}
  merge         jsonb       not null default '{}'::jsonb,

  -- eligible from this moment. now() for immediate, now() + interval for the
  -- scheduled ones. The worker picks up anything pending with send_after <= now().
  send_after    timestamptz not null default now(),

  status        text        not null default 'pending'
                  check (status in ('pending','sent','failed','cancelled')),

  attempts      int         not null default 0,
  last_error    text,

  -- Stops the same email being queued twice. Stripe retries webhooks, and
  -- ShipStation can fire a despatch event more than once; without this a
  -- customer gets two confirmations and nobody notices until they complain.
  -- Format: '<template_key>:<stable id>' e.g. 'order-confirmation:KS-A1B2C3D4'
  dedupe_key    text        unique,

  -- which trigger created it, for tracing a bad send back to its cause
  source        text,

  created_at    timestamptz not null default now(),
  sent_at       timestamptz,

  -- set by the worker so a stuck row is visible rather than silently retried
  locked_at     timestamptz
);

-- The worker's only query: pending rows that are due, oldest first.
create index if not exists email_queue_due_idx
  on public.email_queue (send_after)
  where status = 'pending';

-- For cancelling a customer's scheduled sends in one statement.
create index if not exists email_queue_email_idx
  on public.email_queue (to_email, status);

create index if not exists email_queue_source_idx on public.email_queue (source);

-- -----------------------------------------------------------------------------
-- Cancelling scheduled email for one customer.
-- Use on refund, on unsubscribe, or when a proof conversation goes wrong and the
-- day 10 "loved it enough to want another?" would land badly.
--
--   select public.cancel_queued_email('jo@example.com');
--   select public.cancel_queued_email('jo@example.com', 'reorder-referral');
-- -----------------------------------------------------------------------------
create or replace function public.cancel_queued_email(
  p_email text,
  p_template_key text default null
) returns int language sql as $$
  with cancelled as (
    update public.email_queue
       set status = 'cancelled'
     where to_email = p_email
       and status = 'pending'
       and (p_template_key is null or template_key = p_template_key)
    returning 1
  )
  select count(*)::int from cancelled;
$$;

-- -----------------------------------------------------------------------------
-- RLS: service role only. Nothing in the browser should ever read or write this
-- - it holds customer email addresses and merge data.
-- -----------------------------------------------------------------------------
alter table public.email_queue enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'email_queue'
       and policyname = 'service role only'
  ) then
    create policy "service role only" on public.email_queue
      for all to service_role using (true) with check (true);
  end if;
end $$;
