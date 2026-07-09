import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Plus, Trash2, Edit2, Power } from "lucide-react";

interface Loja {
  id: number;
  nome: string;
}

interface Categoria {
  id: number;
  descricao: string;
  icone: string;
}

interface GrupoDeProductos {
  id: number;
  anuncianteId: number;
  nome: string;
  descricao?: string;
  status?: "ativo" | "inativo";
  anunciante?: Loja;
  categoriaId?: number | null;
  categoriaRef?: Categoria | null;
}

export default function CadastroGruposProductos() {
  const { user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<"ativo" | "inativo" | "todos">("ativo");
  const [formData, setFormData] = useState({
    anuncianteId: "",
    nome: "",
    descricao: "",
    categoriaId: "",
  });

  // Listen for the custom event dispatched by the bottom nav's "+" button on this page
  useEffect(() => {
    const handleNovoGrupo = () => {
      setIsFormOpen(true);
      setEditingId(null);
      setFormData({ anuncianteId: "", nome: "", descricao: "", categoriaId: "" });
    };
    window.addEventListener("novoGrupo", handleNovoGrupo);
    return () => window.removeEventListener("novoGrupo", handleNovoGrupo);
  }, []);

  // Fetch anunciantes with user context
  const { data: anunciantes = [] } = useQuery<Loja[]>({
    queryKey: ["anunciantes", user?.id],
    queryFn: async () => {
      const headers: Record<string, string> = {};
      if (user?.id) {
        headers["x-user-id"] = user.id.toString();
      }

      const response = await fetch("/api/anunciantes", { headers });
      if (!response.ok) throw new Error("Erro ao buscar anunciantes");
      const result = await response.json();
      return result.data || [];
    },
    enabled: !!user,
  });

  // Fetch categorias for the category selector
  const { data: categorias = [] } = useQuery<Categoria[]>({
    queryKey: ["categorias"],
    queryFn: async () => {
      const response = await fetch("/api/categorias");
      if (!response.ok) throw new Error("Erro ao buscar categorias");
      return response.json();
    },
  });

  // Fetch grupos with user context
  const { data: grupos, refetch } = useQuery<GrupoDeProductos[]>({
    queryKey: ["grupos-produtos", user?.id, statusFilter],
    queryFn: async () => {
      const headers: Record<string, string> = {};
      if (user?.id) {
        headers["x-user-id"] = user.id.toString();
      }

      const response = await fetch(`/api/grupos-productos?status=${statusFilter}`, { headers });
      if (!response.ok) throw new Error("Erro ao buscar grupos");
      const result = await response.json();
      return result.data || [];
    },
    enabled: !!user,
  });

  // Save grupo mutation
  const saveGrupoMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const url = editingId
        ? `/api/grupos-productos/${editingId}`
        : "/api/grupos-productos";
      const method = editingId ? "PUT" : "POST";

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (user?.id) {
        headers["x-user-id"] = user.id.toString();
      }

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({
          anuncianteId: parseInt(data.anuncianteId),
          nome: data.nome,
          descricao: data.descricao,
          categoriaId: data.categoriaId ? parseInt(data.categoriaId) : null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao salvar grupo");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success(
        editingId
          ? "Grupo atualizado com sucesso!"
          : "Grupo criado com sucesso!",
      );
      setFormData({ anuncianteId: "", nome: "", descricao: "", categoriaId: "" });
      setEditingId(null);
      setIsFormOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Erro ao salvar grupo",
      );
    },
  });

  // Delete grupo mutation
  const deleteGrupoMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/grupos-productos/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Erro ao deletar grupo");
      return result;
    },
    onSuccess: () => {
      toast.success("Grupo deletado com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Erro ao deletar grupo",
      );
    },
  });

  // Toggle grupo status (ativo/inativo)
  const statusGrupoMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: "ativo" | "inativo" }) => {
      const response = await fetch(`/api/grupos-productos/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Erro ao atualizar status do grupo");
      return response.json();
    },
    onSuccess: (_data, variables) => {
      toast.success(variables.status === "ativo" ? "Grupo ativado!" : "Grupo desativado!");
      refetch();
    },
    onError: () => toast.error("Erro ao atualizar status do grupo"),
  });

  const handleEdit = (grupo: GrupoDeProductos) => {
    setFormData({
      anuncianteId: grupo.anuncianteId.toString(),
      nome: grupo.nome,
      descricao: grupo.descricao || "",
      categoriaId: grupo.categoriaId ? grupo.categoriaId.toString() : "",
    });
    setEditingId(grupo.id);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.anuncianteId) {
      toast.error("Selecione um anunciante");
      return;
    }
    saveGrupoMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-8">
          <h1 className="text-3xl font-bold text-vitrii-text">
            Cadastro de Grupos de Produtos
          </h1>
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "ativo" | "inativo" | "todos")}
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
                setFormData({ anuncianteId: "", nome: "", descricao: "", categoriaId: "" });
              }}
              className="flex items-center gap-2 px-4 py-2 bg-vitrii-yellow text-vitrii-text rounded-lg hover:bg-vitrii-yellow-dark transition-colors font-semibold"
            >
              <Plus className="w-5 h-5" />
              Novo Grupo
            </button>
          </div>
        </div>

        {/* Form */}
        {isFormOpen && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-vitrii-text mb-6">
              {editingId ? "Editar Grupo" : "Criar Novo Grupo"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-vitrii-text mb-2">
                    Anunciante *
                  </label>
                  <select
                    required
                    value={formData.anuncianteId}
                    onChange={(e) =>
                      setFormData({ ...formData, anuncianteId: e.target.value })
                    }
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
                    Nome do Grupo *
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
              </div>

              <div>
                <label className="block text-sm font-semibold text-vitrii-text mb-2">
                  Categoria (Opcional)
                </label>
                <select
                  value={formData.categoriaId}
                  onChange={(e) =>
                    setFormData({ ...formData, categoriaId: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-vitrii-blue focus:ring-2 focus:ring-vitrii-blue focus:ring-opacity-50"
                >
                  <option value="">Sem categoria específica</option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icone} {cat.descricao}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-vitrii-text-secondary">
                  Sugerida automaticamente nos anúncios criados a partir de um produto deste grupo.
                </p>
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
                  disabled={saveGrupoMutation.isPending}
                  className="px-6 py-2 bg-vitrii-blue text-white rounded-lg hover:bg-vitrii-blue-dark transition-colors font-semibold disabled:opacity-50"
                >
                  {saveGrupoMutation.isPending ? "Salvando..." : "Salvar"}
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

        {/* Grupos List */}
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
                    Nome
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
                {!grupos || grupos.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-4 text-center text-gray-500"
                    >
                      Nenhum grupo cadastrado
                    </td>
                  </tr>
                ) : (
                  grupos.map((grupo) => (
                    <tr key={grupo.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 font-semibold text-vitrii-text text-sm">
                        {grupo.anunciante?.nome || "N/A"}
                      </td>
                      <td className="px-4 py-4 font-semibold text-vitrii-text text-sm">
                        {grupo.nome}
                      </td>
                      <td className="px-4 py-4 text-vitrii-text text-sm">
                        {grupo.descricao || "-"}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            grupo.status === "inativo"
                              ? "bg-gray-100 text-gray-600"
                              : "bg-vitrii-green/10 text-vitrii-green"
                          }`}
                        >
                          {grupo.status === "inativo" ? "Inativo" : "Ativo"}
                        </span>
                      </td>
                      <td className="px-4 py-4 flex gap-2">
                        <button
                          onClick={() =>
                            statusGrupoMutation.mutate({
                              id: grupo.id,
                              status: grupo.status === "inativo" ? "ativo" : "inativo",
                            })
                          }
                          className="p-2 text-vitrii-text-secondary hover:bg-gray-100 rounded-lg transition-colors"
                          title={grupo.status === "inativo" ? "Ativar" : "Desativar"}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(grupo)}
                          className="p-2 text-vitrii-blue hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                "Tem certeza que deseja deletar este grupo?",
                              )
                            ) {
                              deleteGrupoMutation.mutate(grupo.id);
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
            {!grupos || grupos.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                Nenhum grupo cadastrado
              </div>
            ) : (
              <div className="space-y-3 p-4">
                {grupos.map((grupo) => (
                  <div
                    key={grupo.id}
                    className="border border-gray-200 rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-vitrii-text truncate text-sm">
                          {grupo.nome}
                        </h3>
                        <p className="text-xs text-vitrii-text-secondary mt-1">
                          {grupo.anunciante?.nome || "N/A"}
                        </p>
                        <span
                          className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                            grupo.status === "inativo"
                              ? "bg-gray-100 text-gray-600"
                              : "bg-vitrii-green/10 text-vitrii-green"
                          }`}
                        >
                          {grupo.status === "inativo" ? "Inativo" : "Ativo"}
                        </span>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() =>
                            statusGrupoMutation.mutate({
                              id: grupo.id,
                              status: grupo.status === "inativo" ? "ativo" : "inativo",
                            })
                          }
                          className="p-2 text-vitrii-text-secondary hover:bg-gray-100 rounded-lg transition-colors"
                          title={grupo.status === "inativo" ? "Ativar" : "Desativar"}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(grupo)}
                          className="p-2 text-vitrii-blue hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                "Tem certeza que deseja deletar este grupo?",
                              )
                            ) {
                              deleteGrupoMutation.mutate(grupo.id);
                            }
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Deletar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {grupo.descricao && (
                      <div>
                        <p className="text-xs text-vitrii-text-secondary">
                          Descrição
                        </p>
                        <p className="text-sm text-vitrii-text">
                          {grupo.descricao}
                        </p>
                      </div>
                    )}
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
