// Les pièces jointes du chat : on lit tout dans le navigateur, puis on envoie à l'IA seulement du texte et des photos réduites.
// Les documents (PDF, Word, texte) sont transformés en texte ici ; les photos sont réduites pour rester légères.

export const LIMITS = {
  files: 3,           // documents par conversation
  photos: 5,          // photos par conversation
  fileMB: 8,          // taille maximale d'un fichier
  textChars: 12000,   // texte gardé par document
  messages: 60,       // messages par conversation, vous deux compris
};

const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function kindOf(file) {
  if (PHOTO_TYPES.includes(file.type)) return "photo";
  const name = file.name.toLowerCase();
  if (/\.(pdf|docx|txt|md|csv)$/.test(name)) return "file";
  return null;
}

function photoToDataUrl(file, max = 1280) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };
      img.onerror = () => reject(new Error("Photo illisible."));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error("Lecture impossible."));
    reader.readAsDataURL(file);
  });
}

async function pdfToText(file) {
  const pdfjs = await import("pdfjs-dist/build/pdf.min.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const parts = [];
  for (let i = 1; i <= Math.min(doc.numPages, 30); i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    parts.push(content.items.map((it) => it.str).join(" "));
  }
  return parts.join("\n");
}

async function docxToText(file) {
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const xml = await zip.file("word/document.xml")?.async("string");
  if (!xml) throw new Error("Ce fichier Word est illisible.");
  return xml
    .replace(/<\/w:p>/g, "\n")
    .replace(/<w:tab\/>/g, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'");
}

// Lit un fichier choisi. Renvoie { kind, name, dataUrl } pour une photo, { kind, name, text } pour un document.
// Lève une erreur avec un message clair si le fichier n'est pas accepté.
export async function readAttachment(file, current = []) {
  const kind = kindOf(file);
  if (!kind) throw new Error("Format non accepté. Envoie une photo (JPG, PNG, WebP), un PDF, un fichier Word ou un texte.");
  if (file.size > LIMITS.fileMB * 1024 * 1024) throw new Error(`« ${file.name} » dépasse ${LIMITS.fileMB} Mo.`);
  const used = current.filter((a) => a.kind === kind).length;
  const max = kind === "photo" ? LIMITS.photos : LIMITS.files;
  if (used >= max) throw new Error(kind === "photo" ? `Tu peux joindre ${LIMITS.photos} photos au maximum par conversation.` : `Tu peux joindre ${LIMITS.files} documents au maximum par conversation.`);

  if (kind === "photo") return { kind, name: file.name, dataUrl: await photoToDataUrl(file) };

  const lower = file.name.toLowerCase();
  let text = lower.endsWith(".pdf") ? await pdfToText(file) : lower.endsWith(".docx") ? await docxToText(file) : await file.text();
  text = text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  if (text.length < 40) throw new Error(`« ${file.name} » ne contient pas de texte lisible (PDF scanné ?). Envoie plutôt des photos des pages.`);
  return { kind, name: file.name, text: text.slice(0, LIMITS.textChars), cut: text.length > LIMITS.textChars };
}
