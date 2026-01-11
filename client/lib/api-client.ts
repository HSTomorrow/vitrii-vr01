/**
 * Authenticated API client that automatically includes user ID in headers
 * This ensures all requests include the x-user-id header for permission checks
 */

interface FetchOptions extends RequestInit {
  userId?: number | null;
}

/**
 * Make an authenticated API request
 * Automatically includes x-user-id header for permission checks
 * 
 * Usage:
 * const data = await fetchApi('/api/admin/users', { 
 *   userId: currentUser.id,
 *   method: 'GET' 
 * });
 */
export async function fetchApi(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { userId, ...fetchOptions } = options;

  // Build headers with user ID
  const headers = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers || {}),
  } as Record<string, string>;

  // Add user ID header if provided
  if (userId) {
    headers["x-user-id"] = userId.toString();
  }

  // Make the request
  return fetch(url, {
    ...fetchOptions,
    headers,
  });
}

/**
 * Make an authenticated API request and parse JSON response
 * 
 * Usage:
 * const data = await fetchApiJson('/api/admin/users', { 
 *   userId: currentUser.id,
 *   method: 'GET' 
 * });
 */
export async function fetchApiJson<T = unknown>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const response = await fetchApi(url, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `API Error: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}
