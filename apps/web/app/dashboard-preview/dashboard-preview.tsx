"use client";

import { useState } from "react";
import styles from "./dashboard-preview.module.css";

type LearningMode = "adventure" | "academic";

const courses = [
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
] as const;

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

export function DashboardPreview() {
  const [mode, setMode] = useState<LearningMode>("adventure");
  const adventure = mode === "adventure";

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
            <h1>Bem-vindo de volta!</h1>
            <p>Continue o seu estudo no ritmo que faz sentido para você.</p>
          </div>

          <div className={styles.headerActions}>
            <div className={styles.modeSwitch} aria-label="Modo de aprendizagem">
              <button
                className={adventure ? styles.selectedMode : ""}
                type="button"
                aria-pressed={adventure}
                onClick={() => setMode("adventure")}
              >
                Aventura
              </button>
              <button
                className={!adventure ? styles.selectedMode : ""}
                type="button"
                aria-pressed={!adventure}
                onClick={() => setMode("academic")}
              >
                Acadêmico
              </button>
            </div>
            <button className={styles.profile} type="button" aria-label="Abrir perfil">
              JS
            </button>
          </div>
        </header>

        <section className={styles.stats} aria-label="Resumo do progresso">
          <article className={styles.progressCard}>
            <div
              className={styles.progressRing}
              role="img"
              aria-label="Setenta e cinco por cento concluído"
            >
              <span>75%</span>
            </div>
            <div>
              <p className={styles.cardLabel}>Progresso geral</p>
              <h2>18 de 24 módulos</h2>
              <p>Você está avançando com consistência.</p>
              <button className={styles.primaryButton} type="button">
                Ver progresso
              </button>
            </div>
          </article>

          <article className={styles.nextCard}>
            <p className={styles.cardLabel}>Próximo estudo</p>
            <span className={styles.lessonIcon} aria-hidden="true">▤</span>
            <h2>Identidade e autoridade do cristão</h2>
            <p>Módulo 7 de 12 · aproximadamente 18 minutos</p>
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
                <h2>7 dias</h2>
                <p>Uma lembrança de constância, sem culpa ou competição.</p>
              </div>
            </article>
          )}
        </section>

        <div className={styles.contentGrid}>
          <section className={styles.coursesPanel} aria-labelledby="courses-heading">
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.eyebrow}>Continue aprendendo</p>
                <h2 id="courses-heading">Cursos em andamento</h2>
              </div>
              <button className={styles.textButton} type="button">Ver todos</button>
            </div>

            <div className={styles.courseGrid}>
              {courses.map((course) => (
                <article className={styles.courseCard} key={course.title}>
                  <div className={`${styles.courseArt} ${styles[course.tone]}`}>
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
          </section>

          <aside className={styles.activityPanel} aria-labelledby="activity-heading">
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.eyebrow}>Privado</p>
                <h2 id="activity-heading">Atividade recente</h2>
              </div>
            </div>
            <ol className={styles.activityList}>
              <li><span aria-hidden="true">✓</span><p><strong>Aula concluída</strong>Autoridade das Escrituras</p><time>Hoje</time></li>
              <li><span aria-hidden="true">★</span><p><strong>Nova conquista</strong>Primeira semana de estudo</p><time>Ontem</time></li>
              <li><span aria-hidden="true">▤</span><p><strong>Nota guardada</strong>Fundamentos da Fé</p><time>2 dias</time></li>
            </ol>

            <div className={styles.offline}>
              <span aria-hidden="true">☁</span>
              <div><strong>Disponível offline</strong><small>Conteúdo público selecionado</small></div>
              <span className={styles.statusDot} aria-label="Sincronização pronta" />
            </div>
          </aside>
        </div>

        {adventure && (
          <section className={styles.mission} aria-labelledby="mission-heading">
            <div>
              <p className={styles.eyebrow}>Missão cooperativa</p>
              <h2 id="mission-heading">Conhecer a história de Atos</h2>
              <p>Estude com o seu grupo. A missão não possui ranking espiritual.</p>
            </div>
            <div className={styles.missionProgress}>
              <span>12 de 20 atividades</span>
              <div><span /></div>
            </div>
            <button className={styles.secondaryButton} type="button">
              Abrir missão
            </button>
          </section>
        )}
      </main>

      <nav className={styles.mobileNav} aria-label="Navegação móvel">
        {navigation.slice(0, 5).map(([icon, label], index) => (
          <button className={index === 0 ? styles.mobileActive : ""} type="button" key={label}>
            <span aria-hidden="true">{icon}</span>
            <small>{label === "Dashboard" ? "Início" : label}</small>
          </button>
        ))}
      </nav>
    </div>
  );
}

