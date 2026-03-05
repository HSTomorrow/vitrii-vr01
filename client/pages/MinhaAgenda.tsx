import { useState, useMemo, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, Settings, Share2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EventosAgendaCalendar from "@/components/EventosAgendaCalendar";
import ViewDiaEvento from "@/components/ViewDiaEvento";
import EventoModal from "@/components/EventoModal";
import ReservasEventoList from "@/components/ReservasEventoList";
import FilaDeEsperaModal from "@/components/FilaDeEsperaModal";
import FilaDeEsperaList from "@/components/FilaDeEsperaList";
import StatusAgenda from "@/components/StatusAgenda";
import AgendaEditorModal from "@/components/AgendaEditorModal";
import ShareAgendaModal from "@/components/ShareAgendaModal";
import RecurrenceModal, { RecurrenceData } from "@/components/RecurrenceModal";
import DeleteFilterModal from "@/components/DeleteFilterModal";

interface Evento {
  id: number;
  anuncianteId: number;
  titulo: string;
  descricao?: string;
  dataInicio: string;
  dataFim: string;
  privacidade: string;
  cor: string;
  status?: string;
  contatos?: Array<{ contatoId: number }>;
}

interface Anunciante {
  id: number;
  nome: string;
}

interface FilaEspera {
  id: number;
  titulo: string;
  descricao?: string;
  dataInicio: string;
  dataFim: string;
  status: string;
  usuarioSolicitante: {
    id: number;
    nome: string;
    email: string;
    telefone?: string;
  };
}

export default function MinhaAgenda() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedAnuncianteId, setSelectedAnuncianteId] = useState<number | null>(null);
  const [showReservasFor, setShowReservasFor] = useState<number | null>(null);
  const [showFilaDeEsperaModal, setShowFilaDeEsperaModal] = useState(false);
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showRecurrenceModal, setShowRecurrenceModal] = useState(false);
  const [showDeleteFilterModal, setShowDeleteFilterModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"calendar" | "dia" | "fila-espera" | "status-agenda">("calendar");
  const [filterContatoId, setFilterContatoId] = useState<number | null>(null);
  const [filterContatoNome, setFilterContatoNome] = useState("");
  const [filterDescricao, setFilterDescricao] = useState("");
  const [filterTipoContato, setFilterTipoContato] = useState("");
  const reservasRef = useRef<HTMLDivElement>(null);

  // Fetch user's anunciantes
  const {
    data: anunciantes = [],
    isLoading: isLoadingAnunciantes,
    error: anunciantesError
  } = useQuery<Anunciante[]>({
    queryKey: ["anunciantes", user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log("[MinhaAgenda] User ID not available");
        return [];
      }
      console.log("[MinhaAgenda] Fetching anunciantes for user:", user.id);
      const headers: Record<string, string> = {
        "x-user-id": user.id.toString(),
      };
      const response = await fetch("/api/anunciantes/do-usuario/listar", { headers });
      console.log("[MinhaAgenda] Anunciantes response status:", response.status);
      if (!response.ok) {
        const error = await response.json();
        console.error("[MinhaAgenda] Anunciantes error:", error);
        throw new Error(error.error || "Erro ao buscar anunciantes");
      }
      const result = await response.json();
      console.log("[MinhaAgenda] Anunciantes fetched:", result.data);
      return result.data || [];
    },
    enabled: !!user?.id,
    staleTime: 600000, // 10 minutes
    gcTime: 600000, // 10 minutes
  });

  // Set first anunciante as default
  useMemo(() => {
    if (anunciantes.length > 0 && !selectedAnuncianteId) {
      setSelectedAnuncianteId(anunciantes[0].id);
    }
  }, [anunciantes, selectedAnuncianteId]);

  // Scroll to reservas section when a event is selected
  useEffect(() => {
    if (showReservasFor && reservasRef.current) {
      setTimeout(() => {
        reservasRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  }, [showReservasFor]);

  // Fetch eventos for selected anunciante
  const {
    data: eventos = [],
    refetch: refetchEventos,
    isLoading: isLoadingEventos,
    error: eventosError
  } = useQuery<Evento[]>({
    queryKey: ["eventos-agenda", selectedAnuncianteId],
    queryFn: async () => {
      if (!selectedAnuncianteId) {
        console.log("[MinhaAgenda] No anunciante selected");
        return [];
      }
      console.log("[MinhaAgenda] Fetching eventos for anunciante:", selectedAnuncianteId, "user:", user?.id);
      const headers: Record<string, string> = {
        "x-user-id": user?.id?.toString() || "",
      };
      const response = await fetch(
        `/api/eventos-agenda/anunciante/${selectedAnuncianteId}`,
        { headers },
      );
      console.log("[MinhaAgenda] Eventos response status:", response.status);
      if (!response.ok) {
        const error = await response.json();
        console.error("[MinhaAgenda] Eventos error:", error);
        throw new Error(error.error || "Erro ao buscar eventos");
      }
      const result = await response.json();
      console.log("[MinhaAgenda] Eventos fetched:", result.data);
      return result.data || [];
    },
    enabled: !!selectedAnuncianteId && !!user?.id,
    staleTime: 600000, // 10 minutes
    gcTime: 600000, // 10 minutes
  });

  // Fetch reservas for selected evento
  const { data: reservas = [], refetch: refetchReservas } = useQuery({
    queryKey: ["reservas-evento", showReservasFor],
    queryFn: async () => {
      if (!showReservasFor) return [];
      const headers: Record<string, string> = {
        "x-user-id": user?.id?.toString() || "",
      };
      const response = await fetch(
        `/api/reservas-evento/${showReservasFor}`,
        { headers },
      );
      if (!response.ok) throw new Error("Erro ao buscar reservas");
      const result = await response.json();
      return result.data || [];
    },
    enabled: !!showReservasFor && !!user?.id,
    staleTime: 600000, // 10 minutes
    gcTime: 600000, // 10 minutes
  });

  // Fetch filas de espera for selected anunciante
  const {
    data: filasEspera = [],
    refetch: refetchFilasEspera,
    isLoading: isLoadingFilasEspera,
  } = useQuery({
    queryKey: ["filas-espera", selectedAnuncianteId],
    queryFn: async () => {
      if (!selectedAnuncianteId) return [];
      const headers: Record<string, string> = {
        "x-user-id": user?.id?.toString() || "",
      };
      const response = await fetch(
        `/api/filas-espera/anunciante/${selectedAnuncianteId}`,
        { headers },
      );
      if (!response.ok) throw new Error("Erro ao buscar filas de espera");
      const result = await response.json();
      return result.data || [];
    },
    enabled: !!selectedAnuncianteId && !!user?.id,
    staleTime: 600000, // 10 minutes
    gcTime: 600000, // 10 minutes
  });

  // Fetch all contacts for filter dropdown (only when needed)
  const { data: todosContatos = [] } = useQuery({
    queryKey: ["contatos-for-filters", selectedAnuncianteId],
    queryFn: async () => {
      if (!selectedAnuncianteId) return [];
      const response = await fetch("/api/contatos", {
        headers: {
          "X-User-Id": user?.id?.toString() || "",
        },
      });
      if (!response.ok) return [];
      const result = await response.json();
      return (result.data || []).filter((contato: any) => {
        return !contato.anuncianteId || contato.anuncianteId === selectedAnuncianteId;
      });
    },
    enabled: !!selectedAnuncianteId && !!user?.id,
    staleTime: 600000,
    gcTime: 600000,
  });

  // Apply filters to eventos
  const filteredEventos = useMemo(() => {
    return (eventos || []).filter((evento) => {
      // Filter by contato (if contato is selected in the event)
      if (filterContatoId) {
        const hasContato = (evento.contatos || []).some(
          (c: any) => c.contatoId === filterContatoId
        );
        if (!hasContato) return false;
      }

      // Filter by contato name (search by typing)
      if (filterContatoNome) {
        const contatosNoEvento = (evento.contatos || []);
        const hasContatoByName = contatosNoEvento.some((c: any) => {
          const contato = todosContatos.find((tc: any) => tc.id === c.contatoId);
          return contato?.nome.toLowerCase().includes(filterContatoNome.toLowerCase());
        });
        if (!hasContatoByName) return false;
      }

      // Filter by agenda description
      if (filterDescricao) {
        const agendaInfo = anunciantes.find((a) => a.id === evento.anuncianteId);
        if (
          !agendaInfo?.nome
            .toLowerCase()
            .includes(filterDescricao.toLowerCase())
        ) {
          return false;
        }
      }

      return true;
    });
  }, [eventos, filterContatoId, filterContatoNome, filterDescricao, anunciantes, todosContatos]);

  // Get unique contact types for filter
  const tiposContatoUnicos = useMemo(() => {
    const tipos = new Set(todosContatos.map((c: any) => c.tipoContato));
    return Array.from(tipos).sort();
  }, [todosContatos]);

  // Create evento mutation
  const createEventoMutation = useMutation({
    mutationFn: async (
      data: Partial<Evento> & { contatosPermitidos?: number[] },
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
      data: Partial<Evento> & { contatosPermitidos?: number[] },
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

  // Delete agenda mutation
  const deleteAgendaMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAnuncianteId) throw new Error("Anunciante não selecionado");
      const response = await fetch(`/api/agenda/${selectedAnuncianteId}`, {
        method: "DELETE",
        headers: {
          "x-user-id": user?.id?.toString() || "",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao deletar agenda");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Agenda deletada com sucesso!");
      setSelectedAnuncianteId(null);
      setActiveTab("calendar");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Erro ao deletar agenda",
      );
    },
  });

  // Generate occurrences based on recurrence pattern
  const generateOccurrences = (data: RecurrenceData): Array<{ dataInicio: Date; dataFim: Date }> => {
    const occurrences: Array<{ dataInicio: Date; dataFim: Date }> = [];
    const startDate = new Date(data.recorrenciaDataInicio);
    const endDate = new Date(data.recorrenciaDataFim);
    const [horaInicioH, horaInicioM] = data.horaInicio.split(":").map(Number);
    const [horaFimH, horaFimM] = data.horaFim.split(":").map(Number);

    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      let shouldInclude = false;

      if (data.recorrenciaType === "semanal") {
        // Check if current day is in diasSemana
        shouldInclude = data.diasSemana?.includes(currentDate.getDay()) || false;
      } else if (data.recorrenciaType === "mensal") {
        // Check if current date matches diaDoMes
        shouldInclude = currentDate.getDate() === data.diaDoMes;
      }

      if (shouldInclude) {
        const dataInicioOccurrence = new Date(currentDate);
        dataInicioOccurrence.setHours(horaInicioH, horaInicioM, 0, 0);

        const dataFimOccurrence = new Date(currentDate);
        dataFimOccurrence.setHours(horaFimH, horaFimM, 0, 0);

        occurrences.push({
          dataInicio: dataInicioOccurrence,
          dataFim: dataFimOccurrence,
        });
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return occurrences;
  };

  // Create recurrence mutation
  const createRecurrenceMutation = useMutation({
    mutationFn: async (data: RecurrenceData) => {
      const occurrences = generateOccurrences(data);

      if (occurrences.length === 0) {
        throw new Error("Nenhuma ocorrência encontrada para o padrão de recorrência");
      }

      // Create all events
      const eventPromises = occurrences.map((occurrence) =>
        fetch("/api/eventos-agenda", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user?.id?.toString() || "",
          },
          body: JSON.stringify({
            titulo: data.titulo,
            descricao: data.descricao,
            dataInicio: occurrence.dataInicio.toISOString(),
            dataFim: occurrence.dataFim.toISOString(),
            privacidade: data.privacidade,
            cor: data.cor,
            anuncianteId: selectedAnuncianteId,
          }),
        })
      );

      const responses = await Promise.all(eventPromises);

      for (const response of responses) {
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Erro ao criar eventos recorrentes");
        }
      }

      return { createdCount: occurrences.length };
    },
    onSuccess: (result) => {
      toast.success(`${result.createdCount} evento(s) criado(s) com sucesso!`);
      setShowRecurrenceModal(false);
      refetchEventos();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Erro ao criar recorrência",
      );
    },
  });

  // Bulk delete events mutation
  const bulkDeleteEventosMutation = useMutation({
    mutationFn: async (eventoIds: number[]) => {
      const deletePromises = eventoIds.map((id) =>
        fetch(`/api/eventos-agenda/${id}`, {
          method: "DELETE",
          headers: {
            "x-user-id": user?.id?.toString() || "",
          },
        })
      );

      const responses = await Promise.all(deletePromises);

      for (const response of responses) {
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Erro ao deletar evento");
        }
      }

      return { deletedCount: eventoIds.length };
    },
    onSuccess: (result) => {
      toast.success(`${result.deletedCount} evento(s) deletado(s) com sucesso!`);
      setShowDeleteFilterModal(false);
      refetchEventos();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Erro ao deletar eventos",
      );
    },
  });

  const handleSaveEvento = (
    data: Partial<Evento> & { contatosPermitidos?: number[] },
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
    setShowReservasFor(evento.id);
    setIsModalOpen(true); // Open modal to view/edit evento details
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

          {/* Error Messages */}
          {anunciantesError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 font-semibold">Erro ao carregar anunciantes</p>
              <p className="text-red-700 text-sm mt-1">
                {anunciantesError instanceof Error ? anunciantesError.message : "Erro desconhecido"}
              </p>
            </div>
          )}

          {/* Loading State */}
          {isLoadingAnunciantes && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <p className="text-blue-800">Carregando seus anunciantes...</p>
              </div>
            </div>
          )}

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

          {anunciantes.length === 0 && !isLoadingAnunciantes && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800">
                Você ainda não tem nenhum anunciante. Crie um anunciante para começar a
                gerenciar sua agenda.
              </p>
            </div>
          )}
        </div>

        {/* Error Messages for Eventos */}
        {selectedAnuncianteId && eventosError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-semibold">Erro ao carregar eventos</p>
            <p className="text-red-700 text-sm mt-1">
              {eventosError instanceof Error ? eventosError.message : "Erro desconhecido"}
            </p>
          </div>
        )}

        {/* Tab Navigation */}
        {selectedAnuncianteId && (
          <>
            <div className="mb-6 border-b border-gray-200">
              <div className="flex gap-4 overflow-x-auto pb-0">
                <button
                  onClick={() => setActiveTab("calendar")}
                  className={`px-4 py-3 font-semibold border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === "calendar"
                      ? "border-vitrii-blue text-vitrii-blue"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  📅 Minha Agenda
                </button>
                <button
                  onClick={() => setActiveTab("dia")}
                  className={`px-4 py-3 font-semibold border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === "dia"
                      ? "border-vitrii-blue text-vitrii-blue"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  📆 Visualizar Dia
                </button>
                <button
                  onClick={() => setActiveTab("fila-espera")}
                  className={`px-4 py-3 font-semibold border-b-2 whitespace-nowrap transition-colors relative ${
                    activeTab === "fila-espera"
                      ? "border-vitrii-blue text-vitrii-blue"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  ⏳ Fila de Espera
                  {filasEspera.filter((f) => f.status === "pendente").length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {filasEspera.filter((f) => f.status === "pendente").length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("status-agenda")}
                  className={`px-4 py-3 font-semibold border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === "status-agenda"
                      ? "border-vitrii-blue text-vitrii-blue"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  📊 Status da Agenda
                </button>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === "calendar" && (
              <>
                {isLoadingEventos ? (
                  <div className="w-full bg-white rounded-lg shadow-md p-6">
                    <div className="text-center py-12">
                      <div className="inline-block">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vitrii-blue"></div>
                      </div>
                      <p className="text-vitrii-text-secondary mt-4">Carregando agenda...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Filters Section */}
                    <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
                      <h3 className="font-semibold text-vitrii-text mb-3">Filtros</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Filter by Contact */}
                        <div>
                          <label className="block text-sm font-medium text-vitrii-text mb-1">
                            Contato
                          </label>
                          <input
                            type="text"
                            placeholder="Buscar contato..."
                            value={filterContatoNome}
                            onChange={(e) => setFilterContatoNome(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
                          />
                        </div>

                        {/* Filter by Agenda Description */}
                        <div>
                          <label className="block text-sm font-medium text-vitrii-text mb-1">
                            Descrição da Agenda
                          </label>
                          <input
                            type="text"
                            placeholder="Buscar..."
                            value={filterDescricao}
                            onChange={(e) => setFilterDescricao(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
                          />
                        </div>

                        {/* Filter by Contact Type */}
                        <div>
                          <label className="block text-sm font-medium text-vitrii-text mb-1">
                            Tipo de Contato
                          </label>
                          <select
                            value={filterTipoContato}
                            onChange={(e) => setFilterTipoContato(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
                          >
                            <option value="">Todos os tipos</option>
                            {tiposContatoUnicos.map((tipo) => (
                              <option key={tipo} value={tipo}>
                                {tipo}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      {(filterContatoId || filterContatoNome || filterDescricao || filterTipoContato) && (
                        <button
                          onClick={() => {
                            setFilterContatoId(null);
                            setFilterContatoNome("");
                            setFilterDescricao("");
                            setFilterTipoContato("");
                          }}
                          className="mt-2 text-sm text-vitrii-blue hover:underline"
                        >
                          Limpar filtros
                        </button>
                      )}
                    </div>

                    <div className="flex gap-3 mb-6 flex-wrap">
                      <button
                        onClick={handleAddEvento}
                        className="px-4 py-2 bg-vitrii-blue text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                      >
                        + Adicionar Evento
                      </button>
                      <button
                        onClick={() => setShowRecurrenceModal(true)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                      >
                        🔄 Recorrência
                      </button>
                      <button
                        onClick={() => setShowFilaDeEsperaModal(true)}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                      >
                        + Fila de Espera
                      </button>
                      <button
                        onClick={() => setShowEditorModal(true)}
                        className="px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors font-medium flex items-center gap-2"
                      >
                        <Settings className="w-4 h-4" />
                        Editar Agenda
                      </button>
                      <button
                        onClick={() => setShowShareModal(true)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
                      >
                        <Share2 className="w-4 h-4" />
                        Compartilhar
                      </button>
                      <button
                        onClick={() => setShowDeleteFilterModal(true)}
                        disabled={bulkDeleteEventosMutation.isPending || eventos.length === 0}
                        className="ml-auto px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Deletar Agenda
                      </button>
                    </div>

                    <EventosAgendaCalendar
                      eventos={filteredEventos}
                      onSelectDate={handleSelectDate}
                      onSelectEvento={handleSelectEvento}
                      onAddEvento={handleAddEvento}
                      isEditable={true}
                    />
                  </>
                )}

                {/* Quick add for selected date */}
                {selectedDate && (
                  <div className="mt-6 p-4 bg-vitrii-yellow rounded-lg">
                    <p className="text-vitrii-text font-semibold mb-2">
                      Criar evento para{" "}
                      {selectedDate.toLocaleDateString("pt-BR")}
                    </p>
                    <button
                      onClick={handleOpenNewEventoForDate}
                      className="px-4 py-2 bg-vitrii-yellow-dark text-white rounded-lg hover:opacity-90 transition-opacity"
                    >
                      + Novo Evento
                    </button>
                  </div>
                )}

                {/* Reservas Section */}
                {showReservasFor && (
                  <div ref={reservasRef} className="mt-8 p-6 bg-white rounded-lg shadow-md">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-bold text-vitrii-text">
                        Reservas e Lista de Espera
                      </h3>
                      <button
                        onClick={() => setShowReservasFor(null)}
                        className="px-4 py-2 bg-gray-200 text-vitrii-text rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Fechar
                      </button>
                    </div>
                    <ReservasEventoList
                      reservas={reservas}
                      onReservasChange={refetchReservas}
                    />
                  </div>
                )}
              </>
            )}

            {/* Visualizar Dia Tab */}
            {activeTab === "dia" && (
              <div>
                <div className="flex gap-3 mb-6">
                  <button
                    onClick={handleAddEvento}
                    className="px-4 py-2 bg-vitrii-blue text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                  >
                    + Adicionar Evento
                  </button>
                  <button
                    onClick={() => setShowEditorModal(true)}
                    className="px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors font-medium flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Editar Agenda
                  </button>
                </div>
                <ViewDiaEvento
                  eventos={filteredEventos}
                  onSelectEvento={handleSelectEvento}
                  isEditable={true}
                />
              </div>
            )}

            {/* Fila de Espera Tab */}
            {activeTab === "fila-espera" && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <FilaDeEsperaList
                  filas={filasEspera}
                  onRefresh={refetchFilasEspera}
                  isLoading={isLoadingFilasEspera}
                />
              </div>
            )}

            {/* Status Agenda Tab */}
            {activeTab === "status-agenda" && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <StatusAgenda
                  eventos={filteredEventos}
                  onStatusChange={refetchEventos}
                  isLoading={false}
                />
              </div>
            )}
          </>
        )}
      </main>

      <Footer />

      {/* Modals */}
      <EventoModal
        isOpen={isModalOpen}
        evento={selectedEvento}
        defaultDate={selectedDate || undefined}
        anuncianteId={selectedAnuncianteId || undefined}
        userId={user?.id}
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

      {selectedAnuncianteId && (
        <>
          <FilaDeEsperaModal
            isOpen={showFilaDeEsperaModal}
            onClose={() => setShowFilaDeEsperaModal(false)}
            onSuccess={refetchFilasEspera}
            anuncianteAlvoId={selectedAnuncianteId}
            anuncianteAlvoNome={
              anunciantes.find((a) => a.id === selectedAnuncianteId)?.nome || ""
            }
          />

          <AgendaEditorModal
            isOpen={showEditorModal}
            onClose={() => setShowEditorModal(false)}
            anuncianteId={selectedAnuncianteId}
            anuncianteNome={
              anunciantes.find((a) => a.id === selectedAnuncianteId)?.nome || ""
            }
          />

          <ShareAgendaModal
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            anuncianteId={selectedAnuncianteId}
            anuncianteNome={
              anunciantes.find((a) => a.id === selectedAnuncianteId)?.nome || ""
            }
          />

          <RecurrenceModal
            isOpen={showRecurrenceModal}
            onClose={() => setShowRecurrenceModal(false)}
            onCreateRecurrence={createRecurrenceMutation.mutateAsync}
            isLoading={createRecurrenceMutation.isPending}
          />

          <DeleteFilterModal
            isOpen={showDeleteFilterModal}
            onClose={() => setShowDeleteFilterModal(false)}
            onDelete={bulkDeleteEventosMutation.mutateAsync}
            eventos={eventos}
            contatos={todosContatos}
            isLoading={bulkDeleteEventosMutation.isPending}
          />
        </>
      )}
    </div>
  );
}
