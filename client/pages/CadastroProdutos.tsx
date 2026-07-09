import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Plus, Trash2, Edit2, Palette, Power } from "lucide-react";
import Pagination from "@/components/Pagination";

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
  status?: "ativo" | "inativo";
  grupo?: GrupoDeProductos;
}

export default function CadastroProdutos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedLojaId, setSelectedLojaId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"ativo" | "inativo" | "todos">("ativo");
  const ITEMS_PER_PAGE = 20;
  const [formData, setFormData] = useState({
    grupoId: "",
    nome: "",
    descricao: "",
    sku: "",
    tipo: "produto",
  });

  // Listen for the custom event dispatched by the bottom nav's "+" button on this page
  useEffect(() => {
    const handleNovoProduto = () => {
      setIsFormOpen(true);
      setEditingId(null);
      setFormData({ grupoId: "", nome: "", descricao: "", sku: "", tipo: "produto" });
    };
    window.addEventListener("novoProduto", handleNovoProduto);
    return () => window.removeEventListener("novoProduto", handleNovoProduto);
  }, []);

  // Fetch lojas with user context
  const { data: lojas = [] } = useQuery<Loja[]>({
    queryKey: ["lojas", user?.id],
    queryFn: async () => {
      const headers: Record<string, string> = {};
      if (user?.id) {
        headers["x-user-id"] = user.id.toString();
      }

      const response = await fetch("/api/anunciantes", { headers });
      if (!response.ok) throw new Error("Erro ao buscar lojas");
      const result = await response.json();
      return result.data || [];
    },
    enabled: !!user,
  });

  // Fetch grupos for selected loja with user context
  const { data: grupos = [] } = useQuery<GrupoDeProductos[]>({
    queryKey: ["grupos", selectedLojaId, user?.id],
    queryFn: async () => {
      if (!selectedLojaId) return [];
      const headers: Record<string, string> = {};
      if (user?.id) {
        headers["x-user-id"] = user.id.toString();
      }

      const response = await fetch(
        `/api/grupos-productos?anuncianteId=${selectedLojaId}`,
        { headers },
      );
      if (!response.ok) throw new Error("Erro ao buscar grupos");
      const result = await response.json();
      return result.data || [];
    },
    enabled: !!selectedLojaId && !!user,
  });

  // Fetch produtos
  const { data: productos, refetch } = useQuery<Producto[]>({
    queryKey: ["productos", user?.id, statusFilter],
    queryFn: async () => {
      const headers: Record<string, string> = {};
      if (user?.id) {
        headers["x-user-id"] = user.id.toString();
      }

      const response = await fetch(`/api/productos?status=${statusFilter}`, { headers });
      if (!response.ok) throw new Error("Erro ao buscar produtos");
      const result = await response.json();
      return result.data || [];
    },
    enabled: !!user,
  });

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const productosPagina = (productos || []).slice(startIndex, startIndex + ITEMS_PER_PAGE);

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
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Erro ao deletar produto");
      return result;
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

  // Toggle producto status (ativo/inativo)
  const statusProductoMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: "ativo" | "inativo" }) => {
      const response = await fetch(`/api/productos/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Erro ao atualizar status do produto");
      return response.json();
    },
    onSuccess: (_data, variables) => {
      toast.success(variables.status === "ativo" ? "Produto ativado!" : "Produto desativado!");
      refetch();
    },
    onError: () => toast.error("Erro ao atualizar status do produto"),
  });

  const handleEdit = (producto: Producto) => {
    setFormData({
      grupoId: producto.grupoId ? producto.grupoId.toString() : "",
      nome: producto.nome,
      descricao: producto.descricao || "",
      sku: producto.sku || "",
      tipo: (producto as any).tipo || "produto",
    });
    if (producto.grupo && producto.grupo.lojaId) {
      setSelectedLojaId(producto.grupo.lojaId.toString());
    } else {
      setSelectedLojaId("");
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
        <div className="flex flex-wrap justify-between items-center gap-3 mb-8">
          <h1 className="text-3xl font-bold text-vitrii-text">
            Cadastro de Produtos
          </h1>
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as "ativo" | "inativo" | "todos");
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="ativo">Ativos</option>
              <option value="inativo">Desativados</option>
              <option value="todos">Todos</option>
            </select>
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
                    <option value="evento">Evento</option>
                    <option value="aulas_cursos">
                      Agendas de Aulas, Cursos e Serviços Especializados
                    </option>
                    <option value="oportunidade">
                      Oportunidade / Vaga de Emprego
                    </option>
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
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-vitrii-gray">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-vitrii-text whitespace-nowrap">
                    Nome
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-vitrii-text whitespace-nowrap">
                    Grupo
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-vitrii-text whitespace-nowrap">
                    SKU
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-vitrii-text whitespace-nowrap">
                    Descrição
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-vitrii-text whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-vitrii-text whitespace-nowrap">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {!productos || productos.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-4 text-center text-gray-500"
                    >
                      Nenhum produto cadastrado
                    </td>
                  </tr>
                ) : (
                  productosPagina.map((producto) => (
                    <tr key={producto.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 font-semibold text-vitrii-text text-sm">
                        {producto.nome}
                      </td>
                      <td className="px-4 py-4 text-vitrii-text text-sm">
                        {producto.grupo?.nome || "N/A"}
                      </td>
                      <td className="px-4 py-4 text-vitrii-text text-sm">
                        {producto.sku || "-"}
                      </td>
                      <td className="px-4 py-4 text-vitrii-text text-sm">
                        {producto.descricao || "-"}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            producto.status === "inativo"
                              ? "bg-gray-100 text-gray-600"
                              : "bg-vitrii-green/10 text-vitrii-green"
                          }`}
                        >
                          {producto.status === "inativo" ? "Inativo" : "Ativo"}
                        </span>
                      </td>
                      <td className="px-4 py-4 flex gap-2">
                        <button
                          onClick={() =>
                            statusProductoMutation.mutate({
                              id: producto.id,
                              status: producto.status === "inativo" ? "ativo" : "inativo",
                            })
                          }
                          className="p-2 text-vitrii-text-secondary hover:bg-gray-100 rounded-lg transition-colors"
                          title={producto.status === "inativo" ? "Ativar" : "Desativar"}
                        >
                          <Power className="w-4 h-4" />
                        </button>
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
                          title="Editar"
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
            {!productos || productos.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                Nenhum produto cadastrado
              </div>
            ) : (
              <div className="space-y-3 p-4">
                {productosPagina.map((producto) => (
                  <div
                    key={producto.id}
                    className="border border-gray-200 rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-vitrii-text truncate text-sm">
                          {producto.nome}
                        </h3>
                        <p className="text-xs text-vitrii-text-secondary mt-1">
                          {producto.grupo?.nome || "N/A"}
                        </p>
                        <span
                          className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                            producto.status === "inativo"
                              ? "bg-gray-100 text-gray-600"
                              : "bg-vitrii-green/10 text-vitrii-green"
                          }`}
                        >
                          {producto.status === "inativo" ? "Inativo" : "Ativo"}
                        </span>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() =>
                            statusProductoMutation.mutate({
                              id: producto.id,
                              status: producto.status === "inativo" ? "ativo" : "inativo",
                            })
                          }
                          className="p-2 text-vitrii-text-secondary hover:bg-gray-100 rounded-lg transition-colors"
                          title={producto.status === "inativo" ? "Ativar" : "Desativar"}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            navigate(`/cadastros/variantes/${producto.id}`)
                          }
                          className="p-2 text-vitrii-blue hover:bg-blue-50 rounded-lg transition-colors"
                          title="Variantes"
                        >
                          <Palette className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(producto)}
                          className="p-2 text-vitrii-blue hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
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
                          title="Deletar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {producto.sku && (
                        <div>
                          <p className="text-vitrii-text-secondary">SKU</p>
                          <p className="text-vitrii-text break-all">{producto.sku}</p>
                        </div>
                      )}
                      {producto.descricao && (
                        <div>
                          <p className="text-vitrii-text-secondary">Descrição</p>
                          <p className="text-vitrii-text line-clamp-2">
                            {producto.descricao}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={productos?.length || 0}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
