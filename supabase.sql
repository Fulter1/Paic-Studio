create table if not exists public.paic_letters_v13 (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  is_anonymous boolean not null default true,
  letter_number text not null,
  template text not null,
  size text not null default 'a4',
  recipient text not null,
  recipient_name text,
  event_name text not null,
  date date not null,
  extra_param text,
  value text,
  message text not null,
  pr_name text,
  pr_contact text,
  pr_email text,
  digital_stamp boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.paic_letters_v13 enable row level security;
revoke all on public.paic_letters_v13 from anon;
grant select,insert,update,delete on public.paic_letters_v13 to authenticated;
drop policy if exists paic_letters_select on public.paic_letters_v13;
drop policy if exists paic_letters_insert on public.paic_letters_v13;
drop policy if exists paic_letters_update on public.paic_letters_v13;
drop policy if exists paic_letters_delete on public.paic_letters_v13;
create policy paic_letters_select on public.paic_letters_v13 for select to authenticated using (owner_id=auth.uid() and is_anonymous=true);
create policy paic_letters_insert on public.paic_letters_v13 for insert to authenticated with check (owner_id=auth.uid() and is_anonymous=true);
create policy paic_letters_update on public.paic_letters_v13 for update to authenticated using (owner_id=auth.uid() and is_anonymous=true) with check (owner_id=auth.uid() and is_anonymous=true);
create policy paic_letters_delete on public.paic_letters_v13 for delete to authenticated using (owner_id=auth.uid() and is_anonymous=true);
create unique index if not exists paic_letters_owner_number_idx on public.paic_letters_v13(owner_id,letter_number);
create index if not exists paic_letters_owner_updated_idx on public.paic_letters_v13(owner_id,updated_at desc);
create or replace function public.paic_letters_set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end; $$;
drop trigger if exists paic_letters_updated_at on public.paic_letters_v13;
create trigger paic_letters_updated_at before update on public.paic_letters_v13 for each row execute function public.paic_letters_set_updated_at();
