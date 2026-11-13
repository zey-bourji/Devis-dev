-- À coller dans Supabase : SQL Editor > New query > Run.
-- Crée les tables et verrouille chaque ligne : seul son propriétaire peut la lire ou la modifier.

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  client_name text not null default '',
  client_contact text not null default '',
  github_url text not null default '',
  specs text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  number text not null,
  status text not null default 'brouillon' check (status in ('brouillon', 'envoyé', 'accepté', 'refusé')),
  total numeric not null default 0,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;
alter table public.quotes enable row level security;
alter table public.profiles enable row level security;

create policy "projects: owner only" on public.projects
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "quotes: owner only" on public.quotes
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "profiles: owner only" on public.profiles
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update, delete on public.projects, public.quotes, public.profiles to authenticated;
