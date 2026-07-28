import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { DashboardFunctional } from "../dashboard-preview/dashboard-functional";

export const metadata: Metadata = {
  title: "Dashboard | Apostolic IA",
  description: "Jornada privada de aprendizagem do Apostolic IA."
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/entrar?mensagem=Entre%20para%20acessar%20o%20dashboard.");
  }

  return <DashboardFunctional />;
}
