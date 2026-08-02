"use client";

import { useEffect, useState } from "react";
import type { AppView } from "../lib/app-navigation.mjs";
import { createClient } from "../lib/supabase/client";
import { BiblePlatform } from "./bible-platform";
import { HealthyGamificationPanel } from "./healthy-gamification";
import { CommunityPanel } from "./community-panel";
import { GamesHub } from "./games-hub";
import { BibleTeacher } from "./bible-teacher";
import { GuidedStudyPlayer } from "./guided-study-player";
import { DailyGoalPanel, LessonLearningTools } from "./learning-tools";
import { LearningProgressSummary } from "./learning-progress-summary";
import { ModuleReviewPlayer } from "./module-review-player";
import { PricingPanel } from "./pricing-panel";
import {
  calculateCourseProgress,
  type LearningProgressRow
} from "../lib/course-progress.mjs";

type ViewName = AppView;
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
  { id: "teacher", label: "Professor IA", symbol: "✦", title: "Professor de IA bíblica" },
  { id: "games", label: "Jogos", symbol: "◇", title: "Jogos bíblicos" },
  { id: "community", label: "Comunidade", symbol: "◌", title: "Círculos de estudo" },
  { id: "progress", label: "Progresso", symbol: "◔", title: "O seu progresso" },
  { id: "more", label: "Mais", symbol: "•••", title: "Preferências e ajuda" }
];

function resolveTheme(theme: ThemeName): Exclude<ThemeName, "system"> {
  if (theme !== "system") return theme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function AppShell({
  initialView = "home"
}: Readonly<{ initialView?: ViewName }>) {
  const [view, setView] = useState<ViewName>(initialView);
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
          <strong>Desenvolvimento ativo</strong>
          <p>Catálogo autoral com publicação controlada por RLS.</p>
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
          <AppViewContent view={view} onNavigate={navigate} />
        </main>
      </div>

      <nav className="mobile-nav" aria-label="Navegação principal móvel">
        <Navigation current={view} onNavigate={navigate} />
      </nav>
    </div>
  );
}

export function AppViewContent({
  view,
  onNavigate = () => undefined
}: Readonly<{
  view: ViewName;
  onNavigate?: (view: ViewName) => void;
}>) {
  if (view === "home") return <HomeView onNavigate={onNavigate} />;
  if (view === "courses") return <CoursesView />;
  if (view === "bible") return <BibleView />;
  if (view === "teacher") return <BibleTeacher />;
  if (view === "games") return <GamesHub />;
  if (view === "community") return <CommunityPanel />;
  if (view === "progress") return <ProgressView />;
  return <MoreView />;
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
          <p className="eyebrow">Sprint 016 · Catálogo</p>
          <h1 id="home-title">Continue a sua jornada de estudo</h1>
          <p className="lead">
            O catálogo apresenta somente cursos e módulos publicados após revisão
            editorial.
          </p>
          <button
            className="button button-primary"
            type="button"
            onClick={() => onNavigate("courses")}
          >
            Explorar cursos
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

type CatalogLesson = {
  id: string;
  title: string;
  summary: string;
  kind: "text" | "image" | "audio" | "video" | "mixed";
  body_text: string | null;
  position: number;
};

type CatalogModule = {
  id: string;
  title: string;
  summary: string;
  position: number;
  lessons: CatalogLesson[];
};

type CatalogCourse = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  level: "beginner" | "intermediate" | "advanced";
  course_modules: CatalogModule[];
};

const levelLabels: Record<CatalogCourse["level"], string> = {
  beginner: "Iniciante",
  intermediate: "Intermédio",
  advanced: "Avançado"
};

