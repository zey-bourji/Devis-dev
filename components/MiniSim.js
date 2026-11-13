"use client";

import { useState } from "react";
import Link from "next/link";
import { CATEGORIES, DEFAULT_DAILY_RATE } from "../lib/features";
import { buildQuote, formatFCFA, itemPrice } from "../lib/pricing";

// Le petit simulateur de la page d'accueil : un visiteur essaie sans compte, sans rien taper.
const DEMO_IDS = ["vitrine", "auth", "paiement", "hebergement", "domaine"];
const ALL_ITEMS = CATEGORIES.flatMap((c) => c.items);
const DEMO_ITEMS = DEMO_IDS.map((id) => ALL_ITEMS.find((i) => i.id === id));

export default function MiniSim() {
  const [selected, setSelected] = useState(new Set(["vitrine", "hebergement", "domaine"]));
  const quote = buildQuote(CATEGORIES, selected, DEFAULT_DAILY_RATE);

  function toggle(id) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  return (
    <div className="mini card">
      {DEMO_ITEMS.map((item) => (
        <label className="item" key={item.id}>
          <input type="checkbox" checked={selected.has(item.id)} onChange={() => toggle(item.id)} />
          <span className="item-label">{item.label}</span>
          <span className="item-price">{formatFCFA(itemPrice(item, DEFAULT_DAILY_RATE))}</span>
        </label>
      ))}
      <div className="mini-total">
        <span>Total estimé</span>
        <strong>{formatFCFA(quote.total)}</strong>
      </div>
      <Link href="/devis/" className="btn btn-block">Créer mon devis complet</Link>
    </div>
  );
}
