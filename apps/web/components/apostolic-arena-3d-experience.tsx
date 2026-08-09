"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ARENA_CARD_CATALOG } from "../lib/apostolic-arena-card-catalog";
import { arenaForTrophies, dailyEventFor } from "../lib/apostolic-arena-world";
import { ApostolicArena3DScene, type ArenaPowerSignal, type ArenaSceneChampion } from "./apostolic-arena-3d-scene";
import { ApostolicArenaBattle3D } from "./apostolic-arena-battle-3d";
import { ArenaCollectionV17 } from "./arena-collection-v17";
import { ArenaChestsV18 } from "./arena-chests-v18";
import { CHEST_DEFINITIONS, grantBattleProgress, loadArenaChests, type ArenaChestState } from "../lib/apostolic-arena-chests-v18";
import { BIBLICAL_ARENAS, loadArenaProgression, type ArenaPlayerProgression } from "../lib/apostolic-arena-progression-v17";
import { ArenaWorldRoadmap } from "./arena-world-roadmap";
import { ArenaMatchIntroV203 } from "./arena-match-intro-v20-3";
import { ArenaTutorialV206, ARENA_TUTORIAL_COMPLETE_KEY_V206 } from "./arena-tutorial-v20-6";
import { arenaThemeForProgression } from "../lib/apostolic-arena-themes-v20";
import { chooseRandomFieldV203, SELECTED_FIELD_STORAGE_KEY_V203 } from "../lib/apostolic-arena-presentations-v20-3";
import styles from "./apostolic-arena-3d-experience.module.css";
import loadingStyles from "./apostolic-arena-loading-v2.module.css";
import squadStyles from "./apostolic-arena-squad-v3.module.css";

