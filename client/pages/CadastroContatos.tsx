import { useState, useEffect } from "react";
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
  User,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import ImageWithFallback from "@/components/ImageWithFallback";
import { getUserInitials } from "@/utils/imageFallback";

interface Contato {
  id: number;
  usuarioId: number;
  anuncianteId?: number | null;
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
  usuario?: {
    id: number;
    nome: string;
    email: string;
  };
  anunciante?: {
    id: number;
    nome: string;
  } | null;
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
  anuncianteId?: number | null;
  dataCriacao?: string;
  dataAtualizacao?: string;
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
  anuncianteId: null,
  dataCriacao: undefined,
  dataAtualizacao: undefined,
};

const CONTACT_TYPES = [
  "Cliente",
  "Fornecedor",
  "Parceiro",
  "Representante",
  "Consultor",
  "Outro",
];

// Helper function to format date to Brazilian format (DD/MM/YYYY HH:MM:SS)
const formatarData = (data: string | undefined): string => {
  if (!data) return "-";

  try {
    const date = new Date(data);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "-";
    }

    const dia = String(date.getDate()).padStart(2, "0");
    const mes = String(date.getMonth() + 1).padStart(2, "0");
    const ano = date.getFullYear();
    const hora = String(date.getHours()).padStart(2, "0");
    const minuto = String(date.getMinutes()).padStart(2, "0");
    const segundo = String(date.getSeconds()).padStart(2, "0");

    return `${dia}/${mes}/${ano} ${hora}:${minuto}:${segundo}`;
  } catch {
    return "-";
  }
};

