"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ARENA_CARD_CATALOG } from "../lib/apostolic-arena-card-catalog";
import { arenaForTrophies, dailyEventFor } from "../lib/apostolic-arena-world";
import { ApostolicArena3DScene } from "./apostolic-arena-3d-scene";
import { ApostolicArenaPhaser } from "./apostolic-arena-phaser";
import { ArenaCardGallery } from "./arena-card-gallery";
import { ArenaWorldRoadmap } from "./arena-world-roadmap";
import styles from "./apostolic-arena-3d-experience.module.css";

type ExperiencePhase = "loading" | "menu" | "battle" | "cards" | "world" | "rewards";
const DECK_STORAGE_KEY = "apostolic-arena-active-deck";

export function ApostolicArena3DExperience({ onExit }: { onExit: () => void }) {
  const shellRef = useRef<HTMLElement>(null);
  const [phase, setPhase] = useState<ExperiencePhase>("loading");
  const [progress, setProgress] = useState(8);
  const [loadingLabel, setLoadingLabel] = useState("Iniciando jornada");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [deckIds, setDeckIds] = useState<number[]>([]);
  const trophies = 5280;
  const arena = arenaForTrophies(trophies);
  const dailyName = useMemo(() => dailyEventFor(new Date())?.name ?? "Missão da Aliança", []);
  const deck = useMemo(() => {
    const selected = deckIds.map((id) => ARENA_CARD_CATALOG.find((card) => card.id === id)).filter(Boolean);
    return (selected.length ? selected : ARENA_CARD_CATALOG.slice(0, 4)).slice(0, 4);
  }, [deckIds]);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(DECK_STORAGE_KEY) ?? "[]") as number[];
      if (Array.isArray(saved)) setDeckIds(saved.slice(0, 8));
    } catch { setDeckIds([]); }
  }, []);

  useEffect(() => {
    const update = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);

  const updateProgress = useCallback((value: number, label: string) => {
    setProgress((current) => Math.max(current, value));
    setLoadingLabel(label);
  }, []);

  const loadingReady = useCallback(() => {
    window.setTimeout(() => setPhase("menu"), 550);
  }, []);

  const requestFullscreen = async () => {
    if (document.fullscreenElement) return;
    try { await shellRef.current?.requestFullscreen(); } catch { /* Fullscreen remains available through the explicit button. */ }
  };

  const leave = async () => {
    if (document.fullscreenElement) await document.exitFullscreen().catch(() => undefined);
    onExit();
  };

  return <section ref={shellRef} className={styles.experience} aria-label="Apostolic Arena 3D">
    {phase === "loading" ? <section className={styles.loading} aria-live="polite">
      <div className={styles.scene}><ApostolicArena3DScene mode="loading" onProgress={updateProgress} onReady={loadingReady} /></div>
      <div className={styles.loadingPanel}>
        <span className={styles.lightMark}>A</span>
        <p>APOSTOLIC ARENA</p>
        <h2>Preparando o Salão dos Campeões</h2>
        <div className={styles.progress}><i style={{ width: `${progress}%` }} /></div>
        <strong>{Math.round(progress)}%</strong>
        <small>{loadingLabel}</small>
      </div>
    </section> : phase === "menu" ? <section className={styles.menu}>
      <div className={styles.scene}><ApostolicArena3DScene mode="menu" /></div>
      <header className={styles.topbar}>
        <div className={styles.profile}><span>R</span><div><b>Raphael</b><small>Nível 14 · Guardião da Luz</small></div></div>
        <div className={styles.resources}><span>◉ 25.430</span><span>◆ 3.280</span></div>
        <div className={styles.windowActions}>
          {!isFullscreen && <button type="button" onClick={requestFullscreen} aria-label="Ativar tela cheia">⛶</button>}
          <button type="button" onClick={leave} aria-label="Sair do Apostolic Arena">×</button>
        </div>
      </header>

      <aside className={`${styles.banner} ${styles.eventBanner}`}><b>EVENTO</b><small>{dailyName}</small></aside>
      <aside className={`${styles.banner} ${styles.missionBanner}`}><b>MISSÕES</b><small>2 de 3 batalhas</small><i><em /></i></aside>

      <section className={styles.league}>
        <span>◆</span><div><small>LIGA ATUAL</small><b>{arena?.name ?? "Vale do Carvalho"}</b><em>🏆 {trophies} / 6000</em></div>
      </section>

      <section className={styles.deckPreview} aria-label="Baralho ativo">
        {deck.map((card) => card && <button type="button" key={card.id} onClick={() => setPhase("cards")}>
          <img src={card.portrait} alt={card.name} />
          <b>{card.faith}</b>
        </button>)}
      </section>

      <section className={styles.chests} aria-label="Baús">
        {[["Madeira","PRONTO"],["Prata","3h 14m"],["Ouro","8h 27m"],["Aliança","12h"]].map(([name,time], index) => <button type="button" key={name} onClick={() => setPhase("rewards")} className={index === 0 ? styles.ready : ""}><span>◇</span><b>{name}</b><small>{time}</small></button>)}
      </section>

      <button type="button" className={styles.battleButton} onClick={() => setPhase("battle")}><span>⚔</span>BATALHAR</button>

      <nav className={styles.bottomNav} aria-label="Navegação do Apostolic Arena">
        <button type="button" className={styles.active}><span>⌂</span><b>INÍCIO</b></button>
        <button type="button" onClick={() => setPhase("cards")}><span>▣</span><b>CARTAS</b></button>
        <button type="button" onClick={() => setPhase("world")}><span>✦</span><b>JORNADA</b></button>
        <button type="button" onClick={() => setPhase("rewards")}><span>◇</span><b>BAÚS</b></button>
        <button type="button" onClick={leave}><span>↩</span><b>SAIR</b></button>
      </nav>
    </section> : <section className={styles.module}>
      <header className={styles.moduleHeader}>
        <button type="button" onClick={() => setPhase("menu")}>← Menu 3D</button>
        <strong>{phase === "battle" ? "Batalha" : phase === "cards" ? "Cartas e baralho" : phase === "world" ? "Jornada" : "Baús e recompensas"}</strong>
        <div><button type="button" onClick={requestFullscreen} aria-label="Ativar tela cheia">⛶</button><button type="button" onClick={leave} aria-label="Sair">×</button></div>
      </header>
      <main className={styles.moduleContent}>
        {phase === "battle" && <ApostolicArenaPhaser />}
        {phase === "cards" && <ArenaCardGallery />}
        {phase === "world" && <ArenaWorldRoadmap />}
        {phase === "rewards" && <section className={styles.rewardPanel}><p className="eyebrow">Recompensas da jornada</p><h2>Baús interativos</h2><p>As cartas e probabilidades existentes serão preservadas. A abertura 3D será ligada à persistência numa sprint própria.</p><button type="button" onClick={() => setPhase("menu")}>Voltar ao Salão</button></section>}
      </main>
    </section>}
  </section>;
}
