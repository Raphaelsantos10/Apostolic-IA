import { projectStatus } from "@apostolic-ia/domain";

const foundations = [
  "Next.js com App Router",
  "TypeScript em modo estrito",
  "Tokens partilhados",
  "Base acessível e responsiva"
];

export default function HomePage() {
  const status = projectStatus();

  return (
    <main id="conteudo">
      <section className="hero" aria-labelledby="titulo-principal">
        <p className="eyebrow">Sprint 010 · Fundação tecnológica</p>
        <h1 id="titulo-principal">Apostolic IA</h1>
        <p className="lead">
          A base web está ativa. Cursos, Bíblia, conta e professor de IA
          continuam planejados e ainda não estão disponíveis.
        </p>
        <div className="status" role="status">
          <span className="status-dot" aria-hidden="true" />
          {status.label}
        </div>
      </section>

      <section aria-labelledby="fundacoes">
        <h2 id="fundacoes">Fundação preparada</h2>
        <ul className="cards">
          {foundations.map((foundation) => (
            <li key={foundation}>{foundation}</li>
          ))}
        </ul>
      </section>

      <aside className="notice" aria-labelledby="limite">
        <h2 id="limite">Estado honesto</h2>
        <p>
          Esta é uma base técnica, não uma versão pública do produto. Nenhum
          conteúdo bíblico protegido ou serviço externo foi integrado.
        </p>
      </aside>
    </main>
  );
}
