// Les « actions » que l'assistant peut demander sur le devis.
// Le modèle d'IA renvoie une liste d'actions ; on ne lui fait JAMAIS confiance :
// chaque action est revérifiée ici (identifiants connus, nombres bornés) avant d'être appliquée.

import { CATEGORIES, DEFAULT_DAILY_RATE } from "./features";
import { RHYTHMS } from "./schedule";

const ITEMS = CATEGORIES.flatMap((c) => c.items);
const IDS = new Set(ITEMS.map((i) => i.id));
const TEMPLATES = ["classique", "moderne", "minimal"];
const RHYTHM_IDS = RHYTHMS.map((r) => r.id);

const labelOf = (id) => ITEMS.find((i) => i.id === id)?.label || id;
const num = (v, min, max) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : null;
};
const text = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const fcfa = (n) => new Intl.NumberFormat("fr-FR").format(n).replace(/[  ]/g, " ") + " FCFA";

export function sanitizeOps(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const op of raw.slice(0, 40)) {
    if (!op || typeof op !== "object") continue;
    switch (op.op) {
      case "select":
      case "unselect":
        if (IDS.has(op.id)) out.push({ op: op.op, id: op.id });
        break;
      case "days": {
        const item = ITEMS.find((i) => i.id === op.id);
        const v = num(op.value, 0, 60);
        if (item && v !== null) out.push({ op: "price", id: op.id, value: Math.round(v * DEFAULT_DAILY_RATE) });
        break;
      }
      case "price": {
        const v = num(op.value, 0, 20000000);
        if (IDS.has(op.id) && v !== null) out.push({ op: "price", id: op.id, value: Math.round(v) });
        break;
      }
      case "rate":
        break; // plus de taux journalier : on ignore
      case "discount_percent": {
        const v = num(op.value, 0, 100);
        if (v !== null) out.push({ op: "discount_percent", value: Math.round(v * 10) / 10 });
        break;
      }
      case "discount_amount": {
        const v = num(op.value, 0, 20000000);
        if (v !== null) out.push({ op: "discount_amount", value: Math.round(v) });
        break;
      }
      case "round": {
        const v = num(op.step, 100, 1000000);
        if (v !== null) out.push({ op: "round", step: Math.round(v) });
        break;
      }
      case "schedule": {
        const patch = {};
        const dep = num(op.deposit, 0, 100);
        const inst = num(op.installments, 1, 12);
        if (dep !== null) patch.depositPercent = Math.round(dep);
        if (inst !== null) patch.installments = Math.round(inst);
        if (RHYTHM_IDS.includes(op.rhythm)) patch.rhythm = op.rhythm;
        if (Object.keys(patch).length) out.push({ op: "schedule", patch });
        break;
      }
      case "template":
        if (TEMPLATES.includes(op.value)) out.push({ op: "template", value: op.value });
        break;
      case "color":
        if (typeof op.value === "string" && /^#[0-9a-f]{6}$/i.test(op.value)) out.push({ op: "color", value: op.value.toLowerCase() });
        break;
      case "client": {
        const name = text(op.name, 80);
        const project = text(op.project, 80);
        if (name || project) out.push({ op: "client", ...(name && { name }), ...(project && { project }) });
        break;
      }
      case "note": {
        const t = text(op.text, 220);
        if (IDS.has(op.id) && t) out.push({ op: "note", id: op.id, text: t });
        break;
      }
      case "custom": {
        const label = text(op.label, 80);
        const price = num(op.price, 0, 20000000);
        if (label && price !== null) out.push({ op: "custom", label, price: Math.round(price) });
        break;
      }
    }
  }
  return out;
}

// Une phrase courte par action, affichée dans le chat pendant que le devis se remplit.
export function describeOp(op) {
  switch (op.op) {
    case "select": return `Je coche « ${labelOf(op.id)} »`;
    case "unselect": return `Je retire « ${labelOf(op.id)} »`;
    case "days": return `${labelOf(op.id)} : ${String(op.value).replace(".", ",")} jour${op.value > 1 ? "s" : ""}`;
    case "price": return `${labelOf(op.id)} : ${fcfa(op.value)}`;
    case "rate": return `Taux journalier : ${fcfa(op.value)}`;
    case "discount_percent": return `Remise de ${String(op.value).replace(".", ",")} %`;
    case "discount_amount": return `Remise de ${fcfa(op.value)}`;
    case "round": return `J'arrondis le total (pas de ${fcfa(op.step)})`;
    case "schedule": {
      const p = op.patch;
      const parts = [];
      if (p.depositPercent !== undefined) parts.push(`acompte ${p.depositPercent} %`);
      if (p.installments !== undefined && p.rhythm !== "livraison") parts.push(`${p.installments} versement${p.installments > 1 ? "s" : ""}`);
      const when = { livraison: "solde à la livraison", semaine: "chaque semaine", quinzaine: "tous les 15 jours", mois: "chaque mois" };
      if (p.rhythm) parts.push(when[p.rhythm]);
      return "Paiement : " + parts.join(", ");
    }
    case "template": return `Modèle « ${op.value} »`;
    case "color": return `Couleur du devis ${op.value}`;
    case "client": return "Client : " + [op.name, op.project].filter(Boolean).join(" · ");
    case "note": return `Je justifie « ${labelOf(op.id)} »`;
    case "custom": return `J'ajoute « ${op.label} » (${fcfa(op.price)})`;
    default: return "";
  }
}
