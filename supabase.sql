-- PAIC Studio v8
-- Uses a per-browser client id. This is suitable for a lightweight workspace,
-- not a strong authenticated identity system. For multi-user confidential data,
-- migrate owner_id to auth.uid() with Supabase Auth.
create table if not exists public.paic_letters_v8 (
  id text primary key,
  client_id text not null,
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
  unique(client_id, letter_number)
);

alter table public.paic_letters_v8 enable row level security;
grant select, insert, update, delete on public.paic_letters_v8 to anon, authenticated;

drop policy if exists paic_v8_select on public.paic_letters_v8;
drop policy if exists paic_v8_insert on public.paic_letters_v8;
drop policy if exists paic_v8_update on public.paic_letters_v8;
drop policy if exists paic_v8_delete on public.paic_letters_v8;

create policy paic_v8_select on public.paic_letters_v8 for select to anon, authenticated
using (client_id = current_setting('request.headers', true)::json->>'x-paic-client');
create policy paic_v8_insert on public.paic_letters_v8 for insert to anon, authenticated
with check (client_id = current_setting('request.headers', true)::json->>'x-paic-client');
create policy paic_v8_update on public.paic_letters_v8 for update to anon, authenticated
using (client_id = current_setting('request.headers', true)::json->>'x-paic-client')
with check (client_id = current_setting('request.headers', true)::json->>'x-paic-client');
create policy paic_v8_delete on public.paic_letters_v8 for delete to anon, authenticated
using (client_id = current_setting('request.headers', true)::json->>'x-paic-client');

create index if not exists paic_v8_client_updated_idx on public.paic_letters_v8(client_id, updated_at desc);
