import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function DebugAnunciantes() {
  const { user } = useAuth();
  const [usuarioId, setUsuarioId] = useState(user?.id?.toString() || "");
  const [anuncianteId, setAnuncianteId] = useState("");
  const [papel, setPapel] = useState("gerente");
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckDebugInfo = async () => {
    if (!usuarioId) {
      toast.error("Por favor, forneça um usuarioId");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/debug/anunciantes/${usuarioId}`
      );
      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Erro ao buscar informações");
        return;
      }

      const data = await response.json();
      setDebugInfo(data);
      toast.success("Informações carregadas com sucesso!");
    } catch (error) {
      console.error("Erro ao buscar debug info:", error);
      toast.error("Erro ao buscar informações de debug");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLinkage = async () => {
    if (!usuarioId || !anuncianteId) {
      toast.error("Por favor, forneça usuarioId e anuncianteId");
      return;
    }

    if (!window.confirm(
      `Tem certeza que deseja linkar o usuário ${usuarioId} ao anunciante ${anuncianteId}?`
    )) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        "/api/debug/link-user-to-anunciante",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            usuarioId: parseInt(usuarioId),
            anuncianteId: parseInt(anuncianteId),
            papel,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Erro ao criar linkage");
        return;
      }

      const data = await response.json();
      toast.success(data.message || "Linkage criado com sucesso!");
      
      // Reload debug info
      await handleCheckDebugInfo();
    } catch (error) {
      console.error("Erro ao criar linkage:", error);
      toast.error("Erro ao criar linkage");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-vitrii-text mb-2">
            Debug: Anunciantes e Linkages
          </h1>
          <p className="text-gray-600">
            Esta página é para debugging de relacionamentos entre usuários e anunciantes.
          </p>
        </div>

        {/* Debug Info Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-vitrii-text mb-4">
            Verificar Informações de Debug
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-vitrii-text mb-2">
                ID do Usuário
              </label>
              <input
                type="number"
                value={usuarioId}
                onChange={(e) => setUsuarioId(e.target.value)}
                placeholder="Ex: 6"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-vitrii-blue focus:ring-2 focus:ring-vitrii-blue focus:ring-opacity-50"
              />
            </div>

            <button
              onClick={handleCheckDebugInfo}
              disabled={isLoading || !usuarioId}
              className="px-6 py-2 bg-vitrii-blue text-white rounded-lg hover:bg-vitrii-blue-dark transition-colors font-semibold disabled:opacity-50"
            >
              {isLoading ? "Carregando..." : "Verificar Informações"}
            </button>
          </div>

          {debugInfo && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-bold text-vitrii-text mb-4">Usuário:</h3>
              <pre className="bg-white p-3 rounded border border-gray-200 text-xs overflow-auto mb-4">
                {JSON.stringify(debugInfo.debug.usuario, null, 2)}
              </pre>

              <h3 className="font-bold text-vitrii-text mb-2">
                Relacionamentos (usuarios_anunciantes):
              </h3>
              {debugInfo.debug.usuario_anunciante_links.count === 0 ? (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800">
                  ❌ Nenhum relacionamento encontrado! O usuário não está linkado a nenhum anunciante.
                </div>
              ) : (
                <pre className="bg-white p-3 rounded border border-gray-200 text-xs overflow-auto mb-4">
                  {JSON.stringify(
                    debugInfo.debug.usuario_anunciante_links.data,
                    null,
                    2
                  )}
                </pre>
              )}

              <h3 className="font-bold text-vitrii-text mb-2">
                Anunciantes (da query):
              </h3>
              {debugInfo.debug.anunciantes_from_query.count === 0 ? (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800">
                  ❌ Nenhum anunciante retornado pela query!
                </div>
              ) : (
                <pre className="bg-white p-3 rounded border border-gray-200 text-xs overflow-auto">
                  {JSON.stringify(
                    debugInfo.debug.anunciantes_from_query.data,
                    null,
                    2
                  )}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Create Linkage Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-vitrii-text mb-4">
            Criar Linkage Manualmente
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-vitrii-text mb-2">
                ID do Usuário
              </label>
              <input
                type="number"
                value={usuarioId}
                onChange={(e) => setUsuarioId(e.target.value)}
                placeholder="Ex: 6"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-vitrii-blue focus:ring-2 focus:ring-vitrii-blue focus:ring-opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-vitrii-text mb-2">
                ID do Anunciante
              </label>
              <input
                type="number"
                value={anuncianteId}
                onChange={(e) => setAnuncianteId(e.target.value)}
                placeholder="Ex: 4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-vitrii-blue focus:ring-2 focus:ring-vitrii-blue focus:ring-opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-vitrii-text mb-2">
                Papel
              </label>
              <select
                value={papel}
                onChange={(e) => setPapel(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-vitrii-blue focus:ring-2 focus:ring-vitrii-blue focus:ring-opacity-50 bg-white"
              >
                <option value="gerente">Gerente</option>
                <option value="vendedor">Vendedor</option>
                <option value="operador">Operador</option>
              </select>
            </div>

            <button
              onClick={handleCreateLinkage}
              disabled={isLoading || !usuarioId || !anuncianteId}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50"
            >
              {isLoading ? "Criando..." : "Criar Linkage"}
            </button>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              ⚠️ <strong>Aviso:</strong> Esta é uma página de debugging. Use com cuidado.
              Certifique-se de que o usuário e o anunciante existem antes de criar linkages.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
