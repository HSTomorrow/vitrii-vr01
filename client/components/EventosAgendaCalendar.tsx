import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, X, Plus } from "lucide-react";

interface Evento {
  id: number;
  titulo: string;
  descricao?: string;
  dataInicio: string;
  dataFim: string;
  privacidade: string;
  cor: string;
}

interface EventosAgendaCalendarProps {
  eventos: Evento[];
  onSelectDate?: (date: Date) => void;
  onSelectEvento?: (evento: Evento) => void;
  onAddEvento?: () => void;
  isEditable?: boolean;
}

export default function EventosAgendaCalendar({
  eventos,
  onSelectDate,
  onSelectEvento,
  onAddEvento,
  isEditable = false,
}: EventosAgendaCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getEventosForDate = (date: Date) => {
    return eventos.filter((evento) => {
      const eventDate = new Date(evento.dataInicio);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const monthDays = useMemo(() => {
    const days = [];
    const totalDays = daysInMonth(currentDate);
    const firstDay = firstDayOfMonth(currentDate);

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Days of the month
    for (let i = 1; i <= totalDays; i++) {
      days.push(
        new Date(currentDate.getFullYear(), currentDate.getMonth(), i),
      );
    }

    return days;
  }, [currentDate]);

  const handlePreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1),
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1),
    );
  };

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    onSelectDate?.(date);
  };

  const monthName = currentDate.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date) => {
    return (
      selectedDate &&
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-vitrii-text capitalize">
          {monthName}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={handlePreviousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Mês anterior"
          >
            <ChevronLeft className="w-5 h-5 text-vitrii-text" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Próximo mês"
          >
            <ChevronRight className="w-5 h-5 text-vitrii-text" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"].map((day) => (
          <div
            key={day}
            className="text-center font-semibold text-sm text-gray-600 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {monthDays.map((date, idx) => {
          const dayEventos = date ? getEventosForDate(date) : [];
          const selected = date ? isSelected(date) : false;
          const today = date ? isToday(date) : false;

          return (
            <div
              key={idx}
              onClick={() => date && handleSelectDate(date)}
              className={`
                min-h-20 p-2 rounded border transition-colors cursor-pointer
                ${!date ? "bg-gray-50" : ""}
                ${today ? "border-vitrii-blue bg-blue-50" : "border-gray-200"}
                ${selected ? "bg-vitrii-blue text-white border-vitrii-blue" : ""}
                ${date && !selected && !today ? "hover:bg-gray-50" : ""}
              `}
            >
              {date && (
                <>
                  <div
                    className={`text-sm font-semibold mb-1 ${
                      selected ? "text-white" : "text-vitrii-text"
                    }`}
                  >
                    {date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayEventos.slice(0, 2).map((evento) => (
                      <div
                        key={evento.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEvento?.(evento);
                        }}
                        className="text-xs rounded p-1 truncate cursor-pointer hover:opacity-80 text-white"
                        style={{ backgroundColor: evento.cor }}
                        title={evento.titulo}
                      >
                        {evento.titulo}
                      </div>
                    ))}
                    {dayEventos.length > 2 && (
                      <div className="text-xs text-gray-500 px-1">
                        +{dayEventos.length - 2} mais
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Add event button */}
      {isEditable && onAddEvento && (
        <div className="mt-4">
          <button
            onClick={onAddEvento}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-vitrii-yellow text-vitrii-text rounded-lg hover:bg-vitrii-yellow-dark transition-colors font-semibold"
          >
            <Plus className="w-5 h-5" />
            Adicionar Evento
          </button>
        </div>
      )}

      {/* Selected date events */}
      {selectedDate && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-vitrii-text mb-4">
            Eventos de {selectedDate.toLocaleDateString("pt-BR")}
          </h3>
          <div className="space-y-2">
            {getEventosForDate(selectedDate).length === 0 ? (
              <p className="text-gray-500 text-sm">Nenhum evento neste dia</p>
            ) : (
              getEventosForDate(selectedDate).map((evento) => (
                <div
                  key={evento.id}
                  onClick={() => onSelectEvento?.(evento)}
                  className="p-3 rounded border-l-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                  style={{ borderLeftColor: evento.cor }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-vitrii-text">
                        {evento.titulo}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {new Date(evento.dataInicio).toLocaleTimeString(
                          "pt-BR",
                          { hour: "2-digit", minute: "2-digit" },
                        )}{" "}
                        -{" "}
                        {new Date(evento.dataFim).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {evento.descricao && (
                        <p className="text-sm text-gray-500 mt-1">
                          {evento.descricao}
                        </p>
                      )}
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-700">
                          {evento.privacidade === "publico"
                            ? "🌍 Público"
                            : evento.privacidade === "privado_usuarios"
                              ? "👥 Restrita"
                              : "🔒 Privado"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
