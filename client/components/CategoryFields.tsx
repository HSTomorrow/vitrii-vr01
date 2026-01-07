import { useState, useEffect } from "react";

interface CategoryFieldsProps {
  categoria: string | null;
  dadosCategoria: string;
  onCategoryChange: (categoria: string | null) => void;
  onDadosChange: (dados: string) => void;
}

interface RoupasData {
  tamanho?: string;
  cor?: string;
  material?: string;
  genero?: "masculino" | "feminino" | "unissex";
}

interface CarrosData {
  marca?: string;
  modelo?: string;
  ano?: number;
  quilometragem?: number;
  combustivel?: "gasolina" | "diesel" | "alcool" | "hibrido" | "eletrico";
  cambio?: "manual" | "automatico";
  cor?: string;
  condicao?: "novo" | "semi-novo" | "usado";
}

interface ImoveisData {
  tipo?: "casa" | "apartamento" | "terreno" | "comercial";
  quartos?: number;
  banheiros?: number;
  areaTotal?: number;
  condicao?: "novo" | "semi-novo" | "usado";
  mobiliado?: boolean;
}

export default function CategoryFields({
  categoria,
  dadosCategoria,
  onCategoryChange,
  onDadosChange,
}: CategoryFieldsProps) {
  const [roupasData, setRoupasData] = useState<RoupasData>({});
  const [carrosData, setCarrosData] = useState<CarrosData>({});
  const [imoveisData, setImoveisData] = useState<ImoveisData>({});

  // Parse existing data
  useEffect(() => {
    if (dadosCategoria) {
      try {
        const parsed = JSON.parse(dadosCategoria);
        if (categoria === "roupas") setRoupasData(parsed);
        else if (categoria === "carros") setCarrosData(parsed);
        else if (categoria === "imoveis") setImoveisData(parsed);
      } catch (e) {
        console.error("Failed to parse categoria data:", e);
      }
    }
  }, [categoria, dadosCategoria]);

  const handleRoupasChange = (field: keyof RoupasData, value: any) => {
    const updated = { ...roupasData, [field]: value };
    setRoupasData(updated);
    onDadosChange(JSON.stringify(updated));
  };

  const handleCarrosChange = (field: keyof CarrosData, value: any) => {
    const updated = { ...carrosData, [field]: value };
    setCarrosData(updated);
    onDadosChange(JSON.stringify(updated));
  };

  const handleImoveisChange = (field: keyof ImoveisData, value: any) => {
    const updated = { ...imoveisData, [field]: value };
    setImoveisData(updated);
    onDadosChange(JSON.stringify(updated));
  };

  return (
    <div className="space-y-6">
      {/* Category Selection */}
      <div>
        <label className="block text-sm font-semibold text-walmart-text mb-2">
          Categoria
        </label>
        <select
          value={categoria || ""}
          onChange={(e) => {
            const newCategoria = e.target.value || null;
            onCategoryChange(newCategoria);
            onDadosChange("");
            // Reset data for the new category
            if (newCategoria === "roupas") setRoupasData({});
            else if (newCategoria === "carros") setCarrosData({});
            else if (newCategoria === "imoveis") setImoveisData({});
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-transparent"
        >
          <option value="">Sem Categoria Específica</option>
          <option value="roupas">👕 Roupas e Moda</option>
          <option value="carros">🚗 Carros e Motos</option>
          <option value="imoveis">🏠 Imóveis</option>
        </select>
      </div>

      {/* Roupas Fields */}
      {categoria === "roupas" && (
        <div className="bg-blue-50 rounded-lg p-4 space-y-4 border border-blue-200">
          <h3 className="font-bold text-walmart-text">Informações da Roupa</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-walmart-text mb-2">
                Tamanho
              </label>
              <select
                value={roupasData.tamanho || ""}
                onChange={(e) => handleRoupasChange("tamanho", e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-transparent"
              >
                <option value="">Selecione</option>
                <option value="PP">PP</option>
                <option value="P">P</option>
                <option value="M">M</option>
                <option value="G">G</option>
                <option value="GG">GG</option>
                <option value="3G">3G</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-walmart-text mb-2">
                Cor
              </label>
              <input
                type="text"
                value={roupasData.cor || ""}
                onChange={(e) => handleRoupasChange("cor", e.target.value)}
                placeholder="Ex: Azul, Vermelho"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-walmart-text mb-2">
                Material
              </label>
              <input
                type="text"
                value={roupasData.material || ""}
                onChange={(e) => handleRoupasChange("material", e.target.value)}
                placeholder="Ex: Algodão, Poliéster"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-walmart-text mb-2">
                Gênero
              </label>
              <select
                value={roupasData.genero || ""}
                onChange={(e) => handleRoupasChange("genero", e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-transparent"
              >
                <option value="">Selecione</option>
                <option value="masculino">Masculino</option>
                <option value="feminino">Feminino</option>
                <option value="unissex">Unissex</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Carros Fields */}
      {categoria === "carros" && (
        <div className="bg-blue-50 rounded-lg p-4 space-y-4 border border-blue-200">
          <h3 className="font-bold text-walmart-text">Informações do Veículo</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-walmart-text mb-2">
                Marca
              </label>
              <input
                type="text"
                value={carrosData.marca || ""}
                onChange={(e) => handleCarrosChange("marca", e.target.value)}
                placeholder="Ex: Toyota, Ford"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-walmart-text mb-2">
                Modelo
              </label>
              <input
                type="text"
                value={carrosData.modelo || ""}
                onChange={(e) => handleCarrosChange("modelo", e.target.value)}
                placeholder="Ex: Corolla, Fiesta"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-walmart-text mb-2">
                Ano
              </label>
              <input
                type="number"
                value={carrosData.ano || ""}
                onChange={(e) =>
                  handleCarrosChange("ano", e.target.value ? parseInt(e.target.value) : undefined)
                }
                placeholder="Ex: 2020"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-walmart-text mb-2">
                Quilometragem
              </label>
              <input
                type="number"
                value={carrosData.quilometragem || ""}
                onChange={(e) =>
                  handleCarrosChange(
                    "quilometragem",
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
                placeholder="Ex: 50000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-walmart-text mb-2">
                Combustível
              </label>
              <select
                value={carrosData.combustivel || ""}
                onChange={(e) => handleCarrosChange("combustivel", e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-transparent"
              >
                <option value="">Selecione</option>
                <option value="gasolina">Gasolina</option>
                <option value="diesel">Diesel</option>
                <option value="alcool">Álcool</option>
                <option value="hibrido">Híbrido</option>
                <option value="eletrico">Elétrico</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-walmart-text mb-2">
                Câmbio
              </label>
              <select
                value={carrosData.cambio || ""}
                onChange={(e) => handleCarrosChange("cambio", e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-transparent"
              >
                <option value="">Selecione</option>
                <option value="manual">Manual</option>
                <option value="automatico">Automático</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-walmart-text mb-2">
                Cor
              </label>
              <input
                type="text"
                value={carrosData.cor || ""}
                onChange={(e) => handleCarrosChange("cor", e.target.value)}
                placeholder="Ex: Preto, Branco"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-walmart-text mb-2">
                Condição
              </label>
              <select
                value={carrosData.condicao || ""}
                onChange={(e) => handleCarrosChange("condicao", e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-transparent"
              >
                <option value="">Selecione</option>
                <option value="novo">Novo</option>
                <option value="semi-novo">Semi-novo</option>
                <option value="usado">Usado</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Imóveis Fields */}
      {categoria === "imoveis" && (
        <div className="bg-blue-50 rounded-lg p-4 space-y-4 border border-blue-200">
          <h3 className="font-bold text-walmart-text">Informações do Imóvel</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-walmart-text mb-2">
                Tipo
              </label>
              <select
                value={imoveisData.tipo || ""}
                onChange={(e) => handleImoveisChange("tipo", e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-transparent"
              >
                <option value="">Selecione</option>
                <option value="casa">Casa</option>
                <option value="apartamento">Apartamento</option>
                <option value="terreno">Terreno</option>
                <option value="comercial">Comercial</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-walmart-text mb-2">
                Quartos
              </label>
              <input
                type="number"
                value={imoveisData.quartos || ""}
                onChange={(e) =>
                  handleImoveisChange("quartos", e.target.value ? parseInt(e.target.value) : undefined)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-walmart-text mb-2">
                Banheiros
              </label>
              <input
                type="number"
                value={imoveisData.banheiros || ""}
                onChange={(e) =>
                  handleImoveisChange(
                    "banheiros",
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-walmart-text mb-2">
                Área Total (m²)
              </label>
              <input
                type="number"
                value={imoveisData.areaTotal || ""}
                onChange={(e) =>
                  handleImoveisChange(
                    "areaTotal",
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-walmart-text mb-2">
                Condição
              </label>
              <select
                value={imoveisData.condicao || ""}
                onChange={(e) => handleImoveisChange("condicao", e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-transparent"
              >
                <option value="">Selecione</option>
                <option value="novo">Novo</option>
                <option value="semi-novo">Semi-novo</option>
                <option value="usado">Usado</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="mobiliado"
                checked={imoveisData.mobiliado || false}
                onChange={(e) => handleImoveisChange("mobiliado", e.target.checked)}
                className="w-4 h-4 text-walmart-blue rounded"
              />
              <label htmlFor="mobiliado" className="text-sm font-semibold text-walmart-text">
                Mobiliado
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
