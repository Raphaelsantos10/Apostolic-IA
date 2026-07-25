import Link from "next/link";
type Params = Promise<{ pontuacao?: string; plano?: string }>;
const labels: Record<string, string> = {
  fundamentos: "Fundamentos da fé",
  "panorama-biblico": "Panorama bíblico",
  aprofundamento: "Aprofundamento bíblico"
};
export default async function ResultPage({ searchParams }: Readonly<{ searchParams: Params }>) {
  const params = await searchParams;
  const plan = labels[params.plano ?? ""] ?? labels.fundamentos;
  return <><p className="eyebrow">Plano inicial</p><h1>{plan}</h1><p className="auth-message">Avaliação: {params.pontuacao ?? "0"} de 5. Esta indicação não limita os cursos futuros.</p><p><Link className="button button-primary" href="/conta">Continuar</Link></p><p><Link href="/onboarding">Refazer onboarding</Link></p></>;
}
