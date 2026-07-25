import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import { updateProfile } from "../../perfil/actions";
import { PreferenceForm } from "./preference-form";
import "./profile.css";

type Params = Promise<{ erro?: string; mensagem?: string }>;

export default async function ProfilePage({ searchParams }: Readonly<{ searchParams: Params }>) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/entrar");

  const [{ data: profile }, { data: preferences }] = await Promise.all([
    supabase.from("profiles").select("display_name, locale, timezone").eq("id", auth.user.id).single(),
    supabase.from("preferences").select("theme, text_scale, high_contrast, reduce_motion, communication_email").eq("user_id", auth.user.id).single()
  ]);

  return (
    <>
      <p className="eyebrow">Personalização</p>
      <h1>Perfil e preferências</h1>
      {params.mensagem && <p className="auth-message" role="status">{params.mensagem}</p>}
      {params.erro && <p className="auth-message auth-error" role="alert">{params.erro}</p>}

      <h2>Perfil</h2>
      <form className="auth-form" action={updateProfile}>
        <label className="field"><span>Nome de apresentação</span><input name="displayName" defaultValue={profile?.display_name ?? ""} minLength={2} maxLength={80} required /></label>
        <label className="field"><span>Idioma</span><select name="locale" defaultValue={profile?.locale ?? "pt-PT"}><option value="pt-PT">Português de Portugal</option><option value="pt-BR">Português do Brasil</option></select></label>
        <label className="field"><span>Fuso horário</span><select name="timezone" defaultValue={profile?.timezone ?? "Europe/Lisbon"}><option value="Europe/Lisbon">Lisboa</option><option value="Atlantic/Azores">Açores</option><option value="America/Sao_Paulo">Brasília</option></select></label>
        <button className="button button-primary" type="submit">Guardar perfil</button>
      </form>

      <section className="profile-preferences" aria-labelledby="preferences-title">
        <h2 id="preferences-title">Acessibilidade e comunicação</h2>
        <PreferenceForm initial={{
          theme: (preferences?.theme ?? "system") as "system" | "light" | "dark" | "sepia",
          textScale: preferences?.text_scale ?? 100,
          highContrast: preferences?.high_contrast ?? false,
          reduceMotion: preferences?.reduce_motion ?? false,
          communicationEmail: preferences?.communication_email ?? false
        }} />
      </section>
      <p className="auth-help"><Link href="/conta">Voltar para a conta</Link></p>
    </>
  );
}
