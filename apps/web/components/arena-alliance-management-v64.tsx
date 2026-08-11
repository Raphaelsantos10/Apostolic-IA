"use client";
import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase/client";
import styles from "./arena-alliance-management-v64.module.css";
import { ArenaAllianceSettingsV66 } from "./arena-alliance-settings-v66";
type Member = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  role: "founder" | "elder" | "guardian" | "member";
  contribution: number;
  joined_at: string;
};
type Request = {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  message: string;
  created_at: string;
};
type Invite = {
  code: string;
  uses: number;
  max_uses: number;
  expires_at: string;
};
type Management = {
  role: string;
  can_manage: boolean;
  is_founder: boolean;
  members: Member[];
  requests: Request[];
  invites: Invite[];
};
const ROLE_LABEL = {
  founder: "Fundador",
  elder: "Ancião",
  guardian: "Guardião",
  member: "Membro",
};
export function ArenaAllianceManagementV64({
  onLeave,
}: {
  onLeave: () => void;
}) {
  const [data, setData] = useState<Management | null>(null),
    [busy, setBusy] = useState(""),
    [message, setMessage] = useState("A carregar administração…");
  const load = async () => {
    const { data: result, error } = await createClient().rpc(
      "arena_get_alliance_management",
    );
    if (error) {
      setMessage("Aplique a migração V64 para administrar membros.");
      return;
    }
    setData(result as Management);
    setMessage("");
  };
  useEffect(() => {
    void load();
  }, []);
  const review = async (id: string, decision: "approved" | "rejected") => {
    setBusy(id);
    const { error } = await createClient().rpc(
      "arena_review_alliance_request",
      { p_request_id: id, p_decision: decision },
    );
    setBusy("");
    setMessage(
      error
        ? "Não foi possível analisar este pedido."
        : decision === "approved"
          ? "Novo membro aprovado."
          : "Pedido recusado.",
    );
    if (!error) await load();
  };
  const role = async (member: Member, next: string) => {
    setBusy(member.user_id);
    const { error } = await createClient().rpc(
      "arena_set_alliance_member_role",
      { p_user_id: member.user_id, p_role: next },
    );
    setBusy("");
    setMessage(
      error
        ? "Você não tem permissão para alterar este cargo."
        : "Cargo atualizado.",
    );
    if (!error) await load();
  };
  const remove = async (member: Member) => {
    const reason = window.prompt(
      `Motivo para remover ${member.display_name}:`,
      "",
    );
    if (reason === null) return;
    if (!window.confirm(`Remover ${member.display_name} da Aliança?`)) return;
    setBusy(member.user_id);
    const { error } = await createClient().rpc("arena_remove_alliance_member", {
      p_user_id: member.user_id,
      p_reason: reason,
    });
    setBusy("");
    setMessage(
      error ? "Não foi possível remover este membro." : "Membro removido.",
    );
    if (!error) await load();
  };
  const transfer = async (member: Member) => {
    if (
      !window.confirm(
        `Transferir definitivamente a liderança para ${member.display_name}? Você passará a ser Ancião.`,
      )
    )
      return;
    setBusy(member.user_id);
    const { error } = await createClient().rpc(
      "arena_transfer_alliance_leadership",
      { p_user_id: member.user_id },
    );
    setBusy("");
    setMessage(
      error
        ? "Não foi possível transferir a liderança."
        : "Liderança transferida com segurança.",
    );
    if (!error) await load();
  };
  const invite = async () => {
    setBusy("invite");
    const { data: result, error } = await createClient().rpc(
      "arena_create_alliance_invite",
      { p_max_uses: 10, p_hours: 72 },
    );
    setBusy("");
    if (error) {
      setMessage("Não foi possível criar o convite.");
      return;
    }
    setMessage(`Convite criado: ${(result as { code: string }).code}`);
    await load();
  };
  const revokeInvite = async (code: string) => {
    if (!window.confirm(`Revogar o convite ${code}?`)) return;
    setBusy(code);
    const { error } = await createClient().rpc("arena_revoke_alliance_invite", {
      p_code: code,
    });
    setBusy("");
    setMessage(
      error ? "Não foi possível revogar o convite." : "Convite revogado.",
    );
    if (!error) await load();
  };
  const leave = async () => {
    if (!window.confirm("Tem certeza de que deseja sair desta Aliança?"))
      return;
    setBusy("leave");
    const { error } = await createClient().rpc("arena_leave_alliance");
    setBusy("");
    if (error) {
      setMessage(
        error.message.includes("founder")
          ? "O fundador precisa transferir a liderança antes de sair."
          : "Não foi possível sair.",
      );
      return;
    }
    onLeave();
  };
  if (!data) return <section className={styles.loading}>{message}</section>;
  return (
    <section className={styles.management}>
      <header>
        <div>
          <small>CENTRAL DE GOVERNANÇA · V64</small>
          <h3>Membros e convites</h3>
          <p>Organize cargos, analise candidatos e proteja a comunidade.</p>
        </div>
        <span data-manager={data.can_manage}>
          {ROLE_LABEL[data.role as keyof typeof ROLE_LABEL] || data.role}
        </span>
      </header>
      {message && <aside>{message}</aside>}
      {data.can_manage && (
        <section className={styles.invites}>
          <div>
            <h4>CONVITES SEGUROS</h4>
            <p>Códigos válidos por 72 horas e limitados a 10 entradas.</p>
          </div>
          <button
            type="button"
            disabled={busy === "invite"}
            onClick={() => void invite()}
          >
            + GERAR CONVITE
          </button>
          {data.invites.map((item) => (
            <article key={item.code}>
              <b>{item.code}</b>
              <span>
                {item.uses}/{item.max_uses} usos
              </span>
              <small>
                Expira {new Date(item.expires_at).toLocaleString("pt-PT")}
              </small>
              <button
                type="button"
                onClick={() => void navigator.clipboard.writeText(item.code)}
              >
                COPIAR
              </button>
              <button
                type="button"
                disabled={busy === item.code}
                onClick={() => void revokeInvite(item.code)}
              >
                REVOGAR
              </button>
            </article>
          ))}
        </section>
      )}
      {data.can_manage && (
        <section className={styles.requests}>
          <h4>
            PEDIDOS PENDENTES <b>{data.requests.length}</b>
          </h4>
          {data.requests.length === 0 ? (
            <p>Nenhum pedido aguardando análise.</p>
          ) : (
            data.requests.map((item) => (
              <article key={item.id}>
                <Avatar item={item} />
                <div>
                  <b>{item.display_name}</b>
                  <p>{item.message || "Deseja fazer parte desta jornada."}</p>
                  <small>
                    {new Date(item.created_at).toLocaleString("pt-PT")}
                  </small>
                </div>
                <button
                  type="button"
                  disabled={busy === item.id}
                  onClick={() => void review(item.id, "rejected")}
                >
                  RECUSAR
                </button>
                <button
                  type="button"
                  disabled={busy === item.id}
                  onClick={() => void review(item.id, "approved")}
                >
                  APROVAR
                </button>
              </article>
            ))
          )}
        </section>
      )}
      <section className={styles.roster}>
        <h4>
          GUARDIÕES <b>{data.members.length}</b>
        </h4>
        {data.members.map((item) => (
          <article key={item.user_id}>
            <Avatar item={item} />
            <div>
              <b>{item.display_name}</b>
              <small>
                Desde {new Date(item.joined_at).toLocaleDateString("pt-PT")}
              </small>
            </div>
            <strong>{item.contribution.toLocaleString("pt-PT")} glória</strong>
            {data.can_manage && item.role !== "founder" ? (
              <select
                value={item.role}
                disabled={busy === item.user_id}
                onChange={(event) => void role(item, event.target.value)}
              >
                <option value="member">Membro</option>
                <option value="guardian">Guardião</option>
                {data.is_founder && <option value="elder">Ancião</option>}
              </select>
            ) : (
              <em>{ROLE_LABEL[item.role]}</em>
            )}
            {data.is_founder && item.role !== "founder" && (
              <button
                type="button"
                disabled={busy === item.user_id}
                onClick={() => void transfer(item)}
              >
                TRANSFERIR LIDERANÇA
              </button>
            )}
            {data.can_manage && item.role !== "founder" && (
              <button
                type="button"
                disabled={busy === item.user_id}
                onClick={() => void remove(item)}
              >
                REMOVER
              </button>
            )}
          </article>
        ))}
      </section>
      <ArenaAllianceSettingsV66 />
      <footer>
        <p>Saídas e alterações ficam registradas para auditoria da Aliança.</p>
        <button
          type="button"
          disabled={busy === "leave"}
          onClick={() => void leave()}
        >
          SAIR DA ALIANÇA
        </button>
      </footer>
    </section>
  );
}
function Avatar({
  item,
}: {
  item: { display_name: string; avatar_url: string | null };
}) {
  return item.avatar_url ? (
    <img src={item.avatar_url} alt="" />
  ) : (
    <span>{item.display_name.slice(0, 2).toUpperCase()}</span>
  );
}
