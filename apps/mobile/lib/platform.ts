export const supportedLocales = ["pt-PT", "pt-BR", "es", "en"] as const;
export type SupportedLocale = (typeof supportedLocales)[number];

export const localeLabels: Readonly<Record<SupportedLocale, string>> = {
  "pt-PT": "Português (Portugal)",
  "pt-BR": "Português (Brasil)",
  es: "Español",
  en: "English"
};

export function resolveLocale(value: string | null | undefined): SupportedLocale {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "pt-br") return "pt-BR";
  if (normalized?.startsWith("pt")) return "pt-PT";
  if (normalized?.startsWith("es")) return "es";
  if (normalized?.startsWith("en")) return "en";
  return "pt-PT";
}

export function resolveTimeZone(value: string | null | undefined): string {
  if (!value) return "UTC";
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format();
    return value;
  } catch {
    return "UTC";
  }
}

export function detectPlatformPreferences(): Readonly<{
  locale: SupportedLocale;
  timezone: string;
}> {
  const resolved = Intl.DateTimeFormat().resolvedOptions();
  return {
    locale: resolveLocale(resolved.locale),
    timezone: resolveTimeZone(resolved.timeZone)
  };
}

