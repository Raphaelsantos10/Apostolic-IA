import type { Metadata } from "next";
import { resolveDashboardSection } from "../../lib/app-navigation.mjs";
import { DashboardFunctional } from "./dashboard-functional";

export const metadata: Metadata = {
  title: "Dashboard | Apostolic IA",
  description: "Pré-visualização acessível do dashboard do Apostolic IA."
};

type Params = Promise<{ section?: string }>;

export default async function DashboardPreviewPage({
  searchParams
}: Readonly<{ searchParams: Params }>) {
  const params = await searchParams;
  return (
    <DashboardFunctional
      preview
      initialSection={resolveDashboardSection(params.section)}
    />
  );
}
