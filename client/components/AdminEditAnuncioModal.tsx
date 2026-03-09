import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X, AlertCircle } from "lucide-react";
import MultiImageUpload from "./MultiImageUpload";

interface UploadedImage {
  id?: string;
  file?: File;
  url: string;
}

interface AdminEditAnuncioModalProps {
  anuncio: any;
  isOpen: boolean;
  onClose: () => void;
  userId: number | undefined;
}

export default function AdminEditAnuncioModal({
  anuncio,
  isOpen,
  onClose,
  userId,
}: AdminEditAnuncioModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    imagem: "",
    preco: "",
    anuncianteId: 0,
    destaque: false,
    status: "ativo",
    statusPagamento: "pendente",
    isDoacao: false,
    aCombinar: false,
    tipo: "produto",
    dataFim: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [existingFotos, setExistingFotos] = useState<any[]>([]);

  // Fetch all anunciantes for dropdown
  const { data: anunciantesData } = useQuery({
    queryKey: ["anunciantes-all"],
    queryFn: async () => {
      const response = await fetch("/api/anunciantes?limit=500");
      if (!response.ok) throw new Error("Erro ao buscar anunciantes");
      return response.json();
    },
  });

  // Fetch existing fotos for the ad
  const { data: fotosData } = useQuery({
    queryKey: ["anuncio-fotos-edit", anuncio?.id],
    queryFn: async () => {
      if (!anuncio?.id) return null;
      const response = await fetch(`/api/anuncios/${anuncio.id}/fotos`);
      if (!response.ok) throw new Error("Erro ao buscar fotos");
      return response.json();
    },
    enabled: !!anuncio?.id && isOpen,
  });

  // Update form when anuncio changes
  useEffect(() => {
    if (anuncio && isOpen) {
      console.log("[AdminEditAnuncioModal] Loading anuncio:", anuncio);

      // Parse dataFim properly
      let dataFimValue = "";
      if (anuncio.dataFim) {
        try {
          const date = new Date(anuncio.dataFim);
          if (!isNaN(date.getTime())) {
            dataFimValue = date.toISOString().split('T')[0];
          }
        } catch (e) {
          console.error("[AdminEditAnuncioModal] Error parsing dataFim:", e);
        }
      }

      setFormData({
        titulo: anuncio.titulo || "",
        descricao: anuncio.descricao || "",
        imagem: anuncio.imagem || "",
        preco: anuncio.preco ? parseFloat(anuncio.preco).toString() : "",
        anuncianteId: anuncio.anuncianteId || 0,
        destaque: anuncio.destaque || false,
        status: anuncio.status || "ativo",
        statusPagamento: anuncio.statusPagamento || "pendente",
        isDoacao: anuncio.isDoacao || false,
        aCombinar: anuncio.aCombinar || false,
        tipo: anuncio.tipo || "produto",
        dataFim: dataFimValue,
      });

      // Initialize existing fotos
      const fotos = fotosData?.data || [];
      setExistingFotos(fotos);

      // Initialize uploaded images with existing fotos (mapped to match UploadedImage format)
      const existingImages = fotos.map((foto: any) => ({
        id: `existing-${foto.id}`,
        url: foto.url,
      }));
      setUploadedImages(existingImages);

      console.log("[AdminEditAnuncioModal] dataFim raw value:", anuncio.dataFim);
      console.log("[AdminEditAnuncioModal] dataFim parsed value:", dataFimValue);
      console.log("[AdminEditAnuncioModal] Existing fotos:", fotos);
      setErrors({});
    }
  }, [anuncio, isOpen, fotosData]);

  // Mutation to update anuncio
  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        titulo: data.titulo,
        descricao: data.descricao,
        fotoUrl: data.imagem,
        preco: data.isDoacao ? 0 : (data.preco ? parseFloat(data.preco) : null),
        anuncianteId: parseInt(data.anuncianteId.toString()),
        destaque: data.destaque,
        status: data.status,
        statusPagamento: data.statusPagamento,
        isDoacao: data.isDoacao,
        aCombinar: data.aCombinar,
        tipo: data.tipo,
        dataFim: data.dataFim ? new Date(data.dataFim).toISOString() : null,
      };
      console.log("[AdminEditAnuncioModal] Sending payload:", payload);

      const response = await fetch(`/api/anuncios/${anuncio.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId?.toString() || "",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao atualizar anúncio");
      }

      // Sync photos after updating the ad
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (userId) {
        headers["x-user-id"] = userId.toString();
      }

      // Determine which fotos to delete (existing fotos that are no longer in uploadedImages)
      const uploadedUrlSet = new Set(uploadedImages.map(img => img.url));
      const fotosToDelete = existingFotos.filter(
        (foto: any) => !uploadedUrlSet.has(foto.url)
      );

      // Delete removed fotos
      for (const foto of fotosToDelete) {
        try {
          await fetch(`/api/anuncios/${anuncio.id}/fotos/${foto.id}`, {
            method: "DELETE",
            headers,
          });
        } catch (error) {
          console.error("Error deleting foto:", error);
        }
      }

      // Determine which fotos to add (uploaded images that are not existing)
      const existingUrlSet = new Set(existingFotos.map((foto: any) => foto.url));
      const fotosToAdd = uploadedImages.filter(
        (img) => !existingUrlSet.has(img.url)
      );

      // Add new fotos
      for (const image of fotosToAdd) {
        try {
          await fetch(`/api/anuncios/${anuncio.id}/fotos`, {
            method: "POST",
            headers,
            body: JSON.stringify({ url: image.url }),
          });
        } catch (error) {
          console.error("Error adding foto:", error);
        }
      }

      // Invalidate photo queries
      queryClient.invalidateQueries({ queryKey: ["anuncio-fotos-edit", anuncio.id] });
      queryClient.invalidateQueries({ queryKey: ["anuncio-fotos", anuncio.id] });

      return response.json();
    },
    onSuccess: () => {
      toast.success("Anúncio atualizado com sucesso");
      queryClient.invalidateQueries({ queryKey: ["admin-anuncios"] });
      queryClient.invalidateQueries({ queryKey: ["browse-anuncios"] });
      onClose();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar");
    },
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.titulo.trim()) {
      newErrors.titulo = "Título é obrigatório";
    }
    if (!formData.anuncianteId) {
      newErrors.anuncianteId = "Anunciante é obrigatório";
    }
    if (!formData.isDoacao && !formData.aCombinar && !formData.preco) {
      newErrors.preco = "Preço é obrigatório (ou marque como Gratuito/A Combinar)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      console.log("[AdminEditAnuncioModal] Submitting form with dataFim:", formData.dataFim);
      updateMutation.mutate(formData);
    }
  };

  if (!isOpen) return null;

  const anunciantes = anunciantesData?.data || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-vitrii-text">Editar Anúncio</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Título */}
          <div>
            <label className="block text-sm font-semibold text-vitrii-text mb-2">
              Título *
            </label>
            <input
              type="text"
              value={formData.titulo}
              onChange={(e) => handleInputChange("titulo", e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue ${
                errors.titulo ? "border-red-500" : "border-gray-300"
              }`}
              maxLength={50}
            />
            {errors.titulo && (
              <p className="text-red-600 text-sm mt-1">{errors.titulo}</p>
            )}
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-semibold text-vitrii-text mb-2">
              Descrição
            </label>
            <textarea
              value={formData.descricao}
              onChange={(e) => handleInputChange("descricao", e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
            />
          </div>

          {/* Anunciante */}
          <div>
            <label className="block text-sm font-semibold text-vitrii-text mb-2">
              Anunciante *
            </label>
            <select
              value={formData.anuncianteId}
              onChange={(e) =>
                handleInputChange("anuncianteId", parseInt(e.target.value))
              }
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue ${
                errors.anuncianteId ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value={0}>Selecionar anunciante...</option>
              {anunciantes.map((a: any) => (
                <option key={a.id} value={a.id}>
                  {a.nome} (#{a.id})
                </option>
              ))}
            </select>
            {errors.anuncianteId && (
              <p className="text-red-600 text-sm mt-1">{errors.anuncianteId}</p>
            )}
          </div>

          {/* Imagens */}
          <div>
            <label className="block text-sm font-semibold text-vitrii-text mb-2">
              Imagens do Anúncio (até 5)
            </label>
            <MultiImageUpload
              onImagesChange={setUploadedImages}
              currentImages={uploadedImages}
              maxImages={5}
              anuncianteFotoUrl={null}
            />
            <p className="text-xs text-vitrii-text-secondary mt-2">
              A primeira imagem será a principal. Você pode adicionar ou remover imagens aqui.
            </p>
          </div>

          {/* Imagem Principal (fallback) */}
          <div>
            <label className="block text-sm font-semibold text-vitrii-text mb-2">
              URL da Imagem Principal (fallback)
            </label>
            <input
              type="text"
              value={formData.imagem}
              onChange={(e) => handleInputChange("imagem", e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
            />
            <p className="text-xs text-vitrii-text-secondary mt-1">
              Será usada como fallback se nenhuma imagem estiver adicionada acima.
            </p>
            {formData.imagem && (
              <img
                src={formData.imagem}
                alt="Preview"
                className="mt-2 max-w-xs max-h-48 rounded-lg"
                onError={() => {
                  setErrors((prev) => ({
                    ...prev,
                    imagem: "URL da imagem inválida",
                  }));
                }}
              />
            )}
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-semibold text-vitrii-text mb-2">
              Tipo de Anúncio
            </label>
            <select
              value={formData.tipo}
              onChange={(e) => handleInputChange("tipo", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
            >
              <option value="anuncio_padrao">Anúncio Padrão</option>
              <option value="produto">Produto</option>
              <option value="servico">Serviço</option>
              <option value="evento">Evento</option>
              <option value="aulas_cursos">Aulas/Cursos</option>
              <option value="oportunidade">Oportunidade</option>
            </select>
          </div>

          {/* Preço */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-vitrii-text mb-2">
                Preço (R$)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.preco}
                onChange={(e) => handleInputChange("preco", e.target.value)}
                disabled={formData.isDoacao || formData.aCombinar}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue disabled:bg-gray-100 ${
                  errors.preco ? "border-red-500" : ""
                }`}
              />
              {errors.preco && (
                <p className="text-red-600 text-sm mt-1">{errors.preco}</p>
              )}
            </div>

            {/* Checkboxes */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isDoacao}
                  onChange={(e) =>
                    handleInputChange("isDoacao", e.target.checked)
                  }
                  className="w-4 h-4"
                />
                <span className="text-sm text-vitrii-text">Gratuito</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.aCombinar}
                  onChange={(e) =>
                    handleInputChange("aCombinar", e.target.checked)
                  }
                  className="w-4 h-4"
                />
                <span className="text-sm text-vitrii-text">A Combinar</span>
              </label>
            </div>
          </div>

          {/* Destaque */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.destaque}
              onChange={(e) => handleInputChange("destaque", e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm font-semibold text-vitrii-text">
              Em Destaque (Featured)
            </span>
          </label>

          {/* Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-vitrii-text mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange("status", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
              >
                <option value="em_edicao">Em Edição</option>
                <option value="aguardando_pagamento">Aguardando Pagamento</option>
                <option value="pago">Pago</option>
                <option value="ativo">Ativo</option>
                <option value="historico">Histórico</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-vitrii-text mb-2">
                Status de Pagamento
              </label>
              <select
                value={formData.statusPagamento}
                onChange={(e) =>
                  handleInputChange("statusPagamento", e.target.value)
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
              >
                <option value="pendente">Pendente</option>
                <option value="aprovado">Aprovado</option>
                <option value="recusado">Recusado</option>
              </select>
            </div>
          </div>

          {/* Data Fim (Admin only) */}
          <div>
            <label className="block text-sm font-semibold text-vitrii-text mb-2">
              Data Fim (Override Admin)
            </label>
            <input
              type="date"
              value={formData.dataFim}
              onChange={(e) => handleInputChange("dataFim", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
            />
            <p className="text-xs text-vitrii-text-secondary mt-1">
              Se deixado em branco, será calculado automaticamente (7 dias para Padrão, 30 dias para Profissional)
            </p>
          </div>

          {/* Info Box */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Aviso</p>
              <p>
                Quando um anúncio é salvo/editado, a data final é calculada automaticamente
                baseada no tipo de anunciante (7 dias para Padrão, 30 para Profissional), a
                menos que você especifique uma data customizada acima.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={updateMutation.isPending}
            className="px-6 py-2 border border-gray-300 rounded-lg text-vitrii-text hover:bg-gray-50 transition font-semibold"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={updateMutation.isPending}
            className="px-6 py-2 bg-vitrii-blue text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50"
          >
            {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </div>
    </div>
  );
}
