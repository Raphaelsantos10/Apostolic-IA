"use client";

import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase/client";

type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
};

type QuizResult = {
  is_correct: boolean;
  explanation: string;
  next_review_at: string;
};

export function LessonLearningTools({
  lessonId,
  onProgressChange
}: Readonly<{
  lessonId: string;
  onProgressChange?: (lessonId: string, status: string, percent: number) => void;
}>) {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [operation, setOperation] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [noteId, setNoteId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      const supabase = createClient();
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!active || !user) {
        setLoading(false);
        return;
      }

      setUserId(user.id);
      const [progressResponse, favoriteResponse, noteResponse, quizResponse] =
        await Promise.all([
          supabase.from("lesson_progress").select("status,percent").eq("lesson_id", lessonId).maybeSingle(),
          supabase.from("lesson_favorites").select("lesson_id").eq("lesson_id", lessonId).maybeSingle(),
          supabase.from("lesson_notes").select("id,body").eq("lesson_id", lessonId).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
          supabase.from("quiz_questions").select("id,prompt,options").eq("lesson_id", lessonId).order("position").limit(1).maybeSingle()
        ]);

      if (!active) return;
      setCompleted(progressResponse.data?.status === "completed");
      setFavorite(Boolean(favoriteResponse.data));
      if (noteResponse.data) {
        setNoteId(noteResponse.data.id as string);
        setNote(noteResponse.data.body as string);
      }
      if (quizResponse.data) {
        setQuestion({
          id: quizResponse.data.id as string,
          prompt: quizResponse.data.prompt as string,
          options: quizResponse.data.options as string[]
        });
      }
      setLoading(false);
    };

    void load();
    return () => { active = false; };
  }, [lessonId]);

  if (loading) return <p className="learning-status">A carregar ferramentas…</p>;
  if (!userId) {
    return <p className="learning-status"><a href="/entrar">Entre na sua conta</a> para guardar progresso, notas e respostas.</p>;
  }

  const toggleComplete = async () => {
    const next = !completed;
    const supabase = createClient();
    setOperation("progress");
    setMessage("");
    const { error } = await supabase.from("lesson_progress").upsert({
      user_id: userId,
      lesson_id: lessonId,
      status: next ? "completed" : "in_progress",
      percent: next ? 100 : 50,
      started_at: new Date().toISOString(),
      completed_at: next ? new Date().toISOString() : null
    });
    if (!error) {
      setCompleted(next);
      setMessage(next ? "Aula concluída." : "Aula marcada em andamento.");
      onProgressChange?.(lessonId, next ? "completed" : "in_progress", next ? 100 : 50);
    } else {
      setMessage("Não foi possível guardar o progresso.");
    }
    setOperation(null);
  };

  const toggleFavorite = async () => {
    const supabase = createClient();
    setOperation("favorite");
    setMessage("");
    const response = favorite
      ? await supabase.from("lesson_favorites").delete().eq("user_id", userId).eq("lesson_id", lessonId)
      : await supabase.from("lesson_favorites").insert({ user_id: userId, lesson_id: lessonId });
    if (!response.error) {
      setFavorite(!favorite);
      setMessage(favorite ? "Removida dos favoritos." : "Adicionada aos favoritos.");
    } else {
      setMessage("Não foi possível atualizar o favorito.");
    }
    setOperation(null);
  };

  const saveNote = async () => {
    if (!note.trim()) {
      setMessage("Escreva uma anotação antes de guardar.");
      return;
    }
    const supabase = createClient();
    setOperation("note");
    setMessage("");
    const response = noteId
      ? await supabase.from("lesson_notes").update({ body: note.trim() }).eq("id", noteId)
      : await supabase.from("lesson_notes").insert({
          user_id: userId, lesson_id: lessonId, body: note.trim()
        }).select("id").single();
    if (!response.error) {
      const data = response.data as { id?: string } | null;
      if (data?.id) setNoteId(data.id);
      setMessage("Anotação guardada.");
    } else {
      setMessage("Não foi possível guardar a anotação.");
    }
    setOperation(null);
  };

  const submitQuiz = async () => {
    if (!question || selected === null) return;
    const supabase = createClient();
    setOperation("quiz");
    setMessage("");
    const { data, error } = await supabase.rpc("submit_quiz_answer", {
      p_question_id: question.id,
      p_selected_index: selected
    });
    if (!error && data?.[0]) {
      setResult(data[0] as QuizResult);
      setMessage("Resposta registrada para revisão.");
    } else {
      setMessage("Não foi possível corrigir a resposta.");
    }
    setOperation(null);
  };

  return (
    <section className="learning-tools" aria-label="Ferramentas da aula">
      <div className="learning-actions">
        <button
          className="button button-secondary"
          type="button"
          onClick={toggleComplete}
          disabled={operation !== null}
        >
          {operation === "progress"
            ? "A guardar…"
            : completed
              ? "✓ Concluída"
              : "Marcar como concluída"}
        </button>
        <button
          className="button button-secondary"
          type="button"
          onClick={toggleFavorite}
          disabled={operation !== null}
        >
          {favorite ? "★ Favorita" : "☆ Adicionar aos favoritos"}
        </button>
      </div>

      <label className="learning-note">
        <span>Anotação privada</span>
        <textarea value={note} maxLength={5000} onChange={(event) => setNote(event.target.value)} />
      </label>
      <button
        className="button button-secondary"
        type="button"
        onClick={saveNote}
        disabled={operation !== null}
      >
        {operation === "note" ? "A guardar…" : "Guardar anotação"}
      </button>

      {question && (
        <fieldset className="lesson-quiz">
          <legend>Verifique a aprendizagem</legend>
          <p>{question.prompt}</p>
          {question.options.map((option, index) => (
            <label key={option}>
              <input
                type="radio"
                name={`quiz-${question.id}`}
                checked={selected === index}
                onChange={() => {
                  setSelected(index);
                  setResult(null);
                }}
              />
              <span>{option}</span>
            </label>
          ))}
          <button
            className="button button-primary"
            type="button"
            onClick={submitQuiz}
            disabled={selected === null || operation !== null}
          >
            {operation === "quiz" ? "A corrigir…" : "Corrigir resposta"}
          </button>
          {result && (
            <div className={result.is_correct ? "quiz-result is-correct" : "quiz-result"}>
              <strong>{result.is_correct ? "Resposta correta" : "Revise este ponto"}</strong>
              <p>{result.explanation}</p>
              <p>
                Próxima revisão programada para{" "}
                {new Intl.DateTimeFormat("pt", {
                  dateStyle: "medium"
                }).format(new Date(result.next_review_at))}.
              </p>
            </div>
          )}
        </fieldset>
      )}
      {message && <p className="learning-message" role="status">{message}</p>}
    </section>
  );
}

