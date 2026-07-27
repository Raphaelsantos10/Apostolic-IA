import type { Metadata } from "next";
import { DashboardPreview } from "./dashboard-preview";

export const metadata: Metadata = {
  title: "Dashboard | Apostolic IA",
  description: "Pré-visualização acessível do dashboard do Apostolic IA."
};

export default function DashboardPreviewPage() {
  return <DashboardPreview />;
}

