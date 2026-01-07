import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Plus, Trash2, Edit2 } from "lucide-react";

interface Loja {
  id: number;
  nome: string;
}

interface GrupoDeProductos {
  id: number;
  lojaId: number;
  nome: string;
  descricao?: string;
  loja?: Loja;
}

export default function CadastroGruposProductos() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    lojaId: "",
    nome: "",
    descricao: "",
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

  // Fetch grupos
  const { data: grupos, refetch } = useQuery<GrupoDeProductos[]>({
    queryKey: ["grupos-produtos"],
    queryFn: async () => {
      const response = await fetch("/api/grupos-productos");
      if (!response.ok) throw new Error("Erro ao buscar grupos");
      const result = await response.json();
      return result.data || [];
    },
  });

  // Save grupo mutation
  const saveGrupoMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const url = editingId ? `/api/grupos-productos/${editingId}` : "/api/grupos-productos";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lojaId: parseInt(data.lojaId),
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
      toast.success(editingId ? "Grupo atualizado com sucesso!" : "Grupo criado com sucesso!");
      setFormData({ lojaId: "", nome: "", descricao: "" });
      setEditingId(null);
      setIsFormOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar grupo");
    },
  });

  // Delete grupo mutation
  const deleteGrupoMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/grupos-productos/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Erro ao deletar grupo");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Grupo deletado com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao deletar grupo");
    },
  });

  const handleEdit = (grupo: GrupoDeProductos) => {
    setFormData({
      lojaId: grupo.lojaId.toString(),
      nome: grupo.nome,
      descricao: grupo.descricao || "",
    });
    setEditingId(grupo.id);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.lojaId) {
      toast.error("Selecione uma loja");
      return;
    }
    saveGrupoMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-walmart-text">Cadastro de Grupos de Produtos</h1>
          <button
            onClick={() => {
              setIsFormOpen(!isFormOpen);
              setEditingId(null);
              setFormData({ lojaId: "", nome: "", descricao: "" });
            }}
            className="flex items-center gap-2 px-4 py-2 bg-walmart-yellow text-walmart-text rounded-lg hover:bg-walmart-yellow-dark transition-colors font-semibold"
          >
            <Plus className="w-5 h-5" />
            Novo Grupo
          </button>
        </div>

        {/* Form */}
        {isFormOpen && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-walmart-text mb-6">
              {editingId ? "Editar Grupo" : "Criar Novo Grupo"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-walmart-text mb-2">
                    Loja *
                  </label>
                  <select
                    required
                    value={formData.lojaId}
                    onChange={(e) => setFormData({ ...formData, lojaId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-walmart-blue focus:ring-2 focus:ring-walmart-blue focus:ring-opacity-50"
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
                  <label className="block text-sm font-semibold text-walmart-text mb-2">
                    Nome do Grupo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-walmart-blue focus:ring-2 focus:ring-walmart-blue focus:ring-opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-walmart-text mb-2">
                  Descrição (Opcional)
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-walmart-blue focus:ring-2 focus:ring-walmart-blue focus:ring-opacity-50"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={saveGrupoMutation.isPending}
                  className="px-6 py-2 bg-walmart-blue text-white rounded-lg hover:bg-walmart-blue-dark transition-colors font-semibold disabled:opacity-50"
                >
                  {saveGrupoMutation.isPending ? "Salvando..." : "Salvar"}
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

        {/* Grupos List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-walmart-gray">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-walmart-text">Loja</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-walmart-text">Nome</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-walmart-text">Descrição</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-walmart-text">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {!grupos || grupos.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      Nenhum grupo cadastrado
                    </td>
                  </tr>
                ) : (
                  grupos.map((grupo) => (
                    <tr key={grupo.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-semibold text-walmart-text">
                        {grupo.loja?.nome || "N/A"}
                      </td>
                      <td className="px-6 py-4 font-semibold text-walmart-text">{grupo.nome}</td>
                      <td className="px-6 py-4 text-walmart-text">{grupo.descricao || "-"}</td>
                      <td className="px-6 py-4 flex gap-2">
                        <button
                          onClick={() => handleEdit(grupo)}
                          className="p-2 text-walmart-blue hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Tem certeza que deseja deletar este grupo?")) {
                              deleteGrupoMutation.mutate(grupo.id);
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
