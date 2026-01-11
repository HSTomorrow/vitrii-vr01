import { useParams, useNavigate, Link, useState } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
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
} from "lucide-react";

interface MembroEquipe {
  id: number;
  nome: string;
  email: string;
  whatsapp?: string;
  status: string;
}

export default function AnuncioDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isLoggedIn } = useAuth();
  const [showMembrosModal, setShowMembrosModal] = useState(false);
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
      const response = await fetch(`/api/equipes-venda?anuncianteId=${anuncianteId}`);
      if (!response.ok) throw new Error("Erro ao buscar equipes");
      return response.json();
    },
    enabled: !!data?.data?.anuncianteId,
  });

  // Fetch membros disponíveis de uma equipe
  const { data: membrosData } = useQuery({
    queryKey: ["membros-disponiveis", selectedEquipeId],
    queryFn: async () => {
      const response = await fetch(`/api/equipes-venda/${selectedEquipeId}/membros-disponiveis`);
      if (!response.ok) throw new Error("Erro ao buscar membros");
      return response.json();
    },
    enabled: !!selectedEquipeId,
  });

  const equipes = equipesData?.data || [];
  const membros = membrosData?.data || [];

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-walmart-blue" />
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
            <p className="text-walmart-text text-lg">Anúncio não encontrado</p>
            <Link
              to="/sell"
              className="text-walmart-blue hover:underline mt-4 inline-block"
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
            className="inline-flex items-center text-walmart-blue hover:text-walmart-blue-dark font-semibold mb-8"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Voltar
          </button>

          {/* Header with Status */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="flex items-center gap-4 mb-2 flex-wrap">
                <h1 className="text-4xl font-bold text-walmart-text">
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
              <div className="flex items-center gap-4 text-walmart-text-secondary mt-2 mb-2">
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>Visualizações: 0</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  <span>Mensagens: 0</span>
                </div>
              </div>
              <p className="text-sm text-walmart-text-secondary">
                Publicado por:{" "}
                <span className="font-semibold text-walmart-text">
                  {anuncio.anunciante.nome}
                </span>
              </p>
            </div>

            {/* Action Buttons - Only show if user can edit */}
            {canEdit && (
              <div className="flex gap-2 flex-wrap">
                {!isInactive && (
                  <Link
                    to={`/anuncio/${id}/editar`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-walmart-blue text-white rounded-lg hover:bg-walmart-blue-dark transition-colors font-semibold"
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
              {/* Product Image */}
              <div className="bg-walmart-gray-light rounded-lg overflow-hidden mb-8">
                {anuncio.fotoUrl ? (
                  <img
                    src={anuncio.fotoUrl}
                    alt={anuncio.titulo}
                    className="w-full h-96 object-cover"
                  />
                ) : (
                  <div className="w-full h-96 flex items-center justify-center bg-gray-300">
                    <Package className="w-16 h-16 text-gray-600" />
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
                <h2 className="text-2xl font-bold text-walmart-text mb-4">
                  Descrição
                </h2>
                <p className="text-walmart-text-secondary whitespace-pre-wrap leading-relaxed">
                  {anuncio.descricao || "Sem descrição adicional"}
                </p>
              </div>

              {/* Product Details */}
              <div className="grid grid-cols-2 gap-4">
                {/* Store Info */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="font-bold text-walmart-text mb-3">
                    Anunciante
                  </h3>
                  <div className="space-y-3">
                    <p className="text-walmart-text font-semibold">
                      {anuncio.anunciante.nome}
                    </p>
                    <div className="flex items-center gap-2 text-walmart-text-secondary text-sm">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {anuncio.anunciante.endereco ||
                          "Endereço não informado"}
                      </span>
                    </div>
                    {/* Social Media Links */}
                    <div className="flex gap-3 pt-2">
                      {anuncio.anunciante.email && (
                        <a
                          href={`mailto:${anuncio.anunciante.email}`}
                          className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 transition-colors"
                          title="Enviar email"
                        >
                          <Mail className="w-4 h-4" />
                        </a>
                      )}
                      {anuncio.anunciante.site && (
                        <a
                          href={
                            anuncio.anunciante.site.startsWith("http")
                              ? anuncio.anunciante.site
                              : `https://${anuncio.anunciante.site}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-walmart-blue hover:text-walmart-blue-dark transition-colors"
                          title="Visitar site"
                        >
                          <Globe className="w-4 h-4" />
                        </a>
                      )}
                      {anuncio.anunciante.instagram && (
                        <a
                          href={`https://instagram.com/${anuncio.anunciante.instagram.replace(/^@/, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-pink-600 hover:text-pink-700 transition-colors"
                          title="Visitar Instagram"
                        >
                          <Instagram className="w-4 h-4" />
                        </a>
                      )}
                      {anuncio.anunciante.facebook && (
                        <a
                          href={`https://facebook.com/${anuncio.anunciante.facebook.replace(/^\//, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-800 transition-colors"
                          title="Visitar Facebook"
                        >
                          <Facebook className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Product Group */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="font-bold text-walmart-text mb-3">
                    Grupo de Produtos
                  </h3>
                  <p className="text-walmart-text">
                    {anuncio.producto?.grupo?.nome || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Price Card */}
              <div className="bg-walmart-blue text-white rounded-lg p-6 mb-6">
                <p className="text-sm opacity-90 mb-1">Preço</p>
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold">
                    R${" "}
                    {Number(
                      anuncio.precoAnuncio || anuncio.tabelaDePreco?.preco || 0,
                    ).toFixed(2)}
                  </span>
                </div>
                {anuncio.tabelaDePreco &&
                  (anuncio.tabelaDePreco.tamanho ||
                    anuncio.tabelaDePreco.cor) && (
                    <div className="mt-4 pt-4 border-t border-blue-400">
                      {anuncio.tabelaDePreco.tamanho && (
                        <p className="text-sm">
                          <span className="opacity-75">Tamanho:</span>{" "}
                          {anuncio.tabelaDePreco.tamanho}
                        </p>
                      )}
                      {anuncio.tabelaDePreco.cor && (
                        <p className="text-sm">
                          <span className="opacity-75">Cor:</span>{" "}
                          {anuncio.tabelaDePreco.cor}
                        </p>
                      )}
                    </div>
                  )}
              </div>

              {/* Contact Actions */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 space-y-3">
                <button
                  onClick={() => {
                    if (equipes.length === 0) {
                      toast.error("Nenhuma equipe de vendas disponível");
                    } else if (equipes.length === 1) {
                      setSelectedEquipeId(equipes[0].id);
                      setShowMembrosModal(true);
                    } else {
                      setShowMembrosModal(true);
                    }
                  }}
                  className="w-full px-4 py-3 bg-walmart-yellow text-walmart-text rounded-lg font-semibold hover:bg-walmart-yellow-dark transition-colors"
                >
                  Chamar Vendedor
                </button>
                <button className="w-full px-4 py-3 border-2 border-walmart-blue text-walmart-blue rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Enviar Mensagem
                </button>
                {anuncio.anunciante.whatsapp && (
                  <a
                    href={`https://wa.me/${anuncio.anunciante.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full px-4 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </a>
                )}
                <button className="w-full px-4 py-3 border-2 border-gray-300 text-walmart-text rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                  <Share2 className="w-4 h-4" />
                  Compartilhar
                </button>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 space-y-3">
                <div className="flex gap-2">
                  <Calendar className="w-5 h-5 text-walmart-blue flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-walmart-text-secondary">Publicado em</p>
                    <p className="font-semibold text-walmart-text">
                      {new Date(anuncio.dataCriacao).toLocaleDateString(
                        "pt-BR",
                      )}
                    </p>
                  </div>
                </div>
                {canEdit && (
                  <div className="flex gap-2">
                    <DollarSign className="w-5 h-5 text-walmart-blue flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="text-walmart-text-secondary">
                        Status de Pagamento
                      </p>
                      <p className="font-semibold text-walmart-text">
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
              <h3 className="text-xl font-bold text-walmart-text">
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
                  <p className="text-sm text-walmart-text-secondary mb-4">
                    Selecione uma equipe de vendas:
                  </p>
                  {equipes.map((equipe) => (
                    <button
                      key={equipe.id}
                      onClick={() => setSelectedEquipeId(equipe.id)}
                      className="w-full p-4 border border-gray-300 rounded-lg hover:border-walmart-blue hover:bg-blue-50 transition-colors text-left"
                    >
                      <p className="font-semibold text-walmart-text">{equipe.nome}</p>
                      <p className="text-sm text-walmart-text-secondary">
                        {equipe.membros.length} membro(s)
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {selectedEquipeId && (
                <div className="space-y-4">
                  <p className="text-sm text-walmart-text-secondary mb-4">
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
                        <p className="font-semibold text-walmart-text mb-2">
                          {membro.nome}
                        </p>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-walmart-text-secondary">
                            <Mail className="w-4 h-4" />
                            <a
                              href={`mailto:${membro.email}`}
                              className="text-walmart-blue hover:underline"
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
                      className="w-full mt-4 px-4 py-2 border border-gray-300 text-walmart-text rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm"
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

      <Footer />
    </div>
  );
}
