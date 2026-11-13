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

  if (deposit > 0) rows.push({ label: `Acompte à la commande (${pct} %)`, amount: deposit });

  if (rest > 0) {
    if (schedule.rhythm === "livraison") {
      rows.push({ label: "Solde à la livraison", amount: rest });
    } else {
      const base = Math.floor(rest / n);
      for (let i = 1; i <= n; i++) {
        // Le dernier versement absorbe les quelques FCFA d'arrondi : la somme reste exacte.
        const amount = i === n ? rest - base * (n - 1) : base;
        const when = `${delay(i, schedule.rhythm)} après la commande`;
        rows.push({ label: n === 1 ? `Solde · ${when}` : `Versement ${i} sur ${n} · ${when}`, amount });
      }
    }
  }
  return rows;
}
