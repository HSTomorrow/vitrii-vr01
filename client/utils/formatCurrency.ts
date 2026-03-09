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
 * Example: "1.000,50" => 1000.50 | "1000.50" => 1000.50
 */
export function parseCurrencyInput(value: string): number | null {
  if (!value || value.trim() === "") return null;

  // Remove spaces and normalize
  let normalized = value.trim();

  // Replace comma with dot for parsing
  // But first check if there's a dot followed by comma (European format)
  // or comma followed by dot (Brazilian format)
  if (normalized.includes(",")) {
    // Remove thousand separators (dots) and replace comma with dot
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else if (normalized.lastIndexOf(".") > -1) {
    // Assume US format or just dots as thousand separators
    const parts = normalized.split(".");
    if (parts.length > 2) {
      // Multiple dots = thousand separators, keep last as decimal
      normalized = parts.join("").slice(0, -2) + "." + parts[parts.length - 1];
    }
    // Otherwise it's already in correct format
  }

  const num = parseFloat(normalized);

  return isNaN(num) ? null : num;
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
