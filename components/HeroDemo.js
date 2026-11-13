"use client";

import { useEffect, useRef, useState } from "react";
import { CATEGORIES, DEFAULT_DAILY_RATE } from "../lib/features";
import { formatFCFA, itemPrice } from "../lib/pricing";

// Une mini-démo du produit qui se joue en boucle (~13 s) : le client se tape, les lignes se cochent,
// le total grimpe, le PDF apparaît, puis le message WhatsApp part. Rien n'est réel : c'est un décor animé.
const ALL = CATEGORIES.flatMap((c) => c.items);
const DEMO = ["vitrine", "auth", "paiement", "hebergement"].map((id) => ALL.find((i) => i.id === id));
const PRICES = DEMO.map((item) => itemPrice(item, DEFAULT_DAILY_RATE));
const GRAND_TOTAL = PRICES.reduce((a, b) => a + b, 0);
const CLIENT = "Boutique Résinia";

export default function HeroDemo() {
  const [typed, setTyped] = useState("");
  const [shown, setShown] = useState(0);     // combien de lignes sont cochées
  const [pressed, setPressed] = useState(false);
  const [sheet, setSheet] = useState(false); // le PDF est affiché
  const [toast, setToast] = useState(false);
  const [fading, setFading] = useState(false);
  const [total, setTotal] = useState(0);
  const totalRef = useRef(0);

  const target = PRICES.slice(0, shown).reduce((a, b) => a + b, 0);

  // Le scénario : une suite de setTimeout qui allument les étapes l'une après l'autre.
  useEffect(() => {
    // Pour les personnes qui ont demandé moins d'animations : on montre directement le résultat final.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTyped(CLIENT);
      setShown(DEMO.length);
      setSheet(true);
      return;
    }
    const timers = [];
    const at = (ms, fn) => timers.push(setTimeout(fn, ms));

    function play() {
      setFading(false);
      setTyped("");
      setShown(0);
      setPressed(false);
      setSheet(false);
      setToast(false);
      [...CLIENT].forEach((_, i) => at(300 + i * 80, () => setTyped(CLIENT.slice(0, i + 1))));
      DEMO.forEach((_, i) => at(1900 + i * 800, () => setShown(i + 1)));
      at(5400, () => setPressed(true));
      at(5900, () => setSheet(true));
      at(9000, () => setToast(true));
      at(12000, () => setFading(true));
      at(12800, play); // et on recommence
    }
    play();
    return () => timers.forEach(clearTimeout);
  }, []);

  // Le total ne saute pas : il monte (ou descend) en douceur jusqu'à sa nouvelle valeur.
  useEffect(() => {
    const from = totalRef.current;
    if (from === target) return;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / 600);
      const eased = 1 - Math.pow(1 - p, 3);
      const value = Math.round(from + (target - from) * eased);
      totalRef.current = value;
      setTotal(value);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  return (
    <div className={"demo" + (fading ? " fading" : "")} aria-hidden="true">
      <div className="demo-bar">
        <i /><i /><i />
        <span>Nouveau devis</span>
      </div>

      <div className="demo-body">
        <div className="demo-field">
          <small>Client</small>
          <div className="demo-input">{typed}<span className="caret" /></div>
        </div>

        <ul className="demo-lines">
          {DEMO.map((item, i) => (
            <li key={item.id} className={i < shown ? "on" : ""}>
              <span className="demo-check">✓</span>
              <span className="demo-label">{item.label}</span>
              <b>{formatFCFA(PRICES[i])}</b>
            </li>
          ))}
        </ul>

        <div className="demo-total">
          <span>Total</span>
          <strong>{formatFCFA(total)}</strong>
        </div>
        <div className={"demo-btn" + (pressed ? " pressed" : "")}>Télécharger le PDF</div>
      </div>

      <div className={"demo-sheet" + (sheet ? " up" : "")}>
        <div className="sheet-head">
          <b>DEVIS</b>
          <small>N° DEV-20261114-204</small>
        </div>
        <div className="sheet-client">{CLIENT}</div>
        {DEMO.map((item, i) => (
          <div className="sheet-row" key={item.id}>
            <span>{item.label}</span>
            <span>{formatFCFA(PRICES[i])}</span>
          </div>
        ))}
        <div className="sheet-total">
          <span>TOTAL</span>
          <span>{formatFCFA(GRAND_TOTAL)}</span>
        </div>
      </div>

      <div className={"demo-toast" + (toast ? " show" : "")}>Envoyé au client par WhatsApp ✓</div>
    </div>
  );
}
