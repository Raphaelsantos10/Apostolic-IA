"use client";
import { useEffect,useState } from "react";
import styles from "./arena-economy-admin-v48.module.css";
type Report={generated_at:string;summary:Record<string,number>;sources:Array<{source:string;earned:number;spent:number}>;products:Array<{product_id:string;purchases:number;gross_minor:number}>;retention:Record<string,number>;audit:Record<string,number|boolean>};
export function ArenaEconomyAdminV48(){
 const [report,setReport]=useState<Report|null>(null); const [loading,setLoading]=useState(false);
 useEffect(()=>{let active=true;void fetch("/api/arena/analytics?days=30").then(async response=>response.ok?response.json():null).then(data=>{if(active&&data)setReport(data as Report)});return()=>{active=false}},[]);
 if(!report)return null;
 const refresh=async()=>{setLoading(true);const response=await fetch("/api/arena/analytics?days=30");if(response.ok)setReport(await response.json() as Report);setLoading(false)};
 return <details className={styles.panel}><summary>PAINEL ADMINISTRATIVO · ECONOMIA V48</summary><header><span>Últimos 30 dias · agregado e sem dados pessoais</span><button type="button" disabled={loading} onClick={()=>void refresh()}>{loading?"ATUALIZANDO…":"ATUALIZAR"}</button></header><div className={styles.metrics}>{Object.entries(report.summary).map(([key,value])=><article key={key}><small>{key.replaceAll("_"," ")}</small><b>{Number(value).toLocaleString("pt-PT")}</b></article>)}</div><section><h4>FONTES E GASTOS DE GEMAS</h4>{report.sources.map(item=><p key={item.source}><span>{item.source}</span><b>+{item.earned}</b><em>-{item.spent}</em></p>)}</section><section><h4>PRODUTOS</h4>{report.products.length?report.products.map(item=><p key={item.product_id}><span>{item.product_id}</span><b>{item.purchases} compras</b><em>€{(item.gross_minor/100).toFixed(2)}</em></p>):<p>Nenhuma compra confirmada.</p>}</section><section><h4>AUDITORIA AUTOMÁTICA</h4>{Object.entries(report.audit).map(([key,value])=><p key={key} data-ok={value===0||value===true}><span>{key.replaceAll("_"," ")}</span><b>{String(value)}</b></p>)}</section></details>;
}
