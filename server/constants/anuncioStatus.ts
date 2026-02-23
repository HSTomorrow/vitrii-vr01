/**
 * Shared constants for Anúncio (Ad) status values
 * Ensures consistency across all routes and functions
 */

export const ANUNCIO_STATUS = {
  ATIVO: "ativo",
  PAGO: "pago",
  EM_EDICAO: "em_edicao",
  AGUARDANDO_PAGAMENTO: "aguardando_pagamento",
  HISTORICO: "historico",
  INATIVO: "inativo",
} as const;

/**
 * List of valid status values for updating anúncios
 */
export const VALID_UPDATE_STATUS = [
  ANUNCIO_STATUS.EM_EDICAO,
  ANUNCIO_STATUS.AGUARDANDO_PAGAMENTO,
  ANUNCIO_STATUS.PAGO,
  ANUNCIO_STATUS.ATIVO,
  ANUNCIO_STATUS.HISTORICO,
] as const;

/**
 * Status values that count as "active" for ad counter (numeroAnunciosAtivos)
 * These are the statuses that should increment/decrement the counter
 */
export const ACTIVE_COUNTER_STATUS = [
  ANUNCIO_STATUS.PAGO,
  ANUNCIO_STATUS.ATIVO,
] as const;

/**
 * Default status for new ads (donations)
 */
export const DEFAULT_DONATION_STATUS = ANUNCIO_STATUS.ATIVO;

/**
 * Default status filter for public listing
 */
export const PUBLIC_LIST_DEFAULT_STATUS = ANUNCIO_STATUS.ATIVO;

/**
 * Type guard to check if a value is a valid update status
 */
export function isValidUpdateStatus(status: unknown): status is typeof VALID_UPDATE_STATUS[number] {
  return typeof status === "string" && (VALID_UPDATE_STATUS as readonly string[]).includes(status);
}

/**
 * Type guard to check if a status counts as active for the counter
 */
export function isActiveCounterStatus(status: unknown): status is typeof ACTIVE_COUNTER_STATUS[number] {
  return typeof status === "string" && (ACTIVE_COUNTER_STATUS as readonly string[]).includes(status);
}
