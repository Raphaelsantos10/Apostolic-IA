"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "../lib/supabase/client";
import { BibleExperience } from "./bible-experience";

type BibleVersion = {
  id: string;
  code: string;
  name: string;
  edition: string;
  is_demo: boolean;
  bible_licenses: { attribution: string; allows_offline: boolean; allows_audio: boolean } | null;
  local_file?: string;
};
type BibleBook = {
  id: string;
  name: string;
  abbreviation: string;
  chapter_count: number;
  canonical_order: number;
  source_file?: string;
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

type OpenBibleBook = {
  id: number;
  code: string;
  name: string;
  abbrev: string;
  chapter_count: number;
  file: string;
};
type OpenBibleIndex = { books: OpenBibleBook[] };
type OpenBibleFile = {
  id: number;
  code: string;
  name: string;
  abbrev: string;
  chapters: Array<{ number: number; verses: Array<{ number: number; text: string }> }>;
};
type DictionaryResult = { word: string; definitions: string[]; error?: string };
type SavedReading = { versionId: string; bookId: string; chapter: number; bookName: string };
type LocalBibleBook = { abbrev: string | { pt?: string }; name: string; chapters: string[][] };
type LocalBibleManifest = { versions: Array<{ code: string; name: string; file: string }> };

const OPEN_VERSION_ID = "open:ALM1911";
const PENDING_TRANSLATIONS = ["ARA", "ARC", "JFAA", "KJA", "KJF", "NAA", "NTLH", "NVI"];
const OPEN_VERSION: BibleVersion = {
  id: OPEN_VERSION_ID,
  code: "ALM1911",
  name: "Almeida 1911 — completa",
  edition: "66 livros · domínio público",
  is_demo: false,
  bible_licenses: {
    attribution: "Almeida 1911. Dados estruturados por damarals/biblias (MIT).",
    allows_offline: true,
    allows_audio: true
  }
};

function normalizeBibleText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt");
}

