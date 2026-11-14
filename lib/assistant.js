// Le point d'entrée de l'assistant : connecté, on appelle la fonction Supabase (qui parle à l'IA) ;
// sinon, ou si elle échoue, on retombe sur les règles simples de localAssistant.

import { supabase } from "./supabase";
import { sanitizeOps } from "./aiOps";
import { localAssist } from "./localAssistant";
import { parseBudget } from "./budget";

// Si la fonction a laissé passer du JSON brut (l'IA a mal formaté), on en retire la phrase de réponse.
function cleanReply(raw) {
  const text = String(raw || "");
  if (!text.trim().startsWith("{")) return text.slice(0, 1200);
  const m = text.match(/"reply"\s*:\s*"([\s\S]*?)"\s*,\s*"ops"/);
  return (m ? m[1].replace(/\\n/g, "\n").replace(/\\"/g, '"') : text).slice(0, 1200);
}

export async function askAssistant({ message, history, context, user, attachments }) {
  if (user) {
    try {
      const { data, error } = await supabase.functions.invoke("rapid-worker", { body: { message, history, context, attachments } });
      if (error) throw error;
      // Accès suspendu : on le dit, et on ne bascule pas sur le mode simple.
      if (data?.banned) return { reply: data.error, ops: [], source: "banned" };
      if (data?.error) throw new Error(data.error);
      const budget = Number(data.budget);
      return { reply: cleanReply(data.reply),  ops: sanitizeOps(data.ops), budget: (budget > 0 && budget < 1e9 ? Math.round(budget) : null) ?? parseBudget(message), source: "ia" };
    } catch (err) {
      console.error("Assistant IA :", err);
      const local = localAssist({ message, specs: context?.specs });
      return { ...local, budget: parseBudget(message), source: "local", warn: friendly(err) };
    }
  }
  return { ...localAssist({ message, specs: context?.specs }), budget: parseBudget(message), source: "local" };
}

function friendly(err) {
  const m = String(err?.message || err || "");
  // Les messages de la fonction sont déjà écrits pour l'utilisateur.
  if (/saturée|refusée|trop de|erreur \d|clé IA|souci/i.test(m)) return m;
  if (/not found|404|Failed to send|fetch/i.test(m)) return "L'assistant IA n'est pas encore branché ou ne répond pas.";
  return "L'IA n'a pas répondu.";
}
