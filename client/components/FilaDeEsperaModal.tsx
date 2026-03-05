import { useState, useEffect } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Contato {
  id: number;
  nome: string;
  celular: string;
  telefone?: string;
  email?: string;
  tipoContato: string;
  imagem?: string;
}

interface FilaDeEsperaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  anuncianteAlvoId: number;
  anuncianteAlvoNome: string;
}

const PRIVACIDADES = [
  { value: "publico", label: "🌍 Público", desc: "Todos podem visualizar" },
  {
    value: "privado_usuarios",
    label: "👥 Restrita",
    desc: "Todos veem a disponibilidade, mas não o conteúdo",
  },
  { value: "privado", label: "🔒 Privado", desc: "Apenas você pode visualizar" },
];

export default function FilaDeEsperaModal({
  isOpen,
  onClose,
  onSuccess,
  anuncianteAlvoId,
  anuncianteAlvoNome,
}: FilaDeEsperaModalProps) {
  const { user } = useAuth();
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [horaInicio, setHoraInicio] = useState("10:00");
  const [dataFim, setDataFim] = useState("");
  const [horaFim, setHoraFim] = useState("11:00");
  const [privacidade, setPrivacidade] = useState("privado");
  const [contatosPermitidos, setContatosPermitidos] = useState<number[]>([]);
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [isLoadingContatos, setIsLoadingContatos] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch contatos when modal opens
  useEffect(() => {
    const fetchContatos = async () => {
      if (!isOpen) return;

      setIsLoadingContatos(true);
      try {
        // Fetch user's contacts (optionally filtered by announcer)
        const response = await fetch("/api/contatos", {
          headers: {
            "X-User-Id": user?.id?.toString() || "",
          },
        });
        if (response.ok) {
          const data = await response.json();
          // Filter contacts: if anuncianteAlvoId is provided, show those OR contacts without a specific announcer
          const contatosList = (data.data || [])
            .filter((contato: any) => {
              if (!anuncianteAlvoId) return true; // Show all if no announcer selected
              // Show contacts for this announcer or contacts for all announcers
              return !contato.anuncianteId || contato.anuncianteId === anuncianteAlvoId;
            })
            .map((contato: any) => ({
              id: contato.id,
              nome: contato.nome,
              celular: contato.celular,
              telefone: contato.telefone,
              email: contato.email,
              tipoContato: contato.tipoContato,
              imagem: contato.imagem,
            })) || [];
          setContatos(contatosList);
        }
      } catch (error) {
        console.error("Erro ao carregar contatos:", error);
      } finally {
        setIsLoadingContatos(false);
      }
    };

    fetchContatos();
  }, [isOpen, anuncianteAlvoId, user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!titulo.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    if (!dataInicio) {
      toast.error("Data de início é obrigatória");
      return;
    }

    if (!dataFim) {
      toast.error("Data de fim é obrigatória");
      return;
    }

    // Create DateTime strings with time
    const dataInícioCompleta = new Date(`${dataInicio}T${horaInicio}`);
    const dataFimCompleta = new Date(`${dataFim}T${horaFim}`);

    if (dataInícioCompleta >= dataFimCompleta) {
      toast.error("Data/hora de fim deve ser posterior à de início");
      return;
    }

    setIsLoading(true);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (user?.id) {
        headers["x-user-id"] = user.id.toString();
      }

      const response = await fetch("/api/filas-espera", {
        method: "POST",
        headers,
        body: JSON.stringify({
          eventoId: 0,
          anuncianteAlvoId,
          titulo: titulo.trim(),
          descricao: descricao.trim() || null,
          dataInicio: dataInícioCompleta.toISOString(),
          dataFim: dataFimCompleta.toISOString(),
          privacidade: privacidade,
          contatosPermitidos: privacidade === "privado_usuarios" ? contatosPermitidos : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao criar fila de espera");
      }

      toast.success("Fila de espera criada com sucesso! Aguardando aprovação.");
      setTitulo("");
      setDescricao("");
      setDataInicio("");
      setDataFim("");
      setHoraInicio("10:00");
      setHoraFim("11:00");
      onClose();
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao criar fila de espera"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setTitulo("");
      setDescricao("");
      setDataInicio("");
      setDataFim("");
      setHoraInicio("10:00");
      setHoraFim("11:00");
      setPrivacidade("privado");
      setContatosPermitidos([]);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-vitrii-text">
              Fila de Espera
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {anuncianteAlvoNome}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-vitrii-text mb-2">
              Título do Evento <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              disabled={isLoading}
              placeholder="Ex: Aula de Yoga, Consulta Médica, etc"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue disabled:bg-gray-100"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-vitrii-text mb-2">
              Descrição (opcional)
            </label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              disabled={isLoading}
              placeholder="Descreva o que você gostaria de fazer..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue disabled:bg-gray-100 resize-none"
              rows={3}
            />
          </div>

          {/* Data de Início */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-vitrii-text mb-2">
                Data de Início <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-vitrii-text mb-2">
                Hora <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue disabled:bg-gray-100"
              />
            </div>
          </div>

          {/* Data de Fim */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-vitrii-text mb-2">
                Data de Fim <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-vitrii-text mb-2">
                Hora <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={horaFim}
                onChange={(e) => setHoraFim(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue disabled:bg-gray-100"
              />
            </div>
          </div>

          {/* Privacidade */}
          <div>
            <label className="block text-sm font-semibold text-vitrii-text mb-2">
              Privacidade
            </label>
            <div className="space-y-2">
              {PRIVACIDADES.map((priv) => (
                <label
                  key={priv.value}
                  className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setPrivacidade(priv.value)}
                >
                  <input
                    type="radio"
                    name="privacidade"
                    value={priv.value}
                    checked={privacidade === priv.value}
                    onChange={() => setPrivacidade(priv.value)}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-semibold text-vitrii-text">
                      {priv.label}
                    </div>
                    <div className="text-xs text-gray-600">{priv.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Permissões - Restrita */}
          {privacidade === "privado_usuarios" && (
            <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 space-y-3">
              <div>
                <label className="block text-sm font-semibold text-vitrii-text mb-2">
                  Quem pode visualizar esta fila de espera?
                </label>
                <p className="text-xs text-gray-600 mb-3">
                  Selecione os contatos que poderão visualizar as informações completas desta fila
                </p>
              </div>

              {isLoadingContatos ? (
                <p className="text-sm text-gray-600">Carregando contatos...</p>
              ) : contatos.length === 0 ? (
                <p className="text-sm text-gray-600 italic">
                  Nenhum contato cadastrado para este anunciante. <a href="/cadastro-contatos" className="text-vitrii-blue hover:underline">Cadastre contatos</a>.
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {contatos.map((contato) => (
                    <label
                      key={contato.id}
                      className="flex items-center gap-2 p-2 rounded hover:bg-blue-100 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={contatosPermitidos.includes(contato.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setContatosPermitidos([
                              ...contatosPermitidos,
                              contato.id,
                            ]);
                          } else {
                            setContatosPermitidos(
                              contatosPermitidos.filter(
                                (id) => id !== contato.id,
                              ),
                            );
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <div className="text-sm flex-1">
                        <div className="font-medium text-vitrii-text">{contato.nome}</div>
                        <div className="text-xs text-gray-600">
                          {contato.tipoContato}
                          {contato.email && ` • ${contato.email}`}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {contatosPermitidos.length > 0 && (
                <div className="text-xs text-blue-700 bg-white rounded p-2">
                  <strong>{contatosPermitidos.length}</strong> contato(s) selecionado(s)
                </div>
              )}
            </div>
          )}

          {/* Info message */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> Sua solicitação será enviada para a fila de espera. O responsável pela agenda irá analisar e aprovar ou sugerir um novo horário.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 text-vitrii-text rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-vitrii-blue text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 font-medium"
            >
              {isLoading ? "Criando..." : "Enviar Solicitação"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
