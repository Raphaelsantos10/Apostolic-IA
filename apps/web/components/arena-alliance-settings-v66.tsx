"use client";
import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "../lib/supabase/client";
import styles from "./arena-alliance-settings-v66.module.css";
type Settings = {
  name: string;
  tag: string;
  description: string;
  visibility: "open" | "approval" | "invite";
  min_trophies: number;
  can_edit: boolean;
};
export function ArenaAllianceSettingsV66() {
  const [data, setData] = useState<Settings | null>(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    void (async () => {
      const { data: result, error } = await createClient().rpc(
        "arena_get_alliance_settings",
      );
      if (!error) setData(result as Settings);
    })();
  }, []);
  const save = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!data) return;
    const form = new FormData(e.currentTarget);
    setBusy(true);
    const { error } = await createClient().rpc(
      "arena_update_alliance_settings",
      {
        p_description: String(form.get("description") || ""),
        p_visibility: String(form.get("visibility")),
        p_min_trophies: Number(form.get("min_trophies")),
      },
    );
    setBusy(false);
    setMessage(
      error
        ? "Não foi possível guardar as regras."
        : "Regras da Aliança atualizadas e auditadas.",
    );
  };
  if (!data) return null;
  return (
    <section className={styles.settings}>
      <header>
        <div>
          <small>REGRAS DE ENTRADA · V66</small>
          <h4>
            {data.name} · {data.tag}
          </h4>
        </div>
        <b>{data.can_edit ? "GESTOR" : "SOMENTE LEITURA"}</b>
      </header>
      {message && <aside>{message}</aside>}
      <form onSubmit={(e) => void save(e)}>
        <label>
          PROPÓSITO
          <textarea
            name="description"
            maxLength={240}
            defaultValue={data.description}
            disabled={!data.can_edit}
          />
        </label>
        <label>
          TIPO DE ENTRADA
          <select
            name="visibility"
            defaultValue={data.visibility}
            disabled={!data.can_edit}
          >
            <option value="open">Aberta</option>
            <option value="approval">Aprovação da liderança</option>
            <option value="invite">Somente convite</option>
          </select>
        </label>
        <label>
          TROFÉUS MÍNIMOS
          <input
            name="min_trophies"
            type="number"
            min={0}
            max={100000}
            defaultValue={data.min_trophies}
            disabled={!data.can_edit}
          />
        </label>
        {data.can_edit && <button disabled={busy}>GUARDAR REGRAS</button>}
      </form>
    </section>
  );
}
