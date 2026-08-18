"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { createClient } from "../lib/supabase/client";
import styles from "./apostolic-maritime-routes-v205.module.css";

type Route = {code:string;name:string;description:string;distance_nm:number;risk_percent:number;duration_seconds:number;gold_per_unit:number;research_name:string;research_unlocked:boolean};
type Vessel = {code:string;name:string;role:"merchant"|"defense";ready:number;cargo_capacity:number;escort_power:number};
type Report = {route_name:string;outcome:"safe_arrival"|"partial_loss";cargo_resource:string;cargo_sent:number;cargo_delivered:number;loss_percent:number;escort_power:number;gold_reward:number;summary:string;created_at:string};
type Active = {route_code:string;cargo_resource:string;cargo_quantity:number;merchant_code:string;merchant_quantity:number;escort_code:string|null;escort_quantity:number;cargo_capacity:number;escort_power:number;arrives_at:string};
type Data = {routes:Route[];resources:Record<string,number>;fleet:Vessel[];active:Active|null;departures_today:number;daily_limit:number;reports:Report[]};

const resourceNames:Record<string,string>={wheat:"Trigo",cedar:"Cedro",stone:"Pedra",oil:"Azeite"};
const icons:Record<string,string>={wheat:"🌾",cedar:"🪵",stone:"🪨",oil:"🫒"};
const duration=(seconds:number)=>seconds>=3600?`${Math.floor(seconds/3600)}h ${Math.ceil(seconds%3600/60)}m`:`${Math.ceil(seconds/60)} min`;

