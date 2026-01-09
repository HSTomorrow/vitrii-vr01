import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Plus, Trash2, Edit2, ChevronLeft } from "lucide-react";

interface Variante {
  id: number;
  tamanho?: string;
  cor?: string;
  preco: number;
  precoCusto?: number;
}

interface Producto {
  id: number;
  nome: string;
  grupo?: { nome: string };
}

export default function CadastroVariantes() {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    tamanho: "",
    cor: "",
    preco: "",
    precoCusto: "",
  });

  // Fetch product details
  const { data: productData } = useQuery({
    queryKey: ["producto", productId],
    queryFn: async () => {
      const response = await fetch(`/api/productos/${productId}`);
      if (!response.ok) throw new Error("Erro ao buscar produto");
      return response.json();
    },
    enabled: !!productId,
  });

  // Fetch variantes
  const { data: variantesData, refetch } = useQuery({
    queryKey: ["variantes", productId],
    queryFn: async () => {
      const response = await fetch(`/api/tabelas-preco?productId=${productId}`);
      if (!response.ok) throw new Error("Erro ao buscar variantes");
      return response.json();
    },
    enabled: !!productId,
  });

  // Save variante mutation
  const saveVarianteMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const url = editingId ? `/api/tabelas-preco/${editingId}` : "/api/tabelas-preco";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: parseInt(productId || "0"),
          lojaId: productData?.data?.grupo?.lojaId || 0,
          tamanho: data.tamanho || null,
          cor: data.cor || null,
          preco: parseFloat(data.preco),
          precoCusto: data.precoCusto ? parseFloat(data.precoCusto) : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao salvar variante");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success(editingId ? "Variante atualizada com sucesso!" : "Variante criada com sucesso!");
      setFormData({ tamanho: "", cor: "", preco: "", precoCusto: "" });
      setEditingId(null);
      setIsFormOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar variante");
    },
  });

  // Delete variante mutation
  const deleteVarianteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/tabelas-preco/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Erro ao deletar variante");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Variante deletada com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao deletar variante");
    },
  });

  const handleEdit = (variante: Variante) => {
    setFormData({
      tamanho: variante.tamanho || "",
      cor: variante.cor || "",
      preco: variante.preco.toString(),
      precoCusto: variante.precoCusto?.toString() || "",
    });
    setEditingId(variante.id);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveVarianteMutation.mutate(formData);
  };

  const producto = productData?.data as Producto;
  const variantes = variantesData?.data || [];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/cadastros/productos")}
            className="inline-flex items-center text-walmart-blue hover:text-walmart-blue-dark font-semibold mb-4"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Voltar para Produtos
          </button>

          {producto && (
            <div>
              <h1 className="text-3xl font-bold text-walmart-text">{producto.nome}</h1>
              <p className="text-walmart-text-secondary mt-2">
                Gerenciar Variantes (Tamanho, Cor, Preço)
              </p>
              {producto.grupo && (
                <p className="text-sm text-walmart-text-secondary mt-1">
                  Grupo: {producto.grupo.nome}
                </p>
              )}
            </div>
          )}
        </div>

        {/* New Variante Button */}
        <div className="mb-8">
          <button
            onClick={() => {
              setIsFormOpen(!isFormOpen);
              setEditingId(null);
              setFormData({ tamanho: "", cor: "", preco: "", precoCusto: "" });
            }}
            className="flex items-center gap-2 px-4 py-2 bg-walmart-yellow text-walmart-text rounded-lg hover:bg-walmart-yellow-dark transition-colors font-semibold"
          >
            <Plus className="w-5 h-5" />
            Nova Variante
          </button>
        </div>

        {/* Form */}
        {isFormOpen && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-walmart-text mb-6">
              {editingId ? "Editar Variante" : "Criar Nova Variante"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-walmart-text mb-2">
                    Tamanho (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.tamanho}
                    onChange={(e) => setFormData({ ...formData, tamanho: e.target.value })}
                    placeholder="Ex: P, M, G, GG"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-walmart-blue focus:ring-2 focus:ring-walmart-blue focus:ring-opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-walmart-text mb-2">
                    Cor (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.cor}
                    onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                    placeholder="Ex: Azul, Vermelho"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-walmart-blue focus:ring-2 focus:ring-walmart-blue focus:ring-opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-walmart-text mb-2">
                    Preço *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.preco}
                    onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-walmart-blue focus:ring-2 focus:ring-walmart-blue focus:ring-opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-walmart-text mb-2">
                    Preço de Custo (Opcional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.precoCusto}
                    onChange={(e) => setFormData({ ...formData, precoCusto: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-walmart-blue focus:ring-2 focus:ring-walmart-blue focus:ring-opacity-50"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={saveVarianteMutation.isPending}
                  className="px-6 py-2 bg-walmart-blue text-white rounded-lg hover:bg-walmart-blue-dark transition-colors font-semibold disabled:opacity-50"
                >
                  {saveVarianteMutation.isPending ? "Salvando..." : "Salvar"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingId(null);
                  }}
                  className="px-6 py-2 bg-gray-300 text-walmart-text rounded-lg hover:bg-gray-400 transition-colors font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Variantes List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-walmart-gray">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-walmart-text">
                    Tamanho
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-walmart-text">
                    Cor
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-walmart-text">
                    Preço
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-walmart-text">
                    Preço de Custo
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-walmart-text">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {variantes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      Nenhuma variante cadastrada
                    </td>
                  </tr>
                ) : (
                  variantes.map((variante: Variante) => (
                    <tr key={variante.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-walmart-text">
                        {variante.tamanho || "-"}
                      </td>
                      <td className="px-6 py-4 text-walmart-text">
                        {variante.cor || "-"}
                      </td>
                      <td className="px-6 py-4 font-semibold text-walmart-text">
                        R$ {parseFloat(variante.preco.toString()).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-walmart-text">
                        {variante.precoCusto
                          ? `R$ ${parseFloat(variante.precoCusto.toString()).toFixed(2)}`
                          : "-"}
                      </td>
                      <td className="px-6 py-4 flex gap-2">
                        <button
                          onClick={() => handleEdit(variante)}
                          className="p-2 text-walmart-blue hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (
                              confirm("Tem certeza que deseja deletar esta variante?")
                            ) {
                              deleteVarianteMutation.mutate(variante.id);
                            }
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
