"use client";

import { useState } from "react";
import { ARENA_CARD_CATALOG, type ArenaCatalogCard } from "../lib/apostolic-arena-card-catalog";
import styles from "./arena-card-gallery.module.css";

function ArenaCard({ card, selected, onSelect }: { card: ArenaCatalogCard; selected: boolean; onSelect: () => void }) {
  return <button type="button" className={`${styles.card} ${selected ? styles.selected : ""}`} onClick={onSelect} aria-pressed={selected}>
    <span className={styles.faith}>{card.faith}</span>
    <img src={card.portrait} alt={`Arte da carta ${card.name}`} />
    <span className={styles.rarity}>COMUM</span>
    <strong>{card.name}</strong>
    <small>Nível 1</small>
  </button>;
}

export function ArenaCardGallery() {
  const [selectedId, setSelectedId] = useState(1);
  const selected = ARENA_CARD_CATALOG.find((card) => card.id === selectedId) ?? ARENA_CARD_CATALOG[0];
  return <section className={styles.shell} aria-labelledby="collection-title">
    <header><div><p className="eyebrow">Coleção Apostolic Arena</p><h2 id="collection-title">As primeiras cartas bíblicas</h2></div><strong>10 / 125</strong></header>
    <div className={styles.layout}>
      <div className={styles.grid}>{ARENA_CARD_CATALOG.map((card) => <ArenaCard key={card.id} card={card} selected={card.id === selected?.id} onSelect={() => setSelectedId(card.id)} />)}</div>
      {selected && <aside className={styles.details}><img src={selected.portrait} alt="" /><p className="eyebrow">#{selected.id} · Comum · {selected.faith} Fé</p><h3>{selected.name}</h3><p>{selected.description}</p><dl><div><dt>Tipo</dt><dd>{selected.type}</dd></div><div><dt>HP</dt><dd>{selected.hp}</dd></div><div><dt>Dano / DPS</dt><dd>{selected.damage} / {selected.dps}</dd></div><div><dt>Alcance</dt><dd>{selected.range}</dd></div><div><dt>Velocidade</dt><dd>{selected.speed}</dd></div></dl><button type="button" className="button button-primary">Adicionar ao baralho</button></aside>}
    </div>
  </section>;
}