export default function CadastroContatos() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [searchTerm, setSearchTerm] = useState("");

  // Debug: Log when user changes
  useEffect(() => {
    console.log("[CadastroContatos] User state changed:", { userId: user?.id, userName: user?.nome });
  }, [user]);

  // Fetch anunciantes for the optional field
  const { data: anunciantesData = [] } = useQuery({
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
    enabled: !!user,
  });

  // Fetch contatos for current user
  const { data: contatosData, refetch: refetchContatos } = useQuery({
    queryKey: ["contatos", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const headers: Record<string, string> = {};
      if (user?.id) {
        headers["X-User-Id"] = user.id.toString();
      }

      const response = await fetch("/api/contatos", { headers });
      if (!response.ok) throw new Error("Erro ao buscar contatos");
      const result = await response.json();
      return result.data || [];
    },
    enabled: !!user,
  });

  // Create/update contato mutation
  const saveContatoMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const url = editingId ? `/api/contatos/${editingId}` : "/api/contatos";
      const method = editingId ? "PUT" : "POST";

      console.log("[CadastroContatos] Iniciando requisição:", { method, url, userId: user?.id });

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
        anuncianteId: data.anuncianteId || null,
      };

      console.log("[CadastroContatos] Payload:", payload);

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });

      console.log("[CadastroContatos] Response status:", response.status);

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: "Erro ao fazer parse da resposta" };
        }

        console.error("[CadastroContatos] Erro na resposta:", {
          status: response.status,
          statusText: response.statusText,
          errorData: errorData,
          errorMessage: errorData.error,
          errorDetails: errorData.details,
        });

        const errorMessage = errorData.error || errorData.message || `Erro ao salvar contato (HTTP ${response.status})`;
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("[CadastroContatos] Sucesso na requisição:", result);
      return result;
    },
    onSuccess: () => {
      console.log("[CadastroContatos] onSuccess callback disparado");
      toast.success(
        editingId ? "Contato atualizado com sucesso!" : "Contato criado com sucesso!"
      );
      setFormData(INITIAL_FORM_DATA);
      setEditingId(null);
      setIsFormOpen(false);
      refetchContatos();
    },
    onError: (error) => {
      console.error("[CadastroContatos] onError callback disparado:", error);
      console.error("[CadastroContatos] Error message:", error instanceof Error ? error.message : "");
      console.error("[CadastroContatos] Error stack:", error instanceof Error ? error.stack : "");

      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao salvar contato";
      toast.error(`❌ ${errorMessage}`);
    },
  });

  // Delete contato mutation
  const deleteContatoMutation = useMutation({
    mutationFn: async (contatoId: number) => {
      const headers: Record<string, string> = {};
      if (user?.id) {
        headers["X-User-Id"] = user.id.toString();
      }

      const response = await fetch(`/api/contatos/${contatoId}`, {
        method: "DELETE",
        headers,
      });

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
    console.log("[CadastroContatos] handleSubmit chamado, formData:", formData);

    // Validar nome
    if (!formData.nome || !formData.nome.trim()) {
      console.warn("[CadastroContatos] Nome é obrigatório");
      toast.error("❌ Nome é obrigatório");
      return;
    }

    // Validar celular
    if (!formData.celular || !formData.celular.trim()) {
      console.warn("[CadastroContatos] Celular é obrigatório");
      toast.error("❌ Celular/WhatsApp é obrigatório");
      return;
    }

    // Validar tipo de contato
    if (!formData.tipoContato || formData.tipoContato === "") {
      console.warn("[CadastroContatos] Tipo de contato é obrigatório");
      toast.error("❌ Tipo de contato é obrigatório");
      return;
    }

    // Validar usuário autenticado
    if (!user?.id) {
      console.error("[CadastroContatos] Usuário não autenticado");
      toast.error("❌ Você precisa estar logado para salvar contatos");
      return;
    }

    console.log("[CadastroContatos] Validação passou, disparando mutação");

    try {
      await saveContatoMutation.mutateAsync(formData);
      console.log("[CadastroContatos] Mutação completada com sucesso");
    } catch (error) {
      console.error("[CadastroContatos] Erro ao salvar:", error);
    }
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
      anuncianteId: contato.anuncianteId || null,
      dataCriacao: contato.dataCriacao,
      dataAtualizacao: contato.dataAtualizacao,
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

                {/* Anunciante (optional) */}
                {anunciantesData && anunciantesData.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-vitrii-text mb-1">
                      Usar para Anunciante (opcional)
                    </label>
                    <select
                      value={formData.anuncianteId || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          anuncianteId: e.target.value ? parseInt(e.target.value) : null,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
                    >
                      <option value="">-- Todos os meus anunciantes --</option>
                      {anunciantesData.map((anunciante: Anunciante) => (
                        <option key={anunciante.id} value={anunciante.id}>
                          {anunciante.nome}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-vitrii-text-secondary mt-1">
                      Deixe em branco para usar este contato em todos os seus anunciantes
                    </p>
                  </div>
                )}

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

                {/* Data de Criação */}
                {formData.dataCriacao && (
                  <div>
                    <label className="block text-sm font-medium text-vitrii-text mb-1">
                      Data de Criação
                    </label>
                    <input
                      type="text"
                      value={formatarData(formData.dataCriacao)}
                      readOnly
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                    />
                    <p className="text-xs text-vitrii-text-secondary mt-1">
                      Campo automático (não editável)
                    </p>
                  </div>
                )}

                {/* Data de Alteração */}
                {formData.dataAtualizacao && (
                  <div>
                    <label className="block text-sm font-medium text-vitrii-text mb-1">
                      Data de Alteração
                    </label>
                    <input
                      type="text"
                      value={formatarData(formData.dataAtualizacao)}
                      readOnly
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                    />
                    <p className="text-xs text-vitrii-text-secondary mt-1">
                      Campo automático (não editável)
                    </p>
                  </div>
                )}

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
                Meus Contatos ({filteredContatos.length})
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
                    className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow flex flex-col"
                  >
                    <div className="flex gap-0">
                      {/* Contact Image */}
                      <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-l-lg">
                        <ImageWithFallback
                          src={contato.imagem || null}
                          alt={contato.nome}
                          fallbackIcon={
                            <User className="w-12 h-12 text-vitrii-blue" />
                          }
                          containerClassName="w-full h-full bg-vitrii-gray-light"
                          className="w-full h-full object-cover"
                          fallbackInitials={getUserInitials(contato)}
                        />
                      </div>

                      {/* Contact Info */}
                      <div className="flex-1 p-4">
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

                          {contato.anunciante && (
                            <div className="flex items-center gap-2">
                              <Tag className="w-4 h-4 text-vitrii-blue" />
                              <span className="text-vitrii-text text-xs bg-blue-50 px-2 py-1 rounded">
                                {contato.anunciante.nome}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 p-4 border-t border-gray-100">
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
        </div>
      </main>

      <Footer />
    </div>
  );
}
