"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { clampSpeechRate } from "../lib/voice-utils.mjs";

type RecognitionResult = {
  readonly isFinal: boolean;
  readonly 0: { readonly transcript: string };
};

type RecognitionEvent = Event & {
  readonly results: ArrayLike<RecognitionResult>;
};

type RecognitionErrorEvent = Event & {
  readonly error: string;
};

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onresult: ((event: RecognitionEvent) => void) | null;
  start(): void;
  stop(): void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export type VoicePreferences = {
  consent: boolean;
  rate: number;
  voiceURI: string;
};

const DEFAULT_PREFERENCES: VoicePreferences = {
  consent: false,
  rate: 1,
  voiceURI: ""
};

const STORAGE_KEY = "apostolic-voice-preferences";

function readPreferences(): VoicePreferences {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
    return {
      consent: stored.consent === true,
      rate: typeof stored.rate === "number" ? clampSpeechRate(stored.rate) : 1,
      voiceURI: typeof stored.voiceURI === "string" ? stored.voiceURI : ""
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function useVoicePreferences() {
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setPreferences(readPreferences());
    setReady(true);
  }, []);

  const update = useCallback((next: Partial<VoicePreferences>) => {
    setPreferences((current) => {
      const updated = { ...current, ...next };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { preferences, ready, update };
}

export function VoicePrivacySettings() {
  const { preferences, ready, update } = useVoicePreferences();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const synthesisSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => {
    if (!synthesisSupported) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, [synthesisSupported]);

  if (!ready) return null;

  return (
    <section className="voice-settings" aria-labelledby="voice-settings-title">
      <div>
        <p className="eyebrow">Privacidade por padrão</p>
        <h2 id="voice-settings-title">Voz e leitura falada</h2>
        <p>
          O microfone só é iniciado após o seu comando. O áudio não é guardado
          pela aplicação; reveja sempre a transcrição antes de a enviar.
        </p>
      </div>
      <label className="checkbox-field">
        <input
          type="checkbox"
          checked={preferences.consent}
          onChange={(event) => update({ consent: event.target.checked })}
        />
        <span>Autorizo o uso do microfone neste dispositivo</span>
      </label>
      <label>
        <span>Velocidade da leitura: {preferences.rate.toFixed(1)}×</span>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={preferences.rate}
          onChange={(event) => update({ rate: Number(event.target.value) })}
        />
      </label>
      <label>
        <span>Voz do dispositivo</span>
        <select
          value={preferences.voiceURI}
          onChange={(event) => update({ voiceURI: event.target.value })}
          disabled={!synthesisSupported}
        >
          <option value="">Padrão do sistema</option>
          {voices.map((voice) => (
            <option value={voice.voiceURI} key={voice.voiceURI}>
              {voice.name} ({voice.lang})
            </option>
          ))}
        </select>
      </label>
      {!synthesisSupported && (
        <p role="status">Este navegador não oferece leitura falada. Todo o conteúdo permanece disponível em texto.</p>
      )}
    </section>
  );
}

export function VoiceInput({
  onTranscript,
  label = "Ditar pergunta"
}: Readonly<{
  onTranscript: (transcript: string) => void;
  label?: string;
}>) {
  const { preferences, ready } = useVoicePreferences();
  const recognition = useRef<SpeechRecognitionLike | null>(null);
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState("");
  const Recognition = typeof window === "undefined"
    ? undefined
    : window.SpeechRecognition ?? window.webkitSpeechRecognition;

  const supported = Boolean(Recognition);

  const stop = useCallback(() => {
    recognition.current?.stop();
    recognition.current = null;
    setListening(false);
  }, []);

  useEffect(() => () => recognition.current?.stop(), []);

  const start = () => {
    if (!Recognition || !preferences.consent) return;
    const instance = new Recognition();
    recognition.current = instance;
    instance.lang = document.documentElement.lang || "pt-PT";
    instance.continuous = false;
    instance.interimResults = true;
    instance.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join(" ")
        .trim();
      onTranscript(transcript);
      setStatus("Transcrição atualizada. Reveja o texto antes de enviar.");
    };
    instance.onerror = (event) => {
      setStatus(event.error === "not-allowed"
        ? "Permissão do microfone recusada pelo navegador."
        : "Não foi possível reconhecer a fala. Pode continuar a escrever.");
      setListening(false);
    };
    instance.onend = () => setListening(false);
    instance.start();
    setListening(true);
    setStatus("A ouvir… Fale agora.");
  };

  if (!ready) return null;

  return (
    <div className="voice-input">
      {!supported ? (
        <p role="status">Ditado indisponível neste navegador. Use o campo de texto.</p>
      ) : (
        <button
          className="button button-secondary"
          type="button"
          onClick={listening ? stop : start}
          disabled={!preferences.consent}
          aria-pressed={listening}
          title={!preferences.consent ? "Ative o consentimento nas preferências de voz" : undefined}
        >
          {listening ? "Parar gravação" : `🎙 ${label}`}
        </button>
      )}
      {!preferences.consent && supported && (
        <p>Ative primeiro o consentimento em “Voz e leitura falada”.</p>
      )}
      {status && <p className="voice-status" role="status" aria-live="polite">{status}</p>}
    </div>
  );
}

export function SpeechPlayer({
  text,
  label = "Ouvir resposta"
}: Readonly<{ text: string; label?: string }>) {
  const { preferences, ready } = useVoicePreferences();
  const [state, setState] = useState<"idle" | "playing" | "paused">("idle");
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;

  const utterance = useMemo(() => {
    if (!supported || !ready) return null;
    const value = new SpeechSynthesisUtterance(text);
    value.lang = document.documentElement.lang || "pt-PT";
    value.rate = preferences.rate;
    const voice = window.speechSynthesis.getVoices()
      .find((item) => item.voiceURI === preferences.voiceURI);
    if (voice) value.voice = voice;
    value.onend = () => setState("idle");
    value.onerror = () => setState("idle");
    return value;
  }, [preferences.rate, preferences.voiceURI, ready, supported, text]);

  useEffect(() => () => {
    if (supported) window.speechSynthesis.cancel();
  }, [supported]);

  if (!ready || !supported) {
    return <p className="voice-fallback">Leitura falada indisponível. A resposta completa está disponível em texto.</p>;
  }

  const play = () => {
    window.speechSynthesis.cancel();
    if (utterance) {
      window.speechSynthesis.speak(utterance);
      setState("playing");
    }
  };

  const pauseOrResume = () => {
    if (state === "playing") {
      window.speechSynthesis.pause();
      setState("paused");
    } else {
      window.speechSynthesis.resume();
      setState("playing");
    }
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setState("idle");
  };

  return (
    <div className="speech-player" role="group" aria-label="Controles de leitura falada">
      <button className="button button-secondary" type="button" onClick={play}>{`🔊 ${label}`}</button>
      <button className="button button-secondary" type="button" onClick={pauseOrResume} disabled={state === "idle"}>
        {state === "paused" ? "Continuar" : "Pausar"}
      </button>
      <button className="button button-secondary" type="button" onClick={stop} disabled={state === "idle"}>
        Parar
      </button>
      <span className="voice-status" aria-live="polite">
        {state === "playing" ? "Leitura em curso" : state === "paused" ? "Leitura pausada" : ""}
      </span>
    </div>
  );
}
