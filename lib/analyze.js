// Analyse d'un cahier des charges par mots-clés.
// Ce n'est pas de l'IA : on cherche des mots, et on propose les fonctionnalités qui y correspondent.
// Chaque suggestion garde le mot qui l'a déclenchée, pour que le dev comprenne pourquoi.

const RULES = [
  { id: "vitrine", words: ["site vitrine", "vitrine", "page d'accueil", "presentation", "landing", "site web", "site internet"] },
  { id: "responsive", words: ["mobile", "responsive", "telephone", "smartphone", "android", "ios", "tablette"] },
  { id: "maquette", words: ["figma", "maquette", "wireframe", "charte graphique"] },
  { id: "contact", words: ["contact", "formulaire", "nous ecrire"] },
  { id: "auth", words: ["inscription", "connexion", "se connecter", "login", "compte utilisateur", "authentification", "mot de passe", "espace membre", "espace client"] },
  { id: "api", words: ["base de donnees", "api", "stockage", "enregistrer les donnees", "sauvegarde des donnees", "back-end", "backend", "serveur"] },
  { id: "admin", words: ["administrateur", "admin", "tableau de bord", "dashboard", "back-office", "backoffice", "gestion des"] },
  { id: "paiement", words: ["paiement", "payer", "mobile money", "wave", "orange money", "mtn", "moov", "carte bancaire", "e-commerce", "boutique en ligne", "commande en ligne"] },
  { id: "hebergement", words: ["hebergement", "heberger", "mise en ligne", "deployer", "deploiement"] },
  { id: "domaine", words: ["nom de domaine", "domaine", ".com", ".ci"] },
  { id: "maintenance", words: ["maintenance", "support", "suivi", "mises a jour", "mise a jour", "correction"] },
];

// "Système de paiement" -> "systeme de paiement" (sans accents, en minuscules)
function normalize(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’‘]/g, "'");
}

// Renvoie [{ id, word }] : les fonctionnalités trouvées et le mot qui l'a déclenchée.
export function analyzeSpecs(text) {
  const clean = normalize(text || "");
  if (!clean.trim()) return [];
  const found = [];
  for (const rule of RULES) {
    const word = rule.words.find((w) => clean.includes(w));
    if (word) found.push({ id: rule.id, word });
  }
  return found;
}
