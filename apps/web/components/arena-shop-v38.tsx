"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createClient } from "../lib/supabase/client";
import type { ArenaShopCategory, ArenaShopProduct, ArenaWallet } from "../lib/apostolic-arena-economy-config";
import { ARENA_SHOP_CATALOG } from "../lib/apostolic-arena-shop-catalog";
import { useArenaMotionStage } from "../lib/use-arena-motion-stage";
import styles from "./arena-shop-v38.module.css";
import "./arena-shop-v42.css";
import { ArenaPassV46 } from "./arena-pass-v46";
import { ArenaEconomyAdminV48 } from "./arena-economy-admin-v48";
import Link from "next/link";
import "./arena-shop-v50.css";
import "./arena-shop-v51.css";
import "./arena-shop-v56.css";
import "./arena-shop-v57.css";
import "./arena-shop-v59.css";

const CATEGORIES: { id: ArenaShopCategory; label: string }[] = [
  { id: "featured", label: "Destaques" }, { id: "chests", label: "Baús" }, { id: "skins", label: "Skins" },
  { id: "effects", label: "Emotes e efeitos" }, { id: "pass", label: "Passe" }, { id: "gems", label: "Gemas" }
];

type PurchaseResult = { coins?: number; gems?: number; product_id?: string; quantity?:number };
type DailyGift = { can_claim: boolean; streak_day: number; next_day: number; reward_currency: "coins" | "gems"; reward_amount: number };
type FreeGemStatus = { period_key: string; earned: number; target: number; hard_cap: number; remaining: number };
type CosmeticLoadout = Partial<Record<"skin" | "emote" | "entrance_effect" | "victory_effect", string>>;
type CatalogRow = { id:string; category:ArenaShopCategory; name:string; currency:"gems"|"money"|"coins"; price:number; compare_at_price:number|null; sort_order:number; purchase_limit:number|null; active:boolean; ends_at:string|null; metadata:Record<string,unknown> };
type PurchaseHistoryItem={id:string;product_id:string;name:string;image?:string;currency:"gems"|"coins"|"money";amount:number;status:string;occurred_at:string};
type RefundDraft={receipt:PurchaseHistoryItem;reason:string;details:string};
type RotatingOffer={kind:"daily"|"weekly";product_id:string;name:string;subtitle:string;image:string;currency:"gems"|"coins";original_price:number;offer_price:number;discount_percent:number;ends_at:string};
type ChestOpening={product:ArenaShopProduct;stage:"ready"|"opening"|"revealed";reward?:{coins:number;gems:number;remaining:number}};
const cosmeticSlot = (id: string) => id.startsWith("skin-") ? "skin" : id.startsWith("emote-") ? "emote" : id === "effect-fogo-celestial" ? "entrance_effect" : id.startsWith("effect-") ? "victory_effect" : null;
const collectionLabel = (product: ArenaShopProduct) => product.category === "gems" ? "TESOUROS CELESTIAIS" : product.category === "chests" ? "RELÍQUIAS DA ALIANÇA" : product.category === "skins" ? "VESTES DE HONRA" : product.category === "effects" ? "SINAIS E VITÓRIAS" : "TEMPORADA CELESTIAL";
const catalogProduct = (row:CatalogRow):ArenaShopProduct => { const fallback=ARENA_SHOP_CATALOG.find(item=>item.id===row.id); const rarity=String(row.metadata.rarity??fallback?.rarity??"rare") as ArenaShopProduct["rarity"]; return { id:row.id,category:row.category,name:row.name,subtitle:String(row.metadata.subtitle??fallback?.subtitle??"Item da Loja da Aliança"),currency:row.currency,price:Number(row.price),image:String(row.metadata.image??fallback?.image??"/games/apostolic-arena/ui/emblems/loja-v1.png"),rarity:["rare","epic","legendary","premium"].includes(rarity)?rarity:"rare",featured:row.metadata.featured===true,available:row.active,sortOrder:row.sort_order,stackable:row.metadata.stackable===true,...(row.compare_at_price===null?{}:{compareAtPrice:row.compare_at_price}),...(row.purchase_limit===null?{}:{purchaseLimit:row.purchase_limit}),...(row.ends_at===null?{}:{endsAt:row.ends_at}) }; };
const remainingTime=(endsAt:string|undefined,now:number)=>{if(!endsAt)return "";const ms=new Date(endsAt).getTime()-now;if(ms<=0)return "ENCERRADA";const hours=Math.floor(ms/3600000);const days=Math.floor(hours/24);return days>0?`${days}D ${hours%24}H`:`${hours}H ${Math.floor(ms%3600000/60000)}MIN`;};

