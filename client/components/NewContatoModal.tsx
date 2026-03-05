import { useState, useEffect } from "react";
import { X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Contato {
  id: number;
  nome: string;
  celular: string;
  email?: string;
}

interface NewContatoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (contato: Contato) => void;
  isLoading?: boolean;
  existingContatos?: Contato[];
}

interface DuplicateWarning {
  exists: boolean;
  contatoId?: number;
  contatoNome?: string;
  usuarioId?: number;
  field: "email" | "celular" | null;
}

export default function NewContatoModal({
  isOpen,
  onClose,
  onSuccess,
  isLoading = false,
  existingContatos = [],
}: NewContatoModalProps) {
  const { user } = useAuth();
  const [nome, setNome] = useState("");
  const [celular, setCelular] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [tipoContato, setTipoContato] = useState("Cliente");
  const [status, setStatus] = useState("ativo");
  const [observacoes, setObservacoes] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState<DuplicateWarning>({
    exists: false,
    field: null,
  });
  const [isChecking, setIsChecking] = useState(false);

  // Check for duplicates
  const checkDuplicates = async (newNome: string, newCelular: string, newEmail: string) => {
    if (!newCelular && !newEmail) return;

    setIsChecking(true);
    try {
      const response = await fetch("/api/contatos/check-duplicates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": user?.id?.toString() || "",
        },
        body: JSON.stringify({
          celular: newCelular || undefined,
          email: newEmail || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.duplicate) {
          setDuplicateWarning({
            exists: true,
            contatoId: data.contatoId,
            contatoNome: data.contatoNome,
            field: data.field,
          });
        } else {
          setDuplicateWarning({
            exists: false,
            field: null,
          });
        }
      }
    } catch (error) {
      console.error("Erro ao verificar duplicatas:", error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Debounce the duplicate check
    const timer = setTimeout(() => {
      if (isOpen) {
        checkDuplicates(nome, celular, email);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [celular, email, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    if (!celular.trim()) {
      toast.error("Celular/WhatsApp é obrigatório");
      return;
    }

    // If duplicate exists and user hasn't confirmed, don't allow submit
    if (duplicateWarning.exists) {
      toast.error(
        `Contato duplicado encontrado: ${duplicateWarning.contatoNome} (ID: ${duplicateWarning.contatoId})`
      );
      return;
    }

    try {
      const response = await fetch("/api/contatos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": user?.id?.toString() || "",
        },
        body: JSON.stringify({
          nome: nome.trim(),
          celular: celular.trim(),
          telefone: telefone.trim() || undefined,
          email: email.trim() || undefined,
          tipoContato,
          status,
          observacoes: observacoes.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao criar contato");
      }

      const data = await response.json();
      toast.success("Contato criado com sucesso!");

      // Reset form
      setNome("");
      setCelular("");
      setTelefone("");
      setEmail("");
      setTipoContato("Cliente");
      setStatus("ativo");
      setObservacoes("");
      setDuplicateWarning({ exists: false, field: null });

      onSuccess(data.data);
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao criar contato"
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-vitrii-text">
            Novo Contato
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Duplicate Warning */}
          {duplicateWarning.exists && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg flex gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-orange-800 mb-1">
                  ⚠️ Contato Duplicado Encontrado
                </h4>
                <p className="text-sm text-orange-700">
                  Já existe um contato com este{" "}
                  <strong>
                    {duplicateWarning.field === "email" ? "email" : "celular"}
                  </strong>
                  :
                </p>
                <p className="text-sm text-orange-700 font-semibold mt-1">
                  {duplicateWarning.contatoNome}
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  ID Contato: {duplicateWarning.contatoId} • ID Usuário: {duplicateWarning.usuarioId}
                </p>
                <p className="text-xs text-orange-600 mt-2">
                  Cancele e edite o contato existente, ou continue para criar um novo.
                </p>
              </div>
            </div>
          )}

          {/* Nome */}
          <div>
            <label className="block text-sm font-semibold text-vitrii-text mb-2">
              Nome *
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              disabled={isLoading}
              maxLength={255}
              placeholder="Nome completo"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue disabled:bg-gray-100"
            />
          </div>

          {/* Celular */}
          <div>
            <label className="block text-sm font-semibold text-vitrii-text mb-2">
              Celular/WhatsApp *
            </label>
            <input
              type="tel"
              value={celular}
              onChange={(e) => setCelular(e.target.value)}
              disabled={isLoading}
              maxLength={20}
              placeholder="(11) 99999-9999"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue disabled:bg-gray-100"
            />
            {isChecking && (
              <p className="text-xs text-gray-500 mt-1">Verificando...</p>
            )}
          </div>

          {/* Telefone */}
          <div>
            <label className="block text-sm font-semibold text-vitrii-text mb-2">
              Telefone (Opcional)
            </label>
            <input
              type="tel"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              disabled={isLoading}
              maxLength={20}
              placeholder="(11) 3333-3333"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue disabled:bg-gray-100"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-vitrii-text mb-2">
              Email (Opcional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              maxLength={255}
              placeholder="contato@email.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue disabled:bg-gray-100"
            />
            {isChecking && (
              <p className="text-xs text-gray-500 mt-1">Verificando...</p>
            )}
          </div>

          {/* Tipo de Contato */}
          <div>
            <label className="block text-sm font-semibold text-vitrii-text mb-2">
              Tipo de Contato
            </label>
            <select
              value={tipoContato}
              onChange={(e) => setTipoContato(e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue disabled:bg-gray-100"
            >
              <option>Cliente</option>
              <option>Fornecedor</option>
              <option>Parceiro</option>
              <option>Representante</option>
              <option>Consultor</option>
              <option>Outro</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-vitrii-text mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue disabled:bg-gray-100"
            >
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
              <option value="analise">Em Análise</option>
            </select>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-semibold text-vitrii-text mb-2">
              Observações (Opcional)
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              disabled={isLoading}
              placeholder="Notas sobre o contato..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue disabled:bg-gray-100 resize-none"
              rows={3}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-vitrii-text hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || duplicateWarning.exists}
              className="flex-1 px-4 py-2 bg-vitrii-blue text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold disabled:opacity-50"
            >
              {isLoading ? "Criando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
