"use client";

import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase/client";

type Verse = { id: number; chapter: number; verse: number; text: string };
type ContextNote = { id: string; title: string; body: string; source_label: string };
type TimelineEvent = {
  id: string; title: string; description: string; period_label: string;
  sort_year: number; reference_label: string;
};
type MapLocation = {
  id: string; name: string; description: string; latitude: number;
  longitude: number; reference_label: string;
};
type Highlight = { verse_id: number; color: "yellow" | "green" | "blue" | "rose" };

export function BibleExperience({
  versionId, bookId, bookName, chapter, verses, userId, allowsAudio, allowsOffline
}: Readonly<{
  versionId: string;
  bookId: string;
  bookName: string;
  chapter: number;
  verses: Verse[];
  userId: string | null;
  allowsAudio: boolean;
  allowsOffline: boolean;
}>) {
  const [context, setContext] = useState<ContextNote[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const [offlineSaved, setOfflineSaved] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!versionId || !bookId) return;
    let active = true;
    const supabase = createClient();
    const requests = [
      supabase.from("bible_context_notes").select("id,title,body,source_label")
        .eq("book_id", bookId).or(`chapter.eq.${chapter},chapter.is.null`).order("title"),
      supabase.from("bible_timeline_events")
        .select("id,title,description,period_label,sort_year,reference_label")
        .eq("version_id", versionId).order("sort_year"),
      supabase.from("bible_map_locations")
        .select("id,name,description,latitude,longitude,reference_label")
        .eq("version_id", versionId).order("name")
    ];
    void Promise.all(requests).then(([contextResponse, timelineResponse, locationResponse]) => {
      if (!active) return;
      setContext((contextResponse?.data ?? []) as ContextNote[]);
      setTimeline((timelineResponse?.data ?? []) as TimelineEvent[]);
      setLocations((locationResponse?.data ?? []) as unknown as MapLocation[]);
    });
    return () => { active = false; };
  }, [versionId, bookId, chapter]);

  useEffect(() => {
    if (!userId || verses.length === 0) {
      setHighlights([]);
      return;
    }
    let active = true;
    const supabase = createClient();
    void supabase.from("verse_highlights").select("verse_id,color")
      .in("verse_id", verses.map((verse) => verse.id))
      .then(({ data }) => {
        if (active) setHighlights((data ?? []) as Highlight[]);
      });
    return () => { active = false; };
  }, [userId, verses]);

  useEffect(() => {
    if (!allowsOffline || !versionId || !bookId) {
      setOfflineSaved(false);
      return;
    }
    setOfflineSaved(Boolean(window.localStorage.getItem(
      `apostolic-bible:${versionId}:${bookId}:${chapter}`
    )));
  }, [allowsOffline, versionId, bookId, chapter]);

  const listen = () => {
    if (!allowsAudio || !("speechSynthesis" in window)) {
      setMessage("Áudio indisponível neste dispositivo ou licença.");
      return;
    }
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(
      `${bookName}, capítulo ${chapter}. ${verses.map((item) => `${item.verse}. ${item.text}`).join(" ")}`
    );
    utterance.lang = "pt-PT";
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  const saveOffline = () => {
    if (!allowsOffline) {
      setMessage("A licença não permite guardar este conteúdo offline.");
      return;
    }
    const key = `apostolic-bible:${versionId}:${bookId}:${chapter}`;
    if (offlineSaved) {
      window.localStorage.removeItem(key);
      setOfflineSaved(false);
      setMessage("Capítulo removido deste dispositivo.");
    } else {
      window.localStorage.setItem(key, JSON.stringify({
        versionId, bookId, bookName, chapter, verses, savedAt: new Date().toISOString()
      }));
      setOfflineSaved(true);
      setMessage("Capítulo guardado neste dispositivo.");
    }
  };

  const toggleHighlight = async (verseId: number) => {
    if (!userId) {
      setMessage("Entre na conta para guardar destaques privados.");
      return;
    }
    const supabase = createClient();
    const existing = highlights.find((item) => item.verse_id === verseId);
    const response = existing
      ? await supabase.from("verse_highlights").delete()
        .eq("user_id", userId).eq("verse_id", verseId)
      : await supabase.from("verse_highlights").insert({
          user_id: userId, verse_id: verseId, color: "yellow"
        });
    if (!response.error) {
      setHighlights((current) => existing
        ? current.filter((item) => item.verse_id !== verseId)
        : [...current, { verse_id: verseId, color: "yellow" }]
      );
      setMessage(existing ? "Destaque removido." : "Destaque privado guardado.");
    }
  };

  return (
    <section className="bible-experience" aria-labelledby="experience-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Experiência bíblica</p>
          <h2 id="experience-title">Ouvir, guardar e explorar</h2>
        </div>
        <div className="experience-actions">
          <button className="button button-secondary" type="button" onClick={listen}
            disabled={!allowsAudio || verses.length === 0}>
            {speaking ? "Parar áudio" : "Ouvir capítulo"}
          </button>
          <button className="button button-secondary" type="button" onClick={saveOffline}
            disabled={!allowsOffline || verses.length === 0}>
            {offlineSaved ? "Remover offline" : "Guardar offline"}
          </button>
        </div>
      </div>

      <div className="highlight-panel">
        <h3>Destaques privados</h3>
        <div>
          {verses.map((item) => {
            const selected = highlights.some((highlight) => highlight.verse_id === item.id);
            return (
              <button className={selected ? "verse-chip is-highlighted" : "verse-chip"}
                type="button" key={item.id} onClick={() => toggleHighlight(item.id)}
                aria-pressed={selected}>
                {selected ? "★" : "☆"} {bookName} {chapter}:{item.verse}
              </button>
            );
          })}
        </div>
      </div>

      <div className="exploration-grid">
        <article>
          <h3>Contexto</h3>
          {context.length === 0 ? <p>Sem contexto editorial publicado.</p> : context.map((item) => (
            <div className="context-note" key={item.id}>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
              <small>Fonte: {item.source_label}</small>
            </div>
          ))}
        </article>

        <article>
          <h3>Linha do tempo</h3>
          <ol className="timeline-list">
            {timeline.map((item) => (
              <li key={item.id}>
                <span>{item.period_label}</span>
                <strong>{item.title}</strong>
                <p>{item.description}</p>
                <small>{item.reference_label}</small>
              </li>
            ))}
          </ol>
        </article>

        <article>
          <h3>Mapa contextual</h3>
          <div className="context-map" role="img"
            aria-label="Mapa esquemático com locais editoriais demonstrativos">
            {locations.map((item, index) => (
              <button type="button" className="map-point" key={item.id}
                style={{ left: `${25 + index * 45}%`, top: `${30 + (index % 2) * 35}%` }}
                title={`${item.name}: ${item.description}`}>
                <span aria-hidden="true">●</span>
                <strong>{item.name}</strong>
              </button>
            ))}
          </div>
          <p className="map-disclaimer">
            Visualização esquemática. Pontos demonstrativos não representam geografia bíblica real.
          </p>
        </article>
      </div>
      {message && <p className="learning-message" role="status">{message}</p>}
    </section>
  );
}
