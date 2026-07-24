import Link from "next/link";
import { requestPasswordReset } from "../../auth/actions";

type Params = Promise<{ erro?: string }>;

export default async function ResetRequestPage({
  searchParams
}: Readonly<{ searchParams: Params }>) {
  const { erro } = await searchParams;

  return (
    <>
      <p className="eyebrow">Recuperação</p>
      <h1>Recuperar senha</h1>
      <p className="auth-intro">
        Enviaremos instruções se o e-mail estiver associado a uma conta.
      </p>
      {erro && <p className="auth-message auth-error" role="alert">{erro}</p>}
      <form className="auth-form" action={requestPasswordReset}>
        <label className="field">
          <span>E-mail</span>
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <button className="button button-primary" type="submit">Enviar instruções</button>
      </form>
      <p className="auth-help"><Link href="/entrar">Voltar para entrar</Link></p>
    </>
  );
}
