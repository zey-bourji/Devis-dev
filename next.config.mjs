/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",       // génère un site 100% statique dans le dossier "out"
  trailingSlash: true,    // /page/ -> page/index.html, plus sûr sur un hébergement mutualisé
  images: { unoptimized: true },
};

export default nextConfig;
