"use client";

import { useEffect, useRef, useState } from "react";

type ReviewQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

type ReviewLesson = {
  number: number;
  slug: string;
  title: string;
  estimatedMinutes: number;
  summary: string;
  body: string;
  quiz: ReviewQuestion[];
};

type ReviewModule = {
  code: string;
  title: string;
  estimatedHours: number;
  status: "draft";
  publicationAllowed: false;
  coverPath: string;
  lessons: ReviewLesson[];
};

type AnswerState = {
  selected: number;
  checked: boolean;
};

const storageKey = "apostolic-module-01-private-review";

export function ModuleReviewPlayer() {
  const [module, setModule] = useState<ReviewModule | null>(null);
  const [activeLesson, setActiveLesson] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [unavailable, setUnavailable] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const response = await fetch("/api/review/module-01", {
        cache: "no-store"
      }).catch(() => null);

      if (!active) return;
      if (!response?.ok) {
        setUnavailable(true);
        return;
      }

      const data = (await response.json()) as ReviewModule;
      setModule(data);

      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as {
            activeLesson?: number;
            answers?: Record<string, AnswerState>;
          };
          setActiveLesson(
            Math.min(
              data.lessons.length - 1,
              Math.max(0, parsed.activeLesson ?? 0)
            )
          );
          setAnswers(parsed.answers ?? {});
        } catch {
          window.localStorage.removeItem(storageKey);
        }
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!module) return;
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({ activeLesson, answers })
    );
  }, [activeLesson, answers, module]);

  if (unavailable || !module) return null;

  const lesson = module.lessons[activeLesson] ?? module.lessons[0]!;
  const answered = lesson.quiz.filter(
    (question) => answers[question.id]?.checked
  ).length;

  const selectLesson = (index: number) => {
    setActiveLesson(index);
    window.requestAnimationFrame(() => headingRef.current?.focus());
  };

  return (
    <section
      className="module-review"
      aria-labelledby="module-review-title"
    >
      <div
        className="module-review-cover"
        style={{ backgroundImage: `url("${module.coverPath}")` }}
      >
        <div>
          <span className="badge">Prévia privada</span>
          <p>Módulo 1 · {module.estimatedHours} horas planejadas</p>
          <h2 id="module-review-title">{module.title}</h2>
          <p>
            Oito aulas e quizzes disponíveis somente para avaliação local.
          </p>
        </div>
      </div>

      <div className="module-review-warning" role="note">
        <strong>Rascunho — não publicado</strong>
        <span>
          Esta prévia não autoriza certificado, venda, divulgação ou acesso de
          estudantes. A avaliação humana permanece obrigatória.
        </span>
      </div>

      <div className="module-review-layout">
        <aside aria-label="Aulas do módulo em revisão">
          <ol className="module-review-lessons">
            {module.lessons.map((item, index) => (
              <li key={item.slug}>
                <button
                  type="button"
                  className={index === activeLesson ? "is-active" : ""}
                  aria-current={index === activeLesson ? "step" : undefined}
                  onClick={() => selectLesson(index)}
                >
                  <span>{item.number}</span>
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.estimatedMinutes} minutos</small>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </aside>

        <article className="module-review-stage">
          <p className="eyebrow">
            Aula {lesson.number} de {module.lessons.length}
          </p>
          <h3 ref={headingRef} tabIndex={-1}>
            {lesson.title}
          </h3>
          <p className="lead">{lesson.summary}</p>

          <details open>
            <summary>Conteúdo completo da aula</summary>
            <div className="module-review-copy">{lesson.body}</div>
          </details>

          <section
            className="module-review-quiz"
            aria-labelledby={`review-quiz-${lesson.number}`}
          >
            <div className="section-heading">
              <div>
                <p className="eyebrow">Avaliação interna</p>
                <h4 id={`review-quiz-${lesson.number}`}>
                  Quiz da Aula {lesson.number}
                </h4>
              </div>
              <span>
                {answered}/{lesson.quiz.length} verificadas
              </span>
            </div>

            {lesson.quiz.map((question, questionIndex) => {
              const answer = answers[question.id];
              const result =
                answer?.checked &&
                answer.selected === question.correctIndex;

              return (
                <fieldset key={question.id}>
                  <legend>
                    {questionIndex + 1}. {question.prompt}
                  </legend>
                  {question.options.map((option, optionIndex) => (
                    <label key={option}>
                      <input
                        type="radio"
                        name={question.id}
                        value={optionIndex}
                        checked={answer?.selected === optionIndex}
                        onChange={() =>
                          setAnswers((current) => ({
                            ...current,
                            [question.id]: {
                              selected: optionIndex,
                              checked: false
                            }
                          }))
                        }
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                  <button
                    className="button button-secondary"
                    type="button"
                    disabled={answer?.selected === undefined}
                    onClick={() =>
                      setAnswers((current) => ({
                        ...current,
                        [question.id]: {
                          selected: current[question.id]!.selected,
                          checked: true
                        }
                      }))
                    }
                  >
                    Verificar resposta
                  </button>
                  {answer?.checked && (
                    <div
                      className={result ? "quiz-result is-correct" : "quiz-result"}
                      role="status"
                      tabIndex={-1}
                    >
                      <strong>
                        {result ? "Resposta correta" : "Revise este ponto"}
                      </strong>
                      <p>{question.explanation}</p>
                    </div>
                  )}
                </fieldset>
              );
            })}
          </section>

          <div className="module-review-navigation">
            <button
              className="button button-secondary"
              type="button"
              disabled={activeLesson === 0}
              onClick={() => selectLesson(activeLesson - 1)}
            >
              Aula anterior
            </button>
            <button
              className="button button-primary"
              type="button"
              disabled={activeLesson === module.lessons.length - 1}
              onClick={() => selectLesson(activeLesson + 1)}
            >
              Próxima aula
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}
