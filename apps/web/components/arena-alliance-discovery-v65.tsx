"use client";
import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "../lib/supabase/client";
import { allianceEmblemById } from "../lib/arena-alliance-emblems-v63";
import styles from "./arena-alliance-discovery-v65.module.css";
type A = {
  id: string;
  name: string;
  tag: string;
  description: string;
  visibility: "open" | "approval";
  level: number;
  weekly_glory: number;
  member_count: number;
  max_members: number;
  emblem_id?: string;
  effective_emblem_id?: string;
  pending_request_id?: string | null;
};
export function ArenaAllianceDiscoveryV65({
  onJoined,
}: {
  onJoined: () => void;
}) {
  const [items, setItems] = useState<A[]>([]),
    [query, setQuery] = useState(""),
    [code, setCode] = useState(""),
    [apply, setApply] = useState<A | null>(null),
    [founding, setFounding] = useState(false),
    [busy, setBusy] = useState(""),
    [message, setMessage] = useState("");
  const search = async (q = query) => {
    setBusy("search");
    const { data, error } = await createClient().rpc("arena_browse_alliances", {
      p_query: q,
      p_limit: 24,
    });
    setBusy("");
    if (error) setMessage("Aplique a migração V65 para ativar esta busca.");
    else setItems(Array.isArray(data) ? (data as A[]) : []);
  };
  useEffect(() => {
    void search("");
  }, []);
  const join = async (a: A) => {
    setBusy(a.id);
    const { error } = await createClient().rpc("arena_join_alliance", {
      p_alliance_id: a.id,
    });
    setBusy("");
    if (error)
      setMessage(
        error.message.includes("full")
          ? "Esta Aliança está completa."
          : "Não foi possível entrar.",
      );
    else onJoined();
  };
  const request = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!apply) return;
    const text = String(new FormData(e.currentTarget).get("message") || "");
    setBusy(apply.id);
    const { error } = await createClient().rpc("arena_apply_to_alliance", {
      p_alliance_id: apply.id,
      p_message: text,
    });
    setBusy("");
    if (error)
      setMessage(
        "Você já possui um pedido pendente ou a Aliança não está disponível.",
      );
    else {
      setApply(null);
      setMessage("Pedido enviado à liderança.");
      await search();
    }
  };
  const cancel = async (a: A) => {
    if (!a.pending_request_id) return;
    setBusy(a.id);
    const { error } = await createClient().rpc(
      "arena_cancel_alliance_request",
      { p_request_id: a.pending_request_id },
    );
    setBusy("");
    setMessage(error ? "Não foi possível cancelar." : "Pedido cancelado.");
    if (!error) await search();
  };
  const invite = async (e: FormEvent) => {
    e.preventDefault();
    setBusy("invite");
    const { error } = await createClient().rpc("arena_accept_alliance_invite", {
      p_code: code,
    });
    setBusy("");
    if (error) setMessage("Convite inválido, expirado ou esgotado.");
    else onJoined();
  };
  const found = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy("found");
    const { error } = await createClient().rpc("arena_create_alliance", {
      p_name: String(form.get("name")),
      p_tag: String(form.get("tag")).toUpperCase(),
      p_description: String(form.get("description") || ""),
      p_visibility: String(form.get("visibility")),
    });
    setBusy("");
    if (error) setMessage("Não foi possível fundar. Confira nome e sigla.");
    else onJoined();
  };
  return (
    <section className={styles.shell}>
      <header>
        <div>
          <small>APOSTOLIC ARENA · ALIANÇAS V65</small>
          <h2>Encontre a sua Aliança</h2>
          <p>
            Entre numa comunidade aberta, candidate-se ou use um convite
            privado.
          </p>
        </div>
        <button type="button" onClick={() => setFounding(true)}>
          + FUNDAR ALIANÇA
        </button>
      </header>
      {message && <aside>{message}</aside>}
      <section className={styles.tools}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void search();
          }}
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nome ou sigla"
            maxLength={40}
          />
          <button disabled={busy === "search"}>BUSCAR</button>
        </form>
        <form onSubmit={(e) => void invite(e)}>
          <input
            required
            value={code}
            onChange={(e) =>
              setCode(
                e.target.value
                  .toUpperCase()
                  .replace(/[^A-Z0-9]/g, "")
                  .slice(0, 8),
              )
            }
            placeholder="Código de convite"
          />
          <button disabled={busy === "invite"}>USAR CONVITE</button>
        </form>
      </section>
      <section className={styles.list}>
        <h3>ALIANÇAS ENCONTRADAS · {items.length}</h3>
        {items.map((a) => (
          <article key={a.id}>
            <img
              src={
                allianceEmblemById(a.effective_emblem_id || a.emblem_id).image
              }
              alt=""
            />
            <div>
              <small>
                {a.tag} · {a.visibility === "open" ? "ABERTA" : "APROVAÇÃO"}
              </small>
              <b>{a.name}</b>
              <p>{a.description || "Uma nova jornada começa aqui."}</p>
            </div>
            <em>
              NÍVEL {a.level}
              <br />
              {a.member_count}/{a.max_members} membros
              <br />
              {a.weekly_glory} glória
            </em>
            {a.pending_request_id ? (
              <button disabled={busy === a.id} onClick={() => void cancel(a)}>
                CANCELAR PEDIDO
              </button>
            ) : a.visibility === "open" ? (
              <button
                disabled={busy === a.id || a.member_count >= a.max_members}
                onClick={() => void join(a)}
              >
                ENTRAR
              </button>
            ) : (
              <button
                disabled={busy === a.id || a.member_count >= a.max_members}
                onClick={() => setApply(a)}
              >
                CANDIDATAR-SE
              </button>
            )}
          </article>
        ))}
      </section>
      {apply && (
        <div className={styles.modal}>
          <form onSubmit={(e) => void request(e)}>
            <small>PEDIDO PARA {apply.tag}</small>
            <h3>Apresente-se à liderança</h3>
            <textarea
              name="message"
              maxLength={240}
              placeholder="Por que deseja entrar nesta Aliança?"
            />
            <footer>
              <button type="button" onClick={() => setApply(null)}>
                VOLTAR
              </button>
              <button disabled={busy === apply.id}>ENVIAR PEDIDO</button>
            </footer>
          </form>
        </div>
      )}
      {founding && (
        <div className={styles.modal}>
          <form onSubmit={(e) => void found(e)}>
            <small>NOVA ALIANÇA</small>
            <h3>Erga a sua sede</h3>
            <input
              name="name"
              required
              minLength={3}
              maxLength={40}
              placeholder="Nome"
            />
            <input
              name="tag"
              required
              minLength={2}
              maxLength={5}
              pattern="[A-Za-z0-9]+"
              placeholder="Sigla"
            />
            <textarea
              name="description"
              maxLength={240}
              placeholder="Propósito da Aliança"
            />
            <select name="visibility">
              <option value="open">Entrada aberta</option>
              <option value="approval">Por aprovação</option>
              <option value="invite">Somente convite</option>
            </select>
            <footer>
              <button type="button" onClick={() => setFounding(false)}>
                VOLTAR
              </button>
              <button disabled={busy === "found"}>FUNDAR</button>
            </footer>
          </form>
        </div>
      )}
    </section>
  );
}
