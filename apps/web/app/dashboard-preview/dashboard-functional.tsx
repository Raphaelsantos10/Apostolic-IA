"use client";

import Link from "next/link";
import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject
} from "react";
import { AppViewContent } from "../../components/app-shell";
import {
  dashboardSectionHref,
  type AppView,
  type DashboardSection
} from "../../lib/app-navigation.mjs";
import { createClient } from "../../lib/supabase/client";
import { StudyExperience } from "../../components/study-experience";
import { StudyFlame } from "../../components/study-motion";
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
  avatarUrl: string | null;
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
  avatarUrl: null,
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

const emptyData: DashboardData = {
  name: "Estudante",
  avatarUrl: null,
  completedLessons: 0,
  totalLessons: 0,
  overallProgress: 0,
  currentStreak: 0,
  nextStudy: {
    title: "Catálogo em preparação",
    detail: "Conteúdos aparecem somente após publicação e aprovação humana"
  },
  courses: [],
  activities: [],
  mission: null
};

const discoveryCards = [
  { icon: "▥", label: "Bíblia guiada", detail: "Leia cada passagem no contexto" },
  { icon: "✦", label: "Professor IA", detail: "Pergunte com fontes verificáveis" },
  { icon: "◇", label: "Desafio diário", detail: "Revise o que realmente aprendeu" },
  { icon: "◌", label: "Comunidade", detail: "Compartilhe dúvidas com segurança" },
  { icon: "◔", label: "Seu progresso", detail: "Retome exatamente de onde parou" }
] as const;

const dailyDevotionals = [
  {
    verse: "A tua palavra é lâmpada para os meus pés e luz para o meu caminho.",
    reference: "Salmos 119:105",
    title: "Um passo de cada vez",
    reflection: "Deus nem sempre mostra o percurso inteiro. A Palavra oferece luz suficiente para o próximo passo fiel.",
    prayer: "Senhor, ilumina as minhas decisões de hoje e ensina-me a caminhar contigo. Amém."
  },
  {
    verse: "Confia no Senhor de todo o teu coração e não te apoies apenas no teu entendimento.",
    reference: "Provérbios 3:5",
    title: "Confiança antes da certeza",
    reflection: "A fé não ignora as perguntas; ela escolhe entregar a Deus aquilo que ainda não consegue compreender.",
    prayer: "Pai, ajuda-me a confiar no teu caráter quando eu ainda não vejo todas as respostas. Amém."
  },
  {
    verse: "Tudo posso naquele que me fortalece.",
    reference: "Filipenses 4:13",
    title: "Força para permanecer",
    reflection: "A força de Cristo não alimenta orgulho. Ela sustenta a obediência, a perseverança e o serviço nos dias difíceis.",
    prayer: "Jesus, fortalece-me para cumprir com amor aquilo que colocaste diante de mim. Amém."
  },
  {
    verse: "Entrega o teu caminho ao Senhor; confia nele, e ele agirá.",
    reference: "Salmos 37:5",
    title: "Entregar também é avançar",
    reflection: "Entregar não significa desistir da responsabilidade, mas agir sem carregar sozinho o peso do resultado.",
    prayer: "Senhor, recebe os meus planos e orienta cada atitude segundo a tua vontade. Amém."
  },
  {
    verse: "Sede fortes e corajosos; não temais, porque o Senhor vai convosco.",
    reference: "Deuteronómio 31:6",
    title: "Coragem acompanhada",
    reflection: "A coragem bíblica nasce da presença de Deus, não da ausência de medo.",
    prayer: "Deus, lembra-me hoje de que não caminho sozinho e dá-me coragem para fazer o que é certo. Amém."
  },
  {
    verse: "O fruto do Espírito é amor, alegria, paz, paciência, bondade, fidelidade, mansidão e domínio próprio.",
    reference: "Gálatas 5:22–23",
    title: "O caráter que cresce",
    reflection: "Maturidade espiritual aparece nas atitudes quotidianas, especialmente na forma como tratamos as pessoas.",
    prayer: "Espírito Santo, forma em mim um caráter que revele Jesus nas pequenas escolhas. Amém."
  },
  {
    verse: "Buscai primeiro o Reino de Deus e a sua justiça.",
    reference: "Mateus 6:33",
    title: "A prioridade que organiza",
    reflection: "Quando o Reino ocupa o primeiro lugar, as outras áreas encontram uma ordem mais saudável.",
    prayer: "Pai, reorganiza as minhas prioridades e faz do teu Reino o centro deste dia. Amém."
  },
  {
    verse: "Alegrai-vos na esperança, sede pacientes na tribulação e perseverai na oração.",
    reference: "Romanos 12:12",
    title: "Esperança que persevera",
    reflection: "Esperança, paciência e oração trabalham juntas para manter o coração firme durante a espera.",
    prayer: "Senhor, renova a minha esperança e ensina-me a perseverar sem perder a ternura. Amém."
  },
  {
    verse: "Se alguém necessita de sabedoria, peça-a a Deus, que a todos dá generosamente.",
    reference: "Tiago 1:5",
    title: "Sabedoria para hoje",
    reflection: "Antes de reagir depressa, podemos parar e pedir a perspectiva de Deus para a situação.",
    prayer: "Deus generoso, concede-me sabedoria para falar, decidir e servir bem hoje. Amém."
  },
  {
    verse: "Levai as cargas uns dos outros e assim cumprireis a lei de Cristo.",
    reference: "Gálatas 6:2",
    title: "Fé que partilha o peso",
    reflection: "A comunidade cristã torna o amor visível quando percebe, escuta e ajuda a carregar dificuldades reais.",
    prayer: "Jesus, abre os meus olhos para reconhecer quem precisa de cuidado e torna-me disponível. Amém."
  }
] as const;

