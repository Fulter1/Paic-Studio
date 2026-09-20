create extension if not exists pgcrypto;
create table if not exists public.paic_letters_v10 (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 letter_number text not null,
 template text not null check (template in ('sponsorship','partnership','invitation','thanks')),
 size text not null check (size in ('a4','square')),
 recipient text not null,
 recipient_name text,
 date date not null,
 event_name text not null,
 extra_param text,
 value text,
 message text,
 pr_name text,
 pr_contact text,
 pr_email text,
 updated_at timestamptz not null default now()
);
alter table public.paic_letters_v10 enable row level security;
grant select,insert,update,delete on public.paic_letters_v10 to authenticated;
drop policy if exists paic_v10_select on public.paic_letters_v10;
drop policy if exists paic_v10_insert on public.paic_letters_v10;
drop policy if exists paic_v10_update on public.paic_letters_v10;
drop policy if exists paic_v10_delete on public.paic_letters_v10;
create policy paic_v10_select on public.paic_letters_v10 for select to authenticated using (owner_id = auth.uid());
create policy paic_v10_insert on public.paic_letters_v10 for insert to authenticated with check (owner_id = auth.uid());
create policy paic_v10_update on public.paic_letters_v10 for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy paic_v10_delete on public.paic_letters_v10 for delete to authenticated using (owner_id = auth.uid());
create index if not exists paic_v10_owner_updated on public.paic_letters_v10(owner_id,updated_at desc);
