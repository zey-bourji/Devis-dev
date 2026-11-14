"use client";

import { useState } from "react";
import { formatFCFA } from "../lib/pricing";
import { paymentSummary } from "../lib/payments";
import { daysUntil, describeDays, dueDateFor } from "../lib/schedule";
import { proofUrl, removeProof, uploadProof } from "../lib/proofs";

const today = () => new Date().toISOString().slice(0, 10);
const newId = () => "r" + Date.now() + Math.floor(Math.random() * 1000);

// Le suivi du devis : paiements reçus (saisis librement, avec preuve), dates, report ou annulation.
// Les montants reçus se déduisent des échéances dans l'ordre : une échéance peut être payée en plusieurs fois.
export default function TrackingCard({ user, quoteId, status, total, allocation, receipts, setReceipts, dates, setDates, cancelReason, setCancelReason }) {
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [amount, setAmount] = useState("");
  const [when, setWhen] = useState(today());
  const [note, setNote] = useState("");
  const { rows, received, extra } = allocation;
  const { remaining, percent } = paymentSummary(received, total);

  function addReceipt(value, text = note) {
    const n = Math.round(Number(String(value).replace(/\s/g, "").replace(",", ".")));
    if (!Number.isFinite(n) || n <= 0) return setError("Écris un montant en FCFA, par exemple 50 000.");
    setError("");
    setReceipts([...receipts, { id: newId(), amount: n, date: when || today(), note: text.trim(), proof: null }]);
    setAmount("");
    setNote("");
  }

  const setReceipt = (id, patch) => setReceipts(receipts.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  async function dropReceipt(r) {
    if (!window.confirm("Retirer ce paiement" + (r.proof ? " et sa preuve" : "") + " ?")) return;
    if (r.proof) await removeProof(r.proof.path).catch(() => {});
    setReceipts(receipts.filter((x) => x.id !== r.id));
  }

  async function addProof(r, file) {
    if (!file) return;
    setError("");
    setBusyId(r.id);
    try {
      const proof = await uploadProof({ userId: user.id, quoteId, index: r.id, file });
      setReceipt(r.id, { proof });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function openProof(path) {
    setError("");
    try {
      window.open(await proofUrl(path), "_blank", "noopener");
    } catch (e) {
      setError("Impossible d'ouvrir la preuve : " + e.message);
    }
  }

  async function dropProof(r) {
    if (!window.confirm("Supprimer cette preuve ?")) return;
    await removeProof(r.proof.path).catch(() => {});
    setReceipt(r.id, { proof: null });
  }

  return (
    <section className="card tracking">
      <h2>Suivi du projet</h2>

      {rows.length === 0 ? (
        <p className="muted">Coche des lignes pour voir les paiements à suivre.</p>
      ) : (
        <>
          <div className="pay-summary">
            <span>Encaissé <b>{formatFCFA(received)}</b></span>
            <span>Reste <b>{formatFCFA(remaining)}</b></span>
          </div>
          <div className="progress" role="progressbar" aria-valuenow={percent} aria-valuemin="0" aria-valuemax="100">
            <i style={{ width: percent + "%" }} />
          </div>

          {rows.map((p, i) => {
            const due = dueDateFor(p, dates);
            const days = due ? daysUntil(due) : null;
            const open = p.state !== "payé";
            return (
              <div className={"pay-row" + (p.state === "payé" ? " is-paid" : "")} key={i}>
                <div className="pay-main">
                  <span>{p.label}</span>
                  <b>{formatFCFA(p.amount)}</b>
                </div>
                {p.state === "payé" && <small className="muted">✓ Payé en entier</small>}
                {p.state === "partiel" && <small className="muted">Reçu {formatFCFA(p.paid)} · il reste <b>{formatFCFA(p.remaining)}</b></small>}
                {open && due && (
                  <small className={"due" + (days < 0 ? " late" : days <= 7 ? " soon" : "")}>
                    À encaisser le {due.toLocaleDateString("fr-FR")} · {describeDays(days)}
                  </small>
                )}
              </div>
            );
          })}
          {extra > 0 && <p className="hint">Tu as reçu {formatFCFA(extra)} de plus que le total prévu.</p>}

          <h3 className="sub-title">Paiements reçus</h3>
          {receipts.length === 0 && <p className="muted">Rien encore. Quand le client te paie, écris le montant ci-dessous : il se déduit des échéances dans l'ordre.</p>}
          {receipts.map((r) => (
            <div className="receipt" key={r.id}>
              <div className="pay-main">
                <span>{r.note || "Paiement reçu"}</span>
                <b>{formatFCFA(r.amount)}</b>
              </div>
              <div className="pay-actions">
                <input type="date" aria-label="Date du paiement" value={r.date} onChange={(e) => setReceipt(r.id, { date: e.target.value })} />
                {r.proof ? (
                  <span className="proof">
                    <button type="button" className="link-btn" onClick={() => openProof(r.proof.path)}>📎 {r.proof.name}</button>
                    <button type="button" className="link-btn danger" onClick={() => dropProof(r)}>retirer</button>
                  </span>
                ) : quoteId ? (
                  <label className="btn btn-outline btn-small">
                    {busyId === r.id ? "Envoi..." : "Ajouter une preuve"}
                    <input type="file" accept="image/*,application/pdf" hidden disabled={busyId === r.id} onChange={(e) => { addProof(r, e.target.files[0]); e.target.value = ""; }} />
                  </label>
                ) : (
                  <small className="muted">Enregistre le devis pour joindre une preuve.</small>
                )}
                <button type="button" className="link-btn danger" onClick={() => dropReceipt(r)}>Retirer</button>
              </div>
            </div>
          ))}

          <div className="receipt-form">
            <label className="field">
              J'ai reçu (FCFA)
              <input inputMode="numeric" placeholder="Ex : 50 000" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </label>
            <label className="field">
              Le
              <input type="date" value={when} onChange={(e) => setWhen(e.target.value)} />
            </label>
            <label className="field">
              Note (facultatif)
              <input placeholder="Ex : Wave, première tranche" value={note} onChange={(e) => setNote(e.target.value)} />
            </label>
            <div className="receipt-buttons">
              <button type="button" className="btn" onClick={() => addReceipt(amount)}>Ajouter le paiement</button>
              {remaining > 0 && (
                <button type="button" className="btn btn-outline" onClick={() => addReceipt(remaining, "Solde reçu")}>
                  Il a tout payé ({formatFCFA(remaining)})
                </button>
              )}
            </div>
          </div>
        </>
      )}
      {error && <p className="error">{error}</p>}

      <h3 className="sub-title">Dates</h3>
      <div className="grid">
        <label className="field">
          Date de la commande
          <input type="date" value={dates.order || ""} onChange={(e) => setDates({ ...dates, order: e.target.value })} />
          <small className="muted">Sert à calculer les dates des paiements.</small>
        </label>
        <label className="field">
          Début du projet
          <input type="date" value={dates.start} onChange={(e) => setDates({ ...dates, start: e.target.value })} />
        </label>
        <label className="field">
          Livraison prévue
          <input type="date" value={dates.delivery} onChange={(e) => setDates({ ...dates, delivery: e.target.value })} />
        </label>
        {status === "reporté" && (
          <label className="field">
            Nouvelle date de livraison
            <input type="date" value={dates.postponedTo} onChange={(e) => setDates({ ...dates, postponedTo: e.target.value })} />
          </label>
        )}
      </div>
      {status === "annulé" && (
        <label className="field">
          Raison de l'annulation (facultatif)
          <input value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Ex : le client a changé de priorité" />
        </label>
      )}
    </section>
  );
}
