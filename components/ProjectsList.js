"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { useUser } from "../lib/useUser";
import { formatFCFA } from "../lib/pricing";

// Les filtres de la liste des devis. « Traités » = acceptés ou refusés.
const FILTERS = [
  { id: "tous", label: "Tous" },
  { id: "brouillon", label: "Brouillons", match: ["brouillon"] },
  { id: "envoyé", label: "Envoyés", match: ["envoyé"] },
  { id: "traité", label: "Traités", match: ["accepté", "refusé"] },
];

export default function ProjectsList() {
  const { user, ready } = useUser();
  const [projects, setProjects] = useState(null); // null = en chargement
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", client_name: "", description: "" });
  const [creating, setCreating] = useState(false);
  const [view, setView] = useState("projets"); // "projets" ou "devis"
  const [quotes, setQuotes] = useState(null);
  const [filter, setFilter] = useState("tous");
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
    supabase
      .from("quotes")
      .select("id, number, status, total, updated_at, project_id, data")
      .order("updated_at", { ascending: false })
      .then(({ data }) => setQuotes(data || []));
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
  const allQuotes = quotes || [];
  const count = (f) => (f.match ? allQuotes.filter((q) => f.match.includes(q.status)).length : allQuotes.length);
  const active = FILTERS.find((f) => f.id === filter);
  const shownQuotes = active.match ? allQuotes.filter((q) => active.match.includes(q.status)) : allQuotes;
  const projectName = (id) => list.find((p) => p.id === id)?.name;

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Mes projets</h1>
        <button type="button" className="btn" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Fermer" : "+ Créer un projet"}
        </button>
      </div>
      {error && <p className="error">{error}</p>}

      <div className="tabs" role="tablist">
        <button type="button" role="tab" aria-selected={view === "projets"} className={"tab" + (view === "projets" ? " on" : "")} onClick={() => setView("projets")}>
          Projets <span className="tab-count">{list.length}</span>
        </button>
        <button type="button" role="tab" aria-selected={view === "devis"} className={"tab" + (view === "devis" ? " on" : "")} onClick={() => setView("devis")}>
          Devis <span className="tab-count">{allQuotes.length}</span>
        </button>
      </div>

      {view === "devis" ? (
        <>
          <div className="presets">
            {FILTERS.map((f) => (
              <button type="button" key={f.id} className={"chip" + (filter === f.id ? " chip-on" : "")} onClick={() => setFilter(f.id)}>
                {f.label} ({count(f)})
              </button>
            ))}
          </div>
          {quotes === null && <p className="muted">Chargement de tes devis...</p>}
          {quotes && shownQuotes.length === 0 && (
            <div className="card center-card">
              <p className="muted">
                {allQuotes.length === 0 ? "Tu n'as encore enregistré aucun devis." : "Aucun devis dans cette catégorie."}
              </p>
              {allQuotes.length === 0 && <Link href="/devis/" className="btn">Créer un devis</Link>}
            </div>
          )}
          {shownQuotes.length > 0 && (
            <section className="card">
              {shownQuotes.map((q) => (
                <Link href={`/devis/?quote=${q.id}`} className="quote-row" key={q.id}>
                  <span>
                    <strong>{q.number}</strong>
                    <small className="muted block">
                      {q.data?.client?.name || "Sans client"}
                      {projectName(q.project_id) ? " · " + projectName(q.project_id) : ""}
                      {" · " + new Date(q.updated_at).toLocaleDateString("fr-FR")}
                    </small>
                  </span>
                  <span className="quote-row-right">
                    <span className={"badge status-" + q.status}>{q.status}</span>
                    <b>{formatFCFA(Number(q.total))}</b>
                  </span>
                </Link>
              ))}
            </section>
          )}
        </>
      ) : (
      <>
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
      )}
    </>
  );
}
