// Les paiements à encaisser bientôt (ou déjà en retard), calculés depuis les devis du dev.
// Pas d'IA ici : on recalcule chaque échéance avec sa date, puis on garde celles qui ne sont pas payées.

import { buildSchedule, DEFAULT_SCHEDULE, daysUntil, dueDateFor } from "./schedule";

// Un devis envoyé n'est pas encore accepté : il n'y a rien à encaisser. Terminé : il peut rester des soldes.
const ACTIVE = ["accepté", "en cours", "terminé", "reporté"];

export function upcomingPayments(quotes, now = new Date(), horizonDays = 7) {
  const out = [];
  for (const q of quotes || []) {
    if (!ACTIVE.includes(q.status)) continue;
    const d = q.data || {};
    const rows = buildSchedule(Number(q.total) || 0, { ...DEFAULT_SCHEDULE, ...(d.schedule || {}) });
    rows.forEach((row, i) => {
      if (d.paid?.[i]) return;
      const due = dueDateFor(row, d.dates || {});
      if (!due) return;
      const days = daysUntil(due, now);
      if (days <= horizonDays) {
        out.push({ quoteId: q.id, number: q.number, client: d.client?.name || "", label: row.label, amount: row.amount, due, days });
      }
    });
  }
  return out.sort((a, b) => a.days - b.days);
}
