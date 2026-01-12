import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Plus, Trash2, Edit2, Palette } from "lucide-react";

interface Loja {
  id: number;
  nome: string;
}

interface GrupoDeProductos {
  id: number;
  nome: string;
  lojaId: number;
}

interface Producto {
  id: number;
  grupoId: number;
  nome: string;
  descricao?: string;
  sku?: string;
  grupo?: GrupoDeProductos;
}

export default function CadastroProdutos() {
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedLojaId, setSelectedLojaId] = useState("");
  const [formData, setFormData] = useState({
    grupoId: "",
    nome: "",
    descricao: "",
    sku: "",
    tipo: "produto",
  });

  // Fetch lojas
  const { data: lojas = [] } = useQuery<Loja[]>({
    queryKey: ["lojas"],
    queryFn: async () => {
      const response = await fetch("/api/lojas");
      if (!response.ok) throw new Error("Erro ao buscar lojas");
      const result = await response.json();
      return result.data || [];
    },
  });

  // Fetch grupos for selected loja
  const { data: grupos = [] } = useQuery<GrupoDeProductos[]>({
    queryKey: ["grupos", selectedLojaId],
    queryFn: async () => {
      if (!selectedLojaId) return [];
      const response = await fetch(
        `/api/lojas/${selectedLojaId}/grupos-productos`,
      );
      if (!response.ok) throw new Error("Erro ao buscar grupos");
      const result = await response.json();
      return result.data || [];
    },
    enabled: !!selectedLojaId,
  });

  // Fetch produtos
  const { data: productos, refetch } = useQuery<Producto[]>({
    queryKey: ["productos"],
    queryFn: async () => {
      const response = await fetch("/api/productos");
      if (!response.ok) throw new Error("Erro ao buscar produtos");
      const result = await response.json();
      return result.data || [];
    },
  });

  // Save producto mutation
  const saveProductoMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const url = editingId ? `/api/productos/${editingId}` : "/api/productos";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grupoId: parseInt(data.grupoId),
          nome: data.nome,
          descricao: data.descricao,
          sku: data.sku,
          tipo: data.tipo,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao salvar produto");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success(
        editingId
          ? "Produto atualizado com sucesso!"
          : "Produto criado com sucesso!",
      );
      setFormData({
        grupoId: "",
        nome: "",
        descricao: "",
        sku: "",
        tipo: "produto",
      });
      setEditingId(null);
      setIsFormOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Erro ao salvar produto",
      );
    },
  });

  // Delete producto mutation
  const deleteProductoMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/productos/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Erro ao deletar produto");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Produto deletado com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Erro ao deletar produto",
      );
    },
  });

  const handleEdit = (producto: Producto) => {
    setFormData({
      grupoId: producto.grupoId.toString(),
      nome: producto.nome,
      descricao: producto.descricao || "",
      sku: producto.sku || "",
      tipo: (producto as any).tipo || "produto",
    });
    if (producto.grupo) {
      setSelectedLojaId(producto.grupo.lojaId.toString());
    }
    setEditingId(producto.id);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.grupoId) {
      toast.error("Selecione um grupo");
      return;
    }
    saveProductoMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-vitrii-text">
            Cadastro de Produtos
          </h1>
          <button
            onClick={() => {
              setIsFormOpen(!isFormOpen);
              setEditingId(null);
              setFormData({
                grupoId: "",
                nome: "",
                descricao: "",
                sku: "",
                tipo: "produto",
              });
            }}
            className="flex items-center gap-2 px-4 py-2 bg-vitrii-yellow text-vitrii-text rounded-lg hover:bg-vitrii-yellow-dark transition-colors font-semibold"
          >
            <Plus className="w-5 h-5" />
            Novo Produto
          </button>
        </div>

        {/* Form */}
        {isFormOpen && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-vitrii-text mb-6">
              {editingId ? "Editar Produto" : "Criar Novo Produto"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-vitrii-text mb-2">
                    Loja *
                  </label>
                  <select
                    required
                    value={selectedLojaId}
                    onChange={(e) => {
                      setSelectedLojaId(e.target.value);
                      setFormData({ ...formData, grupoId: "" });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-vitrii-blue focus:ring-2 focus:ring-vitrii-blue focus:ring-opacity-50"
                  >
                    <option value="">Selecione uma loja</option>
                    {lojas.map((loja) => (
                      <option key={loja.id} value={loja.id}>
                        {loja.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-vitrii-text mb-2">
                    Grupo de Produtos *
                  </label>
                  <select
                    required
                    value={formData.grupoId}
                    onChange={(e) =>
                      setFormData({ ...formData, grupoId: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-vitrii-blue focus:ring-2 focus:ring-vitrii-blue focus:ring-opacity-50"
                  >
                    <option value="">Selecione um grupo</option>
                    {grupos.map((grupo) => (
                      <option key={grupo.id} value={grupo.id}>
                        {grupo.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-vitrii-text mb-2">
                    Nome do Produto *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) =>
                      setFormData({ ...formData, nome: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-vitrii-blue focus:ring-2 focus:ring-vitrii-blue focus:ring-opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-vitrii-text mb-2">
                    Codigo Identificacao \ QRCode (SKU) (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) =>
                      setFormData({ ...formData, sku: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-vitrii-blue focus:ring-2 focus:ring-vitrii-blue focus:ring-opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-vitrii-text mb-2">
                    Tipo *
                  </label>
                  <select
                    value={formData.tipo}
                    onChange={(e) =>
                      setFormData({ ...formData, tipo: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-vitrii-blue focus:ring-2 focus:ring-vitrii-blue focus:ring-opacity-50"
                  >
                    <option value="produto">Produto</option>
                    <option value="servico">Serviço</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-vitrii-text mb-2">
                  Descrição (Opcional)
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) =>
                    setFormData({ ...formData, descricao: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-vitrii-blue focus:ring-2 focus:ring-vitrii-blue focus:ring-opacity-50"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={saveProductoMutation.isPending}
                  className="px-6 py-2 bg-vitrii-blue text-white rounded-lg hover:bg-vitrii-blue-dark transition-colors font-semibold disabled:opacity-50"
                >
                  {saveProductoMutation.isPending ? "Salvando..." : "Salvar"}
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

        {/* Productos List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-vitrii-gray">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-vitrii-text">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-vitrii-text">
                    Grupo
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-vitrii-text">
                    Codigo Identificacao \ QRCode (SKU)
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-vitrii-text">
                    Descrição
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-vitrii-text">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {!productos || productos.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      Nenhum produto cadastrado
                    </td>
                  </tr>
                ) : (
                  productos.map((producto) => (
                    <tr key={producto.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-semibold text-vitrii-text">
                        {producto.nome}
                      </td>
                      <td className="px-6 py-4 text-vitrii-text">
                        {producto.grupo?.nome || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-vitrii-text">
                        {producto.sku || "-"}
                      </td>
                      <td className="px-6 py-4 text-vitrii-text">
                        {producto.descricao || "-"}
                      </td>
                      <td className="px-6 py-4 flex gap-2">
                        <button
                          onClick={() =>
                            navigate(`/cadastros/variantes/${producto.id}`)
                          }
                          className="p-2 text-vitrii-blue hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar Variantes"
                        >
                          <Palette className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(producto)}
                          className="p-2 text-vitrii-blue hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                "Tem certeza que deseja deletar este produto?",
                              )
                            ) {
                              deleteProductoMutation.mutate(producto.id);
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
