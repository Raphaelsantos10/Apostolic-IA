"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { createClient } from "../lib/supabase/client";
import styles from "./arena-alliance-competitive-v80.module.css";

type Member = { user_id: string; display_name: string; role: string; selected: boolean };
type Tournament = { id: string; title: string; state: string; players: number; max_players: number; starts_at: string };
type Competitive = { rating: number; queue: { status: string } | null; war: null | { status: string; home_score: number; away_score: number; starts_at: string }; roster: Member[]; tournaments: Tournament[] };

export function ArenaAllianceCompetitiveV80() {
  const [data, setData] = useState<Competitive | null>(null);
  const [message, setMessage] = useState("");
  const load = useCallback(() => {
    void createClient().rpc("arena_get_alliance_competitive").then(({ data, error }) => {
      if (error) setMessage("Entre numa Aliança para abrir a central competitiva.");
      else setData(data as Competitive);
    });
  }, []);
  useEffect(load, [load]);

  const queue = async (join: boolean) => {
    const { error } = await createClient().rpc("arena_toggle_alliance_war_queue", { p_join: join });
    setMessage(error ? "Somente fundador ou ancião pode controlar a fila." : join ? "Aliança inscrita na busca de guerra." : "Busca cancelada.");
    load();
  };
  const roster = async (member: Member) => {
    const { error } = await createClient().rpc("arena_set_alliance_war_roster", { p_user_id: member.user_id, p_selected: !member.selected });
    setMessage(error ? "Não foi possível alterar a formação." : "Formação atualizada.");
    load();
  };
  const createTournament = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const { error } = await createClient().rpc("arena_create_alliance_tournament", {
      p_title: String(values.get("title")),
      p_starts_at: new Date(String(values.get("starts"))).toISOString(),
      p_max_players: Number(values.get("limit")),
    });
    setMessage(error ? "Revise o horário ou sua permissão." : "Torneio publicado.");
    if (!error) form.reset();
    load();
  };
  const joinTournament = async (id: string) => {
    const { error } = await createClient().rpc("arena_join_alliance_tournament", { p_tournament_id: id });
    setMessage(error ? "Inscrição indisponível." : "Inscrição confirmada.");
    load();
  };

  if (!data) return <section className={styles.shell}><p>{message || "A abrir Central de Guerra…"}</p></section>;
  return (
    <section className={styles.shell}>
      <header><div><small>V76–V80 · COMPETITIVO</small><h2>Central de Guerra</h2><p>Formação, matchmaking e torneios internos numa visão única.</p></div><strong>{data.rating}<span>RATING</span></strong></header>
      {message && <aside>{message}</aside>}
      <div className={styles.grid}>
        <article className={styles.war}>
          <h3>Guerra de Alianças</h3>
          {data.war ? <div className={styles.score}><b>{data.war.home_score}</b><span>{data.war.status.toUpperCase()}</span><b>{data.war.away_score}</b></div> : <p>Nenhum confronto ativo.</p>}
          <button onClick={() => void queue(!data.queue)}>{data.queue ? "CANCELAR BUSCA" : "BUSCAR ADVERSÁRIO"}</button>
        </article>
        <article>
          <h3>Formação <span>{data.roster.filter((x) => x.selected).length}/20</span></h3>
          <div className={styles.roster}>{data.roster.map((member) => <button key={member.user_id} data-selected={member.selected} onClick={() => void roster(member)}><b>{member.display_name}</b><small>{member.role}</small></button>)}</div>
        </article>
      </div>
      <article className={styles.tournaments}>
        <div><h3>Torneios internos</h3><form onSubmit={(event) => void createTournament(event)}><input name="title" minLength={3} maxLength={60} required placeholder="Nome do torneio"/><input name="starts" type="datetime-local" required/><input name="limit" type="number" min={4} max={50} defaultValue={16}/><button>CRIAR</button></form></div>
        <div className={styles.cards}>{data.tournaments.map((item) => <section key={item.id}><small>{new Date(item.starts_at).toLocaleString("pt-BR")}</small><b>{item.title}</b><span>{item.players}/{item.max_players} guardiões</span><button disabled={item.state !== "registration"} onClick={() => void joinTournament(item.id)}>PARTICIPAR</button></section>)}</div>
      </article>
    </section>
  );
}
