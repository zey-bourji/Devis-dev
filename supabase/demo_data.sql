-- Données de démonstration pour le jury : 3 projets et 3 devis dans UN compte précis.
-- 1. Crée un compte sur le site (le compte de démo), puis remplace DEMO_EMAIL ci-dessous par son adresse.
-- 2. SQL Editor > New query > coller > Run. À lancer une seule fois (sinon les exemples sont en double).
-- Les noms et les clients sont inventés.

do $$
declare
  demo_email text := 'DEMO_EMAIL';
  uid uuid;
  p1 uuid; p2 uuid; p3 uuid;
begin
  select id into uid from auth.users where email = demo_email;
  if uid is null then raise exception 'Aucun compte avec cet email : %', demo_email; end if;

  insert into public.projects (user_id, name, description, client_name, client_contact, specs)
  values (uid, 'Site du salon Belle Coiffure', 'Site vitrine avec réservation en ligne et acompte Wave.', 'Mme Koné', 'kone@exemple.ci',
          'Site vitrine, connexion des clientes, réservation avec acompte Wave, formulaire de contact. Livraison sous 6 semaines.')
  returning id into p1;
  insert into public.projects (user_id, name, description, client_name, client_contact, specs)
  values (uid, 'Boutique Akissi Déco', 'Vitrine d''une boutique de décoration, sans paiement en ligne.', 'Akissi Yao', 'akissi@exemple.ci', 'Site vitrine, design mobile, formulaire de contact, hébergement et domaine.')
  returning id into p2;
  insert into public.projects (user_id, name, description, client_name, client_contact, specs)
  values (uid, 'Réservations du cabinet Koffi', 'Application de prise de rendez-vous avec espace admin.', 'Dr Koffi', 'cabinet@exemple.ci', 'Connexion patients, base de données des rendez-vous, espace admin, paiement Mobile Money.')
  returning id into p3;

  insert into public.quotes (user_id, project_id, number, status, total, data, created_at, updated_at) values
  (uid, p1, 'DEV-20261110-001', 'envoyé', 351000,
   jsonb_build_object('selected', jsonb_build_array('vitrine','responsive','contact','auth','paiement','hebergement','domaine'),
     'client', jsonb_build_object('name','Mme Koné','project','Site du salon Belle Coiffure'),
     'dates', jsonb_build_object('order','2026-11-10','start','','delivery','','postponedTo',''),
     'chat', '[]'::jsonb),
   now() - interval '4 days', now() - interval '4 days'),
  (uid, p2, 'DEV-20261111-002', 'accepté', 226000,
   jsonb_build_object('selected', jsonb_build_array('vitrine','responsive','contact','hebergement','domaine'),
     'client', jsonb_build_object('name','Akissi Yao','project','Boutique Akissi Déco'),
     'dates', jsonb_build_object('order','2026-11-11','start','','delivery','','postponedTo',''),
     'chat', '[]'::jsonb),
   now() - interval '3 days', now() - interval '3 days'),
  (uid, p3, 'DEV-20261112-003', 'en cours', 425000,
   jsonb_build_object('selected', jsonb_build_array('vitrine','auth','api','admin','paiement'),
     'client', jsonb_build_object('name','Dr Koffi','project','Réservations du cabinet Koffi'),
     'dates', jsonb_build_object('order','2026-11-12','start','2026-11-13','delivery','2026-12-20','postponedTo',''),
     'chat', '[]'::jsonb),
   now() - interval '2 days', now() - interval '1 day');
end $$;
