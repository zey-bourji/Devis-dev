import Link from "next/link";
import QuoteSheet from "../components/QuoteSheet";
import MiniSim from "../components/MiniSim";
import Reveal from "../components/Reveal";
import { SITE } from "../lib/site";

const STEPS = [
  { n: "1", title: "Coche les fonctionnalités", text: "Front-end, back-end, hébergement, nom de domaine, maintenance : choisis ce que contient le projet." },
  { n: "2", title: "Le prix se calcule seul", text: "Tu fixes ton taux journalier une fois. Le total en FCFA se met à jour à chaque clic." },
  { n: "3", title: "Envoie un devis propre", text: "Télécharge le PDF avec ton logo et tes couleurs, puis envoie-le par WhatsApp ou par email." },
];

const FEATURES = [
  { icon: "coin", title: "Des prix d'ici", text: "Mobile Money, hébergement, nom de domaine, acompte à la commande : le catalogue part de ce que tu vends vraiment." },
  { icon: "palette", title: "Un devis à ton image", text: "Ton logo, ta couleur, tes modalités de paiement, et une note sous chaque ligne pour expliquer le prix." },
  { icon: "bolt", title: "Rien à mettre en page", text: "Pas de tableur, pas de Word. Tu décris le projet, le devis se remplit." },
];

export default function Home() {
  return (
    <main>
      <section className="hero">
        <div className="hero-grid">
          <div className="hero-text">
            <h1>Un devis propre, en FCFA, en deux minutes.</h1>
            <p className="hero-sub">
              Tu coches ce que contient le projet. {SITE.name} calcule le prix et prépare un PDF à ton nom, prêt à envoyer à ton client.
            </p>
            <div className="hero-actions">
              <Link href="/devis/" className="btn">Créer un devis</Link>
              <a href="#essai" className="btn btn-outline">Essayer sans compte</a>
            </div>
          </div>
          <QuoteSheet />
        </div>
      </section>

      <section className="section" id="essai">
        <Reveal>
          <h2 className="section-title">Essaie tout de suite</h2>
          <p className="section-sub">Pas de compte à créer. Coche une ligne, le total change.</p>
          <MiniSim />
        </Reveal>
      </section>

      <section className="section">
        <Reveal>
          <h2 className="section-title">Comment ça marche</h2>
        </Reveal>
        <div className="steps">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 120}>
              <div className="step card">
                <span className="step-n">{s.n}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="steps">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 120}>
              <div className="card feature">
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <Reveal>
        <section className="cta">
          <h2>Prêt à envoyer ton prochain devis ?</h2>
          <Link href="/devis/" className="btn">Créer un devis</Link>
        </section>
      </Reveal>
    </main>
  );
}
