"use client";

import { useState } from "react";
import { ApostolicArenaPhaser } from "./apostolic-arena-phaser";
import { ArenaCardGallery } from "./arena-card-gallery";
import { ArenaWorldRoadmap } from "./arena-world-roadmap";
import { BibleGame } from "./bible-game";

type GameView = "arena" | "cards" | "world" | "challenge";

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
        <button type="button" className={view === "cards" ? "is-active" : ""} aria-pressed={view === "cards"} onClick={() => setView("cards")}>
          <span aria-hidden="true">▦</span><strong>Minhas cartas</strong><small>Coleção e baralhos</small>
        </button>
        <button type="button" className={view === "world" ? "is-active" : ""} aria-pressed={view === "world"} onClick={() => setView("world")}>
          <span aria-hidden="true">♜</span><strong>Arenas e Raids</strong><small>Progressão e bosses</small>
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
        <button type="button" disabled>
          <span aria-hidden="true">▦</span>
          <strong>Jornada</strong>
          <small>Em breve</small>
        </button>
      </nav>

      {view === "arena" ? <ApostolicArenaPhaser /> : view === "cards" ? <ArenaCardGallery /> : view === "world" ? <ArenaWorldRoadmap /> : <BibleGame />}
    </section>
  );
}
