"use client";

import { useCallback, useState } from "react";
import { addVictoryChest, loadArenaChests } from "../lib/apostolic-arena-chests-v18";
import { loadArenaProgression, saveArenaProgression } from "../lib/apostolic-arena-progression-v17";
import { ApostolicArenaBattle3D, type ArenaTutorialEventV206 } from "./apostolic-arena-battle-3d";
import styles from "./arena-tutorial-v20-6.module.css";

export const ARENA_TUTORIAL_COMPLETE_KEY_V206 = "apostolic-arena-tutorial-complete-v20-6";

const STEPS = [
  { eyebrow: "BEM-VINDO, GUARDIÃO", title: "Lumi será sua guia", text: "Você aprenderá a usar Fé, invocar tropas, dominar as pontes e atacar as torres. O treinamento não altera seus troféus.", action: "COMEÇAR TREINAMENTO" },
  { eyebrow: "PASSO 1 DE 4", title: "Escolha uma carta", text: "Na parte inferior aparecem quatro cartas da sua mão. Clique ou toque numa carta que tenha custo menor ou igual à sua Fé." },
  { eyebrow: "PASSO 2 DE 4", title: "Invoque no território azul", text: "Arraste a carta até a área válida na metade inferior do campo. A unidade surgirá no ponto escolhido." },
  { eyebrow: "PASSO 3 DE 4", title: "Observe a travessia", text: "Sua tropa procura a ponte automaticamente. Defenda sua torre enquanto ela atravessa o rio e avança pela rota." },
  { eyebrow: "PASSO 4 DE 4", title: "Ataque as estruturas", text: "As tropas escolhem inimigos e torres dentro do alcance. Destruir o templo adversário encerra imediatamente a batalha." },
  { eyebrow: "TREINAMENTO CONCLUÍDO", title: "Você está pronto", text: "Receba 250 de Ouro, 50 XP e seu primeiro Baú de Madeira. Agora monte seu próprio deck de oito cartas.", action: "RECEBER E CONTINUAR" }
] as const;

export function ArenaTutorialV206({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step] ?? STEPS[0];

  const handleEvent = useCallback((event: ArenaTutorialEventV206) => {
    setStep((active) => {
      if (active === 1 && event === "card-selected") return 2;
      if (active === 2 && event === "unit-deployed") return 3;
      if (active === 3 && event === "bridge-crossed") return 4;
      if (active === 4 && (event === "tower-damaged" || event === "match-finished")) return 5;
      return active;
    });
  }, []);

  const finish = () => {
    const alreadyRewarded = window.localStorage.getItem(ARENA_TUTORIAL_COMPLETE_KEY_V206) === "1";
    if (!alreadyRewarded) {
      const progression = loadArenaProgression();
      const xp = progression.xp + 50;
      saveArenaProgression({ ...progression, gold: progression.gold + 250, xp, playerLevel: Math.max(progression.playerLevel, 1 + Math.floor(xp / 100)) });
      addVictoryChest(loadArenaChests());
    }
    window.localStorage.setItem(ARENA_TUTORIAL_COMPLETE_KEY_V206, "1");
    onComplete();
  };

  return <section className={styles.training} data-step={step}>
    <ApostolicArenaBattle3D trainingMode tutorialPaused={step === 0 || step === 5} onTutorialEvent={handleEvent} />
    <div className={styles.progress} aria-label={`Etapa ${Math.min(step, 4)} de 4`}>{[1,2,3,4].map((value) => <i key={value} data-done={step > value} data-active={step === value} />)}</div>
    <aside className={styles.guide} role={step === 0 || step === 5 ? "dialog" : "status"} aria-live="polite">
      <img src="/characters/lumi/bible-study-guide-v2.png" alt="Lumi, guia do treinamento" />
      <div><small>{current.eyebrow}</small><h2>{current.title}</h2><p>{current.text}</p>{step === 0 && <button type="button" onClick={() => setStep(1)}>{"action" in current ? current.action : "CONTINUAR"}</button>}{step === 5 && <button type="button" onClick={finish}>{"action" in current ? current.action : "CONTINUAR"}</button>}</div>
    </aside>
    {step === 2 && <span className={styles.deployPointer}>SOLTE A CARTA AQUI</span>}
  </section>;
}