function CoursesView() {
  const [courses, setCourses] = useState<CatalogCourse[]>([]);
  const [progressRows, setProgressRows] = useState<LearningProgressRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const supabase = createClient();
      const [catalogResponse, authResponse] = await Promise.all([
        supabase
          .from("courses")
          .select("id,slug,title,summary,level,course_modules(id,title,summary,position,lessons(id,title,summary,kind,body_text,position))")
          .order("position")
          .order("position", { referencedTable: "course_modules" }),
        supabase.auth.getUser()
      ]);
      const progressResponse = authResponse.data.user
        ? await supabase
            .from("lesson_progress")
            .select("lesson_id,status,percent")
        : { data: [], error: null };

      if (!active) return;
      if (catalogResponse.error || progressResponse.error) {
        setError("Não foi possível carregar a jornada do curso.");
      } else {
        setCourses((catalogResponse.data ?? []) as CatalogCourse[]);
        setProgressRows(
          (progressResponse.data ?? []) as LearningProgressRow[]
        );
      }
      setLoading(false);
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  const updateProgress = (
    lessonId: string,
    status: string,
    percent: number
  ) => {
    setProgressRows((current) => [
      ...current.filter((row) => row.lesson_id !== lessonId),
      { lesson_id: lessonId, status, percent }
    ]);
  };

  return (
    <section aria-labelledby="courses-title">
      <p className="eyebrow">Conteúdo publicado</p>
      <h1 id="courses-title">Cursos</h1>
      <p className="lead">
        O percurso “Fundamentos Bíblicos” valida a jornada de módulo, aula,
        quiz e progresso. Os demais itens são demonstrações técnicas e não
        representam a formação teológica completa.
      </p>

      <ModuleReviewPlayer />

      {loading && <p className="catalog-status" role="status">A carregar catálogo…</p>}
      {error && <p className="catalog-status catalog-error" role="alert">{error}</p>}
      {!loading && !error && courses.length === 0 && (
        <div className="notice">
          <h2>Nenhum curso publicado</h2>
          <p>O conteúdo aparecerá após aprovação editorial.</p>
        </div>
      )}

      <div className="catalog-grid">
        {courses.map((course) => {
          const courseProgress = calculateCourseProgress(
            course.course_modules.flatMap((module) =>
              module.lessons.map((lesson) => lesson.id)
            ),
            progressRows
          );
          return (
          <article
            className={`catalog-card${
              course.slug === "fundamentos-biblicos" ? " is-guided" : ""
            }`}
            key={course.id}
          >
            <div className="catalog-card-heading">
              <div className="catalog-badges">
                <span className="badge">{levelLabels[course.level]}</span>
                <span className="badge">
                  {course.slug === "fundamentos-biblicos"
                    ? "Piloto funcional"
                    : "Demonstração técnica"}
                </span>
              </div>
              <h2>{course.title}</h2>
              <p>{course.summary}</p>
              <div className="course-progress-summary">
                <div>
                  <strong>Progresso neste curso</strong>
                  <span>{courseProgress}%</span>
                </div>
                <progress
                  max="100"
                  value={courseProgress}
                  aria-label={`${courseProgress}% concluído em ${course.title}`}
                />
              </div>
            </div>
            {course.slug === "fundamentos-biblicos" ? (
              <GuidedStudyPlayer
                courseTitle={course.title}
                modules={course.course_modules}
                progressRows={progressRows}
                onProgressChange={updateProgress}
              />
            ) : (
              <div className="catalog-modules">
                <h3>Módulos publicados</h3>
                {course.course_modules.length === 0 ? (
                  <p>Nenhum módulo publicado.</p>
                ) : (
                  <ol>
                    {course.course_modules.map((module) => (
                      <li key={module.id}>
                        <strong>{module.title}</strong>
                        <span>{module.summary}</span>
                        {module.lessons.length > 0 && (
                          <div className="lesson-list">
                            {[...module.lessons]
                              .sort((a, b) => a.position - b.position)
                              .map((lesson) => (
                                <details key={lesson.id}>
                                  <summary>
                                    <span className="badge">
                                      {lesson.kind === "text"
                                        ? "Texto"
                                        : lesson.kind}
                                    </span>
                                    {lesson.title}
                                  </summary>
                                  <p>{lesson.summary}</p>
                                  {lesson.body_text && (
                                    <p className="lesson-body">
                                      {lesson.body_text}
                                    </p>
                                  )}
                                  <LessonLearningTools
                                    lessonId={lesson.id}
                                    onProgressChange={updateProgress}
                                  />
                                </details>
                              ))}
                          </div>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            )}
          </article>
          );
        })}
      </div>
    </section>
  );
}

function BibleView() { return <BiblePlatform />; }

function ProgressView() {
  return (
    <section aria-labelledby="progress-title">
      <p className="eyebrow">Dados privados sincronizados</p>
      <h1 id="progress-title">Progresso</h1>
      <LearningProgressSummary />
      <DailyGoalPanel />
      <HealthyGamificationPanel />
      <div className="notice">
        <h2>Aprendizagem privada</h2>
        <p>Progresso, notas, favoritos, metas e revisões são protegidos por RLS.</p>
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
      <PricingPanel />
    </section>
  );
}
