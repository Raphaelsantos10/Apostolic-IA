"use client";

import { useEffect, useState } from "react";
import { arenaForTrophies, dailyEventFor } from "../lib/apostolic-arena-world";
import { ApostolicArenaPhaser } from "./apostolic-arena-phaser";
import { ArenaCardGallery } from "./arena-card-gallery";
import { ArenaWorldRoadmap } from "./arena-world-roadmap";
import styles from "./apostolic-arena-game.module.css";

type ArenaScreen = "home" | "cards" | "battle" | "world" | "rewards";
const DECK_STORAGE_KEY = "apostolic-arena-active-deck";

export function ApostolicArenaGame() {
  const [screen, setScreen] = useState<ArenaScreen>("home");
  const [deckCount, setDeckCount] = useState(0);
  const [dailyName, setDailyName] = useState("Evento diário");
  const trophies = 0;
  const arena = arenaForTrophies(trophies);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(DECK_STORAGE_KEY) ?? "[]") as number[];
      setDeckCount(Array.isArray(saved) ? saved.length : 0);
    } catch { setDeckCount(0); }
    setDailyName(dailyEventFor(new Date())?.name ?? "Evento diário");
  }, [screen]);

  const title = screen === "cards" ? "Cartas e baralho" : screen === "battle" ? "Batalha" : screen === "world" ? "Arenas e Raids" : screen === "rewards" ? "Recompensas" : "";

  return <section className={styles.game} aria-label="Jogo Apostolic Arena">
    <header className={styles.topbar}>
      <div className={styles.identity}><span className={styles.avatar}>A</span><div><strong>Raphael</strong><small>Nível 1 · Discípulo</small></div></div>
      <div className={styles.currency}><span>🪙 250</span><span>💎 10</span></div>
      <button className={styles.menuButton} type="button" aria-label="Menu do jogo">☰</button>
    </header>

    <main className={styles.content}>
      {screen === "home" ? <section className={styles.lobby}>
        <header className={styles.season}><div><p className="eyebrow">Temporada · Caminho da Luz</p><h2>Apostolic Arena</h2><small>{dailyName} ativo hoje</small></div><div className={styles.trophies}>🏆 {trophies}</div></header>
        <div className={styles.lobbyActions}>
          <div className={styles.arenaName}><p>Arena 1</p><h2>{arena?.name ?? "Vale do Carvalho"}</h2><p>{deckCount}/8 cartas no baralho ativo</p></div>
          <div className={styles.actionGrid}><button className={styles.battle} type="button" onClick={() => setScreen("battle")}>⚔ BATALHA</button><button className={styles.secondary} type="button" onClick={() => setScreen("world")}>♜ Arenas e Raids</button></div>
          <div className={styles.chests}>{[["🎁","Baú gratuito","Disponível"],["🧰","Baú de prata","3h"],["🏺","Baú de ouro","8h"],["✨","Baú da aliança","12h"]].map(([icon,name,time]) => <button className={styles.chest} type="button" key={name} onClick={() => setScreen("rewards")}><span>{icon}</span><b>{name}</b><small>{time}</small></button>)}</div>
        </div>
      </section> : <section className={styles.embedded}>
        <header className={styles.screenHeader}><div><p className="eyebrow">Apostolic Arena</p><h2>{title}</h2></div><button className={styles.back} type="button" onClick={() => setScreen("home")}>← Início</button></header>
        {screen === "cards" && <ArenaCardGallery />}
        {screen === "battle" && <ApostolicArenaPhaser />}
        {screen === "world" && <ArenaWorldRoadmap />}
        {screen === "rewards" && <section className={styles.rewards}><p className="eyebrow">Baús de estudo</p><h2>Recompensas numa única jornada</h2><div className={styles.rewardGrid}>{[["🎁","Madeira","Grátis e instantâneo"],["🧰","Prata","100–150 moedas e 10 cartas"],["🏺","Ouro","300–450 moedas e 30 cartas"],["✨","Aliança","Missões cooperativas"],["🌟","Apocalíptico","Conclusão de curso ou troféus"]].map(([icon,name,description]) => <article className={styles.reward} key={name}><span>{icon}</span><h3>Baú de {name}</h3><p>{description}</p><button type="button" disabled>Em desenvolvimento</button></article>)}</div></section>}
      </section>}
    </main>

    <nav className={styles.bottomNav} aria-label="Menu do Apostolic Arena">
      <button type="button" className={screen === "home" ? styles.active : ""} onClick={() => setScreen("home")}><span>⌂</span><strong>Início</strong></button>
      <button type="button" className={screen === "cards" ? styles.active : ""} onClick={() => setScreen("cards")}><span>▣</span><strong>Cartas</strong></button>
      <button type="button" className={`${styles.battleNav} ${screen === "battle" ? styles.active : ""}`} onClick={() => setScreen("battle")}><span>⚔</span><strong>Batalha</strong></button>
      <button type="button" className={screen === "world" ? styles.active : ""} onClick={() => setScreen("world")}><span>♜</span><strong>Arenas</strong></button>
      <button type="button" className={screen === "rewards" ? styles.active : ""} onClick={() => setScreen("rewards")}><span>🎁</span><strong>Baús</strong></button>
    </nav>
  </section>;
}
