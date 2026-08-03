"use client";

import { useState } from "react";
import { ApostolicArenaGame } from "./apostolic-arena-game";
import { BibleGame } from "./bible-game";

type GameView = "arena" | "challenge";

export function GamesHub() {
  const [view, setView] = useState<GameView>("arena");

  return (
    <section className="games-hub" aria-labelledby="games-title">
      <header className="games-hub__header">
        <div>
          <p className="eyebrow">Aprender também pode ser uma aventura</p>
          <h1 id="games-title">Jogos Apostolic</h1>
          <p>Estratégia, revisão bíblica e progresso saudável num só lugar.</p>
        </div>
        <span className="games-hub__beta">Protótipo jogável</span>
      </header>

      <nav className="games-hub__tabs" aria-label="Escolher jogo">
        <button
          type="button"
          className={view === "arena" ? "is-active" : ""}
          aria-pressed={view === "arena"}
          onClick={() => setView("arena")}
        >
          <span aria-hidden="true">⚔</span>
          <strong>Apostolic Arena</strong>
          <small>Estratégia contra Barnabé</small>
        </button>
        <button
          type="button"
          className={view === "challenge" ? "is-active" : ""}
          aria-pressed={view === "challenge"}
          onClick={() => setView("challenge")}
        >
          <span aria-hidden="true">◇</span>
          <strong>Desafio bíblico</strong>
          <small>Quiz e revisão inteligente</small>
        </button>
      </nav>

      {view === "arena" ? <ApostolicArenaGame /> : <BibleGame />}
    </section>
  );
}
