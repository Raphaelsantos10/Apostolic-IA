"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "../lib/supabase/client";

type BibleVersion = {
  id: string;
  code: string;
  name: string;
  edition: string;
  is_demo: boolean;
  bible_licenses: { attribution: string; allows_offline: boolean; allows_audio: boolean } | null;
};
type BibleBook = {
  id: string;
  name: string;
  abbreviation: string;
  chapter_count: number;
  canonical_order: number;
};
type BibleVerse = { id: number; chapter: number; verse: number; text: string };
type SearchResult = {
  verse_id: number;
  book_name: string;
  abbreviation: string;
  chapter: number;
  verse: number;
  verse_text: string;
};
type PlanDay = { id: string; day_number: number; title: string; reference_label: string };
type ReadingPlan = {
  id: string;
  title: string;
  description: string;
  duration_days: number;
  reading_plan_days: PlanDay[];
};

export function BiblePlatform() {
  const [versions, setVersions] = useState<BibleVersion[]>([]);
  const [versionId, setVersionId] = useState("");
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [bookId, setBookId] = useState("");
  const [chapter, setChapter] = useState(1);
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [plans, setPlans] = useState<ReadingPlan[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [activePlanIds, setActivePlanIds] = useState<string[]>([]);
  const [completedDayIds, setCompletedDayIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const supabase = createClient();
      const [versionResponse, planResponse, authResponse] = await Promise.all([
        supabase.from("bible_versions")
          .select("id,code,name,edition,is_demo,bible_licenses(attribution,allows_offline,allows_audio)")
          .order("name"),
        supabase.from("reading_plans")
          .select("id,title,description,duration_days,reading_plan_days(id,day_number,title,reference_label)")
          .order("title"),
        supabase.auth.getUser()
      ]);
      if (!active) return;
      const loadedVersions = (versionResponse.data ?? []) as unknown as BibleVersion[];
      setVersions(loadedVersions);
      setVersionId(loadedVersions[0]?.id ?? "");
      setPlans((planResponse.data ?? []) as ReadingPlan[]);
      const user = authResponse.data.user;
      setUserId(user?.id ?? null);
      if (user) {
        const [activeResponse, progressResponse] = await Promise.all([
          supabase.from("user_reading_plans").select("plan_id"),
          supabase.from("reading_progress").select("plan_day_id")
        ]);
        if (!active) return;
        setActivePlanIds((activeResponse.data ?? []).map((row) => row.plan_id as string));
        setCompletedDayIds((progressResponse.data ?? []).map((row) => row.plan_day_id as string));
      }
      setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!versionId) return;
    let active = true;
    const supabase = createClient();
    void supabase.from("bible_books")
      .select("id,name,abbreviation,chapter_count,canonical_order")
      .eq("version_id", versionId)
      .order("canonical_order")
      .then(({ data }) => {
        if (!active) return;
        const loadedBooks = (data ?? []) as BibleBook[];
        setBooks(loadedBooks);
        setBookId(loadedBooks[0]?.id ?? "");
        setChapter(1);
      });
    return () => { active = false; };
  }, [versionId]);

  useEffect(() => {
    if (!bookId) return;
    let active = true;
    const supabase = createClient();
    void supabase.from("bible_verses").select("id,chapter,verse,text")
      .eq("book_id", bookId).eq("chapter", chapter).order("verse")
      .then(({ data }) => {
        if (active) setVerses((data ?? []) as BibleVerse[]);
      });
    return () => { active = false; };
  }, [bookId, chapter]);

  const selectedVersion = versions.find((version) => version.id === versionId);
  const selectedBook = books.find((book) => book.id === bookId);
  const chapterOptions = useMemo(
    () => Array.from({ length: selectedBook?.chapter_count ?? 1 }, (_, index) => index + 1),
    [selectedBook]
  );

  const search = async (event: FormEvent) => {
    event.preventDefault();
    if (query.trim().length < 2 || !versionId) return;
    const supabase = createClient();
    const { data, error } = await supabase.rpc("search_bible", {
      p_version_id: versionId, p_query: query.trim(), p_limit: 20
    });
    setResults(error ? [] : (data ?? []) as SearchResult[]);
    setMessage(error ? "Não foi possível pesquisar." : `${data?.length ?? 0} resultado(s).`);
  };

  const startPlan = async (planId: string) => {
    if (!userId) return;
    const supabase = createClient();
    const { error } = await supabase.from("user_reading_plans").upsert({
      user_id: userId, plan_id: planId, target_minutes: 10
    });
    if (!error) {
      setActivePlanIds((current) => current.includes(planId) ? current : [...current, planId]);
      setMessage("Plano iniciado com meta de 10 minutos por dia.");
    }
  };

  const toggleDay = async (dayId: string) => {
    if (!userId) return;
    const supabase = createClient();
    const completed = completedDayIds.includes(dayId);
    const response = completed
      ? await supabase.from("reading_progress").delete()
        .eq("user_id", userId).eq("plan_day_id", dayId)
      : await supabase.from("reading_progress").insert({
          user_id: userId, plan_day_id: dayId
        });
    if (!response.error) {
      setCompletedDayIds((current) =>
        completed ? current.filter((id) => id !== dayId) : [...current, dayId]
      );
      setMessage(completed ? "Dia reaberto." : "Leitura concluída.");
    }
  };

  if (loading) return <p className="catalog-status" role="status">A carregar plataforma bíblica…</p>;

  return (
    <section aria-labelledby="bible-title">
      <p className="eyebrow">Leitura licenciada e responsável</p>
      <h1 id="bible-title">Bíblia</h1>
      <p className="lead">
        Leia, pesquise e acompanhe planos. Cada versão só aparece quando a licença
        registrada autoriza o uso.
      </p>

      {selectedVersion?.is_demo && (
        <div className="license-notice" role="note">
          <strong>Conteúdo demonstrativo</strong>
          <span>{selectedVersion.bible_licenses?.attribution}</span>
        </div>
      )}

      <div className="bible-layout">
        <article className="bible-reader" aria-labelledby="reader-title">
          <div className="bible-controls">
            <label>Versão
              <select value={versionId} onChange={(event) => setVersionId(event.target.value)}>
                {versions.map((version) => (
                  <option key={version.id} value={version.id}>{version.code} — {version.name}</option>
                ))}
              </select>
            </label>
            <label>Livro
              <select value={bookId} onChange={(event) => { setBookId(event.target.value); setChapter(1); }}>
                {books.map((book) => <option key={book.id} value={book.id}>{book.name}</option>)}
              </select>
            </label>
            <label>Capítulo
              <select value={chapter} onChange={(event) => setChapter(Number(event.target.value))}>
                {chapterOptions.map((value) => <option key={value}>{value}</option>)}
              </select>
            </label>
          </div>
          <h2 id="reader-title">{selectedBook?.name ?? "Sem conteúdo"} {bookId ? chapter : ""}</h2>
          {verses.length === 0 ? <p>Nenhum texto autorizado disponível.</p> : (
            <div className="verse-list">
              {verses.map((item) => (
                <p key={item.id}><sup>{item.verse}</sup> {item.text}</p>
              ))}
            </div>
          )}
          {selectedVersion && (
            <small className="edition-note">
              {selectedVersion.edition} · Áudio {selectedVersion.bible_licenses?.allows_audio ? "autorizado" : "indisponível"} ·
              Offline {selectedVersion.bible_licenses?.allows_offline ? "autorizado" : "indisponível"}
            </small>
          )}
        </article>

        <aside className="bible-search" aria-labelledby="search-title">
          <h2 id="search-title">Pesquisar</h2>
          <form onSubmit={search}>
            <label htmlFor="bible-query">Palavra ou expressão</label>
            <div>
              <input id="bible-query" value={query} minLength={2}
                onChange={(event) => setQuery(event.target.value)} />
              <button className="button button-primary" type="submit">Pesquisar</button>
            </div>
          </form>
          {results.length > 0 && (
            <ol className="search-results">
              {results.map((result) => (
                <li key={result.verse_id}>
                  <strong>{result.abbreviation} {result.chapter}:{result.verse}</strong>
                  <span>{result.verse_text}</span>
                </li>
              ))}
            </ol>
          )}
        </aside>
      </div>

      <section className="reading-plans" aria-labelledby="plans-title">
        <p className="eyebrow">Rotina configurável</p>
        <h2 id="plans-title">Planos de leitura</h2>
        <div className="plan-grid">
          {plans.map((plan) => {
            const active = activePlanIds.includes(plan.id);
            const days = [...plan.reading_plan_days].sort((a, b) => a.day_number - b.day_number);
            return (
              <article key={plan.id}>
                <span className="badge">{plan.duration_days} dias</span>
                <h3>{plan.title}</h3>
                <p>{plan.description}</p>
                {!userId ? <a href="/entrar">Entre para iniciar</a> : !active ? (
                  <button className="button button-secondary" type="button" onClick={() => startPlan(plan.id)}>
                    Iniciar plano
                  </button>
                ) : (
                  <ol>
                    {days.map((day) => (
                      <li key={day.id}>
                        <label>
                          <input type="checkbox" checked={completedDayIds.includes(day.id)}
                            onChange={() => toggleDay(day.id)} />
                          <span><strong>Dia {day.day_number}: {day.title}</strong>{day.reference_label}</span>
                        </label>
                      </li>
                    ))}
                  </ol>
                )}
              </article>
            );
          })}
        </div>
      </section>
      {message && <p className="learning-message" role="status">{message}</p>}
    </section>
  );
}
