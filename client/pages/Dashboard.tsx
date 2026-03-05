import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { MessageCircle, Calendar, Clock, Loader } from "lucide-react";

interface DashboardStats {
  unreadMessages: number;
  pendingAppointments: number;
  waitingListCount: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch unread messages count
  const { data: messagesData, isLoading: messagesLoading } = useQuery<{ data: { unreadCount: number } }>({
    queryKey: ["unread-messages", user?.id],
    queryFn: async () => {
      const response = await fetch("/api/mensagens/unread-count", {
        headers: {
          "X-User-Id": user?.id?.toString() || "",
        },
      });
      if (!response.ok) throw new Error("Erro ao buscar mensagens");
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Fetch pending appointments count
  const { data: appointmentsData, isLoading: appointmentsLoading } = useQuery<{ data: { count: number } }>({
    queryKey: ["pending-appointments", user?.id],
    queryFn: async () => {
      const response = await fetch("/api/reservas-evento/pending-count", {
        headers: {
          "X-User-Id": user?.id?.toString() || "",
        },
      });
      if (!response.ok) throw new Error("Erro ao buscar agendamentos");
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Fetch waiting list count
  const { data: waitingListData, isLoading: waitingListLoading } = useQuery<{ data: { count: number } }>({
    queryKey: ["waiting-list-count", user?.id],
    queryFn: async () => {
      const response = await fetch("/api/filas-espera/user-count", {
        headers: {
          "X-User-Id": user?.id?.toString() || "",
        },
      });
      if (!response.ok) throw new Error("Erro ao buscar fila de espera");
      return response.json();
    },
    enabled: !!user?.id,
  });

  const isLoading = messagesLoading || appointmentsLoading || waitingListLoading;

  const stats: DashboardStats = {
    unreadMessages: messagesData?.data?.unreadCount || 0,
    pendingAppointments: appointmentsData?.data?.count || 0,
    waitingListCount: waitingListData?.data?.count || 0,
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-vitrii-text mb-6">
            Olá, {user?.nome}! 👋
          </h1>

          {/* Main CTA Button - Go to Home */}
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-vitrii-text border-2 border-vitrii-yellow rounded-lg hover:bg-gray-50 transition-all font-bold text-lg shadow-md hover:shadow-lg transform hover:scale-105"
          >
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2Ff2e9e91d4cc44d4bae5b9dac3bb6abe8%2F9b0468b30c2f492b9eac618e9410fecf?format=webp&width=800"
              alt="Vitrii"
              className="h-6 w-auto"
            />
            <span>Ir para Anúncios</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Compact Stats Indicators */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="w-8 h-8 animate-spin text-vitrii-blue" />
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {/* Messages Indicator */}
            <Link
              to="/chat"
              className="flex items-center gap-2 px-4 py-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-all border border-gray-200 hover:border-blue-300 group"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <MessageCircle className="w-4 h-4 text-vitrii-blue" />
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-vitrii-text">
                  {stats.unreadMessages}
                </div>
                <div className="text-xs text-gray-600">Mensagens</div>
              </div>
            </Link>

            {/* Appointments Indicator */}
            <Link
              to="/minha-agenda"
              className="flex items-center gap-2 px-4 py-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-all border border-gray-200 hover:border-amber-300 group"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                <Calendar className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-vitrii-text">
                  {stats.pendingAppointments}
                </div>
                <div className="text-xs text-gray-600">Agendamentos</div>
              </div>
            </Link>

            {/* Waiting List Indicator */}
            <Link
              to="/minha-agenda"
              className="flex items-center gap-2 px-4 py-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-all border border-gray-200 hover:border-purple-300 group"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <Clock className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-vitrii-text">
                  {stats.waitingListCount}
                </div>
                <div className="text-xs text-gray-600">Fila de Espera</div>
              </div>
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
