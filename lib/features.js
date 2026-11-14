// Le catalogue des fonctionnalités que le dev peut cocher.
// Chaque fonctionnalité a un prix fixe en FCFA : on paie pour ce qui est livré, pas pour le temps passé.
// min / max : la fourchette de prix habituelle, qui sert de repère (le dev reste libre de choisir).
// Les valeurs sont des exemples de départ : chaque dev les ajuste dans son devis.

export const CATEGORIES = [
  {
    id: "front",
    label: "Front-end",
    items: [
      { id: "vitrine", label: "Site vitrine (5 pages)", type: "fixed", price: 100000, min: 75000, max: 150000 },
      { id: "responsive", label: "Design adapté au mobile", type: "fixed", price: 50000, min: 25000, max: 75000 },
      { id: "maquette", label: "Intégration d'une maquette Figma", type: "fixed", price: 75000, min: 50000, max: 125000 },
      { id: "contact", label: "Formulaire de contact", type: "fixed", price: 25000, min: 12500, max: 50000 },
    ],
  },
  {
    id: "back",
    label: "Back-end",
    items: [
      { id: "auth", label: "Authentification (inscription / connexion)", type: "fixed", price: 50000, min: 25000, max: 75000 },
      { id: "api", label: "API et base de données", type: "fixed", price: 100000, min: 75000, max: 200000 },
      { id: "admin", label: "Espace administrateur", type: "fixed", price: 100000, min: 75000, max: 200000 },
      { id: "paiement", label: "Paiement Mobile Money", type: "fixed", price: 75000, min: 50000, max: 125000 },
    ],
  },
  {
    id: "hebergement",
    label: "Hébergement",
    items: [{ id: "hebergement", label: "Hébergement web (1 an)", type: "fixed", price: 36000 }],
  },
  {
    id: "domaine",
    label: "Nom de domaine",
    items: [{ id: "domaine", label: "Nom de domaine (1 an)", type: "fixed", price: 15000 }],
  },
  {
    id: "maintenance",
    label: "Maintenance",
    items: [{ id: "maintenance", label: "Maintenance et corrections (3 mois)", type: "fixed", price: 45000 }],
  },
];

// Ancien taux journalier : sert seulement à relire les devis enregistrés avant le passage aux prix par fonctionnalité.
export const DEFAULT_DAILY_RATE = 25000;
