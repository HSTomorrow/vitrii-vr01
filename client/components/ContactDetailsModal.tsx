import React from "react";
import {
  X,
  Phone,
  Mail,
  MessageSquare,
  Tag,
  User,
  Send,
  Calendar,
  Briefcase,
} from "lucide-react";
import ImageWithFallback from "@/components/ImageWithFallback";
import { getUserInitials } from "@/utils/imageFallback";

interface Contato {
  id: number;
  usuarioId: number;
  anuncianteId?: number | null;
  nome: string;
  celular: string;
  telefone?: string;
  email?: string;
  status: "ativo" | "inativo" | "analise";
  tipoContato: string;
  observacoes?: string;
  imagem?: string;
  dataCriacao?: string;
  dataAtualizacao?: string;
  usuario?: {
    id: number;
    nome: string;
    email: string;
  };
  anunciante?: {
    id: number;
    nome: string;
  } | null;
}

interface ContactDetailsModalProps {
  isOpen: boolean;
  contato: Contato | null;
  onClose: () => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "ativo":
      return "bg-green-100 text-green-800";
    case "inativo":
      return "bg-gray-100 text-gray-800";
    case "analise":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "ativo":
      return "Ativo";
    case "inativo":
      return "Inativo";
    case "analise":
      return "Análise";
    default:
      return status;
  }
};

const formatarData = (data: string | undefined): string => {
  if (!data) return "-";

  try {
    const date = new Date(data);

    if (isNaN(date.getTime())) {
      return "-";
    }

    const dia = String(date.getDate()).padStart(2, "0");
    const mes = String(date.getMonth() + 1).padStart(2, "0");
    const ano = date.getFullYear();
    const hora = String(date.getHours()).padStart(2, "0");
    const minuto = String(date.getMinutes()).padStart(2, "0");
    const segundo = String(date.getSeconds()).padStart(2, "0");

    return `${dia}/${mes}/${ano} ${hora}:${minuto}:${segundo}`;
  } catch {
    return "-";
  }
};

const formatWhatsAppPhone = (phone: string): string => {
  return phone.replace(/\D/g, "");
};

export default function ContactDetailsModal({
  isOpen,
  contato,
  onClose,
}: ContactDetailsModalProps) {
  if (!isOpen || !contato) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white rounded-t-lg sm:rounded-lg w-full sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-lg">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-white">
          <h2 className="text-xl sm:text-2xl font-bold text-vitrii-text">
            Detalhes do Contato
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* Profile Section */}
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            {/* Image */}
            <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-lg">
              <ImageWithFallback
                src={contato.imagem || null}
                alt={contato.nome}
                fallbackIcon={<User className="w-12 h-12 text-vitrii-blue" />}
                containerClassName="w-full h-full bg-vitrii-gray-light"
                className="w-full h-full object-cover"
                fallbackInitials={getUserInitials(contato)}
              />
            </div>

            {/* Name and Status */}
            <div className="flex-1 min-w-0">
              <h3 className="text-2xl font-bold text-vitrii-text break-words">
                {contato.nome}
              </h3>
              <p className="text-sm text-gray-600 mt-1">{contato.tipoContato}</p>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    contato.status
                  )}`}
                >
                  {getStatusLabel(contato.status)}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-3 border-t border-gray-200 pt-4">
            <h4 className="font-semibold text-vitrii-text text-sm">
              Informações de Contato
            </h4>

            {/* Cell Phone */}
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-vitrii-blue flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600">Celular</p>
                <p className="text-vitrii-text font-medium break-all">
                  {contato.celular}
                </p>
              </div>
              {contato.celular && (
                <a
                  href={`https://wa.me/${formatWhatsAppPhone(contato.celular)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors flex items-center gap-1"
                  title={`WhatsApp para ${contato.celular}`}
                >
                  <Send className="w-4 h-4" />
                  <span className="text-xs font-medium">WhatsApp</span>
                </a>
              )}
            </div>

            {/* Telephone */}
            {contato.telefone && (
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600">Telefone</p>
                  <p className="text-vitrii-text font-medium break-all">
                    {contato.telefone}
                  </p>
                </div>
              </div>
            )}

            {/* Email */}
            {contato.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-vitrii-blue flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600">E-mail</p>
                  <p className="text-vitrii-text font-medium break-all">
                    {contato.email}
                  </p>
                </div>
                <a
                  href={`mailto:${contato.email}`}
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 transition-colors flex items-center gap-1"
                  title={`E-mail para ${contato.email}`}
                >
                  <Mail className="w-4 h-4" />
                  <span className="text-xs font-medium">E-mail</span>
                </a>
              </div>
            )}
          </div>

          {/* Additional Information */}
          {(contato.observacoes || contato.anunciante) && (
            <div className="space-y-3 border-t border-gray-200 pt-4">
              <h4 className="font-semibold text-vitrii-text text-sm">
                Informações Adicionais
              </h4>

              {/* Observations */}
              {contato.observacoes && (
                <div className="flex gap-3">
                  <MessageSquare className="w-5 h-5 text-vitrii-blue flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-600">Observações</p>
                    <p className="text-vitrii-text text-sm whitespace-pre-wrap break-words">
                      {contato.observacoes}
                    </p>
                  </div>
                </div>
              )}

              {/* Anunciante */}
              {contato.anunciante && (
                <div className="flex gap-3">
                  <Briefcase className="w-5 h-5 text-vitrii-blue flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-600">Anunciante</p>
                    <p className="text-vitrii-text text-sm font-medium">
                      {contato.anunciante.nome}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Metadata */}
          {(contato.dataCriacao || contato.dataAtualizacao) && (
            <div className="space-y-3 border-t border-gray-200 pt-4">
              <h4 className="font-semibold text-vitrii-text text-sm">
                Informações do Sistema
              </h4>

              {contato.dataCriacao && (
                <div className="flex gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-600">Data de Criação</p>
                    <p className="text-vitrii-text text-sm font-mono">
                      {formatarData(contato.dataCriacao)}
                    </p>
                  </div>
                </div>
              )}

              {contato.dataAtualizacao && (
                <div className="flex gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-600">Data de Alteração</p>
                    <p className="text-vitrii-text text-sm font-mono">
                      {formatarData(contato.dataAtualizacao)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer - Action Buttons */}
        <div className="sticky bottom-0 border-t border-gray-200 p-4 sm:p-6 bg-white">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-vitrii-blue text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
