import "./globals.css";

export const metadata = {
  title: "Devis Dev - générateur de devis pour freelances développeurs",
  description: "Coche les fonctionnalités, obtiens un prix en FCFA et un devis PDF prêt à envoyer.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
