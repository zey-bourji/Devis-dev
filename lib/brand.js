// Réglages d'apparence du devis, sauvegardés dans le navigateur du dev.
export const DEFAULT_BRAND = {
  template: "classique", // modèle de devis : "classique", "moderne" ou "minimal"
  logo: null,            // image du logo (data URL), ou null
  color: "#3b3f8f",      // couleur principale du devis
  showSignature: true,   // affiche la case "Bon pour accord"
  conditions:
    "Les prix sont en francs CFA (FCFA). Le paiement suit l'échéancier indiqué sur ce devis. Les délais sont confirmés à la signature du devis.",
};

export const COLOR_PRESETS = ["#3b3f8f", "#0f766e", "#b45309", "#be123c", "#1d4ed8", "#111827"];
