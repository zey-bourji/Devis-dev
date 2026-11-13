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

## Sans IA

Si la fonction n'est pas déployée ou si l'IA est saturée, le chat retombe sur un mode simple (mots-clés) : il répond toujours.
