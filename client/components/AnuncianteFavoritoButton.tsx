import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface AnuncianteFavoritoButtonProps {
  anuncianteId: number;
  label: string;
  className?: string;
}

export default function AnuncianteFavoritoButton({
  anuncianteId,
  label,
  className = "",
}: AnuncianteFavoritoButtonProps) {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["anunciantes-favoritos"],
    queryFn: async () => {
      const response = await fetch("/api/anunciantes-favoritos");
      if (!response.ok) return { data: [] };
      return response.json();
    },
    enabled: isLoggedIn,
  });

  const favoritos: { id: number }[] = data?.data || [];
  const isFavorito = favoritos.some((a) => a.id === anuncianteId);

  const toggleMutation = useMutation({
    mutationFn: async () => {
      if (isFavorito) {
        const response = await fetch(`/api/anunciantes-favoritos/${anuncianteId}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Erro ao desfavoritar");
      } else {
        const response = await fetch("/api/anunciantes-favoritos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ anuncianteId }),
        });
        if (!response.ok) throw new Error("Erro ao favoritar");
      }
    },
    onSuccess: () => {
      toast.success(isFavorito ? "Removido dos favoritos" : "Adicionado aos favoritos!");
      queryClient.invalidateQueries({ queryKey: ["anunciantes-favoritos"] });
    },
    onError: () => toast.error("Erro ao atualizar favorito"),
  });

  const handleClick = () => {
    if (!isLoggedIn) {
      navigate("/auth/signin");
      return;
    }
    toggleMutation.mutate();
  };

  return (
    <button
      onClick={handleClick}
      disabled={toggleMutation.isPending}
      className={
        className ||
        `w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 border-2 rounded-lg font-semibold transition-colors text-xs sm:text-sm leading-tight text-center disabled:opacity-50 ${
          isFavorito
            ? "border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
            : "border-gray-300 text-vitrii-text hover:bg-gray-50"
        }`
      }
    >
      <Heart className={`w-4 h-4 shrink-0 ${isFavorito ? "fill-red-500 text-red-500" : ""}`} />
      <span>{isFavorito ? `${label} ✓` : label}</span>
    </button>
  );
}
