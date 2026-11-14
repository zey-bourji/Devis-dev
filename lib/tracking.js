// Le suivi d'un devis une fois envoyé : statut, total convenu, paiements reçus, dates.

export const STATUSES = ["brouillon", "envoyé", "accepté", "en cours", "terminé", "reporté", "annulé", "refusé"];

// "en cours" -> "status-en-cours" (une classe CSS ne peut pas contenir d'espace)
export const statusClass = (status) => "status-" + String(status).replace(/\s+/g, "-");

export const DEFAULT_DATES = { start: "", delivery: "", postponedTo: "" };

// Le total qui compte : celui convenu avec le client s'il existe, sinon l'estimation calculée.
export function effectiveTotal(estimated, agreed) {
  const n = Number(agreed);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : estimated;
}

// paid : { "0": { date: "2026-11-14", proof: { path, name } | null }, ... } (clé = numéro de l'échéance)
export function paymentSummary(payments, paid, total) {
  const received = payments.reduce((sum, p, i) => (paid[i] ? sum + p.amount : sum), 0);
  return { received, remaining: Math.max(0, total - received), percent: total > 0 ? Math.min(100, Math.round((received / total) * 100)) : 0 };
}
