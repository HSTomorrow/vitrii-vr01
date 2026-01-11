import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Users,
  Lock,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Shield,
  AlertCircle,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Key,
} from "lucide-react";
import { useState } from "react";
import AdminEditUserModal from "@/components/AdminEditUserModal";

interface Usuario {
  id: number;
  nome: string;
  email: string;
  cpf?: string;
  telefone?: string;
  whatsapp?: string;
  linkedin?: string;
  facebook?: string;
  tipoUsuario: string;
  dataCriacao: string;
  dataVigenciaContrato: string;
  numeroAnunciosAtivos: number;
  endereco?: string;
}

interface Funcionalidade {
  id: number;
  chave: string;
  nome: string;
  descricao?: string;
  categoria: string;
  isActive: boolean;
}

interface UsuarioXFuncionalidade {
  id: number;
  usuario: Usuario;
  funcionalidade: Funcionalidade;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"usuarios" | "funcionalidades">(
    "usuarios",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsuario, setSelectedUsuario] = useState<number | null>(null);
  const [expandedUser, setExpandedUser] = useState<number | null>(null);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);

  // Fetch all users
  const { data: usuariosData, isLoading: usuariosLoading } = useQuery({
    queryKey: ["usuarios"],
    queryFn: async () => {
      const response = await fetch("/api/usracessos");
      if (!response.ok) throw new Error("Erro ao buscar usuários");
      return response.json();
    },
  });

  // Fetch all funcionalidades
  const { data: funcionalidadesData, isLoading: funcLoading } = useQuery({
    queryKey: ["funcionalidades"],
    queryFn: async () => {
      const response = await fetch("/api/funcionalidades");
      if (!response.ok) throw new Error("Erro ao buscar funcionalidades");
      return response.json();
    },
  });

  // Fetch user funcionalidades
  const { data: usuarioFuncData } = useQuery({
    queryKey: ["usuario-funcionalidades", selectedUsuario],
    queryFn: async () => {
      if (!selectedUsuario) return null;
      const response = await fetch(
        `/api/usracessos/${selectedUsuario}/funcionalidades`,
      );
      if (!response.ok)
        throw new Error("Erro ao buscar funcionalidades do usuário");
      return response.json();
    },
    enabled: !!selectedUsuario,
  });

  // Mutation to grant funcionalidade
  const grantFuncionalidadeMutation = useMutation({
    mutationFn: async ({
      usuarioId,
      funcionalidadeId,
    }: {
      usuarioId: number;
      funcionalidadeId: number;
    }) => {
      const response = await fetch(
        `/api/usracessos/${usuarioId}/funcionalidades/grant`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ usuarioId, funcionalidadeId }),
        },
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao conceder funcionalidade");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Funcionalidade concedida com sucesso");
      if (selectedUsuario) {
        queryClient.invalidateQueries({
          queryKey: ["usuario-funcionalidades", selectedUsuario],
        });
      }
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao conceder funcionalidade",
      );
    },
  });

  // Mutation to revoke funcionalidade
  const revokeFuncionalidadeMutation = useMutation({
    mutationFn: async ({
      usuarioId,
      funcionalidadeId,
    }: {
      usuarioId: number;
      funcionalidadeId: number;
    }) => {
      const response = await fetch(
        `/api/usracessos/${usuarioId}/funcionalidades/${funcionalidadeId}`,
        {
          method: "DELETE",
        },
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao revogar funcionalidade");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Funcionalidade revogada com sucesso");
      if (selectedUsuario) {
        queryClient.invalidateQueries({
          queryKey: ["usuario-funcionalidades", selectedUsuario],
        });
      }
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao revogar funcionalidade",
      );
    },
  });

  // Mutation to grant all funcionalidades
  const grantAllFuncionalidadesMutation = useMutation({
    mutationFn: async (usuarioId: number) => {
      const response = await fetch(
        `/api/usracessos/${usuarioId}/funcionalidades/grant-all`,
        {
          method: "POST",
        },
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao conceder funcionalidades");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Todas as funcionalidades concedidas");
      if (selectedUsuario) {
        queryClient.invalidateQueries({
          queryKey: ["usuario-funcionalidades", selectedUsuario],
        });
      }
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao conceder funcionalidades",
      );
    },
  });

  // Mutation to revoke all funcionalidades
  const revokeAllFuncionalidadesMutation = useMutation({
    mutationFn: async (usuarioId: number) => {
      const response = await fetch(
        `/api/usracessos/${usuarioId}/funcionalidades/revoke-all`,
        {
          method: "POST",
        },
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao revogar funcionalidades");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Todas as funcionalidades revogadas");
      if (selectedUsuario) {
        queryClient.invalidateQueries({
          queryKey: ["usuario-funcionalidades", selectedUsuario],
        });
      }
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao revogar funcionalidades",
      );
    },
  });

  const usuarios = usuariosData?.data || [];
  const funcionalidades = funcionalidadesData?.data || [];
  const usuarioFunc = usuarioFuncData?.data;

  const filteredUsuarios = usuarios.filter(
    (u: Usuario) =>
      u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const categoriasMap = new Map<string, Funcionalidade[]>();
  (usuarioFunc?.funcionalidades || []).forEach((f: Funcionalidade) => {
    if (!categoriasMap.has(f.categoria)) {
      categoriasMap.set(f.categoria, []);
    }
    categoriasMap.get(f.categoria)?.push(f);
  });

  return (
    <div className="min-h-screen bg-walmart-bg flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-walmart-blue" />
            <h1 className="text-3xl font-bold text-walmart-text">
              Painel de Administrador
            </h1>
          </div>
          <p className="text-walmart-text-secondary">
            Gerencie usuários e suas permissões de acesso no sistema
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => navigate("/admin/usuarios")}
            className="bg-blue-50 border border-blue-200 rounded-lg p-6 hover:shadow-lg transition-shadow text-left group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <Key className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-walmart-text">
                Gerenciar Senhas
              </h3>
            </div>
            <p className="text-sm text-walmart-text-secondary">
              Visualize e resete as senhas dos usuários
            </p>
          </button>

          <button
            onClick={() => navigate("/admin/anuncios")}
            className="bg-green-50 border border-green-200 rounded-lg p-6 hover:shadow-lg transition-shadow text-left group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <AlertCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-walmart-text">
                Gerenciar Anúncios
              </h3>
            </div>
            <p className="text-sm text-walmart-text-secondary">
              Modere e controle anúncios do sistema
            </p>
          </button>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-walmart-text">
                Total de Usuários
              </h3>
            </div>
            <p className="text-2xl font-bold text-walmart-blue">
              {usuariosData?.count || 0}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => {
              setActiveTab("usuarios");
              setSelectedUsuario(null);
              setExpandedUser(null);
            }}
            className={`px-6 py-3 font-semibold border-b-2 transition ${
              activeTab === "usuarios"
                ? "text-walmart-blue border-walmart-blue"
                : "text-walmart-text-secondary border-transparent hover:text-walmart-text"
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Usuários
            </div>
          </button>
          <button
            onClick={() => setActiveTab("funcionalidades")}
            className={`px-6 py-3 font-semibold border-b-2 transition ${
              activeTab === "funcionalidades"
                ? "text-walmart-blue border-walmart-blue"
                : "text-walmart-text-secondary border-transparent hover:text-walmart-text"
            }`}
          >
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Funcionalidades
            </div>
          </button>
        </div>

        {/* Usuarios Tab */}
        {activeTab === "usuarios" && (
          <div className="space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-walmart-text-secondary" />
              <input
                type="text"
                placeholder="Buscar usuário por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-walmart-blue"
              />
            </div>

            {usuariosLoading ? (
              <div className="text-center py-8">
                <p className="text-walmart-text-secondary">
                  Carregando usuários...
                </p>
              </div>
            ) : filteredUsuarios.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-walmart-text-secondary mx-auto mb-2" />
                <p className="text-walmart-text-secondary">
                  Nenhum usuário encontrado
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredUsuarios.map((usuario: Usuario) => (
                  <div
                    key={usuario.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 transition hover:shadow-md"
                  >
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() =>
                        setExpandedUser(
                          expandedUser === usuario.id ? null : usuario.id,
                        )
                      }
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 bg-walmart-blue rounded-full flex items-center justify-center text-white font-bold">
                          {usuario.nome.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-walmart-text">
                            {usuario.nome}
                          </h3>
                          <p className="text-sm text-walmart-text-secondary">
                            {usuario.email}
                          </p>
                        </div>
                        <div className="ml-auto">
                          {usuario.tipoUsuario === "adm" ? (
                            <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 rounded-full">
                              <Shield className="w-4 h-4 text-yellow-700" />
                              <span className="text-sm font-semibold text-yellow-700">
                                ADM
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 rounded-full">
                              <Users className="w-4 h-4 text-blue-700" />
                              <span className="text-sm font-semibold text-blue-700">
                                Comum
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      {expandedUser === usuario.id ? (
                        <ChevronUp className="w-5 h-5 text-walmart-text-secondary" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-walmart-text-secondary" />
                      )}
                    </div>

                    {/* Expanded User Details */}
                    {expandedUser === usuario.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                        {usuario.tipoUsuario === "adm" ? (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <AlertCircle className="w-5 h-5 text-yellow-700 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-semibold text-yellow-900">
                                  Usuário Administrador
                                </p>
                                <p className="text-sm text-yellow-800 mt-1">
                                  Este usuário tem acesso automático a todas as
                                  funcionalidades do sistema.
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingUser(usuario)}
                                className="flex-1 px-3 py-2 bg-walmart-green text-white rounded-lg hover:bg-walmart-green-dark transition flex items-center justify-center gap-2"
                              >
                                <Edit2 className="w-4 h-4" />
                                Editar
                              </button>
                              <button
                                onClick={() => setSelectedUsuario(usuario.id)}
                                className="flex-1 px-3 py-2 bg-walmart-blue text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                              >
                                <Lock className="w-4 h-4" />
                                Gerenciar Permissões
                              </button>
                            </div>

                            {selectedUsuario === usuario.id && usuarioFunc && (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-semibold text-walmart-text">
                                    Permissões do Usuário
                                  </h4>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() =>
                                        grantAllFuncionalidadesMutation.mutate(
                                          usuario.id,
                                        )
                                      }
                                      disabled={
                                        grantAllFuncionalidadesMutation.isPending ||
                                        usuarioFunc.funcionalidades?.length ===
                                          funcionalidades.length
                                      }
                                      className="text-sm px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition disabled:opacity-50"
                                    >
                                      Conceder Tudo
                                    </button>
                                    <button
                                      onClick={() =>
                                        revokeAllFuncionalidadesMutation.mutate(
                                          usuario.id,
                                        )
                                      }
                                      disabled={
                                        revokeAllFuncionalidadesMutation.isPending ||
                                        usuarioFunc.funcionalidades?.length ===
                                          0
                                      }
                                      className="text-sm px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition disabled:opacity-50"
                                    >
                                      Revogar Tudo
                                    </button>
                                  </div>
                                </div>

                                {usuarioFunc.funcionalidades?.length === 0 ? (
                                  <p className="text-sm text-walmart-text-secondary italic">
                                    Nenhuma permissão concedida
                                  </p>
                                ) : (
                                  <div className="grid grid-cols-1 gap-2">
                                    {Array.from(categoriasMap).map(
                                      ([categoria, funcs]) => (
                                        <div
                                          key={categoria}
                                          className="space-y-2"
                                        >
                                          <h5 className="text-sm font-semibold text-walmart-text-secondary capitalize">
                                            {categoria === "users"
                                              ? "Usuários"
                                              : categoria === "ads"
                                                ? "Anúncios"
                                                : categoria === "stores"
                                                  ? "Lojas"
                                                  : categoria === "chat"
                                                    ? "Chat"
                                                    : categoria === "payments"
                                                      ? "Pagamentos"
                                                      : "Relatórios"}
                                          </h5>
                                          <div className="grid grid-cols-1 gap-1 ml-2">
                                            {funcs.map(
                                              (func: Funcionalidade) => (
                                                <div
                                                  key={func.id}
                                                  className="flex items-center justify-between bg-white p-2 rounded border border-gray-200"
                                                >
                                                  <div>
                                                    <p className="text-sm font-medium text-walmart-text">
                                                      {func.nome}
                                                    </p>
                                                  </div>
                                                  <button
                                                    onClick={() =>
                                                      revokeFuncionalidadeMutation.mutate(
                                                        {
                                                          usuarioId: usuario.id,
                                                          funcionalidadeId:
                                                            func.id,
                                                        },
                                                      )
                                                    }
                                                    disabled={
                                                      revokeFuncionalidadeMutation.isPending
                                                    }
                                                    className="text-red-600 hover:text-red-800 transition disabled:opacity-50"
                                                  >
                                                    <XCircle className="w-4 h-4" />
                                                  </button>
                                                </div>
                                              ),
                                            )}
                                          </div>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                )}

                                {/* Available funcionalidades to grant */}
                                <div className="border-t border-blue-200 pt-3 mt-3">
                                  <h5 className="text-sm font-semibold text-walmart-text mb-2">
                                    Adicionar Permissões
                                  </h5>
                                  <div className="grid grid-cols-1 gap-2">
                                    {funcionalidades
                                      .filter(
                                        (f: Funcionalidade) =>
                                          !usuarioFunc.funcionalidades?.some(
                                            (uf: Funcionalidade) =>
                                              uf.id === f.id,
                                          ),
                                      )
                                      .map((func: Funcionalidade) => (
                                        <div
                                          key={func.id}
                                          className="flex items-center justify-between bg-white p-2 rounded border border-gray-200"
                                        >
                                          <div>
                                            <p className="text-sm font-medium text-walmart-text">
                                              {func.nome}
                                            </p>
                                          </div>
                                          <button
                                            onClick={() =>
                                              grantFuncionalidadeMutation.mutate(
                                                {
                                                  usuarioId: usuario.id,
                                                  funcionalidadeId: func.id,
                                                },
                                              )
                                            }
                                            disabled={
                                              grantFuncionalidadeMutation.isPending
                                            }
                                            className="text-green-600 hover:text-green-800 transition disabled:opacity-50"
                                          >
                                            <CheckCircle2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Funcionalidades Tab */}
        {activeTab === "funcionalidades" && (
          <div className="space-y-6">
            {funcLoading ? (
              <div className="text-center py-8">
                <p className="text-walmart-text-secondary">
                  Carregando funcionalidades...
                </p>
              </div>
            ) : funcionalidades.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-walmart-text-secondary mx-auto mb-2" />
                <p className="text-walmart-text-secondary">
                  Nenhuma funcionalidade encontrada
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {Array.from(
                  new Map(
                    funcionalidades.map((f: Funcionalidade) => [
                      f.categoria,
                      funcionalidades.filter(
                        (func: Funcionalidade) =>
                          func.categoria === f.categoria,
                      ),
                    ]),
                  ),
                ).map(([categoria, funcs]) => (
                  <div key={categoria} className="space-y-3">
                    <h3 className="text-lg font-semibold text-walmart-text capitalize">
                      {categoria === "users"
                        ? "Gestão de Usuários"
                        : categoria === "ads"
                          ? "Gestão de Anúncios"
                          : categoria === "stores"
                            ? "Gestão de Lojas"
                            : categoria === "chat"
                              ? "Gestão de Chat"
                              : categoria === "payments"
                                ? "Gestão de Pagamentos"
                                : "Relatórios"}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {funcs.map((func: Funcionalidade) => (
                        <div
                          key={func.id}
                          className="bg-white border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-walmart-text">
                                {func.nome}
                              </h4>
                              <p className="text-xs text-walmart-text-secondary font-mono">
                                {func.chave}
                              </p>
                            </div>
                            {func.isActive ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            ) : (
                              <XCircle className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          {func.descricao && (
                            <p className="text-sm text-walmart-text-secondary">
                              {func.descricao}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Edit User Modal */}
        {editingUser && (
          <AdminEditUserModal
            usuario={editingUser}
            onClose={() => setEditingUser(null)}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
