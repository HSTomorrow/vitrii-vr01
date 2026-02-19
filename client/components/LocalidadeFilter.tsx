import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { MapPin } from "lucide-react";

interface Localidade {
  id: number;
  codigo: string;
  municipio: string;
  estado: string;
  status: string;
}

interface LocalidadeFilterProps {
  value?: number | null;
  onChange: (localidadeId: number | null) => void;
  showLabel?: boolean;
  className?: string;
  placeholder?: string;
}

export default function LocalidadeFilter({
  value,
  onChange,
  showLabel = true,
  className = "",
  placeholder = "Selecione uma localidade",
}: LocalidadeFilterProps) {
  const { user } = useAuth();
  const [selectedLocalidade, setSelectedLocalidade] = useState<number | null>(
    value || null,
  );

  // Fetch all active localidades
  const { data: localidadesData } = useQuery({
    queryKey: ["localidades-filter"],
    queryFn: async () => {
      const response = await fetch("/api/localidades?status=ativo&limit=100");
      if (!response.ok) throw new Error("Erro ao buscar localidades");
      return response.json();
    },
  });

  // Fetch user's default localidade on mount
  useEffect(() => {
    const getDefaultLocalidade = async () => {
      if (!user?.id) return;

      try {
        const response = await fetch(`/api/usracessos/${user.id}`, {
          headers: {
            "x-user-id": user.id.toString(),
          },
        });

        if (response.ok) {
          const userData = await response.json();
          if (userData.data?.localidadePadraoId) {
            setSelectedLocalidade(userData.data.localidadePadraoId);
            onChange(userData.data.localidadePadraoId);
          }
        }
      } catch (error) {
        console.error("Error fetching user default localidade:", error);
      }
    };

    // Only fetch if selectedLocalidade is not already set
    if (!selectedLocalidade && value === undefined) {
      getDefaultLocalidade();
    }
  }, [user?.id]);

  // Update selected localidade when prop changes
  useEffect(() => {
    if (value !== undefined) {
      setSelectedLocalidade(value || null);
    }
  }, [value]);

  const localidades = (localidadesData?.data || []) as Localidade[];

  const handleChange = (localidadeId: number | null) => {
    setSelectedLocalidade(localidadeId);
    onChange(localidadeId);
  };

  return (
    <div className={`${className}`}>
      {showLabel && (
        <label className="block text-sm font-semibold text-vitrii-text mb-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Localidade
          </div>
        </label>
      )}

      <div className="flex gap-2 items-center">
        <select
          value={selectedLocalidade ?? ""}
          onChange={(e) =>
            handleChange(e.target.value ? parseInt(e.target.value) : null)
          }
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vitrii-blue focus:border-transparent text-gray-800 bg-white"
        >
          <option value="">
            {placeholder || "Selecione uma localidade"}
          </option>
          {localidades.map((localidade) => (
            <option key={localidade.id} value={localidade.id}>
              {localidade.municipio}, {localidade.estado}
            </option>
          ))}
        </select>

        {selectedLocalidade && (
          <button
            onClick={() => handleChange(null)}
            className="px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Limpar filtro"
          >
            ✕
          </button>
        )}
      </div>

      {!selectedLocalidade && (
        <p className="text-xs text-gray-500 mt-1">
          Deixe em branco para ver todos os anúncios
        </p>
      )}
    </div>
  );
}
