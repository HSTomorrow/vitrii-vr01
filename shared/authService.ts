import apiClient, { setAuth as setApiAuth, clearAuth } from './apiClient';
import { z } from 'zod';

// Validation schemas
export const SignUpSchema = z.object({
  email: z.string().email('Email inválido'),
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  telefone: z.string().optional(),
  localidadeId: z.number().optional(),
});

export const SignInSchema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(1, 'Senha é obrigatória'),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

export const ResetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

// Type definitions
export interface Usuario {
  id: number;
  email: string;
  nome: string;
  tipoUsuario: 'usuario' | 'adm';
  verified: boolean;
  ativo: boolean;
  localidadeId?: number;
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  usuario: Usuario;
  token: string;
}

export interface SignUpData extends z.infer<typeof SignUpSchema> {}
export interface SignInData extends z.infer<typeof SignInSchema> {}

/**
 * Authentication service with shared methods for web and mobile
 */
export const authService = {
  /**
   * Sign up a new user
   */
  signUp: async (data: SignUpData) => {
    const validated = SignUpSchema.parse(data);
    const response = await apiClient.post<AuthResponse>('/auth/signup', validated);
    return response;
  },

  /**
   * Sign in user with email and password
   */
  signIn: async (email: string, senha: string) => {
    const validated = SignInSchema.parse({ email, senha });
    const response = await apiClient.post<AuthResponse>('/auth/signin', validated);
    
    if (response.token && response.usuario) {
      setApiAuth(response.token, response.usuario.id);
    }
    
    return response;
  },

  /**
   * Get current user info
   */
  getCurrentUser: async (userId: number) => {
    return apiClient.get<Usuario>(`/usracessos/${userId}`);
  },

  /**
   * Request password reset email
   */
  forgotPassword: async (email: string) => {
    const validated = ForgotPasswordSchema.parse({ email });
    return apiClient.post('/auth/forgot-password', validated);
  },

  /**
   * Reset password with token
   */
  resetPassword: async (token: string, newPassword: string) => {
    const validated = ResetPasswordSchema.parse({ token, newPassword });
    return apiClient.post('/auth/reset-password', validated);
  },

  /**
   * Verify email with token
   */
  verifyEmail: async (token: string) => {
    return apiClient.post('/auth/verify-email', { token });
  },

  /**
   * Sign out user
   */
  signOut: () => {
    clearAuth();
    return Promise.resolve();
  },

  /**
   * Resend verification email
   */
  resendVerificationEmail: async (email: string) => {
    return apiClient.post('/auth/resend-verification-email', { email });
  },
};

export default authService;
