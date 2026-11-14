// Le logo : un Y blanc sur carré bleu, avec une petite pièce dorée (le FCFA).
export default function LogoMark({ size = 28 }) {
  return (
    <svg className="logo-svg" width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <rect width="100" height="100" rx="24" fill="#1b3fa8" />
      <path d="M25 22 L50 52 L75 22" fill="none" stroke="#fff" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M50 52 V80" fill="none" stroke="#fff" strokeWidth="11" strokeLinecap="round" />
      <circle cx="79" cy="80" r="10" fill="#f2a91b" />
    </svg>
  );
}
