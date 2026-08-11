"use client";
import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "../lib/supabase/client";
import styles from "./arena-alliance-wall-v67.module.css";
type Comment = {
  id: number;
  body: string;
  author_name: string;
  created_at: string;
};
type Post = {
  id: number;
  kind: string;
  body: string;
  pinned: boolean;
  author_name: string;
  author_id: string;
  created_at: string;
  reactions: Record<string, number>;
  my_reactions: string[];
  comments: Comment[];
};
type Wall = { can_moderate: boolean; posts: Post[] };
const EMOJI: Record<string, string> = {
  amen: "🙌 Amém",
  fire: "🔥",
  heart: "❤",
  pray: "🙏",
};
export function ArenaAllianceWallV67() {
  const [data, setData] = useState<Wall>({ can_moderate: false, posts: [] }),
    [busy, setBusy] = useState(""),
    [message, setMessage] = useState("A carregar o mural…"),
    [more, setMore] = useState(true);
  const load = async (append = false) => {
    const before = append ? data.posts.at(-1)?.id : null;
    setBusy("load");
    const { data: result, error } = await createClient().rpc(
      "arena_get_alliance_wall",
      { p_before_id: before, p_limit: 10 },
    );
    setBusy("");
    if (error) {
      setMessage("Aplique a migração V67 para ativar o mural.");
      return;
    }
    const next = result as Wall;
    setData((current) => ({
      ...next,
      posts: append ? [...current.posts, ...next.posts] : next.posts,
    }));
    setMore(next.posts.length === 10);
    setMessage("");
  };
  useEffect(() => {
    void load();
  }, []);
  const publish = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy("publish");
    const { error } = await createClient().rpc("arena_create_alliance_post", {
      p_body: String(form.get("body")),
      p_kind: String(form.get("kind")),
    });
    setBusy("");
    if (error) {
      setMessage(
        error.message.includes("rate")
          ? "Aguarde alguns segundos antes de publicar novamente."
          : "Não foi possível publicar.",
      );
      return;
    }
    e.currentTarget.reset();
    await load();
  };
  const react = async (id: number, emoji: string) => {
    setBusy(`${id}:${emoji}`);
    await createClient().rpc("arena_toggle_alliance_post_reaction", {
      p_post_id: id,
      p_emoji: emoji,
    });
    setBusy("");
    await load();
  };
  const comment = async (e: FormEvent<HTMLFormElement>, id: number) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(`comment:${id}`);
    const { error } = await createClient().rpc("arena_comment_alliance_post", {
      p_post_id: id,
      p_body: String(form.get("body")),
    });
    setBusy("");
    if (error) setMessage("Aguarde alguns segundos para comentar novamente.");
    else {
      e.currentTarget.reset();
      await load();
    }
  };
  const moderate = async (id: number, action: "pin" | "unpin" | "delete") => {
    if (
      action === "delete" &&
      !window.confirm("Remover esta publicação do mural?")
    )
      return;
    setBusy(`mod:${id}`);
    const { error } = await createClient().rpc("arena_moderate_alliance_post", {
      p_post_id: id,
      p_action: action,
    });
    setBusy("");
    if (error) setMessage("Você não tem permissão para esta ação.");
    else await load();
  };
  return (
    <section className={styles.wall}>
      <header>
        <div>
          <small>MURAL VIVO · V67</small>
          <h3>A voz da Aliança</h3>
          <p>Compartilhe estratégias, testemunhos, avisos e encorajamento.</p>
        </div>
      </header>
      {message && <aside>{message}</aside>}
      <form className={styles.composer} onSubmit={(e) => void publish(e)}>
        <textarea
          required
          name="body"
          minLength={2}
          maxLength={1000}
          placeholder="Compartilhe algo com a sua Aliança…"
        />
        <footer>
          {data.can_moderate && (
            <select name="kind">
              <option value="post">Publicação</option>
              <option value="announcement">Aviso da liderança</option>
            </select>
          )}
          <span>Máximo de 1.000 caracteres</span>
          <button disabled={busy === "publish"}>PUBLICAR</button>
        </footer>
      </form>
      <div className={styles.feed}>
        {data.posts.map((post) => (
          <article key={post.id} data-pinned={post.pinned}>
            <header>
              <span>{post.author_name.slice(0, 2).toUpperCase()}</span>
              <div>
                <b>{post.author_name}</b>
                <small>
                  {post.kind === "announcement" ? "AVISO DA LIDERANÇA · " : ""}
                  {new Date(post.created_at).toLocaleString("pt-PT")}
                </small>
              </div>
              {post.pinned && <em>◆ FIXADO</em>}
              {data.can_moderate && (
                <button
                  onClick={() =>
                    void moderate(post.id, post.pinned ? "unpin" : "pin")
                  }
                >
                  {post.pinned ? "DESAFIXAR" : "FIXAR"}
                </button>
              )}
              <button onClick={() => void moderate(post.id, "delete")}>
                REMOVER
              </button>
            </header>
            <p>{post.body}</p>
            <section className={styles.reactions}>
              {Object.entries(EMOJI).map(([key, label]) => (
                <button
                  key={key}
                  data-active={post.my_reactions.includes(key)}
                  disabled={busy === `${post.id}:${key}`}
                  onClick={() => void react(post.id, key)}
                >
                  {label} {post.reactions[key] || 0}
                </button>
              ))}
            </section>
            <section className={styles.comments}>
              {post.comments.map((item) => (
                <p key={item.id}>
                  <b>{item.author_name}</b>
                  {item.body}
                  <small>
                    {new Date(item.created_at).toLocaleString("pt-PT")}
                  </small>
                </p>
              ))}
              <form onSubmit={(e) => void comment(e, post.id)}>
                <input
                  required
                  name="body"
                  maxLength={500}
                  placeholder="Responder…"
                />
                <button disabled={busy === `comment:${post.id}`}>ENVIAR</button>
              </form>
            </section>
          </article>
        ))}
      </div>
      {more && (
        <button
          className={styles.more}
          disabled={busy === "load"}
          onClick={() => void load(true)}
        >
          CARREGAR PUBLICAÇÕES ANTERIORES
        </button>
      )}
    </section>
  );
}
