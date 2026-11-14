// Les petites statistiques du compte : combien encaissé, combien de devis, de projets, par mois.

import { buildSchedule, DEFAULT_SCHEDULE } from "./schedule";

export const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

// Les n derniers mois, du plus ancien au plus récent : [{ key: "2026-11", label: "nov." }]
export function lastMonths(n = 6, now = new Date()) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ key: monthKey(d), label: d.toLocaleDateString("fr-FR", { month: "short" }) });
  }
  return out;
}

const inMonth = (iso, key) => typeof iso === "string" && iso.slice(0, 7) === key;

// Chaque paiement marqué comme reçu : { date, amount }
export function receivedPayments(quotes) {
  const out = [];
  for (const q of quotes || []) {
    const d = q.data || {};
    const rows = buildSchedule(Number(q.total) || 0, { ...DEFAULT_SCHEDULE, ...(d.schedule || {}) });
    rows.forEach((row, i) => {
      const entry = d.paid?.[i];
      if (entry?.date) out.push({ date: entry.date, amount: row.amount });
    });
  }
  return out;
}

export function monthStats(key, { quotes, projects }) {
  const received = receivedPayments(quotes);
  return {
    encaisse: received.filter((p) => inMonth(p.date, key)).reduce((s, p) => s + p.amount, 0),
    devis: (quotes || []).filter((q) => inMonth(q.created_at, key)).length,
    projets: (projects || []).filter((p) => inMonth(p.created_at, key)).length,
    termines: (quotes || []).filter((q) => q.status === "terminé" && inMonth(q.updated_at, key)).length,
  };
}

// Encaissé depuis le début, et reste à encaisser sur les devis acceptés ou en cours.
export function totals(quotes) {
  const encaisse = receivedPayments(quotes).reduce((s, p) => s + p.amount, 0);
  const open = (quotes || []).filter((q) => ["accepté", "en cours", "terminé", "reporté"].includes(q.status));
  const planned = open.reduce((s, q) => s + (Number(q.total) || 0), 0);
  const paidOnOpen = receivedPayments(open).reduce((s, p) => s + p.amount, 0);
  return { encaisse, reste: Math.max(0, planned - paidOnOpen) };
}
