import { useState, useEffect } from "react";
import { Heart, X, Plus, Loader, Check, AlertCircle, CheckCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface WishlistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anuncioId: number;
  anuncioTitulo: string;
  anuncioPreco?: number;
}

interface Wishlist {
  id: number;
  titulo: string;
  dataCriacao: string;
  itens: Array<{ id: number }>;
}

type ModalStep = "choice" | "wishlist" | "reserve-success";

export default function WishlistModal({
  open,
  onOpenChange,
  anuncioId,
  anuncioTitulo,
  anuncioPreco,
}: WishlistModalProps) {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<ModalStep>("choice");
  const [selectedListaId, setSelectedListaId] = useState<number | null>(null);
  const [precoDesejado, setPrecoDesejado] = useState<string>("");
  const [observacoes, setObservacoes] = useState<string>("");
  const [showNewListForm, setShowNewListForm] = useState(false);
  const [newListaTitulo, setNewListaTitulo] = useState<string>("");

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
    enabled: !!user?.id && open && isLoggedIn,
  });

  const listas: Wishlist[] = listasData?.data || [];

  // Create new wishlist mutation
  const createListaMutation = useMutation({
    mutationFn: async (titulo: string) => {
      const response = await fetch("/api/listas-desejos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id?.toString() || "",
        },
        body: JSON.stringify({
          titulo,
          status: "privado",
        }),
      });

      if (!response.ok) throw new Error("Erro ao criar lista");
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate the wishlists query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["user-wishlists"] });
      setSelectedListaId(data.data.id);
      setNewListaTitulo("");
      setShowNewListForm(false);
      toast.success("Lista de desejos criada com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao criar lista de desejos");
    },
  });

  // Add item to wishlist mutation
  const addItemMutation = useMutation({
    mutationFn: async () => {
      if (!selectedListaId) throw new Error("Selecione uma lista");

      const response = await fetch(
        `/api/listas-desejos/${selectedListaId}/itens/anuncio`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user?.id?.toString() || "",
          },
          body: JSON.stringify({
            anuncioId,
            preco_desejado: precoDesejado ? parseFloat(precoDesejado) : null,
            observacoes: observacoes || null,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao adicionar item");
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate the wishlists query to refresh the items count
      queryClient.invalidateQueries({ queryKey: ["user-wishlists"] });
      toast.success("Item adicionado à lista de desejos!");
      handleCloseModal();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Erro ao adicionar item"
      );
    },
  });

  // Create reservation mutation
  const createReservaMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `/api/anuncios/${anuncioId}/reservas`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user?.id?.toString() || "",
          },
          body: JSON.stringify({
            observacao: observacoes || null,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao criar reserva");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast.success("Reserva criada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["anuncio-fotos", anuncioId] });
      setStep("reserve-success");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Erro ao criar reserva"
      );
    },
  });

  const handleCreateNewList = async () => {
    if (!newListaTitulo.trim()) {
      toast.error("Digite um nome para a lista");
      return;
    }
    await createListaMutation.mutateAsync(newListaTitulo);
  };

  const handleAddToWishlist = async () => {
    if (!selectedListaId) {
      toast.error("Selecione uma lista de desejos");
      return;
    }

    try {
      await addItemMutation.mutateAsync();
    } catch (error) {
      // Error is handled by useMutation onError
    }
  };

  const handleCloseModal = () => {
    setStep("choice");
    setPrecoDesejado("");
    setObservacoes("");
    setSelectedListaId(null);
    setShowNewListForm(false);
    setNewListaTitulo("");
    onOpenChange(false);
  };

  if (!isLoggedIn) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reservar ou Salvar</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              Você precisa estar logado para reservar ou adicionar à lista de desejos
            </p>
            <button
              onClick={() => {
                onOpenChange(false);
                navigate("/auth/signin");
              }}
              className="inline-flex items-center gap-2 bg-vitrii-blue text-white px-6 py-2 rounded-lg font-semibold hover:bg-vitrii-blue-dark transition-colors"
            >
              Fazer Login
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleCloseModal}>
      <DialogContent className="max-w-md">
        {/* CHOICE STEP */}
        {step === "choice" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                O que você deseja fazer?
              </DialogTitle>
              <DialogDescription>
                Escolha como deseja interagir com "{anuncioTitulo}"
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Reserve Button */}
              <button
                onClick={() => {
                  setObservacoes("");
                  createReservaMutation.mutate();
                }}
                disabled={createReservaMutation.isPending}
                className="w-full flex flex-col items-start gap-2 px-4 py-4 border-2 border-green-300 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-900">Reservar</span>
                </div>
                <p className="text-sm text-green-700">
                  Garanta este produto para você. A quantidade disponível diminuirá.
                </p>
              </button>

              {/* Wishlist Button */}
              <button
                onClick={() => setStep("wishlist")}
                className="w-full flex flex-col items-start gap-2 px-4 py-4 border-2 border-purple-300 hover:bg-purple-50 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-purple-600" />
                  <span className="font-semibold text-purple-900">Salvar na Lista de Desejos</span>
                </div>
                <p className="text-sm text-purple-700">
                  Adicione a sua lista pessoal para acompanhar depois sem reservar.
                </p>
              </button>

              {/* Cancel Button */}
              <button
                onClick={() => handleCloseModal()}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </>
        )}

        {/* RESERVE SUCCESS STEP */}
        {step === "reserve-success" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Reserva Criada!
              </DialogTitle>
            </DialogHeader>
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-gray-700 mb-6">
                Você reservou "{anuncioTitulo}" com sucesso! O produto está garantido para você.
              </p>
              <button
                onClick={() => handleCloseModal()}
                className="inline-flex items-center gap-2 bg-vitrii-blue text-white px-6 py-2 rounded-lg font-semibold hover:bg-vitrii-blue-dark transition-colors"
              >
                <Check className="w-4 h-4" />
                Fechar
              </button>
            </div>
          </>
        )}

        {/* WISHLIST STEP */}
        {step === "wishlist" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                Adicionar à Lista de Desejos
              </DialogTitle>
              <DialogDescription>
                Salve "{anuncioTitulo}" na sua lista
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Select or Create List */}
              {!showNewListForm ? (
                <>
                  {listasLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader className="w-5 h-5 animate-spin text-gray-400" />
                    </div>
                  ) : listas.length === 0 ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800 mb-3">
                        Você ainda não tem listas de desejos
                      </p>
                      <button
                        onClick={() => setShowNewListForm(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-vitrii-blue text-white rounded-lg hover:bg-vitrii-blue-dark transition-colors font-semibold"
                      >
                        <Plus className="w-4 h-4" />
                        Criar Primeira Lista
                      </button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Selecionar Lista
                        </label>
                        <select
                          value={selectedListaId || ""}
                          onChange={(e) => setSelectedListaId(parseInt(e.target.value))}
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-vitrii-blue focus:outline-none"
                        >
                          <option value="">-- Selecione uma lista --</option>
                          {listas.map((lista) => (
                            <option key={lista.id} value={lista.id}>
                              {lista.titulo} ({lista.itens.length} itens)
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={() => setShowNewListForm(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                      >
                        <Plus className="w-4 h-4" />
                        Criar Nova Lista
                      </button>
                    </>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nome da Lista
                    </label>
                    <input
                      type="text"
                      value={newListaTitulo}
                      onChange={(e) => setNewListaTitulo(e.target.value)}
                      placeholder="Ex: Presentes, Futuros Projetos..."
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-vitrii-blue focus:outline-none"
                      autoFocus
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowNewListForm(false)}
                      disabled={createListaMutation.isPending}
                      className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleCreateNewList}
                      disabled={createListaMutation.isPending || !newListaTitulo.trim()}
                      className="flex-1 px-4 py-2 bg-vitrii-blue text-white rounded-lg hover:bg-vitrii-blue-dark transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {createListaMutation.isPending ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Criando...
                        </>
                      ) : (
                        "Criar"
                      )}
                    </button>
                  </div>
                </>
              )}

              {selectedListaId && !showNewListForm && (
                <>
                  {/* Preço Desejado */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Preço Desejado (opcional)
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">R$</span>
                      <input
                        type="number"
                        value={precoDesejado}
                        onChange={(e) => setPrecoDesejado(e.target.value)}
                        placeholder="0,00"
                        step="0.01"
                        min="0"
                        className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-vitrii-blue focus:outline-none"
                      />
                    </div>
                    {anuncioPreco && (
                      <p className="text-xs text-gray-500 mt-1">
                        Preço atual: R$ {anuncioPreco.toFixed(2)}
                      </p>
                    )}
                  </div>

                  {/* Observações */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Observações (opcional)
                    </label>
                    <textarea
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      placeholder="Ex: Esperar por desconto, Verificar estoque..."
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-vitrii-blue focus:outline-none resize-none"
                      rows={3}
                    />
                  </div>

                  {/* Add Button */}
                  <button
                    onClick={handleAddToWishlist}
                    disabled={addItemMutation.isPending}
                    className="w-full px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {addItemMutation.isPending ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Adicionando...
                      </>
                    ) : (
                      <>
                        <Heart className="w-4 h-4" />
                        Adicionar à Lista
                      </>
                    )}
                  </button>
                </>
              )}

              {/* Back Button */}
              <button
                onClick={() => setStep("choice")}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ← Voltar
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
