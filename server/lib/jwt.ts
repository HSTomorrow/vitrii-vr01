import jwt from "jsonwebtoken";

export interface AuthTokenPayload {
  userId: number;
  tipoUsuario: string;
  email: string;
}

const JWT_EXPIRES_IN = "7d";

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET must be set in production");
    }
    // Stable dev-only fallback so local development keeps working without extra setup.
    return "dev-insecure-jwt-secret-do-not-use-in-production";
  }
  return secret;
}

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: JWT_EXPIRES_IN });
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, getSecret()) as AuthTokenPayload;
  } catch {
    return null;
  }
}
