"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createClient } from "../lib/supabase/client";
import type { ArenaShopCategory, ArenaShopProduct, ArenaWallet } from "../lib/apostolic-arena-economy-config";
import { ARENA_SHOP_CATALOG } from "../lib/apostolic-arena-shop-catalog";
import { useArenaMotionStage } from "../lib/use-arena-motion-stage";
import styles from "./arena-shop-v38.module.css";
import "./arena-shop-v42.css";
import { ArenaPassV46 } from "./arena-pass-v46";

const CATEGORIES: { id: ArenaShopCategory; label: string }[] = [
  { id: "featured", label: "Destaques" }, { id: "chests", label: "Baús" }, { id: "skins", label: "Skins" },
  { id: "effects", label: "Emotes e efeitos" }, { id: "pass", label: "Passe" }, { id: "gems", label: "Gemas" }
];

type PurchaseResult = { coins?: number; gems?: number; product_id?: string };
type DailyGift = { can_claim: boolean; streak_day: number; next_day: number; reward_currency: "coins" | "gems"; reward_amount: number };
type FreeGemStatus = { period_key: string; earned: number; target: number; hard_cap: number; remaining: number };
type CosmeticLoadout = Partial<Record<"skin" | "emote" | "entrance_effect" | "victory_effect", string>>;
const cosmeticSlot = (id: string) => id.startsWith("skin-") ? "skin" : id.startsWith("emote-") ? "emote" : id === "effect-fogo-celestial" ? "entrance_effect" : id.startsWith("effect-") ? "victory_effect" : null;

