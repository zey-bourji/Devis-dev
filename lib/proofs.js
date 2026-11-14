// Les preuves de paiement (capture Wave, reçu, PDF) : stockées dans l'espace privé « proofs » de Supabase.
// Chaque fichier est rangé dans un dossier au nom de son propriétaire : personne d'autre ne peut l'ouvrir
// (voir supabase/schema_suivi.sql).

import { supabase } from "./supabase";
import { compressImage } from "./image";

const MAX_BYTES = 5 * 1024 * 1024; // 5 Mo après compression
const BUCKET = "proofs";

export async function uploadProof({ userId, quoteId, index, file }) {
  const isPdf = file.type === "application/pdf";
  if (!isPdf && !file.type.startsWith("image/")) throw new Error("Choisis une image ou un PDF.");
  const body = isPdf ? file : await compressImage(file);
  if (body.size > MAX_BYTES) throw new Error("Fichier trop lourd (5 Mo maximum).");
  const path = `${userId}/${quoteId}/${index}-${Date.now()}.${isPdf ? "pdf" : "jpg"}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, body, {
    contentType: isPdf ? "application/pdf" : "image/jpeg",
  });
  if (error) throw new Error(error.message);
  return { path, name: file.name.slice(0, 60) };
}

// Lien temporaire (5 minutes) pour ouvrir une preuve.
export async function proofUrl(path) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 300);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

export async function removeProof(path) {
  await supabase.storage.from(BUCKET).remove([path]);
}
