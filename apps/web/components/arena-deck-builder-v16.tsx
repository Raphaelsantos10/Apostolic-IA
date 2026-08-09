"use client";

import { useMemo, useState } from "react";
import { arena25DPowerFor, type Arena25DPowerKind } from "../lib/apostolic-arena-25d-power-system";
import { ARENA_CARD_CATALOG } from "../lib/apostolic-arena-card-catalog";
import styles from "./arena-deck-builder-v16.module.css";

const ACTIVE_DECK_KEY = "apostolic-arena-active-deck";
const SAVED_DECKS_KEY = "apostolic-arena-decks-v16";
const CHAMPIONS = [117, 119, 121, 125] as const;
const DEFAULT_DECKS: Record<number, number[]> = {
  117: [117, 8, 10, 11, 27, 29, 30, 38],
  119: [119, 1, 5, 9, 13, 17, 19, 33],
  121: [121, 2, 7, 12, 16, 18, 22, 40],
  125: [125, 5, 10, 11, 15, 20, 32, 38]
};
const POWER_LABELS: Record<Arena25DPowerKind, string> = {
  warrior: "Combatente", ranged: "Distância", guardian: "Guardião", healer: "Curador", swarm: "Enxame", burst: "Impacto", champion: "Campeão"
};

type SavedDeck = { name: string; ids: number[] };
type SavedDecks = Record<string, SavedDeck>;

const readSavedDecks = (): SavedDecks => {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SAVED_DECKS_KEY) ?? "{}") as SavedDecks;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch { return {}; }
};

