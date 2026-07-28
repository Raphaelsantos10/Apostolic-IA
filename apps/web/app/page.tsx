import { AppShell } from "../components/app-shell";
import { resolveAppView } from "../lib/app-navigation.mjs";

type Params = Promise<{ view?: string }>;

export default async function HomePage({
  searchParams
}: Readonly<{ searchParams: Params }>) {
  const params = await searchParams;
  return <AppShell initialView={resolveAppView(params.view)} />;
}
