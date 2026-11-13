// Toute la logique de prix est ici, séparée de l'affichage.
// Comme ça, la page et le futur PDF utilisent exactement le même calcul.

// Prix d'une ligne : jours x taux, ou prix fixe.
export function itemPrice(item, dailyRate) {
  return item.type === "days" ? item.days * dailyRate : item.price;
}

// Transforme les cases cochées en lignes de devis + total.
export function buildQuote(categories, selectedIds, dailyRate) {
  const lines = [];
  for (const cat of categories) {
    for (const item of cat.items) {
      if (selectedIds.has(item.id)) {
        lines.push({
          id: item.id,
          category: cat.label,
          label: item.label,
          days: item.type === "days" ? item.days : null,
          price: itemPrice(item, dailyRate),
        });
      }
    }
  }
  const total = lines.reduce((sum, line) => sum + line.price, 0);
  return { lines, total };
}

// 1250000 -> "1 250 000 FCFA" (espaces normaux, compatibles avec le PDF plus tard)
export function formatFCFA(amount) {
  const rounded = Math.round(amount);
  return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " FCFA";
}