function devotionalForDate(date: Date | null) {
  if (!date) return dailyDevotionals[0];
  const dayNumber = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000
  );
  return dailyDevotionals[dayNumber % dailyDevotionals.length] ?? dailyDevotionals[0];
}

const navigation = [
  { icon: "⌂", label: "Dashboard", section: "dashboard" },
  { icon: "▤", label: "Estudos", section: "study" },
  { icon: "▣", label: "Cursos", section: "courses" },
  { icon: "▥", label: "Bíblia", section: "bible" },
  { icon: "✦", label: "Professor IA", section: "teacher" },
  { icon: "◇", label: "Jogos", section: "games" },
  { icon: "◌", label: "Comunidade", section: "community" },
  { icon: "◔", label: "Progresso", section: "progress" }
] satisfies ReadonlyArray<{
  icon: string;
  label: string;
  section: DashboardSection;
}>;

const mobileNavigation = [
  { icon: "⌂", label: "Dashboard", section: "dashboard" },
  { icon: "▤", label: "Estudos", section: "study" },
  { icon: "▣", label: "Cursos", section: "courses" },
  { icon: "◌", label: "Comunidade", section: "community" },
  { icon: "◎", label: "Perfil", section: "profile" }
] satisfies ReadonlyArray<{
  icon: string;
  label: string;
  section: DashboardSection;
}>;

const searchDestinations = [
  { label: "Dashboard", detail: "Resumo da sua jornada", section: "dashboard" },
  { label: "Estudos", detail: "Retomar aulas e atividades", section: "study" },
  { label: "Cursos", detail: "Explorar o catálogo", section: "courses" },
  { label: "Bíblia", detail: "Leitura e pesquisa bíblica", section: "bible" },
  { label: "Professor IA", detail: "Perguntas com fontes", section: "teacher" },
  { label: "Comunidade", detail: "Círculos e publicações", section: "community" },
  { label: "Progresso", detail: "Atividades e constância", section: "progress" }
] satisfies ReadonlyArray<{
  label: string;
  detail: string;
  section: DashboardSection;
}>;

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
  avatarUrl: string | null,
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
    avatarUrl,
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

