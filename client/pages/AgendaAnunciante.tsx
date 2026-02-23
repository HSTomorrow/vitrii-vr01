import { useState } from "react";
import { useParams } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EventosAgendaCalendar from "@/components/EventosAgendaCalendar";
import ReservaEventoModal from "@/components/ReservaEventoModal";
import ShareAgendaModal from "@/components/ShareAgendaModal";
import { Loader, Share2, Lock, Store } from "lucide-react";
import ImageWithFallback from "@/components/ImageWithFallback";
import { getAnuncianteInitials } from "@/utils/imageFallback";

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
  fotoUrl?: string;
}

export default function AgendaAnunciante() {
  const { anuncianteId } = useParams<{ anuncianteId: string }>();
  const { user } = useAuth();
  const userIdStr = user?.id?.toString() || "";
  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);
  const [isReservaModalOpen, setIsReservaModalOpen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Fetch announcer info
  const { data: anunciante, isLoading: isLoadingAnunciante } =
    useQuery<Anunciante>({
      queryKey: ["anunciante", anuncianteId],
      queryFn: async () => {
        const response = await fetch(`/api/anunciantes/${anuncianteId}`);
        if (!response.ok) throw new Error("Erro ao buscar anunciante");
        const result = await response.json();
        return result.data;
      },
      enabled: !!anuncianteId,
    });

  // Fetch visible events for this announcer
  const { data: eventosData, isLoading: isLoadingEventos } = useQuery<
    Evento[]
  >({
    queryKey: ["eventos-visiveis", anuncianteId, user?.id],
    queryFn: async () => {
      const headers: Record<string, string> = {};
      if (user?.id) {
        headers["x-user-id"] = user.id.toString();
      }
      const response = await fetch(
        `/api/eventos-agenda/visiveis/${anuncianteId}`,
        { headers },
      );
      if (!response.ok) throw new Error("Erro ao buscar eventos");
      const result = await response.json();
      return result.data || [];
    },
    enabled: !!anuncianteId,
  });

  const isLoading = isLoadingAnunciante || isLoadingEventos;
  const eventos = eventosData || [];


  const handleSelectEvento = (evento: Evento) => {
    if (!user) {
      toast.error("Você precisa estar logado para fazer uma reserva");
      return;
    }
    setSelectedEvento(evento);
    setIsReservaModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader className="w-8 h-8 animate-spin text-vitrii-blue" />
            <p className="text-gray-600">Carregando agenda...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!anunciante) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 text-lg">Anunciante não encontrado</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-vitrii-blue">
              <ImageWithFallback
                src={anunciante.fotoUrl || null}
                alt={anunciante.nome}
                fallbackIcon={<Store className="w-8 h-8 text-vitrii-blue" />}
                containerClassName="w-full h-full bg-vitrii-gray-light"
                className="w-full h-full object-cover"
                fallbackInitials={getAnuncianteInitials(anunciante)}
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-vitrii-text">
                {anunciante.nome}
              </h1>
              <p className="text-gray-600">Agenda e Disponibilidade</p>
            </div>
          </div>

          {/* Share Button */}
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-vitrii-blue text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
          >
            <Share2 className="w-5 h-5" />
            Compartilhar Agenda
          </button>
        </div>

        {/* Calendar */}
        <EventosAgendaCalendar
          eventos={eventos}
          onSelectEvento={handleSelectEvento}
          isEditable={false}
        />

        {/* Info Box */}
        {eventos.length === 0 && (
          <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg text-center">
            <p className="text-blue-900">
              Nenhum evento público disponível no momento
            </p>
          </div>
        )}

        {/* Privacy Notice */}
        <div className="mt-8 p-4 bg-gray-100 rounded-lg text-sm text-gray-700">
          <p>
            <strong>Legenda:</strong> 🌍 Evento Público • 👥 Compartilhado com
            você • 🔒 Privado (não visível)
          </p>
        </div>
      </main>

      <Footer />

      {/* Reservation Modal */}
      <ReservaEventoModal
        isOpen={isReservaModalOpen}
        evento={selectedEvento}
        onClose={() => {
          setIsReservaModalOpen(false);
          setSelectedEvento(null);
        }}
      />

      {/* Share Modal */}
      {anuncianteId && (
        <ShareAgendaModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          anuncianteId={parseInt(anuncianteId)}
          anuncianteNome={anunciante?.nome || ""}
        />
      )}
    </div>
  );
}
