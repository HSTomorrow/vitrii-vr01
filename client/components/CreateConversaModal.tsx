import { useState } from "react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { X, Search } from "lucide-react";

interface CreateConversaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (conversa: any) => void;
  currentUserId: number;
}

interface Anunciante {
  id: number;
  nome: string;
}

interface Anuncio {
  id: number;
  titulo: string;
  anuncianteId: number;
}

export default function CreateConversaModal({
  isOpen,
  onClose,
  onSuccess,
  currentUserId,
}: CreateConversaModalProps) {
  const [formData, setFormData] = useState({
    usuarioId: currentUserId,
    anuncianteId: 0,
    anuncioId: 0,
    assunto: "",
    tipo: "privada" as "publica" | "privada",
  });
  const [searchAnunciantes, setSearchAnunciantes] = useState("");
  const [searchAnuncios, setSearchAnuncios] = useState("");

  // Fetch anunciantes
  const { data: anunciantesData } = useQuery({
    queryKey: ["anunciantes"],
    queryFn: async () => {
      const response = await fetch("/api/anunciantes");
      if (!response.ok) throw new Error("Erro ao buscar anunciantes");
      return response.json();
    },
    enabled: isOpen,
  });

  // Fetch anuncios for selected anunciante
  const { data: anunciosData } = useQuery({
    queryKey: ["anuncios-anunciante", formData.anuncianteId],
    queryFn: async () => {
      const response = await fetch(`/api/anuncios?anuncianteId=${formData.anuncianteId}`);
      if (!response.ok) throw new Error("Erro ao buscar anúncios");
      return response.json();
    },
    enabled: formData.anuncianteId > 0,
  });

  const anunciantes = anunciantesData?.data || [];
  const anuncios = (anunciosData?.data || []).filter((a: Anuncio) =>
    a.titulo.toLowerCase().includes(searchAnuncios.toLowerCase()),
  );

  const filteredAnunciantes = anunciantes.filter((anunciante: Anunciante) =>
    anunciante.nome.toLowerCase().includes(searchAnunciantes.toLowerCase()),
  );

  // Create conversation mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/conversas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao criar conversa");
      }

      return response.json();
    },
    onSuccess: (result) => {
      toast.success("Conversa criada com sucesso!");
      onSuccess(result.data);
      setFormData({
        usuarioId: currentUserId,
        anuncianteId: 0,
        anuncioId: 0,
        assunto: "",
        tipo: "privada",
      });
      setSearchAnunciantes("");
      setSearchAnuncios("");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Erro ao criar conversa",
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.anuncianteId || !formData.assunto) {
      toast.error("Preencha anunciante e assunto");
      return;
    }

    createMutation.mutate(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0">
          <h2 className="text-xl font-bold text-vitrii-text">
            Iniciar Nova Conversa
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
          {/* Anunciante Selection */}
          <div>
            <label className="block text-sm font-semibold text-vitrii-text mb-2">
              Anunciante *
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar anunciante..."
                value={searchAnunciantes}
                onChange={(e) => setSearchAnunciantes(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vitrii-blue focus:border-transparent"
              />
            </div>

            {searchAnunciantes && filteredAnunciantes.length > 0 && (
              <div className="mt-2 border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
                {filteredAnunciantes.map((anunciante: Anunciante) => (
                  <button
                    key={anunciante.id}
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, anuncianteId: anunciante.id }));
                      setSearchAnunciantes("");
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b last:border-b-0"
                  >
                    <p className="font-medium text-vitrii-text">{anunciante.nome}</p>
                  </button>
                ))}
              </div>
            )}

            {formData.anuncianteId > 0 && (
              <div className="mt-2 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
                <span className="text-sm text-vitrii-text font-medium">
                  {anunciantes.find((l: Anunciante) => l.id === formData.anuncianteId)?.nome}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, anuncianteId: 0 }))
                  }
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Anuncio Selection (Optional) */}
          {formData.anuncianteId > 0 && (
            <div>
              <label className="block text-sm font-semibold text-vitrii-text mb-2">
                Anúncio (Opcional)
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar anúncio..."
                  value={searchAnuncios}
                  onChange={(e) => setSearchAnuncios(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vitrii-blue focus:border-transparent"
                />
              </div>

              {searchAnuncios && anuncios.length > 0 && (
                <div className="mt-2 border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
                  {anuncios.map((anuncio: Anuncio) => (
                    <button
                      key={anuncio.id}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          anuncioId: anuncio.id,
                        }));
                        setSearchAnuncios("");
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b last:border-b-0"
                    >
                      <p className="font-medium text-vitrii-text">
                        {anuncio.titulo}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {formData.anuncioId > 0 && (
                <div className="mt-2 p-3 bg-green-50 rounded-lg flex items-center justify-between">
                  <span className="text-sm text-vitrii-text font-medium">
                    {
                      anuncios.find((a: Anuncio) => a.id === formData.anuncioId)
                        ?.titulo
                    }
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, anuncioId: 0 }))
                    }
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Assunto */}
          <div>
            <label className="block text-sm font-semibold text-vitrii-text mb-2">
              Assunto da Conversa *
            </label>
            <input
              type="text"
              value={formData.assunto}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, assunto: e.target.value }))
              }
              placeholder="Ex: Dúvida sobre o produto"
              maxLength={255}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vitrii-blue focus:border-transparent"
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-semibold text-vitrii-text mb-2">
              Tipo de Conversa
            </label>
            <div className="flex gap-4">
              {(["privada", "publica"] as const).map((tipo) => (
                <label key={tipo} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="tipo"
                    value={tipo}
                    checked={formData.tipo === tipo}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        tipo: e.target.value as any,
                      }))
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-vitrii-text">
                    {tipo === "privada"
                      ? "Privada (apenas eu e o anunciante)"
                      : "Pública"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border-2 border-vitrii-blue text-vitrii-blue rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 px-4 py-2 bg-vitrii-blue text-white rounded-lg font-semibold hover:bg-vitrii-blue-dark transition-colors disabled:opacity-50"
            >
              {createMutation.isPending ? "Criando..." : "Iniciar Conversa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
