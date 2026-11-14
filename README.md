# Youquote

Générateur de devis en FCFA pour les développeurs freelances. Projet présenté au Systalink Challenge (Coupe d'Afrique des Développeurs 2026), réalisé en solo à Abidjan par Zeinab Bourji.

Le développeur coche les fonctionnalités d'un projet, le prix se calcule en FCFA, et il télécharge un devis PDF à son image (logo, couleur, modalités de paiement). C'est un outil de simulation pour lui : le devis n'est pas un document légal.

## Ce que fait l'application

- **Éditeur de devis** : catalogue de fonctionnalités, jours ou prix réglables ligne par ligne, lignes personnalisées, remise, arrondi, notes, délai de livraison estimé, option pour masquer les jours.
- **Assistant IA** : on décrit le projet (ou on colle le cahier des charges) et le devis se remplit. Si un budget est donné, il propose deux options : rester dans le budget ou tout garder.
- **PDF** en 3 modèles, avec logo, couleur et échéancier de paiement. Il est généré dans le navigateur.
- **Projets et suivi** : statuts (brouillon, envoyé, accepté, en cours, terminé, reporté, annulé, refusé), total convenu, paiements reçus avec preuve (image ou PDF), dates, rappels des paiements à venir.
- **Mon compte** : statistiques du mois, mot de passe, déconnexion, suppression du compte.
- **Sans compte**, tout reste dans le navigateur. Avec un compte, les données sont enregistrées et privées (chaque utilisateur ne voit que ses lignes).

## Comment c'est fait

- Next.js (App Router), exporté en site statique (`out/`), React.
- PDF : `@react-pdf/renderer`, côté navigateur.
- Supabase : comptes (email + mot de passe), base Postgres avec règles RLS, stockage privé des preuves, fonctions Edge pour l'IA et la suppression du compte.
- IA : Gemini (gratuit) appelé uniquement depuis une fonction Supabase, jamais depuis le navigateur. La clé reste secrète. L'assistant ne répond qu'aux sujets de devis ; les abus sont notés et, après plusieurs signalements, bloqués 24 h.
- Hébergement : Cloudflare (dossier `out/`).

## Lancer en local

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # génère le site statique dans out/
```

## Mettre en place Supabase

Dans le SQL Editor, exécuter dans l'ordre : `supabase/schema.sql`, `supabase/schema_ai.sql`, `supabase/schema_suivi.sql`.
Puis déployer les fonctions de `supabase/functions/` (voir le README de `quote-chat`) et ajouter les secrets `AI_API_KEY` et, si besoin, `AI_MODEL`.

## Structure

- `app/` : les pages (accueil, devis, projets, compte, pages légales)
- `components/` : éditeur, PDF, assistant, suivi des paiements
- `lib/` : calcul des prix, échéancier, rappels, statistiques, budget
- `supabase/` : SQL et fonctions Edge
