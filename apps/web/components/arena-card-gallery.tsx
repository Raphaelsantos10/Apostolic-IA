"use client";

import { useEffect, useMemo, useState } from "react";
import { ARENA_CARD_CATALOG, type ArenaCatalogCard } from "../lib/apostolic-arena-card-catalog";
import styles from "./arena-card-gallery.module.css";

const DECK_STORAGE_KEY = "apostolic-arena-active-deck";

function ArenaCard({ card, selected, inDeck, onSelect }: { card: ArenaCatalogCard; selected: boolean; inDeck: boolean; onSelect: () => void }) {
  return <button type="button" className={`${styles.card} ${selected ? styles.selected : ""}`} onClick={onSelect} aria-pressed={selected}>
    <span className={styles.faith}>{card.faith}</span>
    {inDeck && <span className={styles.inDeck}>✓ NO DECK</span>}
    <img src={card.portrait} alt={`Arte da carta ${card.name}`} />
    <span className={styles.rarity}>COMUM</span>
    <strong>{card.name}</strong>
    <small>Nível 1</small>
  </button>;
}

export function ArenaCardGallery() {
  const [selectedId, setSelectedId] = useState(1);
  const [deckIds, setDeckIds] = useState<number[]>([]);
  const [message, setMessage] = useState("Escolha até oito cartas para o seu baralho ativo.");
  const selected = ARENA_CARD_CATALOG.find((card) => card.id === selectedId) ?? ARENA_CARD_CATALOG[0];
  const deck = useMemo(() => deckIds.map((id) => ARENA_CARD_CATALOG.find((card) => card.id === id)).filter((card): card is ArenaCatalogCard => Boolean(card)), [deckIds]);
  const averageFaith = deck.length ? (deck.reduce((total, card) => total + card.faith, 0) / deck.length).toFixed(1) : "0.0";

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(DECK_STORAGE_KEY) ?? "[]") as number[];
      if (Array.isArray(saved)) setDeckIds(saved.filter((id) => ARENA_CARD_CATALOG.some((card) => card.id === id)).slice(0, 8));
    } catch { setDeckIds([]); }
  }, []);

  const saveDeck = (next: number[]) => { setDeckIds(next); window.localStorage.setItem(DECK_STORAGE_KEY, JSON.stringify(next)); };
  const toggleSelected = () => {
    if (!selected) return;
    if (deckIds.includes(selected.id)) { saveDeck(deckIds.filter((id) => id !== selected.id)); setMessage(`${selected.name} foi removida do baralho.`); return; }
    if (deckIds.length >= 8) { setMessage("O baralho já tem oito cartas. Remova uma para adicionar outra."); return; }
    saveDeck([...deckIds, selected.id]); setMessage(`${selected.name} foi adicionada ao baralho.`);
  };

  return <section className={styles.shell} aria-labelledby="collection-title">
    <header><div><p className="eyebrow">Coleção Apostolic Arena</p><h2 id="collection-title">As primeiras cartas bíblicas</h2></div><strong>10 / 125</strong></header>
    <section className={styles.deckBuilder} aria-labelledby="deck-title">
      <header><div><p className="eyebrow">Baralho ativo</p><h3 id="deck-title">{deck.length} / 8 cartas</h3></div><strong>Custo médio: {averageFaith} Fé</strong></header>
      <div className={styles.deckSlots}>{Array.from({ length: 8 }, (_, index) => { const card = deck[index]; return card ? <button type="button" key={card.id} onClick={() => { setSelectedId(card.id); saveDeck(deckIds.filter((id) => id !== card.id)); setMessage(`${card.name} foi removida do baralho.`); }} title={`Remover ${card.name}`}><img src={card.portrait} alt={card.name}/><b>{card.faith}</b></button> : <span key={`empty-${index}`} aria-label="Espaço vazio">+</span>; })}</div>
      <p className={styles.deckMessage} aria-live="polite">{message}</p>
    </section>
    <div className={styles.layout}>
      <div className={styles.grid}>{ARENA_CARD_CATALOG.map((card) => <ArenaCard key={card.id} card={card} selected={card.id === selected?.id} inDeck={deckIds.includes(card.id)} onSelect={() => setSelectedId(card.id)} />)}</div>
      {selected && <aside className={styles.details}><img src={selected.portrait} alt="" /><p className="eyebrow">#{selected.id} · Comum · {selected.faith} Fé</p><h3>{selected.name}</h3><p>{selected.description}</p><dl><div><dt>Tipo</dt><dd>{selected.type}</dd></div><div><dt>HP</dt><dd>{selected.hp}</dd></div><div><dt>Dano / DPS</dt><dd>{selected.damage} / {selected.dps}</dd></div><div><dt>Alcance</dt><dd>{selected.range}</dd></div><div><dt>Velocidade</dt><dd>{selected.speed}</dd></div></dl><button type="button" className="button button-primary" onClick={toggleSelected}>{deckIds.includes(selected.id) ? "Remover do baralho" : "Adicionar ao baralho"}</button></aside>}
    </div>
  </section>;
}
