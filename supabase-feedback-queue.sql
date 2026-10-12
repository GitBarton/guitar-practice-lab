-- Guitar Practice Lab: consent-gated development feedback queue.
-- Run ONCE in Supabase > your project > SQL Editor > New query.
-- Adds a separate table/view; does not modify or delete practice_records.

create table if not exists public.app_feedback_queue (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  drill_id text not null check (char_length(drill_id) between 1 and 160),
  category text not null check (category in ('general','instructions','diagram','fingering','timing','other')),
  message text not null check (char_length(btrim(message)) between 1 and 1200),
  publication_consent boolean not null default false check (publication_consent is true),
  created_at timestamptz not null default now()
);

create index if not exists app_feedback_queue_created_at
  on public.app_feedback_queue (created_at asc);

alter table public.app_feedback_queue enable row level security;

drop policy if exists "feedback insert own with public consent" on public.app_feedback_queue;
create policy "feedback insert own with public consent"
  on public.app_feedback_queue
  for insert to authenticated
  with check ((select auth.uid()) = user_id and publication_consent = true);

drop policy if exists "feedback read own" on public.app_feedback_queue;
create policy "feedback read own"
  on public.app_feedback_queue
  for select to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.app_feedback_queue from anon;
grant select, insert on public.app_feedback_queue to authenticated;

-- Narrow public view: only explicitly consented development suggestions.
-- Underlying table remains private; RLS continues protecting user IDs.
-- The view runs with its owner permissions so the anon role needs access
-- only to these five non-personal columns, not to the underlying table.
create or replace view public.app_feedback_outbox
  with (security_barrier = true)
as
select id, drill_id, category, message, created_at
from public.app_feedback_queue
where publication_consent is true;

revoke all on public.app_feedback_outbox from public;
revoke all on public.app_feedback_outbox from authenticated;
grant select on public.app_feedback_outbox to anon;

-- No delete/update rights for anonymous or authenticated app clients.
-- Public feedback must not include sensitive information, because
-- GitHub issues published from it are visible to anyone.