export function ArenaShopV38({ fallbackWallet, onWalletChange }: { fallbackWallet: ArenaWallet; onWalletChange: (wallet: ArenaWallet) => void }) {
  const shopRef = useRef<HTMLElement>(null);
  useArenaMotionStage(shopRef);
  const [category, setCategory] = useState<ArenaShopCategory>("featured");
  const [wallet, setWallet] = useState<ArenaWallet>(fallbackWallet);
  const [owned, setOwned] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<ArenaShopProduct | null>(null);
  const [message, setMessage] = useState("A carregar carteira segura…");
  const [busy, setBusy] = useState(false);
  const [gift, setGift] = useState<DailyGift | null>(null);
  const [claimingGift, setClaimingGift] = useState(false);
  const [freeGems, setFreeGems] = useState<FreeGemStatus | null>(null);
  const [loadout, setLoadout] = useState<CosmeticLoadout>({});

  useEffect(() => {
    let active = true;
    const load = async () => {
      const supabase = createClient();
      const [{ data: auth }, walletResponse, inventoryResponse, giftResponse, freeGemResponse, loadoutResponse] = await Promise.all([
        supabase.auth.getUser(), supabase.rpc("arena_get_wallet"), supabase.from("arena_player_inventory").select("product_id"), supabase.rpc("arena_daily_gift_status"), supabase.rpc("arena_free_gem_status"), supabase.rpc("arena_get_cosmetic_loadout")
      ]);
      if (!active) return;
      if (!auth.user) { setMessage("Entre na sua conta para sincronizar compras e recompensas."); return; }
      const row = Array.isArray(walletResponse.data) ? walletResponse.data[0] : walletResponse.data;
      if (row && typeof row === "object" && "coins" in row && "gems" in row) {
        const next = { coins: Number(row.coins), gems: Number(row.gems) };
        setWallet(next); onWalletChange(next); setMessage("Saldo protegido e sincronizado.");
      } else setMessage("Aplique a migração V38 para ativar a carteira segura.");
      if (!inventoryResponse.error) setOwned(new Set((inventoryResponse.data ?? []).map((item) => String(item.product_id))));
      if (!giftResponse.error && giftResponse.data) setGift(giftResponse.data as DailyGift);
      if (!freeGemResponse.error && freeGemResponse.data) setFreeGems(freeGemResponse.data as FreeGemStatus);
      if (!loadoutResponse.error && loadoutResponse.data) setLoadout(loadoutResponse.data as CosmeticLoadout);
    };
    void load();
    return () => { active = false; };
  }, [onWalletChange]);

  const products = useMemo(() => category === "featured" ? ARENA_SHOP_CATALOG.filter((item) => item.featured) : ARENA_SHOP_CATALOG.filter((item) => item.category === category), [category]);

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
      const response = await fetch("/api/arena/checkout", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({productId:selected.id}) });
      const result = await response.json().catch(() => ({})) as {url?:string;error?:string};
      if (!response.ok || !result.url) { setMessage(result.error ?? "Pagamento temporariamente indisponível."); setBusy(false); setSelected(null); return; }
      window.location.assign(result.url); return;
    }
    if (selected.currency !== "gems") return;
    setBusy(true);
    const { data, error } = await createClient().rpc("arena_purchase_product", { p_product_id: selected.id, p_idempotency_key: crypto.randomUUID() });
    if (error) { setMessage(error.message.includes("insufficient") ? "Gemas insuficientes para esta compra." : "Não foi possível concluir a compra segura."); setBusy(false); return; }
    const result = (data ?? {}) as PurchaseResult;
    const next = { coins: Number(result.coins ?? wallet.coins), gems: Number(result.gems ?? wallet.gems) };
    setWallet(next); onWalletChange(next); setOwned((current) => new Set(current).add(selected.id));
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

  return <section ref={shopRef} className={styles.shop} aria-label="Loja da Aliança">
    <header className={styles.header}>
      <div><small>ECONOMIA JUSTA · SEM PAY-TO-WIN</small><h2>LOJA DA ALIANÇA</h2><p>Personalização, coleção e conveniência. Nenhum item aumenta dano, vida ou velocidade.</p></div>
      <div className={styles.wallet} aria-label="Carteira da Arena">
        <span><img src="/games/apostolic-arena/ui/currency/moedas-celestiais-v1.webp" alt="" /><em>MOEDAS<b>{wallet.coins.toLocaleString("pt-PT")}</b></em></span>
        <span><img src="/games/apostolic-arena/ui/currency/gema-celestial-v1.png" alt="" /><em>GEMAS<b>{wallet.gems.toLocaleString("pt-PT")}</b></em></span>
      </div>
    </header>
    <nav className={styles.tabs} aria-label="Categorias da loja">{CATEGORIES.map((item) => <button key={item.id} type="button" data-active={category === item.id} onClick={() => setCategory(item.id)}>{item.label}</button>)}</nav>
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
    <div className={styles.status} role="status">{message}</div>
    <div className={styles.grid}>{products.map((product, index) => {
      const isOwned = owned.has(product.id); const money = product.currency === "money";
      const slot = cosmeticSlot(product.id); const isEquipped = Boolean(slot && loadout[slot] === product.id);
      return <article className={styles.card} data-arena-motion data-rarity={product.rarity} key={product.id} style={{ "--arena-order": index } as CSSProperties}>
        <div className={styles.art}><img src={product.image} alt="" /><i>{product.rarity === "premium" ? "PASSE" : product.rarity.toUpperCase()}</i></div>
        <div className={styles.cardBody}><h3>{product.name}</h3><p>{product.subtitle}</p>
          <strong className={styles.price}>{money ? `€${(product.price / 100).toFixed(2).replace(".", ",")}` : <><img src="/games/apostolic-arena/ui/currency/gema-celestial-v1.png" alt="" />{product.price}</>}</strong>
          <button type="button" data-equipped={isEquipped} disabled={isEquipped || product.available === false || busy} onClick={() => isOwned && slot ? void equipCosmetic(product) : setSelected(product)}>{isEquipped ? "EQUIPADO" : isOwned && slot ? "EQUIPAR" : isOwned ? "ADQUIRIDO" : product.available === false ? "EM BREVE" : "VER DETALHES"}</button>
        </div>
      </article>;
    })}</div>
    {selected && <div className={styles.dialogBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
      <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="arena-purchase-title">
        <img src={selected.image} alt="" /><small>{selected.currency === "money" ? "PAGAMENTO SEGURO · STRIPE" : "COMPRA COSMÉTICA SEGURA"}</small><h3 id="arena-purchase-title">{selected.name}</h3><p>{selected.subtitle}. Não concede vantagem competitiva.</p>
        {selected.currency === "money" ? <dl><div><dt>Produto</dt><dd>{selected.name}</dd></div><div><dt>Preço total</dt><dd>€{(selected.price/100).toFixed(2).replace(".",",")}</dd></div><div><dt>Entrega</dt><dd>Após confirmação</dd></div></dl> : <dl><div><dt>Você possui</dt><dd>{wallet.gems.toLocaleString("pt-PT")} gemas</dd></div><div><dt>Preço</dt><dd>{selected.price.toLocaleString("pt-PT")} gemas</dd></div><div><dt>Saldo depois</dt><dd>{Math.max(0, wallet.gems - selected.price).toLocaleString("pt-PT")} gemas</dd></div></dl>}
        <footer><button type="button" onClick={() => setSelected(null)}>CANCELAR</button><button type="button" disabled={busy || (selected.currency === "gems" && wallet.gems < selected.price)} onClick={confirmPurchase}>{busy ? "PROCESSANDO…" : selected.currency === "gems" && wallet.gems < selected.price ? "SALDO INSUFICIENTE" : selected.currency === "money" ? "CONTINUAR PARA PAGAMENTO" : "COMPRAR"}</button></footer>
      </section>
    </div>}
  </section>;
}
