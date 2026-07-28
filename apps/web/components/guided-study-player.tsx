"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  adjacentGuidedLessonIndex,
  findResumeLessonIndex,
  flattenGuidedLessons,
  GUIDED_STUDY_STEPS,
  guidedLessonPosition,
  type GuidedStudyModule,
  type GuidedStudyProgressRow
} from "../lib/guided-study.mjs";
import { calculateCourseProgress } from "../lib/course-progress.mjs";
import { LessonLearningTools } from "./learning-tools";

export function GuidedStudyPlayer({
  courseTitle,
  modules,
  progressRows,
  onProgressChange
}: Readonly<{
  courseTitle: string;
  modules: GuidedStudyModule[];
  progressRows: GuidedStudyProgressRow[];
  onProgressChange: (
    lessonId: string,
    status: string,
    percent: number
  ) => void;
}>) {
  const lessons = useMemo(() => flattenGuidedLessons(modules), [modules]);
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [resumeResolved, setResumeResolved] = useState(false);
  const stageHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (resumeResolved || lessons.length === 0) return;
    setActiveLessonIndex(findResumeLessonIndex(lessons, progressRows));
    setResumeResolved(true);
  }, [lessons, progressRows, resumeResolved]);

  if (lessons.length === 0) {
    return (
      <div className="notice">
        <h3>Player em preparação</h3>
        <p>Este curso ainda não possui aulas publicadas para a jornada guiada.</p>
      </div>
    );
  }

  const lesson = lessons[activeLessonIndex] ?? lessons[0]!;
  const step =
    GUIDED_STUDY_STEPS[activeStepIndex] ?? GUIDED_STUDY_STEPS[0]!;
  const position = guidedLessonPosition(activeLessonIndex, lessons.length);
  const courseProgress = calculateCourseProgress(
    lessons.map((item) => item.id),
    progressRows
  );
  const progressByLesson = new Map(
    progressRows.map((row) => [row.lesson_id, row])
  );

  const focusStage = () => {
    window.requestAnimationFrame(() => stageHeading.current?.focus());
  };

  const selectStep = (index: number) => {
    setActiveStepIndex(index);
    focusStage();
  };

  const selectLesson = (index: number) => {
    setActiveLessonIndex(index);
    setActiveStepIndex(0);
    focusStage();
  };

  const previous = () => {
    if (activeStepIndex > 0) {
      selectStep(activeStepIndex - 1);
      return;
    }
    selectLesson(
      adjacentGuidedLessonIndex(
        activeLessonIndex,
        lessons.length,
        "previous"
      )
    );
  };

  const next = () => {
    if (activeStepIndex < GUIDED_STUDY_STEPS.length - 1) {
      selectStep(activeStepIndex + 1);
      return;
    }
    selectLesson(
      adjacentGuidedLessonIndex(activeLessonIndex, lessons.length, "next")
    );
  };

  const atBeginning = activeLessonIndex === 0 && activeStepIndex === 0;
  const atEnd =
    activeLessonIndex === lessons.length - 1 &&
    activeStepIndex === GUIDED_STUDY_STEPS.length - 1;

  return (
    <section
      className="guided-player"
      aria-labelledby="guided-player-title"
    >
      <header className="guided-player-header">
        <div>
          <p className="eyebrow">Piloto funcional - conteúdo publicado</p>
          <h3 id="guided-player-title">Player de estudo guiado</h3>
          <p>
            Uma aula por vez, dentro do dashboard aprovado. Este percurso não
            representa o seminário teológico completo.
          </p>
        </div>
        <div className="guided-course-progress">
          <strong>{courseProgress}% concluído</strong>
          <progress
            max="100"
            value={courseProgress}
            aria-label={`${courseProgress}% concluído em ${courseTitle}`}
          />
        </div>
      </header>

      <div className="guided-player-layout">
        <aside className="guided-outline" aria-label="Percurso do módulo piloto">
          <p>
            Aula {position.current} de {position.total}
          </p>
          <ol>
            {lessons.map((item, index) => {
              const status = progressByLesson.get(item.id)?.status;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={index === activeLessonIndex ? "is-active" : ""}
                    aria-current={
                      index === activeLessonIndex ? "step" : undefined
                    }
                    onClick={() => selectLesson(index)}
                  >
                    <span aria-hidden="true">
                      {status === "completed"
                        ? "✓"
                        : status === "in_progress"
                          ? "◐"
                          : "○"}
                    </span>
                    <span>
                      <small>{item.moduleTitle}</small>
                      <strong>{item.title}</strong>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </aside>

        <div className="guided-stage">
          <nav className="guided-steps" aria-label="Etapas desta aula">
            {GUIDED_STUDY_STEPS.map((item, index) => (
              <button
                type="button"
                key={item.id}
                className={index === activeStepIndex ? "is-active" : ""}
                aria-current={index === activeStepIndex ? "step" : undefined}
                onClick={() => selectStep(index)}
              >
                <span>{index + 1}</span>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="guided-stage-content">
            <p className="guided-position" role="status">
              {lesson.moduleTitle} - Aula {position.current} de {position.total}
            </p>
            <h4 ref={stageHeading} tabIndex={-1}>
              {step.label}: {lesson.title}
            </h4>

            {step.id === "overview" && (
              <div className="guided-copy">
                <p>{lesson.summary}</p>
                <div className="guided-objective">
                  <strong>Objetivo desta etapa</strong>
                  <p>
                    Compreender o ponto central, praticar com a verificação
                    publicada e registrar uma aplicação pessoal.
                  </p>
                </div>
                <p>
                  <strong>Contexto do módulo:</strong> {lesson.moduleSummary}
                </p>
              </div>
            )}

            {step.id === "learn" && (
              <div className="guided-copy">
                <p className="guided-resource-label">
                  Recurso principal:{" "}
                  {lesson.kind === "text" ? "leitura guiada" : lesson.kind}
                </p>
                {lesson.body_text ? (
                  <p className="guided-lesson-body">{lesson.body_text}</p>
                ) : (
                  <p>
                    O recurso desta aula ainda não possui uma alternativa
                    textual publicada.
                  </p>
                )}
                <p className="guided-authority-note">
                  Examine cada explicação à luz das Escrituras e do contexto. A
                  Bíblia permanece a autoridade final.
                </p>
              </div>
            )}

            {step.id === "practice" && (
              <div className="guided-copy">
                <p>
                  Responda à verificação e use a anotação privada para registrar
                  o que compreendeu ou uma dúvida a revisar.
                </p>
                <LessonLearningTools
                  lessonId={lesson.id}
                  onProgressChange={onProgressChange}
                />
              </div>
            )}

            {step.id === "review" && (
              <div className="guided-copy">
                <div className="guided-objective">
                  <strong>Revisão consciente</strong>
                  <p>
                    Confirme se consegue explicar o ponto central com suas
                    próprias palavras. Se ainda houver dúvida, volte à leitura
                    ou mantenha a aula em andamento.
                  </p>
                </div>
                <p>
                  A conclusão mede apenas o avanço nesta atividade. Ela não mede
                  fé, maturidade espiritual ou chamado ministerial.
                </p>
              </div>
            )}
          </div>

          <footer className="guided-controls">
            <button
              className="button button-secondary"
              type="button"
              onClick={previous}
              disabled={atBeginning}
            >
              Voltar
            </button>
            <span>
              Etapa {activeStepIndex + 1} de {GUIDED_STUDY_STEPS.length}
            </span>
            <button
              className="button button-primary"
              type="button"
              onClick={next}
              disabled={atEnd}
            >
              {activeStepIndex === GUIDED_STUDY_STEPS.length - 1
                ? "Próxima aula"
                : "Continuar"}
            </button>
          </footer>
        </div>
      </div>
    </section>
  );
}
