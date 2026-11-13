// Le catalogue des fonctionnalités que le dev peut cocher.
// type "days"  -> prix = jours x taux journalier du dev
// type "fixed" -> prix fixe en FCFA (domaine, hébergement, maintenance...)
// min / max : la fourchette de jours habituelle, qui sert de repère (le dev reste libre de choisir).
// Les valeurs sont des exemples de départ : chaque dev les ajuste dans son devis.

export const CATEGORIES = [
  {
    id: "front",
    label: "Front-end",
    items: [
      { id: "vitrine", label: "Site vitrine (5 pages)", type: "days", days: 4, min: 3, max: 6 },
      { id: "responsive", label: "Design adapté au mobile", type: "days", days: 2, min: 1, max: 3 },
      { id: "maquette", label: "Intégration d'une maquette Figma", type: "days", days: 3, min: 2, max: 5 },
      { id: "contact", label: "Formulaire de contact", type: "days", days: 1, min: 0.5, max: 2 },
    ],
  },
  {
    id: "back",
    label: "Back-end",
    items: [
      { id: "auth", label: "Authentification (inscription / connexion)", type: "days", days: 2, min: 1, max: 3 },
      { id: "api", label: "API et base de données", type: "days", days: 4, min: 3, max: 8 },
      { id: "admin", label: "Espace administrateur", type: "days", days: 4, min: 3, max: 8 },
      { id: "paiement", label: "Paiement Mobile Money", type: "days", days: 3, min: 2, max: 5 },
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

export const DEFAULT_DAILY_RATE = 25000; // FCFA par jour
