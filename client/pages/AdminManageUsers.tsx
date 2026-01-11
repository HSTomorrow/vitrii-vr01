import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  Search,
  Copy,
  Check,
  AlertCircle,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import Pagination from "@/components/Pagination";

interface Usuario {
  id: number;
  nome: string;
  email: string;
  cpf?: string;
  telefone?: string;
  tipoUsuario: string;
  dataCriacao: string;
  senha: string; // Hashed password (for display)
}

export default function AdminManageUsers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showPasswords, setShowPasswords] = useState<Set<number>>(new Set());
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [resetPasswordModal, setResetPasswordModal] = useState<{
    usuarioId: number;
    nome: string;
  } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const itemsPerPage = 20;

  // Check if user is admin
  if (!user || user.tipoUsuario !== "adm") {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Acesso Negado
            </h1>
            <p className="text-gray-600">
              Apenas administradores podem acessar esta página.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Fetch users with passwords
  const { data: usuariosData, isLoading: usuariosLoading } = useQuery({
    queryKey: ["usuarios-com-senha"],
    queryFn: async () => {
      const response = await fetch("/api/admin/usuarios-com-senha");
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Acesso negado. Apenas administradores podem acessar.");
        }
        throw new Error("Erro ao buscar usuários");
      }
      return response.json();
    },
  });

  // Mutation to reset password
  const resetPasswordMutation = useMutation({
    mutationFn: async ({
      usuarioId,
      novaSenha,
    }: {
      usuarioId: number;
      novaSenha: string;
    }) => {
      const response = await fetch(
        `/api/admin/usuarios/${usuarioId}/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ usuarioId, novaSenha }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao resetar senha");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast.success(data.message);
      setResetPasswordModal(null);
      setNewPassword("");
      setConfirmPassword("");
      queryClient.invalidateQueries({ queryKey: ["usuarios-com-senha"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const usuarios = usuariosData?.data || [];

  const filteredUsuarios = usuarios.filter(
    (u: Usuario) =>
      u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Reset to page 1 when search changes
  if (currentPage > 1 && filteredUsuarios.length < (currentPage - 1) * itemsPerPage) {
    setCurrentPage(1);
  }

  // Calculate pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsuarios = filteredUsuarios.slice(startIndex, endIndex);

  const togglePasswordVisibility = (usuarioId: number) => {
    setShowPasswords((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(usuarioId)) {
        newSet.delete(usuarioId);
      } else {
        newSet.add(usuarioId);
      }
      return newSet;
    });
  };

  const copyToClipboard = (text: string, usuarioId: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(usuarioId);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Copiado para clipboard!");
  };

  const handleResetPassword = () => {
    if (!resetPasswordModal) return;

    if (!newPassword || !confirmPassword) {
      toast.error("Preencha todos os campos");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("As senhas não conferem");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Senha deve ter no mínimo 6 caracteres");
      return;
    }

    resetPasswordMutation.mutate({
      usuarioId: resetPasswordModal.usuarioId,
      novaSenha: newPassword,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1 py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Lock className="w-8 h-8 text-walmart-blue" />
              <h1 className="text-3xl font-bold text-walmart-text">
                Gerenciar Senhas de Usuários
              </h1>
            </div>
            <p className="text-walmart-text-secondary">
              Visualize e resete as senhas dos usuários do sistema
            </p>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to page 1 when searching
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-walmart-blue"
              />
            </div>
          </div>

          {/* Pagination Info */}
          {!usuariosLoading && filteredUsuarios.length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <span className="font-semibold">
                  {startIndex + 1}-{Math.min(endIndex, filteredUsuarios.length)}
                </span> de <span className="font-semibold">{filteredUsuarios.length}</span> usuário(s)
              </p>
            </div>
          )}

          {/* Users Table */}
          {usuariosLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-walmart-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-walmart-text-secondary">
                  Carregando usuários...
                </p>
              </div>
            </div>
          ) : filteredUsuarios.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-walmart-text">
                      Nome
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-walmart-text">
                      Email
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-walmart-text">
                      Senha
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-walmart-text">
                      Tipo
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-walmart-text">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsuarios.map((usuario: Usuario) => (
                    <tr
                      key={usuario.id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-4 text-walmart-text font-medium">
                        {usuario.nome}
                      </td>
                      <td className="py-4 px-4 text-walmart-text-secondary text-sm">
                        {usuario.email}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <code className="bg-gray-100 px-3 py-1 rounded text-xs font-mono text-gray-700 max-w-xs truncate">
                            {showPasswords.has(usuario.id)
                              ? usuario.senha
                              : "••••••••"}
                          </code>
                          <button
                            onClick={() =>
                              togglePasswordVisibility(usuario.id)
                            }
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title={
                              showPasswords.has(usuario.id)
                                ? "Ocultar"
                                : "Mostrar"
                            }
                          >
                            {showPasswords.has(usuario.id) ? (
                              <EyeOff className="w-4 h-4 text-gray-600" />
                            ) : (
                              <Eye className="w-4 h-4 text-gray-600" />
                            )}
                          </button>
                          <button
                            onClick={() =>
                              copyToClipboard(usuario.senha, usuario.id)
                            }
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title="Copiar"
                          >
                            {copiedId === usuario.id ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-600" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            usuario.tipoUsuario === "adm"
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {usuario.tipoUsuario === "adm"
                            ? "Administrador"
                            : "Comum"}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() =>
                            setResetPasswordModal({
                              usuarioId: usuario.id,
                              nome: usuario.nome,
                            })
                          }
                          className="inline-flex items-center gap-2 px-3 py-1 bg-walmart-blue text-white rounded-lg hover:bg-walmart-blue-dark transition-colors text-sm font-medium"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Resetar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination
                currentPage={currentPage}
                totalItems={filteredUsuarios.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-walmart-text-secondary">
                Nenhum usuário encontrado
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Reset Password Modal */}
      {resetPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-walmart-text mb-2">
              Resetar Senha
            </h2>
            <p className="text-walmart-text-secondary mb-6">
              Resetar senha para{" "}
              <strong className="text-walmart-text">{resetPasswordModal.nome}</strong>
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-walmart-text mb-2">
                  Nova Senha
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite a nova senha"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-walmart-blue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-walmart-text mb-2">
                  Confirmar Senha
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirme a nova senha"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-walmart-blue"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setResetPasswordModal(null);
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-walmart-text rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleResetPassword}
                disabled={resetPasswordMutation.isPending}
                className="flex-1 px-4 py-2 bg-walmart-blue text-white rounded-lg hover:bg-walmart-blue-dark transition-colors font-medium disabled:opacity-50"
              >
                {resetPasswordMutation.isPending ? "Resetando..." : "Resetar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
