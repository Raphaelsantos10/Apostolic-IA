"use server";

import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

const locales = new Set(["pt-PT", "pt-BR"]);
const timezones = new Set(["Europe/Lisbon", "Atlantic/Azores", "America/Sao_Paulo"]);
const themes = new Set(["system", "light", "dark", "sepia"]);

function text(data: FormData, field: string) {
  return String(data.get(field) ?? "").trim();
}

function fail(message: string): never {
  redirect(`/perfil?erro=${encodeURIComponent(message)}`);
}

export async function updateProfile(data: FormData) {
  const displayName = text(data, "displayName");
  const locale = text(data, "locale");
  const timezone = text(data, "timezone");

  if (displayName.length < 2 || displayName.length > 80) {
    fail("O nome deve ter entre 2 e 80 caracteres.");
  }
  if (!locales.has(locale) || !timezones.has(timezone)) {
    fail("Idioma ou fuso horário inválido.");
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/entrar");

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName, locale, timezone })
    .eq("id", auth.user.id);

  if (error) fail("Não foi possível atualizar o perfil.");
  redirect("/perfil?mensagem=Perfil%20atualizado.");
}

export async function updatePreferences(data: FormData) {
  const theme = text(data, "theme");
  const textScale = Number(text(data, "textScale"));

  if (!themes.has(theme) || !Number.isInteger(textScale) || textScale < 80 || textScale > 200) {
    fail("Preferências inválidas.");
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/entrar");

  const { error } = await supabase
    .from("preferences")
    .update({
      theme,
      text_scale: textScale,
      high_contrast: data.get("highContrast") === "on",
      reduce_motion: data.get("reduceMotion") === "on",
      communication_email: data.get("communicationEmail") === "on",
      consent_version: "privacy-v1",
      consented_at: new Date().toISOString()
    })
    .eq("user_id", auth.user.id);

  if (error) fail("Não foi possível atualizar as preferências.");
  redirect("/perfil?mensagem=Preferências%20atualizadas.");
}
