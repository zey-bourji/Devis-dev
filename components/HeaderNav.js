"use client";

import Link from "next/link";
import { supabase } from "../lib/supabase";
import { useUser } from "../lib/useUser";

// Les liens à droite de la barre du haut : ils changent selon que le visiteur est connecté ou non.
export default function HeaderNav() {
  const { user, ready } = useUser();

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
