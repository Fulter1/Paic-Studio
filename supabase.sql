-- PAIC Studio v13 — secure browser-only data layer
-- Run this once in Supabase SQL Editor.
-- Anonymous Sign-ins must be enabled in Authentication > Providers.

create table if not exists public.paic_letters_v13 (
  id uuid primary key,
  owner_id uuid not null,
  letter_number text not null,
  template text not null check (template in ('sponsorship','partnership','invitation','thanks')),
  size text not null check (size in ('a4','square')),
  recipient text not null check (char_length(recipient) between 1 and 180),
  recipient_name text check (recipient_name is null or char_length(recipient_name) <= 180),
  date date not null,
  event_name text not null check (char_length(event_name) between 1 and 220),
  extra_param text check (extra_param is null or char_length(extra_param) <= 220),
  value text check (value is null or char_length(value) <= 100),
  message text not null check (char_length(message) between 1 and 12000),
  pr_name text check (pr_name is null or char_length(pr_name) <= 120),
  pr_contact text check (pr_contact is null or char_length(pr_contact) <= 40),
  pr_email text check (pr_email is null or char_length(pr_email) <= 180),
  digital_stamp boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.paic_letters_v13 enable row level security;

revoke all on public.paic_letters_v13 from anon;
grant select, insert, update, delete on public.paic_letters_v13 to authenticated;

-- Only anonymous Auth users created by this public app may use this table.
drop policy if exists paic_v13_select_own on public.paic_letters_v13;
drop policy if exists paic_v13_insert_own on public.paic_letters_v13;
drop policy if exists paic_v13_update_own on public.paic_letters_v13;
drop policy if exists paic_v13_delete_own on public.paic_letters_v13;

create policy paic_v13_select_own on public.paic_letters_v13
for select to authenticated
using (
  owner_id = auth.uid()
  and coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = true
);

create policy paic_v13_insert_own on public.paic_letters_v13
for insert to authenticated
with check (
  owner_id = auth.uid()
  and coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = true
);

create policy paic_v13_update_own on public.paic_letters_v13
for update to authenticated
using (
  owner_id = auth.uid()
  and coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = true
)
with check (
  owner_id = auth.uid()
  and coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = true
);

create policy paic_v13_delete_own on public.paic_letters_v13
for delete to authenticated
using (
  owner_id = auth.uid()
  and coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = true
);

create unique index if not exists paic_v13_owner_number_idx
on public.paic_letters_v13(owner_id, letter_number);

create index if not exists paic_v13_owner_updated_idx
on public.paic_letters_v13(owner_id, updated_at desc);

create or replace function public.paic_v13_touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists paic_v13_set_updated_at on public.paic_letters_v13;
create trigger paic_v13_set_updated_at
before update on public.paic_letters_v13
for each row execute function public.paic_v13_touch_updated_at();
