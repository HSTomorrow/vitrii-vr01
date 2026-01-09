import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X } from "lucide-react";

interface CreateGrupoModalProps {
  isOpen: boolean;
  onClose: () => void;
  anuncianteId: number;
  onSuccess?: (grupoId: number) => void;
}

export default function CreateGrupoModal({
  isOpen,
  onClose,
  anuncianteId,
  onSuccess,
}: CreateGrupoModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/grupos-productos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          anuncianteId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao criar grupo");
      }

      return response.json();
    },
    onSuccess: (result) => {
      // Invalidate all query patterns to ensure refresh everywhere
      queryClient.invalidateQueries({ queryKey: ["grupos-productos"] });
      queryClient.invalidateQueries({ queryKey: ["grupos", anuncianteId] });
      queryClient.invalidateQueries({
        queryKey: ["grupos-store", anuncianteId],
      });
      toast.success("Grupo criado com sucesso!");
      setFormData({
        nome: "",
        descricao: "",
      });
      onSuccess?.(result.data.id);
      onClose();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Erro ao criar grupo",
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome) {
      toast.error("Nome do grupo é obrigatório");
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
      <div className="bg-white rounded-lg shadow-lg max-w-xl w-full">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-walmart-text">
            Criar Novo Grupo de Produtos
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
              Nome do Grupo *
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => handleInputChange("nome", e.target.value)}
              placeholder="Ex: Camisetas, Eletrônicos"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-transparent"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-semibold text-walmart-text mb-2">
              Descrição (Opcional)
            </label>
            <textarea
              value={formData.descricao}
              onChange={(e) => handleInputChange("descricao", e.target.value)}
              placeholder="Descreva o grupo de produtos..."
              rows={3}
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
              {mutation.isPending ? "Criando..." : "Criar Grupo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
