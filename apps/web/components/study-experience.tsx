"use client";

import Link from "next/link";
import { useState } from "react";
import { dashboardSectionHref } from "../lib/app-navigation.mjs";
import styles from "../app/dashboard-preview/study-experience.module.css";
import { AchievementCelebration, StudyFlame } from "./study-motion";

const steps = [
  {
    title: "Aprender",
    subtitle: "Estudo principal",
    icon: "▤"
  },
  {
    title: "Bíblia guiada",
    subtitle: "Leitura orientada",
    icon: "▥"
  },
  {
    title: "Praticar",
    subtitle: "Aplicação e exercícios",
    icon: "✎"
  },
  {
    title: "Avaliar",
    subtitle: "Verificar aprendizado",
    icon: "▣"
  }
] as const;

const stepCopy = [
  {
    title: "Autoridade, suficiência, clareza e necessidade",
    intro:
      "As Escrituras são a autoridade final para a fé e a vida. O estudo orienta o aluno a compreender o texto no seu contexto e a responder com fidelidade e humildade.",
    bullets: [
      "Autoridade: toda explicação permanece submetida às Escrituras.",
      "Suficiência: a Palavra conduz à salvação e à maturidade em Cristo.",
      "Clareza: o texto deve ser lido no seu contexto histórico e literário.",
      "Necessidade: a igreja aprende, ensina e discerne à luz da Palavra."
    ]
  },
  {
    title: "Leitura bíblica orientada",
    intro:
      "Leia 2 Timóteo 3:16–17 e 2 Pedro 1:20–21. Observe o que os textos afirmam sobre origem, propósito e interpretação responsável.",
    bullets: [
      "Identifique os verbos e os destinatários de cada passagem.",
      "Compare o texto em uma tradução autorizada disponível na plataforma.",
      "Registre dúvidas sem transformar impressões pessoais em doutrina.",
      "Ore por entendimento e examine tudo com responsabilidade."
    ]
  },
  {
    title: "Aplicação responsável",
    intro:
      "Explique com as suas palavras por que a autoridade bíblica protege a igreja de tradições, experiências e tecnologias tratadas como infalíveis.",
    bullets: [
      "Escreva uma síntese de três frases.",
      "Relacione o ensino a uma decisão cotidiana.",
      "Diferencie interpretação bíblica de opinião pessoal.",
      "Guarde uma pergunta para revisão pastoral ou acadêmica."
    ]
  },
  {
    title: "Revisão da aprendizagem",
    intro:
      "Responda ao quiz e confira as referências. A avaliação mede apenas compreensão do conteúdo; não mede fé, chamado ou maturidade espiritual.",
    bullets: [
      "A Bíblia possui autoridade final sobre fé e prática.",
      "A IA não cria doutrina, profecia nem decisão em nome de Deus.",
      "Os dons espirituais são examinados conforme as Escrituras.",
      "Conteúdo publicado exige aprovação humana documentada."
    ]
  }
] as const;

