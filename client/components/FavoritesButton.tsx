import { useState } from "react";
import { Star } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface FavoritesButtonProps {
  anuncioId: number;
  isFavorited?: boolean;
  onToggleFavorite?: (isFavorited: boolean) => void;
  variant?: "icon" | "button";
  className?: string;
}

export default function FavoritesButton({
  anuncioId,
  isFavorited = false,
  onToggleFavorite,
  variant = "icon",
  className = "",
}: FavoritesButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLocalFavorited, setIsLocalFavorited] = useState(isFavorited);

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        toast.error("Faça login para adicionar favoritos");
        navigate("/auth/signin");
        throw new Error("Not logged in");
      }

      const response = await fetch("/api/favoritos/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuarioId: user.id,
          anuncioId,
        }),
      });

      if (!response.ok) throw new Error("Erro ao atualizar favorito");
      return response.json();
    },
    onSuccess: (data) => {
      setIsLocalFavorited(data.isFavorited);
      onToggleFavorite?.(data.isFavorited);
      toast.success(
        data.isFavorited ? "Adicionado aos favoritos!" : "Removido dos favoritos"
      );
    },
    onError: () => {
      toast.error("Erro ao atualizar favorito");
    },
  });

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavoriteMutation.mutate();
  };

  if (variant === "icon") {
    return (
      <button
        onClick={handleToggleFavorite}
        disabled={toggleFavoriteMutation.isPending}
        className={`p-2 rounded-full transition-all shadow-lg hover:shadow-xl transform hover:scale-110 ${
          isLocalFavorited
            ? "bg-yellow-100 hover:bg-yellow-200"
            : "bg-white hover:bg-yellow-50"
        } disabled:opacity-50 ${className}`}
        title={isLocalFavorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      >
        <Star
          className={`w-5 h-5 transition-colors ${
            isLocalFavorited ? "fill-yellow-500 text-yellow-500" : "text-gray-400"
          }`}
        />
      </button>
    );
  }

  return (
    <button
      onClick={handleToggleFavorite}
      disabled={toggleFavoriteMutation.isPending}
      className={`w-full flex items-center justify-center gap-2 px-4 py-2 border-2 transition-colors rounded-lg font-semibold text-sm disabled:opacity-50 ${
        isLocalFavorited
          ? "border-yellow-300 bg-yellow-50 text-yellow-600 hover:bg-yellow-100"
          : "border-yellow-300 text-yellow-600 hover:bg-yellow-50"
      } ${className}`}
    >
      <Star
        className={`w-4 h-4 transition-all ${
          isLocalFavorited ? "fill-yellow-500 text-yellow-500" : ""
        }`}
      />
      {isLocalFavorited ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
    </button>
  );
}
