-- Guitar Practice Lab v1 — run in your own Supabase SQL Editor.
-- Each practice entry is immutable and identified with a client-generated UUID.
-- Row-level security prevents any signed-in user from reading or writing another user's records.
create table if not exists public.practice_records (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('drill','session','song')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists practice_records_owner_date on public.practice_records (user_id, created_at desc);
alter table public.practice_records enable row level security;
-- Safe to run multiple times; policies are replaced deliberately.
drop policy if exists "select own practice" on public.practice_records;
drop policy if exists "insert own practice" on public.practice_records;
drop policy if exists "update own practice" on public.practice_records;
create policy "select own practice" on public.practice_records for select to authenticated using ((select auth.uid()) = user_id);
create policy "insert own practice" on public.practice_records for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "update own practice" on public.practice_records for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
-- No delete policy; clients cannot delete cloud records through the web app.
grant select, insert, update on public.practice_records to authenticated;
revoke all on public.practice_records from anon;
