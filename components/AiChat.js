"use client";

import { useEffect, useRef, useState } from "react";
import { describeOp } from "../lib/aiOps";

// La fenêtre de chat de l'assistant. Elle ne connaît pas le devis :
// elle envoie le message (onAsk), puis rejoue les actions une par une (onPlay) pour que le devis se remplisse sous les yeux.
export default function AiChat({ user, ready, hasSpecs, onAsk, onPlay, onBudget }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [playing, setPlaying] = useState(false);
  const box = useRef(null);
  const area = useRef(null);

  // Le champ grandit avec le texte : on voit tout ce qu'on écrit avant d'envoyer.
  useEffect(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [input]);

  // Le message de bienvenue dépend de la connexion.
  useEffect(() => {
    if (!ready) return;
    setMessages([
      {
        role: "assistant",
        welcome: true,
        text: user
          ? "Salut ! Décris-moi le projet (ou colle le cahier des charges) et je remplis le devis pour toi. Tu peux aussi me demander de changer un prix, une remise ou le paiement en plusieurs fois."
          : "Salut ! Je suis en mode essai : je repère des mots-clés (« paiement Wave », « 10 % de remise », « en 3 fois »). Connecte-toi pour débloquer l'assistant IA complet.",
        steps: [],
      },
    ]);
  }, [ready, !!user]);

  // Fait défiler la conversation vers le bas.
  useEffect(() => {
    if (box.current) box.current.scrollTop = box.current.scrollHeight;
  }, [messages, thinking]);

  const busy = thinking || playing;

  async function send(raw) {
    const text = (raw ?? input).trim();
    if (!text || busy) return;
    setInput("");
    const history = messages.filter((m) => !m.welcome).map((m) => ({ role: m.role, content: m.text }));
    setMessages((m) => [...m, { role: "user", text }]);
    setThinking(true);

    const res = await onAsk(text, history);
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
          <h2>Assistant</h2>
          <small className="muted">{user ? "IA : dis-lui ce que tu veux, le devis se remplit." : "Mode essai, sans IA"}</small>
        </div>
      </div>

      <div className="ai-messages" ref={box} aria-live="polite">
        {messages.map((m, i) => (
          <div key={i} className={"ai-msg " + m.role}>
            <p>{m.text}</p>
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

      <form
        className="ai-form"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
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
          disabled={busy}
          aria-label="Ton message à l'assistant"
        />
        <button className="btn" disabled={busy || !input.trim()}>Envoyer</button>
      </form>
    </section>
  );
}
