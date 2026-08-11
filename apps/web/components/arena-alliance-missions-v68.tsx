"use client";
import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase/client";
import styles from "./arena-alliance-missions-v68.module.css";
type Mission = {
  id: string;
  kind: "faith" | "study" | "service";
  title: string;
  description: string;
  target: number;
  progress: number;
  reward_currency: string;
  reward_amount: number;
  ends_at: string;
  checked_today: boolean;
  claimed: boolean;
};
type Board = {
  missions: Mission[];
  ranking: { user_id: string; display_name: string; weekly: number }[];
};
const ICON = { faith: "✦", study: "📖", service: "🤝" };
export function ArenaAllianceMissionsV68() {
  const [data, setData] = useState<Board | null>(null),
    [busy, setBusy] = useState(""),
    [message, setMessage] = useState("A carregar missões…");
  const load = async () => {
    const { data: result, error } = await createClient().rpc(
      "arena_get_alliance_mission_board",
    );
    if (error) setMessage("Aplique a migração V68 para ativar as missões.");
    else {
      setData(result as Board);
      setMessage("");
    }
  };
  useEffect(() => {
    void load();
  }, []);
  const checkin = async (kind: string) => {
    setBusy(kind);
    const { error } = await createClient().rpc(
      "arena_checkin_alliance_mission",
      { p_kind: kind },
    );
    setBusy("");
    setMessage(
      error
        ? "Esta prática já foi registrada hoje."
        : "Contribuição adicionada à missão coletiva.",
    );
    if (!error) await load();
  };
  const claim = async (id: string) => {
    setBusy(id);
    const { error } = await createClient().rpc("arena_claim_alliance_mission", {
      p_mission_id: id,
    });
    setBusy("");
    setMessage(
      error
        ? "Esta recompensa não está disponível."
        : "Recompensa recebida na sua carteira.",
    );
    if (!error) await load();
  };
  if (!data) return <section className={styles.loading}>{message}</section>;
  return (
    <section className={styles.board}>
      <header>
        <small>MISSÕES COOPERATIVAS · V68</small>
        <h3>Uma Aliança, uma jornada</h3>
        <p>Cada membro pode registrar uma prática de cada tipo por dia.</p>
      </header>
      {message && <aside>{message}</aside>}
      <main>
        <section className={styles.missions}>
          {data.missions.map((m) => (
            <article key={m.id} data-complete={m.progress >= m.target}>
              <span>{ICON[m.kind]}</span>
              <div>
                <small>
                  {m.kind.toUpperCase()} · termina{" "}
                  {new Date(m.ends_at).toLocaleDateString("pt-PT")}
                </small>
                <h4>{m.title}</h4>
                <p>{m.description}</p>
                <i>
                  <em
                    style={{
                      width: `${Math.min(100, (m.progress / m.target) * 100)}%`,
                    }}
                  />
                </i>
                <b>
                  {m.progress}/{m.target}
                </b>
              </div>
              <strong>
                {m.reward_amount}{" "}
                {m.reward_currency === "gems" ? "GEMAS" : "MOEDAS"}
              </strong>
              {m.progress >= m.target ? (
                <button
                  disabled={m.claimed || busy === m.id}
                  onClick={() => void claim(m.id)}
                >
                  {m.claimed ? "RECEBIDO" : "RECEBER"}
                </button>
              ) : (
                <button
                  disabled={m.checked_today || busy === m.kind}
                  onClick={() => void checkin(m.kind)}
                >
                  {m.checked_today ? "FEITO HOJE" : "CONTRIBUIR"}
                </button>
              )}
            </article>
          ))}
        </section>
        <aside className={styles.ranking}>
          <h4>DESTAQUES DA SEMANA</h4>
          {data.ranking.map((item, index) => (
            <p key={item.user_id}>
              <span>{index + 1}</span>
              <b>{item.display_name}</b>
              <strong>{item.weekly} práticas</strong>
            </p>
          ))}
          {!data.ranking.length && (
            <small>A primeira contribuição inaugurará o ranking.</small>
          )}
        </aside>
      </main>
    </section>
  );
}
