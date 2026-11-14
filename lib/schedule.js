// L'échéancier de paiement : comment le client règle le total.
// Un acompte à la commande, puis le reste soit en une fois à la livraison,
// soit en plusieurs versements égaux (chaque semaine, tous les 15 jours ou chaque mois).

export const RHYTHMS = [
  { id: "livraison", label: "En une fois, à la livraison" },
  { id: "semaine", label: "En plusieurs versements, chaque semaine" },
  { id: "quinzaine", label: "En plusieurs versements, tous les 15 jours" },
  { id: "mois", label: "En plusieurs versements, chaque mois" },
];

export const DEFAULT_SCHEDULE = { depositPercent: 50, installments: 1, rhythm: "livraison" };

// Raccourcis proposés au dev : un clic règle les trois champs.
export const SCHEDULE_PRESETS = [
  { label: "50 % puis solde à la livraison", value: { depositPercent: 50, installments: 1, rhythm: "livraison" } },
  { label: "30 % puis 3 mois", value: { depositPercent: 30, installments: 3, rhythm: "mois" } },
  { label: "4 versements égaux (mensuels)", value: { depositPercent: 25, installments: 3, rhythm: "mois" } },
  { label: "100 % à la commande", value: { depositPercent: 100, installments: 1, rhythm: "livraison" } },
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));

// "1 mois", "2 mois", "15 jours", "30 jours", "1 semaine", "2 semaines"...
function delay(i, rhythm) {
  if (rhythm === "mois") return `${i} mois`;
  if (rhythm === "quinzaine") return `${i * 15} jours`;
  return i === 1 ? "1 semaine" : `${i} semaines`;
}

// Renvoie la liste des paiements : [{ label, amount }], dont la somme fait exactement le total.
export function buildSchedule(total, schedule = DEFAULT_SCHEDULE) {
  const pct = clamp(schedule.depositPercent, 0, 100);
  const n = Math.round(clamp(schedule.installments, 1, 12));
  const deposit = Math.round((total * pct) / 100);
  const rest = total - deposit;
  const rows = [];

  // due : quand la ligne est due, par rapport à la date de commande (voir dueDateFor)
  if (deposit > 0) rows.push({ label: `Acompte à la commande (${pct} %)`, amount: deposit, due: { kind: "order" } });

  if (rest > 0) {
    if (schedule.rhythm === "livraison") {
      rows.push({ label: "Solde à la livraison", amount: rest, due: { kind: "delivery" } });
    } else {
      const base = Math.floor(rest / n);
      for (let i = 1; i <= n; i++) {
        // Le dernier versement absorbe les quelques FCFA d'arrondi : la somme reste exacte.
        const amount = i === n ? rest - base * (n - 1) : base;
        const when = `${delay(i, schedule.rhythm)} après la commande`;
        const due = schedule.rhythm === "mois" ? { kind: "after", unit: "months", n: i } : { kind: "after", unit: "days", n: schedule.rhythm === "quinzaine" ? i * 15 : i * 7 };
        rows.push({ label: n === 1 ? `Solde · ${when}` : `Versement ${i} sur ${n} · ${when}`, amount, due });
      }
    }
  }
  return rows;
}

// "2026-11-14" -> date à midi (évite les décalages de fuseau)
const toDate = (iso) => (iso ? new Date(iso + "T12:00:00") : null);

// La date à laquelle une ligne de l'échéancier est due, ou null si on ne peut pas la calculer
// (il manque la date de commande ou de livraison).
export function dueDateFor(row, dates = {}) {
  const due = row?.due;
  if (!due) return null;
  if (due.kind === "delivery") return toDate(dates.postponedTo || dates.delivery);
  const order = toDate(dates.order);
  if (!order) return null;
  if (due.kind === "order") return order;
  const d = new Date(order);
  if (due.unit === "months") d.setMonth(d.getMonth() + due.n);
  else d.setDate(d.getDate() + due.n);
  return d;
}

// Nombre de jours entre aujourd'hui et une date (négatif = en retard).
export function daysUntil(date, now = new Date()) {
  const a = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((a - b) / 86400000);
}

export function describeDays(days) {
  if (days < -1) return `en retard de ${-days} jours`;
  if (days === -1) return "en retard d'un jour";
  if (days === 0) return "aujourd'hui";
  if (days === 1) return "demain";
  return `dans ${days} jours`;
}
