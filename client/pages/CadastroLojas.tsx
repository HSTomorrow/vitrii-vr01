import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Plus, Trash2, Edit2, MessageCircle } from "lucide-react";
import { BRAZILIAN_STATES } from "@shared/brazilianStates";
import { useAuth } from "@/contexts/AuthContext";

interface Anunciante {
  id: number;
  nome: string;
  tipo?: string;
  cnpj?: string;
  endereco: string;
  cidade: string;
  estado: string;
  descricao: string;
  email: string;
  site?: string;
  instagram?: string;
  facebook?: string;
  whatsapp?: string;
  fotoUrl?: string;
}

export default function CadastroAnunciantes() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    cnpj: "",
    endereco: "",
    cidade: "",
    estado: "RS",
    descricao: "",
    email: "",
    site: "",
    instagram: "",
    facebook: "",
    whatsapp: "",
  });

  // Fetch anunciantes (filtered by current user, or all if admin)
  const { data: anunciantesData, refetch } = useQuery({
    queryKey: ["anunciantes", user?.id],
    queryFn: async () => {
      const headers: Record<string, string> = {};
      if (user?.id) {
        headers["X-User-Id"] = user.id.toString();
      }

      const response = await fetch("/api/anunciantes/do-usuario/listar", {
        headers,
      });
      if (!response.ok) throw new Error("Erro ao buscar anunciantes");
      const result = await response.json();
      return result.data || [];
    },
  });

  // Ensure anunciantes is always an array
  const anunciantes = Array.isArray(anunciantesData) ? anunciantesData : [];

  // Create/Update loja mutation
  const saveAnuncianteMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const url = editingId
        ? `/api/anunciantes/${editingId}`
        : "/api/anunciantes";
      const method = editingId ? "PUT" : "POST";

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Add user ID to header for authentication
      if (user?.id) {
        headers["X-User-Id"] = user.id.toString();
      }

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao salvar loja");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success(
        editingId
          ? "Anunciante atualizada com sucesso!"
          : "Anunciante criada com sucesso!",
      );
      setFormData({
        nome: "",
        cnpj: "",
        endereco: "",
        cidade: "",
        estado: "RS",
        descricao: "",
        email: "",
        site: "",
        instagram: "",
        facebook: "",
        whatsapp: "",
      });
      setEditingId(null);
      setIsFormOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Erro ao salvar loja",
      );
    },
  });

  // Delete loja mutation
  const deleteAnuncianteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/anunciantes/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Erro ao deletar loja");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Anunciante deletada com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Erro ao deletar loja",
      );
    },
  });

  const handleEdit = (loja: Anunciante) => {
    setFormData({
      nome: loja.nome,
      cnpj: loja.cnpj || "",
      endereco: loja.endereco || "",
      cidade: loja.cidade || "",
      estado: loja.estado || "RS",
      descricao: loja.descricao || "",
      email: loja.email || "",
      site: loja.site || "",
      instagram: loja.instagram || "",
      facebook: loja.facebook || "",
      whatsapp: loja.whatsapp || "",
    });
    setEditingId(loja.id);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveAnuncianteMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-walmart-text">
            Cadastro de Anunciantes
          </h1>
          <button
            onClick={() => {
              setIsFormOpen(!isFormOpen);
              setEditingId(null);
              setFormData({
                nome: "",
                cnpj: "",
                endereco: "",
                cidade: "",
                estado: "RS",
                descricao: "",
                email: "",
                site: "",
                instagram: "",
                facebook: "",
                whatsapp: "",
              });
            }}
            className="flex items-center gap-2 px-4 py-2 bg-walmart-yellow text-walmart-text rounded-lg hover:bg-walmart-yellow-dark transition-colors font-semibold"
          >
            <Plus className="w-5 h-5" />
            Nova Anunciante
          </button>
        </div>

        {/* Form */}
        {isFormOpen && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-walmart-text mb-6">
              {editingId ? "Editar Anunciante" : "Criar Nova Anunciante"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-walmart-text mb-2">
                    Nome da Anunciante *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) =>
                      setFormData({ ...formData, nome: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-walmart-blue focus:ring-2 focus:ring-walmart-blue focus:ring-opacity-50"
                  />
                </div>


                <div>
                  <label className="block text-sm font-semibold text-walmart-text mb-2">
                    CNPJ/CPF *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.cnpj}
                    onChange={(e) =>
                      setFormData({ ...formData, cnpj: e.target.value })
                    }
                    placeholder="00000000000000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-walmart-blue focus:ring-2 focus:ring-walmart-blue focus:ring-opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-walmart-text mb-2">
                    Endereço *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.endereco}
                    onChange={(e) =>
                      setFormData({ ...formData, endereco: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-walmart-blue focus:ring-2 focus:ring-walmart-blue focus:ring-opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-walmart-text mb-2">
                    Cidade *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.cidade}
                    onChange={(e) =>
                      setFormData({ ...formData, cidade: e.target.value })
                    }
                    placeholder="Ex: Belo Horizonte"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-walmart-blue focus:ring-2 focus:ring-walmart-blue focus:ring-opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-walmart-text mb-2">
                    Estado (UF) *
                  </label>
                  <select
                    required
                    value={formData.estado}
                    onChange={(e) =>
                      setFormData({ ...formData, estado: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-walmart-blue focus:ring-2 focus:ring-walmart-blue focus:ring-opacity-50 bg-white"
                  >
                    {BRAZILIAN_STATES.map((state) => (
                      <option key={state.code} value={state.code}>
                        {state.code} - {state.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-walmart-text mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-walmart-blue focus:ring-2 focus:ring-walmart-blue focus:ring-opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-walmart-text mb-2">
                    Site (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.site}
                    onChange={(e) =>
                      setFormData({ ...formData, site: e.target.value })
                    }
                    placeholder="https://example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-walmart-blue focus:ring-2 focus:ring-walmart-blue focus:ring-opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-walmart-text mb-2">
                    Instagram (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.instagram}
                    onChange={(e) =>
                      setFormData({ ...formData, instagram: e.target.value })
                    }
                    placeholder="@usuario"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-walmart-blue focus:ring-2 focus:ring-walmart-blue focus:ring-opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-walmart-text mb-2">
                    Facebook (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.facebook}
                    onChange={(e) =>
                      setFormData({ ...formData, facebook: e.target.value })
                    }
                    placeholder="nome-da-pagina"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-walmart-blue focus:ring-2 focus:ring-walmart-blue focus:ring-opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-walmart-text mb-2">
                    WhatsApp (Opcional)
                  </label>
                  <div className="flex items-center gap-0">
                    
                    <input
                      type="text"
                      value={
                        formData.whatsapp.startsWith("+55")
                          ? formData.whatsapp.substring(3)
                          : formData.whatsapp
                      }
                      onChange={(e) => {
                        // Only allow digits, spaces, parentheses, and hyphens
                        const cleanValue = e.target.value.replace(
                          /[^\d\s()()-]/g,
                          "",
                        );
                        setFormData({
                          ...formData,
                          whatsapp: "+55" + cleanValue,
                        });
                      }}
                      placeholder="(51) 98765-4321"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-r-lg focus:outline-none focus:border-walmart-blue focus:ring-2 focus:ring-walmart-blue focus:ring-opacity-50"
                    />
                  </div>
                  <p className="text-xs text-walmart-text-secondary mt-1">
                    Digite apenas DDD e número (ex: 11 98765-4321)
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-walmart-text mb-2">
                  Descrição (Opcional)
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) =>
                    setFormData({ ...formData, descricao: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-walmart-blue focus:ring-2 focus:ring-walmart-blue focus:ring-opacity-50"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={saveAnuncianteMutation.isPending}
                  className="px-6 py-2 bg-walmart-blue text-white rounded-lg hover:bg-walmart-blue-dark transition-colors font-semibold disabled:opacity-50"
                >
                  {saveAnuncianteMutation.isPending ? "Salvando..." : "Salvar"}
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

        {/* Anunciantes List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-walmart-gray">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-walmart-text">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-walmart-text">
                    CNPJ/CPF
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-walmart-text">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-walmart-text">
                    Endereço
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-walmart-text">
                    Cidade/Estado
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-walmart-text">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {!anunciantes || anunciantes.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      Nenhuma loja cadastrada
                    </td>
                  </tr>
                ) : (
                  anunciantes.map((loja) => (
                    <tr key={loja.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-semibold text-walmart-text">
                        {loja.nome}
                      </td>
                      <td className="px-6 py-4 text-walmart-text">
                        {loja.cnpj}
                      </td>
                      <td className="px-6 py-4 text-walmart-text">
                        {loja.email}
                      </td>
                      <td className="px-6 py-4 text-walmart-text">
                        {loja.endereco}
                      </td>
                      <td className="px-6 py-4 text-walmart-text">
                        {loja.cidade && loja.estado
                          ? `${loja.cidade}, ${loja.estado}`
                          : "—"}
                      </td>
                      <td className="px-6 py-4 flex gap-2">
                        <button
                          onClick={() => handleEdit(loja)}
                          className="p-2 text-walmart-blue hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                "Tem certeza que deseja deletar esta loja?",
                              )
                            ) {
                              deleteAnuncianteMutation.mutate(loja.id);
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
