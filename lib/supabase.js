import { createClient } from "@supabase/supabase-js";

// L'adresse du projet Supabase et la clé "publishable".
// Cette clé est faite pour être visible dans le navigateur : elle ne donne accès à rien toute seule.
// Ce qui protège les données, ce sont les règles RLS du fichier supabase/schema.sql
// (chaque utilisateur ne voit que ses propres lignes).
const SUPABASE_URL = "https://bxybqvuvqwusefuhjjbv.supabase.co";
const SUPABASE_KEY = "sb_publishable_rrY1GI35A03avY8cocI7Og_EKDWDCC4";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
