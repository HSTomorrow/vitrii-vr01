/**
 * Utility functions for controlling CPF/CNPJ visibility based on privacy rules
 * 
 * Privacy Rules:
 * - CPF (11 digits): Only visible to the user who owns it or to admins
 * - CNPJ (14 digits): Always visible (business public information)
 */

/**
 * Check if a CPF/CNPJ field should be visible to the current user
 * @param value - The CPF/CNPJ value to check
 * @param ownerId - The ID of the user who owns this CPF (only used for CPF, not CNPJ)
 * @param currentUserId - The ID of the current user viewing the data
 * @param isAdmin - Whether the current user is an admin
 * @returns true if the CPF/CNPJ should be visible
 */
export const shouldShowCpfCnpj = (
  value: string | undefined | null,
  ownerId: number | undefined,
  currentUserId: number | undefined,
  isAdmin: boolean = false
): boolean => {
  // If no value, don't show
  if (!value) return false;

  // Admins can always see
  if (isAdmin) return true;

  const digits = value.replace(/\D/g, "");
  const isCnpj = digits.length === 14;
  const isCpf = digits.length === 11;

  // CNPJ (14 digits) is always public
  if (isCnpj) return true;

  // CPF (11 digits) is only visible to the owner
  if (isCpf) {
    return ownerId !== undefined && currentUserId !== undefined && ownerId === currentUserId;
  }

  // If we can't determine, don't show
  return false;
};

/**
 * Get a masked version of CPF if needed
 * Shows full value if visible, otherwise returns masked version
 * @param value - The CPF/CNPJ value
 * @param isVisible - Whether the value should be fully visible
 * @returns The original value if visible, or masked version
 */
export const getCpfCnpjDisplay = (
  value: string | undefined | null,
  isVisible: boolean
): string => {
  if (!value || isVisible) return value || "";

  // Mask CPF: XXX.XXX.XXX-XX (show only last 2 digits)
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11) {
    return `***.****.***-${digits.slice(-2)}`;
  }

  // For CNPJ or other, don't show anything if not visible
  return "***.***.***-**";
};
