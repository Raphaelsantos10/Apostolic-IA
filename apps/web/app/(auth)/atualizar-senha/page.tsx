import { updatePassword } from "../../auth/actions";

type Params = Promise<{ erro?: string }>;

export default async function UpdatePasswordPage({
  searchParams
}: Readonly<{ searchParams: Params }>) {
  const { erro } = await searchParams;

  return (
    <>
      <p className="eyebrow">Segurança</p>
      <h1>Definir nova senha</h1>
      {erro && <p className="auth-message auth-error" role="alert">{erro}</p>}
      <form className="auth-form" action={updatePassword}>
        <label className="field">
          <span>Nova senha</span>
          <input name="password" type="password" autoComplete="new-password" minLength={10} required />
        </label>
        <label className="field">
          <span>Confirmar nova senha</span>
          <input name="passwordConfirmation" type="password" autoComplete="new-password" minLength={10} required />
        </label>
        <button className="button button-primary" type="submit">Atualizar senha</button>
      </form>
    </>
  );
}
