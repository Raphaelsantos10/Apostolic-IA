import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardProfilePanel } from "../../components/dashboard-profile-panel";
import { resolveDashboardSection } from "../../lib/app-navigation.mjs";
import { createClient } from "../../lib/supabase/server";
import { DashboardFunctional } from "../dashboard-preview/dashboard-functional";

export const metadata: Metadata = {
  title: "Dashboard | Apostolic IA",
  description: "Jornada privada de aprendizagem do Apostolic IA."
};

type Params = Promise<{
  section?: string;
  erro?: string;
  mensagem?: string;
}>;

export default async function DashboardPage({
  searchParams
}: Readonly<{ searchParams: Params }>) {
  const params = await searchParams;
  const section = resolveDashboardSection(params.section);
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/entrar?mensagem=Entre%20para%20acessar%20o%20dashboard.");
  }

  return (
    <DashboardFunctional
      initialSection={section}
      profilePanel={
        section === "profile" ? (
          <DashboardProfilePanel
            params={{ erro: params.erro, mensagem: params.mensagem }}
          />
        ) : null
      }
    />
  );
}
