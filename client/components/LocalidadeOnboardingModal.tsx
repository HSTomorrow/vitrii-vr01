import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";

interface Localidade {
  id: number;
  descricao?: string;
  municipio: string;
  estado: string;
}

interface LocalidadeOnboardingModalProps {
  open: boolean;
  onChoose: (localidadeId: number | null) => void;
  // IP-suggested localidade id, already resolved by LocalidadeContext (which fails open to
  // null on any error/rate-limit/unmatched city) - passed down instead of fetching again
  // here, so the header and this modal never race on two separate geolocation calls.
  suggestedLocalidadeId?: number | null;
}

export default function LocalidadeOnboardingModal({
  open,
  onChoose,
  suggestedLocalidadeId,
}: LocalidadeOnboardingModalProps) {
  const [selectedId, setSelectedId] = useState<string>("");

  const { data: localidadesData } = useQuery({
    queryKey: ["localidades-onboarding"],
    queryFn: async () => {
      const response = await fetch("/api/localidades?status=ativo&limit=200");
      if (!response.ok) throw new Error("Erro ao buscar localidades");
      return response.json();
    },
    enabled: open,
  });

  const localidades: Localidade[] = localidadesData?.data || [];
  const suggested: Localidade | null =
    localidades.find((l) => l.id === suggestedLocalidadeId) || null;

  useEffect(() => {
    if (suggested && !selectedId) {
      setSelectedId(String(suggested.id));
    }
  }, [suggested]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-vitrii-blue bg-opacity-10 rounded-full flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5 text-vitrii-blue" />
          </div>
          <h2 className="text-lg font-bold text-vitrii-text">
            Qual é a sua localidade?
          </h2>
        </div>
        <p className="text-sm text-vitrii-text-secondary mb-4">
          {suggested
            ? `Detectamos que você pode estar em ${suggested.descricao || `${suggested.municipio}, ${suggested.estado}`}. Isso nos ajuda a mostrar os anúncios mais relevantes para você.`
            : "Isso nos ajuda a mostrar os anúncios mais relevantes para você."}
        </p>

        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue mb-4"
        >
          <option value="">Selecione uma localidade</option>
          {localidades.map((localidade) => (
            <option key={localidade.id} value={localidade.id}>
              {localidade.descricao || `${localidade.municipio}, ${localidade.estado}`}
            </option>
          ))}
        </select>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onChoose(null)}
            className="flex-1 px-4 py-2 border-2 border-vitrii-blue text-vitrii-blue rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Ver todas
          </button>
          <button
            type="button"
            disabled={!selectedId}
            onClick={() => onChoose(parseInt(selectedId, 10))}
            className="flex-1 px-4 py-2 bg-vitrii-blue text-white rounded-lg font-semibold hover:bg-vitrii-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
