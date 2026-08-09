"use client";

import { ARENA_COMPETITIVE_FIELDS_V201 } from "../lib/apostolic-arena-themes-v20";
import { ARENA_PRESENTATIONS_V203 } from "../lib/apostolic-arena-presentations-v20-3";
import styles from "./arena-match-intro-v20-3.module.css";

export function ArenaMatchIntroV203({ arenaId, onEnter, onCancel }: { arenaId: string; onEnter: () => void; onCancel: () => void }) {
  const presentation = ARENA_PRESENTATIONS_V203[arenaId] ?? ARENA_PRESENTATIONS_V203.galilee!;
  const fields = ARENA_COMPETITIVE_FIELDS_V201[arenaId] ?? ARENA_COMPETITIVE_FIELDS_V201.galilee!;
  return <section className={styles.intro}>
    <img className={styles.cover} src={presentation.coverImage} alt={`Maquete 3D da arena ${presentation.name}`} />
    <div className={styles.vignette} />
    <button className={styles.back} type="button" onClick={onCancel}>← Voltar</button>
    <header><small>PRÓXIMA BATALHA</small><h1>{presentation.name}</h1><p>{presentation.subtitle}</p></header>
    <section className={styles.possibleFields} aria-label="Dois campos possíveis">
      <strong>2 CAMPOS POSSÍVEIS</strong>
      <div>{fields.map((field) => <article key={field.id}><img src={field.image} alt="" /><span><b>{field.name}</b><small>{field.layout}</small></span><i>?</i></article>)}</div>
      <p>O campo será escolhido aleatoriamente ao entrar.</p>
    </section>
    <button className={styles.enter} type="button" onClick={onEnter}><span>⚔</span> ENTRAR NA ARENA</button>
  </section>;
}
