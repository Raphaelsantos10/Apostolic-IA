"use client";

import { useMemo, useState } from "react";
import { ARENA_CARD_CATALOG } from "../lib/apostolic-arena-card-catalog";
import { BIBLICAL_ARENAS, loadArenaProgression, type ArenaPlayerProgression } from "../lib/apostolic-arena-progression-v17";
import { ARENA_JOURNEY_REWARDS, CARDS_BY_ARENA, collectArenaJourneyReward, loadArenaJourney } from "../lib/apostolic-arena-journey-v19";
import { ARENA_COMPETITIVE_FIELDS_V201, ARENA_THEMES_V20 } from "../lib/apostolic-arena-themes-v20";
import { ARENA_PRESENTATIONS_V203 } from "../lib/apostolic-arena-presentations-v20-3";
import styles from "./arena-world-roadmap-v19.module.css";

const ARENA_VISUALS = [
  { icon: "✦", verse: "Vinde após mim", color: "cyan" },
  { icon: "⚔", verse: "A batalha é do Senhor", color: "green" },
  { icon: "≈", verse: "Caminho através das águas", color: "blue" },
  { icon: "♜", verse: "As muralhas cairão", color: "amber" },
  { icon: "◇", verse: "O Senhor é contigo", color: "violet" },
  { icon: "♛", verse: "Firmarei o teu reino", color: "gold" },
  { icon: "☄", verse: "Responde-me com fogo", color: "red" },
  { icon: "☼", verse: "A glória encheu a Casa", color: "celestial" }
] as const;
const reachedArenaIndex = (progression: ArenaPlayerProgression) => BIBLICAL_ARENAS.reduce((latest, arena, index) => progression.trophies >= arena.trophies && progression.playerLevel >= arena.level ? index : latest, 0);

