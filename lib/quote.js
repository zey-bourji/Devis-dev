// Petites fonctions utilitaires pour le devis.

// 13 novembre 2026, 3 chiffres au hasard -> "DEV-20261113-482"
export function makeQuoteNumber(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const rand = String(Math.floor(Math.random() * 900) + 100);
  return `DEV-${y}${m}${d}-${rand}`;
}

// "13/11/2026"
export function formatDate(date) {
  return date.toLocaleDateString("fr-FR");
}

// Date + nombre de jours -> nouvelle date (pour la fin de validité)
export function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
