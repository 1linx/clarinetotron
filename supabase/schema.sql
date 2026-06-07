-- Run this in the Supabase SQL editor to create the single records table.

create table if not exists records (
  id           uuid default gen_random_uuid() primary key,
  type         text not null,
  date         date,
  data         jsonb not null default '{}',
  created_at   timestamptz default now() not null
);

create index if not exists records_type_date_idx on records (type, date);
create index if not exists records_type_key_idx  on records ((data->>'key')) where type = 'setting';

-- Enable RLS.
-- All DB access goes through server-side API routes using the anon key, never from the browser.
-- The policy below grants the anon role full access; our API routes are the real auth layer.
alter table records enable row level security;

create policy "server_anon_all" on records
  for all
  to anon
  using (true)
  with check (true);