export function ArenaShopV38({ fallbackWallet, onWalletChange }: { fallbackWallet: ArenaWallet; onWalletChange: (wallet: ArenaWallet) => void }) {
  const shopRef = useRef<HTMLElement>(null);
  useArenaMotionStage(shopRef);
  const [category, setCategory] = useState<ArenaShopCategory>("featured");
  const [wallet, setWallet] = useState<ArenaWallet>(fallbackWallet);
  const [owned, setOwned] = useState<Set<string>>(new Set());
  const [quantities,setQuantities]=useState<Record<string,number>>({});
  const [selected, setSelected] = useState<ArenaShopProduct | null>(null);
  const [message, setMessage] = useState("A carregar carteira segura…");
  const [busy, setBusy] = useState(false);
  const [gift, setGift] = useState<DailyGift | null>(null);
  const [claimingGift, setClaimingGift] = useState(false);
  const [freeGems, setFreeGems] = useState<FreeGemStatus | null>(null);
  const [loadout, setLoadout] = useState<CosmeticLoadout>({});
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [catalog,setCatalog]=useState<readonly ArenaShopProduct[]>(ARENA_SHOP_CATALOG);
  const [catalogLoading,setCatalogLoading]=useState(true);
  const [query,setQuery]=useState("");
  const [rarityFilter,setRarityFilter]=useState("all");
  const [currencyFilter,setCurrencyFilter]=useState("all");
  const [sort,setSort]=useState("featured");
  const [clock,setClock]=useState(()=>Date.now());
  const [history,setHistory]=useState<PurchaseHistoryItem[]>([]);
  const [justPurchased,setJustPurchased]=useState<ArenaShopProduct|null>(null);
  const [offers,setOffers]=useState<RotatingOffer[]>([]);
  const [chestOpening,setChestOpening]=useState<ChestOpening|null>(null);
  const [refundDraft,setRefundDraft]=useState<RefundDraft|null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const supabase = createClient();
      const [{ data: auth }, walletResponse, inventoryResponse, giftResponse, freeGemResponse, loadoutResponse, catalogResponse,historyResponse,offersResponse] = await Promise.all([
        supabase.auth.getUser(), supabase.rpc("arena_get_wallet"), supabase.from("arena_player_inventory").select("product_id,quantity"), supabase.rpc("arena_daily_gift_status"), supabase.rpc("arena_free_gem_status"), supabase.rpc("arena_get_cosmetic_loadout"), supabase.from("arena_shop_products").select("id,category,name,currency,price,compare_at_price,sort_order,purchase_limit,active,ends_at,metadata").order("sort_order"),supabase.rpc("arena_get_purchase_history",{p_limit:20}),supabase.rpc("arena_get_rotating_shop_offers")
      ]);
      if (!active) return;
      const liveOffers=!offersResponse.error&&Array.isArray(offersResponse.data)?offersResponse.data as RotatingOffer[]:[];setOffers(liveOffers);
      if (!catalogResponse.error && catalogResponse.data?.length) {const mapped=(catalogResponse.data as CatalogRow[]).map(catalogProduct).map(product=>{const offer=liveOffers.find(item=>item.product_id===product.id);return offer?{...product,price:offer.offer_price,compareAtPrice:offer.original_price,endsAt:offer.ends_at}:product});setCatalog(mapped);}
      setCatalogLoading(false);
      if (!auth.user) { setMessage("Entre na sua conta para sincronizar compras e recompensas."); return; }
      const row = Array.isArray(walletResponse.data) ? walletResponse.data[0] : walletResponse.data;
      if (row && typeof row === "object" && "coins" in row && "gems" in row) {
        const next = { coins: Number(row.coins), gems: Number(row.gems) };
        setWallet(next); onWalletChange(next); setMessage("Saldo protegido e sincronizado.");
      } else setMessage("Aplique a migração V38 para ativar a carteira segura.");
      if (!inventoryResponse.error) {setOwned(new Set((inventoryResponse.data ?? []).map((item) => String(item.product_id))));setQuantities(Object.fromEntries((inventoryResponse.data??[]).map(item=>[String(item.product_id),Number(item.quantity)])));}
      if (!giftResponse.error && giftResponse.data) setGift(giftResponse.data as DailyGift);
      if (!freeGemResponse.error && freeGemResponse.data) setFreeGems(freeGemResponse.data as FreeGemStatus);
      if (!loadoutResponse.error && loadoutResponse.data) setLoadout(loadoutResponse.data as CosmeticLoadout);
      if(!historyResponse.error&&Array.isArray(historyResponse.data))setHistory(historyResponse.data as PurchaseHistoryItem[]);
    };
    void load();
    return () => { active = false; };
  }, [onWalletChange]);
  useEffect(()=>{const timer=window.setInterval(()=>setClock(Date.now()),60000);return()=>window.clearInterval(timer)},[]);
  useEffect(() => { void createClient().rpc("arena_track_event", { p_event_name: category === "pass" ? "pass_view" : "shop_view", p_product_id: null, p_properties: { category } }); }, [category]);
  useEffect(() => {
    const payment = new URLSearchParams(window.location.search).get("arenaPayment");
    if (payment === "success") setMessage("Pagamento recebido. A confirmação segura pode levar alguns segundos; atualize a carteira se necessário.");
    if (payment === "cancel") setMessage("Pagamento cancelado. Nenhum valor foi creditado.");
  }, []);

  const products = useMemo(() => { const normalized=query.trim().toLocaleLowerCase("pt-PT"); return catalog.filter(item=>(category==="featured"?item.featured:item.category===category)&&(!normalized||`${item.name} ${item.subtitle}`.toLocaleLowerCase("pt-PT").includes(normalized))&&(rarityFilter==="all"||item.rarity===rarityFilter)&&(currencyFilter==="all"||item.currency===currencyFilter)).sort((a,b)=>sort==="price-low"?a.price-b.price:sort==="price-high"?b.price-a.price:(a.sortOrder??100)-(b.sortOrder??100)); }, [catalog,category,query,rarityFilter,currencyFilter,sort]);
  const dailyOffer=offers.find(item=>item.kind==="daily");
  const dailyProduct=dailyOffer?catalog.find(item=>item.id===dailyOffer.product_id):catalog.find(item=>item.category==="chests"&&item.available!==false);
  const dailyPresentation=dailyOffer??(dailyProduct?{kind:"daily" as const,product_id:dailyProduct.id,name:dailyProduct.name,subtitle:dailyProduct.subtitle,image:dailyProduct.image,currency:dailyProduct.currency==="coins"?"coins" as const:"gems" as const,original_price:dailyProduct.price,offer_price:dailyProduct.price,discount_percent:0,ends_at:""}:null);

  const claimDailyGift = async () => {
    if (!gift?.can_claim || claimingGift) return;
    setClaimingGift(true);
    const { data, error } = await createClient().rpc("arena_claim_daily_gift");
    if (error) { setMessage("Não foi possível resgatar o presente diário."); setClaimingGift(false); return; }
    const result = data as PurchaseResult & { claimed?: boolean; streak_day?: number; reward_currency?: "coins" | "gems"; reward_amount?: number };
    const next = { coins: Number(result.coins ?? wallet.coins), gems: Number(result.gems ?? wallet.gems) };
    setWallet(next); onWalletChange(next);
    setGift((current) => current ? { ...current, can_claim: false, streak_day: Number(result.streak_day ?? current.streak_day), reward_currency: result.reward_currency ?? current.reward_currency, reward_amount: Number(result.reward_amount ?? current.reward_amount) } : current);
    setMessage(result.claimed ? `Presente recebido: ${result.reward_amount} ${result.reward_currency === "gems" ? "gemas" : "moedas"}.` : "O presente de hoje já havia sido recebido.");
    setClaimingGift(false);
  };

  const confirmPurchase = async () => {
    if (!selected || selected.available === false || busy) return;
    if (selected.currency === "money") {
      setBusy(true);
      void createClient().rpc("arena_track_event", { p_event_name:"checkout_started", p_product_id:selected.id, p_properties:{} });
      const response = await fetch("/api/arena/checkout", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({productId:selected.id}) });
      const result = await response.json().catch(() => ({})) as {url?:string;error?:string};
      if (!response.ok || !result.url) { setMessage(result.error ?? "Pagamento temporariamente indisponível."); setBusy(false); setSelected(null); return; }
      window.location.assign(result.url); return;
    }
    if (selected.currency !== "gems"&&selected.currency!=="coins") return;
    setBusy(true);
    const { data, error } = await createClient().rpc("arena_purchase_product", { p_product_id: selected.id, p_idempotency_key: crypto.randomUUID() });
    if (error) { setMessage(error.message.includes("purchase limit")?"O limite de compras deste item foi alcançado.":error.message.includes("insufficient coins")?"Moedas insuficientes para esta compra.":error.message.includes("insufficient") ? "Gemas insuficientes para esta compra." : "Não foi possível concluir a compra segura."); setBusy(false); return; }
    const result = (data ?? {}) as PurchaseResult;
    const next = { coins: Number(result.coins ?? wallet.coins), gems: Number(result.gems ?? wallet.gems) };
    setWallet(next); onWalletChange(next); setOwned((current) => new Set(current).add(selected.id));setQuantities(current=>({...current,[selected.id]:Number(result.quantity??1)}));
    setHistory(current=>[{id:crypto.randomUUID(),product_id:selected.id,name:selected.name,image:selected.image,currency:selected.currency,amount:selected.price,status:"completed",occurred_at:new Date().toISOString()},...current].slice(0,20));setJustPurchased(selected);
    setMessage(`${selected.name} foi adicionado ao seu inventário.`); setSelected(null); setBusy(false);
  };

  const equipCosmetic = async (product: ArenaShopProduct) => {
    const slot = cosmeticSlot(product.id);
    if (!slot || busy) return;
    setBusy(true);
    const { data, error } = await createClient().rpc("arena_equip_cosmetic", { p_product_id: product.id });
    if (error) setMessage("Não foi possível equipar este cosmético.");
    else { setLoadout((data ?? {}) as CosmeticLoadout); setMessage(`${product.name} equipado sem alterar o poder de combate.`); }
    setBusy(false);
  };

  const openPurchasedChest=async()=>{
    if(!chestOpening||chestOpening.stage!=="ready"||busy)return;
    setBusy(true);setChestOpening(current=>current?{...current,stage:"opening"}:current);
    const {data,error}=await createClient().rpc("arena_open_shop_chest",{p_product_id:chestOpening.product.id,p_idempotency_key:crypto.randomUUID()});
    if(error){setMessage("Não foi possível abrir o baú com segurança.");setChestOpening(current=>current?{...current,stage:"ready"}:current);setBusy(false);return;}
    const result=data as {coins:number;gems:number;reward_coins:number;reward_gems:number;remaining:number};
    window.setTimeout(()=>{const next={coins:Number(result.coins),gems:Number(result.gems)};setWallet(next);onWalletChange(next);setQuantities(current=>({...current,[chestOpening.product.id]:Number(result.remaining)}));setChestOpening(current=>current?{...current,stage:"revealed",reward:{coins:Number(result.reward_coins),gems:Number(result.reward_gems),remaining:Number(result.remaining)}}:current);setMessage("Tesouros do baú creditados na sua carteira.");setBusy(false)},900);
  };
  const requestRefund=async()=>{if(!refundDraft||busy)return;setBusy(true);const {data,error}=await createClient().rpc("arena_request_refund",{p_receipt_id:refundDraft.receipt.id,p_reason:refundDraft.reason,p_details:refundDraft.details});if(error)setMessage(error.message.includes("already")?"Já existe um pedido para este recibo.":"Não foi possível enviar o pedido de reembolso.");else{const result=data as {request_code?:string};setMessage(`Pedido ${result.request_code??""} enviado para análise. Nenhum saldo foi alterado.`);setRefundDraft(null)}setBusy(false)};

  return <section ref={shopRef} className={styles.shop} data-arena-shop="root" aria-label="Loja da Aliança">
    <header className={styles.header} data-arena-shop="hero">
      <img className={styles.shopBackdrop} src="/games/apostolic-arena/ui/backgrounds/loja-cidadela-celestial-v50.webp" alt="Cidadela celestial da Loja da Aliança" />
      <div className={styles.heroCopy}><small>ECONOMIA JUSTA · SEM PAY-TO-WIN</small><h2>LOJA DA ALIANÇA</h2><p>Relíquias, visuais e recompensas da cidadela. Personalize a sua jornada sem comprar poder.</p><span>COLEÇÃO CELESTIAL · OFERTAS DA TEMPORADA</span></div>
      <div className={styles.wallet} aria-label="Carteira da Arena">
        <span><img src="/games/apostolic-arena/ui/currency/moedas-celestiais-v1.webp" alt="" /><em>MOEDAS<b>{wallet.coins.toLocaleString("pt-PT")}</b></em></span>
        <span><img src="/games/apostolic-arena/ui/currency/gema-celestial-v1.png" alt="" /><em>GEMAS<b>{wallet.gems.toLocaleString("pt-PT")}</b></em></span>
      </div>
    </header>
    <nav className={styles.tabs} data-arena-shop="tabs" aria-label="Categorias da loja">{CATEGORIES.map((item) => <button key={item.id} type="button" data-active={category === item.id} onClick={() => setCategory(item.id)}>{item.label}</button>)}</nav>
    {dailyPresentation&&(()=>{const offer=dailyPresentation;const product=dailyProduct;return <section className={styles.dailyOffer} aria-label={dailyOffer?"Oferta diária":"Destaque diário"}>
      <img className={styles.offerBackground} src="/games/apostolic-arena/ui/backgrounds/oferta-diaria-celestial-v60-1.webp" alt="Cidadela celestial com baú de gemas e moedas" />
      <div className={styles.offerParticles} aria-hidden="true"><i/><i/><i/><i/><i/></div>
      <div className={styles.offerCopy}><small>{dailyOffer?"OFERTA DIÁRIA · ROTAÇÃO AUTOMÁTICA":"DESTAQUE DIÁRIO · CATÁLOGO SEGURO"}</small><h3>{offer.name}</h3><p>{offer.subtitle}. Uma oportunidade escolhida hoje pela cidadela.</p><span>{offer.discount_percent>0&&<del>{offer.original_price}</del>}<strong>{offer.offer_price}</strong><em>{offer.currency==="gems"?"GEMAS":"MOEDAS"}</em>{offer.discount_percent>0&&<b>-{offer.discount_percent}%</b>}</span>{offer.ends_at?<time dateTime={offer.ends_at}>TERMINA EM {remainingTime(offer.ends_at,clock)}</time>:<time>PREÇO NORMAL · SEM DESCONTO ATIVO</time>}<button type="button" disabled={!product} onClick={()=>product&&setSelected(product)}>{dailyOffer?"VER OFERTA":"VER DESTAQUE"}</button></div>
      <div className={styles.offerLayers} aria-hidden="true"><img src="/games/apostolic-arena/ui/currency/gema-celestial-v1.png" alt=""/><img src="/games/apostolic-arena/ui/currency/moedas-celestiais-v1.webp" alt=""/></div>
      {offers.find(item=>item.kind==="weekly")&&<aside><small>ESCOLHA DA SEMANA</small><b>{offers.find(item=>item.kind==="weekly")!.name}</b><span>-{offers.find(item=>item.kind==="weekly")!.discount_percent}% · {remainingTime(offers.find(item=>item.kind==="weekly")!.ends_at,clock)}</span></aside>}
    </section>})()}
    {freeGems && <section className={styles.gemBudget} aria-label="Limite mensal de gemas gratuitas">
      <div><small>GEMAS GRATUITAS · {freeGems.period_key}</small><b>{freeGems.earned} de {freeGems.hard_cap}</b><span>{freeGems.remaining} ainda disponíveis neste mês</span></div>
      <i aria-hidden="true"><em style={{ width: `${Math.min(100, freeGems.earned / Math.max(1, freeGems.hard_cap) * 100)}%` }} /></i>
      <strong>Meta saudável: {freeGems.target}</strong>
    </section>}
    {category === "pass" && <section className={styles.passShowcase} data-arena-motion aria-label="Passe da Aliança">
      <div><small>TEMPORADA CELESTIAL</small><h3>Passe da Aliança</h3><p>Uma jornada visual de recompensas cosméticas, sem vantagens de poder.</p></div>
      <ol><li data-track="free"><span>TRILHA LIVRE</span><b>Recompensas para todos</b></li><li data-track="premium"><span>TRILHA PREMIUM</span><b>Visuais e efeitos exclusivos</b></li><li><span>COMPROMISSO</span><b>Sem pay-to-win</b></li></ol>
      <strong>EM PREPARAÇÃO</strong>
    </section>}
    {category === "pass" && <ArenaPassV46 onWalletChange={(next) => { setWallet(next); onWalletChange(next); }} />}
    {gift && <section className={styles.dailyGift} data-ready={gift.can_claim} aria-label="Presente diário">
      <div><img src={gift.reward_currency === "gems" ? "/games/apostolic-arena/ui/currency/gema-celestial-v1.png" : "/games/apostolic-arena/ui/currency/moedas-celestiais-v1.webp"} alt="" /><span><small>SEQUÊNCIA DA ALIANÇA · DIA {gift.streak_day}/7</small><b>{gift.can_claim ? "Seu presente diário está pronto" : "Presente diário recebido"}</b><em>{gift.reward_amount} {gift.reward_currency === "gems" ? "gemas" : "moedas"}</em></span></div>
      <ol aria-label="Progresso semanal">{Array.from({ length: 7 }, (_, index) => <li key={index + 1} data-complete={index + 1 <= gift.streak_day && !gift.can_claim} data-current={index + 1 === gift.streak_day}>{index === 6 ? "💎" : index + 1}</li>)}</ol>
      <button type="button" disabled={!gift.can_claim || claimingGift} onClick={claimDailyGift}>{claimingGift ? "RESGATANDO…" : gift.can_claim ? "RESGATAR" : "VOLTE AMANHÃ"}</button>
    </section>}
    <section className={styles.catalogTools} aria-label="Pesquisa e filtros da loja">
      <label><span>PROCURAR</span><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Pesquisar relíquias, skins e baús" /></label>
      <label><span>RARIDADE</span><select value={rarityFilter} onChange={event=>setRarityFilter(event.target.value)}><option value="all">Todas</option><option value="rare">Rara</option><option value="epic">Épica</option><option value="legendary">Lendária</option><option value="premium">Premium</option></select></label>
      <label><span>MOEDA</span><select value={currencyFilter} onChange={event=>setCurrencyFilter(event.target.value)}><option value="all">Todas</option><option value="gems">Gemas</option><option value="coins">Moedas</option><option value="money">Euro</option></select></label>
      <label><span>ORDEM</span><select value={sort} onChange={event=>setSort(event.target.value)}><option value="featured">Recomendados</option><option value="price-low">Menor preço</option><option value="price-high">Maior preço</option></select></label>
    </section>
    <div className={styles.catalogMeta}><span>{products.length} {products.length===1?"item":"itens"}</span><em>CATÁLOGO SINCRONIZADO · PREÇOS VALIDADOS NO SERVIDOR</em></div>
    {justPurchased&&<section className={styles.purchaseSuccess} role="status"><img src={justPurchased.image} alt="" /><span><small>COMPRA CONCLUÍDA</small><b>{justPurchased.name}</b><em>Item entregue ao seu inventário.</em></span>{justPurchased.category==="chests"&&<button type="button" disabled={busy} onClick={()=>{setChestOpening({product:justPurchased,stage:"ready"});setJustPurchased(null)}}>ABRIR AGORA</button>}{cosmeticSlot(justPurchased.id)&&<button type="button" disabled={busy} onClick={()=>{void equipCosmetic(justPurchased);setJustPurchased(null)}}>EQUIPAR AGORA</button>}<button type="button" aria-label="Fechar" onClick={()=>setJustPurchased(null)}>×</button></section>}
    <div className={styles.status} role="status">{message}</div>
    {catalogLoading ? <div className={styles.skeletonGrid} aria-label="A carregar catálogo">{Array.from({length:6},(_,index)=><i key={index} />)}</div> : products.length===0 ? <section className={styles.emptyCatalog}><b>NENHUM ITEM ENCONTRADO</b><span>Altere os filtros ou explore outra categoria da Loja da Aliança.</span><button type="button" onClick={()=>{setQuery("");setRarityFilter("all");setCurrencyFilter("all")}}>LIMPAR FILTROS</button></section> : <div className={styles.grid} data-arena-shop="grid">{products.map((product, index) => {
      const hasProduct = owned.has(product.id);const isOwned = hasProduct&&!product.stackable; const money = product.currency === "money";
      const slot = cosmeticSlot(product.id); const isEquipped = Boolean(slot && loadout[slot] === product.id);
      return <article className={styles.card} data-arena-shop="card" data-arena-motion data-rarity={product.rarity} data-collection={product.category} key={product.id} style={{ "--arena-order": index } as CSSProperties}>
        <div className={styles.art}><img src={product.image} alt={product.name} loading={index>3?"lazy":"eager"} onError={event=>{event.currentTarget.src="/games/apostolic-arena/ui/emblems/loja-v1.png"}} /><i>{product.rarity === "premium" ? "PASSE" : product.rarity.toUpperCase()}</i>{product.endsAt&&<time dateTime={product.endsAt}>{remainingTime(product.endsAt,clock)}</time>}{Boolean(quantities[product.id])&&<mark>×{quantities[product.id]}</mark>}<span className={styles.cardIndex}>{String(index + 1).padStart(2,"0")}</span><small className="arena-v56-collection">{collectionLabel(product)}</small></div>
        <div className={styles.cardBody}><h3>{product.name}</h3><p>{product.subtitle}</p>
          <strong className={styles.price}>{product.compareAtPrice&&<del>{money?`€${(product.compareAtPrice/100).toFixed(2).replace(".",",")}`:product.compareAtPrice}</del>}{money ? `€${(product.price / 100).toFixed(2).replace(".", ",")}` : <><img src={product.currency==="coins"?"/games/apostolic-arena/ui/currency/moedas-celestiais-v1.webp":"/games/apostolic-arena/ui/currency/gema-celestial-v1.png"} alt="" />{product.price}</>}{product.compareAtPrice&&<small>-{Math.round((1-product.price/product.compareAtPrice)*100)}%</small>}</strong>
          <button type="button" data-equipped={isEquipped} disabled={isEquipped || product.available === false || busy} onClick={() => { void createClient().rpc("arena_track_event",{p_event_name:"product_view",p_product_id:product.id,p_properties:{category:product.category}}); if (isOwned && slot) void equipCosmetic(product); else { setLegalAccepted(false); setSelected(product); } }}>{isEquipped ? "EQUIPADO" : isOwned && slot ? "EQUIPAR" : isOwned ? "ADQUIRIDO" : product.available === false ? "EM BREVE" : "VER DETALHES"}</button>
        </div>
      </article>;
    })}</div>}
    {history.length>0&&<details className={styles.purchaseHistory}><summary>HISTÓRICO E RECIBOS <span>{history.length} REGISTOS</span></summary><div>{history.map(item=><article key={item.id} className="arena-v59-history-item"><img src={item.image||"/games/apostolic-arena/ui/emblems/loja-v1.png"} alt="" /><span><b>{item.name}</b><small>{new Date(item.occurred_at).toLocaleString("pt-PT")}</small>{item.currency==="money"&&<code>RECIBO {item.id.slice(0,8).toUpperCase()}</code>}</span><em data-status={item.status}>{item.status==="completed"||item.status==="paid"?"CONCLUÍDA":item.status.toUpperCase()}</em><strong>{item.currency==="money"?`€${(item.amount/100).toFixed(2).replace(".",",")}`:`${item.amount} ${item.currency==="gems"?"gemas":"moedas"}`}</strong>{item.currency==="money"&&item.status==="paid"&&<button type="button" onClick={()=>setRefundDraft({receipt:item,reason:"delivery_problem",details:""})}>PEDIR ANÁLISE</button>}</article>)}</div></details>}
    {selected && <div className={styles.dialogBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
      <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="arena-purchase-title">
        <img src={selected.image} alt="" /><small>{selected.currency === "money" ? "PAGAMENTO SEGURO · STRIPE" : "COMPRA COSMÉTICA SEGURA"}</small><h3 id="arena-purchase-title">{selected.name}</h3><p>{selected.subtitle}. Não concede vantagem competitiva.</p>
        {selected.currency === "money" ? <><dl><div><dt>Produto</dt><dd>{selected.name}</dd></div><div><dt>Preço total</dt><dd>€{(selected.price/100).toFixed(2).replace(".",",")}</dd></div><div><dt>Entrega</dt><dd>Após confirmação</dd></div></dl><label className={styles.legalConsent}><input type="checkbox" checked={legalAccepted} onChange={(event)=>setLegalAccepted(event.target.checked)} /><span>Li e aceito os <Link href="/legal/termos" target="_blank">Termos</Link>, a <Link href="/legal/privacidade" target="_blank">Privacidade</Link> e a <Link href="/legal/reembolsos" target="_blank">Política de Reembolso</Link>.</span></label></> : <dl><div><dt>Você possui</dt><dd>{(selected.currency==="coins"?wallet.coins:wallet.gems).toLocaleString("pt-PT")} {selected.currency==="coins"?"moedas":"gemas"}</dd></div><div><dt>Preço</dt><dd>{selected.price.toLocaleString("pt-PT")} {selected.currency==="coins"?"moedas":"gemas"}</dd></div><div><dt>Saldo depois</dt><dd>{Math.max(0,(selected.currency==="coins"?wallet.coins:wallet.gems)-selected.price).toLocaleString("pt-PT")} {selected.currency==="coins"?"moedas":"gemas"}</dd></div></dl>}
        <footer><button type="button" onClick={() => setSelected(null)}>CANCELAR</button><button type="button" disabled={busy || (selected.currency === "money" && !legalAccepted) || (selected.currency === "gems" && wallet.gems < selected.price)||(selected.currency==="coins"&&wallet.coins<selected.price)} onClick={confirmPurchase}>{busy ? "PROCESSANDO…" : (selected.currency === "gems" && wallet.gems < selected.price)||(selected.currency==="coins"&&wallet.coins<selected.price) ? "SALDO INSUFICIENTE" : selected.currency === "money" ? "CONTINUAR PARA PAGAMENTO" : "COMPRAR"}</button></footer>
      </section>
    </div>}
    {chestOpening&&<div className="arena-v57-backdrop" role="presentation"><section className="arena-v57-opening" role="dialog" aria-modal="true" aria-labelledby="arena-v57-title" data-stage={chestOpening.stage}>
      <div className="arena-v57-rays" aria-hidden="true"><i/><i/><i/></div><div className="arena-v57-particles" aria-hidden="true">{Array.from({length:12},(_,index)=><i key={index} style={{"--particle":index} as CSSProperties}/>)}</div>
      <small>ABERTURA CELESTIAL · INVENTÁRIO SEGURO</small><h2 id="arena-v57-title">{chestOpening.stage==="revealed"?"Tesouros revelados":chestOpening.product.name}</h2>
      <div className="arena-v57-chest"><img src={chestOpening.product.image} alt={chestOpening.product.name}/><span aria-hidden="true">✦</span></div>
      {chestOpening.stage==="revealed"&&chestOpening.reward&&<div className="arena-v57-rewards"><article><img src="/games/apostolic-arena/ui/currency/moedas-celestiais-v1.webp" alt=""/><span>MOEDAS</span><b>+{chestOpening.reward.coins}</b></article>{chestOpening.reward.gems>0&&<article><img src="/games/apostolic-arena/ui/currency/gema-celestial-v1.png" alt=""/><span>GEMAS</span><b>+{chestOpening.reward.gems}</b></article>}</div>}
      <footer>{chestOpening.stage==="ready"?<><button type="button" onClick={()=>setChestOpening(null)}>DEIXAR NO INVENTÁRIO</button><button type="button" onClick={()=>void openPurchasedChest()}>ABRIR BAÚ</button></>:chestOpening.stage==="opening"?<b>ROMPENDO O SELO…</b>:<><button type="button" onClick={()=>setChestOpening(null)}>GUARDAR RECOMPENSAS</button>{(chestOpening.reward?.remaining??0)>0&&<button type="button" onClick={()=>setChestOpening(current=>current?{product:current.product,stage:"ready"}:current)}>ABRIR OUTRO · {chestOpening.reward?.remaining}</button>}</>}</footer>
    </section></div>}
    {refundDraft&&<div className="arena-v59-refund-backdrop" role="presentation"><form className="arena-v59-refund" onSubmit={event=>{event.preventDefault();void requestRefund()}}><small>PEDIDO ASSOCIADO AO RECIBO</small><h2>Análise de reembolso</h2><p><b>{refundDraft.receipt.name}</b><span>Recibo {refundDraft.receipt.id.slice(0,8).toUpperCase()} · €{(refundDraft.receipt.amount/100).toFixed(2).replace(".",",")}</span></p><label>MOTIVO<select value={refundDraft.reason} onChange={event=>setRefundDraft({...refundDraft,reason:event.target.value})}><option value="delivery_problem">Compra não entregue</option><option value="duplicate_purchase">Compra duplicada</option><option value="technical_problem">Problema técnico</option><option value="withdrawal_request">Livre resolução/análise legal</option><option value="other">Outro motivo</option></select></label><label>DETALHES<textarea required minLength={10} maxLength={800} value={refundDraft.details} onChange={event=>setRefundDraft({...refundDraft,details:event.target.value})} placeholder="Explique o que aconteceu, sem informar dados completos do cartão."/></label><em>O envio não garante aprovação e não altera o saldo. A equipa analisará o pedido e, quando aplicável, o Stripe processará o reembolso.</em><footer><button type="button" onClick={()=>setRefundDraft(null)}>CANCELAR</button><button type="submit" disabled={busy||refundDraft.details.trim().length<10}>{busy?"ENVIANDO…":"ENVIAR PEDIDO"}</button></footer></form></div>}
    <ArenaEconomyAdminV48 />
    <footer className={styles.legalFooter}><span>Apostolic IA · Pré-lançamento comercial em Portugal</span><nav><Link href="/legal/termos">Termos</Link><Link href="/legal/privacidade">Privacidade</Link><Link href="/legal/reembolsos">Reembolsos</Link></nav></footer>
  </section>;
}
