-- Sécurité de l'assistant IA : demandes signalées et suspensions.
-- À exécuter une fois dans Supabase : SQL Editor > New query > coller > Run.
-- Ces tables sont fermées aux utilisateurs (RLS activée, aucune règle) :
-- seule la fonction quote-chat, avec sa clé administrateur, peut les lire et les écrire.

create table if not exists public.ai_flags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('hors_sujet', 'inapproprie', 'dangereux', 'injection')),
  excerpt text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists ai_flags_user_time on public.ai_flags (user_id, created_at desc);

create table if not exists public.ai_bans (
  user_id uuid primary key references auth.users (id) on delete cascade,
  reason text not null default '',
  until timestamptz,            -- vide = bannissement définitif
  created_at timestamptz not null default now()
);

alter table public.ai_flags enable row level security;
alter table public.ai_bans enable row level security;
