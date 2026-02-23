/**
 * Safely parse a string to an integer ID
 * Returns the ID if valid, null if invalid
 */
export function parseId(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isInteger(value) && value > 0 ? value : null;
  }
  
  if (typeof value === "string") {
    const parsed = parseInt(value, 10);
    return !Number.isNaN(parsed) && parsed > 0 ? parsed : null;
  }
  
  return null;
}

/**
 * Safely parse a string to a non-negative integer
 * Useful for offset/limit parameters
 */
export function parseNonNegativeInt(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isInteger(value) && value >= 0 ? value : null;
  }
  
  if (typeof value === "string") {
    const parsed = parseInt(value, 10);
    return !Number.isNaN(parsed) && parsed >= 0 ? parsed : null;
  }
  
  return null;
}

/**
 * Parse ID from route parameter or throw error
 */
export function parseIdOrThrow(value: unknown, paramName: string = "id"): number {
  const parsed = parseId(value);
  if (parsed === null) {
    throw new Error(`Invalid ${paramName}: must be a positive integer`);
  }
  return parsed;
}

/**
 * Validate multiple IDs at once
 */
export function parseIds(values: unknown[]): number[] | null {
  const results: number[] = [];
  for (const value of values) {
    const parsed = parseId(value);
    if (parsed === null) return null;
    results.push(parsed);
  }
  return results;
}
