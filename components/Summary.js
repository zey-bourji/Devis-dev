import Link from "next/link";
import { formatFCFA } from "../lib/pricing";

const STATUSES = ["brouillon", "envoyé", "accepté", "refusé"];

// Le récapitulatif en direct : lignes choisies, remise, total, enregistrement et envoi.
export default function Summary({ quote, number, busy, onPdf, whatsappHref, mailHref, onReset, account }) {
  const empty = quote.lines.length === 0;

  // Un lien désactivé doit vraiment ne rien faire.
  const guard = (e) => {
    if (empty) e.preventDefault();
  };

  return (
    <aside className="summary card">
      <div className="summary-head">
        <h2>Récapitulatif</h2>
        {number && <small>N° {number}</small>}
      </div>

      {empty ? (
        <p className="muted">Coche une fonctionnalité pour voir ton devis se construire.</p>
      ) : (
        <ul className="summary-lines">
          {quote.lines.map((line) => (
            <li key={line.id}>
              <span>{line.label}</span>
              <b>{formatFCFA(line.price)}</b>
            </li>
          ))}
        </ul>
      )}

      {quote.discount > 0 && (
        <div className="summary-sub">
          <span>Remise ({quote.discountPercent} %)</span>
          <span>{formatFCFA(-quote.discount)}</span>
        </div>
      )}
      <div className="summary-total">
        <span>Total</span>
        <strong>{formatFCFA(quote.total)}</strong>
      </div>

      {account.user ? (
        <div className="save-box">
          <label className="field">
            Statut
            <select value={account.status} onChange={(e) => account.setStatus(e.target.value)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <button className="btn btn-outline btn-block" onClick={account.onSave} disabled={account.saving || empty}>
            {account.saving ? "Enregistrement..." : account.saved ? "Mettre à jour le devis" : "Enregistrer le devis"}
          </button>
          {account.notice && <p className="info">{account.notice}</p>}
        </div>
      ) : (
        account.ready && (
          <p className="save-box muted">
            <Link href="/connexion/" className="link">Crée un compte gratuit</Link> pour enregistrer ce devis et
            retrouver tes projets.
          </p>
        )
      )}

      <button className="btn btn-block" onClick={onPdf} disabled={empty || busy}>
        {busy ? "Création du PDF..." : "Télécharger le PDF"}
      </button>
      <div className="share-row">
        <a className={"btn btn-outline" + (empty ? " disabled" : "")} href={whatsappHref} target="_blank" rel="noopener noreferrer" onClick={guard}>
          WhatsApp
        </a>
        <a className={"btn btn-outline" + (empty ? " disabled" : "")} href={mailHref} onClick={guard}>
          Email
        </a>
      </div>
      <p className="hint">Télécharge d'abord le PDF, puis joins-le à ton message.</p>
      <button type="button" className="link-btn" onClick={onReset}>Recommencer un devis</button>
    </aside>
  );
}
