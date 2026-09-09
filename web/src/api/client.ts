import { ApiError } from "./apiError";

// TODO: swap this for your deployed backend URL once Eliakim provisions
// hosting (e.g. https://api.rooma.elpi.dev). Reads from an environment
// variable so the same build can point at different backends without
// code changes — set VITE_API_BASE_URL in a .env file for local overrides,
// or as a build-time environment variable in production.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

const ACCESS_TOKEN_KEY = "rooma_access_token";
const REFRESH_TOKEN_KEY = "rooma_refresh_token";

export function saveTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  withAuth?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, withAuth = true } = options;

  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (withAuth) {
    const token = getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "error" in data && typeof data.error === "string"
        ? data.error
        : `Request failed with status ${response.status}`;
    const issues =
      data && typeof data === "object" && Array.isArray((data as { issues?: unknown }).issues)
        ? (data as { issues: ApiError["issues"] }).issues
        : undefined;
    throw new ApiError(response.status, message, issues);
  }

  return data as T;
}

export const apiClient = {
  get: <T>(path: string, withAuth = true) => request<T>(path, { method: "GET", withAuth }),
  post: <T>(path: string, body?: unknown, withAuth = true) =>
    request<T>(path, { method: "POST", body, withAuth }),
  patch: <T>(path: string, body?: unknown, withAuth = true) =>
    request<T>(path, { method: "PATCH", body, withAuth }),
  delete: <T>(path: string, withAuth = true) => request<T>(path, { method: "DELETE", withAuth }),
};
