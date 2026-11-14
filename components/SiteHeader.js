import LogoMark from "./LogoMark";
import Link from "next/link";
import HeaderNav from "./HeaderNav";
import { SITE } from "../lib/site";

// La barre du haut, la même sur toutes les pages.
export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="logo">
          <LogoMark /> {SITE.name}
        </Link>
        <HeaderNav />
      </div>
    </header>
  );
}
