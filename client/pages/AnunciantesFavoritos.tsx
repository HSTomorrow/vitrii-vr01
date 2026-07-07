import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Heart } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnunciantesCarousel from "@/components/AnunciantesCarousel";

export default function AnunciantesFavoritos() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["anunciantes-favoritos"],
    queryFn: async () => {
      const response = await fetch("/api/anunciantes-favoritos");
      if (!response.ok) throw new Error("Erro ao buscar favoritos");
      return response.json();
    },
    enabled: isLoggedIn,
  });

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <div className="flex-1 max-w-4xl mx-auto px-4 py-12 text-center text-vitrii-text-secondary">
          Faça login para ver seus anunciantes favoritos.
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-6 h-6 text-vitrii-text" />
          </button>
          <div className="flex items-center gap-3">
            <Heart className="w-7 h-7 text-red-500" />
            <h1 className="text-2xl sm:text-3xl font-bold text-vitrii-text">Anunciantes Favoritos</h1>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <AnunciantesCarousel
            anunciantes={data?.data || []}
            isLoading={isLoading}
            emptyMessage="Você ainda não favoritou nenhum anunciante. Visite o perfil de uma loja e clique em 'Favorito'."
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
