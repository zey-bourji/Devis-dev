// Supprime le compte de la personne connectée : ses preuves (Storage), puis son utilisateur.
// Les projets, devis et profil partent tout seuls (on delete cascade).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

  const url = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return json({ error: "Non connecté" }, 401);

  // 1) les fichiers de preuve : proofs/<uid>/...
  const paths: string[] = [];
  const walk = async (prefix: string) => {
    const { data } = await admin.storage.from("proofs").list(prefix, { limit: 1000 });
    for (const item of data || []) {
      if (item.id) paths.push(`${prefix}/${item.name}`);
      else await walk(`${prefix}/${item.name}`);
    }
  };
  await walk(user.id);
  if (paths.length) await admin.storage.from("proofs").remove(paths);

  // 2) l'utilisateur (cascade sur les tables)
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true });
});
