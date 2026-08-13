"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ARENA_CARD_CATALOG } from "../lib/apostolic-arena-card-catalog";
import { dailyEventFor } from "../lib/apostolic-arena-world";
import { ApostolicArena3DScene, type ArenaPowerSignal, type ArenaSceneChampion } from "./apostolic-arena-3d-scene";
import { ApostolicArenaBattle3D } from "./apostolic-arena-battle-3d";
import { ArenaCollectionV17 } from "./arena-collection-v17";
import { ArenaChestsV18 } from "./arena-chests-v18";
import { ArenaShopV38 } from "./arena-shop-v38";
import { ArenaAllianceV61 } from "./arena-alliance-v61";
import { ApostolicJourneyNationsV100 } from "./apostolic-journey-nations-v100";
import { ApostolicResearchCenterV110 } from "./apostolic-research-center-v110";
import { ApostolicCommerceCenterV115 } from "./apostolic-commerce-center-v115";
import { ApostolicProvinceMapV120 } from "./apostolic-province-map-v120";
import { ApostolicCityDefenseV125 } from "./apostolic-city-defense-v125";
import { ApostolicArmyMarchesV130 } from "./apostolic-army-marches-v130";
import { ApostolicSpyCenterV135 } from "./apostolic-spy-center-v135";
import { ApostolicCityAttacksV140 } from "./apostolic-city-attacks-v140";
import { ApostolicSiegeCenterV145 } from "./apostolic-siege-center-v145";
import { ApostolicBattleResultsV150 } from "./apostolic-battle-results-v150";
import { ApostolicInfirmaryV155 } from "./apostolic-infirmary-v155";
import { ApostolicCityV165 } from "./apostolic-city-v165";
import { createClient } from "../lib/supabase/client";
import { CHEST_DEFINITIONS, grantBattleProgress, loadArenaChests, type ArenaChestState } from "../lib/apostolic-arena-chests-v18";
import { loadArenaProgression, type ArenaPlayerProgression } from "../lib/apostolic-arena-progression-v17";
import { ArenaWorldRoadmap } from "./arena-world-roadmap";
import { ArenaMatchIntroV203 } from "./arena-match-intro-v20-3";
import { ArenaTutorialV206, ARENA_TUTORIAL_COMPLETE_KEY_V206 } from "./arena-tutorial-v20-6";
import { arenaThemeForProgression } from "../lib/apostolic-arena-themes-v20";
import { chooseRandomFieldV203, SELECTED_FIELD_STORAGE_KEY_V203 } from "../lib/apostolic-arena-presentations-v20-3";
import styles from "./apostolic-arena-3d-experience.module.css";
import loadingStyles from "./apostolic-arena-loading-v2.module.css";
import { useArenaMotionStage } from "../lib/use-arena-motion-stage";

