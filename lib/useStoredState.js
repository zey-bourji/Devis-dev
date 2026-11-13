"use client";

import { useEffect, useState } from "react";

// Comme useState, mais la valeur est aussi gardée dans le localStorage du navigateur.
// Résultat : le dev ne retape pas son nom et son taux à chaque devis.
export function useStoredState(key, initialValue) {
  const [value, setValue] = useState(initialValue);
  const [loaded, setLoaded] = useState(false);

  // Au chargement de la page : on relit ce qui était sauvegardé.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) setValue(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, [key]);

  // À chaque changement : on sauvegarde (mais pas avant d'avoir relu l'ancienne valeur).
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, [key, value, loaded]);

  return [value, setValue];
}
