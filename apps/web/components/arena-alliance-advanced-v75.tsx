"use client";
import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "../lib/supabase/client";
import styles from "./arena-alliance-advanced-v75.module.css";
type Tab = "pro" | "pass" | "cards" | "chat" | "moderation";
export function ArenaAllianceAdvancedV75() {
  const [tab, setTab] = useState<Tab>("pro");
  return (
    <section className={styles.shell}>
      <nav>
        {(["pro", "pass", "cards", "chat", "moderation"] as Tab[]).map((x) => (
          <button key={x} data-active={tab === x} onClick={() => setTab(x)}>
            {x === "pro"
              ? "PRO"
              : x === "pass"
                ? "PASSE"
                : x === "cards"
                  ? "DOAÇÕES"
                  : x === "chat"
                    ? "CHAT"
                    : "MODERAÇÃO"}
          </button>
        ))}
      </nav>
      {tab === "pro" ? (
        <Pro />
      ) : tab === "pass" ? (
        <Pass />
      ) : tab === "cards" ? (
        <Cards />
      ) : tab === "chat" ? (
        <Chat />
      ) : (
        <Moderation />
      )}
    </section>
  );
}
function Pro() {
  const [data, setData] = useState<any>(null),
    [message, setMessage] = useState("");
  useEffect(() => {
    void createClient()
      .rpc("arena_get_alliance_pro")
      .then(({ data }) => setData(data));
  }, []);
  const subscribe = async () => {
    const response = await fetch("/api/arena/alliance-pro-checkout", {
        method: "POST",
      }),
      result = await response.json();
    if (result.url) window.location.assign(result.url);
    else setMessage(result.error || "Assinatura indisponível.");
  };
  if (!data) return <p>A carregar Aliança PRO…</p>;
  return (
    <section className={styles.pro}>
      <header>
        <small>V71 · ALIANÇA PRO</small>
        <h3>{data.is_pro ? "PRO ATIVO" : "Eleve a sua Aliança"}</h3>
        <p>Status: {data.status}</p>
      </header>
      <div>
        {data.benefits.map((x: string) => (
          <article key={x}>
            ✦ <b>{x}</b>
          </article>
        ))}
      </div>
      {message && <aside>{message}</aside>}
      {!data.is_pro && data.can_subscribe && (
        <button onClick={() => void subscribe()}>ASSINAR COM STRIPE</button>
      )}
    </section>
  );
}
function Pass() {
  const [data, setData] = useState<any>(null),
    [message, setMessage] = useState("");
  const load = () =>
    void createClient()
      .rpc("arena_get_alliance_pass")
      .then(({ data }) => setData(data));
  useEffect(load, []);
  const claim = async (r: any) => {
    const { error } = await createClient().rpc("arena_claim_alliance_pass", {
      p_level: r.level,
      p_premium: r.premium,
    });
    setMessage(
      error ? "Recompensa bloqueada ou já recebida." : "Recompensa recebida.",
    );
    load();
  };
  if (!data) return <p>A carregar Passe…</p>;
  return (
    <section className={styles.pass}>
      <header>
        <small>V72 · PASSE DA ALIANÇA</small>
        <h3>{data.season}</h3>
        <b>{data.xp} XP coletivo</b>
      </header>
      {message && <aside>{message}</aside>}
      <div>
        {data.rewards.map((r: any) => (
          <article key={`${r.level}:${r.premium}`} data-premium={r.premium}>
            <span>NÍVEL {r.level}</span>
            <b>
              {r.amount} {r.currency}
            </b>
            <small>
              {r.xp} XP {r.premium ? "· PRO" : "· GRÁTIS"}
            </small>
            <button
              disabled={
                r.claimed || data.xp < r.xp || (r.premium && !data.is_pro)
              }
              onClick={() => void claim(r)}
            >
              {r.claimed ? "RECEBIDO" : "RECEBER"}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
function Cards() {
  const [data, setData] = useState<any>(null),
    [message, setMessage] = useState("");
  const load = () =>
    void createClient()
      .rpc("arena_get_alliance_card_requests")
      .then(({ data }) => setData(data));
  useEffect(load, []);
  const request = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      { error } = await createClient().rpc("arena_request_alliance_card", {
        p_card_id: String(f.get("card")),
        p_amount: Number(f.get("amount")),
      });
    setMessage(error ? "Você já possui um pedido ativo." : "Pedido publicado.");
    load();
  };
  const donate = async (id: string) => {
    const { error } = await createClient().rpc("arena_donate_alliance_card", {
      p_request_id: id,
      p_amount: 1,
    });
    setMessage(
      error
        ? "Fragmentos insuficientes ou pedido indisponível."
        : "Fragmento doado.",
    );
    load();
  };
  if (!data) return <p>A carregar doações…</p>;
  return (
    <section className={styles.cards}>
      <header>
        <small>V73 · DOAÇÕES DE CARTAS</small>
        <h3>Ajuda entre guardiões</h3>
      </header>
      {message && <aside>{message}</aside>}
      <form onSubmit={(e) => void request(e)}>
        <select name="card">
          <option value="davi-jovem">Davi Jovem</option>
          <option value="soldado-de-israel">Soldado de Israel</option>
          <option value="arqueira-da-fe">Arqueira da Fé</option>
        </select>
        <input name="amount" type="number" min={1} max={20} defaultValue={5} />
        <button>PEDIR</button>
      </form>
      {data.requests.map((r: any) => (
        <article key={r.id}>
          <div>
            <b>{r.requester_name}</b>
            <p>{r.card_id.replaceAll("-", " ")}</p>
            <small>
              {r.received}/{r.requested} fragmentos
            </small>
          </div>
          <button onClick={() => void donate(r.id)}>DOAR 1</button>
        </article>
      ))}
    </section>
  );
}
function Chat() {
  const [items, setItems] = useState<any[]>([]),
    [message, setMessage] = useState("");
  const load = () =>
    void createClient()
      .rpc("arena_get_alliance_chat", { p_before_id: null, p_limit: 60 })
      .then(({ data }) => setItems(data || []));
  useEffect(() => {
    load();
    const timer = setInterval(load, 8000);
    return () => clearInterval(timer);
  }, []);
  const send = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget,
      f = new FormData(form),
      { error } = await createClient().rpc("arena_send_alliance_chat", {
        p_body: String(f.get("body")),
        p_reply_to: null,
      });
    setMessage(
      error
        ? error.message.includes("muted")
          ? "Você está temporariamente silenciado."
          : "Aguarde antes de enviar outra mensagem."
        : "",
    );
    if (!error) {
      form.reset();
      load();
    }
  };
  const report = async (id: number) => {
    const reason = window.prompt("Motivo da denúncia:");
    if (!reason) return;
    const { error } = await createClient().rpc(
      "arena_report_alliance_message",
      { p_message_id: id, p_reason: reason },
    );
    setMessage(
      error ? "Não foi possível denunciar." : "Denúncia enviada à liderança.",
    );
  };
  return (
    <section className={styles.chat}>
      <header>
        <small>V74 · CHAT EM TEMPO REAL</small>
        <h3>Conversa da Aliança</h3>
      </header>
      {message && <aside>{message}</aside>}
      <div>
        {items.map((m) => (
          <p key={m.id}>
            <b>{m.author_name}</b>
            <span>{m.body}</span>
            <small>{new Date(m.created_at).toLocaleTimeString("pt-PT")}</small>
            <button onClick={() => void report(m.id)}>DENUNCIAR</button>
          </p>
        ))}
      </div>
      <form onSubmit={(e) => void send(e)}>
        <input
          name="body"
          required
          maxLength={500}
          placeholder="Mensagem para a Aliança…"
        />
        <button>ENVIAR</button>
      </form>
    </section>
  );
}
function Moderation() {
  const [data, setData] = useState<any>(null),
    [message, setMessage] = useState("");
  const load = () =>
    void createClient()
      .rpc("arena_get_alliance_moderation")
      .then(({ data, error }) => {
        setData(data);
        if (error) setMessage("Área exclusiva da liderança.");
      });
  useEffect(load, []);
  const resolve = async (id: string, action: string) => {
    const { error } = await createClient().rpc(
      "arena_resolve_alliance_report",
      { p_report_id: id, p_action: action },
    );
    setMessage(
      error ? "Ação não autorizada." : "Denúncia analisada e auditada.",
    );
    load();
  };
  if (!data)
    return (
      <section className={styles.moderation}>
        <p>{message || "A carregar moderação…"}</p>
      </section>
    );
  return (
    <section className={styles.moderation}>
      <header>
        <small>V75 · MODERAÇÃO AVANÇADA</small>
        <h3>Central de segurança</h3>
      </header>
      {message && <aside>{message}</aside>}
      {data.reports.map((r: any) => (
        <article key={r.id}>
          <div>
            <b>{r.target_name}</b>
            <p>{r.reason}</p>
            <small>Mensagem #{r.message_id}</small>
          </div>
          <button onClick={() => void resolve(r.id, "dismiss")}>IGNORAR</button>
          <button onClick={() => void resolve(r.id, "delete")}>REMOVER</button>
          <button onClick={() => void resolve(r.id, "mute24h")}>
            SILENCIAR 24H
          </button>
        </article>
      ))}
    </section>
  );
}
