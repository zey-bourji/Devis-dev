import { CATEGORIES, DEFAULT_DAILY_RATE } from "../lib/features";
import { buildQuote, formatFCFA } from "../lib/pricing";

// Le devis tel qu'il sort du PDF, posé sur la page d'accueil. Les chiffres viennent du vrai calcul.
const IDS = ["vitrine", "auth", "paiement", "hebergement"];

export default function QuoteSheet() {
  const quote = buildQuote(CATEGORIES, new Set(IDS), DEFAULT_DAILY_RATE);
  const deposit = Math.round(quote.total / 2);
  return (
    <figure className="sheet" aria-label="Exemple de devis généré">
      <div className="sheet-top">
        <div>
          <strong>Awa Kouassi</strong>
          <span>Développeuse web, Abidjan</span>
        </div>
        <div className="sheet-ref">
          <strong>Devis</strong>
          <span>N° DEV-20261114-204</span>
        </div>
      </div>
      <div className="sheet-for">
        <span>Pour</span>
        <strong>Boutique Résini</strong>
        <span>Site e-commerce</span>
      </div>
      <ul className="sheet-lines">
        {quote.lines.map((l) => (
          <li key={l.id}>
            <span>{l.label}</span>
            <b>{formatFCFA(l.price)}</b>
          </li>
        ))}
      </ul>
      <div className="sheet-sum">
        <span>Total</span>
        <strong>{formatFCFA(quote.total)}</strong>
      </div>
      <p className="sheet-pay">
        Acompte de {formatFCFA(deposit)} à la commande, solde à la livraison.
      </p>
    </figure>
  );
}
