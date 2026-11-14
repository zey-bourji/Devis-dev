"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { useUser } from "../lib/useUser";

// Les liens à droite de la barre du haut : ils changent selon que le visiteur est connecté ou non.
export default function HeaderNav() {
  const { user, ready } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);

  // Le lien Admin n'apparaît que pour l'administratrice (la base répond non à tout le monde).
  useEffect(() => {
    if (!user) return setIsAdmin(false);
    supabase.rpc("is_admin").then(({ data }) => setIsAdmin(data === true));
  }, [user]);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (!ready) return <nav />;

  return (
    <nav className="nav">
      {user ? (
        <>
          <Link href="/projets/" className="nav-link">Mes projets</Link>
          <Link href="/devis/" className="btn btn-small">Nouveau devis</Link>
          {isAdmin && <Link href="/admin/" className="nav-link">Admin</Link>}
          <Link href="/compte/" className="nav-link">Mon compte</Link>
          <button type="button" className="link-btn" onClick={logout}>Déconnexion</button>
        </>
      ) : (
        <>
          <Link href="/connexion/" className="nav-link">Connexion</Link>
          <Link href="/devis/" className="btn btn-small">Créer un devis</Link>
        </>
      )}
    </nav>
  );
}
