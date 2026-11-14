"use client";

import { useEffect, useRef, useState } from "react";
import { CATEGORIES, DEFAULT_DAILY_RATE } from "../lib/features";
import { buildQuote, formatFCFA, itemPrice } from "../lib/pricing";
import { addDays, formatDate, makeQuoteNumber } from "../lib/quote";
import { useStoredState } from "../lib/useStoredState";
import { DEFAULT_BRAND } from "../lib/brand";
import { mailtoUrl, shareText, whatsappUrl } from "../lib/share";
import { buildSchedule, DEFAULT_SCHEDULE, RHYTHMS, SCHEDULE_PRESETS } from "../lib/schedule";
import { analyzeSpecs } from "../lib/analyze";
import { supabase } from "../lib/supabase";
import { useUser } from "../lib/useUser";
import { askAssistant } from "../lib/assistant";
import { DEFAULT_DATES, effectiveTotal, paymentSummary } from "../lib/tracking";
import AiChat from "./AiChat";
import TrackingCard from "./TrackingCard";
import BrandingCard from "./BrandingCard";
import Summary from "./Summary";

export default function QuoteEditor() {
  // --- Ce qui change à chaque devis (non sauvegardé) ---
  const [selected, setSelected] = useState(new Set());
  const [notes, setNotes] = useState({});          // { idLigne: "explication du prix" }
  const [customLines, setCustomLines] = useState([]); // lignes ajoutées à la main
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0); // remise en FCFA (ex : 1 000 pour arrondir)
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE); // comment le client paie (acompte, versements...)
  const [overrides, setOverrides] = useState({});         // jours / prix modifiés ligne par ligne
  const [agreedTotal, setAgreedTotal] = useState(null);   // total convenu avec le client (vide = total estimé)
  const [paid, setPaid] = useState({});                   // paiements reçus : { numéroÉchéance: { date, proof } }
  const [dates, setDates] = useState(DEFAULT_DATES);      // début, livraison, report
  const [cancelReason, setCancelReason] = useState("");
  const [dirty, setDirty] = useState(false);              // le suivi a changé : on enregistre tout seul
  const [client, setClient] = useState({ name: "", project: "" });
  const [number, setNumber] = useState("");
  const [busy, setBusy] = useState(false);

  // --- Compte, projet et devis enregistré ---
  const { user, ready } = useUser();
  const [params, setParams] = useState(null);        // ce qu'il y a dans l'adresse : ?project=... ou ?quote=...
  const [projects, setProjects] = useState([]);      // les projets de la personne connectée
  const [projectId, setProjectId] = useState("");
  const [quoteId, setQuoteId] = useState(null);      // null tant que le devis n'est pas enregistré
  const [status, setStatus] = useState("brouillon");
  const [quoteRate, setQuoteRate] = useState(null);  // taux propre à un devis enregistré
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [specs, setSpecs] = useState("");            // le cahier des charges
  const [suggestions, setSuggestions] = useState(null); // résultat de l'analyse (null = pas encore lancée)
  const [profileLoaded, setProfileLoaded] = useState(false);

  // --- Ce qui est sauvegardé dans le navigateur du dev ---
  const [dailyRate, setDailyRate] = useStoredState("dailyRate", DEFAULT_DAILY_RATE);
  const [dev, setDev] = useStoredState("dev", { name: "", email: "", phone: "" });
  const [validity, setValidity] = useStoredState("validity", 30);
  const [storedBrand, setBrand] = useStoredState("brand", DEFAULT_BRAND);
  const brand = { ...DEFAULT_BRAND, ...storedBrand };

  // Un devis enregistré garde son propre taux : changer ton taux habituel ne modifie pas un ancien devis.
  const rate = quoteRate ?? dailyRate;
  const changeRate = (value) => (quoteRate === null ? setDailyRate(value) : setQuoteRate(value));

  // Le numéro est tiré au sort côté navigateur seulement (sinon le serveur et le navigateur
  // afficheraient deux numéros différents et React se plaindrait).
  useEffect(() => setNumber(makeQuoteNumber()), []);

  // Lit l'adresse une seule fois : /devis/?project=ID ou /devis/?quote=ID
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setParams({ project: q.get("project"), quote: q.get("quote") });
  }, []);

  // Connecté : récupère les réglages du profil (nom, logo, couleur, taux...) pour les retrouver sur tout appareil.
  useEffect(() => {
    if (!ready) return;
    if (!user) {
      setProfileLoaded(false);
      return;
    }
    let cancelled = false;
    supabase
      .from("profiles")
      .select("settings")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        const saved = data?.settings;
        if (saved) {
          if (saved.dev) setDev(saved.dev);
          if (saved.brand) setBrand(saved.brand);
          if (saved.dailyRate) setDailyRate(saved.dailyRate);
          if (saved.validity) setValidity(saved.validity);
        }
        setProfileLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [ready, user?.id]);

  // ...puis les enregistre quand tu les modifies (avec une petite pause pour ne pas écrire à chaque lettre).
  useEffect(() => {
    if (!user || !profileLoaded) return;
    const timer = setTimeout(() => {
      supabase.from("profiles").upsert({
        user_id: user.id,
        settings: { dev, brand: storedBrand, dailyRate, validity },
        updated_at: new Date().toISOString(),
      });
    }, 800);
    return () => clearTimeout(timer);
  }, [user?.id, profileLoaded, dev, storedBrand, dailyRate, validity]);

  // Connecté : charge la liste de ses projets pour le menu "Projet".
  useEffect(() => {
    if (!user) return;
    supabase
      .from("projects")
      .select("id, name, client_name, specs")
      .order("created_at", { ascending: false })
      .then(({ data }) => setProjects(data || []));
  }, [user?.id]);

  // Si l'adresse contient ?project=ID : on pré-remplit le client, le nom du projet et le cahier des charges.
  useEffect(() => {
    if (!params?.project || params.quote || projects.length === 0 || projectId) return;
    const project = projects.find((p) => p.id === params.project);
    if (project) pickProject(project.id, true);
  }, [params, projects]);

  // Si l'adresse contient ?quote=ID : on recharge le devis enregistré.
  useEffect(() => {
    if (!params?.quote || !user) return;
    supabase
      .from("quotes")
      .select("*")
      .eq("id", params.quote)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) return setNotice("Devis introuvable.");
        const d = data.data || {};
        setQuoteId(data.id);
        setNumber(data.number);
        setStatus(data.status);
        setProjectId(data.project_id || "");
        setSelected(new Set(d.selected || []));
        setNotes(d.notes || {});
        setCustomLines(d.customLines || []);
        setDiscountPercent(d.discountPercent || 0);
        setDiscountAmount(d.discountAmount || 0);
        setOverrides(d.overrides || {});
        setSchedule({ ...DEFAULT_SCHEDULE, ...(d.schedule || {}) });
        setAgreedTotal(d.agreedTotal ?? null);
        setPaid(d.paid || {});
        setDates({ ...DEFAULT_DATES, ...(d.dates || {}) });
        setCancelReason(d.cancelReason || "");
        setClient(d.client || { name: "", project: "" });
        setSpecs(d.specs || "");
        setQuoteRate(d.dailyRate ?? null);
      });
  }, [params?.quote, user?.id]);

  // Choisir un projet dans le menu : on reprend ses informations.
  function pickProject(id, force = false) {
    setProjectId(id);
    const project = projects.find((p) => p.id === id);
    if (!project) return;
    if (force || !client.name) setClient({ name: project.client_name || client.name, project: project.name });
    if (force || !specs) setSpecs(project.specs || "");
  }

  // Lit le cahier des charges et pré-coche les fonctionnalités trouvées.
  function runAnalysis() {
    const found = analyzeSpecs(specs);
    setSuggestions(found);
    if (found.length > 0) setSelected(new Set([...selected, ...found.map((f) => f.id)]));
  }

  // Enregistre (ou met à jour) le devis dans le compte.
  async function saveQuote(silent = false) {
    if (!user) return;
    setSaving(true);
    if (!silent) setNotice("");
    const payload = {
      project_id: projectId || null,
      number,
      status,
      total,
      updated_at: new Date().toISOString(),
      data: { selected: [...selected], notes, customLines, discountPercent, discountAmount, overrides, schedule, agreedTotal, paid, dates, cancelReason, client, specs, dailyRate: rate },
    };
    let error;
    if (quoteId) {
      ({ error } = await supabase.from("quotes").update(payload).eq("id", quoteId));
    } else {
      const res = await supabase.from("quotes").insert(payload).select("id").single();
      error = res.error;
      if (!error) {
        setQuoteId(res.data.id);
        // L'adresse devient /devis/?quote=ID : un rechargement de la page retrouve le même devis.
        window.history.replaceState(null, "", `/devis/?quote=${res.data.id}`);
      }
    }
    setSaving(false);
    if (!error) setDirty(false);
    setNotice(error ? "Échec de l'enregistrement : " + error.message : silent ? "Suivi enregistré ✓" : "Devis enregistré ✓");
  }

  function toggle(id) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }
  const setNote = (id, text) => setNotes({ ...notes, [id]: text });

  // Changer les jours recalcule le prix tout seul (on efface un éventuel prix saisi à la main).
  const setDays = (id, days) => setOverrides({ ...overrides, [id]: { days: Math.max(0, days) } });
  // Saisir un prix à la main le fige, jusqu'à ce qu'on clique sur "Rétablir".
  const setPrice = (id, price) => setOverrides({ ...overrides, [id]: { ...(overrides[id] || {}), price: Math.max(0, price) } });
  const resetLine = (id) => {
    const next = { ...overrides };
    delete next[id];
    setOverrides(next);
  };

  const addCustom = () => setCustomLines([...customLines, { id: "c" + Date.now(), label: "", price: 0 }]);
  const updateCustom = (id, patch) => setCustomLines(customLines.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const removeCustom = (id) => setCustomLines(customLines.filter((c) => c.id !== id));

  function reset() {
    setSelected(new Set());
    setNotes({});
    setCustomLines([]);
    setDiscountPercent(0);
    setDiscountAmount(0);
    setOverrides({});
    setSchedule(DEFAULT_SCHEDULE);
    setAgreedTotal(null);
    setPaid({});
    setDates(DEFAULT_DATES);
    setCancelReason("");
    setDirty(false);
    setClient({ name: "", project: "" });
    setNumber(makeQuoteNumber());
    setQuoteId(null);
    setQuoteRate(null);
    setStatus("brouillon");
    setSpecs("");
    setSuggestions(null);
    setNotice("");
    window.history.replaceState(null, "", "/devis/");
  }

  const quote = buildQuote(CATEGORIES, selected, rate, { customLines, discountPercent, discountAmount, notes, overrides });

  // Arrondit le total vers le bas : 201 000 avec un pas de 5 000 -> remise de 1 000, total 200 000.
  function roundTotal(step) {
    setDiscountAmount((quote.subtotal - quote.discountPercentAmount) % step);
  }

  // Le total qui compte : celui convenu avec le client, sinon l'estimation. Le PDF, l'échéancier et la liste l'utilisent.
  const total = effectiveTotal(quote.total, agreedTotal);
  const finalQuote = { ...quote, estimated: quote.total, total, adjustment: total - quote.total };
  const payments = buildSchedule(total, schedule);
  const tracking = paymentSummary(payments, paid, total);

  // Le suivi (statut, paiements, dates) s'enregistre tout seul, un instant après chaque changement.
  const mark = () => setDirty(true);
  const changeStatus = (value) => { setStatus(value); mark(); };
  useEffect(() => {
    if (!dirty || !quoteId || !user) return;
    const timer = setTimeout(() => saveQuote(true), 900);
    return () => clearTimeout(timer);
  }, [dirty, paid, agreedTotal, dates, cancelReason, status]);

  // --- L'assistant : applique les actions demandées par le chat, une par une ---
  // On garde la fonction à jour dans une "ref" : les actions arrivent avec des pauses,
  // et chaque pause doit utiliser l'état le plus récent du devis.
  const stepRef = useRef(null);
  stepRef.current = (op) => {
    switch (op.op) {
      case "select": setSelected((s) => new Set(s).add(op.id)); break;
      case "unselect": setSelected((s) => { const n = new Set(s); n.delete(op.id); return n; }); break;
      case "days": setOverrides((o) => ({ ...o, [op.id]: { days: op.value } })); break;
      case "price": setOverrides((o) => ({ ...o, [op.id]: { ...(o[op.id] || {}), price: op.value } })); break;
      case "rate": changeRate(op.value); break;
      case "discount_percent": setDiscountPercent(op.value); break;
      case "discount_amount": setDiscountAmount(op.value); break;
      case "round": roundTotal(op.step); break;
      case "schedule": setSchedule((s) => ({ ...s, ...op.patch })); break;
      case "template": setBrand((b) => ({ ...DEFAULT_BRAND, ...b, template: op.value })); break;
      case "color": setBrand((b) => ({ ...DEFAULT_BRAND, ...b, color: op.value })); break;
      case "client": setClient((c) => ({ ...c, ...(op.name && { name: op.name }), ...(op.project && { project: op.project }) })); break;
      case "note": setNotes((n) => ({ ...n, [op.id]: op.text })); break;
      case "custom": setCustomLines((l) => [...l, { id: "c" + Date.now() + Math.random().toString(36).slice(2, 5), label: op.label, price: op.price }]); break;
    }
  };

  function playOps(ops, onStep) {
    return new Promise((resolve) => {
      const gap = Math.max(200, Math.min(450, 4500 / Math.max(ops.length, 1)));
      ops.forEach((op, i) => {
        setTimeout(() => {
          stepRef.current(op);
          onStep(op);
          if (i === ops.length - 1) setTimeout(resolve, 250);
        }, 150 + i * gap);
      });
    });
  }

  // Ce que l'IA voit du devis : le catalogue et l'état actuel (jamais les infos personnelles du dev).
  const aiContext = {
    catalogue: CATEGORIES.flatMap((c) =>
      c.items.map((i) => ({ id: i.id, label: i.label, category: c.label, type: i.type, days: i.days, min: i.min, max: i.max, price: i.price }))
    ),
    state: {
      selected: [...selected],
      lines: quote.lines.map((l) => ({ id: l.id, days: l.days, price: l.price })),
      dailyRate: rate,
      discountPercent,
      discountAmount,
      schedule,
      template: brand.template,
      client,
      total: quote.total,
    },
    specs: specs.slice(0, 6000),
  };
  const askAi = (message, history) => askAssistant({ message, history, context: aiContext, user });

  const text = shareText({ dev, client, quote: finalQuote, number });
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
          quote={finalQuote}
          number={number}
          brand={brand}
          payments={payments}
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

        <AiChat user={user} ready={ready} hasSpecs={!!specs.trim()} onAsk={askAi} onPlay={playOps} />

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
                value={rate}
                onChange={(e) => changeRate(Number(e.target.value) || 0)}
              />
            </label>
          </div>
        </section>

        {user && (
          <section className="card">
            <h2>Projet</h2>
            <label className="field">
              Rattacher ce devis à un projet
              <select value={projectId} onChange={(e) => pickProject(e.target.value)}>
                <option value="">Aucun projet</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </label>
          </section>
        )}

        <section className="card">
          <h2>Cahier des charges (facultatif)</h2>
          <p className="muted">Colle le cahier des charges : je repère les fonctionnalités et je les pré-coche. Ce sont des suggestions, à toi de vérifier.</p>
          <textarea rows="5" value={specs} onChange={(e) => setSpecs(e.target.value)} placeholder="Ex : un site avec inscription des utilisateurs, paiement par Wave, un espace admin..." />
          <button type="button" className="btn btn-outline btn-small" onClick={runAnalysis} disabled={!specs.trim()}>
            Analyser et pré-cocher
          </button>
          {suggestions && suggestions.length === 0 && (
            <p className="muted">Aucune fonctionnalité reconnue. Précise le texte ou coche à la main.</p>
          )}
          {suggestions && suggestions.length > 0 && (
            <ul className="found">
              {suggestions.map((f) => (
                <li key={f.id}>
                  <b>{CATEGORIES.flatMap((c) => c.items).find((i) => i.id === f.id)?.label}</b>
                  <small> · mot repéré : « {f.word} »</small>
                </li>
              ))}
            </ul>
          )}
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
            {cat.items.map((item) => {
              const line = quote.lines.find((l) => l.id === item.id); // existe seulement si la case est cochée
              const min = item.type === "days" ? Math.round(item.min * rate) : null;
              const max = item.type === "days" ? Math.round(item.max * rate) : null;
              const outOfRange = line && min !== null && (line.price < min || line.price > max);
              return (
                <div className="item-wrap" key={item.id}>
                  <label className="item">
                    <input type="checkbox" checked={selected.has(item.id)} onChange={() => toggle(item.id)} />
                    <span className="item-label">
                      {item.label}
                      {item.type === "days" && <small> {item.days} j</small>}
                    </span>
                    <span className="item-price">{formatFCFA(line ? line.price : itemPrice(item, rate))}</span>
                  </label>
                  {line && (
                    <div className="tune">
                      <div className="tune-fields">
                        {item.type === "days" && (
                          <div className="tune-field">
                            <span>Jours</span>
                            <div className="stepper">
                              <button type="button" onClick={() => setDays(item.id, line.days - 0.5)} aria-label="Moins un demi-jour">−</button>
                              <input
                                type="number"
                                min="0"
                                step="0.5"
                                value={line.days}
                                onChange={(e) => setDays(item.id, Number(e.target.value) || 0)}
                              />
                              <button type="button" onClick={() => setDays(item.id, line.days + 0.5)} aria-label="Plus un demi-jour">+</button>
                            </div>
                          </div>
                        )}
                        <label className="tune-field">
                          <span>Prix (FCFA)</span>
                          <input
                            type="number"
                            min="0"
                            step="1000"
                            value={line.price}
                            onChange={(e) => setPrice(item.id, Number(e.target.value) || 0)}
                          />
                        </label>
                      </div>
                      <div className="tune-info">
                        {min !== null && (
                          <small className="range">Fourchette : {formatFCFA(min)} à {formatFCFA(max)}</small>
                        )}
                        {outOfRange && <small className="warn">hors fourchette</small>}
                        {line.edited && (
                          <button type="button" className="link-btn" onClick={() => resetLine(item.id)}>Rétablir</button>
                        )}
                      </div>
                      <input
                        className="note-input"
                        placeholder="Note pour le client (optionnel)"
                        value={notes[item.id] || ""}
                        onChange={(e) => setNote(item.id, e.target.value)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
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
          <h2>Remise et arrondi</h2>
          <div className="grid">
            <label className="field">
              Remise en pourcentage (%)
              <input
                type="number"
                min="0"
                max="100"
                value={discountPercent || ""}
                placeholder="0"
                onChange={(e) => setDiscountPercent(Number(e.target.value) || 0)}
              />
            </label>
            <label className="field">
              Remise en FCFA
              <input
                type="number"
                min="0"
                step="500"
                value={discountAmount || ""}
                placeholder="0"
                onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
              />
            </label>
          </div>
          <div className="round-row">
            <span className="muted">Arrondir le total vers le bas :</span>
            <button type="button" className="btn btn-outline btn-small" onClick={() => roundTotal(1000)}>1 000</button>
            <button type="button" className="btn btn-outline btn-small" onClick={() => roundTotal(5000)}>5 000</button>
            <button type="button" className="btn btn-outline btn-small" onClick={() => roundTotal(10000)}>10 000</button>
          </div>
        </section>

        <section className="card">
          <h2>Total convenu</h2>
          <p className="muted">Si tu t'es mis d'accord avec ton client sur un autre montant, saisis-le ici. L'échéancier et le PDF suivent ce total.</p>
          <div className="agreed-row">
            <div><small>Total estimé</small><b>{formatFCFA(quote.total)}</b></div>
            <label className="field">
              Total convenu (FCFA)
              <input
                type="number"
                min="0"
                step="1000"
                placeholder="Laisser vide = total estimé"
                value={agreedTotal ?? ""}
                onChange={(e) => { setAgreedTotal(e.target.value === "" ? null : Math.max(0, Number(e.target.value) || 0)); mark(); }}
              />
            </label>
          </div>
          {finalQuote.adjustment !== 0 && (
            <p className="info">
              Ajustement : {formatFCFA(finalQuote.adjustment)} par rapport à l'estimation.{" "}
              <button type="button" className="link-btn" onClick={() => { setAgreedTotal(null); mark(); }}>Rétablir l'estimation</button>
            </p>
          )}
        </section>

        <section className="card">
          <h2>Modalités de paiement</h2>
          <div className="presets">
            {SCHEDULE_PRESETS.map((p) => (
              <button type="button" key={p.label} className="chip" onClick={() => setSchedule(p.value)}>
                {p.label}
              </button>
            ))}
          </div>
          <div className="grid">
            <label className="field">
              Acompte à la commande (%)
              <input
                type="number"
                min="0"
                max="100"
                value={schedule.depositPercent}
                onChange={(e) => setSchedule({ ...schedule, depositPercent: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })}
              />
            </label>
            <label className="field">
              Le reste se paie
              <select value={schedule.rhythm} onChange={(e) => setSchedule({ ...schedule, rhythm: e.target.value })}>
                {RHYTHMS.map((r) => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            </label>
            {schedule.rhythm !== "livraison" && (
              <label className="field">
                Nombre de versements
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={schedule.installments}
                  onChange={(e) => setSchedule({ ...schedule, installments: Math.min(12, Math.max(1, Number(e.target.value) || 1)) })}
                />
              </label>
            )}
          </div>
          <ul className="plan-preview">
            {payments.map((p, i) => (
              <li key={i}>
                <span>{p.label}</span>
                <b>{formatFCFA(p.amount)}</b>
              </li>
            ))}
            {payments.length === 0 && <li className="muted">Coche des lignes pour voir l'échéancier.</li>}
          </ul>
        </section>

        {user && (
          <TrackingCard
            user={user}
            quoteId={quoteId}
            status={status}
            total={total}
            payments={payments}
            paid={paid}
            setPaid={(v) => { setPaid(v); mark(); }}
            dates={dates}
            setDates={(v) => { setDates(v); mark(); }}
            cancelReason={cancelReason}
            setCancelReason={(v) => { setCancelReason(v); mark(); }}
          />
        )}

        <BrandingCard brand={brand} setBrand={setBrand} />
      </div>

      <div className="editor-side">
        <Summary
          quote={finalQuote}
          tracking={tracking}
          number={number}
          busy={busy}
          onPdf={downloadPdf}
          whatsappHref={whatsappHref}
          mailHref={mailHref}
          onReset={reset}
          account={{ user, ready, status, setStatus: changeStatus, saving, notice, onSave: () => saveQuote(false), saved: !!quoteId }}
        />
      </div>

      <div className="total-bar">
        <div>
          <small>{quote.lines.length} ligne(s)</small>
          <strong key={finalQuote.total}>{formatFCFA(finalQuote.total)}</strong>
        </div>
        <button className="btn" onClick={downloadPdf} disabled={quote.lines.length === 0 || busy}>
          {busy ? "Création..." : "PDF"}
        </button>
      </div>
    </div>
  );
}
