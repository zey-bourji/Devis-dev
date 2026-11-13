// Toute la logique de prix est ici, séparée de l'affichage.
// La page, le récapitulatif et le PDF utilisent exactement le même calcul.

// Prix d'une ligne du catalogue : jours x taux, ou prix fixe.
export function itemPrice(item, dailyRate) {
  return item.type === "days" ? item.days * dailyRate : item.price;
}

// Transforme les cases cochées + lignes personnalisées en lignes de devis, avec remise et total.
export function buildQuote(categories, selectedIds, dailyRate, options = {}) {
  const { customLines = [], discountPercent = 0, notes = {} } = options;
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
          note: (notes[item.id] || "").trim(),
        });
      }
    }
  }

  for (const custom of customLines) {
    if (!custom.label.trim()) continue; // une ligne sans nom est ignorée
    lines.push({
      id: custom.id,
      category: "Autres",
      label: custom.label.trim(),
      days: null,
      price: Math.max(0, Number(custom.price) || 0),
      note: (notes[custom.id] || "").trim(),
    });
  }

  const subtotal = lines.reduce((sum, line) => sum + line.price, 0);
  const pct = Math.min(100, Math.max(0, Number(discountPercent) || 0));
  const discount = Math.round((subtotal * pct) / 100);
  return { lines, subtotal, discountPercent: pct, discount, total: subtotal - discount };
}

// 1250000 -> "1 250 000 FCFA" (espaces normaux, compatibles avec le PDF)
export function formatFCFA(amount) {
  const rounded = Math.round(amount);
  const digits = Math.abs(rounded).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return (rounded < 0 ? "- " : "") + digits + " FCFA";
}
