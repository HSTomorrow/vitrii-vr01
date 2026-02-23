import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ImageZoom from "@/components/ImageZoom";
import { Plus, Trash2, Edit2, Upload, X } from "lucide-react";
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
  cep?: string;
  descricao: string;
  email: string;
  telefone?: string;
  site?: string;
  instagram?: string;
  facebook?: string;
  whatsapp?: string;
  fotoUrl?: string;
  iconColor?: string;
  temAgenda?: boolean;
  status?: string;
  localidadeId?: number | null;
}

interface Localidade {
  id: number;
  codigo: string;
  municipio: string;
  estado: string;
  descricao?: string;
  status: string;
}

export default function CadastroAnunciantes() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    tipo: "Padrão",
    cnpj: "",
    endereco: "",
    cidade: "",
    estado: "RS",
    cep: "",
    descricao: "",
    email: "",
    telefone: "",
    site: "",
    instagram: "",
    facebook: "",
    whatsapp: "",
    fotoUrl: "",
    iconColor: "azul",
    temAgenda: false,
    localidadeId: null as number | null,
    status: "Ativo",
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

  // Fetch active localidades
  const { data: localidadesData } = useQuery({
    queryKey: ["localidades-anunciantes"],
    queryFn: async () => {
      const response = await fetch("/api/localidades?status=ativo&limit=100");
      if (!response.ok) throw new Error("Erro ao buscar localidades");
      return response.json();
    },
  });

  const localidades = (localidadesData?.data || []) as Localidade[];

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
        const errorData = await response.json();

        // Format error message with details if available
        let errorMessage = errorData.error || "Erro ao salvar loja";

        if (errorData.details) {
          if (Array.isArray(errorData.details)) {
            // Format validation errors (Zod errors)
            const fieldErrors = errorData.details
              .map((detail: any) => {
                const fieldName = Array.isArray(detail.path)
                  ? detail.path.join(".")
                  : detail.path;
                return `${fieldName}: ${detail.message}`;
              })
              .join("\n");
            errorMessage = errorMessage + "\n\n" + fieldErrors;
          } else if (typeof errorData.details === "object") {
            // Format other error details
            const detailMessage =
              errorData.details.message ||
              errorData.details.type ||
              JSON.stringify(errorData.details);
            errorMessage = errorMessage + "\n" + detailMessage;
          }
        }

        throw new Error(errorMessage);
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
        tipo: "Padrão",
        cnpj: "",
        endereco: "",
        cidade: "",
        estado: "RS",
        cep: "",
        descricao: "",
        email: "",
        telefone: "",
        site: "",
        instagram: "",
        facebook: "",
        whatsapp: "",
        fotoUrl: "",
        iconColor: "azul",
        temAgenda: false,
        localidadeId: null,
        status: "Ativo",
      });
      setEditingId(null);
      setIsFormOpen(false);
      refetch();
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao salvar loja";
      // Use toast.error with duration to ensure long error messages are visible
      toast.error(errorMessage, {
        duration: 5000,
      });
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
      tipo: loja.tipo || "Padrão",
      cnpj: loja.cnpj || "",
      endereco: loja.endereco || "",
      cidade: loja.cidade || "",
      estado: loja.estado || "RS",
      cep: loja.cep || "",
      descricao: loja.descricao || "",
      email: loja.email || "",
      telefone: loja.telefone || "",
      site: loja.site || "",
      instagram: loja.instagram || "",
      facebook: loja.facebook || "",
      whatsapp: loja.whatsapp || "",
      fotoUrl: loja.fotoUrl || "",
      iconColor: loja.iconColor || "azul",
      temAgenda: loja.temAgenda || false,
      localidadeId: loja.localidadeId || null,
      status: loja.status || "Ativo",
    });
    setEditingId(loja.id);
    setIsFormOpen(true);
  };

  const handleFileUpload = async (file: File) => {
    try {
      const formDataFile = new FormData();
      formDataFile.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formDataFile,
      });

      if (!response.ok) {
        throw new Error("Erro ao fazer upload da imagem");
      }

      const data = await response.json();
      setFormData({ ...formData, fotoUrl: data.url });
      toast.success("Imagem enviada com sucesso!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao fazer upload",
      );
    }
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
          <h1 className="text-3xl font-bold text-vitrii-text">
            Cadastro de Anunciantes
          </h1>
          <button
            onClick={() => {
              setIsFormOpen(!isFormOpen);
              setEditingId(null);
              setFormData({
                nome: "",
                tipo: "Padrão",
                cnpj: "",
                endereco: "",
                cidade: "",
                estado: "RS",
                cep: "",
                descricao: "",
                email: "",
                telefone: "",
                site: "",
                instagram: "",
                facebook: "",
                whatsapp: "",
                fotoUrl: "",
                iconColor: "azul",
                temAgenda: false,
                localidadeId: null,
                status: "Ativo",
              });
            }}
            className="flex items-center gap-2 px-4 py-2 bg-vitrii-yellow text-vitrii-text rounded-lg hover:bg-vitrii-yellow-dark transition-colors font-semibold"
          >
            <Plus className="w-5 h-5" />
            Nova Anunciante
          </button>
        </div>

        {/* Form */}
        {isFormOpen && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-vitrii-text mb-6">
              {editingId ? "Editar Anunciante" : "Criar Nova Anunciante"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-vitrii-text mb-2">
                    Nome da Anunciante *
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

                <div>
                  <label className="block text-sm font-semibold text-vitrii-text mb-2">
                    Tipo de Anunciante *
                  </label>
                  <select
                    required
                    value={formData.tipo}
                    onChange={(e) =>
                      setFormData({ ...formData, tipo: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-vitrii-blue focus:ring-2 focus:ring-vitrii-blue focus:ring-opacity-50 bg-white"
                  >
                    <option value="Padrão">Padrão</option>
                    <option value="Profissional">Profissional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-vitrii-text mb-2">
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-vitrii-blue focus:ring-2 focus:ring-vitrii-blue focus:ring-opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-vitrii-text mb-2">
                    Endereço *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.endereco}
                    onChange={(e) =>
                      setFormData({ ...formData, endereco: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-vitrii-blue focus:ring-2 focus:ring-vitrii-blue focus:ring-opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-vitrii-text mb-2">
                    Cidade *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.cidade}
                    onChange={(e) =>
                      setFormData({ ...formData, cidade: e.target.value })
                    }
                    placeholder="Ex: Montenegro"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-vitrii-blue focus:ring-2 focus:ring-vitrii-blue focus:ring-opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-vitrii-text mb-2">
                    Estado (UF) *
                  </label>
                  <select
                    required
                    value={formData.estado}
                    onChange={(e) =>
                      setFormData({ ...formData, estado: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-vitrii-blue focus:ring-2 focus:ring-vitrii-blue focus:ring-opacity-50 bg-white"
                  >
                    {BRAZILIAN_STATES.map((state) => (
                      <option key={state.code} value={state.code}>
                        {state.code} - {state.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-vitrii-text mb-2">
                    CEP (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.cep}
                    onChange={(e) => {
                      // Only allow digits and hyphen
                      const cleanValue = e.target.value.replace(/[^\d-]/g, "");
                      setFormData({ ...formData, cep: cleanValue });
                    }}
                    placeholder="00000-000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-vitrii-blue focus:ring-2 focus:ring-vitrii-blue focus:ring-opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-vitrii-text mb-2">
                    Localidade *
                  </label>
                  <select
                    required
                    value={formData.localidadeId || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        localidadeId: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-vitrii-blue focus:ring-2 focus:ring-vitrii-blue focus:ring-opacity-50 bg-white"
                  >
                    <option value="">Selecione uma localidade</option>
                    {localidades.map((localidade) => (
                      <option key={localidade.id} value={localidade.id}>
                        {localidade.descricao || `${localidade.municipio}, ${localidade.estado}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-vitrii-text mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-vitrii-blue focus:ring-2 focus:ring-vitrii-blue focus:ring-opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-vitrii-text mb-2">
                    Telefone (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.telefone}
                    onChange={(e) => {
                      // Only allow digits, spaces, parentheses, and hyphens
                      const cleanValue = e.target.value.replace(
                        /[^\d\s()()-]/g,
                        "",
                      );
                      setFormData({ ...formData, telefone: cleanValue });
                    }}
                    placeholder="(51) 3333-3333"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-vitrii-blue focus:ring-2 focus:ring-vitrii-blue focus:ring-opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-vitrii-text mb-2">
                    Site (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.site}
                    onChange={(e) =>
                      setFormData({ ...formData, site: e.target.value })
                    }
                    placeholder="https://example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-vitrii-blue focus:ring-2 focus:ring-vitrii-blue focus:ring-opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-vitrii-text mb-2">
                    Instagram (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.instagram}
                    onChange={(e) =>
                      setFormData({ ...formData, instagram: e.target.value })
                    }
                    placeholder="@usuario"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-vitrii-blue focus:ring-2 focus:ring-vitrii-blue focus:ring-opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-vitrii-text mb-2">
                    Facebook (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.facebook}
                    onChange={(e) =>
                      setFormData({ ...formData, facebook: e.target.value })
                    }
                    placeholder="nome-da-pagina"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-vitrii-blue focus:ring-2 focus:ring-vitrii-blue focus:ring-opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-vitrii-text mb-2">
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
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-r-lg focus:outline-none focus:border-vitrii-blue focus:ring-2 focus:ring-vitrii-blue focus:ring-opacity-50"
                    />
                  </div>
                  <p className="text-xs text-vitrii-text-secondary mt-1">
                    Digite apenas DDD e número (ex: 11 98765-4321)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div>
                  <label className="block text-sm font-semibold text-vitrii-text mb-2">
                    Status *
                  </label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-vitrii-blue focus:ring-2 focus:ring-vitrii-blue focus:ring-opacity-50 bg-white"
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Desativado">Desativado</option>
                  </select>
                </div>
              </div>

              <div className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.temAgenda}
                    onChange={(e) =>
                      setFormData({ ...formData, temAgenda: e.target.checked })
                    }
                    className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-2 focus:ring-orange-500"
                  />
                  <div>
                    <span className="font-semibold text-vitrii-text">
                      Habilitar Agenda
                    </span>
                    <p className="text-xs text-gray-600 mt-1">
                      Se marcado, o botão "Agendar" aparecerá nos anúncios deste anunciante
                    </p>
                  </div>
                </label>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-vitrii-text">
                  Foto da Anunciante (Opcional)
                </label>
                {formData.fotoUrl && (
                  <div className="relative">
                    <ImageZoom
                      src={formData.fotoUrl}
                      alt="Foto da anunciante"
                      containerClassName="w-full h-48"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, fotoUrl: "" })}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-vitrii-blue rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
                  <Upload className="w-5 h-5 text-vitrii-blue" />
                  <span className="text-sm font-semibold text-vitrii-blue">
                    {formData.fotoUrl ? "Alterar Foto" : "Adicionar Foto"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(file);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Icon Color Selector - shown when no photo */}
              {!formData.fotoUrl && (
                <div className="space-y-3 border-l-4 border-blue-500 bg-blue-50 p-4 rounded">
                  <label className="block text-sm font-semibold text-vitrii-text mb-2">
                    Cor do Ícone (mostrado quando sem foto)
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { value: "azul", label: "Azul", color: "bg-blue-500" },
                      { value: "verde", label: "Verde", color: "bg-green-500" },
                      { value: "rosa", label: "Rosa", color: "bg-pink-500" },
                      { value: "vermelho", label: "Vermelho", color: "bg-red-500" },
                      { value: "laranja", label: "Laranja", color: "bg-orange-500" },
                    ].map((colorOption) => (
                      <button
                        key={colorOption.value}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, iconColor: colorOption.value })
                        }
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                          formData.iconColor === colorOption.value
                            ? "ring-2 ring-offset-2 ring-vitrii-blue"
                            : "hover:opacity-80"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full ${colorOption.color}`} />
                        <span className="text-xs font-semibold text-vitrii-text text-center">
                          {colorOption.label}
                        </span>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Este ícone será exibido como avatar quando o anunciante não tiver uma foto de perfil.
                  </p>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={saveAnuncianteMutation.isPending}
                  className="px-6 py-2 bg-vitrii-blue text-white rounded-lg hover:bg-vitrii-blue-dark transition-colors font-semibold disabled:opacity-50"
                >
                  {saveAnuncianteMutation.isPending ? "Salvando..." : "Salvar"}
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

        {/* Anunciantes List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-vitrii-gray">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-vitrii-text whitespace-nowrap">
                    Nome
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-vitrii-text whitespace-nowrap">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-vitrii-text whitespace-nowrap">
                    CNPJ/CPF
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-vitrii-text whitespace-nowrap">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-vitrii-text whitespace-nowrap">
                    Endereço
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-vitrii-text whitespace-nowrap">
                    Cidade/Estado
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-vitrii-text whitespace-nowrap">
                    Agenda
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-vitrii-text whitespace-nowrap">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {!anunciantes || anunciantes.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-4 text-center text-gray-500"
                    >
                      Nenhuma anunciante cadastrada
                    </td>
                  </tr>
                ) : (
                  anunciantes.map((loja) => (
                    <tr key={loja.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 font-semibold text-vitrii-text text-sm">
                        {loja.nome}
                      </td>
                      <td className="px-4 py-4 text-vitrii-text">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            loja.tipo === "Profissional"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {loja.tipo || "Padrão"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-vitrii-text text-sm">
                        {loja.cnpj}
                      </td>
                      <td className="px-4 py-4 text-vitrii-text text-sm">
                        {loja.email}
                      </td>
                      <td className="px-4 py-4 text-vitrii-text text-sm">
                        {loja.endereco}
                      </td>
                      <td className="px-4 py-4 text-vitrii-text text-sm">
                        {loja.cidade && loja.estado
                          ? `${loja.cidade}, ${loja.estado}`
                          : "—"}
                      </td>
                      <td className="px-4 py-4 text-vitrii-text text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            loja.temAgenda
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {loja.temAgenda ? "Sim" : "Não"}
                        </span>
                      </td>
                      <td className="px-4 py-4 flex gap-2">
                        <button
                          onClick={() => handleEdit(loja)}
                          className="p-2 text-vitrii-blue hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                "Tem certeza que deseja deletar esta anunciante?",
                              )
                            ) {
                              deleteAnuncianteMutation.mutate(loja.id);
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
            {!anunciantes || anunciantes.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                Nenhuma anunciante cadastrada
              </div>
            ) : (
              <div className="space-y-3 p-4">
                {anunciantes.map((loja) => (
                  <div
                    key={loja.id}
                    className="border border-gray-200 rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow"
                  >
                    {/* Nome e Tipo */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-vitrii-text truncate text-sm">
                          {loja.nome}
                        </h3>
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-semibold mt-1 ${
                            loja.tipo === "Profissional"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {loja.tipo || "Padrão"}
                        </span>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleEdit(loja)}
                          className="p-2 text-vitrii-blue hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                "Tem certeza que deseja deletar esta anunciante?",
                              )
                            ) {
                              deleteAnuncianteMutation.mutate(loja.id);
                            }
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Deletar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <p className="text-xs text-vitrii-text-secondary">
                        Email
                      </p>
                      <p className="text-sm text-vitrii-text break-all">
                        {loja.email}
                      </p>
                    </div>

                    {/* CNPJ */}
                    <div>
                      <p className="text-xs text-vitrii-text-secondary">
                        CNPJ/CPF
                      </p>
                      <p className="text-sm text-vitrii-text">{loja.cnpj}</p>
                    </div>

                    {/* Localização */}
                    <div>
                      <p className="text-xs text-vitrii-text-secondary">
                        Localização
                      </p>
                      <p className="text-sm text-vitrii-text">
                        {loja.endereco}
                        {loja.cidade && loja.estado
                          ? ` • ${loja.cidade}, ${loja.estado}`
                          : ""}
                      </p>
                    </div>

                    {/* Agenda Status */}
                    <div>
                      <p className="text-xs text-vitrii-text-secondary">
                        Agenda Habilitada
                      </p>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-1 ${
                          loja.temAgenda
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {loja.temAgenda ? "Sim" : "Não"}
                      </span>
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
