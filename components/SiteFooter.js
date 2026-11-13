import Link from "next/link";
import { SITE } from "../lib/site";

// Le pied de page, le même sur toutes les pages.
export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="logo">
            <span className="logo-mark">{SITE.initial}</span> {SITE.name}
          </span>
          <p>Le générateur de devis des développeurs freelances, pensé en FCFA.</p>
        </div>
        <div className="footer-links">
          <Link href="/devis/">Créer un devis</Link>
          <Link href="/projets/">Mes projets</Link>
          <Link href="/connexion/">Connexion</Link>
          <Link href="/confidentialite/">Confidentialité</Link>
          <Link href="/conditions/">Conditions d'utilisation</Link>
        </div>
      </div>
      <p className="footer-note">
        Fait à Abidjan · Projet réalisé pour la Coupe d'Afrique des Développeurs 2026 · Systalink Challenge
      </p>
    </footer>
  );
}
