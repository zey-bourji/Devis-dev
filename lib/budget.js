// Quand la personne donne un budget, c'est le logiciel qui calcule (l'IA se trompe en maths).
// Deux options : rester dans le budget (on dit ce qu'on enlève), ou tout garder et assumer le dépassement.

import { CATEGORIES } from "./features";
import { buildQuote, formatFCFA } from "./pricing";

const ITEMS = CATEGORIES.flatMap((c) => c.items);

export function planBudget({ selected, rate, options, budget }) {
  const totalOf = (sel, overrides) => buildQuote(CATEGORIES, sel, rate, { ...options, overrides }).total;
  const current = totalOf(selected, options.overrides || {});
  if (!(budget > 0) || current <= budget) return null;

  let sel = new Set(selected);
  let overrides = { ...(options.overrides || {}) };
  const ops = [];
  const reduced = [];
  const removed = [];

  // 1) on ramène les jours au minimum habituel, là où ça fait gagner le plus
  const daysItems = ITEMS.filter((i) => sel.has(i.id) && i.type === "days")
    .map((i) => {
      const days = overrides[i.id]?.days ?? i.days;
      return { item: i, days, saving: (days - i.min) * rate };
    })
    .filter((x) => x.saving > 0)
    .sort((a, b) => b.saving - a.saving);
  for (const { item } of daysItems) {
    if (totalOf(sel, overrides) <= budget) break;
    overrides = { ...overrides, [item.id]: { ...(overrides[item.id] || {}), days: item.min } };
    ops.push({ op: "days", id: item.id, value: item.min });
    reduced.push(item.label);
  }

  // 2) si ça ne suffit pas, on retire les lignes les plus chères, une par une
  while (totalOf(sel, overrides) > budget && sel.size > 1) {
    const priced = [...sel]
      .map((id) => ({ id, price: buildQuote(CATEGORIES, new Set([id]), rate, { overrides }).total }))
      .sort((a, b) => b.price - a.price);
    const drop = priced[0].id;
    sel = new Set([...sel].filter((id) => id !== drop));
    ops.push({ op: "unselect", id: drop });
    removed.push(ITEMS.find((i) => i.id === drop)?.label || drop);
  }

  const lightTotal = totalOf(sel, overrides);
  const lines = [`Ton budget : ${formatFCFA(budget)}. Le devis complet fait ${formatFCFA(current)} (${formatFCFA(current - budget)} de plus).`, ""];
  lines.push("Option 1 : rester dans le budget");
  if (reduced.length) lines.push(`- Jours au minimum : ${reduced.join(", ")}`);
  if (removed.length) lines.push(`- Retiré : ${removed.join(", ")}`);
  lines.push(`- Nouveau total : ${formatFCFA(lightTotal)}`, "", "Option 2 : tout garder");
  lines.push(`- Total : ${formatFCFA(current)}, au-dessus du budget. Tu pourras fixer le prix convenu avec le client.`);
  return { text: lines.join("\n"), optionA: { label: "Option 1 : rester dans le budget", ops }, optionB: { label: "Option 2 : tout garder" } };
}