export function ArenaDeckBuilderV16({ initialDeck, onDeckChange, onBattleTest }: {
  initialDeck: number[];
  onDeckChange: (ids: number[]) => void;
  onBattleTest: () => void;
}) {
  const initialChampion = initialDeck.find((id) => CHAMPIONS.includes(id as typeof CHAMPIONS[number])) ?? 117;
  const [championId, setChampionId] = useState(initialChampion);
  const [savedDecks, setSavedDecks] = useState<SavedDecks>(() => readSavedDecks());
  const [deckIds, setDeckIds] = useState<number[]>(() => initialDeck.length === 8 ? initialDeck : DEFAULT_DECKS[initialChampion]!);
  const [deckName, setDeckName] = useState(() => savedDecks[String(initialChampion)]?.name ?? `Deck de ${ARENA_CARD_CATALOG.find((card) => card.id === initialChampion)?.name ?? "Campeão"}`);
  const [search, setSearch] = useState("");
  const [rarity, setRarity] = useState("all");
  const [power, setPower] = useState("all");
  const [message, setMessage] = useState("Escolha exatamente oito cartas");

  const deckCards = deckIds.flatMap((id) => {
    const card = ARENA_CARD_CATALOG.find((entry) => entry.id === id);
    return card ? [card] : [];
  });
  const filteredCards = useMemo(() => ARENA_CARD_CATALOG.filter((card) => {
    const profile = arena25DPowerFor(card);
    const matchesSearch = card.name.toLocaleLowerCase("pt").includes(search.toLocaleLowerCase("pt"));
    return matchesSearch && (rarity === "all" || card.rarity === rarity) && (power === "all" || profile.kind === power);
  }), [power, rarity, search]);
  const averageFaith = deckCards.length ? deckCards.reduce((total, card) => total + card.faith, 0) / deckCards.length : 0;
  const powerCounts = deckCards.reduce<Partial<Record<Arena25DPowerKind, number>>>((counts, card) => {
    const kind = arena25DPowerFor(card).kind;
    counts[kind] = (counts[kind] ?? 0) + 1;
    return counts;
  }, {});
  const warnings = [
    !powerCounts.guardian && "Falta um Guardião",
    !powerCounts.healer && "Falta suporte ou cura",
    !powerCounts.ranged && "Falta ataque à distância"
  ].filter(Boolean) as string[];

  const persist = (ids = deckIds, name = deckName, selectedChampion = championId) => {
    if (ids.length !== 8) {
      setMessage(`Faltam ${8 - ids.length} cartas`);
      return false;
    }
    const nextSaved = { ...savedDecks, [String(selectedChampion)]: { name: name.trim() || `Deck ${selectedChampion}`, ids } };
    setSavedDecks(nextSaved);
    window.localStorage.setItem(SAVED_DECKS_KEY, JSON.stringify(nextSaved));
    window.localStorage.setItem(ACTIVE_DECK_KEY, JSON.stringify(ids));
    onDeckChange(ids);
    setMessage("Baralho salvo e ligado à batalha");
    return true;
  };

  const switchChampion = (nextChampion: number) => {
    const currentSaved = deckIds.length === 8 ? { ...savedDecks, [String(championId)]: { name: deckName, ids: deckIds } } : savedDecks;
    const selected = currentSaved[String(nextChampion)];
    const nextIds = selected?.ids.length === 8 ? selected.ids : DEFAULT_DECKS[nextChampion]!;
    setSavedDecks(currentSaved);
    setChampionId(nextChampion);
    setDeckIds(nextIds);
    setDeckName(selected?.name ?? `Deck de ${ARENA_CARD_CATALOG.find((card) => card.id === nextChampion)?.name ?? "Campeão"}`);
    setMessage("Edite e salve este deck");
  };

  const toggleCard = (cardId: number) => {
    if (CHAMPIONS.includes(cardId as typeof CHAMPIONS[number]) && cardId !== championId) {
      setMessage("Cada deck utiliza somente o Campeão selecionado");
      return;
    }
    if (cardId === championId) {
      setMessage("O Campeão principal não pode ser removido deste deck");
      return;
    }
    setDeckIds((current) => {
      if (current.includes(cardId)) return current.filter((id) => id !== cardId);
      if (current.length >= 8) {
        setMessage("O baralho já possui oito cartas");
        return current;
      }
      return [...current, cardId];
    });
  };

  const moveCard = (index: number, direction: -1 | 1) => {
    const destination = index + direction;
    if (destination < 0 || destination >= deckIds.length) return;
    setDeckIds((current) => {
      const next = [...current];
      [next[index], next[destination]] = [next[destination]!, next[index]!];
      return next;
    });
  };

  return <section className={styles.builder}>
    <header className={styles.header}>
      <div><span>V16 · EDITOR DE BARALHO</span><h2>Monte sua Aliança</h2><p>As oito cartas salvas serão exatamente as oito cartas da batalha.</p></div>
      <label>Nome do deck<input value={deckName} maxLength={32} onChange={(event) => setDeckName(event.target.value)} /></label>
    </header>

    <nav className={styles.champions} aria-label="Decks dos Campeões">
      {CHAMPIONS.map((id) => {
        const champion = ARENA_CARD_CATALOG.find((card) => card.id === id);
        return champion && <button type="button" key={id} data-active={id === championId} onClick={() => switchChampion(id)}><img src={champion.portrait} alt="" /><span>{champion.name}</span></button>;
      })}
    </nav>

    <section className={styles.deckPanel}>
      <div className={styles.deckSummary}><b>{deckIds.length}/8</b><span>Fé média {averageFaith.toFixed(1)}</span><em>{message}</em></div>
      <div className={styles.slots}>
        {Array.from({ length: 8 }, (_, index) => {
          const card = deckCards[index];
          return <article key={index} data-empty={!card}>
            {card ? <><img src={card.portrait} alt={card.name} /><b>{card.faith}</b><span>{card.name}</span><small>{POWER_LABELS[arena25DPowerFor(card).kind]}</small><div><button type="button" onClick={() => moveCard(index, -1)} aria-label="Mover para esquerda">‹</button><button type="button" onClick={() => toggleCard(card.id)} disabled={card.id === championId} aria-label="Remover">×</button><button type="button" onClick={() => moveCard(index, 1)} aria-label="Mover para direita">›</button></div></> : <strong>{index + 1}</strong>}
          </article>;
        })}
      </div>
      <aside className={styles.warnings}>{warnings.length ? warnings.map((warning) => <span key={warning}>◆ {warning}</span>) : <span data-ok="true">◆ Baralho equilibrado</span>}</aside>
      <div className={styles.actions}><button type="button" onClick={() => persist()}>SALVAR BARALHO</button><button type="button" disabled={deckIds.length !== 8} onClick={() => { if (persist()) onBattleTest(); }}>TESTAR NA ARENA</button></div>
    </section>

    <section className={styles.collection}>
      <header><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar carta..." /><select value={rarity} onChange={(event) => setRarity(event.target.value)}><option value="all">Todas as raridades</option><option value="common">Comum</option><option value="rare">Rara</option><option value="epic">Épica</option><option value="legendary">Lendária</option><option value="champion">Campeão</option></select><select value={power} onChange={(event) => setPower(event.target.value)}><option value="all">Todas as funções</option>{Object.entries(POWER_LABELS).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></header>
      <div className={styles.grid}>{filteredCards.map((card) => {
        const profile = arena25DPowerFor(card);
        const selected = deckIds.includes(card.id);
        const blockedChampion = CHAMPIONS.includes(card.id as typeof CHAMPIONS[number]) && card.id !== championId;
        return <button type="button" key={card.id} data-selected={selected} data-rarity={card.rarity} disabled={blockedChampion} onClick={() => toggleCard(card.id)}><img src={card.portrait} alt={card.name} /><b>{card.faith}</b><span>{card.name}</span><small>{profile.label}</small><em>{selected ? "NO DECK" : "+ ADICIONAR"}</em></button>;
      })}</div>
    </section>
  </section>;
}