export function ApostolicMaritimeRoutesV205(){
 const[data,setData]=useState<Data|null>(null),[message,setMessage]=useState(""),[routeCode,setRouteCode]=useState(""),[resource,setResource]=useState("wheat"),[quantity,setQuantity]=useState(100),[merchantCode,setMerchantCode]=useState(""),[merchantQuantity,setMerchantQuantity]=useState(1),[escortCode,setEscortCode]=useState(""),[escortQuantity,setEscortQuantity]=useState(0),[now,setNow]=useState(Date.now()),[busy,setBusy]=useState(false);
 const load=useCallback(async()=>{const{data:next,error}=await createClient().rpc("apostolic_sync_maritime_center");if(error)setMessage(error.message);else setData(next as Data)},[]);
 useEffect(()=>{void load();const tick=setInterval(()=>setNow(Date.now()),1000),sync=setInterval(()=>void load(),30000);return()=>{clearInterval(tick);clearInterval(sync)}},[load]);
 const merchants=useMemo(()=>data?.fleet.filter(v=>v.role==="merchant")??[],[data]);
 const escorts=useMemo(()=>data?.fleet.filter(v=>v.role==="defense")??[],[data]);
 useEffect(()=>{if(!routeCode&&data?.routes[0])setRouteCode(data.routes[0].code);if(!merchantCode&&merchants[0])setMerchantCode(merchants[0].code);if(!escortCode&&escorts[0])setEscortCode(escorts[0].code)},[data,routeCode,merchantCode,escortCode,merchants,escorts]);
 const chosenRoute=data?.routes.find(r=>r.code===routeCode),chosenMerchant=merchants.find(v=>v.code===merchantCode),chosenEscort=escorts.find(v=>v.code===escortCode);
 const capacity=(chosenMerchant?.cargo_capacity??0)*merchantQuantity,protection=(chosenEscort?.escort_power??0)*escortQuantity;
 const left=data?.active?Math.max(0,Math.ceil((new Date(data.active.arrives_at).getTime()-now)/1000)):0;
 const sail=async()=>{if(!chosenRoute||!chosenMerchant)return;setBusy(true);const{error}=await createClient().rpc("apostolic_start_maritime_voyage",{p_route_code:routeCode,p_resource:resource,p_quantity:quantity,p_merchant_code:merchantCode,p_merchant_quantity:merchantQuantity,p_escort_code:escortQuantity>0?escortCode:null,p_escort_quantity:escortQuantity,p_idempotency_key:crypto.randomUUID()});setMessage(error?.message??`O comboio partiu para ${chosenRoute.name}.`);setBusy(false);void load()};
 return <section className={styles.shell}>
  <header><div><small>V201–V205 · ROTAS MARÍTIMAS</small><h1>Mar da Aliança</h1><p>Planeie expedições comerciais, proteja a tripulação e alcance portos distantes.</p></div><div className={styles.limit}>VIAGENS HOJE <b>{data?.departures_today??0}/{data?.daily_limit??4}</b></div></header>
  {message&&<p className={styles.notice}>{message}</p>}
  {data?.active?<article className={styles.active}><div><small>COMBOIO EM VIAGEM</small><h2>{data.routes.find(r=>r.code===data.active?.route_code)?.name}</h2><p>{icons[data.active.cargo_resource]} {data.active.cargo_quantity} · 📦 {data.active.cargo_capacity} · 🛡️ {data.active.escort_power}</p></div><div className={styles.countdown}>{left?duration(left):"Atracando…"}<span style={{"--progress":`${Math.min(100,Math.max(4,100-left/72))}%`} as CSSProperties}/></div></article>:
  <div className={styles.planner}>
   <div className={styles.routes}>{data?.routes.map(route=><button key={route.code}type="button"data-selected={routeCode===route.code}disabled={!route.research_unlocked}onClick={()=>setRouteCode(route.code)}><span>⚓ {route.distance_nm} milhas</span><strong>{route.name}</strong><small>{route.description}</small><em>⏳ {duration(route.duration_seconds)} · ⚠️ {route.risk_percent}%</em>{!route.research_unlocked&&<i>🔒 {route.research_name}</i>}</button>)}</div>
   <form className={styles.manifest}onSubmit={e=>{e.preventDefault();void sail()}}><h2>Manifesto de Carga</h2><label>Mercadoria<select value={resource}onChange={e=>setResource(e.target.value)}>{Object.entries(resourceNames).map(([code,name])=><option key={code}value={code}>{icons[code]} {name} · disponível {data?.resources[code]??0}</option>)}</select></label><label>Quantidade<input type="number"min={10}max={Math.max(10,capacity)}value={quantity}onChange={e=>setQuantity(Math.max(10,Number(e.target.value)||10))}/></label><label>Navio mercantil<select value={merchantCode}onChange={e=>setMerchantCode(e.target.value)}>{merchants.map(v=><option key={v.code}value={v.code}>{v.name} · {v.ready} prontos · carga {v.cargo_capacity}</option>)}</select></label><label>Quantidade de mercantes<input type="number"min={1}max={20}value={merchantQuantity}onChange={e=>setMerchantQuantity(Math.max(1,Math.min(20,Number(e.target.value)||1)))}/></label><label>Escolta<select value={escortCode}onChange={e=>setEscortCode(e.target.value)}>{escorts.map(v=><option key={v.code}value={v.code}>{v.name} · {v.ready} prontos · poder {v.escort_power}</option>)}</select></label><label>Quantidade da escolta<input type="number"min={0}max={20}value={escortQuantity}onChange={e=>setEscortQuantity(Math.max(0,Math.min(20,Number(e.target.value)||0)))}/></label><div className={styles.totals}><span>Capacidade <b>{capacity}</b></span><span>Proteção <b>{protection}</b></span><span>Risco base <b>{chosenRoute?.risk_percent??0}%</b></span></div><button className={styles.sail}disabled={busy||!chosenRoute?.research_unlocked||quantity>capacity||quantity>(data?.resources[resource]??0)||(data?.departures_today??0)>=(data?.daily_limit??4)}>{busy?"PREPARANDO…":"INICIAR VIAGEM"}</button></form>
  </div>}
  <section className={styles.reports}><h2>Diário de Bordo</h2>{data?.reports.length?data.reports.map((r,index)=><article key={`${r.created_at}-${index}`}><span>{r.outcome==="safe_arrival"?"🕊️":"🌊"}</span><div><strong>{r.route_name}</strong><small>{new Date(r.created_at).toLocaleString("pt-PT")}</small><p>{r.summary} {icons[r.cargo_resource]} {r.cargo_delivered}/{r.cargo_sent} · 🪙 {r.gold_reward}</p></div></article>):<p>Nenhuma viagem concluída. O primeiro diário ainda está em branco.</p>}</section>
 </section>
}
