create table if not exists public.paic_letters_v13 (
  id uuid primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  letter_number text not null,
  template text not null default 'classic',
  size text not null default 'a4',
  recipient text not null default '',
  recipient_name text not null default '',
  event_name text not null default '',
  date date,
  extra_param text not null default '',
  value text not null default '',
  message text not null default '',
  pr_name text not null default '',
  pr_contact text not null default '',
  pr_email text not null default '',
  digital_stamp boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id,letter_number)
);
alter table public.paic_letters_v13 enable row level security;
drop policy if exists "owner select" on public.paic_letters_v13;
drop policy if exists "owner insert" on public.paic_letters_v13;
drop policy if exists "owner update" on public.paic_letters_v13;
drop policy if exists "owner delete" on public.paic_letters_v13;
create policy "owner select" on public.paic_letters_v13 for select to authenticated using(owner_id=auth.uid());
create policy "owner insert" on public.paic_letters_v13 for insert to authenticated with check(owner_id=auth.uid());
create policy "owner update" on public.paic_letters_v13 for update to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create policy "owner delete" on public.paic_letters_v13 for delete to authenticated using(owner_id=auth.uid());
