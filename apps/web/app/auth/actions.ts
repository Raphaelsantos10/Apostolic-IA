"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { resolveAppOrigin } from "../../lib/request-security.mjs";
import { createClient } from "../../lib/supabase/server";

function value(formData: FormData, field: string) {
  return String(formData.get(field) ?? "").trim();
}

function go(path: string, key: "erro" | "mensagem", message: string): never {
  redirect(`${path}?${key}=${encodeURIComponent(message)}`);
}

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function signUp(formData: FormData) {
  const displayName = value(formData, "displayName");
  const email = value(formData, "email").toLowerCase();
  const password = value(formData, "password");
  const termsAccepted = formData.get("terms") === "on";

  if (displayName.length < 2 || displayName.length > 80) {
    go("/criar-conta", "erro", "Informe um nome entre 2 e 80 caracteres.");
  }
  if (!validEmail(email)) {
    go("/criar-conta", "erro", "Informe um e-mail válido.");
  }
  if (password.length < 10) {
    go("/criar-conta", "erro", "A senha deve ter pelo menos 10 caracteres.");
  }
  if (!termsAccepted) {
    go("/criar-conta", "erro", "É necessário aceitar os termos e a privacidade.");
  }

  const requestOrigin =
    (await headers()).get("origin") ?? "http://localhost:3000";
  const origin = resolveAppOrigin({
    configured: process.env.APP_BASE_URL,
    requestUrl: requestOrigin,
    production: process.env.NODE_ENV === "production"
  });
  if (!origin) {
    go("/criar-conta", "erro", "A origem segura da aplicação não está configurada.");
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: `${origin}/auth/callback`
    }
  });

  if (error) {
    go("/criar-conta", "erro", "Não foi possível criar a conta.");
  }

  go(
    "/entrar",
    "mensagem",
    "Conta criada. Verifique o e-mail para confirmar o acesso."
  );
}

export async function signIn(formData: FormData) {
  const email = value(formData, "email").toLowerCase();
  const password = value(formData, "password");

  if (!validEmail(email) || !password) {
    go("/entrar", "erro", "Preencha corretamente o e-mail e a senha.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    go("/entrar", "erro", "E-mail ou senha inválidos.");
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/entrar?mensagem=Sessão%20encerrada.");
}

export async function requestPasswordReset(formData: FormData) {
  const email = value(formData, "email").toLowerCase();
  if (!validEmail(email)) {
    go("/recuperar-senha", "erro", "Informe um e-mail válido.");
  }

  const requestOrigin =
    (await headers()).get("origin") ?? "http://localhost:3000";
  const origin = resolveAppOrigin({
    configured: process.env.APP_BASE_URL,
    requestUrl: requestOrigin,
    production: process.env.NODE_ENV === "production"
  });
  if (!origin) {
    go("/recuperar-senha", "erro", "A origem segura da aplicação não está configurada.");
  }
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/atualizar-senha`
  });

  go(
    "/entrar",
    "mensagem",
    "Se a conta existir, enviaremos instruções de recuperação."
  );
}

export async function updatePassword(formData: FormData) {
  const password = value(formData, "password");
  const confirmation = value(formData, "passwordConfirmation");

  if (password.length < 10) {
    go("/atualizar-senha", "erro", "A senha deve ter pelo menos 10 caracteres.");
  }
  if (password !== confirmation) {
    go("/atualizar-senha", "erro", "As senhas não coincidem.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    go("/atualizar-senha", "erro", "O link expirou ou a atualização falhou.");
  }

  go("/conta", "mensagem", "Senha atualizada com sucesso.");
}

export async function deleteAccount(formData: FormData) {
  const confirmation = value(formData, "confirmation");
  if (confirmation !== "EXCLUIR") {
    go("/conta", "erro", "Digite EXCLUIR para confirmar.");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_own_account", {
    confirmation
  });

  if (error) {
    go("/conta", "erro", "Não foi possível excluir a conta.");
  }

  await supabase.auth.signOut();
  go("/entrar", "mensagem", "Conta e dados pessoais excluídos.");
}
