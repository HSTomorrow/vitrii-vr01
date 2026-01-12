import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Palette, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface GrupoDeProductos {
  id: number;
  nome: string;
  lojaId: number;
}

interface Producto {
  id: number;
  nome: string;
  grupo: GrupoDeProductos;
  descricao?: string;
}

interface Loja {
  id: number;
  nome: string;
}

export default function CadastroVariantesLista() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedLojaId, setSelectedLojaId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch user's lojas
  const { data: lojasData } = useQuery({
    queryKey: ["lojas"],
    queryFn: async () => {
      const response = await fetch("/api/lojas");
      if (!response.ok) throw new Error("Erro ao buscar lojas");
      return response.json();
    },
    enabled: !!user,
  });

  // Fetch produtos
  const { data: productosData } = useQuery({
    queryKey: ["productos"],
    queryFn: async () => {
      const response = await fetch("/api/productos");
      if (!response.ok) throw new Error("Erro ao buscar produtos");
      return response.json();
    },
    enabled: !!user,
  });

  const lojas = lojasData?.data || [];
  const allProductos = productosData?.data || [];

  // Set first loja as default
  const defaultLojaId = useMemo(() => {
    if (lojas.length > 0 && selectedLojaId === null) {
      return lojas[0].id;
    }
    return selectedLojaId;
  }, [lojas, selectedLojaId]);

  // Filter productos by selected loja and search term
  const filteredProductos = useMemo(() => {
    return allProductos
      .filter((p: Producto) => p.grupo?.lojaId === (selectedLojaId || defaultLojaId))
      .filter(
        (p: Producto) =>
          p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.grupo?.nome.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [allProductos, selectedLojaId, defaultLojaId, searchTerm]);

  const handleSelectProduct = (productId: number) => {
    navigate(`/cadastros/variantes/${productId}`);
  };

  if (lojas.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <p className="text-yellow-800">
              Você precisa cadastrar uma loja antes de gerenciar variantes.
            </p>
            <button
              onClick={() => navigate("/cadastros/lojas")}
              className="mt-4 px-4 py-2 bg-vitrii-yellow text-vitrii-text rounded-lg hover:bg-vitrii-yellow-dark transition-colors font-semibold"
            >
              Ir para Cadastro de Lojas
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Palette className="w-8 h-8 text-vitrii-yellow" />
            <h1 className="text-3xl font-bold text-vitrii-text">Gerenciar Variantes</h1>
          </div>
          <p className="text-vitrii-text-secondary mt-2">
            Selecione um produto para gerenciar seus tamanhos, cores e preços
          </p>
        </div>

        {/* Loja Selector */}
        {lojas.length > 1 && (
          <div className="mb-8">
            <label className="block text-sm font-semibold text-vitrii-text mb-3">
              Filtrar por Loja
            </label>
            <div className="flex flex-wrap gap-2">
              {lojas.map((loja: Loja) => (
                <button
                  key={loja.id}
                  onClick={() => setSelectedLojaId(loja.id)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    (selectedLojaId || defaultLojaId) === loja.id
                      ? "bg-vitrii-blue text-white"
                      : "bg-white text-vitrii-text border border-gray-300 hover:border-vitrii-blue"
                  }`}
                >
                  {loja.nome}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Buscar por nome do produto ou grupo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-vitrii-blue focus:ring-2 focus:ring-vitrii-blue focus:ring-opacity-50"
          />
        </div>

        {/* Produtos Grid */}
        {filteredProductos.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Palette className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {searchTerm ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}
            </p>
            <p className="text-gray-400 mt-2">
              {searchTerm
                ? "Tente uma busca diferente"
                : "Cadastre um produto para gerenciar variantes"}
            </p>
            <button
              onClick={() => navigate("/cadastros/productos")}
              className="mt-6 px-4 py-2 bg-vitrii-blue text-white rounded-lg hover:bg-vitrii-blue-dark transition-colors font-semibold"
            >
              Ir para Cadastro de Produtos
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProductos.map((producto: Producto) => (
              <div
                key={producto.id}
                onClick={() => handleSelectProduct(producto.id)}
                className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow hover:border-vitrii-blue border-2 border-transparent"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-vitrii-text">
                      {producto.nome}
                    </h3>
                    <p className="text-sm text-vitrii-text-secondary mt-1">
                      {producto.grupo?.nome}
                    </p>
                  </div>
                  <div className="p-2 bg-yellow-50 rounded-lg">
                    <Palette className="w-5 h-5 text-vitrii-yellow" />
                  </div>
                </div>

                {producto.descricao && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {producto.descricao}
                  </p>
                )}

                <button className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-vitrii-yellow text-vitrii-text rounded-lg hover:bg-vitrii-yellow-dark transition-colors font-semibold">
                  Gerenciar Variantes
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