export function ArenaWorldRoadmap({ onProgressionChange, onBattle, onTraining }: { onProgressionChange?: (progression: ArenaPlayerProgression) => void; onBattle?: () => void; onTraining?: () => void } = {}) {
  const [progression, setProgression] = useState(() => loadArenaProgression());
  const [journey, setJourney] = useState(() => loadArenaJourney());
  const [selectedArena, setSelectedArena] = useState(() => reachedArenaIndex(progression));
  const [message, setMessage] = useState("Cada Arena adiciona novas cartas ao conjunto de recompensas dos baús");
  const currentArena = reachedArenaIndex(progression);
  const nextArena = BIBLICAL_ARENAS[currentArena + 1];
  const start = BIBLICAL_ARENAS[currentArena]!.trophies;
  const pathProgress = nextArena ? Math.min(100, ((progression.trophies - start) / (nextArena.trophies - start)) * 100) : 100;
  const selectedCards = CARDS_BY_ARENA[selectedArena] ?? [];
  const rarityCounts = useMemo(() => selectedCards.reduce<Record<string, number>>((counts, card) => ({ ...counts, [card.rarity]: (counts[card.rarity] ?? 0) + 1 }), {}), [selectedCards]);
  const selectedTheme = ARENA_THEMES_V20[selectedArena]!;
  const selectedPresentation = ARENA_PRESENTATIONS_V203[selectedTheme.id] ?? ARENA_PRESENTATIONS_V203.galilee!;
  const selectedReached = selectedArena <= currentArena;

  const collect = (arenaIndex: number) => {
    const result = collectArenaJourneyReward(arenaIndex);
    if (!result) { setMessage("Esta recompensa ainda está bloqueada ou já foi coletada"); return; }
    setProgression(result.progression);
    setJourney(result.journey);
    onProgressionChange?.(result.progression);
    const card = ARENA_CARD_CATALOG.find((entry) => entry.id === result.reward.cardId);
    setMessage(`Recompensa coletada: ${result.reward.gold} Ouro e ${result.reward.copies} cópias de ${card?.name ?? "uma carta"}`);
  };

  return <section className={styles.journey}>
    <header className={styles.hero}><div><span>V20.6 · CAMINHO DA ALIANÇA</span><h2>Jornada Bíblica</h2><p>Avance por oito Arenas, conquiste recompensas e amplie as cartas disponíveis nos seus baús.</p></div><aside><b>🏆 {progression.trophies}</b><span>NÍVEL {progression.playerLevel}</span><em>◉ {progression.gold}</em>{onTraining && <button type="button" className={styles.repeatTraining} onClick={onTraining}>✦ REPETIR TREINAMENTO</button>}</aside></header>
    <section className={styles.current}><div><small>ARENA ATUAL</small><b>{BIBLICAL_ARENAS[currentArena]!.name}</b><span>{nextArena ? `${nextArena.trophies - progression.trophies} troféus até ${nextArena.name}` : "Jornada principal concluída"}</span></div><i><em style={{ width: `${pathProgress}%` }} /></i><strong>{Math.round(pathProgress)}%</strong></section>
    <p className={styles.message}>{message}</p>
    <div className={styles.layout}>
      <main className={styles.path}>{BIBLICAL_ARENAS.map((arena, arenaIndex) => {
        const visual = ARENA_VISUALS[arenaIndex]!;
        const reached = progression.trophies >= arena.trophies && progression.playerLevel >= arena.level;
        const claimed = journey.claimedArenaRewards.includes(arenaIndex);
        const reward = ARENA_JOURNEY_REWARDS[arenaIndex]!;
        const rewardCard = ARENA_CARD_CATALOG.find((card) => card.id === reward.cardId);
        const arenaPresentation = ARENA_PRESENTATIONS_V203[ARENA_THEMES_V20[arenaIndex]!.id] ?? ARENA_PRESENTATIONS_V203.galilee!;
        return <article key={arena.name} data-reached={reached} data-current={arenaIndex === currentArena} data-side={arenaIndex % 2 ? "right" : "left"} data-color={visual.color}>
          <button type="button" className={styles.arenaNode} onClick={() => setSelectedArena(arenaIndex)} aria-pressed={selectedArena === arenaIndex}><img src={arenaPresentation.coverImage} alt="" /><span className={styles.nodeShade} /><i>{reached ? visual.icon : "🔒"}</i><div><small>ARENA {arenaIndex + 1} · NÍVEL {arena.level}</small><h3>{arena.name}</h3><p>“{visual.verse}”</p><b>🏆 {arena.trophies}</b></div></button>
          <section className={styles.milestone}><span>RECOMPENSA DA ARENA</span>{rewardCard && <img src={rewardCard.portrait} alt={rewardCard.name} />}<div><b>◉ {reward.gold}</b><small>{reward.copies}× {rewardCard?.name}</small></div><button type="button" disabled={!reached || claimed} onClick={() => collect(arenaIndex)}>{claimed ? "COLETADA" : reached ? "COLETAR" : "BLOQUEADA"}</button></section>
        </article>;
      })}</main>
      <aside className={styles.inspector} data-locked={!selectedReached}>
        <section className={styles.arenaShowcase}>
          <img src={selectedPresentation.coverImage} alt={`Maquete 3D de ${selectedPresentation.name}`} />
          <div><small>ARENA {selectedArena + 1}</small><h3>{selectedPresentation.name}</h3><p>{selectedPresentation.subtitle}</p></div>
          {!selectedReached && <strong>🔒 NÍVEL {BIBLICAL_ARENAS[selectedArena]!.level} · 🏆 {BIBLICAL_ARENAS[selectedArena]!.trophies}</strong>}
        </section>
        <span>{selectedReached ? `CONJUNTO DA ARENA ${selectedArena + 1}` : "PRÉVIA DA ARENA BLOQUEADA"}</span>
        <p>{selectedTheme.subtitle} · {selectedTheme.climate}. As cartas conquistadas podem ser escolhidas manualmente para o deck e nunca são equipadas automaticamente.</p>
        <section className={styles.fieldSection}><header><div><b>DOIS CAMPOS COMPETITIVOS</b><small>O sistema escolhe um deles aleatoriamente ao entrar</small></div><i>50% / 50%</i></header><div className={styles.fieldGallery}>{(ARENA_COMPETITIVE_FIELDS_V201[selectedTheme.id] ?? []).map((field, index) => <article key={field.id}><img src={field.image} alt={field.name} /><i>CAMPO {index + 1}</i><b>{field.name}</b><span>{field.towerStyle}</span><small>{field.layout}</small></article>)}</div></section>
        <section className={styles.phaseList}><b>EVOLUÇÃO VISUAL DA ARENA</b>{selectedTheme.phases.map((phase, index) => <article key={phase.name}><i>{index + 1}</i><div><strong>{phase.name}</strong><small>{phase.description}</small></div></article>)}</section>
        <section className={styles.unlockHeader}><div><b>CARTAS DESTA ARENA</b><small>{selectedCards.length} cartas no conjunto de recompensas</small></div><div className={styles.rarity}>{Object.entries(rarityCounts).map(([rarity, count]) => <small key={rarity} data-rarity={rarity}>{rarity.toUpperCase()} · {count}</small>)}</div></section>
        <div className={styles.cardGrid}>{selectedCards.map((card) => <article key={card.id} data-unlocked={progression.unlockedCardIds.includes(card.id)} data-rarity={card.rarity}><img src={card.portrait} alt={card.name} /><b>{card.faith}</b><span>{card.name}</span><small>{progression.unlockedCardIds.includes(card.id) ? "CONQUISTADA" : "NOS BAÚS"}</small></article>)}</div>
        <button type="button" className={styles.journeyBattle} disabled={selectedArena !== currentArena || !onBattle} onClick={onBattle}>{selectedArena === currentArena ? "⚔ BATALHAR NESTA ARENA" : selectedArena < currentArena ? "SELECIONE A ARENA ATUAL PARA BATALHAR" : "ARENA AINDA BLOQUEADA"}</button>
      </aside>
    </div>
  </section>;
}
