import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Trash2,
  Edit2,
  AlertCircle,
  Eye,
  EyeOff,
  GripVertical,
  Lock,
  Upload,
  X,
} from "lucide-react";

interface Banner {
  id: number;
  titulo: string;
  descricao?: string;
  imagemUrl: string;
  link?: string;
  ordem: number;
  ativo: boolean;
  dataCriacao: string;
}

export default function AdminBanners() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    imagemUrl: "",
    link: "",
    ativo: true,
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  // Check if user is admin
  const isAdmin = user?.tipoUsuario === "adm";

  // Fetch all banners
  const { data: bannersData, isLoading } = useQuery({
    queryKey: ["admin-banners"],
    enabled: isAdmin,
    queryFn: async () => {
      const response = await fetch("/api/banners");
      if (!response.ok) throw new Error("Erro ao buscar banners");
      return response.json();
    },
  });

  const banners = bannersData?.data || [];

  // Create banner mutation
  const createBannerMutation = useMutation({
    mutationFn: async () => {
      if (!formData.titulo || !formData.imagemUrl) {
        throw new Error("Título e imagem são obrigatórios");
      }

      const response = await fetch("/api/banners", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id ? String(user.id) : "",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error);
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Banner criado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      resetForm();
      setIsCreating(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao criar");
    },
  });

  // Update banner mutation
  const updateBannerMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) throw new Error("ID inválido");

      const response = await fetch(`/api/banners/${editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id ? String(user.id) : "",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error);
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Banner atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      resetForm();
      setEditingId(null);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar");
    },
  });

  // Delete banner mutation
  const deleteBannerMutation = useMutation({
    mutationFn: async (bannerId: number) => {
      const response = await fetch(`/api/banners/${bannerId}`, {
        method: "DELETE",
        headers: {
          "x-user-id": user?.id ? String(user.id) : "",
        },
      });

      if (!response.ok) throw new Error("Erro ao deletar banner");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Banner deletado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
    },
    onError: () => {
      toast.error("Erro ao deletar banner");
    },
  });

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem válido");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo deve ser menor que 5MB");
      return;
    }

    setUploadedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
      setFormData({ ...formData, imagemUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const resetForm = () => {
    setFormData({
      titulo: "",
      descricao: "",
      imagemUrl: "",
      link: "",
      ativo: true,
    });
    setUploadedFile(null);
    setPreviewUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleEdit = (banner: Banner) => {
    setFormData({
      titulo: banner.titulo,
      descricao: banner.descricao || "",
      imagemUrl: banner.imagemUrl,
      link: banner.link || "",
      ativo: banner.ativo,
    });
    setEditingId(banner.id);
    setIsCreating(false);
    setUploadedFile(null);
    setPreviewUrl(banner.imagemUrl);
  };

  const handleSubmit = () => {
    if (editingId) {
      updateBannerMutation.mutate();
    } else {
      createBannerMutation.mutate();
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-vitrii-bg flex flex-col">
        <Header />
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <Lock className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-vitrii-text mb-2">
              Acesso Restrito
            </h1>
            <p className="text-vitrii-text-secondary mb-6">
              Apenas administradores podem acessar esta página.
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-2 bg-vitrii-blue text-white rounded-lg hover:bg-blue-700 transition"
            >
              Voltar para Home
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-vitrii-bg flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-vitrii-text mb-2">
            Gerenciar Banners
          </h1>
          <p className="text-vitrii-text-secondary">
            Crie e edite os banners que aparecem na página inicial
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              <div className="mb-4 pb-4 border-b border-gray-200">
                <h2 className="font-bold text-lg text-vitrii-text">
                  {editingId ? "✏️ Editar Banner" : "➕ Novo Banner"}
                </h2>
                {editingId && (
                  <p className="text-xs text-vitrii-text-secondary mt-1">
                    ID: {editingId}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-vitrii-text mb-2">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={formData.titulo}
                    onChange={(e) =>
                      setFormData({ ...formData, titulo: e.target.value })
                    }
                    placeholder="Ex: Bem-vindo ao Vitrii"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-vitrii-text mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) =>
                      setFormData({ ...formData, descricao: e.target.value })
                    }
                    placeholder="Descrição curta do banner"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-vitrii-text mb-3">
                    Imagem do Banner *
                  </label>

                  {/* Upload Area */}
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-vitrii-blue hover:bg-blue-50 transition-colors mb-3"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleFileUpload(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-vitrii-text">
                      Clique ou arraste uma imagem
                    </p>
                    <p className="text-xs text-vitrii-text-secondary mt-1">
                      PNG, JPG, GIF até 5MB
                    </p>
                  </div>

                  {/* URL Input Alternative */}
                  <div className="mb-3">
                    <label className="text-xs font-semibold text-vitrii-text-secondary mb-1 block">
                      Ou use uma URL de imagem
                    </label>
                    <input
                      type="url"
                      value={!uploadedFile ? formData.imagemUrl : ""}
                      onChange={(e) => {
                        setUploadedFile(null);
                        setPreviewUrl(e.target.value);
                        setFormData({ ...formData, imagemUrl: e.target.value });
                      }}
                      placeholder="https://exemplo.com/imagem.jpg"
                      disabled={!!uploadedFile}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                    />
                  </div>

                  {/* Preview */}
                  {(previewUrl || formData.imagemUrl) && (
                    <div className="relative">
                      <img
                        src={previewUrl || formData.imagemUrl}
                        alt="Preview"
                        className="w-full h-40 object-cover rounded-lg border border-gray-200"
                      />
                      {uploadedFile && (
                        <button
                          type="button"
                          onClick={() => {
                            setUploadedFile(null);
                            setPreviewUrl("");
                            setFormData({ ...formData, imagemUrl: "" });
                            if (fileInputRef.current) {
                              fileInputRef.current.value = "";
                            }
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-vitrii-text mb-2">
                    Link (Opcional)
                  </label>
                  <input
                    type="url"
                    value={formData.link}
                    onChange={(e) =>
                      setFormData({ ...formData, link: e.target.value })
                    }
                    placeholder="https://exemplo.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.ativo}
                      onChange={(e) =>
                        setFormData({ ...formData, ativo: e.target.checked })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-semibold text-vitrii-text">
                      Ativo
                    </span>
                  </label>
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleSubmit}
                    disabled={
                      createBannerMutation.isPending ||
                      updateBannerMutation.isPending ||
                      !formData.titulo ||
                      !formData.imagemUrl
                    }
                    className="flex-1 px-4 py-3 bg-vitrii-blue text-white rounded-lg font-semibold hover:bg-vitrii-blue-dark transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {createBannerMutation.isPending ||
                    updateBannerMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        {editingId ? "Atualizando..." : "Criando..."}
                      </>
                    ) : (
                      <>
                        {editingId ? "✓ Atualizar Banner" : "+ Criar Banner"}
                      </>
                    )}
                  </button>

                  {editingId && (
                    <button
                      onClick={() => {
                        resetForm();
                        setEditingId(null);
                      }}
                      className="flex-1 px-4 py-3 border-2 border-gray-300 text-vitrii-text rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50"
                    >
                      ✕ Cancelar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Banners List Section */}
          <div className="lg:col-span-2">
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-vitrii-text-secondary">Carregando...</p>
              </div>
            ) : banners.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-vitrii-text-secondary">
                  Nenhum banner criado ainda
                </p>
                <button
                  onClick={() => setIsCreating(true)}
                  className="mt-4 inline-flex items-center gap-2 text-vitrii-blue font-semibold hover:underline"
                >
                  <Plus className="w-4 h-4" />
                  Criar Primeiro Banner
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {banners.map((banner: Banner) => (
                  <div
                    key={banner.id}
                    className="bg-white rounded-lg shadow-md p-4 flex gap-4"
                  >
                    <div className="flex-shrink-0">
                      <img
                        src={banner.imagemUrl}
                        alt={banner.titulo}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-vitrii-text">
                            {banner.titulo}
                          </h3>
                          {banner.descricao && (
                            <p className="text-sm text-vitrii-text-secondary line-clamp-2">
                              {banner.descricao}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {banner.ativo ? (
                              <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                                Ativo
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                                Inativo
                              </span>
                            )}
                            <span className="text-xs text-vitrii-text-secondary">
                              Ordem: {banner.ordem}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(banner)}
                            className="p-2 hover:bg-blue-50 rounded-lg transition"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4 text-blue-600" />
                          </button>
                          <button
                            onClick={() => {
                              if (
                                window.confirm(
                                  "Tem certeza que deseja deletar este banner?"
                                )
                              ) {
                                deleteBannerMutation.mutate(banner.id);
                              }
                            }}
                            className="p-2 hover:bg-red-50 rounded-lg transition"
                            title="Deletar"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Info Box */}
            <div className="mt-6 bg-blue-50 border-l-4 border-vitrii-blue p-4 rounded">
              <p className="text-sm text-vitrii-text font-semibold mb-2">
                💡 Dica
              </p>
              <ul className="text-sm text-vitrii-text-secondary space-y-1">
                <li>• Máximo de 5 banners ativos</li>
                <li>• Use imagens em proporção 4:1 (1200x300px recomendado)</li>
                <li>• Banners inativos não aparecem na página principal</li>
                <li>• A ordem define a sequência de exibição no carousel</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
