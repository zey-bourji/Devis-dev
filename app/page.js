"use client";

import { useState } from "react";
import { CATEGORIES, DEFAULT_DAILY_RATE } from "../lib/features";
import { buildQuote, formatFCFA, itemPrice } from "../lib/pricing";
import { addDays, formatDate, makeQuoteNumber } from "../lib/quote";
import { useStoredState } from "../lib/useStoredState";

export default function Home() {
  // Ce que le dev a coché (pas sauvegardé : chaque devis repart de zéro).
  const [selected, setSelected] = useState(new Set());
  // Ces trois-là sont sauvegardés dans le navigateur pour ne pas les retaper.
  const [dailyRate, setDailyRate] = useStoredState("dailyRate", DEFAULT_DAILY_RATE);
  const [dev, setDev] = useStoredState("dev", { name: "", email: "", phone: "" });
  const [validity, setValidity] = useStoredState("validity", 30);
  // Le client change à chaque devis : pas de sauvegarde.
  const [client, setClient] = useState({ name: "", project: "" });
  const [busy, setBusy] = useState(false);

  function toggle(id) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  const quote = buildQuote(CATEGORIES, selected, dailyRate);

  // Génère le PDF dans le navigateur et le télécharge.
  async function downloadPdf() {
    setBusy(true);
    try {
      // Import à la demande : la bibliothèque PDF est lourde, on ne la charge qu'au clic.
      const [{ pdf }, { default: QuotePdf }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("../components/QuotePdf"),
      ]);
      const now = new Date();
      const number = makeQuoteNumber(now);
      const blob = await pdf(
        <QuotePdf
          dev={dev}
          client={client}
          quote={quote}
          number={number}
          dateText={formatDate(now)}
          validUntilText={formatDate(addDays(now, validity))}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${number}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page">
      <header className="header">
        <h1>Devis Dev</h1>
        <p>Coche les fonctionnalités du projet, le prix se calcule tout seul.</p>
      </header>

      <section className="card">
        <h2>Toi</h2>
        <div className="grid">
          <label className="field">
            Ton nom ou ta marque
            <input value={dev.name} onChange={(e) => setDev({ ...dev, name: e.target.value })} />
          </label>
          <label className="field">
            Email
            <input type="email" value={dev.email} onChange={(e) => setDev({ ...dev, email: e.target.value })} />
          </label>
          <label className="field">
            Téléphone
            <input value={dev.phone} onChange={(e) => setDev({ ...dev, phone: e.target.value })} />
          </label>
          <label className="field">
            Taux journalier (FCFA)
            <input
              type="number"
              min="0"
              step="1000"
              value={dailyRate}
              onChange={(e) => setDailyRate(Number(e.target.value) || 0)}
            />
          </label>
        </div>
      </section>

      <section className="card">
        <h2>Le client</h2>
        <div className="grid">
          <label className="field">
            Nom du client
            <input value={client.name} onChange={(e) => setClient({ ...client, name: e.target.value })} />
          </label>
          <label className="field">
            Nom du projet
            <input value={client.project} onChange={(e) => setClient({ ...client, project: e.target.value })} />
          </label>
          <label className="field">
            Validité du devis (jours)
            <input
              type="number"
              min="1"
              value={validity}
              onChange={(e) => setValidity(Number(e.target.value) || 1)}
            />
          </label>
        </div>
      </section>

      {CATEGORIES.map((cat) => (
        <section className="card" key={cat.id}>
          <h2>{cat.label}</h2>
          {cat.items.map((item) => (
            <label className="item" key={item.id}>
              <input type="checkbox" checked={selected.has(item.id)} onChange={() => toggle(item.id)} />
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
          <div className="total-text">
            <small>{quote.lines.length} fonctionnalité(s)</small>
            <strong>{formatFCFA(quote.total)}</strong>
          </div>
          <button onClick={downloadPdf} disabled={quote.lines.length === 0 || busy}>
            {busy ? "Création..." : "Télécharger le devis PDF"}
          </button>
        </div>
      </footer>
    </main>
  );
}
