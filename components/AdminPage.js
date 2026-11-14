"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { useUser } from "../lib/useUser";

const KINDS = { hors_sujet: "Hors sujet", inapproprie: "Inapproprié", dangereux: "Dangereux", injection: "Contournement" };

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("fr-FR") : "-");
const fmtTime = (d) => (d ? new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "");

function downloadCsv(users) {
  const q = (v) => '"' + String(v ?? "").replace(/"/g, '""') + '"';
  const rows = [["Nom", "Email", "Pays", "Inscrit le", "Heure", "Dernière connexion", "Devis"]].concat(
    users.map((u) => [u.name, u.email, u.country, fmtDate(u.created_at), fmtTime(u.created_at), fmtDate(u.last_sign_in_at), u.quotes])
  );
  const blob = new Blob(["\ufeff" + rows.map((r) => r.map(q).join(";")).join("\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "inscrits-youquote.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

// Le tableau de bord de l'administratrice. Les chiffres viennent de fonctions Supabase qui refusent tout autre compte.
export default function AdminPage() {
  const { user, ready } = useUser();
  const [state, setState] = useState("loading"); // loading | denied | ok
  const [stats, setStats] = useState(null);
  const [flags, setFlags] = useState([]);
  const [msg, setMsg] = useState("");
  const [users, setUsers] = useState([]);
  const [section, setSection] = useState("apercu");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    const admin = await supabase.rpc("is_admin");
    if (admin.error || admin.data !== true) return setState("denied");
    const [s, f, u] = await Promise.all([supabase.rpc("admin_stats"), supabase.rpc("admin_flags"), supabase.rpc("admin_users")]);
    if (s.error) return setMsg(s.error.message);
    setStats(s.data);
    setFlags(f.data || []);
    setUsers(u.error ? null : u.data || []); // null = la fonction SQL n'est pas encore installée
    setState("ok");
  }, []);

  useEffect(() => {
    if (ready && user) load();
    if (ready && !user) setState("denied");
  }, [ready, user, load]);

  async function ban(userId, hours) {
    const { error } = await supabase.rpc("admin_ban", { target: userId, hours });
    setMsg(error ? error.message : hours ? "Banni pour 24 h." : "Banni définitivement.");
    load();
  }
  async function unban(userId) {
    const { error } = await supabase.rpc("admin_unban", { target: userId });
    setMsg(error ? error.message : "Accès rétabli.");
    load();
  }

  if (state === "loading") return <p className="muted center">Chargement...</p>;
  if (state === "denied") {
    return (
      <div className="card center-card">
        <h2>Page réservée</h2>
        <p className="muted">Cette page n'est ouverte qu'à l'administratrice du site.</p>
        <Link href="/" className="btn">Retour à l'accueil</Link>
      </div>
    );
  }

  const max = Math.max(1, ...stats.signups.map((d) => d.n));
  const statuses = Object.entries(stats.by_status || {}).sort((a, b) => b[1] - a[1]);

  const NAV = [
    ["apercu", "Vue d'ensemble"],
    ["inscrits", "Inscrits"],
    ["ia", "Assistant IA"],
    ["visites", "Visites"],
  ];
  const q = search.trim().toLowerCase();
  const shown = (users || []).filter((u) => !q || [u.name, u.email, u.country].some((v) => (v || "").toLowerCase().includes(q)));
  const countries = Object.entries((users || []).reduce((acc, u) => { const c = u.country || "Non précisé"; acc[c] = (acc[c] || 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]);

  return (
    <>
      <div className="admin-layout">
        <h1 className="page-title admin-title">Admin</h1>
        <nav className="admin-nav" aria-label="Sections de l'admin">
          {NAV.map(([id, label]) => (
            <button key={id} type="button" className={section === id ? "on" : ""} onClick={() => setSection(id)}>{label}</button>
          ))}
        </nav>
        <div className="admin-main">
          {section === "apercu" && (
            <>
      <section className="card">
        <h2>Utilisateurs</h2>
        <div className="stat-grid">
          <div className="stat"><b>{stats.users}</b><small>inscrits</small></div>
          <div className="stat"><b>{stats.active_7d}</b><small>connectés cette semaine</small></div>
          <div className="stat"><b>{stats.new_7d}</b><small>nouveaux (7 jours)</small></div>
          <div className="stat"><b>{stats.new_30d}</b><small>nouveaux (30 jours)</small></div>
        </div>
        <h3 className="sub-title">Inscriptions sur 14 jours</h3>
        <div className="bars">
          {stats.signups.map((d) => (
            <div className="bar-col" key={d.day} title={`${d.day} : ${d.n}`}>
              <i style={{ height: Math.round((d.n / max) * 80) + "%" }} />
              <span>{d.day.slice(8)}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="card">
        <h2>Contenu</h2>
        <div className="stat-grid">
          <div className="stat"><b>{stats.projects}</b><small>projets</small></div>
          <div className="stat"><b>{stats.quotes}</b><small>devis</small></div>
        </div>
        {statuses.length > 0 && (
          <ul className="plan-preview">
            {statuses.map(([k, n]) => (
              <li key={k}><span>{k}</span><b>{n}</b></li>
            ))}
          </ul>
        )}
      </section>
            </>
          )}

          {section === "inscrits" && (
            <section className="card">
              <h2>Inscrits</h2>
              {users === null ? (
                <p className="error">La liste n'est pas encore installée. Dans Supabase, ouvre le SQL Editor et lance de nouveau le fichier schema_admin.sql (la fin du fichier ajoute la liste).</p>
              ) : (
                <>
                  <div className="admin-tools">
                    <input type="search" placeholder="Chercher un nom, un email, un pays" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Chercher un inscrit" />
                    <button type="button" className="btn btn-outline btn-small" onClick={() => downloadCsv(shown)}>Télécharger (CSV)</button>
                  </div>
                  <p className="muted">{shown.length} inscrit(s). Le pays n'apparaît que si la personne l'a choisi à l'inscription.</p>
                  <div className="table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr><th>Nom</th><th>Email</th><th>Pays</th><th>Inscrit le</th><th>Dernière connexion</th><th>Devis</th></tr>
                      </thead>
                      <tbody>
                        {shown.map((u) => (
                          <tr key={u.id}>
                            <td>{u.name || "-"}</td>
                            <td>{u.email}</td>
                            <td>{u.country || "-"}</td>
                            <td>{fmtDate(u.created_at)} <small className="muted">{fmtTime(u.created_at)}</small></td>
                            <td>{fmtDate(u.last_sign_in_at)} <small className="muted">{fmtTime(u.last_sign_in_at)}</small></td>
                            <td>{u.quotes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {countries.length > 0 && (
                    <>
                      <h3 className="sub-title">Inscrits par pays</h3>
                      <ul className="plan-preview">
                        {countries.map(([c, n]) => (
                          <li key={c}><span>{c}</span><b>{n}</b></li>
                        ))}
                      </ul>
                    </>
                  )}
                </>
              )}
            </section>
          )}

          {section === "ia" && (
      <section className="card">
        <h2>Assistant IA : demandes signalées</h2>
        <p className="muted">{stats.flags_24h} en 24 h, {stats.flags_total} au total, {stats.bans_active} accès suspendus.</p>
        {msg && <p className="info">{msg}</p>}
        {flags.length === 0 ? (
          <p className="muted">Aucune demande signalée.</p>
        ) : (
          flags.map((f) => (
            <div className="flag-row" key={f.id}>
              <div>
                <strong>{f.email}</strong> <span className="badge">{KINDS[f.kind] || f.kind}</span>
                <small className="muted block">{new Date(f.created_at).toLocaleString("fr-FR")} : « {f.excerpt} »</small>
              </div>
              <div className="flag-actions">
                {f.banned ? (
                  <button type="button" className="btn btn-outline btn-small" onClick={() => unban(f.user_id)}>Rétablir</button>
                ) : (
                  <>
                    <button type="button" className="btn btn-outline btn-small" onClick={() => ban(f.user_id, 24)}>Bannir 24 h</button>
                    <button type="button" className="btn btn-outline btn-small danger" onClick={() => ban(f.user_id, null)}>Définitif</button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </section>
          )}

          {section === "visites" && (
            <section className="card">
              <h2>Visites par pays</h2>
              <p className="muted">
                Youquote ne suit pas ses visiteurs : aucun cookie de suivi, aucune adresse IP gardée. Les visites par pays se lisent
                dans Cloudflare, qui les compte sans cookie.
              </p>
              <p>Dans Cloudflare : Workers et Pages, ton projet, onglet « Metrics » ou « Analytics ». Si tu vois « Web Analytics », active-le : la carte et la liste des pays s'y affichent.</p>
              <a className="btn btn-outline" href="https://dash.cloudflare.com/" target="_blank" rel="noreferrer">Ouvrir Cloudflare</a>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
