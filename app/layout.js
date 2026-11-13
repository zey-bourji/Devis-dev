import "./globals.css";
import SiteHeader from "../components/SiteHeader";

export const metadata = {
  title: "Devis Dev - le générateur de devis des développeurs freelances",
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