export function StudyExperience({
  progress,
  streak,
  completedLessons,
  totalLessons
}: Readonly<{
  progress: number;
  streak: number;
  completedLessons: number;
  totalLessons: number;
}>) {
  const [activeStep, setActiveStep] = useState(0);
  const [showAchievements, setShowAchievements] = useState(false);
  const copy = stepCopy[activeStep] ?? stepCopy[0];

  return (
    <section
      className={styles.workspace}
      id="study-workspace"
      aria-labelledby="study-title"
    >
      <div className={styles.studyHeader}>
        <div>
          <nav aria-label="Percurso atual" className={styles.breadcrumb}>
            <span>Fundamentos da Fé</span>
            <span aria-hidden="true">›</span>
            <span>Módulo 1: Escrituras</span>
            <span aria-hidden="true">›</span>
            <span>Aula 1</span>
          </nav>
          <h2 id="study-title">Fundamentos da Fé</h2>
          <p className={styles.moduleTitle}>
            Módulo 1: Escrituras — autoridade, inspiração e leitura responsável
          </p>
        </div>

        <div className={styles.studyProgress}>
          <span>Progresso do módulo</span>
          <strong>{progress}%</strong>
          <progress max="100" value={progress}>
            {progress}%
          </progress>
        </div>
      </div>

      <div className={styles.layout}>
        <div className={styles.lessonColumn}>
          <nav className={styles.steps} aria-label="Etapas da aula">
            {steps.map((step, index) => (
              <button
                className={index === activeStep ? styles.activeStep : ""}
                type="button"
                key={step.title}
                aria-current={index === activeStep ? "step" : undefined}
                onClick={() => setActiveStep(index)}
              >
                <span className={styles.stepNumber}>{index + 1}</span>
                <span className={styles.stepIcon} aria-hidden="true">
                  {step.icon}
                </span>
                <span>
                  <strong>{step.title}</strong>
                  <small>{step.subtitle}</small>
                </span>
              </button>
            ))}
          </nav>

          <article className={styles.lessonCard}>
            <aside className={styles.bibleGuide}>
              <header>
                <span aria-hidden="true">▥</span>
                <strong>Bíblia guiada</strong>
                <small>2 Timóteo 3:16–17</small>
              </header>
              <blockquote>
                Toda a Escritura é inspirada por Deus e útil para ensinar,
                corrigir e instruir em justiça.
              </blockquote>
              <p>
                Consulte o texto integral somente em tradução autorizada na
                área da Bíblia.
              </p>
              <Link href={dashboardSectionHref("bible")}>
                Ler no contexto
              </Link>
            </aside>

            <div className={styles.lessonContent}>
              <p className={styles.kicker}>Ideia central</p>
              <h3>{copy.title}</h3>
              <p>{copy.intro}</p>
              <h4>Pontos-chave</h4>
              <ul>
                {copy.bullets.map((bullet) => (
                  <li key={bullet}>
                    <span aria-hidden="true">✓</span>
                    {bullet}
                  </li>
                ))}
              </ul>
              <div className={styles.audioPlaceholder}>
                <button type="button" aria-label="Áudio ainda não publicado">
                  ▶
                </button>
                <span>
                  Áudio autoral em produção
                  <small>Transcrição obrigatória antes da publicação</small>
                </span>
                <strong>--:--</strong>
              </div>
            </div>
          </article>

          <footer className={styles.studyActions}>
            <div>
              <span aria-hidden="true">▤</span>
              <span>
                <strong>Minhas notas</strong>
                <small>Privadas e sincronizadas com a sua conta</small>
              </span>
            </div>
            <Link
              className={styles.continueButton}
              href={dashboardSectionHref("courses")}
            >
              Continuar estudo <span aria-hidden="true">›</span>
            </Link>
          </footer>
        </div>

        <aside className={styles.rightRail}>
          <section className={styles.todayMission}>
            <header>
              <span aria-hidden="true">◎</span>
              <strong>Missão de hoje</strong>
            </header>
            <p>Concluir a etapa de Bíblia guiada</p>
            <strong className={styles.xp}>+40 XP de aprendizagem</strong>
            <progress max="1" value={activeStep > 0 ? 1 : 0} />
            <small>
              XP representa atividades realizadas, nunca crescimento espiritual.
            </small>
          </section>

          <section className={styles.week}>
            <header>
              <StudyFlame />
              <span>
                <strong>{streak} dias de sequência</strong>
                <small>Constância sem culpa ou competição</small>
              </span>
            </header>
            <ol aria-label="Jornada desta semana">
              {["Seg", "Ter", "Qua", "Hoje", "Sex"].map((day, index) => (
                <li
                  className={index < 3 ? styles.completeDay : ""}
                  key={day}
                >
                  <span>{index < 3 ? "✓" : index === 3 ? "4" : "○"}</span>
                  <small>{day}</small>
                </li>
              ))}
            </ol>
          </section>

          <section className={styles.achievements}>
            <header>
              <h3>Conquistas</h3>
              <button
                type="button"
                aria-expanded={showAchievements}
                onClick={() => setShowAchievements((visible) => !visible)}
              >
                {showAchievements ? "Ocultar" : "Ver todas"}
              </button>
            </header>
            <AchievementCelebration active={showAchievements} />
            <article>
              <span aria-hidden="true">♨</span>
              <p>
                <strong>Constância — {streak} dias</strong>
                Você manteve o seu ritmo de estudo.
              </p>
            </article>
            <article>
              <span aria-hidden="true">▥</span>
              <p>
                <strong>Leitor diligente</strong>
                {completedLessons} de {totalLessons} aulas registradas.
              </p>
            </article>
            {showAchievements && (
              <p className={styles.honestLimit}>
                Conquistas celebram hábitos de aprendizagem. Elas não classificam
                fé, serviço, caráter ou maturidade cristã.
              </p>
            )}
          </section>

          <section className={styles.teacher}>
            <header>
              <span aria-hidden="true">✦</span>
              <h3>Professor IA</h3>
            </header>
            <strong>Bíblia: autoridade final</strong>
            <p>
              A IA explica o conteúdo aprovado e apresenta referências para
              conferência. Não cria doutrina, profecia ou decisão em nome de
              Deus.
            </p>
            <ul>
              <li>2 Timóteo 3:16–17</li>
              <li>2 Pedro 1:20–21</li>
              <li>1 Coríntios 14:29</li>
            </ul>
            <Link href={dashboardSectionHref("teacher")}>
              Fazer pergunta fundamentada
            </Link>
          </section>
        </aside>
      </div>
    </section>
  );
}
