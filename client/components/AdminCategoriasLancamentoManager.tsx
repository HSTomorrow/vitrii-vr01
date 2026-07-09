import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Edit2, Lock, Unlock, X } from "lucide-react";

interface CategoriaLancamento {
  id: number;
  codigo: string;
  descricao: string;
  status: "ativo" | "desativado";
  dataCriacao: string;
}

interface FormData {
  codigo: string;
  descricao: string;
  status: "ativo" | "desativado";
}

const emptyForm: FormData = { codigo: "", descricao: "", status: "ativo" };

export default function AdminCategoriasLancamentoManager() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ["categorias-lancamento"],
    queryFn: async () => {
      const response = await fetch("/api/categorias-lancamento");
      if (!response.ok) throw new Error("Erro ao buscar categorias");
      return response.json();
    },
  });

  const categorias = (data?.data || []) as CategoriaLancamento[];

  const createMutation = useMutation({
    mutationFn: async (payload: FormData) => {
      const response = await fetch("/api/categorias-lancamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error((await response.json()).error || "Erro ao criar categoria");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias-lancamento"] });
      toast.success("Categoria criada com sucesso!");
      resetForm();
      setShowForm(false);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao criar"),
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: FormData) => {
      if (!editingId) throw new Error("ID não encontrado");
      const response = await fetch(`/api/categorias-lancamento/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error((await response.json()).error || "Erro ao atualizar categoria");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias-lancamento"] });
      toast.success("Categoria atualizada com sucesso!");
      resetForm();
      setShowForm(false);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao atualizar"),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/categorias-lancamento/${id}/status`, {
        method: "PATCH",
      });
      if (!response.ok) throw new Error((await response.json()).error || "Erro ao alterar status");
      return response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["categorias-lancamento"] });
      toast.success(result.message);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao alterar status"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.codigo.trim()) {
      toast.error("Código é obrigatório");
      return;
    }
    if (!formData.descricao.trim()) {
      toast.error("Descrição é obrigatória");
      return;
    }

    if (editingId) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (categoria: CategoriaLancamento) => {
    setEditingId(categoria.id);
    setFormData({
      codigo: categoria.codigo,
      descricao: categoria.descricao,
      status: categoria.status,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData(emptyForm);
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-vitrii-text">
          Categorias de Lançamento
        </h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-vitrii-blue text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          <Plus className="w-5 h-5" />
          Nova Categoria
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-vitrii-text">
              {editingId ? "Editar Categoria" : "Criar Categoria"}
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
              <div>
                <label className="block text-sm font-semibold text-vitrii-text mb-2">
                  Código *
                </label>
                <input
                  type="text"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  placeholder="mensalidade"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vitrii-blue focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-vitrii-text mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as "ativo" | "desativado" })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vitrii-blue focus:border-transparent"
                >
                  <option value="ativo">Ativo</option>
                  <option value="desativado">Desativado</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-vitrii-text mb-2">
                Descrição *
              </label>
              <input
                type="text"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Mensalidade"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vitrii-blue focus:border-transparent"
              />
            </div>

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

      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Carregando categorias...</div>
        ) : categorias.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Nenhuma categoria cadastrada</div>
        ) : (
          categorias.map((categoria) => (
            <div
              key={categoria.id}
              className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex-1">
                <h4 className="font-semibold text-vitrii-text">{categoria.descricao}</h4>
                <p className="text-sm text-gray-600">{categoria.codigo}</p>
                <div className="flex gap-2 mt-2">
                  <span
                    className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                      categoria.status === "ativo"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {categoria.status === "ativo" ? "Ativo" : "Desativado"}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(categoria)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Editar"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => toggleStatusMutation.mutate(categoria.id)}
                  disabled={toggleStatusMutation.isPending}
                  className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                    categoria.status === "ativo"
                      ? "text-red-600 hover:bg-red-50"
                      : "text-green-600 hover:bg-green-50"
                  }`}
                  title={categoria.status === "ativo" ? "Bloquear" : "Desbloquear"}
                >
                  {categoria.status === "ativo" ? (
                    <Lock className="w-5 h-5" />
                  ) : (
                    <Unlock className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
