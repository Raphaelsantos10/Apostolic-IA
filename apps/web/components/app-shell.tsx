"use client";

import { useEffect, useState } from "react";

type ViewName = "home" | "courses" | "bible" | "progress" | "more";
type ThemeName = "system" | "light" | "dark" | "sepia";

const views: ReadonlyArray<{
  id: ViewName;
  label: string;
  symbol: string;
  title: string;
}> = [
  { id: "home", label: "Início", symbol: "⌂", title: "Boa leitura" },
  { id: "courses", label: "Cursos", symbol: "▤", title: "Explore os cursos" },
  { id: "bible", label: "Bíblia", symbol: "▣", title: "Recursos bíblicos" },
  { id: "progress", label: "Progresso", symbol: "◔", title: "O seu progresso" },
  { id: "more", label: "Mais", symbol: "•••", title: "Preferências e ajuda" }
];

function resolveTheme(theme: ThemeName): Exclude<ThemeName, "system"> {
  if (theme !== "system") return theme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function AppShell() {
  const [view, setView] = useState<ViewName>("home");
  const [theme, setTheme] = useState<ThemeName>("system");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("apostolic-theme");
    const initial: ThemeName =
      stored === "light" || stored === "dark" || stored === "sepia"
        ? stored
        : "system";
    setTheme(initial);
    document.documentElement.dataset.theme = resolveTheme(initial);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.dataset.theme = resolveTheme(theme);
    window.localStorage.setItem("apostolic-theme", theme);
  }, [ready, theme]);

  const title = views.find((item) => item.id === view)?.title ?? "Apostolic IA";

  const navigate = (nextView: ViewName) => {
    setView(nextView);
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLElement>("#main-content")?.focus();
    });
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Saltar para o conteúdo</a>

      <aside className="sidebar" aria-label="Navegação principal">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">A</span>
          <span className="brand-copy">
            <strong>Apostolic IA</strong>
            <small>Em desenvolvimento</small>
          </span>
        </div>
        <Navigation current={view} onNavigate={navigate} />
        <div className="sidebar-note">
          <strong>Versão inicial</strong>
          <p>Sem conta, Bíblia licenciada ou professor de IA.</p>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Estudo individual</p>
            <p className="view-title">{title}</p>
          </div>
          <label className="theme-control">
            <span>Tema</span>
            <select
              value={theme}
              onChange={(event) => setTheme(event.target.value as ThemeName)}
            >
              <option value="system">Sistema</option>
              <option value="light">Claro</option>
              <option value="dark">Escuro</option>
              <option value="sepia">Sépia</option>
            </select>
          </label>
        </header>

        <main id="main-content" tabIndex={-1}>
          {view === "home" && <HomeView onNavigate={navigate} />}
          {view === "courses" && <CoursesView />}
          {view === "bible" && <BibleView />}
          {view === "progress" && <ProgressView />}
          {view === "more" && <MoreView />}
        </main>
      </div>

      <nav className="mobile-nav" aria-label="Navegação principal móvel">
        <Navigation current={view} onNavigate={navigate} />
      </nav>
    </div>
  );
}

function Navigation({
  current,
  onNavigate
}: Readonly<{
  current: ViewName;
  onNavigate: (view: ViewName) => void;
}>) {
  return (
    <div className="nav-list">
      {views.map((item) => (
        <button
          className={`nav-item${current === item.id ? " is-active" : ""}`}
          type="button"
          key={item.id}
          aria-current={current === item.id ? "page" : undefined}
          onClick={() => onNavigate(item.id)}
        >
          <span className="nav-symbol" aria-hidden="true">{item.symbol}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}

function HomeView({
  onNavigate
}: Readonly<{ onNavigate: (view: ViewName) => void }>) {
  return (
    <>
      <section className="hero" aria-labelledby="home-title">
        <div>
          <p className="eyebrow">Sprint 011 · Base web</p>
          <h1 id="home-title">Continue a sua jornada de estudo</h1>
          <p className="lead">
            A estrutura responsiva e instalável está ativa. Conteúdo real será
            publicado somente após produção e aprovação.
          </p>
          <button
            className="button button-primary"
            type="button"
            onClick={() => onNavigate("courses")}
          >
            Explorar estrutura
          </button>
        </div>
        <div className="foundation-status" role="status">
          <strong>Base ativa</strong>
          <span>Produto em desenvolvimento</span>
        </div>
      </section>

      <section className="section-block" aria-labelledby="foundations-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Fundação</p>
            <h2 id="foundations-title">Preparado nesta fase</h2>
          </div>
        </div>
        <ul className="card-grid">
          <li><strong>Responsiva</strong><span>Telemóvel, tablet e web</span></li>
          <li><strong>Instalável</strong><span>Manifesto e modo standalone</span></li>
          <li><strong>Offline básico</strong><span>Shell e página de recuperação</span></li>
          <li><strong>Acessível</strong><span>Teclado, foco e estrutura semântica</span></li>
        </ul>
      </section>
    </>
  );
}

function CoursesView() {
  return (
    <section aria-labelledby="courses-title">
      <p className="eyebrow">Estrutura demonstrativa</p>
      <h1 id="courses-title">Cursos</h1>
      <p className="lead">
        Nenhuma aula foi publicada. Os cartões apresentam somente a arquitetura
        planejada.
      </p>
      <div className="course-list">
        {["Fundamentos da fé", "Vida cristã", "Panorama bíblico"].map((name) => (
          <article key={name}>
            <div>
              <span className="badge">Planejado</span>
              <h2>{name}</h2>
              <p>Aguardando produção e revisão humana.</p>
            </div>
            <button className="button button-secondary" type="button" disabled>
              Indisponível
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function BibleView() {
  return (
    <section className="empty-state" aria-labelledby="bible-title">
      <span className="empty-icon" aria-hidden="true">▣</span>
      <p className="eyebrow">Licenciamento obrigatório</p>
      <h1 id="bible-title">Bíblia planejada</h1>
      <p>
        Nenhuma tradução protegida foi incorporada. O leitor será ativado
        somente após autorização documentada.
      </p>
    </section>
  );
}

function ProgressView() {
  return (
    <section aria-labelledby="progress-title">
      <p className="eyebrow">Estado local futuro</p>
      <h1 id="progress-title">Progresso</h1>
      <div className="metric-grid">
        <article><strong>0</strong><span>Aulas concluídas</span></article>
        <article><strong>0</strong><span>Revisões</span></article>
        <article><strong>—</strong><span>Sequência</span></article>
      </div>
      <div className="notice">
        <h2>Ainda não existem dados reais</h2>
        <p>Sincronização e conta serão implementadas em sprints futuras.</p>
      </div>
    </section>
  );
}

function MoreView() {
  return (
    <section aria-labelledby="more-title">
      <p className="eyebrow">Preferências</p>
      <h1 id="more-title">Mais</h1>
      <div className="settings-list">
        <article><h2>Aparência</h2><p>O tema é guardado neste navegador.</p></article>
        <article><h2>Instalação</h2><p>Use a opção de instalar do seu navegador compatível.</p></article>
        <article><h2>Offline</h2><p>Somente o shell visitado possui suporte inicial.</p></article>
        <article><h2>Privacidade</h2><p>Não há conta, telemetria própria ou envio de conteúdo.</p></article>
      </div>
    </section>
  );
}
