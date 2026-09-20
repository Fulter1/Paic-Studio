-- PAIC Studio v9
-- Enable Anonymous Sign-ins in Supabase Dashboard:
-- Authentication -> Providers -> Anonymous Sign-ins -> Enable
create table if not exists public.paic_letters_v9 (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  letter_number text not null,
  template text not null check (template in ('sponsorship','partnership','invitation','thanks')),
  size text not null check (size in ('a4','square')),
  recipient text not null,
  recipient_name text,
  date date not null,
  event_name text not null,
  extra_param text,
  message text not null,
  pr_name text,
  pr_contact text,
  pr_email text,
  stamp_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, letter_number)
);

alter table public.paic_letters_v9 enable row level security;
revoke all on public.paic_letters_v9 from anon;
grant select, insert, update, delete on public.paic_letters_v9 to authenticated;

drop policy if exists paic_v9_select on public.paic_letters_v9;
drop policy if exists paic_v9_insert on public.paic_letters_v9;
drop policy if exists paic_v9_update on public.paic_letters_v9;
drop policy if exists paic_v9_delete on public.paic_letters_v9;

create policy paic_v9_select on public.paic_letters_v9 for select to authenticated
using ((select auth.uid()) = owner_id);
create policy paic_v9_insert on public.paic_letters_v9 for insert to authenticated
with check ((select auth.uid()) = owner_id and coalesce((select (auth.jwt()->>'is_anonymous')::boolean),false) = true);
create policy paic_v9_update on public.paic_letters_v9 for update to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id and coalesce((select (auth.jwt()->>'is_anonymous')::boolean),false) = true);
create policy paic_v9_delete on public.paic_letters_v9 for delete to authenticated
using ((select auth.uid()) = owner_id);

create index if not exists paic_v9_owner_updated on public.paic_letters_v9(owner_id,updated_at desc);
