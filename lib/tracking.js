// Le suivi d'un devis une fois envoyé : statut, total convenu, paiements reçus, dates.

export const STATUSES = ["brouillon", "envoyé", "accepté", "en cours", "terminé", "reporté", "annulé", "refusé"];

// "en cours" -> "status-en-cours" (une classe CSS ne peut pas contenir d'espace)
export const statusClass = (status) => "status-" + String(status).replace(/\s+/g, "-");

export const DEFAULT_DATES = { order: "", start: "", delivery: "", postponedTo: "" };

// Le total qui compte : celui convenu avec le client s'il existe, sinon l'estimation calculée.
export function effectiveTotal(estimated, agreed) {
  const n = Number(agreed);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : estimated;
}
