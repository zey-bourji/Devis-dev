import Link from "next/link";
import HeaderNav from "./HeaderNav";

// La barre du haut, la même sur toutes les pages.
export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="logo">
          <span className="logo-mark">D</span> Devis Dev
        </Link>
        <HeaderNav />
      </div>
    </header>
  );
}