type ExperiencePhase = "loading" | "tutorial" | "menu" | "arenaPreview" | "battle" | "cards" | "world" | "rewards" | "shop" | "alliance" | "nations" | "city" | "research" | "commerce" | "province" | "defense" | "armies" | "spies" | "attacks" | "sieges" | "results";
const STRATEGIC_ATTACK_KEY = "apostolic-strategic-attack-v140";
const DECK_STORAGE_KEY = "apostolic-arena-active-deck";
const SAVED_DECKS_KEY = "apostolic-arena-decks-v16";
const ACTIVE_DECK_SLOT_KEY = "apostolic-arena-active-deck-slot-v32";
const LAST_LOADING_SCENE_KEY = "apostolic-arena-last-loading-scene";
const POWER_COPY: Record<number, { name: string; description: string }> = {
  1: { name: "Disparo de Funda", description: "Ataque preciso à distância" },
  11: { name: "Oração Restauradora", description: "Restaura a vida de aliados próximos" },
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
  useArenaMotionStage(shellRef);
  const [phase, setPhase] = useState<ExperiencePhase>("loading");
  const [progress, setProgress] = useState(8);
  const [loadingLabel, setLoadingLabel] = useState("Iniciando jornada");
  const [loadingSceneIndex, setLoadingSceneIndex] = useState(0);
  const [loadingTipIndex, setLoadingTipIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [deckIds, setDeckIds] = useState<number[]>([]);
  const [activeDeckSlot, setActiveDeckSlot] = useState(1);
  const [powerSignal, setPowerSignal] = useState<ArenaPowerSignal | null>(null);
  const [gateSignal, setGateSignal] = useState(0);
  const [activeHeroId, setActiveHeroId] = useState<number | null>(null);
  const [isEnteringBattle, setIsEnteringBattle] = useState(false);
  const [chestState, setChestState] = useState<ArenaChestState>(() => loadArenaChests());
  const [chestNotice, setChestNotice] = useState<string | null>(null);
  const [chestOpening, setChestOpening] = useState(false);
  const [menuSceneReady, setMenuSceneReady] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const ambienceRef = useRef<HTMLAudioElement | null>(null);
  const [playerProgression, setPlayerProgression] = useState<ArenaPlayerProgression>(() => loadArenaProgression());
  const [arenaWallet, setArenaWallet] = useState(() => ({ coins: playerProgression.gold, gems: 100 }));
  const currentArenaTheme = arenaThemeForProgression(playerProgression).theme;
  const dailyName = useMemo(() => dailyEventFor(new Date())?.name ?? "Missão da Aliança", []);
  const loadingScene = LOADING_SCENES[loadingSceneIndex] ?? LOADING_SCENES[0]!;
  const menuCards = useMemo(() => {
    const unlocked = new Set(playerProgression.unlockedCardIds);
    const isCharacter = (type: string) => !/^(Feitiço|Construção|Utilidade|Tática|Superescudo)/i.test(type);
    const selected = deckIds.flatMap((id) => {
      const card = ARENA_CARD_CATALOG.find((entry) => entry.id === id);
      return card && unlocked.has(card.id) && isCharacter(card.type) ? [card] : [];
    });
    const starters = ARENA_CARD_CATALOG.filter((card) => unlocked.has(card.id) && isCharacter(card.type) && !selected.some((entry) => entry.id === card.id));
    return [...selected, ...starters].slice(0, 4);
  }, [deckIds, playerProgression.unlockedCardIds]);
  const menuChampions = useMemo<ArenaSceneChampion[]>(() => menuCards.map((card) => ({
    id: card.id,
    name: card.name,
    rarity: card.rarity,
    faith: card.faith,
    type: card.type,
    portrait: card.portrait
  })), [menuCards]);
  const hasReadyChest = chestState.slots.some((chest) => Boolean(chest?.readyAt && chest.readyAt <= Date.now()));

  useEffect(() => {
    try {
      const storedSlot = window.localStorage.getItem(ACTIVE_DECK_SLOT_KEY);
      let slot = Math.min(6, Math.max(1, Number(storedSlot ?? "1")));
      const savedDecks = JSON.parse(window.localStorage.getItem(SAVED_DECKS_KEY) ?? "{}") as Record<string, { name: string; ids: number[] }>;
      const saved = JSON.parse(window.localStorage.getItem(DECK_STORAGE_KEY) ?? "[]") as number[];
      const starters = ARENA_CARD_CATALOG.filter((card) => !/^(Feitiço|Construção|Utilidade|Tática|Superescudo)/i.test(card.type)).slice(0, 8).map((card) => card.id);
      if (savedDecks["1"]?.ids?.length !== 8) savedDecks["1"] = { name: "Personagens iniciais", ids: starters };

      const legacyDeck = Array.isArray(saved) ? saved.slice(0, 8) : [];
      const isDifferentFromStarters = legacyDeck.length === 8 && legacyDeck.some((id, index) => id !== starters[index]);
      if (isDifferentFromStarters && savedDecks["2"]?.ids?.length !== 8) {
        savedDecks["2"] = { name: "Meu baralho 2", ids: legacyDeck };
        if (!storedSlot) slot = 2;
      }

      const activeIds = savedDecks[String(slot)]?.ids?.length === 8 ? savedDecks[String(slot)]!.ids : savedDecks["1"]!.ids;
      if (activeIds === savedDecks["1"]!.ids) slot = 1;
      setActiveDeckSlot(slot);
      setDeckIds(activeIds);
      window.localStorage.setItem(SAVED_DECKS_KEY, JSON.stringify(savedDecks));
      window.localStorage.setItem(ACTIVE_DECK_SLOT_KEY, String(slot));
      window.localStorage.setItem(DECK_STORAGE_KEY, JSON.stringify(activeIds));
    } catch { setDeckIds([]); }
  }, []);

  const selectDeckSlot = (slot: number) => {
    try {
      const savedDecks = JSON.parse(window.localStorage.getItem(SAVED_DECKS_KEY) ?? "{}") as Record<string, { name: string; ids: number[] }>;
      const selected = savedDecks[String(slot)]?.ids ?? [];
      setActiveDeckSlot(slot);
      window.localStorage.setItem(ACTIVE_DECK_SLOT_KEY, String(slot));
      if (selected.length === 8) {
        setDeckIds(selected);
        window.localStorage.setItem(DECK_STORAGE_KEY, JSON.stringify(selected));
      } else setPhase("cards");
    } catch { setPhase("cards"); }
  };

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
    const audio = ambienceRef.current ?? new Audio();
    ambienceRef.current = audio;
    audio.loop = true;
    audio.volume = phase === "loading" ? 0.58 : 0.46;
    const nextSource = phase === "loading"
      ? "/games/apostolic-arena/audio/loading-celestial-v34.ogg"
      : phase === "menu"
        ? "/games/apostolic-arena/audio/cidadela-viva-v34.ogg"
        : "";
    if (!soundEnabled || !nextSource) {
      audio.pause();
      return;
    }
    if (!audio.src.endsWith(nextSource)) {
      audio.src = nextSource;
      audio.load();
    }
    void audio.play().catch(() => setSoundEnabled(false));
  }, [phase, soundEnabled]);

  useEffect(() => () => {
    ambienceRef.current?.pause();
    ambienceRef.current = null;
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
    setMenuSceneReady(false);
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

  const menuReady = useCallback(() => setMenuSceneReady(true), []);

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
    setActiveHeroId(championId);
    window.setTimeout(() => setActiveHeroId((current) => current === championId ? null : current), 1350);
  };


  const beginBattle = () => {
    if (deckIds.length !== 8 || isEnteringBattle) return;
    setIsEnteringBattle(true);
    setGateSignal(Date.now());
    window.setTimeout(() => {
      setIsEnteringBattle(false);
      setPhase("arenaPreview");
    }, 2300);
  };

  const recordBattleResult = useCallback((result: "victory" | "defeat" | "draw") => {
    try{const pending=JSON.parse(window.sessionStorage.getItem(STRATEGIC_ATTACK_KEY)??"null")as{id:string;token:string}|null;if(pending){void createClient().rpc("apostolic_resolve_city_attack",{p_attack_id:pending.id,p_battle_token:pending.token,p_result:result}).then(({error})=>{if(!error)window.sessionStorage.removeItem(STRATEGIC_ATTACK_KEY)});}}catch{/* strategic result remains recoverable on the server */}
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

  return <section ref={shellRef} className={styles.experience} data-apostolic-arena data-arena-theme="celestial-premium" aria-label="Apostolic Arena 3D">
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
    </section> : phase === "tutorial" ? <ArenaTutorialV206 onComplete={() => setPhase("menu")} /> : phase === "menu" ? <section className={styles.menu} data-entering={isEnteringBattle} data-scene-ready={menuSceneReady}>
      <div className={styles.scene}><ApostolicArena3DScene mode="menu" champions={menuChampions} powerSignal={powerSignal} gateSignal={gateSignal} chestReady={hasReadyChest || chestOpening} onReady={menuReady} /></div>
      {!menuSceneReady && <div className={styles.menuSceneLoading} role="status"><i /><b>PREPARANDO A CIDADELA</b><small>Cenário e heróis estão sendo posicionados…</small></div>}
      <div className={styles.ambientEffects} aria-hidden="true">
        <i className={styles.cloudVeil} />
        <i className={styles.cloudVeilFar} />
        <i className={styles.windStreaks} />
        <i className={styles.dustMotes} />
        <i className={`${styles.realFire} ${styles.fireLeft}`} />
        <i className={`${styles.realFire} ${styles.fireRight}`} />
        <i className={styles.embers} />
      </div>
      <button type="button" className={styles.exactProfileHit} onClick={() => setPhase("cards")} aria-label="Abrir perfil e heróis" />
      <nav className={styles.exactResourceHits} aria-label="Recursos e atalhos">
        <button type="button" onClick={() => setPhase("shop")} aria-label="Abrir loja de moedas" />
        <button type="button" onClick={() => setPhase("shop")} aria-label="Abrir loja de gemas" />
        <button type="button" onClick={() => setPhase("world")} aria-label="Mensagens" />
        <button type="button" onClick={() => setPhase("cards")} aria-label="Amigos" />
        <button type="button" onClick={leave} aria-label="Configurações e saída" />
      </nav>
      <header className={styles.topbar}>
        <div className={styles.profile}><span>R</span><div><b>Raphael</b><small>Nível {playerProgression.playerLevel} · Guardião da Luz</small></div></div>
        <div className={styles.resources}>
          <span data-arena-motion role="button" tabIndex={0} onClick={() => setPhase("shop")} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setPhase("shop"); }}><i className={styles.coinIcon}><img src="/games/apostolic-arena/ui/currency/moedas-celestiais-v1.webp" alt="" /></i><em>MOEDAS<strong>{arenaWallet.coins.toLocaleString("pt-PT")}</strong></em><b aria-hidden="true">+</b></span>
          <span data-arena-motion role="button" tabIndex={0} onClick={() => setPhase("shop")} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setPhase("shop"); }}><i className={styles.gemIcon}><img src="/games/apostolic-arena/ui/currency/gema-celestial-v1.png" alt="" /></i><em>GEMAS<strong>{arenaWallet.gems.toLocaleString("pt-PT")}</strong></em><b aria-hidden="true">+</b></span>
        </div>
        <div className={styles.windowActions}>
          {!isFullscreen && <button type="button" onClick={requestFullscreen} aria-label="Ativar tela cheia">⛶</button>}
          <button type="button" onClick={leave} aria-label="Sair do Apostolic Arena">×</button>
        </div>
      </header>

      <nav className={styles.sideRail} aria-label="Menu principal da Arena">
        <button data-arena-motion type="button" className={styles.active}><span><img src="/games/apostolic-arena/ui/emblems/inicio-v1.png" alt="" /></span><b>INÍCIO</b></button>
        <button data-arena-motion type="button" onClick={() => setPhase("cards")}><span><img src="/games/apostolic-arena/ui/emblems/herois-v1.png" alt="" /></span><b>HERÓIS</b></button>
        <button data-arena-motion type="button" onClick={() => setPhase("world")}><span><img src="/games/apostolic-arena/ui/emblems/eventos-v1.png" alt="" /></span><b>EVENTOS</b></button>
        <button data-arena-motion type="button" onClick={() => setPhase("shop")}><span><img src="/games/apostolic-arena/ui/emblems/loja-v1.png" alt="" /></span><b>LOJA</b></button>
        <button data-arena-motion type="button" onClick={() => setPhase("world")}><span><img src="/games/apostolic-arena/ui/emblems/ranking-v1.png" alt="" /></span><b>RANKING</b></button>
      </nav>

      <aside className={styles.eventPlaque}><b>EVENTO</b><small>{dailyName}</small></aside>

      <aside className={styles.missionPanel} aria-label="Missões" onClick={() => setPhase("world")}>
        <h2>MISSÕES</h2>
        <div><span>⚔</span><p>Vença 5 batalhas na Arena<i><em style={{ width: "60%" }} /></i></p><b>500</b></div>
        <div><span>✦</span><p>Aprimore 2 heróis<i><em style={{ width: "50%" }} /></i></p><b>30</b></div>
        <div><span>♜</span><p>Alcance a Liga Ouro<i><em style={{ width: "14%" }} /></i></p><b>1.000</b></div>
      </aside>

      <section className={styles.heroHotspots} aria-label="Poderes dos quatro campeões">
        {menuChampions.map((champion) => <button key={champion.id} type="button" data-active={activeHeroId === champion.id} onClick={() => activatePower(champion.id)} aria-label={`${champion.name}: ${POWER_COPY[champion.id]?.name ?? "Ativar poder"}`} />)}
      </section>

      <button type="button" className={styles.exactChest} onClick={() => { setChestNotice(null); setChestOpening(true); window.setTimeout(() => { setChestOpening(false); setPhase("rewards"); }, 900); }} aria-label="Abrir baú de recompensas" />

      <section className={styles.deckPreview} aria-label="Baralho ativo">
        {Array.from({ length: 6 }, (_, index) => <button className={styles.deckSlot} data-active={activeDeckSlot === index + 1} type="button" key={index + 1} onClick={() => selectDeckSlot(index + 1)} aria-label={`Selecionar deck ${index + 1}`}>{index + 1}</button>)}
      </section>

      {chestNotice && <button type="button" className={styles.chestNotice} onClick={() => { setChestNotice(null); setPhase("rewards"); }}>{chestNotice}<span>VER BAÚS →</span></button>}

      <aside className={styles.nationsSpotlight} aria-label="Destaque da Jornada das Nações">
        <img src="/games/apostolic-journey/world/region-map-v160.png" alt="Mapa de ilhas da Jornada das Nações" />
        <div><small>MODO ESTRATÉGICO</small><h2>Jornada das Nações</h2><p>Construa sua cidade, explore ilhas e lidere exércitos.</p><button type="button" onClick={() => setPhase("nations")}>ENTRAR NAS NAÇÕES</button></div>
      </aside>

      <button data-arena-motion type="button" className={styles.battleButton} disabled={deckIds.length !== 8 || isEnteringBattle} onClick={beginBattle}>
        <img className={styles.battleArtwork} src="/games/apostolic-arena/ui/actions/batalhar-celestial-v1.webp" alt="" />
        <span className={styles.battleLabel}>{isEnteringBattle ? "ABRINDO O PORTÃO…" : deckIds.length === 8 ? "BATALHAR" : `ESCOLHA 8 CARTAS (${deckIds.length}/8)`}</span>
      </button>

      <nav className={styles.bottomNav} aria-label="Navegação do Apostolic Arena">
        <button type="button" onClick={() => setPhase("world")}><span><img src="/games/apostolic-arena/ui/emblems/diario-v1.png" alt="" /></span><b>DIÁRIO</b></button>
        <button type="button" onClick={() => setPhase("alliance")}><span><img src="/games/apostolic-arena/ui/emblems/alianca-v1.png" alt="" /></span><b>ALIANÇA</b></button>
        <button type="button" onClick={() => setPhase("cards")}><span><img src="/games/apostolic-arena/ui/emblems/amigos-v1.png" alt="" /></span><b>AMIGOS</b></button>
        <button type="button" onClick={() => setPhase("rewards")}><span><img src="/games/apostolic-arena/ui/emblems/inventario-v1.png" alt="" /></span><b>INVENTÁRIO</b></button>
      </nav>
    </section> : phase === "arenaPreview" ? <ArenaMatchIntroV203 arenaId={currentArenaTheme.id} onEnter={enterRandomField} onCancel={() => setPhase("menu")} /> : <section className={styles.module}>
      <header className={styles.moduleHeader}>
        <button type="button" onClick={() => setPhase("menu")}>← Menu 3D</button>
        <strong>{phase === "battle" ? "Batalha" : phase === "cards" ? "Cartas e baralho" : phase === "world" ? "Jornada" : phase === "shop" ? "Loja da Aliança" : phase === "alliance" ? "Sede da Aliança" : phase === "nations" ? "Jornada das Nações" : "Baús e recompensas"}</strong>
        <div><button type="button" onClick={requestFullscreen} aria-label="Ativar tela cheia">⛶</button><button type="button" onClick={leave} aria-label="Sair">×</button></div>
      </header>
      <main className={styles.moduleContent}>
        {phase === "battle" && <ApostolicArenaBattle3D onResult={recordBattleResult} />}
        {phase === "cards" && <ArenaCollectionV17 initialDeck={deckIds} initialDeckSlot={activeDeckSlot} onDeckChange={(ids, slot) => {
          setDeckIds(ids);
          setActiveDeckSlot(slot);
        }} onBattleTest={() => setPhase("arenaPreview")} />}
        {phase === "world" && <ArenaWorldRoadmap onProgressionChange={setPlayerProgression} onBattle={() => setPhase("arenaPreview")} onTraining={() => setPhase("tutorial")} />}
        {phase === "rewards" && <ArenaChestsV18 onStateChange={setChestState} />}
        {phase === "shop" && <ArenaShopV38 fallbackWallet={arenaWallet} onWalletChange={setArenaWallet} />}
        {phase === "alliance" && <ArenaAllianceV61 />}
        {phase === "nations" && <><div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}><button type="button" onClick={()=>setPhase("city")}>ENTRAR NA CIDADE</button><button type="button" onClick={()=>setPhase("province")}>ABRIR MAPA DA PROVÍNCIA</button></div><ApostolicJourneyNationsV100 /></>}
        {phase === "city" && <ApostolicCityV165 onOpenProvince={()=>setPhase("province")}/>}
        {phase === "research" && <ApostolicResearchCenterV110 />}
        {phase === "commerce" && <ApostolicCommerceCenterV115 />}
        {phase === "province" && <ApostolicProvinceMapV120 onOpenCity={()=>setPhase("city")} onOpenArmies={()=>setPhase("armies")} onOpenAttack={()=>setPhase("attacks")}/>}
        {phase === "defense" && <ApostolicCityDefenseV125 />}
        {phase === "armies" && <ApostolicArmyMarchesV130 />}
        {phase === "spies" && <ApostolicSpyCenterV135 />}
        {phase === "attacks" && <ApostolicCityAttacksV140 onLaunch={(id,token)=>{window.sessionStorage.setItem(STRATEGIC_ATTACK_KEY,JSON.stringify({id,token}));setPhase("battle")}}/>}
        {phase === "sieges" && <ApostolicSiegeCenterV145 />}
        {phase === "results" && <><ApostolicBattleResultsV150 /><ApostolicInfirmaryV155 /></>}
      </main>
    </section>}
    {(phase === "loading" || phase === "menu") && <button type="button" className={styles.soundControl} data-enabled={soundEnabled} onClick={() => setSoundEnabled((current) => !current)} aria-label={soundEnabled ? "Desativar som ambiente" : "Ativar som ambiente"}>{soundEnabled ? "🔊" : "🔇"}<span>{soundEnabled ? "SOM" : "ATIVAR SOM"}</span></button>}
  </section>;
}
