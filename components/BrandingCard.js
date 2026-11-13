"use client";

import { useState } from "react";
import { COLOR_PRESETS } from "../lib/brand";
import { fileToLogo } from "../lib/image";

// Le panneau "Personnaliser le devis" : logo, couleur, acompte, conditions, signature.
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

  return (
    <section className="card">
      <h2>Personnaliser le devis</h2>

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
            <button type="button" className="link-btn" onClick={() => setBrand({ ...brand, logo: null })}>
              Retirer
            </button>
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

      <div className="grid">
        <label className="field">
          Acompte à la commande (%)
          <input
            type="number"
            min="0"
            max="100"
            value={brand.depositPercent}
            onChange={(e) => setBrand({ ...brand, depositPercent: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })}
          />
        </label>
        <label className="check-field">
          <input
            type="checkbox"
            checked={brand.showSignature}
            onChange={(e) => setBrand({ ...brand, showSignature: e.target.checked })}
          />
          Ajouter la case de signature du client
        </label>
      </div>

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
