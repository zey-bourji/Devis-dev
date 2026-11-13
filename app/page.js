"use client";

import { useState } from "react";
import { CATEGORIES, DEFAULT_DAILY_RATE } from "../lib/features";
import { buildQuote, formatFCFA, itemPrice } from "../lib/pricing";

export default function Home() {
  // L'état de la page : ce que le dev a coché, et son taux journalier.
  const [selected, setSelected] = useState(new Set());
  const [dailyRate, setDailyRate] = useState(DEFAULT_DAILY_RATE);

  // Coche ou décoche une fonctionnalité.
  function toggle(id) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  // À chaque changement React refait ce calcul, c'est ce qui donne le total "en direct".
  const quote = buildQuote(CATEGORIES, selected, dailyRate);

  return (
    <main className="page">
      <header className="header">
        <h1>Devis Dev</h1>
        <p>Coche les fonctionnalités du projet, le prix se calcule tout seul.</p>
      </header>

      <section className="card">
        <label className="rate">
          Ton taux journalier (FCFA)
          <input
            type="number"
            min="0"
            step="1000"
            value={dailyRate}
            onChange={(e) => setDailyRate(Number(e.target.value) || 0)}
          />
        </label>
      </section>

      {CATEGORIES.map((cat) => (
        <section className="card" key={cat.id}>
          <h2>{cat.label}</h2>
          {cat.items.map((item) => (
            <label className="item" key={item.id}>
              <input
                type="checkbox"
                checked={selected.has(item.id)}
                onChange={() => toggle(item.id)}
              />
              <span className="item-label">
                {item.label}
                {item.type === "days" && <small> {item.days} j</small>}
              </span>
              <span className="item-price">{formatFCFA(itemPrice(item, dailyRate))}</span>
            </label>
          ))}
        </section>
      ))}

      <footer className="total-bar">
        <div>
          <small>{quote.lines.length} fonctionnalité(s)</small>
          <strong>{formatFCFA(quote.total)}</strong>
        </div>
      </footer>
    </main>
  );
}
