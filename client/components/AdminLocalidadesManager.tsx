import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, X, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Localidade {
  id: number;
  codigo: string;
  municipio: string;
  estado: string;
  descricao?: string;
  observacao?: string;
  status: "ativo" | "inativo";
  dataCriacao: string;
}

interface FormData {
  codigo: string;
  municipio: string;
  estado: string;
  descricao: string;
  observacao: string;
  status: "ativo" | "inativo";
}

export default function AdminLocalidadesManager() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState<FormData>({
    codigo: "",
    municipio: "",
    estado: "RS",
    descricao: "",
    observacao: "",
    status: "ativo",
  });

  // Fetch localidades
  const { data: localidadesData, isLoading } = useQuery({
    queryKey: ["localidades", searchQuery],
    queryFn: async () => {
      const response = await fetch(
        `/api/localidades?municipio=${encodeURIComponent(searchQuery)}&limit=100`,
      );
      if (!response.ok) throw new Error("Erro ao buscar localidades");
      return response.json();
    },
  });

  const localidades = (localidadesData?.data || []) as Localidade[];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch("/api/localidades", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id?.toString() || "",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao criar localidade");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["localidades"] });
      toast.success("Localidade criada com sucesso!");
      resetForm();
      setShowForm(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao criar");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!editingId) throw new Error("ID não encontrado");

      const response = await fetch(`/api/localidades/${editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id?.toString() || "",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao atualizar localidade");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["localidades"] });
      toast.success("Localidade atualizada com sucesso!");
      resetForm();
      setShowForm(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/localidades/${id}`, {
        method: "DELETE",
        headers: {
          "x-user-id": user?.id?.toString() || "",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao deletar localidade");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["localidades"] });
      toast.success("Localidade deletada com sucesso!");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao deletar");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.codigo.trim()) {
      toast.error("Código é obrigatório");
      return;
    }

    if (!formData.municipio.trim()) {
      toast.error("Município é obrigatório");
      return;
    }

    if (editingId) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (localidade: Localidade) => {
    setEditingId(localidade.id);
    setFormData({
      codigo: localidade.codigo,
      municipio: localidade.municipio,
      estado: localidade.estado,
      descricao: localidade.descricao || "",
      observacao: localidade.observacao || "",
      status: localidade.status,
    });
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja deletar esta localidade?")) {
      deleteMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      codigo: "",
      municipio: "",
      estado: "RS",
      descricao: "",
      observacao: "",
      status: "ativo",
    });
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-vitrii-text">
          Gerenciar Localidades
        </h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-vitrii-blue text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          <Plus className="w-5 h-5" />
          Nova Localidade
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-vitrii-text">
              {editingId ? "Editar Localidade" : "Criar Localidade"}
            </h3>
            <button
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="p-1 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Código */}
              <div>
                <label className="block text-sm font-semibold text-vitrii-text mb-2">
                  Código *
                </label>
                <input
                  type="text"
                  value={formData.codigo}
                  onChange={(e) =>
                    setFormData({ ...formData, codigo: e.target.value })
                  }
                  placeholder="RS-MONTENEGRO"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vitrii-blue focus:border-transparent"
                />
              </div>

              {/* Municipio */}
              <div>
                <label className="block text-sm font-semibold text-vitrii-text mb-2">
                  Município *
                </label>
                <input
                  type="text"
                  value={formData.municipio}
                  onChange={(e) =>
                    setFormData({ ...formData, municipio: e.target.value })
                  }
                  placeholder="Montenegro"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vitrii-blue focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Estado */}
              <div>
                <label className="block text-sm font-semibold text-vitrii-text mb-2">
                  Estado
                </label>
                <input
                  type="text"
                  value={formData.estado}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      estado: e.target.value.toUpperCase(),
                    })
                  }
                  maxLength={2}
                  placeholder="RS"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vitrii-blue focus:border-transparent"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-vitrii-text mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as "ativo" | "inativo",
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vitrii-blue focus:border-transparent"
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-semibold text-vitrii-text mb-2">
                Descrição
              </label>
              <textarea
                value={formData.descricao}
                onChange={(e) =>
                  setFormData({ ...formData, descricao: e.target.value })
                }
                placeholder="Descrição da localidade..."
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vitrii-blue focus:border-transparent"
              />
            </div>

            {/* Observação */}
            <div>
              <label className="block text-sm font-semibold text-vitrii-text mb-2">
                Observação
              </label>
              <textarea
                value={formData.observacao}
                onChange={(e) =>
                  setFormData({ ...formData, observacao: e.target.value })
                }
                placeholder="Observações..."
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vitrii-blue focus:border-transparent"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="flex-1 px-4 py-2 border-2 border-vitrii-blue text-vitrii-blue rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1 px-4 py-2 bg-vitrii-blue text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Salvando..."
                  : editingId
                    ? "Atualizar"
                    : "Criar"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-2">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por município..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vitrii-blue focus:border-transparent"
        />
      </div>

      {/* Localidades List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">
            Carregando localidades...
          </div>
        ) : localidades.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhuma localidade encontrada
          </div>
        ) : (
          localidades.map((localidade) => (
            <div
              key={localidade.id}
              className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex-1">
                <h4 className="font-semibold text-vitrii-text">
                  {localidade.municipio}, {localidade.estado}
                </h4>
                <p className="text-sm text-gray-600">{localidade.codigo}</p>
                {localidade.descricao && (
                  <p className="text-sm text-gray-500 mt-1">
                    {localidade.descricao}
                  </p>
                )}
                <div className="flex gap-2 mt-2">
                  <span
                    className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                      localidade.status === "ativo"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {localidade.status === "ativo" ? "Ativo" : "Inativo"}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(localidade)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Editar"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(localidade.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Deletar"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
