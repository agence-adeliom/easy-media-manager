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
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(body),
  });

  return parseJson<TResponse>(response);
}

export async function postVoid<TResponse>(route: string): Promise<TResponse> {
  const response = await fetch(route, {
    method: "POST",
    headers: {
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  return parseJson<TResponse>(response);
}

export async function getJson<TResponse>(route: string): Promise<TResponse> {
  const response = await fetch(route, {
    method: "GET",
    headers: {
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  return parseJson<TResponse>(response);
}
