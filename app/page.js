import Link from "next/link";
import MiniSim from "../components/MiniSim";

const STEPS = [
  { n: "1", title: "Coche les fonctionnalités", text: "Front-end, back-end, hébergement, nom de domaine, maintenance : choisis ce que contient le projet." },
  { n: "2", title: "Le prix se calcule seul", text: "Tu fixes ton taux journalier une fois. Le total en FCFA se met à jour à chaque clic." },
  { n: "3", title: "Envoie un devis propre", text: "Télécharge le PDF avec ton logo et tes couleurs, puis envoie-le par WhatsApp ou par email." },
];

const FEATURES = [
  { title: "Pensé en FCFA", text: "Des prix à la réalité d'ici : Mobile Money, hébergement, domaine, acompte à la commande." },
  { title: "Un devis à ton image", text: "Ton logo, ta couleur, tes conditions, une note pour justifier chaque prix." },
  { title: "Zéro prise de tête", text: "Pas de tableur, pas de Word à mettre en page. Un devis en moins de deux minutes." },
];

export default function Home() {
  return (
    <main>
      <section className="hero">
        <div className="hero-inner">
          <p className="eyebrow">Fait par une dev, pour les devs</p>
          <h1>Ton devis de développeur, prêt à envoyer en deux minutes.</h1>
          <p className="hero-sub">
            Coche les fonctionnalités du projet. Devis Dev calcule le prix en FCFA et génère un PDF propre à ton nom.
          </p>
          <div className="hero-actions">
            <Link href="/devis/" className="btn btn-light">Créer un devis</Link>
            <a href="#essai" className="btn btn-ghost">Essayer ici</a>
          </div>
        </div>
      </section>

      <section className="section" id="essai">
        <h2 className="section-title">Essaie, sans compte</h2>
        <p className="section-sub">Coche, décoche, regarde le prix bouger.</p>
        <MiniSim />
      </section>

      <section className="section">
        <h2 className="section-title">Comment ça marche</h2>
        <div className="steps">
          {STEPS.map((s) => (
            <div className="step card" key={s.n}>
              <span className="step-n">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="steps">
          {FEATURES.map((f) => (
            <div className="card" key={f.title}>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cta">
        <h2>Prêt à envoyer ton prochain devis ?</h2>
        <Link href="/devis/" className="btn btn-light">Créer un devis</Link>
      </section>

      <footer className="site-footer">
        Projet réalisé pour la Coupe d'Afrique des Développeurs 2026 · Systalink Challenge
      </footer>
    </main>
  );
}
