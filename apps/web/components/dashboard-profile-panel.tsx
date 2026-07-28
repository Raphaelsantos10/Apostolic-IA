import { redirect } from "next/navigation";
import { PreferenceForm } from "../app/(auth)/perfil/preference-form";
import { updateProfile } from "../app/perfil/actions";
import { createClient } from "../lib/supabase/server";

type Params = {
  erro?: string | undefined;
  mensagem?: string | undefined;
};

export async function DashboardProfilePanel({
  params
}: Readonly<{ params: Params }>) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/entrar");

  const [{ data: profile }, { data: preferences }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, locale, timezone")
      .eq("id", auth.user.id)
      .single(),
    supabase
      .from("preferences")
      .select(
        "theme, text_scale, high_contrast, reduce_motion, communication_email"
      )
      .eq("user_id", auth.user.id)
      .single()
  ]);

  const returnTo = "/dashboard?section=profile";

  return (
    <section
      className="dashboard-profile-panel"
      aria-labelledby="dashboard-profile-title"
    >
      <p className="eyebrow">Personalização</p>
      <h1 id="dashboard-profile-title">Perfil e preferências</h1>
      {params.mensagem && (
        <p className="dashboard-profile-message" role="status">
          {params.mensagem}
        </p>
      )}
      {params.erro && (
        <p className="dashboard-profile-message dashboard-profile-error" role="alert">
          {params.erro}
        </p>
      )}

      <h2>Perfil</h2>
      <form className="dashboard-profile-form" action={updateProfile}>
        <input name="returnTo" type="hidden" value={returnTo} />
        <label className="dashboard-field">
          <span>Nome de apresentação</span>
          <input
            name="displayName"
            defaultValue={profile?.display_name ?? ""}
            minLength={2}
            maxLength={80}
            required
          />
        </label>
        <label className="dashboard-field">
          <span>Idioma</span>
          <select name="locale" defaultValue={profile?.locale ?? "pt-PT"}>
            <option value="pt-PT">Português de Portugal</option>
            <option value="pt-BR">Português do Brasil</option>
          </select>
        </label>
        <label className="dashboard-field">
          <span>Fuso horário</span>
          <select
            name="timezone"
            defaultValue={profile?.timezone ?? "Europe/Lisbon"}
          >
            <option value="Europe/Lisbon">Lisboa</option>
            <option value="Atlantic/Azores">Açores</option>
            <option value="America/Sao_Paulo">Brasília</option>
          </select>
        </label>
        <button className="button button-primary" type="submit">
          Guardar perfil
        </button>
      </form>

      <div className="dashboard-profile-preferences">
        <h2>Acessibilidade e comunicação</h2>
        <PreferenceForm
          embedded
          returnTo={returnTo}
          initial={{
            theme: (preferences?.theme ?? "system") as
              | "system"
              | "light"
              | "dark"
              | "sepia",
            textScale: preferences?.text_scale ?? 100,
            highContrast: preferences?.high_contrast ?? false,
            reduceMotion: preferences?.reduce_motion ?? false,
            communicationEmail: preferences?.communication_email ?? false
          }}
        />
      </div>
    </section>
  );
}
