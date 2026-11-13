import "./globals.css";
import SiteHeader from "../components/SiteHeader";
import { SITE } from "../lib/site";

export const metadata = {
  title: `${SITE.name} - le générateur de devis des développeurs freelances`,
  description: "Coche les fonctionnalités, obtiens un prix en FCFA et un devis PDF à ton image, prêt à envoyer.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
