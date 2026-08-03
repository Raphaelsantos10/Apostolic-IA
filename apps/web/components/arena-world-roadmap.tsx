"use client";

import { useEffect, useState } from "react";
import { APOSTOLIC_ARENAS, GOLIATH_RAID, arenaForTrophies, dailyEventFor } from "../lib/apostolic-arena-world";
import styles from "./arena-world-roadmap.module.css";

export function ArenaWorldRoadmap() {
  const [trophies] = useState(0);
  const [daily, setDaily] = useState<ReturnType<typeof dailyEventFor> | null>(null);
  const current = arenaForTrophies(trophies);
  useEffect(() => setDaily(dailyEventFor(new Date())), []);

  return <section className={styles.shell} aria-labelledby="arena-world-title">
    <header className={styles.hero}>
      <div><p className="eyebrow">Mapa de progressão</p><h2 id="arena-world-title">12 arenas bíblicas</h2><p>Troféus definem a arena Ranked; eventos diários modificam a batalha sem alterar o seu nível.</p></div>
      <aside className={styles.daily}><small>Rotação diária</small><strong>{daily?.name ?? "A calcular evento…"}</strong><span>{daily?.effect}</span><small>{daily?.duration}</small></aside>
    </header>

    <div className={styles.grid}>{APOSTOLIC_ARENAS.map((arena) => {
      const unlocked = trophies >= arena.trophyMin;
      return <article className={`${styles.arena} ${!unlocked ? styles.locked : ""}`} style={{ "--accent": arena.accent } as React.CSSProperties} key={arena.id}>
        <header><b>Arena {arena.id}</b><span className={styles.badge}>{arena.status === "playable" ? "Jogável" : unlocked ? "Em produção" : `🔒 ${arena.trophyMin}`}</span></header>
        <h3>{arena.name}</h3><small>{arena.era} · {arena.trophyMax ? `${arena.trophyMin}–${arena.trophyMax}` : `${arena.trophyMin}+`} troféus</small>
        <p><strong>{arena.terrain.name}:</strong> {arena.terrain.effect}</p>
        {arena.id === current?.id && <span className={styles.future}>Sua arena atual</span>}
      </article>;
    })}</div>

    <div className={styles.details}>
      <article className={styles.panel}><p className="eyebrow">Primeira Raid cooperativa</p><h3>{GOLIATH_RAID.name}</h3><p>{GOLIATH_RAID.mode} · {GOLIATH_RAID.players} · {GOLIATH_RAID.health.toLocaleString("pt-PT")} HP</p><span className={styles.future}>Planejada para sprint futura</span><div className={styles.timeline}>{GOLIATH_RAID.phases.map((phase) => <section className={styles.phase} key={phase.name}><small>{phase.threshold}</small><h4>{phase.name}</h4><p>{phase.attacks.join(" · ")}</p>{phase.summons.length > 0 && <p>Invoca: {phase.summons.join(", ")}</p>}</section>)}</div></article>
      <article className={styles.panel}><p className="eyebrow">Sistemas do Boss</p><h3>Mais estratégia que apenas vida</h3><ul className={styles.systems}>{GOLIATH_RAID.systems.map((system) => <li key={system}>{system}</li>)}</ul><p><strong>Ponto fraco:</strong> {GOLIATH_RAID.weakPoint}</p><p><strong>Barra de quebra:</strong> {GOLIATH_RAID.stagger} pontos</p></article>
    </div>
  </section>;
}
