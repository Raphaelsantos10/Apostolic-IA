"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";
import styles from "./dashboard-preview.module.css";

type LearningMode = "adventure" | "academic";
type SyncState = "loading" | "demo" | "ready" | "error";

type DashboardCourse = {
  title: string;
  module: string;
  progress: number;
  tone: "blue" | "gold" | "violet";
};

type DashboardActivity = {
  icon: string;
  label: string;
  detail: string;
  when: string;
};

type DashboardMission = {
  title: string;
  description: string;
  current: number;
  target: number;
};

type DashboardData = {
  name: string;
  completedLessons: number;
  totalLessons: number;
  overallProgress: number;
  currentStreak: number;
  nextStudy: {
    title: string;
    detail: string;
  };
  courses: DashboardCourse[];
  activities: DashboardActivity[];
  mission: DashboardMission | null;
};

type CatalogLesson = {
  id: string;
  title: string;
  position: number;
};

type CatalogModule = {
  id: string;
  title: string;
  position: number;
  lessons: CatalogLesson[];
};

type CatalogCourse = {
  id: string;
  title: string;
  position: number;
  course_modules: CatalogModule[];
};

type ProgressRow = {
  lesson_id: string;
  status: "not_started" | "in_progress" | "completed";
  percent: number;
  updated_at: string;
};

type GamificationProfile = {
  current_streak: number;
};

type PointEvent = {
  activity_kind: "lesson_completed" | "quiz_correct" | "reading_day_completed";
  earned_on: string;
  created_at: string;
};

type MissionDefinition = {
  title: string;
  description: string;
  activity_kind: PointEvent["activity_kind"];
  target_count: number;
};

const demoCourses: DashboardCourse[] = [
  {
    title: "Fundamentos da Fé Cristã",
    module: "Bíblia, autoridade e contexto",
    progress: 65,
    tone: "blue"
  },
  {
    title: "Vida no Espírito",
    module: "Caráter e fruto do Espírito",
    progress: 40,
    tone: "gold"
  },
  {
    title: "Panorama das Escrituras",
    module: "A narrativa bíblica",
    progress: 20,
    tone: "violet"
  }
];

const demoData: DashboardData = {
  name: "Estudante",
  completedLessons: 18,
  totalLessons: 24,
  overallProgress: 75,
  currentStreak: 7,
  nextStudy: {
    title: "Identidade e autoridade do cristão",
    detail: "Módulo 7 de 12 · aproximadamente 18 minutos"
  },
  courses: demoCourses,
  activities: [
    {
      icon: "✓",
      label: "Aula concluída",
      detail: "Autoridade das Escrituras",
      when: "Hoje"
    },
    {
      icon: "★",
      label: "Nova conquista",
      detail: "Primeira semana de estudo",
      when: "Ontem"
    },
    {
      icon: "▤",
      label: "Nota guardada",
      detail: "Fundamentos da Fé",
      when: "2 dias"
    }
  ],
  mission: {
    title: "Conhecer a história de Atos",
    description: "Estude com o seu grupo. A missão não possui ranking espiritual.",
    current: 12,
    target: 20
  }
};

const navigation = [
  ["⌂", "Dashboard"],
  ["▤", "Estudos"],
  ["▣", "Cursos"],
  ["▥", "Bíblia"],
  ["✦", "Professor IA"],
  ["◇", "Jogos"],
  ["◌", "Comunidade"],
  ["◔", "Progresso"]
] as const;

const tones = ["blue", "gold", "violet"] as const;

function displayName(
  metadata: Record<string, unknown> | undefined,
  email: string | undefined
) {
  const candidate = metadata?.display_name;
  if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  return email?.split("@")[0] || "Estudante";
}

function relativeDay(value: string) {
  const eventDate = new Date(`${value}T00:00:00`);
  const today = new Date();
  const eventUtc = Date.UTC(
    eventDate.getFullYear(),
    eventDate.getMonth(),
    eventDate.getDate()
  );
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const difference = Math.max(
    0,
    Math.round((todayUtc - eventUtc) / 86_400_000)
  );
  if (difference === 0) return "Hoje";
  if (difference === 1) return "Ontem";
  return `${difference} dias`;
}

function eventCopy(kind: PointEvent["activity_kind"]) {
  if (kind === "lesson_completed") {
    return {
      icon: "✓",
      label: "Aula concluída",
      detail: "Progresso de estudo registrado"
    };
  }
  if (kind === "quiz_correct") {
    return {
      icon: "◇",
      label: "Revisão correta",
      detail: "Conhecimento bíblico revisado"
    };
  }
  return {
    icon: "▥",
    label: "Leitura concluída",
    detail: "Plano bíblico atualizado"
  };
}

