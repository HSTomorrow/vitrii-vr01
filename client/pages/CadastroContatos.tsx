import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  ArrowLeft,
  Phone,
  Mail,
  MessageSquare,
  Tag,
  Briefcase,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface Contato {
  id: number;
  anuncianteId: number;
  nome: string;
  celular: string;
  telefone?: string;
  email?: string;
  status: "ativo" | "inativo" | "analise";
  tipoContato: string;
  observacoes?: string;
  imagem?: string;
  dataCriacao: string;
  dataAtualizacao: string;
}

interface Anunciante {
  id: number;
  nome: string;
}

interface FormData {
  nome: string;
  celular: string;
  telefone: string;
  email: string;
  status: "ativo" | "inativo" | "analise";
  tipoContato: string;
  observacoes: string;
  imagem: string;
}

const INITIAL_FORM_DATA: FormData = {
  nome: "",
  celular: "",
  telefone: "",
  email: "",
  status: "ativo",
  tipoContato: "",
  observacoes: "",
  imagem: "",
};

const CONTACT_TYPES = [
  "Cliente",
  "Fornecedor",
  "Parceiro",
  "Representante",
  "Consultor",
  "Outro",
];

export default function CadastroContatos() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedAnuncianteId, setSelectedAnuncianteId] = useState<
    number | null
  >(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch anunciantes
  const { data: anunciantesData } = useQuery({
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
      return response.json();
    },
    enabled: !!user,
  });

  // Fetch contatos
  const { data: contatosData, refetch: refetchContatos } = useQuery({
    queryKey: ["contatos", selectedAnuncianteId],
    queryFn: async () => {
      if (!selectedAnuncianteId) return [];

      const headers: Record<string, string> = {};
      if (user?.id) {
        headers["X-User-Id"] = user.id.toString();
      }

      const response = await fetch(
        `/api/anunciantes/${selectedAnuncianteId}/contatos`,
        { headers }
      );
      if (!response.ok) throw new Error("Erro ao buscar contatos");
      return response.json();
    },
    enabled: !!user && selectedAnuncianteId !== null,
  });

  // Create/update contato mutation
  const saveContatoMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!selectedAnuncianteId) throw new Error("Selecione um anunciante");

      const url = editingId
        ? `/api/anunciantes/${selectedAnuncianteId}/contatos/${editingId}`
        : `/api/anunciantes/${selectedAnuncianteId}/contatos`;
      const method = editingId ? "PUT" : "POST";

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (user?.id) {
        headers["X-User-Id"] = user.id.toString();
      }

      const payload = {
        nome: data.nome,
        celular: data.celular,
        telefone: data.telefone || null,
        email: data.email || null,
        status: data.status,
        tipoContato: data.tipoContato,
        observacoes: data.observacoes || null,
        imagem: data.imagem || null,
      };

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao salvar contato");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success(
        editingId ? "Contato atualizado com sucesso!" : "Contato criado com sucesso!"
      );
      setFormData(INITIAL_FORM_DATA);
      setEditingId(null);
      setIsFormOpen(false);
      refetchContatos();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar contato");
    },
  });

  // Delete contato mutation
  const deleteContatoMutation = useMutation({
    mutationFn: async (contatoId: number) => {
      if (!selectedAnuncianteId) throw new Error("Selecione um anunciante");

      const headers: Record<string, string> = {};
      if (user?.id) {
        headers["X-User-Id"] = user.id.toString();
      }

      const response = await fetch(
        `/api/anunciantes/${selectedAnuncianteId}/contatos/${contatoId}`,
        {
          method: "DELETE",
          headers,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao deletar contato");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Contato deletado com sucesso!");
      refetchContatos();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao deletar contato");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    if (!formData.celular.trim()) {
      toast.error("Celular/WhatsApp é obrigatório");
      return;
    }

    if (!formData.tipoContato) {
      toast.error("Tipo de contato é obrigatório");
      return;
    }

    await saveContatoMutation.mutateAsync(formData);
  };

  const handleEdit = (contato: Contato) => {
    setFormData({
      nome: contato.nome,
      celular: contato.celular,
      telefone: contato.telefone || "",
      email: contato.email || "",
      status: contato.status,
      tipoContato: contato.tipoContato,
      observacoes: contato.observacoes || "",
      imagem: contato.imagem || "",
    });
    setEditingId(contato.id);
    setIsFormOpen(true);
  };

  const handleCancel = () => {
    setFormData(INITIAL_FORM_DATA);
    setEditingId(null);
    setIsFormOpen(false);
  };

  const handleDelete = (contatoId: number) => {
    if (confirm("Tem certeza que deseja deletar este contato?")) {
      deleteContatoMutation.mutate(contatoId);
    }
  };

  const filteredContatos =
    contatosData?.filter(
      (contato: Contato) =>
        contato.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contato.celular.includes(searchTerm) ||
        (contato.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
    ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ativo":
        return "bg-green-100 text-green-800";
      case "inativo":
        return "bg-gray-100 text-gray-800";
      case "analise":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ativo":
        return "Ativo";
      case "inativo":
        return "Inativo";
      case "analise":
        return "Análise";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1">
        {/* Header Section */}
        <div className="sticky top-16 bg-white border-b border-gray-200 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Voltar"
              >
                <ArrowLeft className="w-6 h-6 text-vitrii-text" />
              </button>
              <h1 className="text-2xl font-bold text-vitrii-text">
                Cadastro de Contatos
              </h1>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Announcer Selection */}
          {anunciantesData && anunciantesData.length > 0 ? (
            <>
              <div className="mb-8">
                <label className="block text-sm font-semibold text-vitrii-text mb-3">
                  Selecione um Anunciante:
                </label>
                <select
                  value={selectedAnuncianteId || ""}
                  onChange={(e) => {
                    const id = e.target.value ? parseInt(e.target.value) : null;
                    setSelectedAnuncianteId(id);
                    setFormData(INITIAL_FORM_DATA);
                    setEditingId(null);
                    setIsFormOpen(false);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
                >
                  <option value="">-- Escolha um anunciante --</option>
                  {anunciantesData.map((anunciante: Anunciante) => (
                    <option key={anunciante.id} value={anunciante.id}>
                      {anunciante.nome}
                    </option>
                  ))}
                </select>
              </div>

              {selectedAnuncianteId && (
                <>
                  {/* Form Section */}
                  <div className="mb-8 bg-vitrii-gray rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-vitrii-text">
                        {editingId ? "Editar Contato" : "Novo Contato"}
                      </h2>
                      {isFormOpen && (
                        <button
                          onClick={handleCancel}
                          className="p-2 hover:bg-gray-300 rounded-lg transition-colors"
                          aria-label="Fechar"
                        >
                          <X className="w-5 h-5 text-vitrii-text" />
                        </button>
                      )}
                    </div>

                    {!isFormOpen ? (
                      <button
                        onClick={() => setIsFormOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-vitrii-blue text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                        Novo Contato
                      </button>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Nome */}
                        <div>
                          <label className="block text-sm font-medium text-vitrii-text mb-1">
                            Nome *
                          </label>
                          <input
                            type="text"
                            value={formData.nome}
                            onChange={(e) =>
                              setFormData({ ...formData, nome: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
                            placeholder="Nome do contato"
                          />
                        </div>

                        {/* Celular/WhatsApp */}
                        <div>
                          <label className="block text-sm font-medium text-vitrii-text mb-1">
                            Celular/WhatsApp *
                          </label>
                          <input
                            type="text"
                            value={formData.celular}
                            onChange={(e) =>
                              setFormData({ ...formData, celular: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
                            placeholder="(11) 99999-9999"
                          />
                        </div>

                        {/* Telefone */}
                        <div>
                          <label className="block text-sm font-medium text-vitrii-text mb-1">
                            Telefone (opcional)
                          </label>
                          <input
                            type="text"
                            value={formData.telefone}
                            onChange={(e) =>
                              setFormData({ ...formData, telefone: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
                            placeholder="(11) 3333-3333"
                          />
                        </div>

                        {/* Email */}
                        <div>
                          <label className="block text-sm font-medium text-vitrii-text mb-1">
                            Email (opcional)
                          </label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                              setFormData({ ...formData, email: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
                            placeholder="contato@example.com"
                          />
                        </div>

                        {/* Status */}
                        <div>
                          <label className="block text-sm font-medium text-vitrii-text mb-1">
                            Status *
                          </label>
                          <select
                            value={formData.status}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                status: e.target.value as
                                  | "ativo"
                                  | "inativo"
                                  | "analise",
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
                          >
                            <option value="ativo">Ativo</option>
                            <option value="inativo">Inativo</option>
                            <option value="analise">Análise</option>
                          </select>
                        </div>

                        {/* Tipo de Contato */}
                        <div>
                          <label className="block text-sm font-medium text-vitrii-text mb-1">
                            Tipo de Contato *
                          </label>
                          <select
                            value={formData.tipoContato}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                tipoContato: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
                          >
                            <option value="">-- Selecione um tipo --</option>
                            {CONTACT_TYPES.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Observações */}
                        <div>
                          <label className="block text-sm font-medium text-vitrii-text mb-1">
                            Observações (opcional)
                          </label>
                          <textarea
                            value={formData.observacoes}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                observacoes: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue resize-none"
                            placeholder="Notas adicionais..."
                            rows={3}
                          />
                        </div>

                        {/* Imagem */}
                        <div>
                          <label className="block text-sm font-medium text-vitrii-text mb-1">
                            Imagem (opcional - URL)
                          </label>
                          <input
                            type="url"
                            value={formData.imagem}
                            onChange={(e) =>
                              setFormData({ ...formData, imagem: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
                            placeholder="https://example.com/image.jpg"
                          />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-4">
                          <button
                            type="submit"
                            disabled={saveContatoMutation.isPending}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-vitrii-blue text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                          >
                            <Save className="w-5 h-5" />
                            {saveContatoMutation.isPending ? "Salvando..." : "Salvar"}
                          </button>
                          <button
                            type="button"
                            onClick={handleCancel}
                            className="flex-1 px-4 py-2 bg-gray-300 text-vitrii-text rounded-lg hover:bg-gray-400 transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </form>
                    )}
                  </div>

                  {/* Contatos List */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-vitrii-text">
                        Contatos ({filteredContatos.length})
                      </h2>
                      <input
                        type="text"
                        placeholder="Buscar por nome, celular ou email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
                      />
                    </div>

                    {filteredContatos.length === 0 ? (
                      <div className="text-center py-8 bg-vitrii-gray rounded-lg border border-gray-200">
                        <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-vitrii-text-secondary">
                          {contatosData?.length === 0
                            ? "Nenhum contato cadastrado. Crie um novo contato!"
                            : "Nenhum contato encontrado com os critérios de busca."}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {filteredContatos.map((contato: Contato) => (
                          <div
                            key={contato.id}
                            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-vitrii-text">
                                  {contato.nome}
                                </h3>
                                <p className="text-sm text-vitrii-text-secondary">
                                  {contato.tipoContato}
                                </p>
                              </div>
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                                  contato.status
                                )}`}
                              >
                                {getStatusLabel(contato.status)}
                              </span>
                            </div>

                            <div className="space-y-2 mb-4 text-sm">
                              <div className="flex items-center gap-2 text-vitrii-text">
                                <Phone className="w-4 h-4 text-vitrii-blue" />
                                <span>{contato.celular}</span>
                              </div>

                              {contato.telefone && (
                                <div className="flex items-center gap-2 text-vitrii-text">
                                  <Phone className="w-4 h-4 text-gray-400" />
                                  <span>{contato.telefone}</span>
                                </div>
                              )}

                              {contato.email && (
                                <div className="flex items-center gap-2 text-vitrii-text">
                                  <Mail className="w-4 h-4 text-vitrii-blue" />
                                  <span>{contato.email}</span>
                                </div>
                              )}

                              {contato.observacoes && (
                                <div className="flex items-start gap-2 text-vitrii-text">
                                  <MessageSquare className="w-4 h-4 text-vitrii-blue flex-shrink-0 mt-0.5" />
                                  <span className="line-clamp-2">
                                    {contato.observacoes}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2 pt-3 border-t border-gray-100">
                              <button
                                onClick={() => handleEdit(contato)}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-vitrii-blue rounded-lg hover:bg-blue-100 transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                                Editar
                              </button>
                              <button
                                onClick={() => handleDelete(contato.id)}
                                disabled={deleteContatoMutation.isPending}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 disabled:bg-gray-100 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                                Deletar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="text-center py-12 bg-vitrii-gray rounded-lg border border-gray-200">
              <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-vitrii-text-secondary mb-2">
                Nenhum anunciante encontrado.
              </p>
              <p className="text-sm text-vitrii-text-secondary">
                Você precisa cadastrar um anunciante para gerenciar contatos.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
