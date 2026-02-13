import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EventosAgendaCalendar from "@/components/EventosAgendaCalendar";
import EventoModal from "@/components/EventoModal";

interface Evento {
  id: number;
  titulo: string;
  descricao?: string;
  dataInicio: string;
  dataFim: string;
  privacidade: string;
  cor: string;
}

interface Anunciante {
  id: number;
  nome: string;
}

export default function MinhaAgenda() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedAnuncianteId, setSelectedAnuncianteId] = useState<number | null>(null);

  // Fetch user's anunciantes
  const { data: anunciantes = [] } = useQuery<Anunciante[]>({
    queryKey: ["anunciantes", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const headers: Record<string, string> = {
        "x-user-id": user.id.toString(),
      };
      const response = await fetch("/api/anunciantes/usuario", { headers });
      if (!response.ok) throw new Error("Erro ao buscar anunciantes");
      const result = await response.json();
      return result.data || [];
    },
    enabled: !!user?.id,
  });

  // Set first anunciante as default
  useMemo(() => {
    if (anunciantes.length > 0 && !selectedAnuncianteId) {
      setSelectedAnuncianteId(anunciantes[0].id);
    }
  }, [anunciantes, selectedAnuncianteId]);

  // Fetch eventos for selected anunciante
  const { data: eventos = [], refetch: refetchEventos } = useQuery<Evento[]>({
    queryKey: ["eventos-agenda", selectedAnuncianteId],
    queryFn: async () => {
      if (!selectedAnuncianteId) return [];
      const headers: Record<string, string> = {
        "x-user-id": user?.id?.toString() || "",
      };
      const response = await fetch(
        `/api/eventos-agenda/anunciante/${selectedAnuncianteId}`,
        { headers },
      );
      if (!response.ok) throw new Error("Erro ao buscar eventos");
      const result = await response.json();
      return result.data || [];
    },
    enabled: !!selectedAnuncianteId && !!user?.id,
  });

  // Create evento mutation
  const createEventoMutation = useMutation({
    mutationFn: async (
      data: Partial<Evento> & { usuariosPermitidos?: number[] },
    ) => {
      const response = await fetch("/api/eventos-agenda", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id?.toString() || "",
        },
        body: JSON.stringify({
          ...data,
          anuncianteId: selectedAnuncianteId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao criar evento");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Evento criado com sucesso!");
      setIsModalOpen(false);
      setSelectedEvento(null);
      setSelectedDate(null);
      refetchEventos();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Erro ao criar evento",
      );
    },
  });

  // Update evento mutation
  const updateEventoMutation = useMutation({
    mutationFn: async (
      data: Partial<Evento> & { usuariosPermitidos?: number[] },
    ) => {
      const response = await fetch(`/api/eventos-agenda/${selectedEvento?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id?.toString() || "",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao atualizar evento");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Evento atualizado com sucesso!");
      setIsModalOpen(false);
      setSelectedEvento(null);
      refetchEventos();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Erro ao atualizar evento",
      );
    },
  });

  // Delete evento mutation
  const deleteEventoMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/eventos-agenda/${selectedEvento?.id}`, {
        method: "DELETE",
        headers: {
          "x-user-id": user?.id?.toString() || "",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao deletar evento");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Evento deletado com sucesso!");
      setIsModalOpen(false);
      setSelectedEvento(null);
      refetchEventos();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Erro ao deletar evento",
      );
    },
  });

  const handleSaveEvento = (
    data: Partial<Evento> & { usuariosPermitidos?: number[] },
  ) => {
    if (selectedEvento) {
      updateEventoMutation.mutate(data);
    } else {
      createEventoMutation.mutate(data);
    }
  };

  const handleAddEvento = () => {
    setSelectedEvento(null);
    setIsModalOpen(true);
  };

  const handleSelectEvento = (evento: Evento) => {
    setSelectedEvento(evento);
    setIsModalOpen(true);
  };

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    setSelectedEvento(null);
  };

  const handleOpenNewEventoForDate = () => {
    setSelectedEvento(null);
    setIsModalOpen(true);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Você precisa estar logado</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-vitrii-text mb-4">
            Minha Agenda
          </h1>

          {/* Anunciante Selector */}
          {anunciantes.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-vitrii-text mb-2">
                Selecione um Anunciante
              </label>
              <select
                value={selectedAnuncianteId || ""}
                onChange={(e) => setSelectedAnuncianteId(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
              >
                <option value="">Escolha um anunciante</option>
                {anunciantes.map((anunciante) => (
                  <option key={anunciante.id} value={anunciante.id}>
                    {anunciante.nome}
                  </option>
                ))}
              </select>
            </div>
          )}

          {anunciantes.length === 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800">
                Você ainda não tem nenhum anunciante. Crie um anunciante para começar a
                gerenciar sua agenda.
              </p>
            </div>
          )}
        </div>

        {/* Calendar */}
        {selectedAnuncianteId && (
          <>
            <EventosAgendaCalendar
              eventos={eventos}
              onSelectDate={handleSelectDate}
              onSelectEvento={handleSelectEvento}
              onAddEvento={handleAddEvento}
              isEditable={true}
            />

            {/* Quick add for selected date */}
            {selectedDate && (
              <div className="mt-6 p-4 bg-vitrii-yellow rounded-lg">
                <p className="text-vitrii-text font-semibold mb-2">
                  Criar evento para {selectedDate.toLocaleDateString("pt-BR")}
                </p>
                <button
                  onClick={handleOpenNewEventoForDate}
                  className="px-4 py-2 bg-vitrii-yellow-dark text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  + Novo Evento
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />

      {/* Modal */}
      <EventoModal
        isOpen={isModalOpen}
        evento={selectedEvento}
        defaultDate={selectedDate || undefined}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEvento(null);
          setSelectedDate(null);
        }}
        onSave={handleSaveEvento}
        isLoading={
          createEventoMutation.isPending || updateEventoMutation.isPending
        }
      />
    </div>
  );
}
