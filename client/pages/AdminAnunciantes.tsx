import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, Edit2, Trash2, Check, X, AlertCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Anunciante {
  id: number;
  nome: string;
  tipo: string;
  email?: string;
  telefone?: string;
  cidade?: string;
  estado?: string;
  status: string;
  localidadeId?: number | null;
  dataCriacao: string;
}

interface Localidade {
  id: number;
  codigo: string;
  municipio: string;
  estado: string;
  descricao?: string;
  status: string;
}

interface EditingData {
  email?: string;
  tipo?: string;
  localidadeId?: number | null;
  status?: string;
}

export default function AdminAnunciantes() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "Ativo" | "Desativado">(
    "all"
  );
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<EditingData>({});

  // Fetch all localidades
  const { data: localidadesData } = useQuery({
    queryKey: ["localidades-admin"],
    queryFn: async () => {
      const response = await fetch("/api/localidades?status=ativo&limit=500");
      if (!response.ok) throw new Error("Erro ao buscar localidades");
      return response.json();
    },
  });

  const localidades: Localidade[] = useMemo(() => {
    return (localidadesData?.data || []) as Localidade[];
  }, [localidadesData?.data]);

  // Fetch all anunciantes
  const { data: anunciantesData, isLoading } = useQuery({
    queryKey: ["anunciantes-admin"],
    queryFn: async () => {
      const response = await fetch(
        "/api/anunciantes?limit=500&includeInactive=true"
      );
      if (!response.ok) throw new Error("Erro ao buscar anunciantes");
      return response.json();
    },
  });

  // Mutation to update anunciante
  const updateMutation = useMutation({
    mutationFn: async (data: { id: number; updates: EditingData }) => {
      const response = await fetch(`/api/anunciantes/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.updates),
      });
      if (!response.ok) throw new Error("Erro ao atualizar anunciante");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anunciantes-admin"] });
      toast.success("Anunciante atualizado com sucesso!");
      setEditingId(null);
      setEditingData({});
    },
    onError: (error) => {
      toast.error("Erro ao atualizar anunciante");
      console.error(error);
    },
  });

  const anunciantes: Anunciante[] = useMemo(() => {
    const all = anunciantesData?.data || [];

    return all
      .filter((a: any) => {
        const matchesSearch =
          a.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.email?.toLowerCase().includes(searchTerm.toLowerCase());

        if (statusFilter === "all") return matchesSearch;
        return matchesSearch && a.status === statusFilter;
      })
      .sort((a: any, b: any) => a.nome.localeCompare(b.nome));
  }, [anunciantesData?.data, searchTerm, statusFilter]);

  const handleSave = (id: number) => {
    updateMutation.mutate({
      id,
      updates: editingData,
    });
  };

  const handleEdit = (anunciante: Anunciante) => {
    setEditingId(anunciante.id);
    setEditingData({
      email: anunciante.email,
      tipo: anunciante.tipo,
      localidadeId: anunciante.localidadeId,
      status: anunciante.status,
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Ativo":
        return "bg-green-100 text-green-700";
      case "Desativado":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-vitrii-text mb-2">
            Gerenciar Anunciantes
          </h1>
          <p className="text-vitrii-text-secondary">
            Gerencie o status dos anunciantes cadastrados na plataforma
          </p>
        </div>

        {/* Info Banner */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">
              Dica: Apenas anunciantes com status "Ativo" aparecerão nas páginas
              da plataforma
            </h3>
            <p className="text-sm text-blue-800">
              Anunciantes desativados não aparecerão para usuários finais, mas
              continuarão visíveis nesta página de administração.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Search */}
          <div>
            <label className="block text-sm font-semibold text-vitrii-text mb-2">
              Buscar por nome ou email
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Digite o nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-vitrii-blue"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-semibold text-vitrii-text mb-2">
              Filtrar por status
            </label>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "all" | "Ativo" | "Desativado")
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-vitrii-blue"
            >
              <option value="all">Todos</option>
              <option value="Ativo">Ativo</option>
              <option value="Desativado">Desativado</option>
            </select>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vitrii-blue mx-auto" />
          </div>
        ) : anunciantes.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-vitrii-text-secondary">
              Nenhum anunciante encontrado
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-vitrii-gray-light">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-vitrii-text">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-vitrii-text">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-vitrii-text">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-vitrii-text">
                    Localização
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-vitrii-text">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-vitrii-text">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {anunciantes.map((anunciante) => (
                  <tr
                    key={anunciante.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-vitrii-text">
                      {anunciante.nome}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {editingId === anunciante.id ? (
                        <input
                          type="email"
                          value={editingData.email || ""}
                          onChange={(e) =>
                            setEditingData({
                              ...editingData,
                              email: e.target.value || undefined,
                            })
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-vitrii-blue"
                          placeholder="email@example.com"
                        />
                      ) : (
                        <span className="text-vitrii-text-secondary">
                          {anunciante.email || "-"}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {editingId === anunciante.id ? (
                        <select
                          value={editingData.tipo || ""}
                          onChange={(e) =>
                            setEditingData({
                              ...editingData,
                              tipo: e.target.value,
                            })
                          }
                          className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-vitrii-blue"
                        >
                          <option value="Padrão">Padrão</option>
                          <option value="Profissional">Profissional</option>
                        </select>
                      ) : (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            anunciante.tipo === "Profissional"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {anunciante.tipo}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {editingId === anunciante.id ? (
                        <select
                          value={editingData.localidadeId || ""}
                          onChange={(e) =>
                            setEditingData({
                              ...editingData,
                              localidadeId: e.target.value ? parseInt(e.target.value) : null,
                            })
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-vitrii-blue"
                        >
                          <option value="">Sem localidade</option>
                          {localidades.map((localidade) => (
                            <option key={localidade.id} value={localidade.id}>
                              {localidade.descricao ||
                                `${localidade.municipio}, ${localidade.estado}`}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-vitrii-text-secondary">
                          {anunciante.localidadeId
                            ? localidades.find((l) => l.id === anunciante.localidadeId)
                                ?.descricao ||
                              localidades
                                .find((l) => l.id === anunciante.localidadeId)
                                ?.municipio
                            : "-"}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {editingId === anunciante.id ? (
                        <select
                          value={editingData.status || ""}
                          onChange={(e) =>
                            setEditingData({
                              ...editingData,
                              status: e.target.value,
                            })
                          }
                          className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:border-vitrii-blue"
                        >
                          <option value="Ativo">Ativo</option>
                          <option value="Desativado">Desativado</option>
                        </select>
                      ) : (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(anunciante.status)}`}
                        >
                          {anunciante.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {editingId === anunciante.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSave(anunciante.id)}
                            disabled={updateMutation.isPending}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            <Check className="w-4 h-4" />
                            Salvar
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditingData({});
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                          >
                            <X className="w-4 h-4" />
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEdit(anunciante)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-vitrii-blue text-white rounded hover:bg-vitrii-blue-dark transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                          Editar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary */}
        {anunciantes.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-vitrii-text-secondary mb-1">
                  Total de Anunciantes
                </p>
                <p className="text-2xl font-bold text-vitrii-text">
                  {anunciantesData?.data?.length || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-vitrii-text-secondary mb-1">
                  Anunciantes Ativos
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {anunciantesData?.data?.filter((a: any) => a.status === "Ativo")
                    .length || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-vitrii-text-secondary mb-1">
                  Anunciantes Desativados
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {anunciantesData?.data?.filter((a: any) => a.status === "Desativado")
                    .length || 0}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
