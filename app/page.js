import Link from "next/link";
import QuoteSheet from "../components/QuoteSheet";
import MiniSim from "../components/MiniSim";
import Reveal from "../components/Reveal";
import Bento from "../components/Bento";
import { SITE } from "../lib/site";

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
        <h2 className="section-title">Tout ce qu'il faut, rien de plus.</h2>
        <Bento />
      </section>

      <Reveal>
        <section className="cta">
          <h2>Ton prochain devis part ce soir.</h2>
          <Link href="/devis/" className="btn btn-light">Créer un devis</Link>
        </section>
      </Reveal>
    </main>
  );
}
