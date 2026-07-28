import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import { deleteAccount, signOut } from "../../auth/actions";

type Params = Promise<{ erro?: string; mensagem?: string }>;

export default async function AccountPage({
  searchParams
}: Readonly<{ searchParams: Params }>) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/entrar");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, locale, timezone")
    .eq("id", user.id)
    .single();

  return (
    <>
      <p className="eyebrow">Área protegida</p>
      <h1>A sua conta</h1>
      {params.mensagem && <p className="auth-message" role="status">{params.mensagem}</p>}
      {params.erro && <p className="auth-message auth-error" role="alert">{params.erro}</p>}
      <div className="account-details">
        <p><strong>Nome:</strong> {profile?.display_name ?? "Não informado"}</p>
        <p><strong>E-mail:</strong> {user.email}</p>
        <p><strong>Idioma:</strong> {profile?.locale ?? "pt-PT"}</p>
        <p><strong>Fuso:</strong> {profile?.timezone ?? "Europe/Lisbon"}</p>
      </div>
      <p className="auth-actions">
        <Link className="button button-primary" href="/dashboard">Abrir dashboard</Link>
        <Link className="button button-secondary" href="/perfil">Editar perfil</Link>
      </p>
      <form className="auth-form" action={signOut}>
        <button className="button button-secondary" type="submit">Sair da conta</button>
      </form>
      <section className="danger-zone" aria-labelledby="delete-title">
        <h2 id="delete-title">Excluir conta</h2>
        <p className="auth-help">
          A exclusão remove imediatamente a conta, o perfil e as preferências.
          Esta ação não pode ser desfeita.
        </p>
        <form className="auth-form" action={deleteAccount}>
          <label className="field">
            <span>Digite EXCLUIR para confirmar</span>
            <input name="confirmation" autoComplete="off" required />
          </label>
          <button className="button button-danger" type="submit">Excluir permanentemente</button>
        </form>
      </section>
    </>
  );
}
