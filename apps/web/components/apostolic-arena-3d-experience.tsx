"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ARENA_CARD_CATALOG } from "../lib/apostolic-arena-card-catalog";
import { arenaForTrophies, dailyEventFor } from "../lib/apostolic-arena-world";
import { ApostolicArena3DScene, type ArenaSceneChampion } from "./apostolic-arena-3d-scene";
import { ApostolicArenaPhaser } from "./apostolic-arena-phaser";
import { ArenaCardGallery } from "./arena-card-gallery";
import { ArenaWorldRoadmap } from "./arena-world-roadmap";
import styles from "./apostolic-arena-3d-experience.module.css";
import loadingStyles from "./apostolic-arena-loading-v2.module.css";
import squadStyles from "./apostolic-arena-squad-v3.module.css";

type ExperiencePhase = "loading" | "menu" | "battle" | "cards" | "world" | "rewards";
const DECK_STORAGE_KEY = "apostolic-arena-active-deck";
const LAST_LOADING_SCENE_KEY = "apostolic-arena-last-loading-scene";

const LOADING_SCENES = [
  {
    image: "/games/apostolic-arena/loading/arena-loading-heroes-da-alianca-v1.webp",
    eyebrow: "A jornada começa",
    title: "Heróis da Aliança",
    description: "Davi, Josué e Gideão avançam juntos para defender as torres da luz."
  },
  {
    image: "/games/apostolic-arena/loading/arena-loading-fogo-do-ceu-v1.webp",
    eyebrow: "Evento celestial",
    title: "Fogo sobre a Arena",
    description: "O céu anuncia uma batalha em que posicionamento e coragem decidirão a vitória."
  },
  {
    image: "/games/apostolic-arena/loading/arena-loading-guardias-da-fe-v1.webp",
    eyebrow: "Forme sua defesa",
    title: "Guardiãs da Fé",
    description: "Débora, Ester e Rute protegem o cristal com arqueiros, pastores e sentinelas."
  },
  {
    image: "/games/apostolic-arena/loading/arena-loading-caminho-das-aguas-v1.webp",
    eyebrow: "Domine as pontes",
    title: "O Caminho das Águas",
    description: "Duas fortalezas se enfrentam, mas somente uma estratégia atravessará o rio."
  },
  {
    image: "/games/apostolic-arena/loading/arena-loading-salao-dos-campeoes-v1.webp",
    eyebrow: "Reúna seu baralho",
    title: "Salão dos Campeões",
    description: "Reis, profetas, pastores e guerreiros aguardam o chamado para entrar no portal."
  }
] as const;

const LOADING_TIPS = [
  "A Fé regenera durante a batalha. Guarde energia para combinar duas cartas no momento certo.",
  "Seu baralho possui 8 cartas, mas apenas 4 ficam disponíveis na mão durante a partida.",
  "As duas pontes são pontos estratégicos: controle uma delas antes de avançar contra as torres.",
  "Cartas usadas voltam ao final da rotação. Antecipe o próximo ciclo para preparar sua defesa.",
  "Comuns, Raras, Épicas, Lendárias e Campeões têm cores próprias para facilitar a leitura do baralho.",
  "Arraste uma carta para a arena e observe o custo de Fé antes de confirmar a invocação.",
  "Destruir a torre central decide a batalha imediatamente. Proteja seu templo até o último instante.",
  "Equilibre tropas rápidas, defensores e habilidades de área para responder a estratégias diferentes."
] as const;

export function ApostolicArena3DExperience({ onExit }: { onExit: () => void }) {
  const shellRef = useRef<HTMLElement>(null);
  const [phase, setPhase] = useState<ExperiencePhase>("loading");
  const [progress, setProgress] = useState(8);
  const [loadingLabel, setLoadingLabel] = useState("Iniciando jornada");
  const [loadingSceneIndex, setLoadingSceneIndex] = useState(0);
  const [loadingTipIndex, setLoadingTipIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [deckIds, setDeckIds] = useState<number[]>([]);
  const trophies = 5280;
  const arena = arenaForTrophies(trophies);
  const dailyName = useMemo(() => dailyEventFor(new Date())?.name ?? "Missão da Aliança", []);
  const loadingScene = LOADING_SCENES[loadingSceneIndex] ?? LOADING_SCENES[0]!;
  const deck = useMemo(() => {
    const selected = deckIds.map((id) => ARENA_CARD_CATALOG.find((card) => card.id === id)).filter(Boolean);
    return (selected.length ? selected : ARENA_CARD_CATALOG.slice(0, 4)).slice(0, 4);
  }, [deckIds]);
  const menuChampions = useMemo<ArenaSceneChampion[]>(() => deck.flatMap((card) => card ? [{
    id: card.id,
    name: card.name,
    rarity: card.rarity,
    faith: card.faith,
    type: card.type
  }] : []), [deck]);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(DECK_STORAGE_KEY) ?? "[]") as number[];
      if (Array.isArray(saved)) setDeckIds(saved.slice(0, 8));
    } catch { setDeckIds([]); }
  }, []);

  useEffect(() => {
    let previous = -1;
    try { previous = Number(window.sessionStorage.getItem(LAST_LOADING_SCENE_KEY) ?? "-1"); } catch { /* Storage is optional. */ }
    let next = Math.floor(Math.random() * LOADING_SCENES.length);
    if (next === previous) next = (next + 1 + Math.floor(Math.random() * (LOADING_SCENES.length - 1))) % LOADING_SCENES.length;
    setLoadingSceneIndex(next);
    try { window.sessionStorage.setItem(LAST_LOADING_SCENE_KEY, String(next)); } catch { /* Storage is optional. */ }

    setLoadingTipIndex(Math.floor(Math.random() * LOADING_TIPS.length));
    const tipTimer = window.setInterval(() => {
      setLoadingTipIndex((current) => (current + 1 + Math.floor(Math.random() * (LOADING_TIPS.length - 1))) % LOADING_TIPS.length);
    }, 2800);
    return () => window.clearInterval(tipTimer);
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
    {phase === "loading" ? <section className={`${styles.loading} ${loadingStyles.loading}`} aria-live="polite">
      <img className={loadingStyles.loadingArtwork} src={loadingScene.image} alt="" aria-hidden="true" />
      <div className={`${styles.scene} ${loadingStyles.loadingEngine}`}><ApostolicArena3DScene mode="loading" onProgress={updateProgress} onReady={loadingReady} /></div>
      <div className={`${styles.loadingPanel} ${loadingStyles.loadingPanel}`}>
        <span className={`${styles.lightMark} ${loadingStyles.lightMark}`}>A</span>
        <p>{loadingScene.eyebrow}</p>
        <h2>{loadingScene.title}</h2>
        <span className={loadingStyles.loadingDescription}>{loadingScene.description}</span>
        <div className={styles.progress}><i style={{ width: `${progress}%` }} /></div>
        <strong>{Math.round(progress)}%</strong>
        <small>{loadingLabel}</small>
        <aside className={loadingStyles.loadingTip}><b>DICA DE BATALHA</b><span>{LOADING_TIPS[loadingTipIndex]}</span></aside>
      </div>
    </section> : phase === "menu" ? <section className={styles.menu}>
      <div className={styles.scene}><ApostolicArena3DScene mode="menu" champions={menuChampions} /></div>
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

      <section className={squadStyles.squadRoster} aria-label="Quatro personagens principais do baralho">
        {menuChampions.map((champion) => <article key={champion.id} data-rarity={champion.rarity}>
          <small>◆ {champion.faith} FÉ</small>
          <b>{champion.name}</b>
        </article>)}
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
