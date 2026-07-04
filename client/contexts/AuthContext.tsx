import { createContext, useContext, useState, useEffect } from "react";
import { setAuthToken } from "@/lib/apiAuth";

interface User {
  id: number;
  nome: string;
  email: string;
  tipoUsuario: string;
  cpf?: string;
  telefone?: string;
  whatsapp?: string;
  linkedin?: string;
  facebook?: string;
  endereco?: string;
  localidadePadraoId?: number | null;
  dataCriacao: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (usuario: User, token: string) => void;
  logout: () => void;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("vitrii_user");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error("Error loading user from localStorage:", error);
      localStorage.removeItem("vitrii_user");
      setAuthToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (usuario: User, token: string) => {
    setUser(usuario);
    localStorage.setItem("vitrii_user", JSON.stringify(usuario));
    setAuthToken(token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("vitrii_user");
    setAuthToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isLoggedIn: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