function buildDashboardData(
  name: string,
  catalog: CatalogCourse[],
  progressRows: ProgressRow[],
  profile: GamificationProfile | null,
  events: PointEvent[],
  missions: MissionDefinition[]
): DashboardData {
  const progressByLesson = new Map(
    progressRows.map((row) => [row.lesson_id, row])
  );
  const orderedCatalog = [...catalog].sort((a, b) => a.position - b.position);
  const allLessons = orderedCatalog.flatMap((course) =>
    [...(course.course_modules ?? [])]
      .sort((a, b) => a.position - b.position)
      .flatMap((module) =>
        [...(module.lessons ?? [])]
          .sort((a, b) => a.position - b.position)
          .map((lesson) => ({ lesson, module }))
      )
  );
  const completedLessons = allLessons.filter(
    ({ lesson }) => progressByLesson.get(lesson.id)?.status === "completed"
  ).length;
  const totalLessons = allLessons.length;
  const overallProgress = totalLessons
    ? Math.round(
        allLessons.reduce(
          (sum, { lesson }) =>
            sum + (progressByLesson.get(lesson.id)?.percent ?? 0),
          0
        ) / totalLessons
      )
    : 0;
  const next = allLessons.find(
    ({ lesson }) => (progressByLesson.get(lesson.id)?.percent ?? 0) < 100
  );
  const courses = orderedCatalog.slice(0, 3).map((course, index) => {
    const modules = [...(course.course_modules ?? [])].sort(
      (a, b) => a.position - b.position
    );
    const lessons = modules.flatMap((module) => module.lessons ?? []);
    const progress = lessons.length
      ? Math.round(
          lessons.reduce(
            (sum, lesson) =>
              sum + (progressByLesson.get(lesson.id)?.percent ?? 0),
            0
          ) / lessons.length
        )
      : 0;
    const activeModule =
      modules.find((module) =>
        (module.lessons ?? []).some(
          (lesson) => (progressByLesson.get(lesson.id)?.percent ?? 0) < 100
        )
      ) ?? modules[0];
    return {
      title: course.title,
      module: activeModule?.title ?? "Conteúdo aprovado",
      progress,
      tone: tones[index % tones.length] ?? "blue"
    };
  });

  const counts: Record<string, number> = {};
  for (const event of events) {
    counts[event.activity_kind] = (counts[event.activity_kind] ?? 0) + 1;
  }
  const missionDefinition = missions[0];
  const mission = missionDefinition
    ? {
        title: missionDefinition.title,
        description:
          `${missionDefinition.description} Sem ranking espiritual ou vantagem paga.`,
        current: Math.min(
          counts[missionDefinition.activity_kind] ?? 0,
          missionDefinition.target_count
        ),
        target: missionDefinition.target_count
      }
    : null;
  const activities = [...events]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 3)
    .map((event) => ({
      ...eventCopy(event.activity_kind),
      when: relativeDay(event.earned_on)
    }));

  return {
    name,
    completedLessons,
    totalLessons,
    overallProgress,
    currentStreak: profile?.current_streak ?? 0,
    nextStudy: next
      ? {
          title: next.lesson.title,
          detail: `${next.module.title} · próximo conteúdo aprovado`
        }
      : {
          title: totalLessons
            ? "Percurso atual concluído"
            : "Catálogo em preparação",
          detail: totalLessons
            ? "Escolha uma revisão ou um novo curso"
            : "Novos conteúdos aparecerão após aprovação humana"
        },
    courses,
    activities,
    mission
  };
}

