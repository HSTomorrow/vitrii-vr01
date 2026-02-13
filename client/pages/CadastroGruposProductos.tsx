import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Plus, Trash2, Edit2 } from "lucide-react";

interface Loja {
  id: number;
  nome: string;
}

interface GrupoDeProductos {
  id: number;
  anuncianteId: number;
  nome: string;
  descricao?: string;
  anunciante?: Loja;
}

export default function CadastroGruposProductos() {
  const { user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    anuncianteId: "",
    nome: "",
    descricao: "",
  });

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

  // Fetch grupos with user context
  const { data: grupos, refetch } = useQuery<GrupoDeProductos[]>({
    queryKey: ["grupos-produtos", user?.id],
    queryFn: async () => {
      const headers: Record<string, string> = {};
      if (user?.id) {
        headers["x-user-id"] = user.id.toString();
      }

      const response = await fetch("/api/grupos-productos", { headers });
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
      setFormData({ anuncianteId: "", nome: "", descricao: "" });
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
      if (!response.ok) throw new Error("Erro ao deletar grupo");
      return response.json();
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

  const handleEdit = (grupo: GrupoDeProductos) => {
    setFormData({
      anuncianteId: grupo.anuncianteId.toString(),
      nome: grupo.nome,
      descricao: grupo.descricao || "",
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-vitrii-text">
            Cadastro de Grupos de Produtos
          </h1>
          <button
            onClick={() => {
              setIsFormOpen(!isFormOpen);
              setEditingId(null);
              setFormData({ anuncianteId: "", nome: "", descricao: "" });
            }}
            className="flex items-center gap-2 px-4 py-2 bg-vitrii-yellow text-vitrii-text rounded-lg hover:bg-vitrii-yellow-dark transition-colors font-semibold"
          >
            <Plus className="w-5 h-5" />
            Novo Grupo
          </button>
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
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {!grupos || grupos.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
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
                      <td className="px-4 py-4 flex gap-2">
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
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
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
