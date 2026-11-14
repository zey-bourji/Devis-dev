"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { useUser } from "../lib/useUser";

const KINDS = { hors_sujet: "Hors sujet", inapproprie: "Inapproprié", dangereux: "Dangereux", injection: "Contournement" };

// Le tableau de bord de l'administratrice. Les chiffres viennent de fonctions Supabase qui refusent tout autre compte.
export default function AdminPage() {
  const { user, ready } = useUser();
  const [state, setState] = useState("loading"); // loading | denied | ok
  const [stats, setStats] = useState(null);
  const [flags, setFlags] = useState([]);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const admin = await supabase.rpc("is_admin");
    if (admin.error || admin.data !== true) return setState("denied");
    const [s, f] = await Promise.all([supabase.rpc("admin_stats"), supabase.rpc("admin_flags")]);
    if (s.error) return setMsg(s.error.message);
    setStats(s.data);
    setFlags(f.data || []);
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

  return (
    <>
      <h1 className="page-title">Admin</h1>

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
    </>
  );
}
