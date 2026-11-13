"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { useUser } from "../lib/useUser";

export default function ProjectsList() {
  const { user, ready } = useUser();
  const [projects, setProjects] = useState(null); // null = en chargement
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", client_name: "", description: "" });
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false); // le formulaire s'ouvre seulement au clic

  // Charge les projets de la personne connectée (les règles RLS ne renvoient que les siens).
  useEffect(() => {
    if (!user) return;
    supabase
      .from("projects")
      .select("*, quotes(count)")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) setError("Impossible de charger tes projets : " + error.message);
        else setProjects(data);
      });
  }, [user]);

  async function createProject(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setCreating(true);
    setError("");
    const { data, error } = await supabase.from("projects").insert(form).select("id").single();
    setCreating(false);
    if (error) return setError("Création impossible : " + error.message);
    window.location.href = `/projet/?id=${data.id}`;
  }

  if (!ready) return <p className="muted center">Chargement...</p>;

  if (!user) {
    return (
      <div className="card center-card">
        <h2>Connecte-toi pour voir tes projets</h2>
        <p className="muted">Tes projets et tes devis sont enregistrés dans ton compte.</p>
        <Link href="/connexion/" className="btn">Se connecter</Link>
      </div>
    );
  }

  const list = projects || [];

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Mes projets</h1>
        <button type="button" className="btn" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Fermer" : "+ Créer un projet"}
        </button>
      </div>
      {error && <p className="error">{error}</p>}

      {showForm && (
        <section className="card new-project">
          <h2>Nouveau projet</h2>
          <form onSubmit={createProject}>
            <div className="grid">
              <label className="field">
                Nom du projet
                <input autoFocus required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </label>
              <label className="field">
                Client
                <input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} />
              </label>
            </div>
            <label className="field">
              Description (optionnel)
              <textarea rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </label>
            <div className="form-actions">
              <button className="btn" disabled={creating || !form.name.trim()}>
                {creating ? "Création..." : "Créer le projet"}
              </button>
              <button type="button" className="btn btn-light" onClick={() => setShowForm(false)}>Annuler</button>
            </div>
          </form>
        </section>
      )}

      {projects === null && !error && <p className="muted">Chargement de tes projets...</p>}

      {projects && list.length === 0 && !showForm && (
        <div className="card center-card empty-state">
          <div className="empty-icon" aria-hidden="true">📁</div>
          <h2>Aucun projet pour le moment</h2>
          <p className="muted">Crée ton premier projet pour y ranger tes devis, le cahier des charges et les infos de ton client.</p>
          <button type="button" className="btn" onClick={() => setShowForm(true)}>Créer mon premier projet</button>
        </div>
      )}

      {list.map((p) => (
        <Link href={`/projet/?id=${p.id}`} className="card project-card" key={p.id}>
          <div>
            <strong>{p.name}</strong>
            <span className="muted">{p.client_name || "Sans client"}</span>
          </div>
          <span className="badge">{p.quotes?.[0]?.count ?? 0} devis</span>
        </Link>
      ))}
    </>
  );
}
