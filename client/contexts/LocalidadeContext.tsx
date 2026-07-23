import { createContext, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";
import { useAnonymousLocalidade } from "@/hooks/useAnonymousLocalidade";

interface LocalidadeContextType {
  localidadeId: number | null;
  hasChosen: boolean;
  isSuggestion: boolean;
  selectLocalidade: (localidadeId: number | null) => void;
}

const LocalidadeContext = createContext<LocalidadeContextType | undefined>(undefined);

export function LocalidadeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const anon = useAnonymousLocalidade();

  const { data: userLocalidadeData } = useQuery({
    queryKey: ["user-localidade"],
    queryFn: async () => {
      const response = await fetch(`/api/usracessos/${user!.id}`, {
        headers: { "x-user-id": user!.id.toString() },
      });
      if (!response.ok) throw new Error("Erro ao buscar localidade do usuário");
      return response.json();
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Best-effort IP-based suggestion for anonymous visitors who haven't chosen yet - fails
  // open (data: null) on any error/rate-limit/unmatched city. Only ever an in-memory
  // suggestion (never persisted, never marks hasChosen) so the onboarding modal can still
  // offer it for explicit confirmation afterward instead of silently locking it in.
  const { data: suggestionData } = useQuery({
    queryKey: ["localidade-suggestion"],
    queryFn: async () => {
      const response = await fetch("/api/geolocation/suggest-localidade");
      if (!response.ok) return { data: null };
      return response.json();
    },
    enabled: !user && !anon.hasChosen,
    retry: false,
    staleTime: Infinity,
  });

  const updateLocalidadeMutation = useMutation({
    mutationFn: async (localidadeId: number | null) => {
      const response = await fetch(`/api/usracessos/${user!.id}/localidade-padrao`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user!.id.toString(),
        },
        body: JSON.stringify({ localidadePadraoId: localidadeId }),
      });
      if (!response.ok) throw new Error("Erro ao atualizar localidade padrão");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Localidade padrão atualizada!");
      queryClient.invalidateQueries({ queryKey: ["user-localidade"] });
      queryClient.invalidateQueries({ queryKey: ["anuncios-all"] });
      queryClient.invalidateQueries({ queryKey: ["browse-anuncios"] });
      queryClient.invalidateQueries({ queryKey: ["localidade-anunciantes"] });
    },
    onError: () => {
      toast.error("Erro ao atualizar localidade");
    },
  });

  const suggestedId: number | null = suggestionData?.data?.id ?? null;

  const localidadeId = user
    ? (userLocalidadeData?.data?.localidadePadraoId ?? null)
    : anon.hasChosen
      ? anon.localidadeId
      : suggestedId;

  const selectLocalidade = (id: number | null) => {
    if (user) {
      updateLocalidadeMutation.mutate(id);
    } else {
      anon.chooseLocalidade(id);
    }
  };

  return (
    <LocalidadeContext.Provider
      value={{
        localidadeId,
        hasChosen: user ? true : anon.hasChosen,
        isSuggestion: !user && !anon.hasChosen && suggestedId !== null,
        selectLocalidade,
      }}
    >
      {children}
    </LocalidadeContext.Provider>
  );
}

export function useLocalidade() {
  const context = useContext(LocalidadeContext);
  if (context === undefined) {
    throw new Error("useLocalidade must be used within LocalidadeProvider");
  }
  return context;
}
