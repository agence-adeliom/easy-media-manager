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
