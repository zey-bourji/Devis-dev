"use client";

import { useState } from "react";
import { COLOR_PRESETS } from "../lib/brand";
import { dominantColor, fileToLogo } from "../lib/image";

const TEMPLATES = [
  { id: "classique", label: "Classique" },
  { id: "moderne", label: "Moderne" },
  { id: "minimal", label: "Minimal" },
];

// Une petite vignette dessinée en SVG pour chaque modèle (elle prend la couleur choisie).
function TemplateThumb({ id, color }) {
  return (
    <svg viewBox="0 0 60 80" width="60" height="80" aria-hidden="true">
      <rect x="0.5" y="0.5" width="59" height="79" rx="3" fill="#fff" stroke="#d3d6e0" />
      {id === "moderne" && <rect x="0.5" y="0.5" width="59" height="20" rx="3" fill={color} />}
      {id === "classique" && <rect x="6" y="8" width="22" height="5" rx="1" fill={color} />}
      {id === "minimal" && <><rect x="6" y="8" width="20" height="4" rx="1" fill="#1c1f2a" /><rect x="6" y="17" width="48" height="1.5" fill={color} /></>}
      <rect x="6" y="28" width="48" height={id === "minimal" ? 2 : 6} rx="1" fill={id === "classique" ? color : id === "moderne" ? "#eef0f7" : "#1c1f2a"} />
      <rect x="6" y="40" width="48" height="2" fill="#dfe2ee" />
      <rect x="6" y="48" width="48" height="2" fill="#dfe2ee" />
      <rect x="6" y="56" width="48" height="2" fill="#dfe2ee" />
      <rect x="30" y="64" width="24" height="7" rx={id === "moderne" ? 3 : 1} fill={id === "minimal" ? "none" : color} stroke={id === "minimal" ? color : "none"} />
    </svg>
  );
}

// Le panneau "Personnaliser le devis" : modèle, logo, couleur, acompte, conditions, signature.
export default function BrandingCard({ brand, setBrand }) {
  const [error, setError] = useState("");

  async function onLogo(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    try {
      setBrand({ ...brand, logo: await fileToLogo(file) });
    } catch {
      setError("Cette image n'a pas pu être lue. Essaie un PNG ou un JPG.");
    }
    e.target.value = ""; // permet de re-choisir le même fichier
  }

  // Propose la couleur principale du logo comme couleur du devis.
  async function colorFromLogo() {
    const color = await dominantColor(brand.logo);
    if (color) setBrand({ ...brand, color });
    else setError("Ce logo n'a pas de couleur nette à reprendre (il est noir, blanc ou gris).");
  }

  return (
    <section className="card">
      <h2>Personnaliser le devis</h2>

      <div className="field">
        Modèle
        <div className="templates">
          {TEMPLATES.map((t) => (
            <button
              type="button"
              key={t.id}
              className={"template" + ((brand.template || "classique") === t.id ? " active" : "")}
              onClick={() => setBrand({ ...brand, template: t.id })}
            >
              <TemplateThumb id={t.id} color={brand.color} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="brand-row">
        <div className="logo-preview">
          {brand.logo ? <img src={brand.logo} alt="Ton logo" /> : <span>Logo</span>}
        </div>
        <div className="brand-actions">
          <label className="btn btn-outline btn-small">
            {brand.logo ? "Changer le logo" : "Ajouter mon logo"}
            <input type="file" accept="image/*" onChange={onLogo} hidden />
          </label>
          {brand.logo && (
            <>
              <button type="button" className="link-btn" onClick={colorFromLogo}>Utiliser la couleur de mon logo</button>
              <button type="button" className="link-btn" onClick={() => setBrand({ ...brand, logo: null })}>
                Retirer le logo
              </button>
            </>
          )}
        </div>
      </div>
      {error && <p className="error">{error}</p>}

      <div className="field">
        Couleur du devis
        <div className="swatches">
          {COLOR_PRESETS.map((c) => (
            <button
              type="button"
              key={c}
              className={"swatch" + (brand.color === c ? " active" : "")}
              style={{ background: c }}
              onClick={() => setBrand({ ...brand, color: c })}
              aria-label={`Couleur ${c}`}
            />
          ))}
          <input
            type="color"
            value={brand.color}
            onChange={(e) => setBrand({ ...brand, color: e.target.value })}
            aria-label="Choisir une autre couleur"
          />
        </div>
      </div>

      <label className="check-field">
        <input
          type="checkbox"
          checked={brand.showSignature}
          onChange={(e) => setBrand({ ...brand, showSignature: e.target.checked })}
        />
        Ajouter la case de signature du client
      </label>

      <label className="field">
        Conditions affichées en bas du devis
        <textarea
          rows="3"
          value={brand.conditions}
          onChange={(e) => setBrand({ ...brand, conditions: e.target.value })}
        />
      </label>
    </section>
  );
}
