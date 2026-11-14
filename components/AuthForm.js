"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "../lib/supabase";

// Traduit les erreurs de Supabase en phrases claires.
function friendly(message) {
  const m = (message || "").toLowerCase();
  if (m.includes("invalid login")) return "Email ou mot de passe incorrect.";
  if (m.includes("already registered")) return "Cet email a déjà un compte. Connecte-toi.";
  if (m.includes("password should be")) return "Le mot de passe doit avoir au moins 6 caractères.";
  if (m.includes("rate limit")) return "Trop d'essais, réessaie dans quelques minutes.";
  if (m.includes("failed to fetch")) return "Impossible de joindre le serveur. Vérifie ta connexion.";
  return message || "Une erreur est survenue.";
}

const COUNTRIES = [
  "Côte d'Ivoire", "Sénégal", "Mali", "Burkina Faso", "Bénin", "Togo", "Niger", "Guinée", "Ghana", "Nigeria",
  "Cameroun", "Gabon", "Congo", "RD Congo", "Maroc", "Algérie", "Tunisie", "Madagascar",
  "France", "Belgique", "Canada", "Autre",
];

export default function AuthForm() {
  const [mode, setMode] = useState("login"); // "login" ou "signup"
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setInfo("");
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name, country } },
        });
        if (error) throw error;
        // Si la confirmation par email est activée, il n'y a pas encore de session.
        if (!data.session) {
          setInfo("Compte créé. Vérifie ta boîte mail pour confirmer ton adresse, puis connecte-toi.");
          setMode("login");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      window.location.href = "/projets/";
    } catch (err) {
      setError(friendly(err.message));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth card">
      <h1>{mode === "login" ? "Connexion" : "Créer un compte"}</h1>
      <p className="muted">
        {mode === "login"
          ? "Retrouve tes projets et tes devis."
          : "Gratuit. Tes projets et tes devis te suivent sur tous tes appareils."}
      </p>

      <form onSubmit={submit}>
        {mode === "signup" && (
          <label className="field">
            Ton prénom ou ta marque
            <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </label>
        )}
        {mode === "signup" && (
          <label className="field">
            Ton pays (facultatif)
            <select value={country} onChange={(e) => setCountry(e.target.value)} autoComplete="country-name">
              <option value="">Je préfère ne pas le dire</option>
              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
        )}
        <label className="field">
          Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </label>
        <label className="field">
          Mot de passe
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </label>

        {mode === "signup" && (
          <label className="check-field">
            <input type="checkbox" required checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
            <span>
              J'ai lu et j'accepte la <Link href="/confidentialite/">politique de confidentialité</Link> et les{" "}
              <Link href="/conditions/">conditions d'utilisation</Link>.
            </span>
          </label>
        )}

        {error && <p className="error">{error}</p>}
        {info && <p className="info">{info}</p>}

        <button className="btn btn-block" disabled={busy}>
          {busy ? "Un instant..." : mode === "login" ? "Se connecter" : "Créer mon compte"}
        </button>
      </form>

      <p className="auth-switch">
        {mode === "login" ? "Pas encore de compte ?" : "Déjà un compte ?"}{" "}
        <button
          type="button"
          className="link-btn"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError("");
            setInfo("");
          }}
        >
          {mode === "login" ? "Créer un compte" : "Se connecter"}
        </button>
      </p>
    </div>
  );
}