export function DailyGoalPanel() {
  const [userId, setUserId] = useState<string | null>(null);
  const [minutes, setMinutes] = useState(10);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return;
      setUserId(authData.user.id);
      const { data } = await supabase.from("daily_goals").select("daily_minutes").maybeSingle();
      if (data?.daily_minutes) setMinutes(data.daily_minutes as number);
    };
    void load();
  }, []);

  if (!userId) {
    return <div className="notice"><h2>Meta diária</h2><p><a href="/entrar">Entre na conta</a> para configurar a sua meta.</p></div>;
  }

  const save = async () => {
    const supabase = createClient();
    const { error } = await supabase.from("daily_goals").upsert({
      user_id: userId,
      daily_minutes: minutes,
      active_days: [1, 2, 3, 4, 5, 6, 7],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
    if (!error) setMessage("Meta diária guardada.");
  };

  return (
    <section className="daily-goal" aria-labelledby="daily-goal-title">
      <div>
        <p className="eyebrow">Rotina saudável</p>
        <h2 id="daily-goal-title">Meta diária</h2>
        <p>Escolha quanto tempo deseja estudar. Pode alterar a meta quando quiser.</p>
      </div>
      <label>
        <span>Minutos por dia</span>
        <select value={minutes} onChange={(event) => setMinutes(Number(event.target.value))}>
          {[5, 10, 15, 20, 30].map((value) => <option key={value} value={value}>{value} minutos</option>)}
        </select>
      </label>
      <button className="button button-primary" type="button" onClick={save}>Guardar meta</button>
      {message && <p role="status">{message}</p>}
    </section>
  );
}
