"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { arenaForTrophies, dailyEventFor } from "../lib/apostolic-arena-world";
import { ApostolicArenaPhaser } from "./apostolic-arena-phaser";
import { ArenaCardGallery } from "./arena-card-gallery";
import { ArenaWorldRoadmap } from "./arena-world-roadmap";
import styles from "./apostolic-arena-game.module.css";
import v47Styles from "./apostolic-arena-game-v47.module.css";
import v471Styles from "./apostolic-arena-game-v471.module.css";
import v472Styles from "./apostolic-arena-game-v472.module.css";

type ArenaScreen = "home" | "cards" | "battle" | "world" | "rewards";
const DECK_STORAGE_KEY = "apostolic-arena-active-deck";
const CHESTS = [
  { id:"wood", name:"Madeira", image:"/games/apostolic-arena/chests/wooden-chest-v1.webp", timer:"Disponível", reward:"40 moedas + 3 cartas", ready:true },
  { id:"silver", name:"Prata", image:"/games/apostolic-arena/chests/silver-chest-v1.webp", timer:"3h", reward:"120 moedas + 10 cartas", ready:false },
  { id:"gold", name:"Ouro", image:"/games/apostolic-arena/chests/golden-chest-v1.webp", timer:"8h", reward:"400 moedas + 30 cartas", ready:false },
  { id:"alliance", name:"Aliança", image:"/games/apostolic-arena/chests/alliance-chest-v1.webp", timer:"12h", reward:"Missão cooperativa", ready:false }
] as const;

