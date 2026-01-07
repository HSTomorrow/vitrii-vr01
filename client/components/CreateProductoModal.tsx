import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X, Plus } from "lucide-react";
import CreateGrupoModal from "./CreateGrupoModal";

interface CreateProductoModalProps {
  isOpen: boolean;
  onClose: () => void;
  lojaId: number;
  onSuccess?: (productoId: number) => void;
}

interface TabelaDePreco {
  tamanho?: string;
  cor?: string;
  preco: string;
}

export default function CreateProductoModal({
  isOpen,
  onClose,
  lojaId,
  onSuccess,
}: CreateProductoModalProps) {
  const queryClient = useQueryClient();
  const [showCreateGrupo, setShowCreateGrupo] = useState(false);
  const [formData, setFormData] = useState({
    grupoId: 0,
    nome: "",
    descricao: "",
    sku: "",
    tipo: "produto",
  });
  const [tabelas, setTabelas] = useState<TabelaDePreco[]>([
    { tamanho: "", cor: "", preco: "" },
  ]);

  // Fetch grupos for this store
  const { data: gruposData } = useQuery({
    queryKey: ["grupos-store", lojaId],
    queryFn: async () => {
      const response = await fetch(`/api/grupos-productos?lojaId=${lojaId}`);
      if (!response.ok) throw new Error("Erro ao buscar grupos");
      return response.json();
    },
    enabled: isOpen && lojaId > 0,
  });

  const grupos = gruposData?.data || [];

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/productos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grupoId: data.grupoId,
          nome: data.nome,
          descricao: data.descricao,
          sku: data.sku,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao criar produto");
      }

      return response.json();
    },
    onSuccess: async (result) => {
      const productId = result.data.id;

      // Create price tables if provided
      if (tabelas.some((t) => t.preco)) {
        for (const tabela of tabelas) {
          if (tabela.preco) {
            try {
              await fetch("/api/tabelas-preco", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  productId,
                  lojaId,
                  tamanho: tabela.tamanho || null,
                  cor: tabela.cor || null,
                  preco: parseFloat(tabela.preco),
                }),
              });
            } catch (err) {
              console.error("Erro ao criar tabela de preço:", err);
            }
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ["produtos-anuncio", lojaId] });
      toast.success("Produto criado com sucesso!");
      resetForm();
      onSuccess?.(productId);
      onClose();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Erro ao criar produto",
      );
    },
  });

  const resetForm = () => {
    setFormData({
      grupoId: 0,
      nome: "",
      descricao: "",
      sku: "",
    });
    setTabelas([{ tamanho: "", cor: "", preco: "" }]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.grupoId || !formData.nome) {
      toast.error("Grupo e Nome do produto são obrigatórios");
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

  const handleTabelaChange = (index: number, field: string, value: string) => {
    const newTabelas = [...tabelas];
    newTabelas[index] = {
      ...newTabelas[index],
      [field]: value,
    };
    setTabelas(newTabelas);
  };

  const addTabelaRow = () => {
    setTabelas([...tabelas, { tamanho: "", cor: "", preco: "" }]);
  };

  const removeTabelaRow = (index: number) => {
    setTabelas(tabelas.filter((_, i) => i !== index));
  };

  const handleGrupoCreated = (grupoId: number) => {
    setFormData((prev) => ({
      ...prev,
      grupoId,
    }));
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-walmart-text">
              Criar Novo Produto
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
            {/* Grupo Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-walmart-text">
                  Grupo de Produtos *
                </label>
                <button
                  type="button"
                  onClick={() => setShowCreateGrupo(true)}
                  className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-walmart-blue text-white rounded-lg hover:bg-walmart-blue-dark transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Novo Grupo
                </button>
              </div>
              <select
                value={formData.grupoId}
                onChange={(e) => handleInputChange("grupoId", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-transparent"
              >
                <option value={0}>Selecione um grupo</option>
                {grupos.map((grupo: any) => (
                  <option key={grupo.id} value={grupo.id}>
                    {grupo.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Nome */}
            <div>
              <label className="block text-sm font-semibold text-walmart-text mb-2">
                Nome do Produto *
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => handleInputChange("nome", e.target.value)}
                placeholder="Ex: Camiseta Azul"
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
                placeholder="Descreva o produto..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-transparent"
              />
            </div>

            {/* SKU */}
            <div>
              <label className="block text-sm font-semibold text-walmart-text mb-2">
                SKU (Opcional)
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => handleInputChange("sku", e.target.value)}
                placeholder="Ex: CAM-001"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-transparent"
              />
            </div>

            {/* Variantes/Tabelas de Preço */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-walmart-text">
                  Variantes (Tamanho/Cor e Preço)
                </label>
                <button
                  type="button"
                  onClick={addTabelaRow}
                  className="inline-flex items-center gap-1 px-3 py-1 text-sm border border-walmart-blue text-walmart-blue rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar
                </button>
              </div>

              <div className="space-y-3">
                {tabelas.map((tabela, index) => (
                  <div key={index} className="flex gap-3 items-end">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Tamanho (ex: P, M, G)"
                        value={tabela.tamanho || ""}
                        onChange={(e) =>
                          handleTabelaChange(index, "tamanho", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-walmart-blue focus:border-transparent"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Cor (ex: Azul, Vermelho)"
                        value={tabela.cor || ""}
                        onChange={(e) =>
                          handleTabelaChange(index, "cor", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-walmart-blue focus:border-transparent"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex gap-2 items-center">
                        <span className="text-sm text-walmart-text">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Preço"
                          value={tabela.preco}
                          onChange={(e) =>
                            handleTabelaChange(index, "preco", e.target.value)
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-walmart-blue focus:border-transparent"
                        />
                      </div>
                    </div>
                    {tabelas.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTabelaRow(index)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-2 text-sm text-walmart-text-secondary">
                Adicione pelo menos um preço para este produto
              </p>
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
                {mutation.isPending ? "Criando..." : "Criar Produto"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Grupo Modal */}
      <CreateGrupoModal
        isOpen={showCreateGrupo}
        onClose={() => setShowCreateGrupo(false)}
        lojaId={lojaId}
        onSuccess={handleGrupoCreated}
      />
    </>
  );
}
