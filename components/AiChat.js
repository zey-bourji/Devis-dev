"use client";

import { useEffect, useRef, useState } from "react";
import { describeOp } from "../lib/aiOps";
import { LIMITS, readAttachment } from "../lib/attachments";

// La fenêtre de chat de l'assistant. Elle ne connaît pas le devis :
// elle envoie le message (onAsk), puis rejoue les actions une par une (onPlay) pour que le devis se remplisse sous les yeux.
export default function AiChat({ user, ready, hasSpecs, chatKey, initial, incoming, onChange, onAsk, onPlay, onBudget }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [playing, setPlaying] = useState(false);
  const box = useRef(null);
  const area = useRef(null);
  const picker = useRef(null);
  const acted = useRef(false);               // vrai dès que la personne a écrit : on ne sauvegarde pas avant
  const [pending, setPending] = useState([]); // les pièces jointes prêtes pour le prochain message
  const [attachError, setAttachError] = useState("");
  const [reading, setReading] = useState(false);

  // Le champ grandit avec le texte : on voit tout ce qu'on écrit avant d'envoyer.
  useEffect(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [input]);

  // Le message de bienvenue dépend de la connexion ; si le devis a déjà une conversation, on la remet dessous.
  useEffect(() => {
    if (!ready) return;
    acted.current = false;
    setPending([]);
    setMessages([
      {
        role: "assistant",
        welcome: true,
        text: user
          ? "Salut, moi c'est Youk ! Décris-moi le projet (ou colle le cahier des charges) et je remplis le devis pour toi. Tu peux aussi joindre un cahier des charges (PDF, Word) ou des photos."
          : "Salut ! Je suis en mode essai : je repère des mots-clés (« paiement Wave », « 10 % de remise », « en 3 fois »). Connecte-toi pour débloquer l'assistant IA complet.",
        steps: [],
      },
      ...(Array.isArray(initial) ? initial : []),
    ]);
  }, [ready, !!user, chatKey]);

  // Des photos arrivent depuis la carte « cahier des charges » : on les met dans les pièces prêtes à envoyer.
  useEffect(() => {
    if (!incoming?.items?.length) return;
    setAttachError("");
    setPending((p) => {
      const room = Math.max(0, LIMITS.photos - sentFiles.filter((a) => a.kind === "photo").length - p.filter((a) => a.kind === "photo").length);
      if (incoming.items.length > room) setAttachError(`Seules ${room} photo(s) sur ${incoming.items.length} ont pu être ajoutées (maximum ${LIMITS.photos} par conversation).`);
      return [...p, ...incoming.items.slice(0, room)];
    });
  }, [incoming?.id]);

  // Sauvegarde de la conversation chez le parent (sans les fichiers, seulement leurs noms).
  function persist(next) {
    if (!acted.current || !onChange) return;
    onChange(next.filter((m) => !m.welcome).slice(-LIMITS.messages));
  }
  useEffect(() => { persist(messages); }, [messages]);

  // Fait défiler la conversation vers le bas.
  useEffect(() => {
    if (box.current) box.current.scrollTop = box.current.scrollHeight;
  }, [messages, thinking]);

  const busy = thinking || playing || reading;
  const chatMessages = messages.filter((m) => !m.welcome);
  const full = chatMessages.length >= LIMITS.messages;
  const sentFiles = chatMessages.flatMap((m) => m.files || []);
  const count = (list, kind) => list.filter((a) => a.kind === kind).length;
  const filesNow = count(sentFiles, "file") + count(pending, "file");
  const photosNow = count(sentFiles, "photo") + count(pending, "photo");

  async function pick(e) {
    const chosen = [...e.target.files];
    e.target.value = "";
    setAttachError("");
    setReading(true);
    let list = [...pending];
    for (const f of chosen) {
      try {
        list = [...list, await readAttachment(f, [...sentFiles, ...list])];
      } catch (err) {
        setAttachError(err.message || "Fichier illisible.");
      }
    }
    setPending(list);
    setReading(false);
  }

  function newChat() {
    if (busy) return;
    acted.current = true;
    setPending([]);
    setAttachError("");
    setMessages((m) => m.filter((x) => x.welcome));
  }

  async function send(raw) {
    const typed = (raw ?? input).trim();
    const att = pending;
    if ((!typed && att.length === 0) || busy || full) return;
    const text = typed || "Analyse ce document et prépare le devis.";
    acted.current = true;
    setInput("");
    setPending([]);
    setAttachError("");
    const history = chatMessages.map((m) => ({ role: m.role, content: m.text }));
    setMessages((m) => [...m, { role: "user", text, files: att.map((a) => ({ kind: a.kind, name: a.name })) }]);
    setThinking(true);

    const res = await onAsk(text, history, {
      texts: att.filter((a) => a.kind === "file").map((a) => ({ name: a.name, text: a.text })),
      images: att.filter((a) => a.kind === "photo").map((a) => a.dataUrl),
    });
    setThinking(false);

    let index;
    setMessages((m) => {
      index = m.length;
      return [...m, { role: "assistant", text: res.reply || "C'est fait.", steps: [], warn: res.warn, source: res.source }];
    });
    if (res.ops.length) {
      setPlaying(true);
      await onPlay(res.ops, (op) => {
        setMessages((m) => m.map((msg, i) => (i === index ? { ...msg, steps: [...msg.steps, describeOp(op)] } : msg)));
      });
      setPlaying(false);
    }

    // Un budget a été donné : si le devis le dépasse, on propose deux options à choisir.
    if (res.budget && onBudget) {
      await new Promise((r) => setTimeout(r, 500)); // le temps que le devis se mette à jour
      const plan = onBudget(res.budget);
      if (plan) {
        setMessages((m) => [...m, { role: "assistant", text: plan.text, steps: [], choices: [plan.optionA, plan.optionB], chosen: null }]);
      }
    }
  }

  async function choose(msgIndex, choiceIndex) {
    if (busy) return;
    const msg = messages[msgIndex];
    if (!msg || msg.chosen !== null) return;
    const choice = msg.choices[choiceIndex];
    let index;
    setMessages((m) => {
      const next = m.map((x, i) => (i === msgIndex ? { ...x, chosen: choiceIndex } : x));
      index = next.length;
      return [...next, { role: "assistant", text: choice.ops?.length ? "C'est fait, j'ajuste le devis." : "D'accord, je garde tout. Le total dépasse le budget : tu peux fixer le prix convenu plus bas.", steps: [] }];
    });
    if (choice.ops?.length) {
      setPlaying(true);
      await onPlay(choice.ops, (op) => {
        setMessages((m) => m.map((x, i) => (i === index ? { ...x, steps: [...x.steps, describeOp(op)] } : x)));
      });
      setPlaying(false);
    }
  }

  const suggestions = [
    "Une boutique en ligne avec paiement Wave et un espace admin",
    ...(hasSpecs ? ["Lis mon cahier des charges et fais le devis"] : []),
    "Paiement en 3 fois",
    "Ajoute 10 % de remise",
  ];

  return (
    <section className="card ai-card">
      <div className="ai-head">
        <span className="ai-spark" aria-hidden="true">IA</span>
        <div>
          <h2>Youk</h2>
          <small className="muted">{user ? "IA : dis-lui ce que tu veux, le devis se remplit." : "Mode essai, sans IA"}</small>
        </div>
      </div>

      <div className="ai-messages" ref={box} aria-live="polite">
        {messages.map((m, i) => (
          <div key={i} className={"ai-msg " + m.role}>
            <p>{m.text}</p>
            {m.files?.length > 0 && <small className="ai-files">Joint : {m.files.map((f) => f.name).join(", ")}</small>}
            {m.steps?.length > 0 && (
              <ul className="ai-steps">
                {m.steps.map((s, j) => (
                  <li key={j}>✓ {s}</li>
                ))}
              </ul>
            )}
            {m.choices && (
              <div className="ai-choices">
                {m.choices.map((c, k) => (
                  <button type="button" key={k} className={"chip" + (m.chosen === k ? " chip-on" : "")} disabled={busy || m.chosen !== null} onClick={() => choose(i, k)}>
                    {c.label}
                  </button>
                ))}
              </div>
            )}
            {m.warn && <small className="ai-warn">{m.warn} J'ai utilisé le mode simple.</small>}
          </div>
        ))}
        {thinking && (
          <div className="ai-msg assistant">
            <span className="ai-dots" aria-label="L'assistant réfléchit">
              <i></i><i></i><i></i>
            </span>
          </div>
        )}
      </div>

      <div className="presets">
        {suggestions.map((s) => (
          <button type="button" key={s} className="chip" disabled={busy} onClick={() => send(s)}>
            {s}
          </button>
        ))}
      </div>

      {user && pending.length > 0 && (
        <ul className="ai-pending">
          {pending.map((a, i) => (
            <li key={i}>
              <span>{a.name}</span>
              <button type="button" aria-label={"Retirer " + a.name} onClick={() => setPending((p) => p.filter((_, k) => k !== i))}>×</button>
            </li>
          ))}
        </ul>
      )}
      {attachError && <p className="error">{attachError}</p>}
      {full && <p className="muted">Cette conversation est pleine. Lance une nouvelle conversation pour continuer.</p>}

      <form
        className="ai-form"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <div className="ai-box">
        <textarea
          ref={area}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Ex : site pour un salon de coiffure, avec réservation..."
          disabled={busy || full}
          aria-label="Ton message à Youk"
        />
        {user && (
          <>
            <input ref={picker} type="file" hidden multiple accept="image/jpeg,image/png,image/webp,.pdf,.docx,.txt,.md,.csv" onChange={pick} />
            <button type="button" className="ai-plus" title="Joindre un fichier ou une photo" aria-label="Joindre un fichier ou une photo" disabled={busy || full} onClick={() => picker.current?.click()}>+</button>
          </>
        )}
        </div>
        <button className="btn" disabled={busy || full || (!input.trim() && pending.length === 0)}>Envoyer</button>
      </form>
      {user && (
        <div className="ai-foot">
          <small className="muted">
            Joint dans cette conversation : documents {filesNow}/{LIMITS.files}, photos {photosNow}/{LIMITS.photos}
          </small>
          {chatMessages.length > 0 && (
            <button type="button" className="link-btn" onClick={newChat} disabled={busy}>Nouvelle conversation</button>
          )}
        </div>
      )}
    </section>
  );
}
