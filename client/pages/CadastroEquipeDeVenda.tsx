import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Plus, Trash2, Edit2, Users, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Usuario {
  id: number;
  nome: string;
  email: string;
}

interface MembroEquipe {
  id: number;
  usuario: Usuario;
}

interface EquipeDeVenda {
  id: number;
  nome: string;
  descricao?: string;
  anuncianteId: number;
  anunciante: { id: number; nome: string };
  membros: MembroEquipe[];
}

interface Anunciante {
  id: number;
  nome: string;
}

export default function CadastroEquipeDeVenda() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedAnuncianteId, setSelectedAnuncianteId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [expandedTeamId, setExpandedTeamId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
  });
  const [newMemberId, setNewMemberId] = useState(0);

  // Fetch anunciantes (filtered by current user, or all if admin)
  const { data: anunciantesData } = useQuery({
    queryKey: ["anunciantes", user?.id],
    queryFn: async () => {
      const headers: Record<string, string> = {};
      if (user?.id) {
        headers["X-User-Id"] = user.id.toString();
      }

      const response = await fetch("/api/anunciantes/do-usuario/listar", {
        headers,
      });
      if (!response.ok) throw new Error("Erro ao buscar anunciantes");
      return response.json();
    },
    enabled: !!user,
  });

  // Fetch equipes
  const { data: equipesData, refetch: refetchEquipes } = useQuery({
    queryKey: ["equipes-venda", selectedAnuncianteId],
    queryFn: async () => {
      const url = selectedAnuncianteId
        ? `/api/equipes-venda?anuncianteId=${selectedAnuncianteId}`
        : "/api/equipes-venda";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Erro ao buscar equipes");
      return response.json();
    },
    enabled: !!user && selectedAnuncianteId !== null,
  });

  // Fetch available users for a team
  const { data: usuariosDisponiveisData } = useQuery({
    queryKey: ["usuarios-disponiveis", expandedTeamId],
    queryFn: async () => {
      const response = await fetch(
        `/api/equipes-venda/${expandedTeamId}/usuarios-disponiveis`
      );
      if (!response.ok) throw new Error("Erro ao buscar usuários");
      return response.json();
    },
    enabled: !!expandedTeamId,
  });

  // Create/update equipe mutation
  const saveEquipeMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const url = editingId
        ? `/api/equipes-venda/${editingId}`
        : "/api/equipes-venda";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          anuncianteId: selectedAnuncianteId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao salvar equipe");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success(
        editingId ? "Equipe atualizada com sucesso!" : "Equipe criada com sucesso!"
      );
      setFormData({ nome: "", descricao: "" });
      setEditingId(null);
      setIsFormOpen(false);
      refetchEquipes();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar equipe");
    },
  });

  // Delete equipe mutation
  const deleteEquipeMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/equipes-venda/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Erro ao deletar equipe");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Equipe deletada com sucesso!");
      refetchEquipes();
      setExpandedTeamId(null);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao deletar equipe");
    },
  });

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: async ({
      teamId,
      userId,
    }: {
      teamId: number;
      userId: number;
    }) => {
      const response = await fetch(`/api/equipes-venda/${teamId}/membros`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuarioId: userId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao adicionar membro");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Membro adicionado com sucesso!");
      setNewMemberId(0);
      refetchEquipes();
      queryClient.invalidateQueries({
        queryKey: ["usuarios-disponiveis"],
      });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao adicionar membro");
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async ({
      teamId,
      memberId,
    }: {
      teamId: number;
      memberId: number;
    }) => {
      const response = await fetch(`/api/equipes-venda/${teamId}/membros/${memberId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Erro ao remover membro");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Membro removido com sucesso!");
      refetchEquipes();
      queryClient.invalidateQueries({
        queryKey: ["usuarios-disponiveis"],
      });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao remover membro");
    },
  });

  const handleEdit = (equipe: EquipeDeVenda) => {
    setFormData({
      nome: equipe.nome,
      descricao: equipe.descricao || "",
    });
    setEditingId(equipe.id);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome) {
      toast.error("Nome da equipe é obrigatório");
      return;
    }
    saveEquipeMutation.mutate(formData);
  };

  const anunciantes = anunciantesData?.data || [];
  const equipes = equipesData?.data || [];
  const usuariosDisponiveis = usuariosDisponiveisData?.data || [];

  // Set first anunciante as default
  const defaultAnuncianteId = useMemo(() => {
    if (anunciantes.length > 0 && selectedAnuncianteId === null) {
      return anunciantes[0].id;
    }
    return selectedAnuncianteId;
  }, [anunciantes, selectedAnuncianteId]);

  if (anunciantes.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <p className="text-yellow-800">
              Você precisa cadastrar um anunciante antes de criar equipes de venda.
            </p>
            <button
              onClick={() => window.location.href = "/cadastros/anunciantes"}
              className="mt-4 px-4 py-2 bg-walmart-yellow text-walmart-text rounded-lg hover:bg-walmart-yellow-dark transition-colors font-semibold"
            >
              Ir para Cadastro de Anunciantes
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-walmart-blue" />
            <h1 className="text-3xl font-bold text-walmart-text">
              Equipes de Venda
            </h1>
          </div>
          <p className="text-walmart-text-secondary mt-2">
            Organize seus usuários em equipes de vendas por loja
          </p>
        </div>

        {/* Anunciante Selector */}
        {anunciantes.length > 1 && (
          <div className="mb-8">
            <label className="block text-sm font-semibold text-walmart-text mb-3">
              Filtrar por Anunciante
            </label>
            <div className="flex flex-wrap gap-2">
              {anunciantes.map((anunciante: Anunciante) => (
                <button
                  key={anunciante.id}
                  onClick={() => setSelectedAnuncianteId(anunciante.id)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    (selectedAnuncianteId || defaultAnuncianteId) === anunciante.id
                      ? "bg-walmart-blue text-white"
                      : "bg-white text-walmart-text border border-gray-300 hover:border-walmart-blue"
                  }`}
                >
                  {anunciante.nome}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* New Team Button */}
        <div className="mb-8">
          <button
            onClick={() => {
              setIsFormOpen(!isFormOpen);
              setEditingId(null);
              setFormData({ nome: "", descricao: "" });
            }}
            className="flex items-center gap-2 px-4 py-2 bg-walmart-yellow text-walmart-text rounded-lg hover:bg-walmart-yellow-dark transition-colors font-semibold"
          >
            <Plus className="w-5 h-5" />
            Nova Equipe
          </button>
        </div>

        {/* Form */}
        {isFormOpen && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-walmart-text mb-6">
              {editingId ? "Editar Equipe" : "Criar Nova Equipe"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-walmart-text mb-2">
                  Nome da Equipe *
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                  placeholder="Ex: Equipe A, Equipe Norte"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-walmart-blue focus:ring-2 focus:ring-walmart-blue focus:ring-opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-walmart-text mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) =>
                    setFormData({ ...formData, descricao: e.target.value })
                  }
                  placeholder="Ex: Equipe responsável pelas vendas da região norte"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-walmart-blue focus:ring-2 focus:ring-walmart-blue focus:ring-opacity-50"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={saveEquipeMutation.isPending}
                  className="px-6 py-2 bg-walmart-blue text-white rounded-lg hover:bg-walmart-blue-dark transition-colors font-semibold disabled:opacity-50"
                >
                  {saveEquipeMutation.isPending ? "Salvando..." : "Salvar"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingId(null);
                  }}
                  className="px-6 py-2 bg-gray-300 text-walmart-text rounded-lg hover:bg-gray-400 transition-colors font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Equipes List */}
        <div className="space-y-4">
          {equipes.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Nenhuma equipe cadastrada</p>
              <p className="text-gray-400 mt-2">
                Clique em "Nova Equipe" para criar sua primeira equipe
              </p>
            </div>
          ) : (
            equipes.map((equipe: EquipeDeVenda) => (
              <div
                key={equipe.id}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-walmart-text">
                        {equipe.nome}
                      </h3>
                      {equipe.descricao && (
                        <p className="text-sm text-walmart-text-secondary mt-1">
                          {equipe.descricao}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Anunciante: {equipe.anunciante.nome} • {equipe.membros.length} membro(s)
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setExpandedTeamId(
                            expandedTeamId === equipe.id ? null : equipe.id
                          )
                        }
                        className="p-2 text-walmart-blue hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        {expandedTeamId === equipe.id ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEdit(equipe)}
                        className="p-2 text-walmart-blue hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          if (
                            confirm("Tem certeza que deseja deletar esta equipe?")
                          ) {
                            deleteEquipeMutation.mutate(equipe.id);
                          }
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Members Section */}
                  {expandedTeamId === equipe.id && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="font-semibold text-walmart-text mb-4">
                        Membros da Equipe
                      </h4>

                      {/* Members List */}
                      {equipe.membros.length === 0 ? (
                        <p className="text-gray-500 text-sm mb-4">
                          Nenhum membro adicionado
                        </p>
                      ) : (
                        <div className="space-y-2 mb-6">
                          {equipe.membros.map((membro) => (
                            <div
                              key={membro.id}
                              className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                            >
                              <div>
                                <p className="font-semibold text-sm text-walmart-text">
                                  {membro.usuario.nome}
                                </p>
                                <p className="text-xs text-walmart-text-secondary">
                                  {membro.usuario.email}
                                </p>
                              </div>
                              <button
                                onClick={() => {
                                  if (
                                    confirm(
                                      "Remover este membro da equipe?"
                                    )
                                  ) {
                                    removeMemberMutation.mutate({
                                      teamId: equipe.id,
                                      memberId: membro.id,
                                    });
                                  }
                                }}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Member Section */}
                      {usuariosDisponiveis.length > 0 && (
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <label className="block text-sm font-semibold text-walmart-text mb-2">
                            Adicionar Membro
                          </label>
                          <div className="flex gap-2">
                            <select
                              value={newMemberId}
                              onChange={(e) =>
                                setNewMemberId(parseInt(e.target.value))
                              }
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-transparent"
                            >
                              <option value={0}>
                                Selecione um usuário
                              </option>
                              {usuariosDisponiveis.map((usuario: Usuario) => (
                                <option key={usuario.id} value={usuario.id}>
                                  {usuario.nome} ({usuario.email})
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => {
                                if (newMemberId > 0) {
                                  addMemberMutation.mutate({
                                    teamId: equipe.id,
                                    userId: newMemberId,
                                  });
                                }
                              }}
                              disabled={
                                newMemberId === 0 || addMemberMutation.isPending
                              }
                              className="px-4 py-2 bg-walmart-blue text-white rounded-lg hover:bg-walmart-blue-dark transition-colors font-semibold disabled:opacity-50"
                            >
                              Adicionar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
