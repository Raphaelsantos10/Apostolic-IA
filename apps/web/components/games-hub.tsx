"use client";

import { useRef, useState } from "react";
import { ApostolicArena3DExperience } from "./apostolic-arena-3d-experience";
import { BibleGame } from "./bible-game";

type GameView = "hub" | "arena" | "challenge";

export function GamesHub() {
  const [view, setView] = useState<GameView>("hub");
  const arenaEntryRef = useRef<HTMLButtonElement>(null);

  const enterArena = () => {
    setView("arena");
    if (!document.fullscreenElement) {
      void document.documentElement.requestFullscreen().catch(() => undefined);
    }
  };

  return (
    <section className="games-hub" aria-labelledby="games-title">
      {view !== "arena" && <header className="games-hub__header">
        <div>
          <p className="eyebrow">Aprender também pode ser uma aventura</p>
          <h1 id="games-title">Jogos Apostolic</h1>
          <p>Estratégia, revisão bíblica e progresso saudável num só lugar.</p>
        </div>
        <span className="games-hub__beta">Protótipo jogável</span>
      </header>}

      {view === "hub" && <nav className="games-hub__tabs" aria-label="Escolher jogo">
        <button
          ref={arenaEntryRef}
          type="button"
          className="is-active"
          onClick={enterArena}
        >
          <span aria-hidden="true">⚔</span>
          <strong>Apostolic Arena</strong>
          <small>Entrar no jogo 3D em tela cheia</small>
        </button>
        <button
          type="button"
          onClick={() => setView("challenge")}
        >
          <span aria-hidden="true">◇</span>
          <strong>Desafio bíblico</strong>
          <small>Quiz e revisão inteligente</small>
        </button>
      </nav>}

      {view === "arena" && <ApostolicArena3DExperience onExit={() => { setView("hub"); window.setTimeout(() => arenaEntryRef.current?.focus(), 0); }} />}
      {view === "challenge" && <><button type="button" className="button button-secondary" onClick={() => setView("hub")}>← Voltar aos jogos</button><BibleGame /></>}
    </section>
  );
}
