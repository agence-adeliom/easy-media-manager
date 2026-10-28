import { mediaStore } from "@/store/media-store";

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  "X-Requested-With": "XMLHttpRequest",
} as const;

export class EasyMediaApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = "EasyMediaApiError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Headers of a request: the library ones, then `config.headers` (e.g. a CSRF token). */
export function requestHeaders(headers: Record<string, string>): Record<string, string> {
  return { ...headers, ...mediaStore.getState().config?.headers };
}

export function hasErrorMessage(value: unknown): value is { error: string } {
  return isRecord(value) && typeof value.error === "string" && value.error.length > 0;
}

export async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new EasyMediaApiError(`HTTP ${response.status}`, response.status);
  }

  return (await response.json()) as T;
}

export async function postJson<TResponse, TBody>(route: string, body: TBody): Promise<TResponse> {
  const response = await fetch(route, {
    method: "POST",
    headers: requestHeaders(DEFAULT_HEADERS),
    body: JSON.stringify(body),
  });

  return parseJson<TResponse>(response);
}

export async function postVoid<TResponse>(route: string): Promise<TResponse> {
  const response = await fetch(route, {
    method: "POST",
    headers: requestHeaders({
      "X-Requested-With": "XMLHttpRequest",
    }),
  });

  return parseJson<TResponse>(response);
}

type SearchParams = Record<string, string | number | boolean | null | undefined>;

function buildUrl(route: string, params?: SearchParams): string {
  if (!params) return route;
  const [base, existing] = route.split("?");
  const sp = new URLSearchParams(existing);
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined) {
      sp.set(key, String(value));
    }
  }
  const query = sp.toString();
  return query ? `${base}?${query}` : base;
}

export async function getJson<TResponse>(route: string, params?: SearchParams): Promise<TResponse> {
  const response = await fetch(buildUrl(route, params), {
    method: "GET",
    headers: requestHeaders({
      "X-Requested-With": "XMLHttpRequest",
    }),
  });

  return parseJson<TResponse>(response);
}
