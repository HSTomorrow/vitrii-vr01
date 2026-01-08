import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X, AlertCircle } from "lucide-react";

interface CreateAnuncianteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (lojaId: number) => void;
}

export default function CreateAnuncianteModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateAnuncianteModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    nome: "",
    cnpjOuCpf: "",
    endereco: "",
    cidade: "",
    estado: "",
    descricao: "",
    email: "",
    site: "",
    instagram: "",
    facebook: "",
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/anunciantes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Format detailed validation errors if available
        if (errorData.details && Array.isArray(errorData.details)) {
          const formattedErrors = errorData.details
            .map((err: any) => {
              const field = err.path?.join('.') || 'campo desconhecido';
              return `${field}: ${err.message}`;
            })
            .join('\n');

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
      toast.success("Anunciante criado com sucesso!");
      setFormData({
        nome: "",
        cnpjOuCpf: "",
        endereco: "",
        cidade: "",
        estado: "",
        descricao: "",
        email: "",
        site: "",
        instagram: "",
        facebook: "",
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
    if (
      !formData.nome ||
      !formData.cnpjOuCpf ||
      !formData.endereco ||
      !formData.descricao ||
      !formData.email
    ) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    mutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-walmart-text">
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
          {/* Nome */}
          <div>
            <label className="block text-sm font-semibold text-walmart-text mb-2">
              Nome do Anunciante *
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => handleInputChange("nome", e.target.value)}
              placeholder="Ex: Anunciante Central"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-transparent"
            />
          </div>

          {/* CNPJ/CPF */}
          <div>
            <label className="block text-sm font-semibold text-walmart-text mb-2">
              CNPJ/CPF *
            </label>
            <input
              type="text"
              value={formData.cnpjOuCpf}
              onChange={(e) =>
                handleInputChange(
                  "cnpjOuCpf",
                  e.target.value.replace(/\D/g, ""),
                )
              }
              placeholder="Ex: 12345678901234"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-transparent"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-walmart-text mb-2">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="Ex: contato@anunciante.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-transparent"
            />
          </div>

          {/* Endereço */}
          <div>
            <label className="block text-sm font-semibold text-walmart-text mb-2">
              Endereço *
            </label>
            <input
              type="text"
              value={formData.endereco}
              onChange={(e) => handleInputChange("endereco", e.target.value)}
              placeholder="Ex: Rua Principal, 123"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-transparent"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-semibold text-walmart-text mb-2">
              Descrição *
            </label>
            <textarea
              value={formData.descricao}
              onChange={(e) => handleInputChange("descricao", e.target.value)}
              placeholder="Descreva sua loja..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-transparent"
            />
          </div>

          {/* Site */}
          <div>
            <label className="block text-sm font-semibold text-walmart-text mb-2">
              Site (Opcional)
            </label>
            <input
              type="text"
              value={formData.site}
              onChange={(e) => handleInputChange("site", e.target.value)}
              placeholder="Ex: https://www.anunciante.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-transparent"
            />
          </div>

          {/* Instagram */}
          <div>
            <label className="block text-sm font-semibold text-walmart-text mb-2">
              Instagram (Opcional)
            </label>
            <input
              type="text"
              value={formData.instagram}
              onChange={(e) => handleInputChange("instagram", e.target.value)}
              placeholder="Ex: @loja"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-transparent"
            />
          </div>

          {/* Facebook */}
          <div>
            <label className="block text-sm font-semibold text-walmart-text mb-2">
              Facebook (Opcional)
            </label>
            <input
              type="text"
              value={formData.facebook}
              onChange={(e) => handleInputChange("facebook", e.target.value)}
              placeholder="Ex: /lojaoficial"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-transparent"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border-2 border-walmart-blue text-walmart-blue rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 px-4 py-2 bg-walmart-blue text-white rounded-lg font-semibold hover:bg-walmart-blue-dark transition-colors disabled:opacity-50"
            >
              {mutation.isPending ? "Criando..." : "Criar Anunciante"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
