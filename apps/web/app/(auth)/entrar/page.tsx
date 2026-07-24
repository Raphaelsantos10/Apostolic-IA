import Link from "next/link";
import { signIn } from "../../auth/actions";

type Params = Promise<{ erro?: string; mensagem?: string }>;

export default async function SignInPage({
  searchParams
}: Readonly<{ searchParams: Params }>) {
  const params = await searchParams;

  return (
    <>
      <p className="eyebrow">Conta</p>
      <h1>Entrar</h1>
      <p className="auth-intro">Acesse o seu perfil e preferências com segurança.</p>
      {params.mensagem && <p className="auth-message" role="status">{params.mensagem}</p>}
      {params.erro && <p className="auth-message auth-error" role="alert">{params.erro}</p>}
      <form className="auth-form" action={signIn}>
        <label className="field">
          <span>E-mail</span>
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label className="field">
          <span>Senha</span>
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
        <button className="button button-primary" type="submit">Entrar</button>
      </form>
      <p className="auth-help"><Link href="/recuperar-senha">Esqueci a senha</Link></p>
      <p className="auth-help">Ainda não possui conta? <Link href="/criar-conta">Criar conta</Link></p>
    </>
  );
}