type ExperiencePhase = "loading" | "tutorial" | "menu" | "arenaPreview" | "battle" | "cards" | "world" | "rewards";
const DECK_STORAGE_KEY = "apostolic-arena-active-deck";
const LAST_LOADING_SCENE_KEY = "apostolic-arena-last-loading-scene";
const FEATURED_DASHBOARD_IDS = [117, 119, 121, 125] as const;
const POWER_COPY: Record<number, { name: string; description: string }> = {
  117: { name: "Abrir as Águas", description: "Imunidade à paralisia por 4s" },
  119: { name: "Harpa Real", description: "Impede ataques inimigos por 3s" },
  121: { name: "Frenesi", description: "Dobra a velocidade de ataque por 4s" },
  125: { name: "Escudo da Juíza", description: "Protege os aliados com 200 HP" }
};

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
  const [powerSignal, setPowerSignal] = useState<ArenaPowerSignal | null>(null);
  const [selectedChampionId, setSelectedChampionId] = useState<number>(117);
  const [chestState, setChestState] = useState<ArenaChestState>(() => loadArenaChests());
  const [chestNotice, setChestNotice] = useState<string | null>(null);
  const [playerProgression, setPlayerProgression] = useState<ArenaPlayerProgression>(() => loadArenaProgression());
  const trophies = playerProgression.trophies;
  const currentArenaIndex = BIBLICAL_ARENAS.reduce((latest, entry, index) => trophies >= entry.trophies && playerProgression.playerLevel >= entry.level ? index : latest, 0);
  const currentArenaTheme = arenaThemeForProgression(playerProgression).theme;
  const arena = arenaForTrophies(trophies);
  const dailyName = useMemo(() => dailyEventFor(new Date())?.name ?? "Missão da Aliança", []);
  const loadingScene = LOADING_SCENES[loadingSceneIndex] ?? LOADING_SCENES[0]!;
  const deck = useMemo(() => {
    const selected = deckIds.map((id) => ARENA_CARD_CATALOG.find((card) => card.id === id)).filter(Boolean);
    return selected.slice(0, 4);
  }, [deckIds]);
  const featuredDashboardCards = useMemo(() => FEATURED_DASHBOARD_IDS.flatMap((id) => {
    const card = ARENA_CARD_CATALOG.find((entry) => entry.id === id);
    return card ? [card] : [];
  }), []);
  const menuChampions = useMemo<ArenaSceneChampion[]>(() => featuredDashboardCards.filter((card) => card.id === selectedChampionId).flatMap((card) => card ? [{
    id: card.id,
    name: card.name,
    rarity: card.rarity,
    faith: card.faith,
    type: card.type
  }] : []), [featuredDashboardCards, selectedChampionId]);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(DECK_STORAGE_KEY) ?? "[]") as number[];
      if (Array.isArray(saved) && saved.length) {
        const savedDeck = saved.slice(0, 8);
        setDeckIds(savedDeck);
        const champion = savedDeck.find((id) => FEATURED_DASHBOARD_IDS.includes(id as typeof FEATURED_DASHBOARD_IDS[number]));
        if (champion) setSelectedChampionId(champion);
      } else {
        setDeckIds([]);
      }
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

  useEffect(() => {
    if (phase !== "loading") return;
    const recoveryTimer = window.setTimeout(() => {
      setProgress(100);
      setLoadingLabel("Modo compatível pronto");
      setPhase(window.localStorage.getItem(ARENA_TUTORIAL_COMPLETE_KEY_V206) === "1" ? "menu" : "tutorial");
    }, 9000);
    return () => window.clearTimeout(recoveryTimer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "menu") return;
    setPlayerProgression(loadArenaProgression());
    setChestState(loadArenaChests());
  }, [phase]);

  const updateProgress = useCallback((value: number, label: string) => {
    setProgress((current) => Math.max(current, value));
    setLoadingLabel(label);
  }, []);

  const loadingReady = useCallback(() => {
    window.setTimeout(() => setPhase(window.localStorage.getItem(ARENA_TUTORIAL_COMPLETE_KEY_V206) === "1" ? "menu" : "tutorial"), 550);
  }, []);

  const requestFullscreen = async () => {
    if (document.fullscreenElement) return;
    try { await shellRef.current?.requestFullscreen(); } catch { /* Fullscreen remains available through the explicit button. */ }
  };

  const leave = async () => {
    if (document.fullscreenElement) await document.exitFullscreen().catch(() => undefined);
    onExit();
  };

  const activatePower = (championId: number) => {
    setPowerSignal({ championId, nonce: Date.now() });
  };

  const selectChampion = (championId: number) => {
    setSelectedChampionId(championId);
  };

  const recordBattleResult = useCallback((result: "victory" | "defeat" | "draw") => {
    if (result === "draw") return;
    const outcome = grantBattleProgress(result === "victory");
    setChestState(outcome.state);
    if (result === "victory") setChestNotice(outcome.added ? `Novo ${CHEST_DEFINITIONS[outcome.kind].name} recebido no espaço ${outcome.slot + 1}` : "Vitória registrada, mas os quatro espaços de baús estão ocupados");
    setPlayerProgression(loadArenaProgression());
  }, []);

  const enterRandomField = useCallback(() => {
    const selection = chooseRandomFieldV203(currentArenaTheme.id);
    try { window.sessionStorage.setItem(SELECTED_FIELD_STORAGE_KEY_V203, JSON.stringify({ arenaId: currentArenaTheme.id, fieldId: selection.field.id, index: selection.index })); } catch { /* Storage is optional. */ }
    setPhase("battle");
  }, [currentArenaTheme.id]);

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
    </section> : phase === "tutorial" ? <ArenaTutorialV206 onComplete={() => setPhase("menu")} /> : phase === "menu" ? <section className={styles.menu}>
      <div className={styles.scene}><ApostolicArena3DScene mode="menu" champions={menuChampions} powerSignal={powerSignal} /></div>
      <header className={styles.topbar}>
        <div className={styles.profile}><span>R</span><div><b>Raphael</b><small>Nível {playerProgression.playerLevel} · Guardião da Luz</small></div></div>
        <div className={styles.resources}><span>◉ {playerProgression.gold.toLocaleString("pt-PT")}</span><span>◆ 3.280</span></div>
        <div className={styles.windowActions}>
          {!isFullscreen && <button type="button" onClick={requestFullscreen} aria-label="Ativar tela cheia">⛶</button>}
          <button type="button" onClick={leave} aria-label="Sair do Apostolic Arena">×</button>
        </div>
      </header>

      <aside className={`${styles.banner} ${styles.eventBanner}`}><b>EVENTO</b><small>{dailyName}</small></aside>
      <aside className={`${styles.banner} ${styles.missionBanner}`}><b>MISSÕES</b><small>2 de 3 batalhas</small><i><em /></i></aside>

      <section className={styles.league}>
        <span>◆</span><div><small>ARENA ATUAL</small><b>{BIBLICAL_ARENAS[currentArenaIndex]?.name ?? arena?.name ?? "Primeiro Chamado"}</b><em>🏆 {trophies} / {BIBLICAL_ARENAS[currentArenaIndex + 1]?.trophies ?? 6000}</em></div>
      </section>

      <section className={squadStyles.squadRoster} aria-label="Quatro personagens principais do baralho">
        {menuChampions.map((champion) => <article key={champion.id} data-rarity={champion.rarity}>
          <small>◆ {champion.faith} FÉ</small>
          <b>{champion.name}</b>
          <span>{POWER_COPY[champion.id]?.description}</span>
          <button type="button" onClick={() => activatePower(champion.id)}>{POWER_COPY[champion.id]?.name ?? "Ativar poder"}</button>
        </article>)}
      </section>

      <section className={squadStyles.championSelector} aria-label="Selecionar Campeão principal">
        {featuredDashboardCards.map((champion) => <button
          type="button"
          key={champion.id}
          data-active={champion.id === selectedChampionId}
          aria-pressed={champion.id === selectedChampionId}
          onClick={() => selectChampion(champion.id)}
        >
          <img src={champion.portrait} alt="" aria-hidden="true" />
          <span>{champion.name}</span>
        </button>)}
      </section>

      <section className={styles.deckPreview} aria-label="Baralho ativo">
        {deck.map((card) => card && <button type="button" key={card.id} onClick={() => setPhase("cards")}>
          <img src={card.portrait} alt={card.name} />
          <b>{card.faith}</b>
        </button>)}
      </section>

      <section className={styles.chests} aria-label="Baús">
        {chestState.slots.map((chest, index) => {
          const ready = Boolean(chest?.readyAt && chest.readyAt <= Date.now());
          const definition = chest ? CHEST_DEFINITIONS[chest.kind] : null;
          return <button type="button" key={chest?.id ?? index} data-kind={chest?.kind ?? "empty"} data-ready={ready} onClick={() => { setChestNotice(null); setPhase("rewards"); }} className={ready ? styles.ready : ""}><span>✦</span><b>{definition?.name.replace("Baú de ", "").replace("Baú da ", "") ?? "Vazio"}</b><small>{ready ? "PRONTO" : chest?.readyAt ? "ABRINDO" : chest ? `${definition?.hours}h` : "GANHE"}</small></button>;
        })}
      </section>

      {chestNotice && <button type="button" className={styles.chestNotice} onClick={() => { setChestNotice(null); setPhase("rewards"); }}>{chestNotice}<span>VER BAÚS →</span></button>}

      <button type="button" className={styles.battleButton} disabled={deckIds.length !== 8} onClick={() => setPhase("arenaPreview")}><span>⚔</span>{deckIds.length === 8 ? "BATALHAR" : `ESCOLHA 8 CARTAS (${deckIds.length}/8)`}</button>

      <nav className={styles.bottomNav} aria-label="Navegação do Apostolic Arena">
        <button type="button" className={styles.active}><span>⌂</span><b>INÍCIO</b></button>
        <button type="button" onClick={() => setPhase("cards")}><span>▣</span><b>CARTAS</b></button>
        <button type="button" onClick={() => setPhase("world")}><span>✦</span><b>JORNADA</b></button>
        <button type="button" onClick={() => setPhase("rewards")}><span>◇</span><b>BAÚS</b></button>
        <button type="button" onClick={leave}><span>↩</span><b>SAIR</b></button>
      </nav>
    </section> : phase === "arenaPreview" ? <ArenaMatchIntroV203 arenaId={currentArenaTheme.id} onEnter={enterRandomField} onCancel={() => setPhase("menu")} /> : <section className={styles.module}>
      <header className={styles.moduleHeader}>
        <button type="button" onClick={() => setPhase("menu")}>← Menu 3D</button>
        <strong>{phase === "battle" ? "Batalha" : phase === "cards" ? "Cartas e baralho" : phase === "world" ? "Jornada" : "Baús e recompensas"}</strong>
        <div><button type="button" onClick={requestFullscreen} aria-label="Ativar tela cheia">⛶</button><button type="button" onClick={leave} aria-label="Sair">×</button></div>
      </header>
      <main className={styles.moduleContent}>
        {phase === "battle" && <ApostolicArenaBattle3D onResult={recordBattleResult} />}
        {phase === "cards" && <ArenaCollectionV17 initialDeck={deckIds} onDeckChange={(ids) => {
          setDeckIds(ids);
          const champion = ids.find((id) => FEATURED_DASHBOARD_IDS.includes(id as typeof FEATURED_DASHBOARD_IDS[number]));
          if (champion) setSelectedChampionId(champion);
        }} onBattleTest={() => setPhase("arenaPreview")} />}
        {phase === "world" && <ArenaWorldRoadmap onProgressionChange={setPlayerProgression} onBattle={() => setPhase("arenaPreview")} onTraining={() => setPhase("tutorial")} />}
        {phase === "rewards" && <ArenaChestsV18 onStateChange={setChestState} />}
      </main>
    </section>}
  </section>;
}
