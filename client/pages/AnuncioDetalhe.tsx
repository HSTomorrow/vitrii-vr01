import { useParams, useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ImageGallery from "@/components/ImageGallery";
import ShareModal from "@/components/ShareModal";
import {
  ChevronLeft,
  AlertCircle,
  Edit,
  Trash2,
  Eye,
  MessageSquare,
  Share2,
  MapPin,
  Package,
  DollarSign,
  Calendar,
  Power,
  RotateCcw,
  MessageCircle,
  Globe,
  Instagram,
  Facebook,
  Mail,
  X,
  Phone,
  Star,
  User,
  Copy,
  Check,
} from "lucide-react";

interface MembroEquipe {
  id: number;
  nome: string;
  email: string;
  whatsapp?: string;
  status: string;
}

const PIX_KEY = "00020101021126470014br.gov.bcb.pix0125contato@herestomorrow.com520400005303986540519.905802BR5914HERES TOMORROW6009SAO PAULO622905251KHC5J8MPZBEFKH86HJ3H33VE6304A7E5";

export default function AnuncioDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isLoggedIn } = useAuth();
  const [showMembrosModal, setShowMembrosModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedEquipeId, setSelectedEquipeId] = useState<number | null>(null);

  // Fetch ad details
  const { data, isLoading, error } = useQuery({
    queryKey: ["anuncio", id],
    queryFn: async () => {
      const response = await fetch(`/api/anuncios/${id}`);
      if (!response.ok) throw new Error("Anúncio não encontrado");
      return response.json();
    },
  });

  // Check if user can edit ad
  const { data: canEditData } = useQuery({
    queryKey: ["canEditAnuncio", id, user?.id],
    queryFn: async () => {
      const url = `/api/anuncios/${id}/can-edit${user?.id ? `?usuarioId=${user.id}` : ""}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Erro ao verificar permissões");
      return response.json();
    },
    enabled: !!id,
  });

  const canEdit = canEditData?.canEdit ?? false;

  // Fetch equipes do anunciante
  const { data: equipesData } = useQuery({
    queryKey: ["equipes-anunciante", data?.data?.anuncianteId],
    queryFn: async () => {
      const anuncianteId = data?.data?.anuncianteId;
      if (!anuncianteId) throw new Error("Anunciante não encontrado");
      const response = await fetch(
        `/api/equipes-venda?anuncianteId=${anuncianteId}`,
      );
      if (!response.ok) throw new Error("Erro ao buscar equipes");
      return response.json();
    },
    enabled: !!data?.data?.anuncianteId,
  });

  // Fetch membros disponíveis de uma equipe
  const { data: membrosData } = useQuery({
    queryKey: ["membros-disponiveis", selectedEquipeId],
    queryFn: async () => {
      const response = await fetch(
        `/api/equipes-venda/${selectedEquipeId}/membros-disponiveis`,
      );
      if (!response.ok) throw new Error("Erro ao buscar membros");
      return response.json();
    },
    enabled: !!selectedEquipeId,
  });

  // Fetch photos for the ad
  const { data: fotosData } = useQuery({
    queryKey: ["anuncio-fotos", id],
    queryFn: async () => {
      const response = await fetch(`/api/anuncios/${id}/fotos`);
      if (!response.ok) throw new Error("Erro ao buscar fotos");
      return response.json();
    },
    enabled: !!id,
  });

  const equipes = equipesData?.data || [];
  const membros = membrosData?.data || [];
  const fotos = fotosData?.data || [];

  // Check if there are any available members in any team
  const temMembrosDisponiveis = equipes.some((equipe) =>
    equipe.membros?.some((membro) => membro.status === "disponivel"),
  );

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/anuncios/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Erro ao deletar");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Anúncio deletado com sucesso");
      queryClient.invalidateQueries({ queryKey: ["anuncios"] });
      navigate("/sell");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao deletar");
    },
  });

  // Inactivate mutation
  const inactivateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/anuncios/${id}/inactivate`, {
        method: "PATCH",
      });
      if (!response.ok) throw new Error("Erro ao inativar");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Anúncio inativado com sucesso");
      queryClient.invalidateQueries({ queryKey: ["anuncio", id] });
      queryClient.invalidateQueries({ queryKey: ["anuncios"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao inativar");
    },
  });

  // Activate mutation
  const activateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/anuncios/${id}/activate`, {
        method: "PATCH",
      });
      if (!response.ok) throw new Error("Erro ao reativar");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Anúncio reativado com sucesso");
      queryClient.invalidateQueries({ queryKey: ["anuncio", id] });
      queryClient.invalidateQueries({ queryKey: ["anuncios"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao reativar");
    },
  });

  // Toggle destaque mutation (admin only)
  const destacueMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/anuncios/${id}/destaque`, {
        method: "PATCH",
      });
      if (!response.ok) throw new Error("Erro ao alterar status de destaque");
      return response.json();
    },
    onSuccess: (data) => {
      toast.success(
        data.data?.message || "Status de destaque alterado com sucesso",
      );
      queryClient.invalidateQueries({ queryKey: ["anuncio", id] });
      queryClient.invalidateQueries({ queryKey: ["anuncios"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao alterar status de destaque",
      );
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vitrii-blue" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-vitrii-text text-lg">Anúncio não encontrado</p>
            <Link
              to="/sell"
              className="text-vitrii-blue hover:underline mt-4 inline-block"
            >
              Voltar para anúncios
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const anuncio = data.data;
  const statusColors: any = {
    em_edicao: "bg-yellow-100 text-yellow-800",
    aguardando_pagamento: "bg-blue-100 text-blue-800",
    pago: "bg-green-100 text-green-800",
    historico: "bg-gray-100 text-gray-800",
  };

  const statusLabels: any = {
    em_edicao: "Em Edição",
    aguardando_pagamento: "Aguardando Pagamento",
    pago: "Publicado",
    historico: "Histórico",
  };

  const isInactive = !anuncio.isActive;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      {/* Main Content */}
      <main className="flex-1 py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-vitrii-blue hover:text-vitrii-blue-dark font-semibold mb-8"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Voltar
          </button>

          {/* Header with Status */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="flex items-center gap-4 mb-2 flex-wrap">
                <h1 className="text-4xl font-bold text-vitrii-text">
                  {anuncio.titulo}
                </h1>
                {canEdit && (
                  <>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[anuncio.status] || statusColors.em_edicao}`}
                    >
                      {statusLabels[anuncio.status] || anuncio.status}
                    </span>
                    {isInactive && (
                      <span className="px-3 py-1 rounded-full text-sm font-semibold bg-gray-400 text-white">
                        Inativo
                      </span>
                    )}
                  </>
                )}
              </div>
              <div className="flex items-center gap-4 text-vitrii-text-secondary mt-2 mb-2">
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>Visualizações: {anuncio.visualizacoes || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  <span>ID: #{anuncio.id}</span>
                </div>
              </div>
              <p className="text-sm text-vitrii-text-secondary">
                Publicado por:{" "}
                <span className="font-semibold text-vitrii-text">
                  {anuncio.anunciantes?.nome || "Anunciante desconhecido"}
                </span>
              </p>
            </div>

            {/* Action Buttons - Only show if user can edit */}
            {canEdit && (
              <div className="flex gap-2 flex-wrap">
                {!isInactive && (
                  <Link
                    to={`/anuncio/${id}/editar`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-vitrii-blue text-white rounded-lg hover:bg-vitrii-blue-dark transition-colors font-semibold"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </Link>
                )}
                <button
                  onClick={() => {
                    if (isInactive) {
                      activateMutation.mutate();
                    } else {
                      if (
                        confirm(
                          "Tem certeza que deseja inativar este anúncio? Ele deixará de aparecer na busca.",
                        )
                      ) {
                        inactivateMutation.mutate();
                      }
                    }
                  }}
                  disabled={
                    inactivateMutation.isPending || activateMutation.isPending
                  }
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 ${
                    isInactive
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : "bg-orange-500 text-white hover:bg-orange-600"
                  }`}
                >
                  {isInactive ? (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      Reativar
                    </>
                  ) : (
                    <>
                      <Power className="w-4 h-4" />
                      Inativar
                    </>
                  )}
                </button>
                {/* Admin-only: Toggle Featured status */}
                {user?.tipoUsuario === "adm" && (
                  <button
                    onClick={() => destacueMutation.mutate()}
                    disabled={destacueMutation.isPending}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 ${
                      anuncio.destaque
                        ? "bg-yellow-500 text-white hover:bg-yellow-600"
                        : "bg-gray-400 text-white hover:bg-gray-500"
                    }`}
                  >
                    <Star className="w-4 h-4" />
                    {anuncio.destaque
                      ? "Remover do Destaque"
                      : "Adicionar ao Destaque"}
                  </button>
                )}
                <button
                  onClick={() => {
                    if (
                      confirm(
                        "Tem certeza que deseja deletar este anúncio? Isso não pode ser desfeito.",
                      )
                    ) {
                      deleteMutation.mutate();
                    }
                  }}
                  disabled={deleteMutation.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Deletar
                </button>
              </div>
            )}
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Product Image / Gallery */}
              <div className="bg-white rounded-lg overflow-hidden mb-8">
                {fotos && fotos.length > 0 ? (
                  <ImageGallery
                    photos={fotos}
                    anuncioId={parseInt(id!)}
                    canDelete={canEdit}
                    anuncianteFotoUrl={anuncio.anunciantes?.fotoUrl}
                    onPhotoDeleted={() => {
                      queryClient.invalidateQueries({
                        queryKey: ["anuncio-fotos", id],
                      });
                    }}
                  />
                ) : (
                  <div className="w-full space-y-4">
                    {/* Show primary image or anunciante photo or placeholder */}
                    <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden aspect-square">
                      {anuncio.imagem ? (
                        <img
                          src={anuncio.imagem}
                          alt={anuncio.titulo}
                          className="w-full h-full object-cover"
                        />
                      ) : anuncio.anunciantes?.fotoUrl ? (
                        <>
                          <img
                            src={anuncio.anunciantes.fotoUrl}
                            alt="Foto do Anunciante"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 left-2 bg-gray-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                            Foto do Anunciante
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-300">
                          <Package className="w-16 h-16 text-gray-600" />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
                <h2 className="text-2xl font-bold text-vitrii-text mb-4">
                  Descrição
                </h2>
                <p className="text-vitrii-text-secondary whitespace-pre-wrap leading-relaxed">
                  {anuncio.descricao || "Sem descrição adicional"}
                </p>
              </div>

              {/* Product Details */}
              <div className="grid grid-cols-2 gap-4">
                {/* Store Info */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="font-bold text-vitrii-text mb-3">
                    Anunciante
                  </h3>
                  <div className="space-y-3">
                    <p className="text-vitrii-text font-semibold">
                      {anuncio.anunciantes?.nome || "Anunciante desconhecido"}
                    </p>
                    <div className="flex items-center gap-2 text-vitrii-text-secondary text-sm">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {anuncio.anunciantes?.endereco ||
                          "Endereço não informado"}
                      </span>
                    </div>
                    {/* Social Media Links */}
                    <div className="flex gap-3 pt-2">
                      {anuncio.anunciantes?.email && (
                        <a
                          href={`mailto:${anuncio.anunciantes.email}`}
                          className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 transition-colors"
                          title="Enviar email"
                        >
                          <Mail className="w-4 h-4" />
                        </a>
                      )}
                      {anuncio.anunciantes?.cnpj && (
                        <div className="text-sm text-vitrii-text-secondary">
                          CNPJ: {anuncio.anunciantes.cnpj}
                        </div>
                      )}
                      {anuncio.anunciantes?.telefone && (
                        <a
                          href={`tel:${anuncio.anunciantes.telefone.replace(/\D/g, "")}`}
                          className="inline-flex items-center gap-1 text-vitrii-blue hover:text-vitrii-blue-dark transition-colors"
                          title="Ligar"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Category */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="font-bold text-vitrii-text mb-3">Categoria</h3>
                  <p className="text-vitrii-text">
                    {anuncio.categoria || "Sem categoria"}
                  </p>
                  <p className="text-sm text-vitrii-text-secondary mt-2">
                    Tipo: {anuncio.tipo}
                  </p>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Price Card */}
              <div className="bg-vitrii-blue text-white rounded-lg p-6 mb-6">
                <p className="text-sm opacity-90 mb-1">Preço</p>
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold">
                    R$ {Number(anuncio.preco || 0).toFixed(2)}
                  </span>
                </div>
                {anuncio.isDoacao && (
                  <div className="mt-4 pt-4 border-t border-blue-400">
                    <p className="text-sm font-semibold">
                      Este item é gratuito/doação
                    </p>
                  </div>
                )}
              </div>

              {/* Contact Actions */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 space-y-3">
                {temMembrosDisponiveis && (
                  <button
                    onClick={() => {
                      if (equipes.length === 1) {
                        setSelectedEquipeId(equipes[0].id);
                        setShowMembrosModal(true);
                      } else {
                        setShowMembrosModal(true);
                      }
                    }}
                    className="w-full px-4 py-3 bg-vitrii-yellow text-vitrii-text rounded-lg font-semibold hover:bg-vitrii-yellow-dark transition-colors"
                  >
                    Chamar Vendedor
                  </button>
                )}
                <button
                  onClick={() => {
                    if (!user) {
                      toast.error("Faça login para enviar mensagens");
                      navigate("/auth/signin");
                      return;
                    }
                    navigate(
                      `/chat?anuncianteId=${anuncio.anuncianteId}&anuncioId=${anuncio.id}`,
                    );
                  }}
                  className="w-full px-4 py-3 border-2 border-vitrii-blue text-vitrii-blue rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Enviar Mensagem
                </button>
                {anuncio.anunciantes?.whatsapp && (
                  <a
                    href={`https://wa.me/${anuncio.anunciantes.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full px-4 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </a>
                )}
                {anuncio.link && (
                  <a
                    href={anuncio.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full px-4 py-3 bg-vitrii-blue text-white rounded-lg font-semibold hover:bg-vitrii-blue-dark transition-colors flex items-center justify-center gap-2"
                  >
                    <Globe className="w-4 h-4" />
                    Acessar Anúncio Externo
                  </a>
                )}
                {canEdit && anuncio.status === "em_edicao" && anuncio.statusPagamento === "pendente" && (
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="w-full px-4 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <DollarSign className="w-4 h-4" />
                    Efetuar Pagamento
                  </button>
                )}
                <button
                  onClick={() => setShowShareModal(true)}
                  className="w-full px-4 py-3 border-2 border-gray-300 text-vitrii-text rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Compartilhar
                </button>
                <button
                  onClick={() => navigate(`/anunciante/${anuncio.anuncianteId}`)}
                  className="w-full px-4 py-3 bg-vitrii-text text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                >
                  <User className="w-4 h-4" />
                  Anunciante
                </button>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 space-y-3">
                <div className="flex gap-2">
                  <Calendar className="w-5 h-5 text-vitrii-blue flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-vitrii-text-secondary">Publicado em</p>
                    <p className="font-semibold text-vitrii-text">
                      {new Date(anuncio.dataCriacao).toLocaleDateString(
                        "pt-BR",
                      )}
                    </p>
                    <p className="text-xs text-vitrii-text-secondary mt-1">
                      ID: {anuncio.id}
                    </p>
                  </div>
                </div>
                {canEdit && (
                  <div className="flex gap-2">
                    <DollarSign className="w-5 h-5 text-vitrii-blue flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="text-vitrii-text-secondary">
                        Status de Pagamento
                      </p>
                      <p className="font-semibold text-vitrii-text">
                        {anuncio.status === "pago" ? "Pago" : "Pendente"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal: Chamar Vendedor */}
      {showMembrosModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-96 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-vitrii-text">
                Chamar Vendedor
              </h3>
              <button
                onClick={() => {
                  setShowMembrosModal(false);
                  setSelectedEquipeId(null);
                }}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {equipes.length > 1 && !selectedEquipeId && (
                <div className="space-y-3">
                  <p className="text-sm text-vitrii-text-secondary mb-4">
                    Selecione uma equipe de vendas:
                  </p>
                  {equipes.map((equipe) => (
                    <button
                      key={equipe.id}
                      onClick={() => setSelectedEquipeId(equipe.id)}
                      className="w-full p-4 border border-gray-300 rounded-lg hover:border-vitrii-blue hover:bg-blue-50 transition-colors text-left"
                    >
                      <p className="font-semibold text-vitrii-text">
                        {equipe.nome}
                      </p>
                      <p className="text-sm text-vitrii-text-secondary">
                        {equipe.membros.length} membro(s)
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {selectedEquipeId && (
                <div className="space-y-4">
                  <p className="text-sm text-vitrii-text-secondary mb-4">
                    Membros disponíveis para contato:
                  </p>

                  {membros.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">
                        Nenhum membro disponível no momento
                      </p>
                    </div>
                  ) : (
                    membros.map((membro: MembroEquipe) => (
                      <div
                        key={membro.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <p className="font-semibold text-vitrii-text mb-2">
                          {membro.nome}
                        </p>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-vitrii-text-secondary">
                            <Mail className="w-4 h-4" />
                            <a
                              href={`mailto:${membro.email}`}
                              className="text-vitrii-blue hover:underline"
                            >
                              {membro.email}
                            </a>
                          </div>

                          {membro.whatsapp && (
                            <div className="flex items-center gap-2">
                              <a
                                href={`https://wa.me/${membro.whatsapp.replace(/\D/g, "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold"
                              >
                                <MessageCircle className="w-4 h-4" />
                                {membro.whatsapp}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}

                  {equipes.length > 1 && (
                    <button
                      onClick={() => setSelectedEquipeId(null)}
                      className="w-full mt-4 px-4 py-2 border border-gray-300 text-vitrii-text rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm"
                    >
                      Voltar para Equipes
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title={anuncio.titulo}
        url={`${window.location.origin}/anuncio/${anuncio.id}`}
        whatsappPhone={anuncio.anunciantes?.whatsapp}
        whatsappMessage={`Confira este anúncio: ${anuncio.titulo}`}
      />

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0">
              <h2 className="text-xl font-bold text-vitrii-text">
                Efetuar Pagamento - C6 Bank PIX
              </h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-blue-900 mb-2">
                  📱 Como pagar via PIX:
                </p>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Abra seu app bancário</li>
                  <li>Escaneie o QR Code abaixo OU copie a chave PIX</li>
                  <li>Confirme o pagamento de R$ 19,90 (3 meses de anúncio)</li>
                  <li>Clique em "Pagamento Realizado" para validar</li>
                </ol>
              </div>

              {/* QR Code Section */}
              <div>
                <h3 className="font-semibold text-vitrii-text mb-3">
                  QR Code PIX
                </h3>
                <div className="flex justify-center">
                  <div className="bg-gray-100 p-4 rounded-lg border-4 border-vitrii-blue">
                    <img
                      src="https://cdn.builder.io/api/v1/image/assets%2Ff2e9e91d4cc44d4bae5b9dac3bb6abe8%2F97d00882ea4a4c149ab37215aedb309b?format=webp&width=800&height=1200"
                      alt="PIX QR Code"
                      className="w-64 h-64 object-contain"
                    />
                  </div>
                </div>
              </div>

              {/* PIX Key Section */}
              <div>
                <h3 className="font-semibold text-vitrii-text mb-3">
                  Copiar Chave PIX
                </h3>
                <p className="text-xs text-vitrii-text-secondary mb-2">
                  Clique no botão para copiar a chave e pagar via seu app
                  bancário
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(PIX_KEY).then(() => {
                      setCopied(true);
                      toast.success("Chave PIX copiada!");
                      setTimeout(() => setCopied(false), 2000);
                    }).catch(() => {
                      toast.error("Erro ao copiar chave PIX");
                    });
                  }}
                  className="w-full bg-gray-100 hover:bg-gray-200 border-2 border-gray-300 rounded-lg p-4 flex items-center justify-between transition-colors"
                >
                  <code className="text-xs text-vitrii-text font-mono truncate">
                    {PIX_KEY}
                  </code>
                  {copied ? (
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 ml-2" />
                  ) : (
                    <Copy className="w-5 h-5 text-vitrii-blue flex-shrink-0 ml-2" />
                  )}
                </button>
              </div>

              {/* Payment Confirmation */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-900 font-semibold mb-2">
                  ⚠️ Importante:
                </p>
                <p className="text-sm text-yellow-800">
                  Após realizar o pagamento via PIX, clique no botão abaixo
                  para registrar o comprovante e iniciar a análise de validação
                  do pagamento (até 24 horas).
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-2 border-2 border-vitrii-blue text-vitrii-blue rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    toast.info(
                      "Você será redirecionado para a página de confirmação de pagamento",
                    );
                    navigate(`/checkout/${anuncio.id}`);
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Pagamento Realizado
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
