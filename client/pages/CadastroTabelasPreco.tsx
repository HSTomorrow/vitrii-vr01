import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Plus, Trash2, Edit2 } from "lucide-react";

interface Anunciante {
  id: number;
  nome: string;
}

interface Producto {
  id: number;
  nome: string;
}

interface TabelaDePreco {
  id: number;
  productId: number;
  anuncianteId: number;
  preco: number;
  precoCusto?: number;
  produto?: Producto;
  anunciante?: Anunciante;
}

export default function CadastroTabelasPreco() {
  const { user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedAnuncianteId, setSelectedAnuncianteId] = useState("");
  const [selectedGrupoId, setSelectedGrupoId] = useState("");
  const [formData, setFormData] = useState({
    productId: "",
    anuncianteId: "",
    preco: "",
    precoCusto: "",
  });

  // Fetch anunciantes
  const { data: anunciantes = [] } = useQuery<Anunciante[]>({
    queryKey: ["anunciantes"],
    queryFn: async () => {
      const response = await fetch("/api/anunciantes");
      if (!response.ok) throw new Error("Erro ao buscar anunciantes");
      const result = await response.json();
      return result.data || [];
    },
  });

  // Fetch grupos for selected anunciante with user context
  const { data: grupos = [] } = useQuery({
    queryKey: ["grupos", selectedAnuncianteId, user?.id],
    queryFn: async () => {
      if (!selectedAnuncianteId) return [];
      const headers: Record<string, string> = {};
      if (user?.id) {
        headers["x-user-id"] = user.id.toString();
      }

      const response = await fetch(
        `/api/grupos-productos?anuncianteId=${selectedAnuncianteId}`,
        { headers },
      );
      if (!response.ok) throw new Error("Erro ao buscar grupos");
      const result = await response.json();
      return result.data || [];
    },
    enabled: !!selectedAnuncianteId && !!user,
  });

  // Fetch productos for selected grupo
  const { data: productos = [] } = useQuery<Producto[]>({
    queryKey: ["productos-grupo", selectedGrupoId],
    queryFn: async () => {
      if (!selectedGrupoId) return [];
      const response = await fetch(
        `/api/grupos-productos/${selectedGrupoId}/productos`,
      );
      if (!response.ok) throw new Error("Erro ao buscar produtos");
      const result = await response.json();
      return result.data || [];
    },
    enabled: !!selectedGrupoId,
  });

  // Fetch tabelas
  const { data: tabelas, refetch } = useQuery<TabelaDePreco[]>({
    queryKey: ["tabelas-preco"],
    queryFn: async () => {
      const response = await fetch("/api/tabelas-preco");
      if (!response.ok) throw new Error("Erro ao buscar tabelas");
      const result = await response.json();
      return result.data || [];
    },
  });

  // Save tabela mutation
  const saveTabelaMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const url = editingId
        ? `/api/tabelas-preco/${editingId}`
        : "/api/tabelas-preco";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: parseInt(data.productId),
          anuncianteId: parseInt(data.anuncianteId),
          preco: parseFloat(data.preco),
          precoCusto: data.precoCusto ? parseFloat(data.precoCusto) : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao salvar tabela de preço");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success(
        editingId
          ? "Tabela atualizada com sucesso!"
          : "Tabela criada com sucesso!",
      );
      setFormData({
        productId: "",
        anuncianteId: "",
        preco: "",
        precoCusto: "",
      });
      setEditingId(null);
      setIsFormOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao salvar tabela de preço",
      );
    },
  });

  // Delete tabela mutation
  const deleteTabelaMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/tabelas-preco/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Erro ao deletar tabela");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Tabela deletada com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Erro ao deletar tabela",
      );
    },
  });

  const handleEdit = (tabela: TabelaDePreco) => {
    setFormData({
      productId: tabela.productId.toString(),
      anuncianteId: tabela.anuncianteId.toString(),
      preco: tabela.preco.toString(),
      precoCusto: tabela.precoCusto?.toString() || "",
    });
    setSelectedAnuncianteId(tabela.anuncianteId.toString());
    setEditingId(tabela.id);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId || !formData.anuncianteId || !formData.preco) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    saveTabelaMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-vitrii-text">
            Cadastro de Tabelas de Preço
          </h1>
          <button
            onClick={() => {
              setIsFormOpen(!isFormOpen);
              setEditingId(null);
              setFormData({
                productId: "",
                anuncianteId: "",
                preco: "",
                precoCusto: "",
              });
              setSelectedAnuncianteId("");
              setSelectedGrupoId("");
            }}
            className="flex items-center gap-2 px-4 py-2 bg-vitrii-yellow text-vitrii-text rounded-lg hover:bg-vitrii-yellow-dark transition-colors font-semibold"
          >
            <Plus className="w-5 h-5" />
            Nova Tabela
          </button>
        </div>

        {/* Form */}
        {isFormOpen && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-vitrii-text mb-6">
              {editingId
                ? "Editar Tabela de Preço"
                : "Criar Nova Tabela de Preço"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-vitrii-text mb-2">
                    Anunciante *
                  </label>
                  <select
                    required
                    value={selectedAnuncianteId}
                    onChange={(e) => {
                      setSelectedAnuncianteId(e.target.value);
                      setSelectedGrupoId("");
                      setFormData({
                        ...formData,
                        anuncianteId: e.target.value,
                        productId: "",
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-vitrii-blue focus:ring-2 focus:ring-vitrii-blue focus:ring-opacity-50"
                  >
                    <option value="">Selecione um anunciante</option>
                    {anunciantes.map((anunciante) => (
                      <option key={anunciante.id} value={anunciante.id}>
                        {anunciante.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-vitrii-text mb-2">
                    Grupo de Produtos e Servicos *
                  </label>
                  <select
                    required
                    value={selectedGrupoId}
                    onChange={(e) => {
                      setSelectedGrupoId(e.target.value);
                      setFormData({ ...formData, productId: "" });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-vitrii-blue focus:ring-2 focus:ring-vitrii-blue focus:ring-opacity-50"
                    disabled={!selectedAnuncianteId}
                  >
                    <option value="">Selecione um grupo</option>
                    {grupos.map((grupo: any) => (
                      <option key={grupo.id} value={grupo.id}>
                        {grupo.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-vitrii-text mb-2">
                    Produto *
                  </label>
                  <select
                    required
                    value={formData.productId}
                    onChange={(e) =>
                      setFormData({ ...formData, productId: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-vitrii-blue focus:ring-2 focus:ring-vitrii-blue focus:ring-opacity-50"
                    disabled={!selectedGrupoId}
                  >
                    <option value="">Selecione um produto</option>
                    {productos.map((producto) => (
                      <option key={producto.id} value={producto.id}>
                        {producto.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-vitrii-text mb-2">
                    Preço *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.preco}
                    onChange={(e) =>
                      setFormData({ ...formData, preco: e.target.value })
                    }
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-vitrii-blue focus:ring-2 focus:ring-vitrii-blue focus:ring-opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-vitrii-text mb-2">
                    Preço de Custo (Opcional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.precoCusto}
                    onChange={(e) =>
                      setFormData({ ...formData, precoCusto: e.target.value })
                    }
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-vitrii-blue focus:ring-2 focus:ring-vitrii-blue focus:ring-opacity-50"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={saveTabelaMutation.isPending}
                  className="px-6 py-2 bg-vitrii-blue text-white rounded-lg hover:bg-vitrii-blue-dark transition-colors font-semibold disabled:opacity-50"
                >
                  {saveTabelaMutation.isPending ? "Salvando..." : "Salvar"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingId(null);
                  }}
                  className="px-6 py-2 bg-gray-300 text-vitrii-text rounded-lg hover:bg-gray-400 transition-colors font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tabelas List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-vitrii-gray">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-vitrii-text whitespace-nowrap">
                    Anunciante
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-vitrii-text whitespace-nowrap">
                    Produto
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-vitrii-text whitespace-nowrap">
                    Preço
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-vitrii-text whitespace-nowrap">
                    Preço de Custo
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-vitrii-text whitespace-nowrap">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {!tabelas || tabelas.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-4 text-center text-gray-500"
                    >
                      Nenhuma tabela cadastrada
                    </td>
                  </tr>
                ) : (
                  tabelas.map((tabela) => (
                    <tr key={tabela.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 font-semibold text-vitrii-text text-sm">
                        {tabela.anunciante?.nome || "N/A"}
                      </td>
                      <td className="px-4 py-4 font-semibold text-vitrii-text text-sm">
                        {tabela.produto?.nome || "N/A"}
                      </td>
                      <td className="px-4 py-4 text-vitrii-text text-sm">
                        R$ {parseFloat(tabela.preco.toString()).toFixed(2)}
                      </td>
                      <td className="px-4 py-4 text-vitrii-text text-sm">
                        {tabela.precoCusto
                          ? `R$ ${parseFloat(tabela.precoCusto.toString()).toFixed(2)}`
                          : "-"}
                      </td>
                      <td className="px-4 py-4 flex gap-2">
                        <button
                          onClick={() => handleEdit(tabela)}
                          className="p-2 text-vitrii-blue hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                "Tem certeza que deseja deletar esta tabela?",
                              )
                            ) {
                              deleteTabelaMutation.mutate(tabela.id);
                            }
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Deletar"
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

          {/* Mobile Card View */}
          <div className="md:hidden">
            {!tabelas || tabelas.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                Nenhuma tabela cadastrada
              </div>
            ) : (
              <div className="space-y-3 p-4">
                {tabelas.map((tabela) => (
                  <div
                    key={tabela.id}
                    className="border border-gray-200 rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-vitrii-text truncate text-sm">
                          {tabela.produto?.nome || "N/A"}
                        </h3>
                        <p className="text-xs text-vitrii-text-secondary mt-1">
                          {tabela.anunciante?.nome || "N/A"}
                        </p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleEdit(tabela)}
                          className="p-2 text-vitrii-blue hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                "Tem certeza que deseja deletar esta tabela?",
                              )
                            ) {
                              deleteTabelaMutation.mutate(tabela.id);
                            }
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Deletar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-vitrii-text-secondary">Preço</p>
                        <p className="text-vitrii-text font-semibold">
                          R$ {parseFloat(tabela.preco.toString()).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-vitrii-text-secondary">Preço de Custo</p>
                        <p className="text-vitrii-text">
                          {tabela.precoCusto
                            ? `R$ ${parseFloat(tabela.precoCusto.toString()).toFixed(2)}`
                            : "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
