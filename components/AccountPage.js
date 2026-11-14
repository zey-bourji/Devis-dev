"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { useUser } from "../lib/useUser";
import { formatFCFA } from "../lib/pricing";
import { lastMonths, monthKey, monthStats, totals } from "../lib/stats";

// L'espace "Mon compte" : stats du mois, mot de passe, déconnexion, suppression du compte.
export default function AccountPage() {
  const { user, ready } = useUser();
  const [data, setData] = useState(null);
  const [pwd, setPwd] = useState({ a: "", b: "" });
  const [pwdMsg, setPwdMsg] = useState({ type: "", text: "" });
  const [confirmText, setConfirmText] = useState("");
  const [delMsg, setDelMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("quotes").select("id, status, total, created_at, updated_at, data"),
      supabase.from("projects").select("id, created_at"),
    ]).then(([q, p]) => setData({ quotes: q.data || [], projects: p.data || [] }));
  }, [user]);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  async function changePassword(e) {
    e.preventDefault();
    setPwdMsg({ type: "", text: "" });
    if (pwd.a.length < 6) return setPwdMsg({ type: "error", text: "Le mot de passe doit avoir au moins 6 caractères." });
    if (pwd.a !== pwd.b) return setPwdMsg({ type: "error", text: "Les deux mots de passe ne sont pas les mêmes." });
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pwd.a });
    setBusy(false);
    if (error) return setPwdMsg({ type: "error", text: error.message });
    setPwd({ a: "", b: "" });
    setPwdMsg({ type: "ok", text: "Mot de passe changé." });
  }

  async function deleteAccount() {
    setDelMsg("");
    setBusy(true);
    const { error } = await supabase.functions.invoke("super-responder");
    setBusy(false);
    if (error) return setDelMsg("Suppression impossible pour le moment : " + error.message);
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (!ready) return <p className="muted center">Chargement...</p>;
  if (!user) {
    return (
      <div className="card center-card">
        <h2>Connecte-toi pour voir ton compte</h2>
        <Link href="/connexion/" className="btn">Se connecter</Link>
      </div>
    );
  }

  const now = new Date();
  const months = lastMonths(6, now);
  const perMonth = data ? months.map((m) => ({ ...m, ...monthStats(m.key, data) })) : [];
  const current = perMonth[perMonth.length - 1];
  const max = Math.max(1, ...perMonth.map((m) => m.encaisse));
  const all = data ? totals(data.quotes) : null;
  const monthName = now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  return (
    <>
      <h1 className="page-title">Mon compte</h1>
      <p className="muted">{user.email}</p>

      <section className="card">
        <h2>Ce mois-ci ({monthName})</h2>
        {!data ? <p className="muted">Chargement...</p> : (
          <>
            <div className="stat-grid">
              <div className="stat"><b>{formatFCFA(current.encaisse)}</b><small>encaissé</small></div>
              <div className="stat"><b>{current.devis}</b><small>devis créés</small></div>
              <div className="stat"><b>{current.projets}</b><small>projets créés</small></div>
              <div className="stat"><b>{current.termines}</b><small>projets terminés</small></div>
            </div>
            <h3 className="sub-title">Encaissé sur 6 mois</h3>
            <div className="bars">
              {perMonth.map((m) => (
                <div className="bar-col" key={m.key} title={formatFCFA(m.encaisse)}>
                  <i style={{ height: Math.round((m.encaisse / max) * 80) + "%" }} />
                  <span>{m.label}</span>
                </div>
              ))}
            </div>
            <p className="hint">
              Depuis le début : {formatFCFA(all.encaisse)} encaissés · {formatFCFA(all.reste)} restent à encaisser.
              Les montants comptent les paiements que tu as marqués comme payés, à leur date.
            </p>
          </>
        )}
      </section>

      <section className="card">
        <h2>Changer de mot de passe</h2>
        <form onSubmit={changePassword}>
          <label className="field">Nouveau mot de passe
            <input type="password" autoComplete="new-password" value={pwd.a} onChange={(e) => setPwd({ ...pwd, a: e.target.value })} />
          </label>
          <label className="field">Répète-le
            <input type="password" autoComplete="new-password" value={pwd.b} onChange={(e) => setPwd({ ...pwd, b: e.target.value })} />
          </label>
          {pwdMsg.text && <p className={pwdMsg.type === "error" ? "error" : "success"}>{pwdMsg.text}</p>}
          <button className="btn" disabled={busy}>Changer</button>
        </form>
      </section>

      <section className="card">
        <h2>Déconnexion</h2>
        <button type="button" className="btn btn-outline" onClick={logout}>Me déconnecter</button>
      </section>

      <section className="card danger-zone">
        <h2>Supprimer mon compte</h2>
        <p className="muted">
          Tout est effacé définitivement : projets, devis, preuves de paiement. Impossible de revenir en arrière.
          Pour confirmer, écris <b>SUPPRIMER</b> ci-dessous.
        </p>
        <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="SUPPRIMER" aria-label="Confirmation" />
        {delMsg && <p className="error">{delMsg}</p>}
        <button type="button" className="btn btn-danger" disabled={busy || confirmText.trim().toUpperCase() !== "SUPPRIMER"} onClick={deleteAccount}>
          Supprimer définitivement mon compte
        </button>
      </section>
    </>
  );
}