export function DashboardFunctional() {
  const [mode, setMode] = useState<LearningMode>("adventure");
  const [dashboard, setDashboard] = useState<DashboardData>(demoData);
  const [syncState, setSyncState] = useState<SyncState>("loading");
  const adventure = mode === "adventure";

  useEffect(() => {
    const storedMode = window.localStorage.getItem("apostolic-learning-mode");
    if (storedMode === "academic" || storedMode === "adventure") {
      setMode(storedMode);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const supabase = createClient();
        const { data: authData, error: authError } =
          await supabase.auth.getUser();
        if (authError) throw authError;
        if (!authData.user) {
          if (active) setSyncState("demo");
          return;
        }

        const syncResponse = await supabase.rpc("sync_healthy_gamification");
        if (syncResponse.error) throw syncResponse.error;
        const [
          courseResponse,
          progressResponse,
          profileResponse,
          eventResponse,
          missionResponse
        ] = await Promise.all([
          supabase
            .from("courses")
            .select(
              "id,title,position,course_modules(id,title,position,lessons(id,title,position))"
            )
            .order("position"),
          supabase
            .from("lesson_progress")
            .select("lesson_id,status,percent,updated_at")
            .order("updated_at", { ascending: false }),
          supabase
            .from("gamification_profiles")
            .select("current_streak")
            .maybeSingle(),
          supabase
            .from("learning_point_events")
            .select("activity_kind,earned_on,created_at")
            .order("created_at", { ascending: false })
            .limit(1000),
          supabase
            .from("mission_definitions")
            .select("title,description,activity_kind,target_count")
            .order("id")
        ]);
        const firstError = [
          courseResponse.error,
          progressResponse.error,
          profileResponse.error,
          eventResponse.error,
          missionResponse.error
        ].find(Boolean);
        if (firstError) throw firstError;
        if (!active) return;

        setDashboard(
          buildDashboardData(
            displayName(
              authData.user.user_metadata as
                | Record<string, unknown>
                | undefined,
              authData.user.email
            ),
            (courseResponse.data ?? []) as unknown as CatalogCourse[],
            (progressResponse.data ?? []) as ProgressRow[],
            profileResponse.data as GamificationProfile | null,
            (eventResponse.data ?? []) as PointEvent[],
            (missionResponse.data ?? []) as MissionDefinition[]
          )
        );
        setSyncState("ready");
      } catch {
        if (active) setSyncState("error");
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  const selectMode = (nextMode: LearningMode) => {
    setMode(nextMode);
    window.localStorage.setItem("apostolic-learning-mode", nextMode);
  };
  const initials = dashboard.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  const syncMessage =
    syncState === "loading"
      ? "A sincronizar o seu progresso…"
      : syncState === "ready"
        ? "Progresso privado sincronizado com a sua conta."
        : syncState === "error"
          ? "Não foi possível sincronizar. Exibindo uma demonstração segura."
          : "Dados de demonstração. Entre na sua conta para ver o progresso real.";

  return (
    <div className={styles.page}>
      <a className={styles.skipLink} href="#dashboard-content">
        Saltar para o conteúdo
      </a>

      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true">A</span>
          <span>
            <strong>Apostolic IA</strong>
            <small>Aprender para servir</small>
          </span>
        </div>
        <nav aria-label="Navegação do dashboard">
          <ul className={styles.navList}>
            {navigation.map(([icon, label], index) => (
              <li key={label}>
                <button
                  className={index === 0 ? styles.activeNav : styles.navButton}
                  type="button"
                  aria-current={index === 0 ? "page" : undefined}
                >
                  <span aria-hidden="true">{icon}</span>
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className={styles.sideNote}>
          <span aria-hidden="true">✦</span>
          <p>Gamificação mede aprendizagem, nunca espiritualidade.</p>
        </div>
      </aside>

      <main className={styles.main} id="dashboard-content">
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Jornada de aprendizagem</p>
            <h1>Bem-vindo de volta, {dashboard.name}!</h1>
            <p>Continue o seu estudo no ritmo que faz sentido para você.</p>
          </div>
          <div className={styles.headerActions}>
            <div className={styles.modeSwitch} aria-label="Modo de aprendizagem">
              <button
                className={adventure ? styles.selectedMode : ""}
                type="button"
                aria-pressed={adventure}
                onClick={() => selectMode("adventure")}
              >
                Aventura
              </button>
              <button
                className={!adventure ? styles.selectedMode : ""}
                type="button"
                aria-pressed={!adventure}
                onClick={() => selectMode("academic")}
              >
                Acadêmico
              </button>
            </div>
            <button
              className={styles.profile}
              type="button"
              aria-label="Abrir perfil"
            >
              {initials || "A"}
            </button>
          </div>
        </header>

        <div
          className={syncState === "error" ? styles.sideNote : styles.offline}
          role="status"
          aria-live="polite"
        >
          <span aria-hidden="true">{syncState === "ready" ? "✓" : "ⓘ"}</span>
          <div><strong>{syncMessage}</strong></div>
        </div>

        <section className={styles.stats} aria-label="Resumo do progresso">
          <article className={styles.progressCard}>
            <div
              className={styles.progressRing}
              role="img"
              aria-label={`${dashboard.overallProgress}% concluído`}
              style={{
                background:
                  `conic-gradient(var(--gold) 0 ${dashboard.overallProgress}%, ` +
                  `#243752 ${dashboard.overallProgress}% 100%)`
              }}
            >
              <span>{dashboard.overallProgress}%</span>
            </div>
            <div>
              <p className={styles.cardLabel}>Progresso geral</p>
              <h2>
                {dashboard.completedLessons} de {dashboard.totalLessons} aulas
              </h2>
              <p>O progresso é o mesmo nos modos Acadêmico e Aventura.</p>
              <button className={styles.primaryButton} type="button">
                Ver progresso
              </button>
            </div>
          </article>

          <article className={styles.nextCard}>
            <p className={styles.cardLabel}>Próximo estudo</p>
            <span className={styles.lessonIcon} aria-hidden="true">▤</span>
            <h2>{dashboard.nextStudy.title}</h2>
            <p>{dashboard.nextStudy.detail}</p>
            <button className={styles.primaryButton} type="button">
              Continuar estudando
            </button>
          </article>

          <article className={styles.verseCard}>
            <p className={styles.cardLabel}>Versículo do dia</p>
            <blockquote>
              “Lâmpada para os meus pés é tua palavra e luz, para o meu caminho.”
            </blockquote>
            <cite>Salmos 119:105</cite>
          </article>

          {adventure && (
            <article className={styles.streakCard}>
              <span className={styles.flame} aria-hidden="true">🔥</span>
              <div>
                <p className={styles.cardLabel}>Sequência de estudo</p>
                <h2>{dashboard.currentStreak} dias</h2>
                <p>Uma lembrança de constância, sem culpa ou competição.</p>
              </div>
            </article>
          )}
        </section>

        <div className={styles.contentGrid}>
          <section
            className={styles.coursesPanel}
            aria-labelledby="courses-heading"
          >
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.eyebrow}>Continue aprendendo</p>
                <h2 id="courses-heading">Cursos em andamento</h2>
              </div>
              <button className={styles.textButton} type="button">
                Ver todos
              </button>
            </div>

            {dashboard.courses.length === 0 ? (
              <div className={styles.sideNote}>
                <p>Nenhum curso publicado está disponível neste momento.</p>
              </div>
            ) : (
              <div className={styles.courseGrid}>
                {dashboard.courses.map((course) => (
                  <article className={styles.courseCard} key={course.title}>
                    <div
                      className={[
                        styles.courseArt,
                        styles[course.tone]
                      ].join(" ")}
                    >
                      <span aria-hidden="true">▣</span>
                      <small>FORMAÇÃO TEOLÓGICA</small>
                    </div>
                    <div className={styles.courseBody}>
                      <h3>{course.title}</h3>
                      <p>{course.module}</p>
                      <div className={styles.progressLine}>
                        <span style={{ width: `${course.progress}%` }} />
                      </div>
                      <div className={styles.courseMeta}>
                        <span>{course.progress}% concluído</span>
                        <button type="button">Continuar</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside
            className={styles.activityPanel}
            aria-labelledby="activity-heading"
          >
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.eyebrow}>Privado</p>
                <h2 id="activity-heading">Atividade recente</h2>
              </div>
            </div>
            {dashboard.activities.length === 0 ? (
              <div className={styles.sideNote}>
                <p>A sua primeira atividade aparecerá aqui.</p>
              </div>
            ) : (
              <ol className={styles.activityList}>
                {dashboard.activities.map((activity, index) => (
                  <li key={`${activity.label}-${activity.when}-${index}`}>
                    <span aria-hidden="true">{activity.icon}</span>
                    <p>
                      <strong>{activity.label}</strong>
                      {activity.detail}
                    </p>
                    <time>{activity.when}</time>
                  </li>
                ))}
              </ol>
            )}
            <div className={styles.offline}>
              <span aria-hidden="true">☁</span>
              <div>
                <strong>Disponível offline</strong>
                <small>Conteúdo público selecionado</small>
              </div>
              <span
                className={styles.statusDot}
                aria-label="Sincronização pronta"
              />
            </div>
          </aside>
        </div>

        {adventure && dashboard.mission && (
          <section className={styles.mission} aria-labelledby="mission-heading">
            <div>
              <p className={styles.eyebrow}>Missão de aprendizagem</p>
              <h2 id="mission-heading">{dashboard.mission.title}</h2>
              <p>{dashboard.mission.description}</p>
            </div>
            <div className={styles.missionProgress}>
              <span>
                {dashboard.mission.current} de {dashboard.mission.target} atividades
              </span>
              <div>
                <span
                  style={{
                    width:
                      `${Math.round(
                        (dashboard.mission.current /
                          dashboard.mission.target) *
                          100
                      )}%`
                  }}
                />
              </div>
            </div>
            <button className={styles.secondaryButton} type="button">
              Abrir missão
            </button>
          </section>
        )}
      </main>

      <nav className={styles.mobileNav} aria-label="Navegação móvel">
        {navigation.slice(0, 5).map(([icon, label], index) => (
          <button
            className={index === 0 ? styles.mobileActive : ""}
            type="button"
            key={label}
          >
            <span aria-hidden="true">{icon}</span>
            <small>{label === "Dashboard" ? "Início" : label}</small>
          </button>
        ))}
      </nav>
    </div>
  );
}
