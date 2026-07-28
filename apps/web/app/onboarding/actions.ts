"use server";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

const allowedGoals = new Set(["biblia", "doutrina", "oracao", "ministerio"]);
const answers = ["b", "c", "a", "b", "c"];

export async function completeOnboarding(data: FormData) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/entrar");

  const goals = data.getAll("goals").map(String).filter((goal) => allowedGoals.has(goal));
  const experience = String(data.get("experience") ?? "beginner");
  const weeklyMinutes = Number(data.get("weeklyMinutes") ?? 60);
  const score = answers.reduce(
    (total, answer, index) => total + (String(data.get(`q${index + 1}`)) === answer ? 1 : 0),
    0
  );
  if (!goals.length || !["beginner", "intermediate", "advanced"].includes(experience)) {
    redirect("/onboarding?erro=Preencha%20os%20objetivos%20e%20a%20experiência.");
  }
  if (!Number.isInteger(weeklyMinutes) || weeklyMinutes < 15 || weeklyMinutes > 840) {
    redirect("/onboarding?erro=Disponibilidade%20semanal%20inválida.");
  }
  const recommendedPath =
    score <= 1 ? "fundamentos" : score <= 3 ? "panorama-biblico" : "aprofundamento";
  const { error } = await supabase.from("onboarding_profiles").upsert({
    user_id: auth.user.id,
    goals,
    experience,
    weekly_minutes: weeklyMinutes,
    assessment_score: score,
    recommended_path: recommendedPath,
    status: "completed",
    completed_at: new Date().toISOString()
  });
  if (error) redirect("/onboarding?erro=Não%20foi%20possível%20guardar.");
  redirect(`/onboarding/resultado?pontuacao=${score}&plano=${recommendedPath}`);
}

export async function skipOnboarding() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/entrar");
  await supabase.from("onboarding_profiles").upsert({
    user_id: auth.user.id,
    status: "skipped"
  });
  redirect("/dashboard");
}
