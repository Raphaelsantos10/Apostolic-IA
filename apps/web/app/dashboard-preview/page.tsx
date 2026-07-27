import type { Metadata } from "next";
import { DashboardFunctional } from "./dashboard-functional";

export const metadata: Metadata = {
  title: "Dashboard | Apostolic IA",
  description: "Pré-visualização acessível do dashboard do Apostolic IA."
};

export default function DashboardPreviewPage() {
  return <DashboardFunctional />;
}

