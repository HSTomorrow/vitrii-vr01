import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  Check,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";

interface Categoria {
  id: number;
  descricao: string;
  icone: string;
  ativo: boolean;
  dataCriacao: string;
  dataAtualizacao: string;
}

interface FormData {
  descricao: string;
  icone: string;
}

export default function AdminCategorias() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>({
    descricao: "",
    icone: "",
  });

  // Check if user is admin
  useEffect(() => {
    if (user && user.tipoUsuario !== "adm") {
      navigate("/");
    }
  }, [user, navigate]);

  // Fetch all categories
  const { data: categoriasData, isLoading } = useQuery({
    queryKey: ["categorias-admin"],
    queryFn: async () => {
      const response = await fetch("/api/categorias/admin/all", {
        headers: {
          "x-user-id": user?.id?.toString() || "",
        },
      });
      if (!response.ok) throw new Error("Erro ao buscar categorias");
      return response.json();
    },
    enabled: user?.tipoUsuario === "adm",
  });

  // Create/Update category mutation
  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (editingId) {
        const response = await fetch(`/api/categorias/${editingId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user?.id?.toString() || "",
          },
          body: JSON.stringify(data),
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Erro ao atualizar categoria");
        }
        return response.json();
      } else {
        const response = await fetch("/api/categorias", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user?.id?.toString() || "",
          },
          body: JSON.stringify(data),
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Erro ao criar categoria");
        }
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias-admin"] });
      toast.success(editingId ? "Categoria atualizada!" : "Categoria criada!");
      resetForm();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar categoria");
    },
  });

  // Delete category mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/categorias/${id}`, {
        method: "DELETE",
        headers: {
          "x-user-id": user?.id?.toString() || "",
        },
      });
      if (!response.ok) throw new Error("Erro ao deletar categoria");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias-admin"] });
      toast.success("Categoria deletada!");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao deletar categoria");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.descricao.trim()) {
      toast.error("Digite uma descrição");
      return;
    }

    if (!formData.icone.trim()) {
      toast.error("Escolha um ícone/emoji");
      return;
    }

    saveMutation.mutate(formData);
  };

  const startEdit = (categoria: Categoria) => {
    setEditingId(categoria.id);
    setFormData({
      descricao: categoria.descricao,
      icone: categoria.icone,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({ descricao: "", icone: "" });
    setEditingId(null);
    setShowForm(false);
  };

  const categoriasArray = (categoriasData || []) as Categoria[];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/admin")}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-vitrii-text" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-vitrii-text">
                  Gerenciar Categorias
                </h1>
                <p className="text-gray-600 mt-1">
                  Adicione e gerencie as categorias de produtos e serviços
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 bg-vitrii-blue text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              {showForm ? "Cancelar" : "Nova Categoria"}
            </button>
          </div>

          {/* Form */}
          {showForm && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-blue-200">
              <h2 className="text-xl font-bold text-vitrii-text mb-4">
                {editingId ? "Editar Categoria" : "Nova Categoria"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Descrição */}
                  <div>
                    <label className="block text-sm font-semibold text-vitrii-text mb-2">
                      Descrição *
                    </label>
                    <input
                      type="text"
                      value={formData.descricao}
                      onChange={(e) =>
                        setFormData({ ...formData, descricao: e.target.value })
                      }
                      placeholder="Ex: Roupas e Moda"
                      maxLength={100}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vitrii-blue focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.descricao.length}/100 caracteres
                    </p>
                  </div>

                  {/* Ícone */}
                  <div>
                    <label className="block text-sm font-semibold text-vitrii-text mb-2">
                      Ícone/Emoji *
                    </label>
                    <input
                      type="text"
                      value={formData.icone}
                      onChange={(e) =>
                        setFormData({ ...formData, icone: e.target.value })
                      }
                      placeholder="Ex: 👕 🚗 🏠"
                      maxLength={100}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vitrii-blue focus:border-transparent text-2xl"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Copie um emoji do seu teclado ou da internet
                    </p>
                  </div>
                </div>

                {/* Preview */}
                {formData.icone && formData.descricao && (
                  <div className="bg-blue-50 rounded-lg p-4 flex items-center gap-3">
                    <span className="text-4xl">{formData.icone}</span>
                    <div>
                      <p className="text-sm text-gray-600">Prévia:</p>
                      <p className="text-lg font-semibold text-vitrii-text">
                        {formData.descricao}
                      </p>
                    </div>
                  </div>
                )}

                {/* Submit */}
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={saveMutation.isPending}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold"
                  >
                    <Check className="w-5 h-5" />
                    {saveMutation.isPending
                      ? "Salvando..."
                      : editingId
                        ? "Atualizar"
                        : "Criar"}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Categories List */}
          <div className="bg-white rounded-lg shadow-md">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">
                Carregando categorias...
              </div>
            ) : categoriasArray.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 mb-4">
                  Nenhuma categoria cadastrada
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-vitrii-blue text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Criar Primeira Categoria
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b border-gray-300">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-vitrii-text">
                        Ícone
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-vitrii-text">
                        Descrição
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-vitrii-text">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-vitrii-text">
                        Criada em
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-vitrii-text">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {categoriasArray.map((categoria) => (
                      <tr
                        key={categoria.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-3xl">
                          {categoria.icone}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-vitrii-text">
                            {categoria.descricao}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
                              categoria.ativo
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {categoria.ativo ? (
                              <>
                                <Check className="w-4 h-4" />
                                Ativo
                              </>
                            ) : (
                              <>
                                <X className="w-4 h-4" />
                                Inativo
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(categoria.dataCriacao).toLocaleDateString(
                            "pt-BR"
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => startEdit(categoria)}
                              className="p-2 text-vitrii-blue hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                if (
                                  confirm(
                                    `Deseja deletar a categoria "${categoria.descricao}"?`
                                  )
                                ) {
                                  deleteMutation.mutate(categoria.id);
                                }
                              }}
                              disabled={deleteMutation.isPending}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Deletar"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Stats */}
          {categoriasArray.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
                <p className="text-gray-600 text-sm">Total de Categorias</p>
                <p className="text-3xl font-bold text-vitrii-text mt-2">
                  {categoriasArray.length}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
                <p className="text-gray-600 text-sm">Categorias Ativas</p>
                <p className="text-3xl font-bold text-vitrii-text mt-2">
                  {categoriasArray.filter((c) => c.ativo).length}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
