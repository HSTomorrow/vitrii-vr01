import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import {
  Heart,
  ArrowLeft,
  Edit,
  Trash2,
  Save,
  X,
  Loader,
  AlertCircle,
  Lock,
  Globe,
  User as UserIcon,
} from "lucide-react";
import { AdImageWithFallback } from "@/components/ImageWithFallback";
import { getImageAlt } from "@/utils/imageFallback";

interface WishlistItem {
  id: number;
  titulo: string;
  descricao?: string;
  preco?: number;
  preco_desejado?: number;
  prioridade?: number;
  observacoes?: string;
  imagem?: string;
  anuncioId?: number;
  dataCriacao: string;
  tipo: string;
}

interface Wishlist {
  id: number;
  titulo: string;
  descricao?: string;
  status: string;
  dataCriacao: string;
  itens: WishlistItem[];
  usuarioId?: number;
  usuario?: {
    id: number;
    nome: string;
  };
}

export default function ListaDesejosPage() {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const queryClient = useQueryClient();
  const [selectedListaId, setSelectedListaId] = useState<number | null>(null);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingPrivacy, setEditingPrivacy] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<{
    preco_desejado?: number;
    prioridade?: number;
    observacoes?: string;
  }>({});
  const [privacyValue, setPrivacyValue] = useState<string>("");

  // Fetch user's wishlists
  const { data: listasData, isLoading: listasLoading } = useQuery({
    queryKey: ["user-wishlists"],
    queryFn: async () => {
      const response = await fetch("/api/listas-desejos", {
        headers: {
          "x-user-id": user?.id?.toString() || "",
        },
      });

      if (!response.ok) throw new Error("Erro ao buscar listas");
      return response.json();
    },
    enabled: !!user?.id && isLoggedIn,
  });

  const listas: Wishlist[] = listasData?.data || [];
  const selectedLista = listas.find((l) => l.id === selectedListaId);

  useEffect(() => {
    if (listas.length > 0 && !selectedListaId) {
      setSelectedListaId(listas[0].id);
    }
  }, [listas, selectedListaId]);

  const handleDeleteItem = async (listaId: number, itemId: number) => {
    if (!confirm("Tem certeza que deseja remover este item?")) return;

    try {
      const response = await fetch(
        `/api/listas-desejos/${listaId}/itens/${itemId}`,
        {
          method: "DELETE",
          headers: {
            "x-user-id": user?.id?.toString() || "",
          },
        }
      );

      if (!response.ok) throw new Error("Erro ao deletar");

      toast.success("Item removido com sucesso!");
      // Refetch wishlists to reflect the changes
      queryClient.invalidateQueries({ queryKey: ["user-wishlists"] });
    } catch (error) {
      toast.error("Erro ao remover item");
    }
  };

  const handleSaveEdit = async (listaId: number, itemId: number) => {
    try {
      const response = await fetch(
        `/api/listas-desejos/${listaId}/itens/${itemId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user?.id?.toString() || "",
          },
          body: JSON.stringify(editValues),
        }
      );

      if (!response.ok) throw new Error("Erro ao atualizar");

      toast.success("Item atualizado com sucesso!");
      setEditingItemId(null);
      setEditValues({});

      // Refetch wishlists to reflect the changes
      queryClient.invalidateQueries({ queryKey: ["user-wishlists"] });
    } catch (error) {
      toast.error("Erro ao atualizar item");
    }
  };

  const handleSavePrivacy = async (listaId: number) => {
    try {
      const response = await fetch(`/api/listas-desejos/${listaId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id?.toString() || "",
        },
        body: JSON.stringify({ status: privacyValue }),
      });

      if (!response.ok) throw new Error("Erro ao atualizar privacidade");

      toast.success("Privacidade atualizada com sucesso!");
      setEditingPrivacy(null);

      // Refetch wishlists to reflect the changes
      queryClient.invalidateQueries({ queryKey: ["user-wishlists"] });
    } catch (error) {
      toast.error("Erro ao atualizar privacidade");
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
          <div className="text-center">
            <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-vitrii-text mb-3">
              Faça Login para Acessar
            </h2>
            <p className="text-vitrii-text-secondary mb-6">
              Você precisa estar logado para visualizar suas listas de desejos.
            </p>
            <button
              onClick={() => navigate("/auth/signin")}
              className="inline-flex items-center gap-2 bg-vitrii-blue text-white px-6 py-3 rounded-lg font-semibold hover:bg-vitrii-blue-dark transition-colors"
            >
              Fazer Login
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <div className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Header */}
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 text-vitrii-blue hover:text-vitrii-blue-dark mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-vitrii-text mb-2 flex items-center gap-3">
            <Heart className="w-8 h-8 text-red-500" />
            Minha Lista de Desejos
          </h1>
          <p className="text-vitrii-text-secondary">
            Gerencie seus itens salvos e acompanhe os preços desejados
          </p>
        </div>

        {listasLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Loader className="w-8 h-8 text-vitrii-blue animate-spin mx-auto mb-3" />
              <p className="text-vitrii-text-secondary">Carregando...</p>
            </div>
          </div>
        ) : listas.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
            <Heart className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-vitrii-text mb-3">
              Nenhuma Lista Criada
            </h2>
            <p className="text-vitrii-text-secondary mb-6">
              Comece a adicionar anúncios à sua lista de desejos para
              acompanhar produtos e preços.
            </p>
            <button
              onClick={() => navigate("/browse")}
              className="inline-flex items-center gap-2 bg-vitrii-blue text-white px-6 py-3 rounded-lg font-semibold hover:bg-vitrii-blue-dark transition-colors"
            >
              Ver Anúncios
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Lista Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white border-2 border-gray-200 rounded-lg p-6 sticky top-20">
                <h3 className="font-bold text-vitrii-text mb-4">Minhas Listas</h3>
                <div className="space-y-2">
                  {listas.map((lista) => (
                    <button
                      key={lista.id}
                      onClick={() => setSelectedListaId(lista.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors font-semibold ${
                        selectedListaId === lista.id
                          ? "bg-vitrii-blue text-white"
                          : "bg-gray-50 text-vitrii-text hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="line-clamp-1">{lista.titulo}</p>
                          <p className="text-xs opacity-75">
                            {lista.itens.length} item
                            {lista.itens.length !== 1 ? "ns" : ""}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Items Grid */}
            <div className="lg:col-span-3">
              {selectedLista ? (
                <div>
                  <div className="mb-6 bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-2xl font-bold text-vitrii-text mb-2">
                          {selectedLista.titulo}
                        </h2>
                        <p className="text-vitrii-text-secondary">
                          {selectedLista.itens.length} item
                          {selectedLista.itens.length !== 1 ? "ns" : ""}
                        </p>
                        {selectedLista.usuario && (
                          <button
                            onClick={() => navigate(`/perfil/${selectedLista.usuario?.id}`)}
                            className="text-sm text-vitrii-blue hover:text-vitrii-blue-dark flex items-center gap-1 mt-2 transition-colors font-semibold"
                          >
                            <UserIcon className="w-4 h-4" />
                            Por {selectedLista.usuario.nome}
                          </button>
                        )}
                      </div>

                      {/* Privacy Control */}
                      {selectedLista.usuarioId === user?.id && (
                        <div>
                          {editingPrivacy === selectedLista.id ? (
                            <div className="flex gap-2">
                              <select
                                value={privacyValue || selectedLista.status}
                                onChange={(e) => setPrivacyValue(e.target.value)}
                                className="px-3 py-1 border border-gray-300 rounded text-sm"
                              >
                                <option value="privado">🔒 Apenas Eu</option>
                                <option value="publico">🌐 Pública</option>
                                <option value="anunciante">👤 Apenas Anunciante</option>
                              </select>
                              <button
                                onClick={() => handleSavePrivacy(selectedLista.id)}
                                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                              >
                                Salvar
                              </button>
                              <button
                                onClick={() => setEditingPrivacy(null)}
                                className="px-3 py-1 bg-gray-400 text-white rounded text-sm hover:bg-gray-500"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingPrivacy(selectedLista.id);
                                setPrivacyValue(selectedLista.status);
                              }}
                              className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                            >
                              {selectedLista.status === "privado" && <Lock className="w-4 h-4" />}
                              {selectedLista.status === "publico" && <Globe className="w-4 h-4" />}
                              {selectedLista.status === "anunciante" && <UserIcon className="w-4 h-4" />}
                              {selectedLista.status === "privado" && "Apenas Eu"}
                              {selectedLista.status === "publico" && "Pública"}
                              {selectedLista.status === "anunciante" && "Apenas Anunciante"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedLista.itens.length === 0 ? (
                    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <Heart className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-600">
                        Nenhum item nesta lista ainda
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedLista.itens.map((item) => (
                        <div
                          key={item.id}
                          className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Image with Fallback */}
                            <AdImageWithFallback
                              src={item.imagem || null}
                              alt={getImageAlt(item.titulo)}
                              containerClassName="h-32 w-32 rounded-lg flex-shrink-0"
                              fallbackText={item.titulo?.substring(0, 10) || "Imagem"}
                            />

                            {/* Info */}
                            <div className="md:col-span-2">
                              <h3 className="text-lg font-bold text-vitrii-text mb-2 line-clamp-2">
                                {item.titulo}
                              </h3>
                              {item.descricao && (
                                <p className="text-sm text-vitrii-text-secondary mb-3 line-clamp-2">
                                  {item.descricao}
                                </p>
                              )}

                              {item.tipo === "anuncio_copia" && item.anuncioId && (
                                <button
                                  onClick={() =>
                                    navigate(`/anuncio/${item.anuncioId}`)
                                  }
                                  className="text-sm text-vitrii-blue hover:text-vitrii-blue-dark font-semibold"
                                >
                                  Ver Anúncio →
                                </button>
                              )}
                            </div>

                            {/* Prices & Actions */}
                            <div className="space-y-4">
                              <div>
                                {item.preco && (
                                  <div className="mb-2">
                                    <p className="text-xs text-gray-600">
                                      Preço Original
                                    </p>
                                    <p className="text-lg font-bold text-vitrii-blue">
                                      R$ {parseFloat(item.preco.toString()).toFixed(2)}
                                    </p>
                                  </div>
                                )}

                                {editingItemId === item.id ? (
                                  <div className="space-y-2">
                                    <div>
                                      <p className="text-xs text-gray-600">
                                        Preço Desejado
                                      </p>
                                      <div className="flex items-center gap-1">
                                        <span className="text-sm">R$</span>
                                        <input
                                          type="number"
                                          value={
                                            editValues.preco_desejado || ""
                                          }
                                          onChange={(e) =>
                                            setEditValues({
                                              ...editValues,
                                              preco_desejado: e.target.value
                                                ? parseFloat(e.target.value)
                                                : undefined,
                                            })
                                          }
                                          step="0.01"
                                          min="0"
                                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                                          placeholder="0,00"
                                        />
                                      </div>
                                    </div>

                                    <div>
                                      <p className="text-xs text-gray-600">
                                        Prioridade (opcional)
                                      </p>
                                      <select
                                        value={editValues.prioridade || ""}
                                        onChange={(e) =>
                                          setEditValues({
                                            ...editValues,
                                            prioridade: e.target.value
                                              ? parseInt(e.target.value)
                                              : undefined,
                                          })
                                        }
                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                      >
                                        <option value="">Sem prioridade</option>
                                        <option value="1">1 - Salvo</option>
                                        <option value="2">2 - Pensando</option>
                                        <option value="3">3 - Gostei</option>
                                        <option value="4">4 - Quero Muito</option>
                                        <option value="5">5 - Adorei</option>
                                      </select>
                                    </div>

                                    <div>
                                      <p className="text-xs text-gray-600">
                                        Observações
                                      </p>
                                      <textarea
                                        value={editValues.observacoes || ""}
                                        onChange={(e) =>
                                          setEditValues({
                                            ...editValues,
                                            observacoes: e.target.value,
                                          })
                                        }
                                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs resize-none"
                                        rows={2}
                                        placeholder="Observações..."
                                      />
                                    </div>

                                    <div className="flex gap-2">
                                      <button
                                        onClick={() =>
                                          handleSaveEdit(
                                            selectedLista.id,
                                            item.id
                                          )
                                        }
                                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-xs font-semibold hover:bg-green-700 transition-colors"
                                      >
                                        <Save className="w-3 h-3" />
                                        Salvar
                                      </button>
                                      <button
                                        onClick={() => setEditingItemId(null)}
                                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1 border border-gray-300 text-gray-600 rounded text-xs font-semibold hover:bg-gray-50 transition-colors"
                                      >
                                        <X className="w-3 h-3" />
                                        Cancelar
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    {item.preco_desejado && (
                                      <div className="mb-2">
                                        <p className="text-xs text-gray-600">
                                          Preço Desejado
                                        </p>
                                        <p className="text-lg font-bold text-green-600">
                                          R${" "}
                                          {item.preco_desejado.toFixed(2)}
                                        </p>
                                      </div>
                                    )}

                                    {item.prioridade && (
                                      <div className="mb-2">
                                        <p className="text-xs text-gray-600">
                                          Prioridade
                                        </p>
                                        <div className="inline-block">
                                          {item.prioridade === 1 && (
                                            <span className="text-xs font-bold bg-gray-100 text-gray-800 px-2 py-1 rounded">
                                              💾 Salvo
                                            </span>
                                          )}
                                          {item.prioridade === 2 && (
                                            <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                              🤔 Pensando
                                            </span>
                                          )}
                                          {item.prioridade === 3 && (
                                            <span className="text-xs font-bold bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                              👍 Gostei
                                            </span>
                                          )}
                                          {item.prioridade === 4 && (
                                            <span className="text-xs font-bold bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                              🔥 Quero Muito
                                            </span>
                                          )}
                                          {item.prioridade === 5 && (
                                            <span className="text-xs font-bold bg-red-100 text-red-800 px-2 py-1 rounded">
                                              ❤️ Adorei
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {item.observacoes && (
                                      <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-2">
                                        <p className="text-xs text-blue-800">
                                          {item.observacoes}
                                        </p>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>

                              {editingItemId !== item.id && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingItemId(item.id);
                                      setEditValues({
                                        preco_desejado:
                                          item.preco_desejado || undefined,
                                        prioridade:
                                          item.prioridade || undefined,
                                        observacoes:
                                          item.observacoes || undefined,
                                      });
                                    }}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border-2 border-vitrii-blue text-vitrii-blue rounded-lg hover:bg-blue-50 transition-colors font-semibold text-sm"
                                  >
                                    <Edit className="w-4 h-4" />
                                    Editar
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteItem(selectedLista.id, item.id)
                                    }
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-semibold text-sm"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Remover
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16">
                  <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">Selecione uma lista</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
