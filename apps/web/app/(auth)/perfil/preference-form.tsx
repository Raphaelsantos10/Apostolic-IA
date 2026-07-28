"use client";

import { useEffect, useState } from "react";
import { updatePreferences } from "../../perfil/actions";

type Theme = "system" | "light" | "dark" | "sepia";

export function PreferenceForm({
  initial,
  embedded = false,
  returnTo
}: Readonly<{
  initial: {
    theme: Theme;
    textScale: number;
    highContrast: boolean;
    reduceMotion: boolean;
    communicationEmail: boolean;
  };
  embedded?: boolean;
  returnTo?: string;
}>) {
  const [theme, setTheme] = useState(initial.theme);
  const [textScale, setTextScale] = useState(initial.textScale);
  const [highContrast, setHighContrast] = useState(initial.highContrast);
  const [reduceMotion, setReduceMotion] = useState(initial.reduceMotion);

  useEffect(() => {
    const resolved =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
        : theme;
    document.documentElement.dataset.theme = resolved;
    document.documentElement.dataset.highContrast = String(highContrast);
    document.documentElement.dataset.reduceMotion = String(reduceMotion);
    document.documentElement.style.fontSize = `${textScale}%`;
    window.localStorage.setItem("apostolic-theme", theme);
  }, [theme, textScale, highContrast, reduceMotion]);

  return (
    <form className={embedded ? "dashboard-profile-form" : "auth-form"} action={updatePreferences}>
      {returnTo && <input name="returnTo" type="hidden" value={returnTo} />}
      <label className={embedded ? "dashboard-field" : "field"}>
        <span>Tema</span>
        <select name="theme" value={theme} onChange={(event) => setTheme(event.target.value as Theme)}>
          <option value="system">Sistema</option>
          <option value="light">Claro</option>
          <option value="dark">Escuro</option>
          <option value="sepia">Sépia</option>
        </select>
      </label>
      <label className={embedded ? "dashboard-field" : "field"}>
        <span>Tamanho do texto: {textScale}%</span>
        <input
          name="textScale"
          type="range"
          min="80"
          max="200"
          step="10"
          value={textScale}
          onChange={(event) => setTextScale(Number(event.target.value))}
        />
      </label>
      <label className={embedded ? "dashboard-checkbox-field" : "checkbox-field"}>
        <input name="highContrast" type="checkbox" checked={highContrast} onChange={(event) => setHighContrast(event.target.checked)} />
        <span>Usar contraste elevado</span>
      </label>
      <label className={embedded ? "dashboard-checkbox-field" : "checkbox-field"}>
        <input name="reduceMotion" type="checkbox" checked={reduceMotion} onChange={(event) => setReduceMotion(event.target.checked)} />
        <span>Reduzir movimentos e animações</span>
      </label>
      <label className={embedded ? "dashboard-checkbox-field" : "checkbox-field"}>
        <input name="communicationEmail" type="checkbox" defaultChecked={initial.communicationEmail} />
        <span>Receber comunicações por e-mail</span>
      </label>
      <button className="button button-primary" type="submit">Guardar preferências</button>
    </form>
  );
}