export function ApostolicArenaGame() {
  const [screen, setScreen] = useState<ArenaScreen>("home");
  const [deckCount, setDeckCount] = useState(0);
  const [dailyName, setDailyName] = useState("Evento diário");
  const [selectedChest, setSelectedChest] = useState<(typeof CHESTS)[number] | null>(null);
  const [opening, setOpening] = useState(false);
  const [reward, setReward] = useState<string | null>(null);
  const lobbyRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLElement>(null);
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
  const navigate = (next: ArenaScreen) => {
    const transitionDocument = document as Document & { startViewTransition?: (update: () => void) => void };
    const update = () => {
      setSelectedChest(null); setReward(null); setOpening(false); setScreen(next);
      window.requestAnimationFrame(() => contentRef.current?.scrollTo({ top: 0, behavior: "instant" }));
    };
    if (transitionDocument.startViewTransition) transitionDocument.startViewTransition(update);
    else update();
  };
  const moveLobby = (event: PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - .5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - .5) * 2;
    event.currentTarget.style.setProperty("--look-x", `${x * 8}px`);
    event.currentTarget.style.setProperty("--look-y", `${y * 6}px`);
  };
  const openChest = () => {
    if (!selectedChest?.ready || opening) return;
    setOpening(true);
    window.setTimeout(() => { setOpening(false); setReward(selectedChest.reward); }, 900);
  };

  return <section className={`${styles.game} ${v471Styles.game} ${v472Styles.game}`} aria-label="Jogo Apostolic Arena">
    <header className={styles.topbar}>
      <div className={styles.identity}><span className={styles.avatar}>A</span><div><strong>Raphael</strong><small>Nível 1 · Discípulo</small></div></div>
      <div className={styles.currency}><span>🪙 250</span><span>💎 10</span></div>
      <button className={styles.menuButton} type="button" aria-label="Menu do jogo">☰</button>
    </header>

    <main ref={contentRef} className={styles.content}>
      {screen === "home" ? <section ref={lobbyRef} className={styles.lobby} onPointerMove={moveLobby} onPointerLeave={(event) => { event.currentTarget.style.setProperty("--look-x","0px"); event.currentTarget.style.setProperty("--look-y","0px"); }}>
        <header className={styles.season}><div><p className="eyebrow">Temporada · Caminho da Luz</p><h2>Apostolic Arena</h2><small>{dailyName} ativo hoje</small></div><div className={styles.trophies}>🏆 {trophies}</div></header>
        <div className={styles.lobbyActions}>
          <div className={styles.arenaName}><p>Arena 1</p><h2>{arena?.name ?? "Vale do Carvalho"}</h2><p>{deckCount}/8 cartas no baralho ativo</p></div>
          <div className={styles.actionGrid}><button className={styles.battle} type="button" onClick={() => navigate("battle")}><span>⚔</span>BATALHA<small>Partida de treino</small></button><button className={styles.secondary} type="button" onClick={() => navigate("world")}>♜ Arenas e Raids<small>12 regiões bíblicas</small></button></div>
          <div className={styles.chests}>{CHESTS.map((chest) => <button className={`${styles.chest} ${v472Styles.chest} ${chest.ready ? v47Styles.readyChest : ""}`} type="button" key={chest.id} onClick={() => setSelectedChest(chest)}><img src={chest.image} alt={`Baú de ${chest.name}`} width={120} height={120}/><b>{chest.name}</b><small>{chest.timer}</small>{chest.ready && <em>Abrir</em>}</button>)}</div>
        </div>
      </section> : <section className={styles.embedded}>
        <header className={styles.screenHeader}><div><p className="eyebrow">Apostolic Arena</p><h2>{title}</h2></div><button className={styles.back} type="button" onClick={() => navigate("home")}>← Início</button></header>
        {screen === "cards" && <ArenaCardGallery />}
        {screen === "battle" && <ApostolicArenaPhaser />}
        {screen === "world" && <ArenaWorldRoadmap />}
        {screen === "rewards" && <section className={styles.rewards}><p className="eyebrow">Baús de estudo</p><h2>Recompensas numa única jornada</h2><div className={styles.rewardGrid}>{CHESTS.map((chest) => <button className={`${styles.reward} ${v472Styles.rewardCard}`} key={chest.id} type="button" onClick={() => setSelectedChest(chest)}><img src={chest.image} alt="" width={220} height={220}/><h3>Baú de {chest.name}</h3><p>{chest.reward}</p><span>{chest.ready ? "Disponível agora" : `Abre em ${chest.timer}`}</span></button>)}</div></section>}
      </section>}
    </main>

    <nav className={styles.bottomNav} aria-label="Menu do Apostolic Arena">
      <button type="button" className={screen === "home" ? styles.active : ""} onClick={() => navigate("home")}><span>⌂</span><strong>Início</strong></button>
      <button type="button" className={screen === "cards" ? styles.active : ""} onClick={() => navigate("cards")}><span>▣</span><strong>Cartas</strong></button>
      <button type="button" className={`${styles.battleNav} ${screen === "battle" ? styles.active : ""}`} onClick={() => navigate("battle")}><span>⚔</span><strong>Batalha</strong></button>
      <button type="button" className={screen === "world" ? styles.active : ""} onClick={() => navigate("world")}><span>♜</span><strong>Arenas</strong></button>
      <button type="button" className={screen === "rewards" ? styles.active : ""} onClick={() => navigate("rewards")}><span>🎁</span><strong>Baús</strong></button>
    </nav>
    {selectedChest && <div className={v47Styles.chestOverlay} role="presentation" onClick={() => { if (!opening) { setSelectedChest(null); setReward(null); } }}>
      <section className={`${v47Styles.chestDialog} ${v472Styles.dialog}`} role="dialog" aria-modal="true" aria-labelledby="chest-title" onClick={(event) => event.stopPropagation()}>
        <button className={v47Styles.close} type="button" onClick={() => { setSelectedChest(null); setReward(null); }} aria-label="Fechar">×</button>
        <div className={`${v47Styles.openingChest} ${v472Styles.dialogArt} ${opening ? v47Styles.isOpening : ""} ${reward ? v47Styles.isOpen : ""}`}>
          <img src={selectedChest.image} alt="" width={360} height={360}/><i/><i/><i/>
        </div>
        <p className="eyebrow">{selectedChest.ready ? "Recompensa disponível" : `Tempo restante: ${selectedChest.timer}`}</p>
        <h2 id="chest-title">Baú de {selectedChest.name}</h2>
        {reward ? <div className={v47Styles.rewardReveal}><strong>✨ {reward}</strong><p>Recompensa de demonstração. A gravação definitiva será ligada ao perfil.</p></div> : <p>{selectedChest.reward}</p>}
        <button className={`${v47Styles.openButton} ${v472Styles.dialogButton}`} type="button" disabled={!selectedChest.ready || opening || Boolean(reward)} onClick={openChest}>{opening ? "A abrir…" : reward ? "Recolhido" : selectedChest.ready ? "Abrir baú" : "Em contagem"}</button>
      </section>
    </div>}
  </section>;
}
