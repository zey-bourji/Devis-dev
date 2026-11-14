// Quand la personne donne un budget, c'est le logiciel qui calcule (l'IA se trompe en maths).
// Deux options : rester dans le budget (on dit ce qu'on enlève), ou tout garder et assumer le dépassement.

import { CATEGORIES } from "./features";
import { buildQuote, formatFCFA } from "./pricing";

const ITEMS = CATEGORIES.flatMap((c) => c.items);

export function planBudget({ selected, rate, options, budget }) {
  const totalOf = (sel, overrides) => buildQuote(CATEGORIES, sel, rate, { ...options, overrides }).total;
  const startOverrides = options.overrides || {};
  const current = totalOf(selected, startOverrides);
  if (!(budget > 0) || current <= budget) return null;

  const priceOf = (item, overrides) => overrides[item.id]?.price ?? item.price;
  const floorOf = (item) => item.min ?? item.price;
  let sel = new Set(selected);
  let overrides = { ...startOverrides };
  const setPrice = (item, price) => { overrides = { ...overrides, [item.id]: { ...(overrides[item.id] || {}), price } }; };

  // 1) on ramène chaque prix au bas de la fourchette habituelle, en commençant par là où ça fait gagner le plus
  const lowerable = ITEMS.filter((i) => sel.has(i.id) && i.min !== undefined && priceOf(i, overrides) > i.min)
    .sort((a, b) => priceOf(b, overrides) - b.min - (priceOf(a, overrides) - a.min));
  for (const item of lowerable) {
    if (totalOf(sel, overrides) <= budget) break;
    setPrice(item, item.min);
  }

  // 2) si ça ne suffit pas, on retire les lignes les plus chères, une par une
  const dropped = [];
  while (totalOf(sel, overrides) > budget && sel.size > 1) {
    const byPrice = [...sel]
      .map((id) => ({ id, price: buildQuote(CATEGORIES, new Set([id]), rate, { overrides }).total }))
      .sort((a, b) => b.price - a.price);
    const drop = byPrice[0].id;
    sel = new Set([...sel].filter((id) => id !== drop));
    dropped.push(ITEMS.find((i) => i.id === drop));
  }

  // 3) on remet ce qui peut encore rentrer (les moins chères d'abord, au plus bas prix)
  for (const item of [...dropped].sort((a, b) => floorOf(a) - floorOf(b))) {
    const trySel = new Set([...sel, item.id]);
    const tryOv = { ...overrides, [item.id]: { price: floorOf(item) } };
    if (totalOf(trySel, tryOv) <= budget) { sel = trySel; overrides = tryOv; dropped.splice(dropped.indexOf(item), 1); }
  }

  // 4) s'il reste de la place, on remonte les prix baissés, du plus cher au moins cher, sans dépasser le budget
  for (const item of ITEMS.filter((i) => sel.has(i.id)).sort((a, b) => b.price - a.price)) {
    const want = (startOverrides[item.id]?.price ?? item.price);
    if (priceOf(item, overrides) >= want) continue;
    const room = budget - totalOf(sel, overrides);
    setPrice(item, Math.min(want, priceOf(item, overrides) + Math.max(0, room)));
  }

  // Les changements à jouer, à partir de ce qui était coché au départ
  const ops = [];
  const removed = [];
  const reduced = [];
  for (const id of selected) {
    const item = ITEMS.find((i) => i.id === id);
    if (!item) continue;
    if (!sel.has(id)) { ops.push({ op: "unselect", id }); removed.push(item.label); continue; }
    const before = priceOf(item, startOverrides), after = priceOf(item, overrides);
    if (after !== before) { ops.push({ op: "price", id, value: after }); reduced.push(item.label); }
  }

  const lightTotal = totalOf(sel, overrides);
  const lines = [`Ton budget : ${formatFCFA(budget)}. Le devis complet fait ${formatFCFA(current)} (${formatFCFA(current - budget)} de plus).`, ""];
  lines.push("Option 1 : rester dans le budget");
  if (reduced.length) lines.push(`- Prix baissés : ${reduced.join(", ")}`);
  if (removed.length) lines.push(`- Retiré : ${removed.join(", ")}`);
  lines.push(`- Nouveau total : ${formatFCFA(lightTotal)}`, "", "Option 2 : tout garder");
  lines.push(`- Total : ${formatFCFA(current)}, au-dessus du budget. Tu pourras fixer le prix convenu avec le client.`);
  return { text: lines.join("\n"), optionA: { label: "Option 1 : rester dans le budget", ops }, optionB: { label: "Option 2 : tout garder" } };
}

// Retrouve un budget écrit dans le message : « budget 200 000 », « budget de 300k », « maximum 150000 FCFA ».
// Le logiciel le lit lui-même, pour que les deux options apparaissent même si l'IA l'a oublié.
export function parseBudget(message) {
  const m = String(message || "").toLowerCase().match(/(?:budget|maximum|max|plafond)[^\d]{0,20}(\d[\d\s.,]{0,12}\d|\d)\s*(k|mille|m|millions?)?/);
  if (!m) return null;
  let n = Number(m[1].replace(/[\s.,]/g, ""));
  if (!n) return null;
  if (m[2] === "k" || m[2] === "mille") n *= 1000;
  if (m[2] && m[2].startsWith("m") && m[2] !== "mille") n = Math.round(parseFloat(m[1].replace(/\s/g, "").replace(",", ".")) * 1000000);
  return n >= 1000 && n < 1e9 ? Math.round(n) : null;
}
