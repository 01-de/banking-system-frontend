import type { SpringDefaultError } from "../types/banking";
import type { AuthResponse } from "../types/auth";
import { getStoredRefreshToken, setStoredRefreshToken } from "../lib/tokenStorage";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export class ApiError extends Error {
  status: number;
  isRateLimited: boolean;
  isForbidden: boolean;
  raw: SpringDefaultError | string | null;

  constructor(status: number, message: string, raw: SpringDefaultError | string | null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.isRateLimited = status === 429;
    this.isForbidden = status === 403;
    this.raw = raw;
  }
}

let currentAccessToken: string | null = null;
let onAuthExpired: (() => void) | null = null;
let onAuthRefreshed: ((auth: AuthResponse) => void) | null = null;

export function setAccessToken(token: string | null): void {
  currentAccessToken = token;
}

export function setAuthExpiredHandler(handler: (() => void) | null): void {
  onAuthExpired = handler;
}

export function setAuthRefreshedHandler(handler: ((auth: AuthResponse) => void) | null): void {
  onAuthRefreshed = handler;
}

const AUTH_PATH_PREFIX = "/api/v1/auth/";

let refreshInFlight: Promise<boolean> | null = null;

async function refreshAccessTokenOnce(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = performRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function performRefresh(): Promise<boolean> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) {
    onAuthExpired?.();
    return false;
  }

  try {
    const res = await fetch(`${API_BASE_URL}${AUTH_PATH_PREFIX}refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      onAuthExpired?.();
      return false;
    }

    const auth = (await res.json()) as AuthResponse;
    currentAccessToken = auth.accessToken;
    setStoredRefreshToken(auth.refreshToken);
    onAuthRefreshed?.(auth);
    return true;
  } catch {
    onAuthExpired?.();
    return false;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  retriesOn429?: number;
  signal?: AbortSignal;
}

function buildUrl(path: string, params?: RequestOptions["params"]): string {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) url.searchParams.set(key, String(value));
    });
  }
  return url.toString();
}

function buildHeaders(body: unknown): HeadersInit | undefined {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (currentAccessToken) headers["Authorization"] = `Bearer ${currentAccessToken}`;
  return Object.keys(headers).length > 0 ? headers : undefined;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function parseBody<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (text.length === 0) return undefined as unknown as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, params, retriesOn429 = 2, signal } = options;
  const url = buildUrl(path, params);
  const isAuthEndpoint = path.startsWith(AUTH_PATH_PREFIX);

  let attempt = 0;
  let hasRetriedAuth = false;

  while (true) {
    const res = await fetch(url, {
      method,
      headers: buildHeaders(body),
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });

    if (res.ok) {
      return parseBody<T>(res);
    }

    if (res.status === 401 && !isAuthEndpoint && !hasRetriedAuth) {
      hasRetriedAuth = true;
      const refreshed = await refreshAccessTokenOnce();
      if (refreshed) continue;
    }

    if (res.status === 429 && attempt < retriesOn429) {
      attempt += 1;
      const backoffMs = 300 * 2 ** attempt + Math.random() * 200;
      await sleep(backoffMs);
      continue;
    }

    let raw: SpringDefaultError | string | null = null;
    let message = `Request failed with status ${res.status}`;
    try {
      const parsed = await parseBody<SpringDefaultError | string>(res);
      raw = parsed;
      if (typeof parsed === "object" && parsed?.message) {
        message = parsed.message;
      } else if (typeof parsed === "string" && parsed.length > 0) {
        message = parsed;
      }
    } catch {
    }

    throw new ApiError(res.status, message, raw);
  }
}
