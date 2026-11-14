# Assistant IA (fonction `quote-chat`)

Le site n'appelle jamais l'IA directement : il appelle cette fonction Supabase, qui garde la clé secrète.

## Brancher l'IA (une seule fois)

1. Crée une clé gratuite dans Google AI Studio (ou Groq).
2. Dans Supabase : **Edge Functions** > **Deploy a new function** > **Via Editor**.
   Nomme-la exactement `quote-chat`, colle le contenu de `index.ts`, puis **Deploy**.
3. Dans **Edge Functions** > **Secrets**, ajoute :
   - `AI_API_KEY` : ta clé
   - `AI_PROVIDER` : `gemini` (par défaut) ou `groq`
   - `AI_MODEL` : seulement si le modèle par défaut ne marche plus (le nom exact est dans AI Studio)

Pour changer de fournisseur : change `AI_PROVIDER`, `AI_API_KEY` (et `AI_MODEL`), sans toucher au code.

## Sécurité et bannissement

Avant de déployer, exécute `supabase/schema_ai.sql` dans le SQL Editor (une fois). Il crée deux tables fermées au public.

L'assistant ne répond qu'aux sujets de devis. Pour le reste, il refuse avec un message standard et note la demande.
- Hors sujet : refus poli, noté, sans sanction.
- Inapproprié, dangereux ou tentative de contournement : refus et noté. **3 demandes de ce genre en 24 h = suspension automatique de 24 h.**

Voir les demandes signalées (SQL Editor) :

```sql
select f.created_at, u.email, f.kind, f.excerpt
from ai_flags f join auth.users u on u.id = f.user_id
order by f.created_at desc limit 50;
```

Bannir quelqu'un pour de bon :

```sql
insert into ai_bans (user_id, reason)
select id, 'Usage abusif de l''assistant' from auth.users where email = 'adresse@exemple.com'
on conflict (user_id) do update set until = null, reason = excluded.reason;
```

Lever un bannissement : `delete from ai_bans where user_id = (select id from auth.users where email = 'adresse@exemple.com');`

## Sans IA

Si la fonction n'est pas déployée ou si l'IA est saturée, le chat retombe sur un mode simple (mots-clés) : il répond toujours.
