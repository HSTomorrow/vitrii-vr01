import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Usuario {
  id: number;
  nome: string;
  email: string;
  cpf?: string;
  telefone?: string;
  whatsapp?: string;
  linkedin?: string;
  facebook?: string;
  tipoUsuario: string;
  tassinatura?: string;
  dataCriacao: string;
  dataVigenciaContrato: string;
  numeroAnunciosAtivos: number;
  endereco?: string;
}

interface AdminEditUserModalProps {
  usuario: Usuario;
  onClose: () => void;
}

export default function AdminEditUserModal({
  usuario,
  onClose,
}: AdminEditUserModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    nome: usuario.nome,
    email: usuario.email,
    cpf: usuario.cpf || "",
    telefone: usuario.telefone || "",
    whatsapp: usuario.whatsapp || "",
    linkedin: usuario.linkedin || "",
    facebook: usuario.facebook || "",
    tipoUsuario: usuario.tipoUsuario,
    tassinatura: usuario.tassinatura || "Gratuito",
    dataVigenciaContrato: new Date(usuario.dataVigenciaContrato)
      .toISOString()
      .split("T")[0],
    endereco: usuario.endereco || "",
  });

  // Helper function to convert date string to ISO datetime
  const dateToDateTime = (dateStr: string): string => {
    if (!dateStr) return "";
    // If it's already in ISO format with time, return as-is
    if (dateStr.includes("T")) return dateStr;
    // If it's just a date, add midnight time
    return `${dateStr}T00:00:00.000Z`;
  };

  // Mutation to update user profile
  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch(
        `/api/admin/usracessos/${usuario.id}/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user?.id?.toString() || "",
          },
          body: JSON.stringify(data),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();

        // If there are field-level errors, show them
        if (errorData.details && Array.isArray(errorData.details)) {
          const fieldErrors = errorData.details
            .map((err: any) => `${err.field}: ${err.message}`)
            .join("\n");
          throw new Error(
            fieldErrors ||
              errorData.error ||
              "Erro ao atualizar perfil do usuário",
          );
        }

        throw new Error(
          errorData.error || "Erro ao atualizar perfil do usuário",
        );
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["usuarios-com-senha"] });
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.nome || !formData.email) {
      toast.error("Nome e email são obrigatórios");
      return;
    }

    // Prepare data for submission
    const submitData = {
      ...formData,
      // Convert date to datetime if provided
      dataVigenciaContrato: formData.dataVigenciaContrato
        ? dateToDateTime(formData.dataVigenciaContrato)
        : undefined,
    } as any;

    updateMutation.mutate(submitData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-vitrii-text">
            Editar Perfil do Usuário
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-vitrii-text mb-4">
              Informações Básicas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-vitrii-text mb-2">
                  Nome *
                </label>
                <input
                  type="text"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-vitrii-text mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-vitrii-text mb-2">
                  CPF \ CNPJ
                </label>
                <input
                  type="text"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleInputChange}
                  placeholder="000.000.000-00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-vitrii-text mb-2">
                  Tipo de Usuário *
                </label>
                <select
                  name="tipoUsuario"
                  value={formData.tipoUsuario}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
                >
                  <option value="comum">Comum</option>
                  <option value="adm">Administrador</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-vitrii-text mb-4">
              Informações de Contato
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-vitrii-text mb-2">
                  Telefone
                </label>
                <input
                  type="tel"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-vitrii-text mb-2">
                  WhatsApp
                </label>
                <input
                  type="tel"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-vitrii-text mb-2">
                  LinkedIn
                </label>
                <input
                  type="url"
                  name="linkedin"
                  value={formData.linkedin}
                  onChange={handleInputChange}
                  placeholder="https://linkedin.com/in/..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-vitrii-text mb-2">
                  Facebook
                </label>
                <input
                  type="url"
                  name="facebook"
                  value={formData.facebook}
                  onChange={handleInputChange}
                  placeholder="https://facebook.com/..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-vitrii-text mb-2">
                  Endereço
                </label>
                <input
                  type="text"
                  name="endereco"
                  value={formData.endereco}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
                />
              </div>
            </div>
          </div>

          {/* Contract Information */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-vitrii-text mb-4">
              Informações do Contrato
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-vitrii-text mb-2">
                  Data de Vigência do Contrato
                </label>
                <input
                  type="date"
                  name="dataVigenciaContrato"
                  value={formData.dataVigenciaContrato}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-vitrii-text mb-2">
                  Número de Anúncios Ativos
                </label>
                <input
                  type="number"
                  disabled
                  value={usuario.numeroAnunciosAtivos}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                />
                <p className="text-xs text-vitrii-text-secondary mt-1">
                  (Somente leitura - atualizado automaticamente)
                </p>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="text-sm text-vitrii-text-secondary">
            <p>ID do usuário: {usuario.id}</p>
            <p>
              Data de criação:{" "}
              {new Date(usuario.dataCriacao).toLocaleDateString("pt-BR")}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-vitrii-text rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex-1 px-4 py-2 bg-vitrii-blue text-white rounded-lg hover:bg-vitrii-blue-dark transition-colors font-medium disabled:opacity-50"
            >
              {updateMutation.isPending ? "Salvando..." : "Salvar Mudanças"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
