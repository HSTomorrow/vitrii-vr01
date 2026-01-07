import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft, Upload, AlertCircle, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

interface AnuncioFormProps {
  lojaId?: number;
  anuncioId?: number;
  onSuccess?: () => void;
}

interface Producto {
  id: number;
  nome: string;
  descricao?: string;
  grupo?: { id: number; nome: string };
  grupoDeProductos?: { id: number; nome: string };
  tabelasDePreco: Array<{
    id: number;
    preco: number;
    tamanho?: string;
    cor?: string;
  }>;
}

interface Loja {
  id: number;
  nome: string;
}

interface EquipeDeVenda {
  id: number;
  nome: string;
}

export default function AnuncioForm({ lojaId, anuncioId, onSuccess }: AnuncioFormProps) {
  const queryClient = useQueryClient();
  const [selectedLojaId, setSelectedLojaId] = useState(lojaId || 0);
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    productId: 0,
    tabelaDePrecoId: 0,
    fotoUrl: "",
    preco: "",
    dataValidade: "",
    equipeDeVendaId: 0,
    isDoacao: false,
  });

  // Fetch lojas
  const { data: lojasData } = useQuery({
    queryKey: ["lojas"],
    queryFn: async () => {
      const response = await fetch("/api/lojas");
      if (!response.ok) throw new Error("Erro ao buscar lojas");
      return response.json();
    },
  });

  // Fetch anuncio if editing
  const { data: anuncioData } = useQuery({
    queryKey: ["anuncio", anuncioId],
    queryFn: async () => {
      const response = await fetch(`/api/anuncios/${anuncioId}`);
      if (!response.ok) throw new Error("Erro ao buscar anúncio");
      return response.json();
    },
    enabled: !!anuncioId,
  });

  // Fetch productos for selected loja
  const { data: productosData } = useQuery({
    queryKey: ["produtos-anuncio", selectedLojaId],
    queryFn: async () => {
      const response = await fetch(`/api/lojas/${selectedLojaId}/produtos-para-anuncio`);
      if (!response.ok) throw new Error("Erro ao buscar produtos");
      return response.json();
    },
    enabled: selectedLojaId > 0,
  });

  // Fetch equipes de venda for selected loja
  const { data: equipesData } = useQuery({
    queryKey: ["equipes-venda", selectedLojaId],
    queryFn: async () => {
      const response = await fetch(`/api/equipes-venda?lojaId=${selectedLojaId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || "Erro ao buscar equipes");
      }
      return response.json();
    },
    enabled: selectedLojaId > 0,
  });

  // Populate form with anuncio data when editing
  useEffect(() => {
    if (anuncioData?.data) {
      const ad = anuncioData.data;
      setSelectedLojaId(ad.lojaId);
      setFormData({
        titulo: ad.titulo,
        descricao: ad.descricao || "",
        productId: ad.productId,
        tabelaDePrecoId: ad.tabelaDePrecoId || 0,
        fotoUrl: ad.fotoUrl || "",
        preco: ad.preco ? ad.preco.toString() : "",
        dataValidade: ad.dataValidade
          ? new Date(ad.dataValidade).toISOString().split('T')[0]
          : "",
        equipeDeVendaId: ad.equipeDeVendaId || 0,
        isDoacao: ad.isDoacao || false,
      });
    }
  }, [anuncioData]);

  // Create/update mutation
  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const url = anuncioId ? `/api/anuncios/${anuncioId}` : "/api/anuncios";
      const method = anuncioId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: data.titulo,
          descricao: data.descricao,
          fotoUrl: data.fotoUrl,
          lojaId: selectedLojaId,
          productId: data.productId,
          tabelaDePrecoId: data.tabelaDePrecoId > 0 ? data.tabelaDePrecoId : null,
          dataValidade: data.dataValidade
            ? new Date(data.dataValidade).toISOString()
            : null,
          equipeDeVendaId: data.equipeDeVendaId > 0 ? data.equipeDeVendaId : null,
          isDoacao: data.isDoacao,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = errorData.details || errorData.error || "Erro ao salvar anúncio";
        throw new Error(errorMsg);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anuncios"] });
      toast.success(anuncioId ? "Anúncio atualizado com sucesso!" : "Anúncio criado com sucesso!");
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      const errorMsg = error instanceof Error ? error.message : "Erro ao salvar";
      toast.error(errorMsg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedLojaId || !formData.productId) {
      toast.error("Loja e Produto são obrigatórios");
      return;
    }

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
      toast.error(error instanceof Error ? error.message : "Erro ao fazer upload");
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const lojas = lojasData?.data || [];
  const productos = productosData?.data || [];
  const equipes = equipesData?.data || [];

  // Get selected product details
  const selectedProducto = productos.find((p: Producto) => p.id === formData.productId);
  const priceTables = selectedProducto?.tabelasDePreco || [];

  const selectedPriceTable = priceTables.find(
    (pt) => pt.id === formData.tabelaDePrecoId
  );

  return (
    <div className="min-h-screen bg-walmart-gray-light py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/sell"
            className="inline-flex items-center text-walmart-blue hover:text-walmart-blue-dark font-semibold mb-4"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Voltar
          </Link>
          <h1 className="text-3xl font-bold text-walmart-text">
            {anuncioId ? "Editar Anúncio" : "Novo Anúncio"}
          </h1>
          <p className="text-walmart-text-secondary mt-2">
            {anuncioId
              ? "Atualize os detalhes do seu anúncio"
              : "Crie um novo anúncio para seus produtos e serviços"}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Loja Selection */}
            <div>
              <label className="block text-sm font-semibold text-walmart-text mb-2">
                Loja *
              </label>
              <select
                value={selectedLojaId}
                onChange={(e) => {
                  setSelectedLojaId(parseInt(e.target.value));
                  setFormData((prev) => ({ ...prev, productId: 0, tabelaDePrecoId: 0 }));
                }}
                disabled={!!anuncioId}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-transparent disabled:bg-gray-100"
              >
                <option value={0}>Selecione uma loja</option>
                {lojas.map((loja: Loja) => (
                  <option key={loja.id} value={loja.id}>
                    {loja.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Produto Selection */}
            <div>
              <label className="block text-sm font-semibold text-walmart-text mb-2">
                Produto *
              </label>
              {selectedLojaId > 0 ? (
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-transparent"
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
                  Selecione uma loja primeiro
                </div>
              )}
              {selectedProducto && (selectedProducto.grupo || selectedProducto.grupoDeProductos) && (
                <p className="mt-2 text-sm text-walmart-text-secondary">
                  Grupo: {(selectedProducto.grupo || selectedProducto.grupoDeProductos)?.nome}
                </p>
              )}
            </div>

            {/* Tabela de Preço Selection */}
            <div>
              <label className="block text-sm font-semibold text-walmart-text mb-2">
                Variante (Tamanho/Cor) - Opcional
              </label>
              {formData.productId > 0 ? (
                <select
                  value={formData.tabelaDePrecoId}
                  onChange={(e) =>
                    handleInputChange("tabelaDePrecoId", parseInt(e.target.value))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-transparent"
                >
                  <option value={0}>Nenhuma (opcional)</option>
                  {priceTables.map((pt) => (
                    <option key={pt.id} value={pt.id}>
                      {pt.tamanho && pt.cor
                        ? `${pt.tamanho} - ${pt.cor}`
                        : pt.tamanho || pt.cor || `R$ ${Number(pt.preco).toFixed(2)}`}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500">
                  Selecione um produto primeiro
                </div>
              )}
              {selectedPriceTable && (
                <p className="mt-2 text-sm text-walmart-blue font-semibold">
                  Preço: R$ {Number(selectedPriceTable.preco).toFixed(2)}
                </p>
              )}
            </div>

            {/* Valor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-walmart-text mb-2">
                  Valor (Preço) - Opcional
                </label>
                <div className="flex items-center">
                  <span className="text-walmart-text font-semibold mr-2">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.preco}
                    onChange={(e) => handleInputChange("preco", e.target.value)}
                    placeholder="Deixar em branco para usar preço da variante"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-transparent"
                  />
                </div>
                {selectedPriceTable && !formData.preco && (
                  <p className="mt-2 text-sm text-walmart-text-secondary">
                    Será usado preço da variante: R$ {Number(selectedPriceTable.preco).toFixed(2)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-walmart-text mb-2">
                  Validade do Anúncio
                </label>
                <input
                  type="date"
                  value={formData.dataValidade}
                  onChange={(e) => handleInputChange("dataValidade", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-transparent"
                />
                <p className="mt-2 text-sm text-walmart-text-secondary">
                  Padrão: 7 dias a partir de hoje
                </p>
              </div>
            </div>

            {/* Equipe de Venda */}
            <div>
              <label className="block text-sm font-semibold text-walmart-text mb-2">
                Equipe de Venda (Opcional)
              </label>
              {selectedLojaId > 0 ? (
                <select
                  value={formData.equipeDeVendaId}
                  onChange={(e) =>
                    handleInputChange("equipeDeVendaId", parseInt(e.target.value))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-transparent"
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
                  Selecione uma loja primeiro
                </div>
              )}
            </div>

            {/* Doação */}
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <input
                type="checkbox"
                id="isDoacao"
                checked={formData.isDoacao}
                onChange={(e) => {
                  handleInputChange("isDoacao", e.target.checked);
                }}
                className="w-5 h-5 text-walmart-blue cursor-pointer rounded"
              />
              <label htmlFor="isDoacao" className="flex-1 cursor-pointer">
                <p className="font-semibold text-walmart-text">
                  Esta é uma doação
                </p>
                <p className="text-sm text-walmart-text-secondary">
                  Marque esta opção para publicar como doação (valor zerado)
                </p>
              </label>
            </div>

            {/* Título */}
            <div>
              <label className="block text-sm font-semibold text-walmart-text mb-2">
                Título do Anúncio *
              </label>
              <input
                type="text"
                value={formData.titulo}
                onChange={(e) => handleInputChange("titulo", e.target.value)}
                placeholder="Ex: Camiseta Azul Premium"
                maxLength={255}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-transparent"
              />
              <p className="mt-1 text-sm text-walmart-text-secondary">
                {formData.titulo.length}/255 caracteres
              </p>
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-semibold text-walmart-text mb-2">
                Descrição (Opcional)
              </label>
              <textarea
                value={formData.descricao}
                onChange={(e) => handleInputChange("descricao", e.target.value)}
                placeholder="Descreva o produto em detalhes..."
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-transparent"
              />
            </div>

            {/* Foto */}
            <div>
              <label className="block text-sm font-semibold text-walmart-text mb-2">
                Foto (Opcional)
              </label>
              <div className="space-y-3">
                {/* File Upload Input */}
                <div className="relative">
                  <input
                    type="file"
                    id="file-upload"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error("Arquivo deve ter no máximo 5MB");
                          return;
                        }
                        handleFileUpload(file);
                        e.target.value = "";
                      }
                    }}
                    className="hidden"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-walmart-blue rounded-lg cursor-pointer hover:bg-blue-50 transition-colors"
                  >
                    <Upload className="w-5 h-5 text-walmart-blue" />
                    <span className="font-semibold text-walmart-text">
                      Clique para fazer upload ou arraste uma imagem
                    </span>
                  </label>
                </div>

                {/* URL Input (Alternative) */}
                <div className="relative">
                  <input
                    type="text"
                    value={formData.fotoUrl}
                    onChange={(e) => handleInputChange("fotoUrl", e.target.value)}
                    placeholder="Ou cole uma URL de imagem"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-transparent text-sm"
                  />
                </div>

                {/* Preview */}
                {formData.fotoUrl && (
                  <div className="relative">
                    <img
                      src={formData.fotoUrl}
                      alt="Preview"
                      className="h-40 w-full object-cover rounded-lg"
                      onError={() => {
                        toast.error("Não foi possível carregar a imagem");
                        handleInputChange("fotoUrl", "");
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleInputChange("fotoUrl", "")}
                      className="absolute top-2 right-2 px-3 py-1 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600"
                    >
                      Remover
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border-l-4 border-walmart-blue p-4 rounded">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-walmart-blue flex-shrink-0 mt-0.5" />
                <div className="text-sm text-walmart-text">
                  <p className="font-semibold">Informações sobre Publicação</p>
                  <p className="mt-1 text-walmart-text-secondary">
                    Você tem 3 anúncios gratuitos. Após isso, será cobrado R$ 9,90 por anúncio por
                    dia via Pix.
                  </p>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-6 border-t">
              <Link
                to="/sell"
                className="flex-1 px-4 py-3 border-2 border-walmart-blue text-walmart-blue rounded-lg font-semibold hover:bg-blue-50 transition-colors text-center"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="flex-1 px-4 py-3 bg-walmart-blue text-white rounded-lg font-semibold hover:bg-walmart-blue-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
    </div>
  );
}
