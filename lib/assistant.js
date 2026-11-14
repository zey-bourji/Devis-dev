// Le point d'entrée de l'assistant : connecté, on appelle la fonction Supabase (qui parle à l'IA) ;
// sinon, ou si elle échoue, on retombe sur les règles simples de localAssistant.

import { supabase } from "./supabase";
import { sanitizeOps } from "./aiOps";
import { localAssist } from "./localAssistant";

export async function askAssistant({ message, history, context, user }) {
  if (user) {
    try {
      const { data, error } = await supabase.functions.invoke("quote-chat", { body: { message, history, context } });
      if (error) throw error;
      // Accès suspendu : on le dit, et on ne bascule pas sur le mode simple.
      if (data?.banned) return { reply: data.error, ops: [], source: "banned" };
      if (data?.error) throw new Error(data.error);
      return { reply: String(data.reply || "").slice(0, 1200), ops: sanitizeOps(data.ops), source: "ia" };
    } catch (err) {
      const local = localAssist({ message, specs: context?.specs });
      return { ...local, source: "local", warn: friendly(err) };
    }
  }
  return { ...localAssist({ message, specs: context?.specs }), source: "local" };
}

function friendly(err) {
  const m = String(err?.message || err || "");
  // Les messages de la fonction sont déjà écrits pour l'utilisateur.
  if (/saturée|refusée|trop de/i.test(m)) return m;
  if (/not found|404|Failed to send|fetch/i.test(m)) return "L'assistant IA n'est pas encore branché ou ne répond pas.";
  return "L'IA n'a pas répondu.";
}
