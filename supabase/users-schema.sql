-- Shared users table — reusable across projects via the `app` column.
-- Run this once in the Supabase SQL editor.

create table if not exists users (
  id            uuid default gen_random_uuid() primary key,
  app           text not null,
  username      text not null,
  password_hash text not null,
  created_at    timestamptz default now() not null,
  unique (app, username)
);

create index if not exists users_app_username_idx on users (app, username);

alter table users enable row level security;

-- Only server-side API routes (anon key) may access this table.
create policy "server_anon_all" on users
  for all
  to anon
  using (true)
  with check (true);
