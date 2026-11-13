"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";

// Dit qui est connecté. `ready` passe à true quand Supabase a fini de vérifier la session
// (avant ça, on ne sait pas encore si le visiteur est connecté ou non).
export function useUser() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setReady(true);
    });
    // Se met à jour tout seul à la connexion et à la déconnexion.
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return { user, ready };
}
