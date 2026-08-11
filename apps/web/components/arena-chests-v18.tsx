"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ARENA_CARD_CATALOG } from "../lib/apostolic-arena-card-catalog";
import { addVictoryChest, CHEST_DEFINITIONS, claimChest, loadArenaChests, saveArenaChests, startOpeningChest, type ArenaChestReward, type ArenaChestState } from "../lib/apostolic-arena-chests-v18";
import styles from "./arena-chests-v18.module.css";
import "./arena-chests-v42.css";
import { useArenaMotionStage } from "../lib/use-arena-motion-stage";

const remaining = (readyAt: number | undefined, now: number) => {
  if (!readyAt) return "FECHADO";
  const seconds = Math.max(0, Math.ceil((readyAt - now) / 1000));
  if (!seconds) return "PRONTO";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  return hours ? `${hours}h ${minutes}m` : `${minutes}:${String(rest).padStart(2, "0")}`;
};

export function ArenaChestsV18({ onStateChange }: { onStateChange?: (state: ArenaChestState) => void }) {
  const vaultRef = useRef<HTMLElement>(null);
  useArenaMotionStage(vaultRef);
  const [state, setState] = useState(() => loadArenaChests());
  const [now, setNow] = useState(Date.now());
  const [reward, setReward] = useState<ArenaChestReward | null>(null);
  const [revealIndex, setRevealIndex] = useState(0);
  const [debugTools, setDebugTools] = useState(false);
  const [message, setMessage] = useState("Vença batalhas para ocupar os quatro espaços");

  useEffect(() => {
    setDebugTools(new URLSearchParams(window.location.search).get("arenaDebug") === "1");
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const update = (next: ArenaChestState) => { setState(next); onStateChange?.(next); };
  const start = (slot: number, quick = false) => {
    const next = startOpeningChest(state, slot, quick);
    update(next);
    setMessage(next === state ? "Somente um baú pode abrir por vez" : quick ? "Baú de teste pronto para coletar" : "A abertura começou e continuará mesmo com o jogo fechado");
  };
  const collect = (slot: number) => {
    const result = claimChest(state, slot);
    if (!result) { setMessage("Este baú já foi coletado ou ainda não está pronto"); return; }
    update(result.state);
    setReward(result.reward);
    setRevealIndex(0);
    setMessage("Recompensas adicionadas à sua coleção");
  };
  const devChest = () => {
    const addition = addVictoryChest(state);
    if (!addition.added) { setMessage("Os quatro espaços estão ocupados"); return; }
    const ready = startOpeningChest(addition.state, addition.slot, true);
    saveArenaChests(ready);
    update(ready);
    setMessage("Baú rápido criado para validação");
  };

  return <section ref={vaultRef} className={styles.vault}>
    <header><div><span>COFRE DA ALIANÇA · 4 ESPAÇOS</span><h2>Cofre Celestial</h2><p>Seu inventário de tesouros conquistados. Ouro, desbloqueios e cópias entram imediatamente na coleção.</p></div>{debugTools && <button type="button" onClick={devChest}>+ BAÚ RÁPIDO DE TESTE</button>}</header>
    <aside className={styles.message}>{message}</aside>
    <div className={styles.slots}>{state.slots.map((chest, index) => {
      if (!chest) return <article key={index} className={styles.empty} data-arena-motion style={{ "--arena-order": index } as CSSProperties}><i>{index + 1}</i><b>ESPAÇO VAZIO</b><span>Ganhe uma batalha</span></article>;
      const definition = CHEST_DEFINITIONS[chest.kind];
      const isReady = Boolean(chest.readyAt && chest.readyAt <= now);
      const isOpening = Boolean(chest.readyAt && !isReady);
      return <article key={chest.id} data-arena-motion data-kind={chest.kind} data-ready={isReady} style={{ "--arena-order": index } as CSSProperties}>
        <i>{index + 1}</i><div className={styles.chest} aria-hidden="true"><span /><b>✦</b><em /></div><small>{chest.kind.toUpperCase()}</small><h3>{definition.name}</h3><strong>{remaining(chest.readyAt, now)}</strong>
        {!chest.readyAt ? <button type="button" onClick={() => start(index)}>ABRIR · {definition.hours}H</button> : isReady ? <button type="button" onClick={() => collect(index)}>COLETAR</button> : <button type="button" disabled>{isOpening ? "ABRINDO" : "AGUARDE"}</button>}
      </article>;
    })}</div>
    <footer><span>Sequência: Madeira → Madeira → Prata → Madeira → Ouro</span><b>Vitórias registradas: {state.victories}</b></footer>
    {reward && (() => {
      const totalReveals = reward.cards.length + 1;
      const allVisible = revealIndex >= totalReveals;
      return <div className={styles.rewardBackdrop} role="presentation"><section className={styles.reward} role="dialog" aria-modal="true" data-kind={reward.chestKind}>
        <i className={styles.rewardHalo} aria-hidden="true" /><span>ABERTURA CELESTIAL · {CHEST_DEFINITIONS[reward.chestKind].name.toUpperCase()}</span><h2>{allVisible ? "Tesouros guardados" : "Revele sua conquista"}</h2>
        <strong data-visible={revealIndex >= 1}>◉ {reward.gold} OURO</strong>
        <div>{reward.cards.map((item, index) => { const card = ARENA_CARD_CATALOG.find((entry) => entry.id === item.cardId); return card && <article key={item.cardId} data-arena-motion data-new={item.newlyUnlocked} data-visible={revealIndex >= index + 2}><img src={card.portrait} alt={card.name} /><b>{card.name}</b><span>+{item.copies} cópias</span>{item.newlyUnlocked && <em>NOVA CARTA</em>}<i>?</i></article>; })}</div>
        {!allVisible ? <button type="button" onClick={() => setRevealIndex((current) => Math.min(totalReveals, current + 1))}>{revealIndex === 0 ? "REVELAR OURO" : "REVELAR PRÓXIMA CARTA"}</button> : <button type="button" onClick={() => setReward(null)}>GUARDAR RECOMPENSAS</button>}
      </section></div>;
    })()}
  </section>;
}
