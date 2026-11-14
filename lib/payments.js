// Les paiements reçus d'un devis, saisis librement : « il m'a donné 50 000, puis 25 000 une semaine après ».
// Chaque paiement reçu est { id, amount, date, note, proof }. Ils se déduisent des échéances dans l'ordre :
// le premier montant remplit la première échéance, le reste passe à la suivante, et ainsi de suite.

import { buildSchedule, DEFAULT_SCHEDULE } from "./schedule";

// Les anciens devis marquaient chaque échéance « payée » (d.paid). On les convertit en paiements reçus.
export function receiptsFrom(d, total) {
  if (Array.isArray(d?.receipts)) return d.receipts;
  const rows = buildSchedule(Number(total) || 0, { ...DEFAULT_SCHEDULE, ...(d?.schedule || {}) });
  const out = [];
  rows.forEach((row, i) => {
    const entry = d?.paid?.[i];
    if (entry) out.push({ id: "old" + i, amount: row.amount, date: entry.date || "", note: row.label, proof: entry.proof || null });
  });
  return out;
}

// Répartit les paiements reçus sur les échéances, dans l'ordre.
// Renvoie les échéances avec { paid, remaining, state }, state = "payé" | "partiel" | "attente", plus le total reçu.
export function allocate(rows, receipts) {
  const received = (receipts || []).reduce((s, r) => s + (Number(r.amount) || 0), 0);
  let pool = received;
  const out = rows.map((row) => {
    const paid = Math.min(row.amount, pool);
    pool -= paid;
    const remaining = row.amount - paid;
    return { ...row, paid, remaining, state: remaining <= 0 ? "payé" : paid > 0 ? "partiel" : "attente" };
  });
  return { rows: out, received, extra: Math.max(0, pool) };
}

export function paymentSummary(received, total) {
  return { received, remaining: Math.max(0, total - received), percent: total > 0 ? Math.min(100, Math.round((received / total) * 100)) : 0 };
}
