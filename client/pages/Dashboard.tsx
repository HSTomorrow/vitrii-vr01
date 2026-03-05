import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { MessageCircle, Calendar, Clock, AlertCircle, Loader } from "lucide-react";

interface DashboardStats {
  unreadMessages: number;
  pendingAppointments: number;
  waitingListCount: number;
}

export default function Dashboard() {
  const { user } = useAuth();

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

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-vitrii-text mb-2">
            Olá, {user?.nome}! 👋
          </h1>
          <p className="text-gray-600 text-lg">
            Bem-vindo ao seu painel de controle
          </p>
        </div>

        {/* Stats Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 animate-spin text-vitrii-blue" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Messages Card */}
            <Link
              to="/chat"
              className="group bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 p-8"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <MessageCircle className="w-6 h-6 text-vitrii-blue" />
                </div>
                {stats.unreadMessages > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {stats.unreadMessages}
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-vitrii-text mb-2">
                Mensagens
              </h3>
              <p className="text-gray-600 mb-4">
                {stats.unreadMessages === 0
                  ? "Você está em dia com suas mensagens"
                  : `Você tem ${stats.unreadMessages} mensagem${stats.unreadMessages > 1 ? "s" : ""} não lida${stats.unreadMessages > 1 ? "s" : ""}`}
              </p>
              <span className="inline-flex items-center text-vitrii-blue font-semibold group-hover:gap-2 transition-all">
                Ir para Chat
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </Link>

            {/* Pending Appointments Card */}
            <Link
              to="/minha-agenda"
              className="group bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 p-8"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                  <Calendar className="w-6 h-6 text-amber-600" />
                </div>
                {stats.pendingAppointments > 0 && (
                  <span className="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {stats.pendingAppointments}
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-vitrii-text mb-2">
                Agendamentos
              </h3>
              <p className="text-gray-600 mb-4">
                {stats.pendingAppointments === 0
                  ? "Você não tem agendamentos pendentes"
                  : `Você tem ${stats.pendingAppointments} agendamento${stats.pendingAppointments > 1 ? "s" : ""} pendente${stats.pendingAppointments > 1 ? "s" : ""}`}
              </p>
              <span className="inline-flex items-center text-vitrii-blue font-semibold group-hover:gap-2 transition-all">
                Ir para Agenda
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </Link>

            {/* Waiting List Card */}
            <Link
              to="/minha-agenda"
              className="group bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 p-8"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                {stats.waitingListCount > 0 && (
                  <span className="bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {stats.waitingListCount}
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-vitrii-text mb-2">
                Fila de Espera
              </h3>
              <p className="text-gray-600 mb-4">
                {stats.waitingListCount === 0
                  ? "Você não está em nenhuma fila de espera"
                  : `Você está em ${stats.waitingListCount} fila${stats.waitingListCount > 1 ? "s" : ""} de espera`}
              </p>
              <span className="inline-flex items-center text-vitrii-blue font-semibold group-hover:gap-2 transition-all">
                Ir para Agenda
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </Link>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 mb-12">
          <h2 className="text-2xl font-bold text-vitrii-text mb-6">
            Ações Rápidas
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/meus-anuncios"
              className="p-4 border border-gray-300 rounded-lg text-center hover:border-vitrii-blue hover:bg-blue-50 transition-all font-semibold text-vitrii-text"
            >
              Meus Anúncios
            </Link>
            <Link
              to="/cadastro-contatos"
              className="p-4 border border-gray-300 rounded-lg text-center hover:border-vitrii-blue hover:bg-blue-50 transition-all font-semibold text-vitrii-text"
            >
              Meus Contatos
            </Link>
            <Link
              to="/perfil"
              className="p-4 border border-gray-300 rounded-lg text-center hover:border-vitrii-blue hover:bg-blue-50 transition-all font-semibold text-vitrii-text"
            >
              Meu Perfil
            </Link>
            <Link
              to="/chat"
              className="p-4 border border-gray-300 rounded-lg text-center hover:border-vitrii-blue hover:bg-blue-50 transition-all font-semibold text-vitrii-text"
            >
              Mensagens
            </Link>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 flex gap-4">
          <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">
              Precisa de ajuda?
            </h3>
            <p className="text-sm text-blue-800 mb-3">
              Explore nossos recursos, faça perguntas ou entre em contato com nosso suporte.
            </p>
            <Link
              to="/ajuda-e-contato"
              className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-800"
            >
              Ir para Ajuda
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
