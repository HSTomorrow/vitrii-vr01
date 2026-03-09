/**
 * Format a number value to Brazilian Real currency format (1.234.567,89)
 */
export function formatCurrencyDisplay(value: string | number | null | undefined): string {
  if (!value) return "R$ 0,00";

  const num = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(num)) return "R$ 0,00";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
}

/**
 * Format a number to display with thousand separators and comma decimal
 * Example: 1000.50 => 1.000,50
 */
export function formatNumberToCurrency(value: string | number): string {
  if (!value) return "";

  const num = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(num)) return "";

  return num.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Parse Brazilian currency input to number
 * Handles both comma (,) and dot (.) as decimal separator
 * Example: "1.000,50" => 1000.50 | "1000.50" => 1000.50 | "19.90" => 19.90
 */
export function parseCurrencyInput(value: string): number | null {
  if (!value || value.trim() === "") return null;

  // Remove spaces and normalize
  let normalized = value.trim();

  // If the value is empty string or just whitespace, return null
  if (normalized.length === 0) return null;

  // Check if this looks like a properly formatted Brazilian currency (with comma)
  if (normalized.includes(",") && normalized.includes(".")) {
    // Already in Brazilian format: 1.000,50
    // Remove thousand separators (dots) and replace comma with dot
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else if (normalized.includes(",")) {
    // Only comma: could be "1,50" or thousands with comma: "1000,50"
    // Replace comma with dot
    normalized = normalized.replace(",", ".");
  } else if (normalized.includes(".")) {
    // Only dots - could be US format (1000.50) or Brazilian thousand separator (1.000)
    const parts = normalized.split(".");
    if (parts.length > 2) {
      // Multiple dots: assume thousand separators, keep last as decimal
      normalized = parts.join("").slice(0, -2) + "." + parts[parts.length - 1];
    }
    // Otherwise it's already in correct format (single dot as decimal)
  }
  // No dots or commas: just digits, no conversion needed

  const num = parseFloat(normalized);

  // Validate the result
  if (isNaN(num) || !isFinite(num)) return null;

  return num;
}

/**
 * Format input value while user is typing (for display in input field)
 * Returns formatted string with proper thousand separators and decimal comma
 */
export function formatCurrencyInput(value: string): string {
  if (!value) return "";

  const parsed = parseCurrencyInput(value);
  if (parsed === null) return "";

  return formatNumberToCurrency(parsed);
}
