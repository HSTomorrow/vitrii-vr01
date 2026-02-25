import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X, Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { BRAZILIAN_STATES } from "@shared/brazilianStates";

interface CreateAnuncianteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (lojaId: number) => void;
}

interface Localidade {
  id: number;
  codigo: string;
  municipio: string;
  estado: string;
  descricao?: string;
  status: string;
}

export default function CreateAnuncianteModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateAnuncianteModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    nome: "",
    tipo: "Padrão",
    cnpj: "",
    endereco: "",
    cidade: "",
    estado: "RS",
    cep: "",
    localidadeId: null as number | null,
    email: "",
    telefone: "",
    site: "",
    instagram: "",
    facebook: "",
    whatsapp: "",
    chavePix: "",
    descricao: "",
    status: "Ativo",
    temAgenda: false,
    fotoUrl: "",
    iconColor: "azul",
  });

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

  const handleFileUpload = async (file: File) => {
    const formDataFile = new FormData();
    formDataFile.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formDataFile,
      });

      if (!response.ok) {
        throw new Error("Erro ao upload da foto");
      }

      const result = await response.json();
      setFormData((prev) => ({
        ...prev,
        fotoUrl: result.url,
      }));
      toast.success("Foto uploaded com sucesso!");
    } catch (error) {
      toast.error("Erro ao fazer upload da foto");
      console.error("Upload error:", error);
    }
  };

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      // Transform field names to match API expectations
      const apiData = {
        nome: data.nome,
        tipo: data.tipo,
        cnpj: data.cnpj,
        telefone: data.telefone,
        site: data.site,
        instagram: data.instagram,
        facebook: data.facebook,
        whatsapp: data.whatsapp,
        chavePix: data.chavePix,
        endereco: data.endereco,
        cidade: data.cidade,
        estado: data.estado,
        cep: data.cep,
        descricao: data.descricao,
        email: data.email,
        localidadeId: data.localidadeId,
        status: data.status,
        temAgenda: data.temAgenda,
        fotoUrl: data.fotoUrl,
        iconColor: data.iconColor,
      };

      const response = await fetch("/api/anunciantes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Format detailed validation errors if available
        if (errorData.details && Array.isArray(errorData.details)) {
          const formattedErrors = errorData.details
            .map((err: any) => {
              const field = err.path?.join(".") || "campo desconhecido";
              return `${field}: ${err.message}`;
            })
            .join("\n");

          const error = new Error(formattedErrors);
          (error as any).isValidationError = true;
          (error as any).details = errorData.details;
          throw error;
        }

        throw new Error(errorData.error || "Erro ao criar anunciante");
      }

      return response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["anunciantes"] });
      queryClient.invalidateQueries({ queryKey: ["anunciantes-do-usuario"] });
      toast.success("Anunciante criado com sucesso!");
      setFormData({
        nome: "",
        tipo: "Padrão",
        cnpj: "",
        telefone: "",
        site: "",
        instagram: "",
        facebook: "",
        whatsapp: "",
        chavePix: "",
        endereco: "",
        cidade: "",
        estado: "RS",
        cep: "",
        descricao: "",
        email: "",
        localidadeId: null,
        status: "Ativo",
        temAgenda: false,
        fotoUrl: "",
        iconColor: "azul",
      });
      onSuccess?.(result.data.id);
      onClose();
    },
    onError: (error) => {
      if (error instanceof Error) {
        const details = (error as any).details;
        if (details && Array.isArray(details)) {
          // Show multiple validation errors
          const errorMessages = details
            .map((err: any) => err.message)
            .join(" • ");

          toast.error(`Erro de validação: ${errorMessages}`);
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error("Erro ao criar anunciante");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if user is logged in
    if (!user || !user.id) {
      toast.error("Você precisa estar logado para criar um anunciante");
      return;
    }

    if (
      !formData.nome ||
      !formData.tipo ||
      !formData.cnpj ||
      !formData.endereco ||
      !formData.cidade ||
      !formData.estado ||
      !formData.cep ||
      !formData.localidadeId ||
      !formData.email ||
      !formData.status
    ) {
      toast.error("Preencha todos os campos obrigatórios marcados com *");
      return;
    }
    mutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-vitrii-text">
            Novo Anunciante
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nome */}
            <div>
              <label className="block text-sm font-semibold text-vitrii-text mb-2">
                Nome da Anunciante *
              </label>
              <input
                type="text"
                required
                value={formData.nome}
                onChange={(e) => handleInputChange("nome", e.target.value)}
                placeholder="Ex: Anunciante Central"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-vitrii-blue focus:ring-2 focus:ring-vitrii-blue focus:ring-opacity-50"
              />
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-sm font-semibold text-vitrii-text mb-2">
                Tipo de Anunciante *
              </label>
              <select
                required
                value={formData.tipo}
                onChange={(e) => handleInputChange("tipo", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-vitrii-blue focus:ring-2 focus:ring-vitrii-blue focus:ring-opacity-50 bg-white"
              >
                <option value="Padrão">Padrão</option>
                <option value="Profissional">Profissional</option>
              </select>
            </div>

            {/* CNPJ */}
            <div>
              <label className="block text-sm font-semibold text-vitrii-text mb-2">
                CNPJ/CPF *
              </label>
              <input
                type="text"
                required
                value={formData.cnpj}
                onChange={(e) =>
                  handleInputChange("cnpj", e.target.value.replace(/\D/g, ""))
                }
                placeholder="00000000000000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-vitrii-blue focus:ring-2 focus:ring-vitrii-blue focus:ring-opacity-50"
              />
            </div>

            {/* Endereço */}
            <div>
              <label className="block text-sm font-semibold text-vitrii-text mb-2">
                Endereço *
              </label>
              <input
                type="text"
                required
                value={formData.endereco}
                onChange={(e) => handleInputChange("endereco", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-vitrii-blue focus:ring-2 focus:ring-vitrii-blue focus:ring-opacity-50"
              />
            </div>

            {/* Cidade */}
            <div>
              <label className="block text-sm font-semibold text-vitrii-text mb-2">
                Cidade *
              </label>
              <input
                type="text"
                required
                value={formData.cidade}
                onChange={(e) => handleInputChange("cidade", e.target.value)}
                placeholder="Ex: Montenegro"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-vitrii-blue focus:ring-2 focus:ring-vitrii-blue focus:ring-opacity-50"
              />
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-semibold text-vitrii-text mb-2">
                Estado (UF) *
              </label>
              <select
                required
                value={formData.estado}
                onChange={(e) => handleInputChange("estado", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-vitrii-blue focus:ring-2 focus:ring-vitrii-blue focus:ring-opacity-50 bg-white"
              >
                {BRAZILIAN_STATES.map((state) => (
                  <option key={state.code} value={state.code}>
                    {state.code} - {state.name}
                  </option>
                ))}
              </select>
            </div>

            {/* CEP */}
            <div>
              <label className="block text-sm font-semibold text-vitrii-text mb-2">
                CEP *
              </label>
              <input
                type="text"
                required
                value={formData.cep}
                onChange={(e) => {
                  // Only allow digits and hyphen
                  const cleanValue = e.target.value.replace(/[^\d-]/g, "");
                  handleInputChange("cep", cleanValue);
                }}
                placeholder="00000-000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-vitrii-blue focus:ring-2 focus:ring-vitrii-blue focus:ring-opacity-50"
              />
            </div>

            {/* Localidade */}
            <div>
              <label className="block text-sm font-semibold text-vitrii-text mb-2">
                Localidade *
              </label>
              <select
                required
                value={formData.localidadeId || ""}
                onChange={(e) =>
                  handleInputChange(
                    "localidadeId",
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-vitrii-blue focus:ring-2 focus:ring-vitrii-blue focus:ring-opacity-50 bg-white"
              >
                <option value="">Selecione uma localidade</option>
                {localidades.map((localidade) => (
                  <option key={localidade.id} value={localidade.id}>
                    {localidade.descricao ||
                      `${localidade.municipio}, ${localidade.estado}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-vitrii-text mb-2">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-vitrii-blue focus:ring-2 focus:ring-vitrii-blue focus:ring-opacity-50"
              />
            </div>

            {/* Telefone */}
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
                    ""
                  );
                  handleInputChange("telefone", cleanValue);
                }}
                placeholder="(51) 3333-3333"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-vitrii-blue focus:ring-2 focus:ring-vitrii-blue focus:ring-opacity-50"
              />
            </div>

            {/* Site */}
            <div>
              <label className="block text-sm font-semibold text-vitrii-text mb-2">
                Site (Opcional)
              </label>
              <input
                type="text"
                value={formData.site}
                onChange={(e) => handleInputChange("site", e.target.value)}
                placeholder="https://example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-vitrii-blue focus:ring-2 focus:ring-vitrii-blue focus:ring-opacity-50"
              />
            </div>

            {/* Instagram */}
            <div>
              <label className="block text-sm font-semibold text-vitrii-text mb-2">
                Instagram (Opcional)
              </label>
              <input
                type="text"
                value={formData.instagram}
                onChange={(e) => handleInputChange("instagram", e.target.value)}
                placeholder="@usuario"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-vitrii-blue focus:ring-2 focus:ring-vitrii-blue focus:ring-opacity-50"
              />
            </div>

            {/* Facebook */}
            <div>
              <label className="block text-sm font-semibold text-vitrii-text mb-2">
                Facebook (Opcional)
              </label>
              <input
                type="text"
                value={formData.facebook}
                onChange={(e) => handleInputChange("facebook", e.target.value)}
                placeholder="nome-da-pagina"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-vitrii-blue focus:ring-2 focus:ring-vitrii-blue focus:ring-opacity-50"
              />
            </div>

            {/* WhatsApp */}
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
                      ""
                    );
                    handleInputChange("whatsapp", "+55" + cleanValue);
                  }}
                  placeholder="(51) 98765-4321"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-r-lg focus:outline-none focus:border-vitrii-blue focus:ring-2 focus:ring-vitrii-blue focus:ring-opacity-50"
                />
              </div>
              <p className="text-xs text-vitrii-text-secondary mt-1">
                Digite apenas DDD e número (ex: 11 98765-4321)
              </p>
            </div>

            {/* Chave Pix */}
            <div>
              <label className="block text-sm font-semibold text-vitrii-text mb-2">
                Chave PIX (Opcional)
              </label>
              <input
                type="text"
                value={formData.chavePix}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length <= 32) {
                    handleInputChange("chavePix", value);
                  }
                }}
                placeholder="Email, CPF, Telefone ou chave aleatória"
                maxLength={32}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-vitrii-blue focus:ring-2 focus:ring-vitrii-blue focus:ring-opacity-50"
              />
              <p className="text-xs text-vitrii-text-secondary mt-1">
                Máximo 32 caracteres
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Descrição */}
            <div>
              <label className="block text-sm font-semibold text-vitrii-text mb-2">
                Descrição (Opcional)
              </label>
              <textarea
                value={formData.descricao}
                onChange={(e) =>
                  handleInputChange("descricao", e.target.value)
                }
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-vitrii-blue focus:ring-2 focus:ring-vitrii-blue focus:ring-opacity-50"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-semibold text-vitrii-text mb-2">
                Status *
              </label>
              <select
                required
                value={formData.status}
                onChange={(e) =>
                  handleInputChange("status", e.target.value)
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-vitrii-blue focus:ring-2 focus:ring-vitrii-blue focus:ring-opacity-50 bg-white"
              >
                <option value="Ativo">Ativo</option>
                <option value="Desativado">Desativado</option>
              </select>
            </div>
          </div>

          {/* Habilitar Agenda */}
          <div className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.temAgenda}
                onChange={(e) =>
                  handleInputChange("temAgenda", e.target.checked)
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

          {/* Foto Upload */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-vitrii-text">
              Foto da Anunciante (Opcional)
            </label>
            {formData.fotoUrl && (
              <div className="relative">
                <img
                  src={formData.fotoUrl}
                  alt="Foto da anunciante"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => handleInputChange("fotoUrl", "")}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  ✕
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

          {/* Buttons */}
          <div className="flex gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border-2 border-vitrii-blue text-vitrii-blue rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 px-4 py-2 bg-vitrii-blue text-white rounded-lg font-semibold hover:bg-vitrii-blue-dark transition-colors disabled:opacity-50"
            >
              {mutation.isPending ? "Criando..." : "Criar Anunciante"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
