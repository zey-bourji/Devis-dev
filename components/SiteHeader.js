import Link from "next/link";

// La barre du haut, la même sur toutes les pages.
export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="logo">
          <span className="logo-mark">D</span> Devis Dev
        </Link>
        <nav>
          <Link href="/devis/" className="btn btn-small">Créer un devis</Link>
        </nav>
      </div>
    </header>
  );
}
