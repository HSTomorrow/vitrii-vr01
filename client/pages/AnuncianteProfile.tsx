import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  MapPin,
  Mail,
  Phone,
  Globe,
  Instagram,
  Facebook,
  MessageCircle,
  ArrowLeft,
  User,
  AlertCircle,
  Calendar,
} from "lucide-react";

interface Anunciante {
  id: number;
  nome: string;
  descricao?: string;
  fotoUrl?: string;
  tipo: string;
  cidade?: string;
  estado?: string;
  endereco?: string;
  cep?: string;
  telefone?: string;
  email?: string;
  site?: string;
  instagram?: string;
  facebook?: string;
  whatsapp?: string;
  dataCriacao?: string;
}

export default function AnuncianteProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [anunciante, setAnunciante] = useState<Anunciante | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["anunciante", id],
    queryFn: async () => {
      const response = await fetch(`/api/anunciantes/${id}`);
      if (!response.ok) {
        throw new Error("Falha ao carregar perfil do anunciante");
      }
      return response.json();
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (data?.data) {
      setAnunciante(data.data);
    }
  }, [data]);

  const getTipoBadgeColor = (tipo: string) => {
    switch (tipo) {
      case "Profissional":
        return "bg-blue-100 text-blue-700";
      case "Premium":
        return "bg-purple-100 text-purple-700";
      case "Master":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getTipoBgColor = (tipo: string) => {
    switch (tipo) {
      case "Profissional":
        return "from-blue-400 to-blue-600";
      case "Premium":
        return "from-purple-400 to-purple-600";
      case "Master":
        return "from-yellow-400 to-yellow-600";
      default:
        return "from-vitrii-blue to-vitrii-blue-dark";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
          <div className="animate-pulse space-y-8">
            <div className="h-64 bg-gray-300 rounded-lg" />
            <div className="space-y-4">
              <div className="h-8 bg-gray-300 rounded w-1/3" />
              <div className="h-4 bg-gray-300 rounded w-2/3" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !anunciante) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 text-vitrii-blue hover:text-vitrii-blue-dark mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-semibold text-red-900 mb-1">
                Anunciante não encontrado
              </h2>
              <p className="text-red-700 text-sm">
                Desculpe, não conseguimos encontrar o perfil deste anunciante.
              </p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Back Button */}
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 text-vitrii-blue hover:text-vitrii-blue-dark mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Home
        </button>

        {/* Header Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Logo/Imagem */}
          <div
            className={`bg-gradient-to-br ${getTipoBgColor(anunciante.tipo)} rounded-lg h-64 md:h-80 flex items-center justify-center overflow-hidden`}
          >
            {anunciante.fotoUrl ? (
              <img
                src={anunciante.fotoUrl}
                alt={anunciante.nome}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-24 h-24 text-white opacity-50" />
            )}
          </div>

          {/* Info Section */}
          <div className="md:col-span-2 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-vitrii-text mb-2">
                    {anunciante.nome}
                  </h1>
                  <span
                    className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getTipoBadgeColor(anunciante.tipo)}`}
                  >
                    {anunciante.tipo}
                  </span>
                </div>
              </div>

              {anunciante.descricao && (
                <p className="text-vitrii-text-secondary mb-6 leading-relaxed">
                  {anunciante.descricao}
                </p>
              )}

              {/* Location */}
              {(anunciante.cidade || anunciante.endereco) && (
                <div className="flex items-start gap-3 mb-4">
                  <MapPin className="w-5 h-5 text-vitrii-blue flex-shrink-0 mt-0.5" />
                  <div>
                    {anunciante.endereco && (
                      <div className="text-vitrii-text">{anunciante.endereco}</div>
                    )}
                    {anunciante.cidade && anunciante.estado && (
                      <div className="text-vitrii-text-secondary">
                        {anunciante.cidade}, {anunciante.estado}
                        {anunciante.cep && ` - ${anunciante.cep}`}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => navigate(`/browse?anuncianteId=${anunciante.id}`)}
            className="bg-gradient-to-r from-vitrii-blue to-vitrii-blue-dark hover:shadow-lg text-white py-4 rounded-lg font-bold text-lg transition-all duration-300 transform hover:-translate-y-1"
          >
            🛍️ O que temos na Vitrini
          </button>

          <button
            onClick={() => navigate(`/agenda/${anunciante.id}`)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-vitrii-yellow to-vitrii-yellow-dark hover:shadow-lg text-vitrii-text py-4 rounded-lg font-bold text-lg transition-all duration-300 transform hover:-translate-y-1"
          >
            <Calendar className="w-6 h-6" />
            Ver Agenda
          </button>
        </div>

        {/* Contact Information */}
        <div className="bg-vitrii-gray-light rounded-lg p-6 md:p-8 mb-8">
          <h2 className="text-2xl font-bold text-vitrii-text mb-6">
            Informações de Contato
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {anunciante.email && (
              <a
                href={`mailto:${anunciante.email}`}
                className="flex items-center gap-4 p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
              >
                <Mail className="w-6 h-6 text-vitrii-blue flex-shrink-0" />
                <div>
                  <div className="text-xs text-vitrii-text-secondary">Email</div>
                  <div className="text-vitrii-text font-semibold break-all">
                    {anunciante.email}
                  </div>
                </div>
              </a>
            )}

            {anunciante.telefone && (
              <a
                href={`tel:${anunciante.telefone}`}
                className="flex items-center gap-4 p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
              >
                <Phone className="w-6 h-6 text-vitrii-blue flex-shrink-0" />
                <div>
                  <div className="text-xs text-vitrii-text-secondary">Telefone</div>
                  <div className="text-vitrii-text font-semibold">
                    {anunciante.telefone}
                  </div>
                </div>
              </a>
            )}

            {anunciante.whatsapp && (
              <a
                href={`https://wa.me/${anunciante.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
              >
                <MessageCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div>
                  <div className="text-xs text-vitrii-text-secondary">WhatsApp</div>
                  <div className="text-vitrii-text font-semibold">
                    {anunciante.whatsapp}
                  </div>
                </div>
              </a>
            )}

            {anunciante.site && (
              <a
                href={anunciante.site}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
              >
                <Globe className="w-6 h-6 text-vitrii-blue flex-shrink-0" />
                <div>
                  <div className="text-xs text-vitrii-text-secondary">Website</div>
                  <div className="text-vitrii-text font-semibold truncate">
                    {anunciante.site}
                  </div>
                </div>
              </a>
            )}
          </div>
        </div>

        {/* Social Media */}
        {(anunciante.instagram || anunciante.facebook) && (
          <div className="bg-white rounded-lg p-6 md:p-8 border border-gray-200">
            <h2 className="text-2xl font-bold text-vitrii-text mb-6">
              Redes Sociais
            </h2>

            <div className="flex flex-wrap gap-4">
              {anunciante.instagram && (
                <a
                  href={`https://instagram.com/${anunciante.instagram.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-400 to-red-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow"
                >
                  <Instagram className="w-5 h-5" />
                  Instagram
                </a>
              )}

              {anunciante.facebook && (
                <a
                  href={`https://facebook.com/${anunciante.facebook.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow"
                >
                  <Facebook className="w-5 h-5" />
                  Facebook
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
