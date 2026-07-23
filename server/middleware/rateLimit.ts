import rateLimit from "express-rate-limit";

// Applies to signin/signup/forgot-password/resend-verification/check-status-by-email —
// endpoints that are unauthenticated by design and were previously reachable with zero
// friction, letting an attacker hammer accounts or email-bomb users from a single IP.
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.",
  },
});
