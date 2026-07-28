"use server";

import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

const locales = new Set(["pt-PT", "pt-BR"]);
const timezones = new Set(["Europe/Lisbon", "Atlantic/Azores", "America/Sao_Paulo"]);
const themes = new Set(["system", "light", "dark", "sepia"]);

function text(data: FormData, field: string) {
  return String(data.get(field) ?? "").trim();
}

function returnPath(data: FormData) {
  return text(data, "returnTo") === "/dashboard?section=profile"
    ? "/dashboard?section=profile"
    : "/perfil";
}

function go(path: string, key: "erro" | "mensagem", message: string): never {
  const separator = path.includes("?") ? "&" : "?";
  redirect(`${path}${separator}${key}=${encodeURIComponent(message)}`);
}

export async function updateProfile(data: FormData) {
  const path = returnPath(data);
  const displayName = text(data, "displayName");
  const locale = text(data, "locale");
  const timezone = text(data, "timezone");

  if (displayName.length < 2 || displayName.length > 80) {
    go(path, "erro", "O nome deve ter entre 2 e 80 caracteres.");
  }
  if (!locales.has(locale) || !timezones.has(timezone)) {
    go(path, "erro", "Idioma ou fuso horário inválido.");
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/entrar");

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName, locale, timezone })
    .eq("id", auth.user.id);

  if (error) go(path, "erro", "Não foi possível atualizar o perfil.");
  go(path, "mensagem", "Perfil atualizado.");
}

export async function updatePreferences(data: FormData) {
  const path = returnPath(data);
  const theme = text(data, "theme");
  const textScale = Number(text(data, "textScale"));

  if (!themes.has(theme) || !Number.isInteger(textScale) || textScale < 80 || textScale > 200) {
    go(path, "erro", "Preferências inválidas.");
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

  if (error) go(path, "erro", "Não foi possível atualizar as preferências.");
  go(path, "mensagem", "Preferências atualizadas.");
}
