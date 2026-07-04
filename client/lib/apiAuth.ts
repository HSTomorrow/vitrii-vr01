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

/**
 * Patches window.fetch once at app startup so every call to our own /api/*
 * automatically carries `Authorization: Bearer <token>`. This avoids having to
 * thread the token through the ~130 individual fetch() call sites across the
 * app, which previously set an unverified `x-user-id` header by hand instead.
 */
export function installAuthFetch(): void {
  const originalFetch = window.fetch.bind(window);

  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const token = getAuthToken();
    const url = typeof input === "string" || input instanceof URL ? input.toString() : input.url;

    if (token && isApiUrl(url)) {
      const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
      headers.set("Authorization", `Bearer ${token}`);
      init = { ...init, headers };
    }

    return originalFetch(input, init);
  };
}
