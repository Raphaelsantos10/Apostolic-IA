"use client";

import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase/client";
import type { ArenaWallet } from "../lib/apostolic-arena-economy-config";
import styles from "./arena-pass-v46.module.css";

type Reward = { currency?: "coins" | "gems"; amount?: number; product_id?: string };
type Level = { level: number; xp_required: number; free_reward: Reward | null; premium_reward: Reward | null; free_claimed: boolean; premium_claimed: boolean };
type PassStatus = { active: boolean; season_id?: string; name?: string; ends_at?: string; xp?: number; premium?: boolean; levels?: Level[] };
const rewardLabel = (reward: Reward | null) => !reward ? "—" : reward.product_id ? reward.product_id.replaceAll("-"," ") : `${reward.amount ?? 0} ${reward.currency === "gems" ? "gemas" : "moedas"}`;

export function ArenaPassV46({ onWalletChange }: { onWalletChange: (wallet: ArenaWallet) => void }) {
  const [status,setStatus] = useState<PassStatus | null>(null);
  const [busy,setBusy] = useState("");
  const [message,setMessage] = useState("A carregar temporada…");
  const load = async () => {
    const { data,error } = await createClient().rpc("arena_get_pass_status");
    if (error) { setMessage("Aplique a migração V46 para ativar o Passe."); return; }
    setStatus((data ?? { active:false }) as PassStatus); setMessage("");
  };
  useEffect(() => { void load(); }, []);
  const claim = async (level: number,track: "free"|"premium") => {
    const key=`${level}:${track}`; setBusy(key);
    const { data,error }=await createClient().rpc("arena_claim_pass_reward",{p_level:level,p_track:track});
    if (error) setMessage(error.message.includes("premium") ? "A trilha premium ainda não foi adquirida." : "Esta recompensa está bloqueada ou já foi recebida.");
    else { const result=data as {coins?:number;gems?:number}; if(typeof result.coins==="number"&&typeof result.gems==="number") onWalletChange({coins:result.coins,gems:result.gems}); setMessage("Recompensa adicionada ao inventário."); await load(); }
    setBusy("");
  };
  if (!status?.active) return <section className={styles.empty}><b>PASSE DA ALIANÇA</b><span>{message || "Nenhuma temporada ativa."}</span></section>;
  const xp=status.xp ?? 0; const levels=status.levels ?? []; const next=levels.find(item=>item.xp_required>xp); const progress=next ? Math.min(100,xp/Math.max(1,next.xp_required)*100) : 100;
  return <section className={styles.pass}>
    <header><div><small>TEMPORADA ATIVA</small><h3>{status.name}</h3><p>Progresso cosmético e recompensas. Nenhum nível aumenta o poder de combate.</p></div><strong data-premium={status.premium}>{status.premium ? "PASSE PREMIUM ATIVO" : "TRILHA GRATUITA"}</strong></header>
    <div className={styles.progress}><span><b>{xp} XP</b><em>{next ? `Próximo nível: ${next.xp_required} XP` : "Trilha concluída"}</em></span><i><em style={{width:`${progress}%`}} /></i></div>
    {message && <p className={styles.message} role="status">{message}</p>}
    <div className={styles.levels}>{levels.map(item=>{const unlocked=xp>=item.xp_required;return <article key={item.level} data-unlocked={unlocked}><b>{item.level}</b><small>{item.xp_required} XP</small><div><span>LIVRE</span><em>{rewardLabel(item.free_reward)}</em><button type="button" disabled={!unlocked||item.free_claimed||busy!==""} onClick={()=>void claim(item.level,"free")}>{item.free_claimed?"RECEBIDO":"RESGATAR"}</button></div><div data-premium><span>PREMIUM</span><em>{rewardLabel(item.premium_reward)}</em><button type="button" disabled={!unlocked||!status.premium||item.premium_claimed||busy!==""} onClick={()=>void claim(item.level,"premium")}>{item.premium_claimed?"RECEBIDO":status.premium?"RESGATAR":"BLOQUEADO"}</button></div></article>})}</div>
  </section>;
}
