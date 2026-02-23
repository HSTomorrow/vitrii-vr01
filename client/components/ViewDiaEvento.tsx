import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Clock, MapPin, Users } from "lucide-react";

interface Evento {
  id: number;
  titulo: string;
  descricao?: string;
  dataInicio: string;
  dataFim: string;
  privacidade: string;
  cor: string;
}

interface ViewDiaEventoProps {
  eventos: Evento[];
  onSelectEvento?: (evento: Evento) => void;
  isEditable?: boolean;
}

export default function ViewDiaEvento({
  eventos,
  onSelectEvento,
  isEditable = false,
}: ViewDiaEventoProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const dayEventos = useMemo(() => {
    return eventos.filter((evento) => {
      const eventDate = new Date(evento.dataInicio);
      return (
        eventDate.getDate() === selectedDate.getDate() &&
        eventDate.getMonth() === selectedDate.getMonth() &&
        eventDate.getFullYear() === selectedDate.getFullYear()
      );
    });
  }, [eventos, selectedDate]);

  const sortedEventos = useMemo(() => {
    return [...dayEventos].sort((a, b) => {
      return (
        new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime()
      );
    });
  }, [dayEventos]);

  const handlePreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDayOfWeek = (date: Date) => {
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
    return days[date.getDay()];
  };

  // Generate dates for calendar selector (7 days before to 7 days after)
  const calendarDates = useMemo(() => {
    const dates = [];
    const today = new Date(selectedDate);
    
    for (let i = -7; i <= 7; i++) {
      const date = new Date(selectedDate);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  }, [selectedDate]);

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-6 space-y-6">
      {/* Header with Navigation */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-vitrii-text capitalize">
            {formatDate(selectedDate)}
          </h2>
          <button
            onClick={handleToday}
            className="px-4 py-2 bg-vitrii-blue text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold text-sm"
          >
            Hoje
          </button>
        </div>

        {/* Day Navigation */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={handlePreviousDay}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Dia anterior"
          >
            <ChevronLeft className="w-6 h-6 text-vitrii-blue" />
          </button>

          <div className="flex-1 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 pb-2 min-w-max px-4">
              {calendarDates.map((date) => {
                const isSelected =
                  date.getDate() === selectedDate.getDate() &&
                  date.getMonth() === selectedDate.getMonth() &&
                  date.getFullYear() === selectedDate.getFullYear();

                const isToday =
                  date.getDate() === new Date().getDate() &&
                  date.getMonth() === new Date().getMonth() &&
                  date.getFullYear() === new Date().getFullYear();

                const dayEventCount = eventos.filter((e) => {
                  const eDate = new Date(e.dataInicio);
                  return (
                    eDate.getDate() === date.getDate() &&
                    eDate.getMonth() === date.getMonth() &&
                    eDate.getFullYear() === date.getFullYear()
                  );
                }).length;

                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => setSelectedDate(new Date(date))}
                    className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg whitespace-nowrap transition-all ${
                      isSelected
                        ? "bg-vitrii-blue text-white shadow-lg"
                        : isToday
                          ? "bg-blue-50 text-vitrii-blue border-2 border-vitrii-blue"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <span className="text-xs font-semibold">
                      {getDayOfWeek(date)}
                    </span>
                    <span className="text-sm font-bold">{date.getDate()}</span>
                    {dayEventCount > 0 && (
                      <span className={`text-xs font-semibold ${isSelected ? "bg-white text-vitrii-blue" : "bg-vitrii-blue text-white"} px-1.5 py-0.5 rounded-full`}>
                        {dayEventCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleNextDay}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Próximo dia"
          >
            <ChevronRight className="w-6 h-6 text-vitrii-blue" />
          </button>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-vitrii-text">
          {sortedEventos.length} evento{sortedEventos.length !== 1 ? "s" : ""}
        </h3>

        {sortedEventos.length === 0 ? (
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-semibold">
              Nenhum evento agendado para este dia
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedEventos.map((evento) => {
              const inicio = new Date(evento.dataInicio);
              const fim = new Date(evento.dataFim);

              return (
                <div
                  key={evento.id}
                  onClick={() => onSelectEvento?.(evento)}
                  className={`
                    p-4 rounded-lg border-l-4 transition-all cursor-pointer
                    ${onSelectEvento ? "hover:shadow-lg" : ""}
                  `}
                  style={{
                    borderLeftColor: evento.cor,
                    backgroundColor:
                      evento.cor.length === 7
                        ? evento.cor + "15"
                        : "rgba(59, 130, 246, 0.1)",
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Time */}
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-semibold text-gray-700">
                          {formatTime(evento.dataInicio)} - {formatTime(evento.dataFim)}
                        </span>
                      </div>

                      {/* Title */}
                      <h4
                        className="text-lg font-bold mb-2"
                        style={{ color: evento.cor }}
                      >
                        {evento.titulo}
                      </h4>

                      {/* Description */}
                      {evento.descricao && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {evento.descricao}
                        </p>
                      )}

                      {/* Privacy Badge */}
                      <div className="flex gap-2">
                        <span className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-700 font-semibold">
                          {evento.privacidade === "publico"
                            ? "🌍 Público"
                            : evento.privacidade === "privado_usuarios"
                              ? "👥 Privado (Usuários)"
                              : "🔒 Privado"}
                        </span>
                      </div>
                    </div>

                    {/* Color Indicator */}
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0 mt-1"
                      style={{ backgroundColor: evento.cor }}
                      title="Cor do evento"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 Use as setas ou clique nos dias no calendário para navegar. Clique em um evento para visualizar/editar detalhes.
        </p>
      </div>
    </div>
  );
}
