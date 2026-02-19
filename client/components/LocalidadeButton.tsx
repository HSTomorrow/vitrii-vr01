import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { MapPin, ChevronDown } from "lucide-react";
import { toast } from "sonner";

interface Localidade {
  id: number;
  codigo: string;
  municipio: string;
  estado: string;
  status: string;
}

export default function LocalidadeButton() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLocalidade, setSelectedLocalidade] = useState<Localidade | null>(null);
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

  // Update localidade mutation
  const updateLocalidadeMutation = useMutation({
    mutationFn: async (localidadeId: number | null) => {
      if (!user?.id) return;

      const response = await fetch(`/api/usracessos/${user.id}/localidade-padrao`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id.toString(),
        },
        body: JSON.stringify({ localidadePadraoId: localidadeId }),
      });

      if (!response.ok) throw new Error("Erro ao atualizar localidade padrão");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Localidade padrão atualizada!");
      setIsOpen(false);
    },
    onError: () => {
      toast.error("Erro ao atualizar localidade");
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
          if (userData.data?.localidadePadraoId && localidadesData?.data) {
            const localidade = localidadesData.data.find(
              (l: Localidade) => l.id === userData.data.localidadePadraoId,
            );
            if (localidade) {
              setSelectedLocalidade(localidade);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user default localidade:", error);
      }
    };

    if (user?.id && localidadesData?.data) {
      getDefaultLocalidade();
    }
  }, [user?.id, localidadesData?.data]);

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

  if (!user) return null;

  const localidades = (localidadesData?.data || []) as Localidade[];
  const displayText = selectedLocalidade
    ? `${selectedLocalidade.municipio}, ${selectedLocalidade.estado}`
    : "Selecionar";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hidden sm:flex items-center gap-2 px-3 py-2 bg-cyan-50 rounded-lg border border-cyan-200 hover:bg-cyan-100 transition-colors"
        title="Alterar localidade padrão"
      >
        <MapPin className="w-4 h-4 text-cyan-600" />
        <span className="text-[0.74rem] font-semibold text-cyan-800 hidden md:inline max-w-[120px] truncate">
          {displayText}
        </span>
        <ChevronDown className="w-3 h-3 text-cyan-600" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-700 mb-2">Selecionar Localidade Padrão</p>
            <div className="max-h-48 overflow-y-auto">
              {localidades.length > 0 ? (
                localidades.map((localidade) => (
                  <button
                    key={localidade.id}
                    onClick={() => {
                      setSelectedLocalidade(localidade);
                      updateLocalidadeMutation.mutate(localidade.id);
                    }}
                    disabled={updateLocalidadeMutation.isPending}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                      selectedLocalidade?.id === localidade.id
                        ? "bg-cyan-100 text-cyan-800 font-semibold"
                        : "text-gray-700 hover:bg-gray-100"
                    } disabled:opacity-50`}
                  >
                    {localidade.municipio}, {localidade.estado}
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
                setSelectedLocalidade(null);
                updateLocalidadeMutation.mutate(null);
              }}
              disabled={updateLocalidadeMutation.isPending}
              className="w-full px-3 py-2 text-left text-xs text-gray-600 hover:bg-gray-50 transition-colors border-t border-gray-100 disabled:opacity-50"
            >
              Limpar localidade padrão
            </button>
          )}
        </div>
      )}
    </div>
  );
}
