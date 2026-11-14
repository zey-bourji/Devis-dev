"use client";

import { useState } from "react";
import { formatFCFA } from "../lib/pricing";
import { paymentSummary } from "../lib/tracking";
import { daysUntil, describeDays, dueDateFor } from "../lib/schedule";
import { proofUrl, removeProof, uploadProof } from "../lib/proofs";

const today = () => new Date().toISOString().slice(0, 10);

// Le suivi du devis : paiements reçus (avec preuve), dates, report ou annulation.
export default function TrackingCard({ user, quoteId, status, total, payments, paid, setPaid, dates, setDates, cancelReason, setCancelReason }) {
  const [busyIndex, setBusyIndex] = useState(null);
  const [error, setError] = useState("");
  const { received, remaining, percent } = paymentSummary(payments, paid, total);

  const setEntry = (i, entry) => setPaid({ ...paid, [i]: entry });

  async function togglePaid(i) {
    setError("");
    if (paid[i]) {
      if (paid[i].proof && !window.confirm("Retirer ce paiement supprimera aussi la preuve jointe. Continuer ?")) return;
      if (paid[i].proof) await removeProof(paid[i].proof.path).catch(() => {});
      const next = { ...paid };
      delete next[i];
      setPaid(next);
    } else {
      setEntry(i, { date: today(), proof: null });
    }
  }

  async function addProof(i, file) {
    if (!file) return;
    setError("");
    setBusyIndex(i);
    try {
      const proof = await uploadProof({ userId: user.id, quoteId, index: i, file });
      setEntry(i, { ...(paid[i] || { date: today() }), proof });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyIndex(null);
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

  async function dropProof(i) {
    if (!window.confirm("Supprimer cette preuve ?")) return;
    await removeProof(paid[i].proof.path).catch(() => {});
    setEntry(i, { ...paid[i], proof: null });
  }

  return (
    <section className="card tracking">
      <h2>Suivi du projet</h2>

      {payments.length === 0 ? (
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

          {payments.map((p, i) => {
            const entry = paid[i];
            const due = dueDateFor(p, dates);
            const days = due ? daysUntil(due) : null;
            return (
              <div className={"pay-row" + (entry ? " is-paid" : "")} key={i}>
                <div className="pay-main">
                  <span>{p.label}</span>
                  <b>{formatFCFA(p.amount)}</b>
                </div>
                {due && !entry && (
                  <small className={"due" + (days < 0 ? " late" : days <= 7 ? " soon" : "")}>
                    À encaisser le {due.toLocaleDateString("fr-FR")} · {describeDays(days)}
                  </small>
                )}
                <div className="pay-actions">
                  <button type="button" className={"pay-toggle" + (entry ? " on" : "")} onClick={() => togglePaid(i)}>
                    {entry ? "✓ Payé" : "Marquer comme payé"}
                  </button>
                  {entry && (
                    <input
                      type="date"
                      aria-label="Date du paiement"
                      value={entry.date}
                      onChange={(e) => setEntry(i, { ...entry, date: e.target.value })}
                    />
                  )}
                  {entry && entry.proof && (
                    <span className="proof">
                      <button type="button" className="link-btn" onClick={() => openProof(entry.proof.path)}>📎 {entry.proof.name}</button>
                      <button type="button" className="link-btn danger" onClick={() => dropProof(i)}>retirer</button>
                    </span>
                  )}
                  {entry && !entry.proof && (
                    quoteId ? (
                      <label className="btn btn-outline btn-small">
                        {busyIndex === i ? "Envoi..." : "Ajouter une preuve"}
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          hidden
                          disabled={busyIndex === i}
                          onChange={(e) => {
                            addProof(i, e.target.files[0]);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    ) : (
                      <small className="muted">Enregistre le devis pour joindre une preuve.</small>
                    )
                  )}
                </div>
              </div>
            );
          })}
          <p className="hint">Si tu changes l'échéancier après un paiement, les lignes se décalent : fais-le avant les premiers paiements.</p>
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
