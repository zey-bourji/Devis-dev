// Toute la logique de prix est ici, séparée de l'affichage.
// La page, le récapitulatif et le PDF utilisent exactement le même calcul.

// Prix d'une ligne du catalogue : un prix fixe par fonctionnalité.
export function itemPrice(item) {
  return item.price;
}

// Transforme les cases cochées + lignes personnalisées en lignes de devis, avec remises et total.
// overrides : les réglages du dev pour une ligne { idLigne: { days, price } } (jours ou prix modifiés à la main).
export function buildQuote(categories, selectedIds, dailyRate, options = {}) {
  const { customLines = [], discountPercent = 0, discountAmount = 0, notes = {}, overrides = {} } = options;
  const lines = [];

  for (const cat of categories) {
    for (const item of cat.items) {
      if (!selectedIds.has(item.id)) continue;
      const ov = overrides[item.id] || {};
      // Les anciens devis réglaient des jours : on les relit avec l'ancien taux, pour que leur total ne change pas.
      const computed = ov.days !== undefined ? ov.days * dailyRate : item.price;
      lines.push({
        id: item.id,
        category: cat.label,
        label: item.label,
        days: null,
        price: Math.round(ov.price ?? computed),
        // true si le dev a changé le prix par rapport au catalogue
        edited: ov.price !== undefined || (ov.days !== undefined && Math.round(computed) !== item.price),
        note: (notes[item.id] || "").trim(),
      });
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
      edited: false,
      note: (notes[custom.id] || "").trim(),
    });
  }

  const subtotal = lines.reduce((sum, line) => sum + line.price, 0);
  const pct = Math.min(100, Math.max(0, Number(discountPercent) || 0));
  const percentAmount = Math.round((subtotal * pct) / 100);
  // La remise en FCFA ne peut pas dépasser ce qui reste à payer.
  const amount = Math.min(Math.max(0, Number(discountAmount) || 0), subtotal - percentAmount);
  const discount = percentAmount + amount;
  return {
    lines,
    subtotal,
    discountPercent: pct,
    discountPercentAmount: percentAmount,
    discountAmount: amount,
    discount,
    total: subtotal - discount,
  };
}

// 1250000 -> "1 250 000 FCFA" (espaces normaux, compatibles avec le PDF)
export function formatFCFA(amount) {
  const rounded = Math.round(amount);
  const digits = Math.abs(rounded).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return (rounded < 0 ? "- " : "") + digits + " FCFA";
}
