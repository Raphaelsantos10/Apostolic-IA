"use client";
import { useCallback,useEffect,useState } from "react";
import { createClient } from "../lib/supabase/client";
import styles from "./arena-alliance-war-center-v90.module.css";
export function ArenaAllianceWarCenterV90(){
 const[data,setData]=useState<any>(null),[message,setMessage]=useState("");
 const load=useCallback(()=>{void createClient().rpc("arena_get_alliance_war_center").then(({data,error})=>{if(error)setMessage("Central de guerra indisponível.");else setData(data);});},[]);useEffect(load,[load]);
 const battle=async()=>{const id=data?.war?.id;if(!id)return;const{data:ticket,error}=await createClient().rpc("arena_request_alliance_war_battle",{p_war_id:id});if(error)setMessage("Você não está escalado, já usou seus ataques ou a batalha ainda não começou.");else{sessionStorage.setItem("apostolic-alliance-war-ticket",JSON.stringify(ticket));setMessage("Ingresso criado. Abra a Arena para realizar o ataque.");}load();};
 const claim=async(id:string)=>{const{data:reward,error}=await createClient().rpc("arena_claim_alliance_war_reward",{p_war_id:id});setMessage(error?"Recompensa indisponível ou já recebida.":`Baú ${reward.chest}: +${reward.coins} moedas e +${reward.gems} gemas.`);load();};
 if(!data)return <section className={styles.shell}>{message||"A preparar a guerra…"}</section>;
 const w=data.war,me=data.me||{attacks_used:0,score:0};return <section className={styles.shell}><header><div><small>V86–V90 · GUERRAS COMPETITIVAS</small><h2>Temporada {data.season||"em preparação"}</h2></div>{w&&<strong>{w.status.toUpperCase()}</strong>}</header>{message&&<aside>{message}</aside>}
 {w?<article className={styles.duel}><div><span>{w.home_name}</span><b>{w.home_score}</b></div><i>×</i><div><span>{w.away_name}</span><b>{w.away_score}</b></div><footer><p>Seus ataques: {me.attacks_used}/4 · contribuição: {me.score}</p><button disabled={w.status!=="battle"||me.attacks_used>=4} onClick={()=>void battle()}>ENTRAR NA BATALHA</button></footer></article>:<p>Nenhuma guerra encontrada. A liderança pode entrar na fila acima.</p>}
 <div className={styles.columns}><article><h3>Baús de Guerra</h3>{data.rewards.map((r:any)=><section key={r.war_id}><b>{r.chest_tier.toUpperCase()}</b><span>{r.coins} moedas · {r.gems} gemas</span><button disabled={Boolean(r.claimed_at)} onClick={()=>void claim(r.war_id)}>{r.claimed_at?"RECEBIDO":"ABRIR BAÚ"}</button></section>)}</article><article><h3>Ranking da Temporada</h3>{data.ranking.map((r:any,i:number)=><p key={r.alliance_id}><b>#{i+1} {r.name} [{r.tag}]</b><span>{r.points} pts · {r.wins}V/{r.losses}D</span></p>)}</article></div></section>;
}
