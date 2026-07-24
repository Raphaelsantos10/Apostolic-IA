import Link from "next/link";
import { signUp } from "../../auth/actions";

type Params = Promise<{ erro?: string }>;

export default async function SignUpPage({
  searchParams
}: Readonly<{ searchParams: Params }>) {
  const { erro } = await searchParams;

  return (
    <>
      <p className="eyebrow">Primeiro acesso</p>
      <h1>Criar conta</h1>
      <p className="auth-intro">Use um e-mail válido e uma senha exclusiva.</p>
      {erro && <p className="auth-message auth-error" role="alert">{erro}</p>}
      <form className="auth-form" action={signUp}>
        <label className="field">
          <span>Nome de apresentação</span>
          <input name="displayName" autoComplete="name" minLength={2} maxLength={80} required />
        </label>
        <label className="field">
          <span>E-mail</span>
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label className="field">
          <span>Senha</span>
          <input name="password" type="password" autoComplete="new-password" minLength={10} required />
          <small>Use pelo menos 10 caracteres.</small>
        </label>
        <label className="checkbox-field">
          <input name="terms" type="checkbox" required />
          <span>Li e aceito os termos de utilização e a política de privacidade.</span>
        </label>
        <button className="button button-primary" type="submit">Criar conta</button>
      </form>
      <p className="auth-help">Já possui conta? <Link href="/entrar">Entrar</Link></p>
    </>
  );
}
