export function matchSpokenOption(transcript, options, locale = "pt") {
  const normalized = transcript.trim().toLocaleLowerCase(locale);
  const ordinal = Number.parseInt(normalized, 10);
  if (Number.isInteger(ordinal) && ordinal > 0 && ordinal <= options.length) {
    return ordinal - 1;
  }
  return options.findIndex(
    (option) => option.trim().toLocaleLowerCase(locale) === normalized
  );
}

export function clampSpeechRate(rate) {
  return Math.min(2, Math.max(0.5, rate));
}