export function DashboardFunctional({
  preview = false,
  initialSection = "dashboard",
  profilePanel = null
}: Readonly<{
  preview?: boolean;
  initialSection?: DashboardSection;
  profilePanel?: ReactNode;
}>) {
  const [mode, setMode] = useState<LearningMode>("adventure");
  const [now, setNow] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [devotionalOpen, setDevotionalOpen] = useState(false);
  const [lumiMessageOpen, setLumiMessageOpen] = useState(false);
  const discoveryCarousel = useRef<HTMLDivElement>(null);
  const coursesCarousel = useRef<HTMLDivElement>(null);
  const [dashboard, setDashboard] = useState<DashboardData>(
    preview ? demoData : emptyData
  );
  const [syncState, setSyncState] = useState<SyncState>("loading");
  const adventure = mode === "adventure";
  const visualExperience =
    preview ||
    process.env.NEXT_PUBLIC_STUDY_EXPERIENCE_V2 === "enabled";
  const activeSection: DashboardSection = initialSection;
  const sectionHref = (section: DashboardSection) => {
    if (!preview) return dashboardSectionHref(section);
    return section === "dashboard"
      ? "/dashboard-preview"
      : `/dashboard-preview?section=${encodeURIComponent(section)}`;
  };

  useEffect(() => {
    const storedMode = window.localStorage.getItem("apostolic-learning-mode");
    if (storedMode === "academic" || storedMode === "adventure") {
      setMode(storedMode);
    }
  }, []);

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
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
          if (active) {
            setDashboard(preview ? demoData : emptyData);
            setSyncState(preview ? "demo" : "error");
          }
          return;
        }

        const syncResponse = await supabase.rpc("sync_healthy_gamification");
        if (syncResponse.error) throw syncResponse.error;
        const [
          courseResponse,
          identityResponse,
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
            .from("profiles")
            .select("display_name,avatar_url")
            .eq("id", authData.user.id)
            .maybeSingle(),
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

        const legacyIdentity = identityResponse.error
          ? await supabase
              .from("profiles")
              .select("display_name")
              .eq("id", authData.user.id)
              .maybeSingle()
          : null;
        const identity = identityResponse.data ?? legacyIdentity?.data;

        setDashboard(
          buildDashboardData(
            displayName(
              {
                display_name:
                  identity?.display_name ??
                  (authData.user.user_metadata as Record<string, unknown> | undefined)
                    ?.display_name
              },
              authData.user.email
            ),
            identityResponse.data?.avatar_url ?? null,
            (courseResponse.data ?? []) as unknown as CatalogCourse[],
            (progressResponse.data ?? []) as ProgressRow[],
            profileResponse.data as GamificationProfile | null,
            (eventResponse.data ?? []) as PointEvent[],
            (missionResponse.data ?? []) as MissionDefinition[]
          )
        );
        setSyncState("ready");
      } catch {
        if (active) {
          setDashboard(preview ? demoData : emptyData);
          setSyncState(preview ? "demo" : "error");
        }
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [preview, initialSection]);

  const selectMode = (nextMode: LearningMode) => {
    setMode(nextMode);
    window.localStorage.setItem("apostolic-learning-mode", nextMode);
  };
  const moveCarousel = (
    carousel: RefObject<HTMLDivElement | null>,
    direction: -1 | 1
  ) => {
    const element = carousel.current;
    if (!element) return;
    element.scrollBy({
      left: direction * Math.max(280, element.clientWidth * 0.82),
      behavior: "smooth"
    });
  };
  const initials = dashboard.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  const firstName = dashboard.name.trim().split(/\s+/)[0] || "Estudante";
  const greeting = now
    ? now.getHours() < 12
      ? "Bom dia"
      : now.getHours() < 18
        ? "Boa tarde"
        : "Boa noite"
    : "Olá";
  const formattedDate = now
    ? new Intl.DateTimeFormat("pt-PT", {
        weekday: "long",
        day: "2-digit",
        month: "long"
      }).format(now)
    : "A preparar o seu dia…";
  const formattedTime = now
    ? new Intl.DateTimeFormat("pt-PT", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      }).format(now)
    : "--:--:--";
  const dailyDevotional = devotionalForDate(now);
  const searchResults = searchQuery.trim()
    ? searchDestinations.filter((item) =>
        `${item.label} ${item.detail}`.toLocaleLowerCase("pt")
          .includes(searchQuery.trim().toLocaleLowerCase("pt"))
      )
    : [];
  const syncMessage =
    syncState === "loading"
      ? "A sincronizar o seu progresso…"
      : syncState === "ready"
        ? "Progresso privado sincronizado com a sua conta."
        : syncState === "error"
          ? "Não foi possível sincronizar. Exibindo um estado vazio seguro."
          : "Dados de demonstração. Entre na sua conta para ver o progresso real.";

  return (
    <div
      className={`${styles.page} ${adventure ? "" : styles.academicMode}`}
      data-learning-mode={mode}
    >
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
            {navigation.map(({ icon, label, section }) => (
              <li key={label}>
                {section ? (
                  <Link
                    className={
                      activeSection === section
                        ? styles.activeNav
                        : styles.navButton
                    }
                    href={sectionHref(section)}
                    aria-current={
                      activeSection === section ? "page" : undefined
                    }
                  >
                    <span aria-hidden="true">{icon}</span>
                    {label}
                  </Link>
                ) : (
                  <button
                    aria-disabled="true"
                    className={styles.disabledNav}
                    disabled
                    title="Destino em preparação"
                    type="button"
                  >
                    <span aria-hidden="true">{icon}</span>
                    {label}
                  </button>
                )}
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
            <p className={styles.liveDate}>{formattedDate}</p>
            <h1>{greeting}, {firstName}!</h1>
            <p>Continue o seu estudo no ritmo que faz sentido para você.</p>
          </div>
          <div className={styles.headerActions}>
            <div className={styles.dashboardSearch} role="search">
              <span aria-hidden="true">⌕</span>
              <input
                aria-label="Pesquisar no dashboard"
                placeholder="Pesquisar"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
              {searchQuery && (
                <div className={styles.searchResults}>
                  {searchResults.length ? searchResults.map((item) => (
                    <Link href={sectionHref(item.section)} key={item.section}>
                      <strong>{item.label}</strong>
                      <small>{item.detail}</small>
                    </Link>
                  )) : <p>Nenhum destino encontrado.</p>}
                </div>
              )}
            </div>
            <div className={styles.modeControl}>
              <span className={styles.modeLabel}>Modo</span>
              <button
                className={styles.modeSwitch}
                type="button"
                role="switch"
                aria-checked={adventure}
                aria-label={`Modo ${adventure ? "Aventura" : "Acadêmico"}. Alterar para ${adventure ? "Acadêmico" : "Aventura"}`}
                onClick={() => selectMode(adventure ? "academic" : "adventure")}
              >
                <span className={styles.modeOption} aria-hidden="true">▤</span>
                <span className={styles.modeTrack} aria-hidden="true">
                  <span className={styles.modeThumb}>{adventure ? "✦" : "▤"}</span>
                </span>
                <span className={styles.modeOption} aria-hidden="true">✦</span>
              </button>
              <strong className={styles.modeName} aria-live="polite">
                {adventure ? "Aventura" : "Acadêmico"}
              </strong>
            </div>
            <time
              className={styles.liveClock}
              dateTime={now?.toISOString()}
              aria-live="off"
            >
              {formattedTime}
            </time>
            <div className={styles.profileMenu}>
              <button
                className={styles.profile}
                type="button"
                aria-label="Abrir menu do perfil"
                aria-expanded={profileOpen}
                onClick={() => setProfileOpen((open) => !open)}
                style={dashboard.avatarUrl ? {
                  backgroundImage: `url("${dashboard.avatarUrl}")`
                } : undefined}
              >
                {dashboard.avatarUrl ? <span className={styles.srOnly}>Perfil</span> : initials || "A"}
              </button>
              {profileOpen && (
                <div className={styles.profileDropdown}>
                  <div>
                    <strong>{dashboard.name}</strong>
                    <small>Perfil pessoal</small>
                  </div>
                  <Link href={sectionHref("profile")}>Editar perfil e fotografia</Link>
                  <Link href={sectionHref("progress")}>Ver o meu progresso</Link>
                  <Link href={sectionHref("community")}>Abrir comunidade</Link>
                  <a href="/conta">Conta e segurança</a>
                </div>
              )}
            </div>
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

        {activeSection === "dashboard" ? (
          <>
        <section className={styles.stats} aria-label="Resumo do progresso">
          <article className={styles.nextCard}>
            <Image
              alt=""
              className={styles.heroBackdrop}
              fill
              priority
              sizes="(max-width: 780px) 100vw, calc(100vw - 248px)"
              src={adventure
                ? "/dashboard-hero-adventure-v2.webp"
                : "/dashboard-hero-journey.webp"}
            />
            <button
              className={styles.heroLumi}
              type="button"
              aria-label={lumiMessageOpen
                ? "Fechar mensagem da Lumi"
                : "Ouvir o versículo do dia com a Lumi"}
              aria-expanded={lumiMessageOpen}
              onClick={() => setLumiMessageOpen((open) => !open)}
            >
              <span className={styles.lumiAura} />
              <Image
                alt={adventure
                  ? "Lumi em pose de exploradora, segurando uma Bíblia aberta"
                  : "Lumi, guia de estudos da Apostolic IA"}
                height={615}
                priority
                src={adventure
                  ? "/characters/lumi/adventure-guide.png"
                  : "/characters/lumi/hero-cutout.png"}
                width={410}
              />
              <span className={styles.lumiHint}>Clique na Lumi</span>
            </button>
            {lumiMessageOpen && (
              <aside className={styles.lumiMessage} aria-live="polite">
                <span className={styles.lumiMessageLabel}>Lumi diz</span>
                <blockquote>“{dailyDevotional.verse}”</blockquote>
                <cite>{dailyDevotional.reference}</cite>
                <Link href={sectionHref("bible")}>Ler na Bíblia →</Link>
              </aside>
            )}
            <div className={styles.heroContent}>
              <p className={styles.cardLabel}>
                {adventure ? "Sua jornada continua" : "Plano acadêmico"}
              </p>
              <span className={styles.modeExperienceBadge}>
                {adventure ? "✦ Exploração guiada" : "▤ Estudo estruturado"}
              </span>
              <span className={styles.lessonIcon} aria-hidden="true">▤</span>
              <h2>{dashboard.nextStudy.title}</h2>
              <p>
                {adventure
                  ? `${dashboard.nextStudy.detail} · avance por missões e descobertas.`
                  : `${dashboard.nextStudy.detail} · siga o plano curricular no seu ritmo.`}
              </p>
              <Link
                className={styles.primaryButton}
                href={sectionHref("study")}
              >
                {adventure ? "Entrar na aventura" : "Abrir plano de estudo"}
              </Link>
            </div>
          </article>

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
              <Link
                className={styles.primaryButton}
                href={sectionHref("progress")}
              >
                Ver progresso
              </Link>
            </div>
          </article>

          <article className={styles.verseCard}>
            <p className={styles.cardLabel}>Versículo do dia</p>
            <blockquote>“{dailyDevotional.verse}”</blockquote>
            <cite>{dailyDevotional.reference}</cite>
            <small className={styles.dailyStatus}>Atualizado diariamente</small>
          </article>

          <article className={styles.devotionalCard}>
            <p className={styles.cardLabel}>Devocional diário</p>
            <h2>{dailyDevotional.title}</h2>
            <p>{dailyDevotional.reflection}</p>
            <button
              className={styles.devotionalButton}
              type="button"
              aria-expanded={devotionalOpen}
              onClick={() => setDevotionalOpen((open) => !open)}
            >
              {devotionalOpen ? "Fechar oração" : "Refletir e orar"}
            </button>
            {devotionalOpen && (
              <div className={styles.devotionalPrayer}>
                <strong>Oração</strong>
                <p>{dailyDevotional.prayer}</p>
              </div>
            )}
          </article>

          {adventure && (
            <article className={styles.streakCard}>
              <StudyFlame />
              <div>
                <p className={styles.cardLabel}>Sequência de estudo</p>
                <h2>{dashboard.currentStreak} dias</h2>
                <p>Uma lembrança de constância, sem culpa ou competição.</p>
              </div>
            </article>
          )}
        </section>

        <section
          className={styles.discoveryRail}
          aria-label={adventure
            ? "Descubra recursos da sua jornada"
            : "Atalhos do plano acadêmico"}
        >
          <div className={styles.carouselHeader}>
            <div>
              <p className={styles.eyebrow}>{adventure ? "Explore" : "Acesso rápido"}</p>
              <h2>{adventure ? "Descobertas da jornada" : "Ferramentas de estudo"}</h2>
            </div>
            <div className={styles.carouselControls} aria-label="Controlos das descobertas">
              <button type="button" aria-label="Ver descobertas anteriores" onClick={() => moveCarousel(discoveryCarousel, -1)}>‹</button>
              <button type="button" aria-label="Ver próximas descobertas" onClick={() => moveCarousel(discoveryCarousel, 1)}>›</button>
            </div>
          </div>
          <div className={styles.discoveryTrack} ref={discoveryCarousel}>
            {discoveryCards.map((item, index) => (
              <Link
                className={styles.discoveryCard}
                href={sectionHref(
                  (["bible", "teacher", "games", "community", "progress"] as const)[
                    index
                  ] ?? "dashboard"
                )}
                key={item.label}
              >
                <span aria-hidden="true">{item.icon}</span>
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.detail}</small>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <div className={`${styles.contentGrid} ${styles.scrollReveal}`}>
          <section
            className={styles.coursesPanel}
            aria-labelledby="courses-heading"
          >
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.eyebrow}>Continue aprendendo</p>
                <h2 id="courses-heading">Cursos em andamento</h2>
              </div>
              <Link
                className={styles.textButton}
                href={sectionHref("courses")}
              >
                Ver todos
              </Link>
              <div className={styles.carouselControls} aria-label="Controlos dos cursos">
                <button type="button" aria-label="Ver cursos anteriores" onClick={() => moveCarousel(coursesCarousel, -1)}>‹</button>
                <button type="button" aria-label="Ver próximos cursos" onClick={() => moveCarousel(coursesCarousel, 1)}>›</button>
              </div>
            </div>

            {dashboard.courses.length === 0 ? (
              <div className={styles.sideNote}>
                <p>Nenhum curso publicado está disponível neste momento.</p>
              </div>
            ) : (
              <div className={styles.courseGrid} ref={coursesCarousel}>
                {dashboard.courses.map((course) => (
                  <article className={styles.courseCard} key={course.title}>
                    <div
                      className={[
                        styles.courseArt,
                        styles[course.tone]
                      ].join(" ")}
                    >
                      <span aria-hidden="true">▣</span>
                      <small>
                        {adventure ? "TRILHA DE APRENDIZAGEM" : "PLANO CURRICULAR"}
                      </small>
                    </div>
                    <div className={styles.courseBody}>
                      <h3>{course.title}</h3>
                      <p>{course.module}</p>
                      <div className={styles.progressLine}>
                        <span style={{ width: `${course.progress}%` }} />
                      </div>
                      <div className={styles.courseMeta}>
                        <span>{course.progress}% concluído</span>
                        <Link href={sectionHref("study")}>
                          Continuar
                        </Link>
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
          <section
            className={`${styles.mission} ${styles.scrollReveal}`}
            aria-labelledby="mission-heading"
          >
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
            <Link
              className={styles.secondaryButton}
              href={sectionHref("progress")}
            >
              Abrir missão
            </Link>
          </section>
        )}
          </>
        ) : (
          <section
            className={styles.sectionView}
            aria-label="Área funcional do dashboard"
          >
            {activeSection === "study" && visualExperience ? (
              <StudyExperience
                progress={dashboard.overallProgress}
                streak={dashboard.currentStreak}
                completedLessons={dashboard.completedLessons}
                totalLessons={dashboard.totalLessons}
              />
            ) : activeSection === "profile" ? (
              profilePanel
            ) : (
              <AppViewContent view={activeSection as AppView} />
            )}
          </section>
        )}
      </main>

      <nav className={styles.mobileNav} aria-label="Navegação móvel">
        {mobileNavigation.map(({ icon, label, section }) => (
            <Link
              className={
                activeSection === section ? styles.mobileActive : ""
              }
              href={sectionHref(section)}
              key={label}
              aria-current={
                activeSection === section ? "page" : undefined
              }
            >
              <span aria-hidden="true">{icon}</span>
              <small>{label === "Dashboard" ? "Início" : label}</small>
            </Link>
          ))}
      </nav>
    </div>
  );
}