export function BiblePlatform() {
  const workspaceRef = useRef<HTMLElement>(null);
  const [readerMode, setReaderMode] = useState<"book" | "study">("book");
  const [turningPage, setTurningPage] = useState<"previous" | "next" | null>(null);
  const [selectedVerseId, setSelectedVerseId] = useState<number | null>(null);
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
  const [searching, setSearching] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [studyTab, setStudyTab] = useState<"guide" | "notes" | "outline">("guide");
  const [note, setNote] = useState("");
  const [outlineTitle, setOutlineTitle] = useState("Novo esboço");
  const [outlinePoints, setOutlinePoints] = useState<string[]>([]);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [askingAi, setAskingAi] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchCollapsed, setSearchCollapsed] = useState(false);
  const [lumiOpen, setLumiOpen] = useState(false);
  const [localHighlights, setLocalHighlights] = useState<number[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [favoriteVerseIds, setFavoriteVerseIds] = useState<number[]>([]);
  const [dictionary, setDictionary] = useState<DictionaryResult | null>(null);
  const [dictionaryLoading, setDictionaryLoading] = useState(false);
  const [lastReading, setLastReading] = useState<SavedReading | null>(null);
  const [speakingVerseId, setSpeakingVerseId] = useState<number | null>(null);
  const [dictionaryEnabled, setDictionaryEnabled] = useState(false);
  const [autoExplain, setAutoExplain] = useState(false);

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
      let localVersions: BibleVersion[] = [];
      if (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_LOCAL_BIBLE_TESTING === "enabled") {
        try {
          const manifest = await fetch("/bibles-local/manifest.json").then((response) => response.json() as Promise<LocalBibleManifest>);
          localVersions = manifest.versions.map((version) => ({
            id: `local:${version.code}`, code: version.code, name: `${version.name} · teste local`,
            edition: "Somente desenvolvimento · não publicar", is_demo: false, local_file: version.file,
            bible_licenses: { attribution: "Ficheiro local do utilizador", allows_offline: false, allows_audio: false }
          }));
        } catch { /* O modo local é opcional. */ }
      }
      const loadedVersions = [
        OPEN_VERSION,
        ...localVersions,
        ...((versionResponse.data ?? []) as unknown as BibleVersion[])
          .filter((version) => version.id !== OPEN_VERSION_ID)
      ];
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
    if (versionId === OPEN_VERSION_ID) {
      void fetch("/bibles/ALM1911/index.json")
        .then((response) => response.json() as Promise<OpenBibleIndex>)
        .then((index) => {
          if (!active) return;
          const loadedBooks = index.books.map((book) => ({
            id: `open:${book.code}`,
            name: book.name,
            abbreviation: book.abbrev,
            chapter_count: book.chapter_count,
            canonical_order: book.id,
            source_file: book.file
          }));
          setBooks(loadedBooks);
          setBookId(loadedBooks[0]?.id ?? "");
          setChapter(1);
        });
      return () => { active = false; };
    }
    if (versionId.startsWith("local:")) {
      const version = versions.find((item) => item.id === versionId);
      if (!version?.local_file) return;
      const localFile = version.local_file;
      void fetch(`/bibles-local/${localFile}`).then((response) => response.json() as Promise<LocalBibleBook[]>).then((data) => {
        if (!active) return;
        const loadedBooks = data.map((book, index) => ({ id: `local:${version.code}:${index}`, name: book.name,
          abbreviation: typeof book.abbrev === "string" ? book.abbrev : (book.abbrev.pt ?? book.name.slice(0, 3)),
          chapter_count: book.chapters.length, canonical_order: index + 1, source_file: localFile }));
        setBooks(loadedBooks); setBookId(loadedBooks[0]?.id ?? ""); setChapter(1);
      });
      return () => { active = false; };
    }
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
    if (versionId === OPEN_VERSION_ID) {
      const selected = books.find((book) => book.id === bookId);
      if (!selected?.source_file) return;
      void fetch(`/bibles/ALM1911/${selected.source_file}`)
        .then((response) => response.json() as Promise<OpenBibleFile>)
        .then((book) => {
          if (!active) return;
          const loaded = book.chapters.find((item) => item.number === chapter)?.verses ?? [];
          setVerses(loaded.map((verse) => ({
            id: book.id * 100_000 + chapter * 1_000 + verse.number,
            chapter,
            verse: verse.number,
            text: verse.text
          })));
        });
      return () => { active = false; };
    }
    if (versionId.startsWith("local:")) {
      const version = versions.find((item) => item.id === versionId);
      const bookIndex = Number(bookId.split(":").at(-1));
      if (!version?.local_file || !Number.isFinite(bookIndex)) return;
      void fetch(`/bibles-local/${version.local_file}`).then((response) => response.json() as Promise<LocalBibleBook[]>).then((data) => {
        if (!active) return;
        const chapterVerses = data[bookIndex]?.chapters[chapter - 1] ?? [];
        setVerses(chapterVerses.map((text, index) => ({ id: 800_000_000 + bookIndex * 100_000 + chapter * 1_000 + index + 1, chapter, verse: index + 1, text })));
      });
      return () => { active = false; };
    }
    const supabase = createClient();
    void supabase.from("bible_verses").select("id,chapter,verse,text")
      .eq("book_id", bookId).eq("chapter", chapter).order("verse")
      .then(({ data }) => {
        if (active) setVerses((data ?? []) as BibleVerse[]);
      });
    return () => { active = false; };
  }, [bookId, books, chapter, versionId]);

  const selectedVersion = versions.find((version) => version.id === versionId);
  const selectedBook = books.find((book) => book.id === bookId);
  const chapterOptions = useMemo(
    () => Array.from({ length: selectedBook?.chapter_count ?? 1 }, (_, index) => index + 1),
    [selectedBook]
  );
  const selectedVerse = verses.find((verse) => verse.id === selectedVerseId) ?? null;
  const versePages = useMemo(() => {
    const size = 7;
    return Array.from({ length: Math.max(1, Math.ceil(verses.length / size)) }, (_, index) =>
      verses.slice(index * size, index * size + size)
    );
  }, [verses]);
  const bookPages = [versePages[pageIndex] ?? [], versePages[pageIndex + 1] ?? []];
  const totalSpreads = Math.ceil(versePages.length / 2);

  useEffect(() => {
    const stored = window.localStorage.getItem("apostolic-bible-reader-mode");
    if (stored === "book" || stored === "study") setReaderMode(stored);
    const favorites = JSON.parse(window.localStorage.getItem("apostolic-bible-favorites") ?? "[]") as number[];
    setFavoriteVerseIds(favorites);
    try {
      const reading = JSON.parse(window.localStorage.getItem("apostolic-last-reading") ?? "null") as SavedReading | null;
      setLastReading(reading);
    } catch { /* Preferências antigas inválidas são ignoradas. */ }
  }, []);

  useEffect(() => {
    if (!selectedBook || !versionId) return;
    const reading = { versionId, bookId: selectedBook.id, chapter, bookName: selectedBook.name };
    window.localStorage.setItem("apostolic-last-reading", JSON.stringify(reading));
    setLastReading(reading);
  }, [selectedBook, versionId, chapter]);

  useEffect(() => {
    setSelectedVerseId(null);
    setPageIndex(0);
  }, [bookId, chapter, versionId]);

  useEffect(() => {
    if (!selectedVerse || !selectedBook) { setNote(""); return; }
    setNote(window.localStorage.getItem(
      `apostolic-note:${versionId}:${selectedBook.id}:${chapter}:${selectedVerse.verse}`
    ) ?? "");
  }, [selectedVerse, selectedBook, versionId, chapter]);

  useEffect(() => {
    const saved = window.localStorage.getItem("apostolic-sermon-outline");
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as { title?: string; points?: string[] };
      setOutlineTitle(parsed.title ?? "Novo esboço");
      setOutlinePoints(parsed.points ?? []);
    } catch { /* Conteúdo local antigo inválido é ignorado. */ }
  }, []);

  const selectReaderMode = (mode: "book" | "study") => {
    setReaderMode(mode);
    window.localStorage.setItem("apostolic-bible-reader-mode", mode);
  };

  const turnPage = (direction: -1 | 1) => {
    setTurningPage(direction === 1 ? "next" : "previous");
    window.setTimeout(() => {
      const nextSpread = pageIndex + direction * 2;
      if (nextSpread >= 0 && nextSpread < versePages.length) setPageIndex(nextSpread);
      else {
        const nextChapter = chapter + direction;
        if (nextChapter >= 1 && nextChapter <= (selectedBook?.chapter_count ?? 1)) {
          setChapter(nextChapter);
          setPageIndex(direction === 1 ? 0 : Math.max(0, Math.ceil(versePages.length / 2) * 2 - 2));
        }
      }
      setTurningPage(null);
    }, 220);
  };

  const saveNote = () => {
    if (!selectedVerse || !selectedBook) return;
    window.localStorage.setItem(
      `apostolic-note:${versionId}:${selectedBook.id}:${chapter}:${selectedVerse.verse}`, note
    );
    setMessage("Anotação guardada neste dispositivo.");
  };

  const addVerseToOutline = () => {
    if (!selectedVerse || !selectedBook) return;
    const point = `${selectedBook.name} ${chapter}:${selectedVerse.verse} — ${selectedVerse.text}`;
    const points = [...outlinePoints, point];
    setOutlinePoints(points);
    window.localStorage.setItem("apostolic-sermon-outline", JSON.stringify({ title: outlineTitle, points }));
    setStudyTab("outline");
  };

  const saveOutline = () => {
    window.localStorage.setItem("apostolic-sermon-outline", JSON.stringify({ title: outlineTitle, points: outlinePoints }));
    setMessage("Esboço guardado neste dispositivo.");
  };

  const askLumi = async (suggestedQuestion?: string, suggestedVerse?: BibleVerse) => {
    const question = suggestedQuestion ?? aiQuestion;
    const verse = suggestedVerse ?? selectedVerse;
    if (!verse || question.trim().length < 5) return;
    setAskingAi(true); setAiAnswer("");
    const response = await fetch("/api/bible-teacher", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: `${selectedBook?.name} ${chapter}:${verse.verse}: ${verse.text}\n\nPergunta: ${question}` })
    });
    const data = await response.json() as { answer?: string; error?: string };
    setAiAnswer(response.ok ? (data.answer ?? "") : response.status === 401
      ? "Entre na sua conta para receber uma explicação fundamentada da Lumi. Na prévia, a IA autenticada permanece protegida."
      : (data.error ?? "Não foi possível consultar a Lumi."));
    setAskingAi(false);
  };

  const selectStudyVerse = (item: BibleVerse) => {
    setSelectedVerseId(item.id);
    setDictionary(null);
    if (autoExplain) {
      setLumiOpen(true); setStudyTab("guide");
      void askLumi("Explique este versículo no contexto imediato do capítulo, sem criar doutrina e cite as fontes aprovadas.", item);
    }
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) await workspaceRef.current?.requestFullscreen();
    else await document.exitFullscreen();
  };

  useEffect(() => {
    const update = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);

  const copySelectedVerse = async () => {
    if (!selectedVerse || !selectedBook) return;
    await navigator.clipboard.writeText(
      `${selectedVerse.text} — ${selectedBook.name} ${chapter}:${selectedVerse.verse}`
    );
    setMessage("Versículo copiado com a referência.");
  };

  const toggleSelectedHighlight = () => {
    if (!selectedVerse) return;
    setLocalHighlights((current) => current.includes(selectedVerse.id)
      ? current.filter((id) => id !== selectedVerse.id)
      : [...current, selectedVerse.id]);
  };

  const toggleFavorite = () => {
    if (!selectedVerse) return;
    const next = favoriteVerseIds.includes(selectedVerse.id)
      ? favoriteVerseIds.filter((id) => id !== selectedVerse.id)
      : [...favoriteVerseIds, selectedVerse.id];
    setFavoriteVerseIds(next);
    window.localStorage.setItem("apostolic-bible-favorites", JSON.stringify(next));
    setMessage(next.includes(selectedVerse.id) ? "Versículo guardado nos favoritos." : "Versículo removido dos favoritos.");
  };

  const openDictionary = async (rawWord: string, verseId: number) => {
    const word = rawWord.replace(/[^\p{L}-]/gu, "");
    if (word.length < 2) return;
    setSelectedVerseId(verseId); setDictionaryLoading(true); setDictionary(null);
    const response = await fetch(`/api/dictionary?word=${encodeURIComponent(word)}`);
    const data = await response.json() as DictionaryResult;
    setDictionary(response.ok ? data : { word, definitions: [], error: data.error ?? "Não foi possível consultar." });
    setDictionaryLoading(false);
  };

  const resumeLastReading = () => {
    if (!lastReading) return;
    setVersionId(lastReading.versionId);
    const matchingBook = books.find((book) => book.id === lastReading.bookId || book.name === lastReading.bookName);
    if (matchingBook) setBookId(matchingBook.id);
    setChapter(lastReading.chapter);
  };

  const search = async (event: FormEvent) => {
    event.preventDefault();
    if (query.trim().length < 2 || !versionId) return;
    if (versionId === OPEN_VERSION_ID) {
      setSearching(true);
      const normalizedQuery = normalizeBibleText(query.trim());
      const reference = normalizedQuery.match(/^(.+?)\s+(\d+)(?::(\d+))?$/);
      if (reference) {
        const bookQuery = reference[1] ?? "";
        const chapterQuery = reference[2] ?? "1";
        const verseQuery = reference[3];
        const matchingBook = books.find((book) => {
          const name = normalizeBibleText(book.name);
          const abbreviation = normalizeBibleText(book.abbreviation);
          return name === bookQuery || name.startsWith(bookQuery) || abbreviation === bookQuery;
        });
        if (matchingBook) {
          setBookId(matchingBook.id);
          setChapter(Math.min(Number(chapterQuery), matchingBook.chapter_count));
          setResults([]);
          setMessage(verseQuery
            ? `Referência encontrada. Selecione o versículo ${verseQuery} no Modo Estudo.`
            : "Referência encontrada.");
          setSearching(false);
          return;
        }
      }
      const index = await fetch("/bibles/ALM1911/index.json")
        .then((response) => response.json() as Promise<OpenBibleIndex>);
      const matches: SearchResult[] = [];
      for (const bookInfo of index.books) {
        if (matches.length >= 20) break;
        const book = await fetch(`/bibles/ALM1911/${bookInfo.file}`)
          .then((response) => response.json() as Promise<OpenBibleFile>);
        for (const item of book.chapters) {
          for (const verse of item.verses) {
            if (normalizeBibleText(verse.text).includes(normalizedQuery)) {
              matches.push({
                verse_id: book.id * 100_000 + item.number * 1_000 + verse.number,
                book_name: book.name,
                abbreviation: book.abbrev,
                chapter: item.number,
                verse: verse.number,
                verse_text: verse.text
              });
              if (matches.length >= 20) break;
            }
          }
          if (matches.length >= 20) break;
        }
      }
      setResults(matches);
      setMessage(`${matches.length} resultado(s) na Bíblia completa.`);
      setSearching(false);
      return;
    }
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
    <section ref={workspaceRef} className="bible-platform" aria-labelledby="bible-title">
      <p className="eyebrow">Leitura licenciada e responsável</p>
      <h1 id="bible-title">Bíblia</h1>
      <p className="lead">
        Leia, pesquise e acompanhe planos. Cada versão só aparece quando a licença
        registrada autoriza o uso.
      </p>
      {lastReading && <button className="resume-reading" type="button" onClick={resumeLastReading}>
        ↻ Continuar em {lastReading.bookName} {lastReading.chapter}
      </button>}

      <div className="bible-mode-picker" aria-label="Modo de leitura">
        <button className={readerMode === "book" ? "is-active" : ""} type="button"
          aria-pressed={readerMode === "book"} onClick={() => selectReaderMode("book")}>
          <span aria-hidden="true">▤</span><strong>Modo Livro</strong><small>Vire as páginas como numa Bíblia física</small>
        </button>
        <button className={readerMode === "study" ? "is-active" : ""} type="button"
          aria-pressed={readerMode === "study"} onClick={() => selectReaderMode("study")}>
          <span aria-hidden="true">✦</span><strong>Modo Estudo</strong><small>Selecione, destaque e explore versículos</small>
        </button>
        <button className="bible-fullscreen-button" type="button" onClick={() => void toggleFullscreen()}>
          <span aria-hidden="true">⛶</span><strong>{isFullscreen ? "Sair da tela cheia" : "Abrir em tela cheia"}</strong><small>Estude sem distrações</small>
        </button>
      </div>

      {selectedVersion?.is_demo && (
        <div className="license-notice" role="note">
          <strong>Conteúdo demonstrativo</strong>
          <span>{selectedVersion.bible_licenses?.attribution}</span>
        </div>
      )}
      {selectedVersion?.id === OPEN_VERSION_ID && (
        <div className="license-notice" role="note">
          <strong>Bíblia completa disponível</strong>
          <span>Almeida 1911 · 66 livros · domínio público · preparada para leitura e pesquisa offline.</span>
        </div>
      )}
      <details className="translation-review">
        <summary>Mais 8 traduções recebidas · aguardando licença</summary>
        <div>{PENDING_TRANSLATIONS.map((code) => <span key={code}>{code}</span>)}</div>
        <p>Os ficheiros foram validados como Bíblias completas, mas permanecem desativados até haver autorização de distribuição de cada editora.</p>
      </details>

      <div className={`bible-layout${searchCollapsed ? " is-search-collapsed" : ""}`}>
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
          {verses.length === 0 ? <p>Nenhum texto autorizado disponível.</p> : readerMode === "book" ? (
            <div className="book-reader-shell">
              <button type="button" className="page-arrow" onClick={() => turnPage(-1)}
                disabled={chapter <= 1 && pageIndex === 0} aria-label="Página anterior">‹</button>
              <div className={`book-spread${turningPage ? ` is-turning-${turningPage}` : ""}`}>
                {bookPages.map((pageVerses, pageIndex) => (
                  <section className="book-page" key={`${chapter}-${pageIndex}`}
                    aria-label={`Página ${pageIndex + 1} do capítulo ${chapter}`}>
                    <small>{selectedBook?.name} · {chapter}</small>
                    <div className="verse-list">
                      {pageVerses.map((item) => <p key={item.id}><sup>{item.verse}</sup> {item.text}</p>)}
                    </div>
                    <span className="book-page-number">{chapter * 2 - 1 + pageIndex}</span>
                  </section>
                ))}
              </div>
              <button type="button" className="page-arrow" onClick={() => turnPage(1)}
                disabled={chapter >= (selectedBook?.chapter_count ?? 1) && pageIndex + 2 >= versePages.length}
                aria-label="Próxima página">›</button>
              <small className="spread-progress">Folha {Math.floor(pageIndex / 2) + 1} de {totalSpreads}</small>
            </div>
          ) : (
            <div className="study-workspace">
              <section className="study-scripture" aria-label="Versículos">
                <div className="study-preferences">
                  <label><input type="checkbox" checked={dictionaryEnabled} onChange={(event) => { setDictionaryEnabled(event.target.checked); setDictionary(null); }} /> Dicionário ao clicar em palavras</label>
                  <label><input type="checkbox" checked={autoExplain} onChange={(event) => setAutoExplain(event.target.checked)} /> Explicação automática com a Lumi</label>
                </div>
                <p className="study-hint">Clique em qualquer parte do versículo para selecioná-lo. Ative o dicionário somente quando quiser consultar palavras.</p>
                <div className="verse-list interactive-verses">
                {verses.map((item) => (
                  <article className={`${selectedVerseId === item.id ? "is-selected" : ""}${speakingVerseId === item.id ? " is-speaking" : ""}`}
                    data-highlighted={localHighlights.includes(item.id) || undefined} key={item.id}
                    onClick={() => selectStudyVerse(item)} tabIndex={0} role="button"
                    onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") selectStudyVerse(item); }}>
                    <button className="verse-number-button" type="button" onClick={(event) => { event.stopPropagation(); selectStudyVerse(item); }} aria-label={`Selecionar versículo ${item.verse}`}>
                      <sup>{item.verse}</sup>
                    </button>
                    <span>{dictionaryEnabled ? item.text.split(/(\s+)/).map((word, index) => /\p{L}/u.test(word) ?
                      <button className="dictionary-word" type="button" key={`${word}-${index}`} onClick={(event) => { event.stopPropagation(); void openDictionary(word, item.id); }} title={`Consultar “${word.replace(/[^\p{L}-]/gu, "")}”`}>{word}</button>
                      : <span key={`${word}-${index}`}>{word}</span>) : item.text}</span>
                  </article>
                ))}
                </div>
              </section>
              {lumiOpen ? <aside className="study-guide" aria-label="Guia de estudo da Lumi">
                <div className="lumi-study-heading">
                  <button className="lumi-character-button" type="button" onClick={() => setLumiOpen(false)} aria-label="Fechar guia da Lumi">
                    <Image src="/characters/lumi/bible-study-guide-v2.png" width={170} height={170}
                      alt="Lumi como guia de estudo bíblico" priority />
                  </button>
                  <div><span>Lumi · guia de estudo</span><strong>{selectedVerse ? `${selectedBook?.name} ${chapter}:${selectedVerse.verse}` : "Escolha um versículo"}</strong></div>
                  <button className="lumi-close" type="button" onClick={() => setLumiOpen(false)} aria-label="Fechar Lumi">×</button>
                </div>
                <div className="study-tabs" role="tablist">
                  {([['guide','Guia'],['notes','Anotações'],['outline','Esboço']] as const).map(([id,label]) => (
                    <button key={id} type="button" role="tab" aria-selected={studyTab === id}
                      className={studyTab === id ? "is-active" : ""} onClick={() => setStudyTab(id)}>{label}</button>
                  ))}
                </div>
                {!selectedVerse ? <div className="lumi-empty"><strong>Vamos estudar juntos?</strong><p>Toque num versículo à esquerda para observar o texto, anotar e perguntar à IA.</p></div>
                : studyTab === "guide" ? <div className="study-guide-content">
                    <h3>Observe antes de interpretar</h3>
                    <ol><li>Que palavras ou ideias se repetem?</li><li>Quem fala, para quem e em que contexto?</li><li>Como este verso se relaciona com o capítulo?</li></ol>
                    <p className="source-guard">A explicação da IA usa somente fontes aprovadas e informa quando não há base suficiente.</p>
                    <label>O que não entendeu?
                      <textarea value={aiQuestion} onChange={(event) => setAiQuestion(event.target.value)}
                        placeholder="Ex.: O que esta expressão significa no contexto?" />
                    </label>
                    <button className="button button-primary" type="button" onClick={() => void askLumi()} disabled={askingAi || aiQuestion.trim().length < 5}>
                      {askingAi ? "Lumi está pesquisando…" : "Perguntar à Lumi IA"}
                    </button>
                    {aiAnswer && <div className="lumi-answer" role="status">{aiAnswer}</div>}
                  </div>
                : studyTab === "notes" ? <div className="study-guide-content">
                    <h3>Minha anotação</h3><textarea className="study-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Registe observações, aplicações e perguntas…" />
                    <button className="button button-primary" type="button" onClick={saveNote}>Guardar anotação</button>
                  </div>
                : <div className="study-guide-content outline-builder">
                    <label>Título<input value={outlineTitle} onChange={(event) => setOutlineTitle(event.target.value)} /></label>
                    <ol>{outlinePoints.map((point, index) => <li key={`${point}-${index}`}><span>{point}</span><button type="button" aria-label={`Remover ponto ${index + 1}`} onClick={() => setOutlinePoints((current) => current.filter((_, itemIndex) => itemIndex !== index))}>×</button></li>)}</ol>
                    <button className="button button-secondary" type="button" onClick={addVerseToOutline}>+ Adicionar versículo</button>
                    <button className="button button-primary" type="button" onClick={saveOutline}>Guardar esboço</button>
                  </div>}
              </aside> : <button className="lumi-reopen" type="button" onClick={() => setLumiOpen(true)}><Image src="/characters/lumi/bible-study-guide-v2.png" width={64} height={64} alt="" />Abrir Lumi</button>}
              {selectedVerse && (
                <div className="verse-toolbox" role="region" aria-label={`Ferramentas do versículo ${selectedVerse.verse}`}>
                  <strong>{selectedBook?.name} {chapter}:{selectedVerse.verse}</strong>
                  <div>
                    <button type="button" onClick={() => void copySelectedVerse()}>Copiar</button>
                    <button type="button" onClick={toggleFavorite}>{favoriteVerseIds.includes(selectedVerse.id) ? "★ Favorito" : "☆ Favoritar"}</button>
                    <button type="button" onClick={toggleSelectedHighlight}>{localHighlights.includes(selectedVerse.id) ? "Remover destaque" : "Destacar"}</button>
                    <button type="button" onClick={() => setCompareOpen((value) => !value)}>Comparar</button>
                    <button type="button" onClick={() => setStudyTab("notes")}>Anotar</button>
                    <button type="button" onClick={addVerseToOutline}>Adicionar ao esboço</button>
                    <button type="button" onClick={() => { setLumiOpen(true); setStudyTab("guide"); }}>Abrir Lumi</button>
                    <button type="button" onClick={() => { setLumiOpen(true); setStudyTab("guide"); void askLumi("Explique este versículo no contexto imediato do capítulo, sem criar doutrina e cite as fontes aprovadas."); }}>Explicar</button>
                  </div>
                </div>
              )}
              {compareOpen && selectedVerse && <div className="verse-comparison" role="region" aria-label="Comparação de traduções">
                <div><strong>{selectedVersion?.code}</strong><p>{selectedVerse.text}</p></div>
                <div><strong>Outras traduções</strong><p>ARA, ARC, JFAA, KJA, KJF, NAA, NTLH e NVI aparecerão aqui depois da autorização editorial.</p></div>
              </div>}
              {(dictionaryLoading || dictionary) && <aside className="dictionary-card" aria-live="polite">
                <button type="button" onClick={() => setDictionary(null)} aria-label="Fechar dicionário">×</button>
                <span>Dicionário</span>
                <h3>{dictionary?.word ?? "Consultando…"}</h3>
                {dictionaryLoading ? <p>A procurar definição…</p> : dictionary?.error ? <p>{dictionary.error}</p> : dictionary?.definitions.length ?
                  <ol>{dictionary.definitions.map((definition, index) => <li key={`${definition}-${index}`}>{definition}</li>)}</ol>
                  : <p>Nenhuma definição encontrada. Pergunte à Lumi sobre o uso desta palavra no versículo.</p>}
              </aside>}
            </div>
          )}
          {selectedVersion && (
            <small className="edition-note">
              {selectedVersion.edition} · Áudio {selectedVersion.bible_licenses?.allows_audio ? "autorizado" : "indisponível"} ·
              Offline {selectedVersion.bible_licenses?.allows_offline ? "autorizado" : "indisponível"}
            </small>
          )}
        </article>

        <aside className={`bible-search${searchCollapsed ? " is-collapsed" : ""}`} aria-labelledby="search-title">
          <button className="search-collapse" type="button" onClick={() => setSearchCollapsed((value) => !value)} aria-expanded={!searchCollapsed} aria-label={searchCollapsed ? "Abrir pesquisa" : "Recolher pesquisa"}>{searchCollapsed ? "⌕" : "→"}</button>
          {!searchCollapsed && <>
          <h2 id="search-title">Pesquisar</h2>
          <form onSubmit={search}>
            <label htmlFor="bible-query">Palavra ou expressão</label>
            <div>
              <input id="bible-query" value={query} minLength={2}
                onChange={(event) => setQuery(event.target.value)} />
              <button className="button button-primary" type="submit" disabled={searching}>
                {searching ? "A pesquisar…" : "Pesquisar"}
              </button>
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
          </>}
        </aside>
      </div>

      {selectedVersion && selectedBook && (
        <BibleExperience
          versionId={selectedVersion.id}
          bookId={selectedBook.id}
          bookName={selectedBook.name}
          chapter={chapter}
          verses={verses}
          userId={userId}
          allowsAudio={Boolean(selectedVersion.bible_licenses?.allows_audio)}
          allowsOffline={Boolean(selectedVersion.bible_licenses?.allows_offline)}
          selectedVerse={selectedVerse}
          onSpeakingVerseChange={setSpeakingVerseId}
        />
      )}

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
