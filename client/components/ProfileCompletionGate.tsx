import { AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

interface ProfileCompletionGateProps {
  isOpen: boolean;
  onClose: () => void;
  actionLabel?: string; // e.g., "publicar anúncio" or "enviar mensagem"
}

export default function ProfileCompletionGate({
  isOpen,
  onClose,
  actionLabel = "realizar esta ação",
}: ProfileCompletionGateProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
        <div className="flex gap-3 mb-4">
          <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
          <h2 className="text-lg font-semibold text-walmart-text">
            Perfil Incompleto
          </h2>
        </div>

        <p className="text-walmart-text-secondary mb-4">
          Para {actionLabel}, você precisa completar seu perfil com CPF/CNPJ e
          telefone.
        </p>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
          <p className="text-sm text-yellow-800">
            Você pode navegar no site normalmente, mas ações como publicar
            anúncios ou acessar o chat requerem essas informações.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold text-walmart-text hover:bg-gray-50 transition-colors"
          >
            Continuar Navegando
          </button>
          <Link
            to="/profile"
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-walmart-blue text-white rounded-lg font-semibold hover:bg-walmart-blue-dark transition-colors text-center"
          >
            Completar Perfil
          </Link>
        </div>
      </div>
    </div>
  );
}
