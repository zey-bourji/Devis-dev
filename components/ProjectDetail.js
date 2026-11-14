"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { useUser } from "../lib/useUser";
import { formatFCFA } from "../lib/pricing";
import { statusClass } from "../lib/tracking";
import { readAttachment } from "../lib/attachments";

export default function ProjectDetail() {
  const { user, ready } = useUser();
  const [id, setId] = useState(null);
  const [project, setProject] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  // L'identifiant du projet est dans l'adresse : /projet/?id=...
  useEffect(() => {
    setId(new URLSearchParams(window.location.search).get("id"));
  }, []);

  useEffect(() => {
    if (!user || !id) return;
    supabase.from("projects").select("*").eq("id", id).maybeSingle().then(({ data, error }) => {
      if (error) setError("Impossible de charger le projet : " + error.message);
      else if (!data) setError("Projet introuvable.");
      else setProject(data);
    });
    supabase
      .from("quotes")
      .select("id, number, status, total, updated_at")
      .eq("project_id", id)
      .order("updated_at", { ascending: false })
      .then(({ data }) => setQuotes(data || []));
  }, [user, id]);

  const picker = useRef(null);
  const [fileNote, setFileNote] = useState({ text: "", error: false });
  const [reading, setReading] = useState(false);

  // Insère un document (PDF, Word, texte) : son texte est ajouté au cahier des charges du projet.
  async function insertFile(e) {
    const files = [...e.target.files];
    e.target.value = "";
    if (!files.length) return;
    setFileNote({ text: "", error: false });
    setReading(true);
    const notes = [];
    let errorText = "";
    let added = "";
    for (const f of files) {
      try {
        const a = await readAttachment(f, []);
        if (a.kind === "photo") { errorText = "Les photos se joignent dans le chat de Youk, depuis un devis. Ici, insère un PDF, un Word ou un texte."; continue; }
        added += (added ? "\n\n" : "") + a.text;
        notes.push(`« ${a.name} » inséré.` + (a.cut ? " Document long : seul le début est gardé." : ""));
      } catch (err) {
        errorText = err.message || "Fichier illisible.";
      }
    }
    if (added) setProject((p) => ({ ...p, specs: ((p.specs || "").trim() ? p.specs.trim() + "\n\n" : "") + added }));
    setFileNote({ text: errorText || notes.join(" ") + " Pense à enregistrer le projet.", error: !!errorText });
    setReading(false);
  }

  const set = (field) => (e) => setProject({ ...project, [field]: e.target.value });

  async function save() {
    setSaving(true);
    setNotice("");
    const { name, description, client_name, client_contact, github_url, specs } = project;
    const { error } = await supabase
      .from("projects")
      .update({ name, description, client_name, client_contact, github_url, specs })
      .eq("id", id);
    setSaving(false);
    setNotice(error ? "Échec : " + error.message : "Projet enregistré ✓");
  }

  async function remove() {
    if (!window.confirm("Supprimer ce projet ? Ses devis seront conservés mais détachés du projet.")) return;
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) return setError("Suppression impossible : " + error.message);
    window.location.href = "/projets/";
  }

  if (!ready) return <p className="muted center">Chargement...</p>;
  if (!user) {
    return (
      <div className="card center-card">
        <h2>Connecte-toi pour voir ce projet</h2>
        <Link href="/connexion/" className="btn">Se connecter</Link>
      </div>
    );
  }
  if (error) return <p className="error">{error} <Link href="/projets/" className="link-btn">Retour aux projets</Link></p>;
  if (!project) return <p className="muted center">Chargement du projet...</p>;

  return (
    <>
      <Link href="/projets/" className="back">← Mes projets</Link>
      <h1 className="page-title">{project.name || "Projet"}</h1>

      <section className="card">
        <h2>Informations</h2>
        <label className="field">
          Nom du projet
          <input value={project.name} onChange={set("name")} />
        </label>
        <div className="grid">
          <label className="field">
            Client
            <input value={project.client_name} onChange={set("client_name")} />
          </label>
          <label className="field">
            Contact du client (email ou téléphone)
            <input value={project.client_contact} onChange={set("client_contact")} />
          </label>
          <label className="field">
            Lien GitHub
            <input value={project.github_url} onChange={set("github_url")} placeholder="https://github.com/..." />
          </label>
        </div>
        {project.github_url && (
          <p className="muted"><a className="link" href={project.github_url} target="_blank" rel="noopener noreferrer">Ouvrir le dépôt GitHub</a></p>
        )}
        <label className="field">
          Description
          <textarea rows="3" value={project.description} onChange={set("description")} />
        </label>
      </section>

      <section className="card">
        <h2>Cahier des charges</h2>
        <p className="muted">Colle ici le cahier des charges du client. Dans l'éditeur de devis, un bouton le lira pour te suggérer les fonctionnalités à cocher.</p>
        <textarea rows="8" value={project.specs} onChange={set("specs")} />
        <input ref={picker} type="file" hidden multiple accept="image/jpeg,image/png,image/webp,.pdf,.docx,.txt,.md,.csv" onChange={insertFile} />
        <button type="button" className="btn btn-outline btn-small" onClick={() => picker.current?.click()} disabled={reading}>
          {reading ? "Lecture..." : "Insérer un fichier"}
        </button>
        {fileNote.text && <p className={fileNote.error ? "error" : "muted"}>{fileNote.text}</p>}
      </section>

      <div className="actions">
        <button className="btn" onClick={save} disabled={saving}>{saving ? "Enregistrement..." : "Enregistrer le projet"}</button>
        <button className="link-btn danger" onClick={remove}>Supprimer le projet</button>
        {notice && <span className="info">{notice}</span>}
      </div>

      <section className="card">
        <div className="row-between">
          <h2>Devis de ce projet</h2>
          <Link href={`/devis/?project=${id}`} className="btn btn-small">Nouveau devis</Link>
        </div>
        {quotes.length === 0 && <p className="muted">Aucun devis pour l'instant.</p>}
        {quotes.map((q) => (
          <Link href={`/devis/?quote=${q.id}`} className="quote-row" key={q.id}>
            <span>
              <strong>{q.number}</strong>
              <small className="muted"> · {new Date(q.updated_at).toLocaleDateString("fr-FR")}</small>
            </span>
            <span className="quote-row-right">
              <span className={"badge " + statusClass(q.status)}>{q.status}</span>
              <b>{formatFCFA(Number(q.total))}</b>
            </span>
          </Link>
        ))}
      </section>
    </>
  );
}
