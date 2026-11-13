"use client";

import { useEffect, useState } from "react";
import { CATEGORIES, DEFAULT_DAILY_RATE } from "../lib/features";
import { buildQuote, formatFCFA, itemPrice } from "../lib/pricing";
import { addDays, formatDate, makeQuoteNumber } from "../lib/quote";
import { useStoredState } from "../lib/useStoredState";
import { DEFAULT_BRAND } from "../lib/brand";
import { mailtoUrl, shareText, whatsappUrl } from "../lib/share";
import BrandingCard from "./BrandingCard";
import Summary from "./Summary";

export default function QuoteEditor() {
  // --- Ce qui change à chaque devis (non sauvegardé) ---
  const [selected, setSelected] = useState(new Set());
  const [notes, setNotes] = useState({});          // { idLigne: "explication du prix" }
  const [customLines, setCustomLines] = useState([]); // lignes ajoutées à la main
  const [discountPercent, setDiscountPercent] = useState(0);
  const [client, setClient] = useState({ name: "", project: "" });
  const [number, setNumber] = useState("");
  const [busy, setBusy] = useState(false);

  // --- Ce qui est sauvegardé dans le navigateur du dev ---
  const [dailyRate, setDailyRate] = useStoredState("dailyRate", DEFAULT_DAILY_RATE);
  const [dev, setDev] = useStoredState("dev", { name: "", email: "", phone: "" });
  const [validity, setValidity] = useStoredState("validity", 30);
  const [storedBrand, setBrand] = useStoredState("brand", DEFAULT_BRAND);
  const brand = { ...DEFAULT_BRAND, ...storedBrand };

  // Le numéro est tiré au sort côté navigateur seulement (sinon le serveur et le navigateur
  // afficheraient deux numéros différents et React se plaindrait).
  useEffect(() => setNumber(makeQuoteNumber()), []);

  function toggle(id) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }
  const setNote = (id, text) => setNotes({ ...notes, [id]: text });

  const addCustom = () => setCustomLines([...customLines, { id: "c" + Date.now(), label: "", price: 0 }]);
  const updateCustom = (id, patch) => setCustomLines(customLines.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const removeCustom = (id) => setCustomLines(customLines.filter((c) => c.id !== id));

  function reset() {
    setSelected(new Set());
    setNotes({});
    setCustomLines([]);
    setDiscountPercent(0);
    setClient({ name: "", project: "" });
    setNumber(makeQuoteNumber());
  }

  const quote = buildQuote(CATEGORIES, selected, dailyRate, { customLines, discountPercent, notes });

  const text = shareText({ dev, client, quote, number });
  const whatsappHref = whatsappUrl(text);
  const mailHref = mailtoUrl(`Devis ${number}${client.project ? " - " + client.project : ""}`, text);

  // Génère le PDF dans le navigateur et le télécharge.
  async function downloadPdf() {
    setBusy(true);
    try {
      // Import à la demande : la bibliothèque PDF est lourde, on ne la charge qu'au clic.
      const [{ pdf }, { default: QuotePdf }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./QuotePdf"),
      ]);
      const now = new Date();
      const blob = await pdf(
        <QuotePdf
          dev={dev}
          client={client}
          quote={quote}
          number={number}
          brand={brand}
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
    <div className="editor">
      <div className="editor-main">
        <h1 className="page-title">Nouveau devis</h1>

        <section className="card">
          <h2>Toi</h2>
          <div className="grid">
            <label className="field">
              Ton nom ou celui de ta structure
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
              <div className="item-wrap" key={item.id}>
                <label className="item">
                  <input type="checkbox" checked={selected.has(item.id)} onChange={() => toggle(item.id)} />
                  <span className="item-label">
                    {item.label}
                    {item.type === "days" && <small> {item.days} j</small>}
                  </span>
                  <span className="item-price">{formatFCFA(itemPrice(item, dailyRate))}</span>
                </label>
                {selected.has(item.id) && (
                  <input
                    className="note-input"
                    placeholder="Note pour le client (optionnel)"
                    value={notes[item.id] || ""}
                    onChange={(e) => setNote(item.id, e.target.value)}
                  />
                )}
              </div>
            ))}
          </section>
        ))}

        <section className="card">
          <h2>Lignes personnalisées</h2>
          {customLines.length === 0 && <p className="muted">Une prestation qui n'est pas dans la liste ? Ajoute-la ici.</p>}
          {customLines.map((c) => (
            <div className="item-wrap" key={c.id}>
              <div className="custom-row">
                <input
                  placeholder="Nom de la prestation"
                  value={c.label}
                  onChange={(e) => updateCustom(c.id, { label: e.target.value })}
                />
                <input
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="Prix (FCFA)"
                  value={c.price || ""}
                  onChange={(e) => updateCustom(c.id, { price: Number(e.target.value) || 0 })}
                />
                <button type="button" className="icon-btn" onClick={() => removeCustom(c.id)} aria-label="Supprimer la ligne">
                  ×
                </button>
              </div>
              <input
                className="note-input"
                placeholder="Note pour le client (optionnel)"
                value={notes[c.id] || ""}
                onChange={(e) => setNote(c.id, e.target.value)}
              />
            </div>
          ))}
          <button type="button" className="btn btn-outline btn-small" onClick={addCustom}>
            + Ajouter une ligne
          </button>
        </section>

        <section className="card">
          <h2>Remise</h2>
          <label className="field">
            Remise commerciale (%)
            <input
              type="number"
              min="0"
              max="100"
              value={discountPercent || ""}
              placeholder="0"
              onChange={(e) => setDiscountPercent(Number(e.target.value) || 0)}
            />
          </label>
        </section>

        <BrandingCard brand={brand} setBrand={setBrand} />
      </div>

      <div className="editor-side">
        <Summary
          quote={quote}
          number={number}
          busy={busy}
          onPdf={downloadPdf}
          whatsappHref={whatsappHref}
          mailHref={mailHref}
          onReset={reset}
        />
      </div>

      <div className="total-bar">
        <div>
          <small>{quote.lines.length} ligne(s)</small>
          <strong>{formatFCFA(quote.total)}</strong>
        </div>
        <button className="btn" onClick={downloadPdf} disabled={quote.lines.length === 0 || busy}>
          {busy ? "Création..." : "PDF"}
        </button>
      </div>
    </div>
  );
}
