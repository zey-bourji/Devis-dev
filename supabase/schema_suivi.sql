-- Suivi des devis : nouveaux statuts et espace privé pour les preuves de paiement.
-- À exécuter une fois dans Supabase : SQL Editor > New query > coller > Run.

-- 1) Les statuts acceptés pour un devis
do $$
declare c text;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.quotes'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table public.quotes drop constraint %I', c);
  end loop;
end $$;

alter table public.quotes add constraint quotes_status_check
  check (status in ('brouillon', 'envoyé', 'accepté', 'en cours', 'terminé', 'reporté', 'annulé', 'refusé'));

-- 2) L'espace privé « proofs » : chaque personne ne voit que son propre dossier (nommé d'après son identifiant)
insert into storage.buckets (id, name, public)
values ('proofs', 'proofs', false)
on conflict (id) do nothing;

drop policy if exists "proofs: lecture proprietaire" on storage.objects;
drop policy if exists "proofs: ajout proprietaire" on storage.objects;
drop policy if exists "proofs: suppression proprietaire" on storage.objects;

create policy "proofs: lecture proprietaire" on storage.objects for select to authenticated
  using (bucket_id = 'proofs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "proofs: ajout proprietaire" on storage.objects for insert to authenticated
  with check (bucket_id = 'proofs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "proofs: suppression proprietaire" on storage.objects for delete to authenticated
  using (bucket_id = 'proofs' and (storage.foldername(name))[1] = auth.uid()::text);
