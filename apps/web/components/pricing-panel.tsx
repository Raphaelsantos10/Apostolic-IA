"use client";

import { useEffect, useMemo, useState } from "react";
import { billingRegions, type BillingInterval, type BillingRegion, annualSavings, formatMinorAmount } from "../lib/billing";
import { createClient } from "../lib/supabase/client";

type Plan = {code:string;name:string;description:string;ai_daily_limit:number;sort_order:number};
type Price = {plan_code:string;region:string;currency:string;monthly_minor:number;annual_minor:number};

export function PricingPanel(){
  const [plans,setPlans]=useState<Plan[]>([]);
  const [prices,setPrices]=useState<Price[]>([]);
  const [region,setRegion]=useState<BillingRegion>("PT");
  const [interval,setInterval]=useState<BillingInterval>("monthly");
  const [loading,setLoading]=useState(true);
  const [message,setMessage]=useState("");

  useEffect(()=>{
    const locale=navigator.language.toUpperCase();
    if(locale.includes("BR"))setRegion("BR");
    else if(locale.includes("GB"))setRegion("GB");
    else if(locale.includes("IN"))setRegion("IN");
    else if(locale.includes("PK"))setRegion("PK");
    else if(locale.includes("US"))setRegion("US");
    const supabase=createClient();
    void Promise.all([
      supabase.from("billing_plans").select("code,name,description,ai_daily_limit,sort_order").order("sort_order"),
      supabase.from("billing_prices").select("plan_code,region,currency,monthly_minor,annual_minor").eq("active",true)
    ]).then(([planResult,priceResult])=>{
      if(planResult.error||priceResult.error)setMessage("Não foi possível carregar os planos.");
      else{setPlans((planResult.data??[]) as Plan[]);setPrices((priceResult.data??[]) as Price[]);}
      setLoading(false);
    });
  },[]);

  const regionalPrices=useMemo(()=>prices.filter((price)=>price.region===region),[prices,region]);

  async function checkout(planCode:string){
    setMessage("");
    const response=await fetch("/api/billing/checkout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({planCode,region,interval})});
    const data=await response.json();
    if(!response.ok){setMessage(data.error??"Checkout indisponível.");return;}
    window.location.assign(data.url);
  }

  return <section className="pricing" aria-labelledby="pricing-title">
    <p className="eyebrow">Sustentabilidade sem vantagem espiritual</p>
    <h1 id="pricing-title">Planos do Apostolic IA</h1>
    <p className="lead">A Bíblia e o estudo essencial permanecem gratuitos. Planos pagos financiam infraestrutura, maior uso de IA e bolsas de acesso.</p>
    <div className="pricing-controls">
      <label><span>Região</span><select value={region} onChange={(event)=>setRegion(event.target.value as BillingRegion)}>{Object.entries(billingRegions).map(([code,label])=><option key={code} value={code}>{label}</option>)}</select></label>
      <fieldset><legend>Cobrança</legend><label><input type="radio" checked={interval==="monthly"} onChange={()=>setInterval("monthly")}/> Mensal</label><label><input type="radio" checked={interval==="annual"} onChange={()=>setInterval("annual")}/> Anual</label></fieldset>
    </div>
    {loading&&<p role="status">A carregar planos…</p>}
    <div className="pricing-grid">{plans.map((plan)=>{
      const price=regionalPrices.find((item)=>item.plan_code===plan.code)??prices.find((item)=>item.plan_code===plan.code&&item.region==="GLOBAL");
      if(!price)return null;
      const minor=interval==="monthly"?price.monthly_minor:price.annual_minor;
      const savings=annualSavings(price.monthly_minor,price.annual_minor);
      return <article key={plan.code} className={plan.code==="plus"?"is-featured":""}>
        {plan.code==="plus"&&<span className="badge">Recomendado</span>}
        <h2>{plan.name}</h2><p>{plan.description}</p>
        <strong className="price">{minor===0?"Grátis":formatMinorAmount(minor,price.currency)}</strong>
        <span>{minor>0?`por ${interval==="monthly"?"mês":"ano"}`:"sem cartão"}</span>
        {interval==="annual"&&savings>0&&<span className="saving">Poupe cerca de {savings}%</span>}
        <ul><li>{plan.ai_daily_limit} perguntas de IA por dia</li><li>Bíblia e aprendizagem essenciais</li><li>Privacidade e cancelamento simples</li>{plan.code==="supporter"&&<li>Contribui para bolsas de acesso</li>}</ul>
        {plan.code==="free"?<button className="button button-secondary" type="button" disabled>Plano atual padrão</button>:<button className="button button-primary" type="button" onClick={()=>void checkout(plan.code)}>Escolher {plan.name}</button>}
      </article>;
    })}</div>
    {message&&<p className="pricing-message" role="alert">{message}</p>}
    <p className="pricing-note">Valores iniciais sujeitos a validação fiscal e das lojas. Impostos podem ser incluídos conforme a região. Nenhum pagamento é ativado sem configuração segura do provedor.</p>
  </section>;
}
