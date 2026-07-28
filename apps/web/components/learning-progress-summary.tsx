"use client";

import { useEffect, useState } from "react";
import {
  summarizeLearningProgress,
  type LearningProgressRow
} from "../lib/course-progress.mjs";
import { createClient } from "../lib/supabase/client";

type Summary = {
  completedLessons: number;
  totalLessons: number;
  overallProgress: number;
  quizAttempts: number;
  pendingReviews: number;
};

const emptySummary: Summary = {
  completedLessons: 0,
  totalLessons: 0,
  overallProgress: 0,
  quizAttempts: 0,
  pendingReviews: 0
};

export function LearningProgressSummary() {
  const [summary, setSummary] = useState<Summary>(emptySummary);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;
    const load = async () => {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        if (active) setState("error");
        return;
      }

      const [lessons, progress, attempts, reviews] = await Promise.all([
        supabase.from("lessons").select("id", { count: "exact", head: true }),
        supabase.from("lesson_progress").select("lesson_id,status,percent"),
        supabase.from("quiz_attempts").select("id", { count: "exact", head: true }),
        supabase.from("review_items").select("question_id", { count: "exact", head: true })
      ]);
      const error =
        lessons.error ?? progress.error ?? attempts.error ?? reviews.error;
      if (!active) return;
      if (error) {
        setState("error");
        return;
      }

      const totalLessons = lessons.count ?? 0;
      const calculated = summarizeLearningProgress(
        totalLessons,
        (progress.data ?? []) as LearningProgressRow[]
      );
      setSummary({
        ...calculated,
        totalLessons,
        quizAttempts: attempts.count ?? 0,
        pendingReviews: reviews.count ?? 0
      });
      setState("ready");
    };

    void load();
    return () => {
      active = false;
    };
  }, []);

  if (state === "loading") {
    return <p className="catalog-status" role="status">A carregar progresso…</p>;
  }
  if (state === "error") {
    return (
      <div className="notice" role="status">
        <h2>Progresso indisponível</h2>
        <p>Não foi possível sincronizar as métricas privadas neste momento.</p>
      </div>
    );
  }

  return (
    <>
      <div className="metric-grid" aria-label="Resumo real da aprendizagem">
        <article>
          <strong>{summary.completedLessons}</strong>
          <span>de {summary.totalLessons} aulas concluídas</span>
        </article>
        <article>
          <strong>{summary.quizAttempts}</strong>
          <span>respostas de quiz registradas</span>
        </article>
        <article>
          <strong>{summary.pendingReviews}</strong>
          <span>itens programados para revisão</span>
        </article>
      </div>
      <div className="course-progress-summary">
        <div>
          <strong>Progresso geral</strong>
          <span>{summary.overallProgress}%</span>
        </div>
        <progress
          max="100"
          value={summary.overallProgress}
          aria-label={`${summary.overallProgress}% de progresso geral`}
        />
      </div>
    </>
  );
}
