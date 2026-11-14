-- Espace administrateur : seul ton compte voit les chiffres globaux et peut bannir.
-- À exécuter une fois dans Supabase : SQL Editor > New query > coller > Run.
-- Les fonctions vérifient toutes que la personne est dans la table admins. Personne d'autre n'obtient de données.

create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.admins enable row level security;

create or replace function public.is_admin() returns boolean
language sql security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid())
$$;

create or replace function public.admin_stats() returns json
language plpgsql security definer set search_path = public as $$
declare result json;
begin
  if not public.is_admin() then raise exception 'Accès refusé'; end if;
  select json_build_object(
    'users', (select count(*) from auth.users),
    'new_7d', (select count(*) from auth.users where created_at >= now() - interval '7 days'),
    'new_30d', (select count(*) from auth.users where created_at >= now() - interval '30 days'),
    'active_7d', (select count(*) from auth.users where last_sign_in_at >= now() - interval '7 days'),
    'projects', (select count(*) from public.projects),
    'quotes', (select count(*) from public.quotes),
    'by_status', coalesce((select json_object_agg(status, n) from (select status, count(*) n from public.quotes group by status) s), '{}'::json),
    'signups', (select coalesce(json_agg(json_build_object('day', d::date, 'n', (select count(*) from auth.users u where u.created_at::date = d::date)) order by d), '[]'::json)
                from generate_series(current_date - 13, current_date, interval '1 day') d),
    'flags_24h', (select count(*) from public.ai_flags where created_at >= now() - interval '24 hours'),
    'flags_total', (select count(*) from public.ai_flags),
    'bans_active', (select count(*) from public.ai_bans where until is null or until > now())
  ) into result;
  return result;
end $$;

create or replace function public.admin_flags() returns json
language plpgsql security definer set search_path = public as $$
declare result json;
begin
  if not public.is_admin() then raise exception 'Accès refusé'; end if;
  select coalesce(json_agg(t), '[]'::json) into result from (
    select f.id, f.user_id, u.email, f.kind, f.excerpt, f.created_at,
           exists (select 1 from public.ai_bans b where b.user_id = f.user_id and (b.until is null or b.until > now())) as banned
    from public.ai_flags f join auth.users u on u.id = f.user_id
    order by f.created_at desc limit 50
  ) t;
  return result;
end $$;

create or replace function public.admin_ban(target uuid, hours integer) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Accès refusé'; end if;
  insert into public.ai_bans (user_id, reason, until)
  values (target, 'admin', case when hours is null then null else now() + make_interval(hours => hours) end)
  on conflict (user_id) do update set reason = 'admin', until = excluded.until;
end $$;

create or replace function public.admin_unban(target uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Accès refusé'; end if;
  delete from public.ai_bans where user_id = target;
end $$;

revoke all on function public.is_admin() from public, anon;
revoke all on function public.admin_stats() from public, anon;
revoke all on function public.admin_flags() from public, anon;
revoke all on function public.admin_ban(uuid, integer) from public, anon;
revoke all on function public.admin_unban(uuid) from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.admin_stats() to authenticated;
grant execute on function public.admin_flags() to authenticated;
grant execute on function public.admin_ban(uuid, integer) to authenticated;
grant execute on function public.admin_unban(uuid) to authenticated;

-- ÉTAPE À PART, après ce qui précède : te déclarer administratrice (remplace par l'email de ton compte Youquote).
-- insert into public.admins (user_id) select id from auth.users where email = 'TON_EMAIL';
