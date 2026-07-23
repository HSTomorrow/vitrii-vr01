import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, ChevronDown } from "lucide-react";
import { useLocalidade } from "@/contexts/LocalidadeContext";

interface Localidade {
  id: number;
  codigo: string;
  municipio: string;
  estado: string;
  descricao?: string;
  status: string;
}

export default function LocalidadeButton() {
  const { localidadeId, selectLocalidade } = useLocalidade();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch all active localidades
  const { data: localidadesData } = useQuery({
    queryKey: ["localidades-header"],
    queryFn: async () => {
      const response = await fetch("/api/localidades?status=ativo&limit=100");
      if (!response.ok) throw new Error("Erro ao buscar localidades");
      return response.json();
    },
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const localidades = (localidadesData?.data || []) as Localidade[];
  const selectedLocalidade = localidades.find((l) => l.id === localidadeId) || null;
  const displayText = selectedLocalidade
    ? selectedLocalidade.descricao || `${selectedLocalidade.municipio}, ${selectedLocalidade.estado}`
    : "Selecionar";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex flex-shrink-0 items-center gap-1.5 px-3 py-1.5 bg-cyan-50 rounded-lg border border-cyan-200 hover:bg-cyan-100 transition-colors"
        title="Alterar localidade"
      >
        <MapPin className="w-4 h-4 text-cyan-600 flex-shrink-0" />
        <span
          className="text-xs font-semibold text-cyan-800 hidden md:inline max-w-[120px] lg:max-w-[200px] truncate"
          title={displayText}
        >
          {displayText}
        </span>
        <ChevronDown className="w-3 h-3 text-cyan-600 flex-shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-700 mb-2">Selecionar Localidade</p>
            <div className="max-h-48 overflow-y-auto">
              {localidades.length > 0 ? (
                localidades.map((localidade) => (
                  <button
                    key={localidade.id}
                    onClick={() => {
                      selectLocalidade(localidade.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                      localidadeId === localidade.id
                        ? "bg-cyan-100 text-cyan-800 font-semibold"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {localidade.descricao || `${localidade.municipio}, ${localidade.estado}`}
                  </button>
                ))
              ) : (
                <p className="px-3 py-2 text-xs text-gray-500">Nenhuma localidade disponível</p>
              )}
            </div>
          </div>
          {selectedLocalidade && (
            <button
              onClick={() => {
                selectLocalidade(null);
                setIsOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-xs text-gray-600 hover:bg-gray-50 transition-colors border-t border-gray-100"
            >
              Limpar localidade
            </button>
          )}
        </div>
      )}
    </div>
  );
}
