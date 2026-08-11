"use client";
import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase/client";
import styles from "./arena-alliance-shop-v70.module.css";
type Item = { type: string; id: string };
type Product = {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  rarity: string;
  contents: Item[];
  owned: boolean;
};
type Shop = { balance: number; can_buy: boolean; products: Product[] };
export function ArenaAllianceShopV70() {
  const [data, setData] = useState<Shop | null>(null),
    [busy, setBusy] = useState(""),
    [message, setMessage] = useState("A carregar loja…");
  const load = async () => {
    const { data: result, error } = await createClient().rpc(
      "arena_get_alliance_shop",
    );
    if (error)
      setMessage("Aplique a migração V70 para ativar a Loja da Aliança.");
    else {
      setData(result as Shop);
      setMessage("");
    }
  };
  useEffect(() => {
    void load();
  }, []);
  const buy = async (item: Product) => {
    if (
      !window.confirm(
        `Usar ${item.price} gemas do Tesouro para desbloquear ${item.name}?`,
      )
    )
      return;
    setBusy(item.id);
    const { error } = await createClient().rpc(
      "arena_purchase_alliance_shop_product",
      {
        p_product_id: item.id,
        p_idempotency_key: `alliance-shop:${crypto.randomUUID()}`,
      },
    );
    setBusy("");
    setMessage(
      error
        ? error.message.includes("insufficient")
          ? "O Tesouro ainda não possui gemas suficientes."
          : "Não foi possível concluir a compra."
        : "Pacote desbloqueado para toda a Aliança.",
    );
    if (!error) await load();
  };
  if (!data) return <section className={styles.loading}>{message}</section>;
  return (
    <section className={styles.shop}>
      <header>
        <div>
          <small>LOJA DA ALIANÇA · V70</small>
          <h3>Relíquias para a sede</h3>
          <p>Pacotes coletivos comprados com o saldo protegido do Tesouro.</p>
        </div>
        <aside>
          TESOURO<b>◆ {data.balance.toLocaleString("pt-PT")}</b>
        </aside>
      </header>
      {message && <div className={styles.notice}>{message}</div>}
      <div className={styles.grid}>
        {data.products.map((item) => (
          <article
            key={item.id}
            data-rarity={item.rarity}
            data-owned={item.owned}
          >
            <div className={styles.art}>
              <img src={item.image} alt="" />
              <span>{item.rarity.toUpperCase()}</span>
              {item.owned && <b>✓ DESBLOQUEADO</b>}
            </div>
            <section>
              <small>PACOTE COLETIVO</small>
              <h4>{item.name}</h4>
              <p>{item.description}</p>
              <ul>
                {item.contents.map((content) => (
                  <li key={`${content.type}:${content.id}`}>
                    {content.type === "background" ? "CENÁRIO" : "BRASÃO"} ·{" "}
                    {content.id.replaceAll("-", " ")}
                  </li>
                ))}
              </ul>
            </section>
            <footer>
              <strong>◆ {item.price}</strong>
              <button
                disabled={
                  item.owned ||
                  !data.can_buy ||
                  busy === item.id ||
                  data.balance < item.price
                }
                onClick={() => void buy(item)}
              >
                {item.owned
                  ? "ADQUIRIDO"
                  : data.can_buy
                    ? "COMPRAR"
                    : "LIDERANÇA"}
              </button>
            </footer>
          </article>
        ))}
      </div>
      <footer>
        Compras são permanentes, coletivas e registradas no extrato do Tesouro.
      </footer>
    </section>
  );
}
