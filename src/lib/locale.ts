function normalizeLocaleTag(locale: string): string {
  const trimmed = locale.trim();

  if (trimmed === "") {
    return "";
  }

  const [base] = trimmed.split(".", 1);
  const normalized = base.replace(/-/g, "_");
  const parts = normalized.split("_").filter(Boolean);

  if (parts.length === 0) {
    return "";
  }

  const [language, ...rest] = parts;
  const normalizedParts = [language.toLowerCase()];

  for (const part of rest) {
    normalizedParts.push(part.length === 2 ? part.toUpperCase() : part);
  }

  return normalizedParts.join("_");
}

export function getLocaleFallbacks(locale?: string): string[] {
  const normalizedLocale = locale ? normalizeLocaleTag(locale) : "";

  if (normalizedLocale === "") {
    return ["en"];
  }

  const language = normalizedLocale.split("_", 1)[0] ?? normalizedLocale;
  const fallbacks = [normalizedLocale];

  if (language !== normalizedLocale) {
    fallbacks.push(language);
  }

  if (language !== "en") {
    fallbacks.push("en");
  }

  return [...new Set(fallbacks)];
}

/** A number in the locale of the manager (`config.locale`, `fr_FR` or `fr`), the browser locale without one. */
export function formatNumber(value: number, locale?: string | null): string {
  const tag = locale ? normalizeLocaleTag(locale).replace(/_/g, "-") : "";

  try {
    return new Intl.NumberFormat(tag || undefined).format(value);
  } catch {
    // An invalid locale tag (RangeError): the browser locale.
    return new Intl.NumberFormat().format(value);
  }
}
