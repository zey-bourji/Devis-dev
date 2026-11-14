// Les cinq blocs de l'accueil : chacun montre une fonction avec un vrai morceau d'interface, sans icône décorative.
export default function Bento() {
  return (
    <div className="bento">
      <article className="tile tile-ai">
        <h3>Décris le projet, le devis se remplit.</h3>
        <p>Tape deux lignes ou colle le cahier des charges. L'assistant coche les bonnes fonctionnalités, tu corriges si besoin.</p>
        <div className="mock-chat" aria-hidden="true">
          <div className="mock-user">Boutique en ligne avec paiement Wave, budget 300 000</div>
          <ul className="mock-ticks">
            <li>Site e-commerce</li>
            <li>Paiement Mobile Money</li>
            <li>Espace administrateur</li>
          </ul>
        </div>
        <small>Un budget donné ? Tu choisis entre rester dedans ou tout garder.</small>
      </article>

      <article className="tile tile-pdf">
        <h3>Un PDF à ton nom.</h3>
        <p>Ton logo, ta couleur, trois modèles.</p>
        <div className="mock-pdfs" aria-hidden="true">
          {["#1b3fa8", "#0f6b5d", "#14171c"].map((c) => (
            <span key={c} style={{ "--c": c }}><i /><i /><i /></span>
          ))}
        </div>
      </article>

      <article className="tile">
        <h3>Des prix d'ici.</h3>
        <p>Mobile Money, hébergement, nom de domaine, acompte : le catalogue part de ce que tu vends vraiment.</p>
        <div className="mock-tags" aria-hidden="true">
          <span>Wave</span><span>Orange Money</span><span>MTN MoMo</span><span>Hébergement</span><span>Domaine</span>
        </div>
      </article>

      <article className="tile">
        <h3>Sais qui a payé quoi.</h3>
        <p>Marque chaque versement reçu, joins la preuve, et vois ce qui reste.</p>
        <div className="mock-progress" aria-hidden="true">
          <div><i style={{ width: "60%" }} /></div>
          <b>180 000 sur 300 000 FCFA</b>
          <small>Prochain versement dans 3 jours</small>
        </div>
      </article>

      <article className="tile">
        <h3>Ton mois en un coup d'œil.</h3>
        <p>Encaissé, devis envoyés, projets terminés.</p>
        <div className="mock-bars" aria-hidden="true">
          {[30, 55, 40, 70, 50, 90].map((h, i) => <i key={i} style={{ height: h + "%" }} />)}
        </div>
      </article>
    </div>
  );
}
