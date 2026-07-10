const TOKEN_KEY = "vitrii_token";

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

function isApiUrl(url: string): boolean {
  try {
    // Relative URLs (the vast majority of calls in this app) resolve against
    // location.origin, so same-origin /api/ calls match either way.
    const resolved = new URL(url, window.location.origin);
    return resolved.origin === window.location.origin && resolved.pathname.startsWith("/api/");
  } catch {
    return false;
  }
}

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// Zod-style field errors, e.g. [{ path: ["cnpj"], message: "CNPJ/CPF inválido" }],
// as returned by most of our route handlers' `details` field on a 400.
interface FieldError {
  path?: string | (string | number)[];
  message?: string;
}

/**
 * Logs a structured console.error whenever a "confirm"/save request (POST, PUT,
 * PATCH, DELETE) to our own API fails, so a form that silently doesn't save can
 * be diagnosed from the browser console: which endpoint, which status, and -
 * when the server responded with Zod-style `details` - exactly which required
 * field or rule caused the rejection, not just the generic top-level message.
 */
async function logApiError(method: string, url: string, response: Response): Promise<void> {
  try {
    const clone = response.clone();
    const contentType = clone.headers.get("content-type") || "";
    const body = contentType.includes("application/json") ? await clone.json() : await clone.text();

    const details: FieldError[] | undefined = Array.isArray(body?.details) ? body.details : undefined;
    const fieldErrors = details?.map((d) => {
      const path = Array.isArray(d.path) ? d.path.join(".") : d.path;
      return path ? `${path}: ${d.message}` : d.message;
    });

    console.error(`[API] ${method} ${url} -> ${response.status}`, {
      error: (typeof body === "object" && body?.error) || (typeof body === "object" && body?.message) || body,
      fieldErrors,
      status: response.status,
    });
  } catch {
    // Response body wasn't readable/JSON (e.g. a network-level failure surfaced
    // as a Response) - nothing more useful to log.
  }
}

/**
 * Patches window.fetch once at app startup so every call to our own /api/*
 * automatically carries `Authorization: Bearer <token>`. This avoids having to
 * thread the token through the ~130 individual fetch() call sites across the
 * app, which previously set an unverified `x-user-id` header by hand instead.
 *
 * Also logs a structured error (see logApiError) whenever a write request to
 * our API fails, independent of whether the calling code's own error handling
 * surfaces enough detail to the user.
 */
export function installAuthFetch(): void {
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const token = getAuthToken();
    const url = typeof input === "string" || input instanceof URL ? input.toString() : input.url;
    const method = (init?.method || (input instanceof Request ? input.method : "GET") || "GET").toUpperCase();

    if (token && isApiUrl(url)) {
      const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
      headers.set("Authorization", `Bearer ${token}`);
      init = { ...init, headers };
    }

    let response: Response;
    try {
      response = await originalFetch(input, init);
    } catch (error) {
      if (isApiUrl(url) && WRITE_METHODS.has(method)) {
        console.error(`[API] ${method} ${url} -> network error`, error);
      }
      throw error;
    }

    if (!response.ok && isApiUrl(url) && WRITE_METHODS.has(method)) {
      void logApiError(method, url, response);
    }

    return response;
  };
}
