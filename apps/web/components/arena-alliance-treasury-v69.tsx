"use client";
import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "../lib/supabase/client";
import styles from "./arena-alliance-treasury-v69.module.css";
type Goal = {
  id: string;
  title: string;
  description: string;
  target_gems: number;
  funded_gems: number;
  status: string;
};
type Ledger = {
  id: string;
  amount: number;
  entry_type: string;
  created_at: string;
  actor_name: string;
  goal_title: string | null;
};
type Treasury = {
  balance: number;
  lifetime_gems: number;
  wallet_gems: number;
  can_manage: boolean;
  donated_today: number;
  daily_limit: number;
  goals: Goal[];
  ledger: Ledger[];
};
export function ArenaAllianceTreasuryV69() {
  const [data, setData] = useState<Treasury | null>(null),
    [busy, setBusy] = useState(""),
    [message, setMessage] = useState("A carregar tesouro…"),
    [creating, setCreating] = useState(false);
  const load = async () => {
    const { data: result, error } = await createClient().rpc(
      "arena_get_alliance_treasury",
    );
    if (error) setMessage("Aplique a migração V69 para ativar o Tesouro.");
    else {
      setData(result as Treasury);
      setMessage("");
    }
  };
  useEffect(() => {
    void load();
  }, []);
  const donate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      amount = Number(f.get("amount"));
    setBusy("donate");
    const { error } = await createClient().rpc("arena_donate_alliance_gems", {
      p_amount: amount,
      p_goal_id: String(f.get("goal") || "") || null,
      p_idempotency_key: `alliance-donation:${crypto.randomUUID()}`,
    });
    setBusy("");
    setMessage(
      error
        ? error.message.includes("limit")
          ? "Limite diário de 200 gemas atingido."
          : error.message.includes("insufficient")
            ? "Você não possui gemas suficientes."
            : "Não foi possível doar."
        : "Doação registrada no extrato da Aliança.",
    );
    if (!error) {
      e.currentTarget.reset();
      await load();
    }
  };
  const createGoal = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy("goal");
    const { error } = await createClient().rpc(
      "arena_create_alliance_funding_goal",
      {
        p_title: String(f.get("title")),
        p_description: String(f.get("description") || ""),
        p_target_gems: Number(f.get("target")),
      },
    );
    setBusy("");
    setMessage(
      error
        ? "Limite de três metas ativas ou dados inválidos."
        : "Nova meta criada.",
    );
    if (!error) {
      setCreating(false);
      await load();
    }
  };
  const archive = async (id: string) => {
    setBusy(id);
    const { error } = await createClient().rpc(
      "arena_archive_alliance_funding_goal",
      { p_goal_id: id },
    );
    setBusy("");
    if (!error) await load();
  };
  if (!data) return <section className={styles.loading}>{message}</section>;
  return (
    <section className={styles.treasury}>
      <header>
        <div>
          <small>TESOURO DA ALIANÇA · V69</small>
          <h3>◆ {data.balance.toLocaleString("pt-PT")} gemas</h3>
          <p>Cofre coletivo protegido, sem levantamentos pessoais.</p>
        </div>
        <aside>
          <span>
            SUA CARTEIRA<b>{data.wallet_gems}</b>
          </span>
          <span>
            DOADO HOJE
            <b>
              {data.donated_today}/{data.daily_limit}
            </b>
          </span>
        </aside>
      </header>
      {message && <div className={styles.notice}>{message}</div>}
      <form className={styles.donate} onSubmit={(e) => void donate(e)}>
        <label>
          QUANTIDADE
          <input
            name="amount"
            type="number"
            min={1}
            max={Math.min(200 - data.donated_today, data.wallet_gems)}
            required
          />
        </label>
        <label>
          META
          <select name="goal">
            <option value="">Tesouro geral</option>
            {data.goals
              .filter((g) => g.status === "active")
              .map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
          </select>
        </label>
        <button
          disabled={busy === "donate" || data.donated_today >= data.daily_limit}
        >
          DOAR GEMAS
        </button>
      </form>
      <main>
        <section className={styles.goals}>
          <header>
            <h4>METAS COLETIVAS</h4>
            {data.can_manage && (
              <button onClick={() => setCreating(true)}>+ NOVA META</button>
            )}
          </header>
          {data.goals.map((g) => (
            <article key={g.id}>
              <div>
                <b>{g.title}</b>
                <p>{g.description}</p>
                <i>
                  <em
                    style={{
                      width: `${Math.min(100, (g.funded_gems / g.target_gems) * 100)}%`,
                    }}
                  />
                </i>
                <small>
                  {g.funded_gems}/{g.target_gems} gemas ·{" "}
                  {g.status === "funded" ? "FINANCIADA" : "ATIVA"}
                </small>
              </div>
              {data.can_manage && (
                <button
                  disabled={busy === g.id}
                  onClick={() => void archive(g.id)}
                >
                  ARQUIVAR
                </button>
              )}
            </article>
          ))}
        </section>
        <aside className={styles.ledger}>
          <h4>EXTRATO AUDITÁVEL</h4>
          {data.ledger.map((item) => (
            <p key={item.id}>
              <span>◆ +{item.amount}</span>
              <b>{item.actor_name}</b>
              <small>
                {item.goal_title || "Tesouro geral"}
                <br />
                {new Date(item.created_at).toLocaleString("pt-PT")}
              </small>
            </p>
          ))}
        </aside>
      </main>
      {creating && (
        <div className={styles.modal}>
          <form onSubmit={(e) => void createGoal(e)}>
            <small>NOVA META</small>
            <h3>Defina um objetivo coletivo</h3>
            <input
              name="title"
              required
              minLength={3}
              maxLength={60}
              placeholder="Nome da meta"
            />
            <textarea
              name="description"
              maxLength={240}
              placeholder="Para que serão usadas as gemas?"
            />
            <input
              name="target"
              required
              type="number"
              min={10}
              max={100000}
              placeholder="Gemas necessárias"
            />
            <footer>
              <button type="button" onClick={() => setCreating(false)}>
                VOLTAR
              </button>
              <button disabled={busy === "goal"}>CRIAR META</button>
            </footer>
          </form>
        </div>
      )}
    </section>
  );
}
