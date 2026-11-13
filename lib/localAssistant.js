// Le mode « sans IA » : quelques règles simples, pour que le chat réponde toujours,
// même sans connexion, sans compte, ou si la fonction IA est en panne.
// Ça ne comprend pas le langage comme une vraie IA : ça repère des mots et des chiffres.

import { analyzeSpecs } from "./analyze";
import { sanitizeOps } from "./aiOps";

const norm = (t) =>
  (t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’‘]/g, "'");

export function localAssist({ message, specs = "" }) {
  const clean = norm(message);
  const ops = [];

  // « enlève / retire / sans X » : on retire ce qui correspond
  const removeMatch = clean.match(/(?:enleve|retire|supprime|sans)\s+(.+)/);
  const removeIds = removeMatch ? analyzeSpecs(removeMatch[1]).map((f) => f.id) : [];
  removeIds.forEach((id) => ops.push({ op: "unselect", id }));

  // Les fonctionnalités : celles du message, plus celles du cahier des charges si on le demande.
  const wantsSpecs = /cahier|specs|lis |lire|projet/.test(clean) && specs.trim();
  const source = wantsSpecs ? message + " " + specs : removeMatch ? message.slice(0, message.toLowerCase().search(/enl[eè]ve|retire|supprime|sans/)) : message;
  // « paiement en 3 fois » parle de l'échéancier, pas de la fonctionnalité « Paiement Mobile Money ».
  const forFeatures = norm(source).replace(/(paiements?|payer|reglements?)\s+(?:echelonne\s+)?en\s+\d+\s*(fois|versements|mensualites|paiements)/g, " ");
  analyzeSpecs(forFeatures)
    .filter((f) => !removeIds.includes(f.id))
    .forEach((f) => ops.push({ op: "select", id: f.id }));

  const PC = "(?:%|pour ?cent)";
  const pct = clean.match(new RegExp("(\\d+(?:[.,]\\d+)?)\\s*" + PC + "\\s*(?:de\\s+)?(remise|reduction|rabais)|(remise|reduction|rabais)\\s+(?:de\\s+)?(\\d+(?:[.,]\\d+)?)\\s*" + PC));
  if (pct) ops.push({ op: "discount_percent", value: Number((pct[1] || pct[4]).replace(",", ".")) });

  const template = clean.match(/\b(moderne|minimal|classique)\b/);
  if (template) ops.push({ op: "template", value: template[1] });

  const rate = clean.match(/(\d[\d\s]{3,8})\s*(?:fcfa|f|francs)?\s*(?:par jour|\/\s*jour|le jour|journalier)/);
  if (rate) ops.push({ op: "rate", value: Number(rate[1].replace(/\s/g, "")) });

  const deposit = clean.match(/acompte\s+(?:de\s+)?(\d{1,3})\s*(?:%|pour ?cent)/);
  const times = clean.match(/en\s+(\d{1,2})\s*(?:fois|versements|mensualites|paiements)/);
  const schedule = {};
  if (deposit) schedule.deposit = Number(deposit[1]);
  if (times && Number(times[1]) > 1) {
    schedule.installments = Number(times[1]) - 1;
    schedule.rhythm = /semaine/.test(clean) ? "semaine" : /15 jours|quinzaine/.test(clean) ? "quinzaine" : "mois";
    if (!deposit) schedule.deposit = 30;
  }
  if (Object.keys(schedule).length) ops.push({ op: "schedule", ...schedule });

  const clientMatch = message.match(/(?:pour|client)\s*(?::|=)?\s*([A-ZÀ-Ý][\wÀ-ÿ'’-]+(?:\s+[A-ZÀ-Ý][\wÀ-ÿ'’-]+)?)/);
  if (clientMatch) ops.push({ op: "client", name: clientMatch[1] });

  const clean_ops = sanitizeOps(ops);
  if (clean_ops.length === 0) {
    return {
      reply:
        "Je suis en mode simple (sans IA) et je n'ai rien reconnu. Essaie par exemple : « site avec inscription et paiement Wave », « 10 % de remise », « en 3 fois » ou « modèle moderne ».",
      ops: [],
    };
  }
  return { reply: "Mode simple (sans IA) : j'ai repéré des mots-clés et je mets à jour ton devis. Vérifie les lignes.", ops: clean_ops };
}
