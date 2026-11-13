import { formatFCFA } from "./pricing";

// Texte résumé du devis, pour WhatsApp ou email.
// Le PDF ne peut pas être joint automatiquement : le dev le télécharge puis l'ajoute au message.
export function shareText({ dev, client, quote, number }) {
  const lines = quote.lines.map((l) => `- ${l.label} : ${formatFCFA(l.price)}`).join("\n");
  const who = client.name ? `Bonjour ${client.name},` : "Bonjour,";
  const project = client.project ? ` pour « ${client.project} »` : "";
  return (
    `${who}\n\nVoici mon devis ${number}${project}.\n\n${lines}\n\n` +
    `Total : ${formatFCFA(quote.total)}\n\nLe PDF détaillé est en pièce jointe.` +
    (dev.name ? `\n\n${dev.name}` : "")
  );
}

export function whatsappUrl(text) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function mailtoUrl(subject, body) {
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
