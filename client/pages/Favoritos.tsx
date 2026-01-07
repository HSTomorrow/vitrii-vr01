import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { Heart, ArrowRight } from "lucide-react";
import AdCard from "@/components/AdCard";

export default function Favoritos() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [favoritos, setFavoritos] = useState<Set<number>>(new Set());

  // Redirect if not logged in
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="bg-blue-50 border-l-4 border-blue-500 rounded p-4 inline-block">
            <p className="text-walmart-text">
              Por favor,{" "}
              <button onClick={() => navigate("/auth/signin")} className="text-walmart-blue font-semibold hover:underline">
                faça login
              </button>{" "}
              para ver seus favoritos
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Fetch user's favoritos
  const { data: favoritosData, isLoading } = useQuery({
    queryKey: ["favoritos", user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/favoritos?usuarioId=${user.id}`);
      if (!response.ok) throw new Error("Erro ao buscar favoritos");
      return response.json();
    },
    enabled: !!user?.id,
  });

  const anuncios = favoritosData?.data || [];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-walmart-text mb-2 flex items-center gap-3">
            <Heart className="w-8 h-8 fill-red-500 text-red-500" />
            Meus Favoritos
          </h1>
          <p className="text-walmart-text-secondary">
            {anuncios.length} anúncio{anuncios.length !== 1 ? "s" : ""} salvo{anuncios.length !== 1 ? "s" : ""}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="vitrii-card overflow-hidden animate-pulse">
                <div className="w-full h-48 bg-gray-300" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-300 rounded" />
                  <div className="h-3 bg-gray-300 rounded w-3/4" />
                  <div className="h-10 bg-gray-300 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : anuncios.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {anuncios.map((anuncio: any) => (
              <AdCard
                key={anuncio.id}
                anuncio={anuncio}
                isFavorited={true}
                onFavoritoToggle={(id, isFavorited) => {
                  if (!isFavorited) {
                    // Remove from list if unfavorited
                    const newFavoritos = anuncios.filter((a: any) => a.id !== id);
                    favoritosData.data = newFavoritos;
                  }
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-walmart-text-secondary text-lg mb-6">
              Você ainda não tem favoritos
            </p>
            <button
              onClick={() => navigate("/browse")}
              className="inline-flex items-center gap-2 px-6 py-3 bg-walmart-blue text-white rounded-lg font-semibold hover:bg-walmart-blue-dark transition-colors"
            >
              <span>Explore Anúncios</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
