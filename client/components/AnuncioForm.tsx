import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ChevronLeft,
  Upload,
  AlertCircle,
  CheckCircle,
  Plus,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import CategoryFields from "./CategoryFields";
import CreateAnuncianteModal from "./CreateLojaModal";
import CreateProductoModal from "./CreateProductoModal";
import MultiImageUpload from "./MultiImageUpload";
import { BRAZILIAN_STATES } from "@shared/brazilianStates";

interface AnuncioFormProps {
  anuncianteId?: number;
  anuncioId?: number;
  onSuccess?: () => void;
  isDonation?: boolean;
  anuncioTipo?: string | null;
}

interface Producto {
  id: number;
  nome: string;
  descricao?: string;
  tipo?: string; // "produto", "servico", "evento", "agenda_recorrente"
  grupo?: { id: number; nome: string };
  grupoDeProductos?: { id: number; nome: string };
  tabelasDePreco: Array<{
    id: number;
    preco: number;
    tamanho?: string;
    cor?: string;
  }>;
}

interface Anunciante {
  id: number;
  nome: string;
}

interface EquipeDeVenda {
  id: number;
  nome: string;
}

// Calculate default validity date (7 days from today)
const getDefaultValidityDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().split("T")[0];
};

export default function AnuncioForm({
  anuncianteId,
  anuncioId,
  onSuccess,
  isDonation,
  anuncioTipo,
}: AnuncioFormProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedAnuncianteId, setSelectedAnuncianteId] = useState(
    anuncianteId || 0,
  );
  const [showCreateLoja, setShowCreateLoja] = useState(false);
  const [showCreateProducto, setShowCreateProducto] = useState(false);
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    productId: 0,
    tabelaDePrecoId: 0,
    fotoUrl: "",
    precoAnuncio: "",
    dataValidade: getDefaultValidityDate(),
    equipeDeVendaId: 0,
    endereco: "",
    cidade: "",
    estado: "RS",
    isDoacao: isDonation || false,
    aCombinar: false,
    destaque: false,
    categoria: "" as string,
    dadosCategoria: "",
    tipo: anuncioTipo || ("produto" as string),
  });
  const [uploadedImages, setUploadedImages] = useState<
    Array<{ id?: string; url: string }>
  >([]);

  // Handlers for inline creation
  const handleAnuncianteCreated = (newAnuncianteId: number) => {
    setSelectedAnuncianteId(newAnuncianteId);
    setFormData((prev) => ({ ...prev, productId: 0, tabelaDePrecoId: 0 }));
    setShowCreateLoja(false);
    // Refresh the anunciantes list
    queryClient.invalidateQueries({ queryKey: ["anunciantes-do-usuario"] });
  };

  const handleProductoCreated = (newProductoId: number) => {
    setFormData((prev) => ({
      ...prev,
      productId: newProductoId,
      tabelaDePrecoId: 0,
    }));
    setShowCreateProducto(false);
    // Refresh the produtos list
    queryClient.invalidateQueries({
      queryKey: ["produtos-anuncio", selectedAnuncianteId],
    });
  };

  // Fetch anunciantes - filtered by user (ADM sees all, regular users see only theirs)
  const { data: anunciantesData } = useQuery({
    queryKey: ["anunciantes-do-usuario", user?.id],
    queryFn: async () => {
      // If user is ADM, fetch all anunciantes without filter
      if (user?.tipoUsuario === "adm") {
        const response = await fetch("/api/anunciantes");
        if (!response.ok) throw new Error("Erro ao buscar anunciantes");
        return response.json();
      }
      // Otherwise, fetch only user's anunciantes
      const response = await fetch("/api/anunciantes/do-usuario/listar", {
        headers: {
          "x-user-id": String(user?.id),
        },
      });
      if (!response.ok) throw new Error("Erro ao buscar anunciantes");
      return response.json();
    },
    enabled: !!user,
  });

  // Fetch anuncio if editing
  const {
    data: anuncioData,
    isLoading: isLoadingAnuncio,
    error: anuncioError,
  } = useQuery({
    queryKey: ["anuncio", anuncioId],
    queryFn: async () => {
      const response = await fetch(`/api/anuncios/${anuncioId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao buscar anúncio");
      }
      return response.json();
    },
    enabled: !!anuncioId,
  });

  // Fetch existing photos if editing
  const { data: fotosData } = useQuery({
    queryKey: ["anuncio-fotos", anuncioId],
    queryFn: async () => {
      const response = await fetch(`/api/anuncios/${anuncioId}/fotos`);
      if (!response.ok) throw new Error("Erro ao buscar fotos");
      return response.json();
    },
    enabled: !!anuncioId,
  });

  // Fetch productos for selected anunciante
  const { data: productosData } = useQuery({
    queryKey: ["produtos-anuncio", selectedAnuncianteId],
    queryFn: async () => {
      const response = await fetch(
        `/api/anunciantes/${selectedAnuncianteId}/produtos-para-anuncio`,
      );
      if (!response.ok) throw new Error("Erro ao buscar produtos");
      return response.json();
    },
    enabled: selectedAnuncianteId > 0,
  });

  // Fetch equipes de venda for selected anunciante
  const { data: equipesData } = useQuery({
    queryKey: ["equipes-venda", selectedAnuncianteId],
    queryFn: async () => {
      const response = await fetch(
        `/api/equipes-venda?anuncianteId=${selectedAnuncianteId}`,
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.details || error.error || "Erro ao buscar equipes",
        );
      }
      return response.json();
    },
    enabled: selectedAnuncianteId > 0,
  });

  // Get data from queries BEFORE the effects
  const anunciantes = anunciantesData?.data || [];
  const productos = productosData?.data || [];
  const equipes = equipesData?.data || [];

  // Get selected anunciante details
  const selectedAnunciante = anunciantes.find(
    (a: Anunciante) => a.id === selectedAnuncianteId,
  );

  // Get selected product details
  const selectedProducto = productos.find(
    (p: Producto) => p.id === formData.productId,
  );
  const priceTables = selectedProducto?.tabelasDePreco || [];

  const selectedPriceTable = priceTables.find(
    (pt) => pt.id === formData.tabelaDePrecoId,
  );

  // Auto-select first anunciante when list loads
  useEffect(() => {
    if (anunciantes.length > 0 && selectedAnuncianteId === 0 && !anuncioId) {
      setSelectedAnuncianteId(anunciantes[0].id);
    }
  }, [anunciantes, anuncioId]);

  // Update tipo when product is selected
  useEffect(() => {
    if (selectedProducto && selectedProducto.tipo) {
      setFormData((prev) => ({
        ...prev,
        tipo: selectedProducto.tipo || "produto",
      }));
    }
  }, [selectedProducto?.id]);

  // Populate form with anuncio data when editing
  useEffect(() => {
    if (anuncioData?.data) {
      const ad = anuncioData.data;
      console.log("Loading anuncio data for editing:", ad);

      setSelectedAnuncianteId(ad.anuncianteId);
      setFormData({
        titulo: ad.titulo,
        descricao: ad.descricao || "",
        productId: ad.productId,
        tabelaDePrecoId: ad.tabelaDePrecoId || 0,
        fotoUrl: ad.imagem || "",
        precoAnuncio: ad.preco ? ad.preco.toString() : "",
        dataValidade: ad.dataValidade
          ? new Date(ad.dataValidade).toISOString().split("T")[0]
          : getDefaultValidityDate(),
        equipeDeVendaId: ad.equipeDeVendaId || 0,
        endereco: ad.endereco || "",
        cidade: ad.cidade || "",
        estado: ad.estado || "RS",
        isDoacao: ad.isDoacao || false,
        aCombinar: ad.aCombinar || false,
        destaque: ad.destaque || false,
        categoria: ad.categoria || "",
        dadosCategoria: ad.dadosCategoria || "",
        tipo: ad.tipo || "produto",
      });

      toast.success("Anúncio carregado com sucesso");
    }
  }, [anuncioData]);

  // Populate photos when editing
  useEffect(() => {
    if (fotosData?.data && fotosData.data.length > 0) {
      const photos = fotosData.data.map((foto: any) => ({
        id: foto.id,
        url: foto.url,
      }));
      setUploadedImages(photos);
    }
  }, [fotosData]);

  // Create/update mutation
  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const url = anuncioId ? `/api/anuncios/${anuncioId}` : "/api/anuncios";
      const method = anuncioId ? "PUT" : "POST";

      const payload = {
        usuarioId: user?.id,
        titulo: data.titulo,
        descricao: data.descricao,
        fotoUrl: data.fotoUrl,
        precoAnuncio: data.aCombinar ? 0 : (data.precoAnuncio ? parseFloat(data.precoAnuncio) : null),
        anuncianteId: selectedAnuncianteId,
        productId: data.productId > 0 ? data.productId : null,
        tabelaDePrecoId: data.tabelaDePrecoId > 0 ? data.tabelaDePrecoId : null,
        dataValidade: data.dataValidade
          ? new Date(data.dataValidade).toISOString()
          : null,
        equipeDeVendaId: data.equipeDeVendaId > 0 ? data.equipeDeVendaId : null,
        endereco: data.endereco || null,
        cidade: data.cidade || null,
        estado: data.estado || null,
        tipo: data.tipo || "produto",
        isDoacao: data.isDoacao,
        aCombinar: data.aCombinar,
        destaque: data.destaque,
        categoria: data.categoria || null,
        dadosCategoria: data.dadosCategoria || null,
      };

      console.log("[AnuncioForm] Submitting form with payload:", payload);

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("[AnuncioForm] Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("[AnuncioForm] Error response:", errorData);
        const errorMsg =
          errorData.details || errorData.error || "Erro ao salvar anúncio";
        throw new Error(errorMsg);
      }

      const result = await response.json();
      console.log("[AnuncioForm] Success response:", result);
      return result;
    },
    onSuccess: async (result) => {
      console.log("[AnuncioForm] Mutation successful, invalidating queries");
      queryClient.invalidateQueries({ queryKey: ["anuncios"] });

      const successMessage = anuncioId
        ? "Anúncio atualizado com sucesso!"
        : "Anúncio criado com sucesso!";

      console.log("[AnuncioForm] Showing toast:", successMessage);
      toast.success(successMessage);

      // If creating a new ad (not editing) and we have additional images
      if (!anuncioId && result.data?.id) {
        console.log("[AnuncioForm] New ad created, ID:", result.data.id);
        console.log("[AnuncioForm] isDoacao:", result.data.isDoacao);

        // Upload additional images if any
        if (uploadedImages.length > 1) {
          console.log(
            "[AnuncioForm] Uploading additional images:",
            uploadedImages.length,
          );
          try {
            for (let i = 1; i < uploadedImages.length; i++) {
              const image = uploadedImages[i];
              await fetch(`/api/anuncios/${result.data.id}/fotos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: image.url }),
              });
            }
            console.log(
              "[AnuncioForm] Additional images uploaded successfully",
            );
          } catch (error) {
            console.error(
              "[AnuncioForm] Error uploading additional images:",
              error,
            );
            toast.warning(
              "Anúncio criado, mas houve erro ao salvar algumas imagens",
            );
          }
        }

        setTimeout(() => {
          // Donations go directly to ad detail (no payment needed)
          // Regular ads go to checkout
          if (result.data.isDoacao) {
            console.log("[AnuncioForm] Navigating to ad detail (donation)");
            navigate(`/anuncio/${result.data.id}`);
          } else {
            console.log("[AnuncioForm] Navigating to checkout");
            navigate(`/checkout/${result.data.id}`);
          }
        }, 500);
      } else if (anuncioId && onSuccess) {
        console.log("[AnuncioForm] Editing mode, calling onSuccess callback");
        onSuccess();
      }
    },
    onError: (error) => {
      const errorMsg =
        error instanceof Error ? error.message : "Erro ao salvar";
      console.error("[AnuncioForm] Mutation error:", error);
      console.error("[AnuncioForm] Error details:", errorMsg);
      toast.error(`Erro ao salvar anúncio: ${errorMsg}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log("[AnuncioForm] Form submission started");
    console.log("[AnuncioForm] Form data:", formData);
    console.log("[AnuncioForm] Selected anunciante ID:", selectedAnuncianteId);

    // Basic required fields
    if (!selectedAnuncianteId || !formData.titulo) {
      console.warn(
        "[AnuncioForm] Validation failed: missing anunciante or titulo",
      );
      toast.error("Anunciante e Título são obrigatórios");
      return;
    }

    // Validate price: either precoAnuncio must be filled OR isDoacao must be true
    const hasPrice =
      formData.precoAnuncio && parseFloat(formData.precoAnuncio) > 0;
    const isFreeAd = formData.isDoacao;

    console.log("[AnuncioForm] Price validation:", {
      hasPrice,
      isFreeAd,
      precoAnuncio: formData.precoAnuncio,
    });

    if (!hasPrice && !isFreeAd) {
      console.warn("[AnuncioForm] Validation failed: no price or free ad");
      toast.error(
        "Você deve preencher o Valor do anúncio ou marcar como gratuito/doação",
      );
      return;
    }

    console.log("[AnuncioForm] All validations passed, submitting mutation");
    mutation.mutate(formData);
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
      handleInputChange("fotoUrl", data.url);
      toast.success("Imagem enviada com sucesso!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao fazer upload",
      );
    }
  };

  const handleInputChange = (
    field: string,
    value: string | number | boolean,
  ) => {
    // Prevent changes to price or donation checkbox when accessed via "Publicar Grátis"
    if (isDonation && (field === "precoAnuncio" || field === "isDoacao")) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Show loading state while fetching anuncio for editing
  if (anuncioId && isLoadingAnuncio) {
    return (
      <div className="min-h-screen bg-vitrii-gray-light py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vitrii-blue mx-auto mb-4"></div>
            <p className="text-vitrii-text-secondary text-lg">
              Carregando anúncio...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if anuncio failed to load
  if (anuncioId && anuncioError) {
    return (
      <div className="min-h-screen bg-vitrii-gray-light py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-red-800 mb-2">
              Erro ao Carregar Anúncio
            </h2>
            <p className="text-red-700 mb-4">
              {anuncioError instanceof Error
                ? anuncioError.message
                : "Não foi possível carregar o anúncio"}
            </p>
            <Link
              to="/sell"
              className="inline-flex items-center gap-2 px-4 py-2 bg-vitrii-blue text-white rounded-lg hover:bg-vitrii-blue-dark transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Voltar
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-vitrii-gray-light py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/sell"
            className="inline-flex items-center text-vitrii-blue hover:text-vitrii-blue-dark font-semibold mb-4"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Voltar
          </Link>
          <h1 className="text-3xl font-bold text-vitrii-text">
            {anuncioId ? "Editar Anúncio" : "Novo Anúncio"}
          </h1>
          <p className="text-vitrii-text-secondary mt-2">
            {anuncioId
              ? "Atualize os detalhes do seu anúncio"
              : "Crie um novo anúncio para seus produtos e serviços"}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Anunciante Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-vitrii-text">
                  Anunciante *
                </label>
                <button
                  type="button"
                  onClick={() => setShowCreateLoja(true)}
                  className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-vitrii-blue text-white rounded-lg hover:bg-vitrii-blue-dark transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Novo Anunciante
                </button>
              </div>
              <select
                value={selectedAnuncianteId}
                onChange={(e) => {
                  setSelectedAnuncianteId(parseInt(e.target.value));
                  setFormData((prev) => ({
                    ...prev,
                    productId: 0,
                    tabelaDePrecoId: 0,
                  }));
                }}
                disabled={!!anuncioId}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vitrii-blue focus:border-transparent disabled:bg-gray-100"
              >
                <option value={0}>Selecione um anunciante</option>
                {anunciantes.map((anunciante: Anunciante) => (
                  <option key={anunciante.id} value={anunciante.id}>
                    {anunciante.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Título */}
            <div>
              <label className="block text-sm font-semibold text-vitrii-text mb-2">
                Título do Anúncio *
              </label>
              <input
                type="text"
                value={formData.titulo}
                onChange={(e) => handleInputChange("titulo", e.target.value)}
                placeholder="Ex: Camiseta Azul"
                maxLength={50}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vitrii-blue focus:border-transparent"
              />
              <p className="mt-1 text-sm text-vitrii-text-secondary">
                {formData.titulo.length}/50 caracteres
              </p>
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-semibold text-vitrii-text mb-2">
                Descrição (Opcional)
              </label>
              <textarea
                value={formData.descricao}
                onChange={(e) => handleInputChange("descricao", e.target.value)}
                placeholder="Descreva o produto em detalhes..."
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vitrii-blue focus:border-transparent"
              />
            </div>

            {/* Preço do Anúncio - Sempre Visível */}
            <div>
              <label className="block text-sm font-semibold text-vitrii-text mb-2">
                Valor {formData.isDoacao ? "(Gratuito)" : ""}
              </label>
              <div className="flex items-center gap-2 w-1/2">
                <span className="text-vitrii-text font-semibold">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.isDoacao || formData.aCombinar ? "0" : formData.precoAnuncio}
                  onChange={(e) =>
                    !formData.isDoacao &&
                    !formData.aCombinar &&
                    handleInputChange("precoAnuncio", e.target.value)
                  }
                  disabled={formData.isDoacao || formData.aCombinar}
                  placeholder={
                    formData.isDoacao
                      ? "0.00 (Gratuito)"
                      : formData.aCombinar
                        ? "0.00 (A Combinar)"
                      : selectedPriceTable
                        ? `Ex: ${Number(selectedPriceTable.preco).toFixed(2)}`
                        : "Ex: 99.90"
                  }
                  className={`flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vitrii-blue focus:border-transparent ${
                    formData.isDoacao || formData.aCombinar ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                />
              </div>
              {formData.precoAnuncio &&
                !formData.isDoacao &&
                !formData.aCombinar &&
                selectedPriceTable &&
                Number(formData.precoAnuncio) <
                  Number(selectedPriceTable.preco) && (
                  <p className="mt-2 text-sm text-green-600 font-semibold">
                    ✓ Desconto aplicado! Economia: R${" "}
                    {(
                      Number(selectedPriceTable.preco) -
                      Number(formData.precoAnuncio)
                    ).toFixed(2)}
                  </p>
                )}
            </div>

            {/* "A Combinar" Checkbox - Only for Produtos and Serviços, not for Doações/Brindes */}
            {formData.tipo !== "doacao" && (
              <div className="flex items-center gap-3 p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                <input
                  type="checkbox"
                  id="aCombinar"
                  checked={formData.aCombinar}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    if (isChecked && formData.isDoacao) {
                      toast.error(
                        "Não é possível usar 'A Combinar' junto com 'Gratuito'"
                      );
                      return;
                    }
                    handleInputChange("aCombinar", isChecked);
                    if (isChecked) {
                      handleInputChange("precoAnuncio", "0");
                    }
                  }}
                  disabled={formData.isDoacao}
                  className={`w-4 h-4 rounded focus:ring-2 ${
                    formData.isDoacao
                      ? "bg-gray-100 border-gray-300 cursor-not-allowed"
                      : "bg-white border-gray-300 text-yellow-600 focus:ring-yellow-500 cursor-pointer"
                  }`}
                />
                <div className="flex-1">
                  <label
                    htmlFor="aCombinar"
                    className={`text-sm font-semibold text-vitrii-text ${
                      formData.isDoacao ? "cursor-not-allowed opacity-75" : "cursor-pointer"
                    }`}
                  >
                    A combinar
                  </label>
                  <p className="text-xs text-gray-600 mt-1">
                    Selecione para indicar que o valor será negociado diretamente
                  </p>
                </div>
              </div>
            )}

            {/* Gratuito - Moved after Valor field */}
            <div
              className={`flex items-center gap-3 p-4 border rounded-lg ${
                isDonation
                  ? "bg-blue-50 border-blue-200"
                  : "bg-green-50 border-green-200"
              }`}
            >
              <input
                type="checkbox"
                id="isDoacao"
                checked={formData.isDoacao}
                onChange={(e) => {
                  // Only allow changes if not accessed via "Publicar Grátis"
                  if (!isDonation) {
                    const isChecked = e.target.checked;
                    if (isChecked && formData.aCombinar) {
                      toast.error(
                        "Não é possível usar 'Gratuito' junto com 'A Combinar'"
                      );
                      return;
                    }
                    handleInputChange("isDoacao", isChecked);
                    if (isChecked) {
                      handleInputChange("precoAnuncio", "0");
                    }
                  }
                }}
                disabled={isDonation}
                className={`w-4 h-4 rounded focus:ring-2 ${
                  isDonation
                    ? "bg-gray-100 border-gray-300 cursor-not-allowed text-blue-600 focus:ring-blue-500"
                    : "bg-white border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                }`}
              />
              <div className="flex-1">
                <label
                  htmlFor="isDoacao"
                  className={`text-sm font-semibold text-vitrii-text ${
                    isDonation
                      ? "cursor-not-allowed opacity-75"
                      : "cursor-pointer"
                  }`}
                >
                  Gratuito
                </label>
                {isDonation && (
                  <p className="text-xs text-blue-600 mt-1">
                    ℹ️ Esta opção foi pré-selecionada e não pode ser alterada
                  </p>
                )}
              </div>
            </div>

            {/* Validade do Anúncio */}
            <div>
              <label className="block text-sm font-semibold text-vitrii-text mb-2">
                Validade do Anúncio
              </label>
              <input
                type="date"
                value={formData.dataValidade}
                onChange={(e) =>
                  handleInputChange("dataValidade", e.target.value)
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vitrii-blue focus:border-transparent"
              />
              <p className="mt-2 text-sm text-vitrii-text-secondary">
                Padrão: 7 dias a partir da data de criação
              </p>
            </div>

            {/* Informações para Anunciantes Profissionais Section */}
            <div className="border-t-2 border-gray-200 pt-8 mt-8">
              <h2 className="text-lg font-bold text-vitrii-text mb-6">
                Informações para Anunciantes Profissionais
              </h2>

              {/* Produto Selection */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-vitrii-text">
                    Produto (Opcional)
                  </label>
                  {selectedAnuncianteId > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowCreateProducto(true)}
                      className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-vitrii-blue text-white rounded-lg hover:bg-vitrii-blue-dark transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Novo Produto
                    </button>
                  )}
                </div>
                {selectedAnuncianteId > 0 ? (
                  <select
                    value={formData.productId}
                    onChange={(e) => {
                      const productId = parseInt(e.target.value);
                      setFormData((prev) => ({
                        ...prev,
                        productId,
                        tabelaDePrecoId: 0,
                      }));
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vitrii-blue focus:border-transparent"
                  >
                    <option value={0}>Selecione um produto</option>
                    {productos.map((p: Producto) => (
                      <option key={p.id} value={p.id}>
                        {p.nome}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500">
                    Selecione um anunciante primeiro
                  </div>
                )}
                {selectedProducto &&
                  (selectedProducto.grupo ||
                    selectedProducto.grupoDeProductos) && (
                    <p className="mt-2 text-sm text-vitrii-text-secondary">
                      Grupo:{" "}
                      {
                        (
                          selectedProducto.grupo ||
                          selectedProducto.grupoDeProductos
                        )?.nome
                      }
                    </p>
                  )}
                {selectedProducto?.tipo && (
                  <p className="mt-2 text-sm text-vitrii-text-secondary">
                    Tipo:{" "}
                    <span className="font-semibold capitalize">
                      {selectedProducto.tipo === "agenda_recorrente"
                        ? "Agenda Recorrente"
                        : selectedProducto.tipo}
                    </span>
                  </p>
                )}
              </div>

              {/* Tabela de Preço Selection - Only for regular products/services */}
              {selectedProducto?.tipo &&
                ["produto", "servico"].includes(selectedProducto.tipo) &&
                priceTables.length > 0 && (
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-vitrii-text mb-2">
                      Variante (Tamanho/Cor) - Opcional
                    </label>
                    {formData.productId > 0 ? (
                      <select
                        value={formData.tabelaDePrecoId}
                        onChange={(e) =>
                          handleInputChange(
                            "tabelaDePrecoId",
                            parseInt(e.target.value),
                          )
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vitrii-blue focus:border-transparent"
                      >
                        <option value={0}>
                          Selecione uma variante (opcional)
                        </option>
                        {priceTables.map((pt) => (
                          <option key={pt.id} value={pt.id}>
                            {pt.tamanho && pt.cor
                              ? `${pt.tamanho} - ${pt.cor}`
                              : pt.tamanho ||
                                pt.cor ||
                                `R$ ${Number(pt.preco).toFixed(2)}`}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500">
                        Selecione um produto primeiro
                      </div>
                    )}
                    {selectedPriceTable && (
                      <p className="mt-2 text-sm text-vitrii-blue font-semibold">
                        Preço da Variante: R${" "}
                        {Number(selectedPriceTable.preco).toFixed(2)}
                      </p>
                    )}
                  </div>
                )}
              {selectedProducto?.tipo &&
                !["produto", "servico"].includes(selectedProducto.tipo) && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
                    <p className="text-sm text-blue-800">
                      <strong>ℹ️ Dica:</strong> Este tipo de anúncio não requer
                      variantes. O preço será definido diretamente no campo
                      "Valor do Anúncio" acima.
                    </p>
                  </div>
                )}

              {/* Equipe de Venda */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-vitrii-text mb-2">
                  Equipe de Venda (Opcional)
                </label>
                {selectedAnuncianteId > 0 ? (
                  <select
                    value={formData.equipeDeVendaId}
                    onChange={(e) =>
                      handleInputChange(
                        "equipeDeVendaId",
                        parseInt(e.target.value),
                      )
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vitrii-blue focus:border-transparent"
                  >
                    <option value={0}>Nenhuma equipe selecionada</option>
                    {equipes.map((eq: EquipeDeVenda) => (
                      <option key={eq.id} value={eq.id}>
                        {eq.nome}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500">
                    Selecione um anunciante primeiro
                  </div>
                )}
              </div>

              {/* Category-Specific Fields */}
              <div className="mb-6">
                <CategoryFields
                  categoria={formData.categoria}
                  dadosCategoria={formData.dadosCategoria}
                  onCategoryChange={(categoria) =>
                    handleInputChange("categoria", categoria)
                  }
                  onDadosChange={(dados) =>
                    handleInputChange("dadosCategoria", dados)
                  }
                />
              </div>
            </div>

            {/* Endereço */}
            <div>
              <label className="block text-sm font-semibold text-vitrii-text mb-2">
                Endereço (Opcional)
              </label>
              <input
                type="text"
                value={formData.endereco}
                onChange={(e) => handleInputChange("endereco", e.target.value)}
                placeholder="Ex: Rua das Flores, 123"
                maxLength={100}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vitrii-blue focus:border-transparent"
              />
              <p className="mt-1 text-sm text-vitrii-text-secondary">
                {formData.endereco.length}/100 caracteres
              </p>
            </div>

            {/* Localização (Município e Estado) */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-vitrii-text mb-2">
                  Município (Opcional)
                </label>
                <input
                  type="text"
                  value={formData.cidade}
                  onChange={(e) => handleInputChange("cidade", e.target.value)}
                  placeholder="Ex: Belo Horizonte"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vitrii-blue focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-vitrii-text mb-2">
                  Estado (Opcional)
                </label>
                <select
                  value={formData.estado}
                  onChange={(e) => handleInputChange("estado", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vitrii-blue focus:border-transparent bg-white"
                >
                  <option value="">-- Selecione um estado --</option>
                  {BRAZILIAN_STATES.map((state) => (
                    <option key={state.code} value={state.code}>
                      {state.code} - {state.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Fotos (Multiple Images) */}
            <div>
              <label className="block text-sm font-semibold text-vitrii-text mb-2">
                Fotos (Opcional - máximo 5)
              </label>
              <MultiImageUpload
                currentImages={uploadedImages}
                onImagesChange={(images) => {
                  setUploadedImages(images);
                  // Set the first image as the primary image
                  if (images.length > 0) {
                    handleInputChange("fotoUrl", images[0].url);
                  } else {
                    handleInputChange("fotoUrl", "");
                  }
                }}
                maxImages={5}
                anuncianteFotoUrl={selectedAnunciante?.fotoUrl}
              />
            </div>

            {/* Destaque (Featured) - Now at the end */}
            <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-vitrii-yellow rounded-lg">
              <input
                type="checkbox"
                id="destaque"
                checked={formData.destaque}
                onChange={(e) => {
                  handleInputChange("destaque", e.target.checked);
                }}
                className="w-5 h-5 text-vitrii-yellow cursor-pointer rounded"
              />
              <label htmlFor="destaque" className="flex-1 cursor-pointer">
                <p className="font-semibold text-vitrii-text">
                  ⭐ Anuncio em Destaque
                </p>
                <p className="text-sm text-vitrii-text-secondary">
                  Marque esta opção para colocar o anúncio em destaque na página
                  principal
                </p>
              </label>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border-l-4 border-vitrii-blue p-4 rounded">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-vitrii-blue flex-shrink-0 mt-0.5" />
                <div className="text-sm text-vitrii-text">
                  <p className="font-semibold">Informações sobre Publicação</p>
                  <p className="mt-1 text-vitrii-text-secondary">
                    Você tem 3 anúncios gratuitos. Após isso, será cobrado R$
                    9,90 por anúncio por dia via Pix.
                  </p>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-6 border-t">
              <Link
                to="/sell"
                className="flex-1 px-4 py-3 border-2 border-vitrii-blue text-vitrii-blue rounded-lg font-semibold hover:bg-blue-50 transition-colors text-center"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="flex-1 px-4 py-3 bg-vitrii-blue text-white rounded-lg font-semibold hover:bg-vitrii-blue-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {mutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    {anuncioId ? "Atualizar" : "Publicar"} Anúncio
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Create Anunciante Modal */}
      <CreateAnuncianteModal
        isOpen={showCreateLoja}
        onClose={() => setShowCreateLoja(false)}
        onSuccess={handleAnuncianteCreated}
      />

      {/* Create Producto Modal */}
      <CreateProductoModal
        isOpen={showCreateProducto}
        onClose={() => setShowCreateProducto(false)}
        anuncianteId={selectedAnuncianteId}
        onSuccess={handleProductoCreated}
      />
    </div>
  );
}
