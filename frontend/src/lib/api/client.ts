import { resolveApiBaseUrl } from "@/lib/env";

const LOCAL_API_FALLBACK = "http://localhost:4000";

export class ApiError<T = unknown> extends Error {
  public readonly status: number;
  public readonly data?: T;

  constructor(message: string, status: number, data?: T) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  token?: string;
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: RequestInit["body"] | Record<string, unknown>;
}

export function getApiBaseUrl(): string {
  const raw = resolveApiBaseUrl() ?? LOCAL_API_FALLBACK;
  return raw.replace(/\/+$/, "");
}

export function buildApiUrl(path: string): string {
  if (!path) {
    return getApiBaseUrl();
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const base = getApiBaseUrl();
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;

  if (!base) {
    return `/${normalizedPath}`;
  }

  return `${base}/${normalizedPath}`;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { token, query, headers, cache = "no-store", ...rest } = options;
  let { body, ...initWithoutBody } = rest;

  let url = buildApiUrl(path);

  if (query) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        return;
      }
      params.append(key, String(value));
    });

    const queryString = params.toString();
    if (queryString) {
      url += url.includes("?") ? `&${queryString}` : `?${queryString}`;
    }
  }

  const requestHeaders = new Headers(headers as HeadersInit | undefined);
  if (!requestHeaders.has("Accept")) {
    requestHeaders.set("Accept", "application/json");
  }
  if (token && !requestHeaders.has("Authorization")) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  if (
    body &&
    typeof body === "object" &&
    !(body instanceof FormData) &&
    !(body instanceof Blob) &&
    !(body instanceof ArrayBuffer) &&
    !(ArrayBuffer.isView(body))
  ) {
    if (!requestHeaders.has("Content-Type")) {
      requestHeaders.set("Content-Type", "application/json");
    }
    body = JSON.stringify(body);
  }

  const response = await fetch(url, {
    method: initWithoutBody.method ?? "GET",
    ...initWithoutBody,
    body,
    headers: requestHeaders,
    cache,
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? "";
    let errorPayload: unknown;

    try {
      if (contentType.includes("application/json")) {
        errorPayload = await response.json();
      } else {
        errorPayload = await response.text();
      }
    } catch {
      errorPayload = undefined;
    }

    let derivedMessage: string | undefined;
    if (typeof errorPayload === "object" && errorPayload !== null) {
      const candidate = errorPayload as Record<string, unknown>;
      if (typeof candidate.message === "string") {
        derivedMessage = candidate.message;
      } else if (typeof candidate.error === "string") {
        derivedMessage = candidate.error;
      } else if (typeof candidate.detail === "string") {
        derivedMessage = candidate.detail;
      }
    }

    const errorMessage =
      derivedMessage ?? `Request failed with status ${response.status}`;

    throw new ApiError(errorMessage, response.status, errorPayload);
  }

  if (response.status === 204 || response.status === 205) {
    return undefined as T;
  }

  const responseType = response.headers.get("content-type") ?? "";

  if (responseType.includes("application/json")) {
    return (await response.json()) as T;
  }

  const text = await response.text();
  return text as unknown as T;
}
