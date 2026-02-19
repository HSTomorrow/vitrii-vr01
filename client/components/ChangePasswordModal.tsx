import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Lock, Eye, EyeOff, AlertCircle } from "lucide-react";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({
  isOpen,
  onClose,
}: ChangePasswordModalProps) {
  const { user } = useAuth();
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [formData, setFormData] = useState({
    senhaAtual: "",
    senhaNova: "",
    senhaConfirm: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const changePasswordMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado");
      }

      const response = await fetch(
        `/api/usracessos/${user.id}/change-password`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user.id.toString(),
          },
          body: JSON.stringify(data),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao alterar senha");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Senha alterada com sucesso!");
      setFormData({
        senhaAtual: "",
        senhaNova: "",
        senhaConfirm: "",
      });
      setErrors({});
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.senhaAtual) {
      newErrors.senhaAtual = "Senha atual é obrigatória";
    }

    if (!formData.senhaNova) {
      newErrors.senhaNova = "Nova senha é obrigatória";
    } else if (formData.senhaNova.length < 6) {
      newErrors.senhaNova = "A senha deve ter no mínimo 6 caracteres";
    }

    if (!formData.senhaConfirm) {
      newErrors.senhaConfirm = "Confirmação de senha é obrigatória";
    } else if (formData.senhaNova !== formData.senhaConfirm) {
      newErrors.senhaConfirm = "As senhas não correspondem";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      changePasswordMutation.mutate(formData);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
          <Lock className="w-5 h-5 text-vitrii-blue" />
          <h2 className="text-lg font-semibold text-vitrii-text">
            Alterar Senha
          </h2>
          <button
            onClick={onClose}
            className="ml-auto text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-semibold text-vitrii-text mb-2">
              Senha Atual *
            </label>
            <div className="relative">
              <input
                type={showPasswords.current ? "text" : "password"}
                value={formData.senhaAtual}
                onChange={(e) =>
                  handleInputChange("senhaAtual", e.target.value)
                }
                placeholder="Digite sua senha atual"
                className={`w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-1 transition-colors ${
                  errors.senhaAtual
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50"
                    : "border-gray-300 focus:border-vitrii-blue focus:ring-vitrii-blue"
                }`}
              />
              <button
                type="button"
                onClick={() =>
                  setShowPasswords((prev) => ({
                    ...prev,
                    current: !prev.current,
                  }))
                }
                className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
              >
                {showPasswords.current ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.senhaAtual && (
              <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.senhaAtual}
              </p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-semibold text-vitrii-text mb-2">
              Nova Senha *
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? "text" : "password"}
                value={formData.senhaNova}
                onChange={(e) => handleInputChange("senhaNova", e.target.value)}
                placeholder="Digite sua nova senha"
                className={`w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-1 transition-colors ${
                  errors.senhaNova
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50"
                    : "border-gray-300 focus:border-vitrii-blue focus:ring-vitrii-blue"
                }`}
              />
              <button
                type="button"
                onClick={() =>
                  setShowPasswords((prev) => ({
                    ...prev,
                    new: !prev.new,
                  }))
                }
                className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
              >
                {showPasswords.new ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.senhaNova && (
              <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.senhaNova}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-semibold text-vitrii-text mb-2">
              Confirmar Senha *
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? "text" : "password"}
                value={formData.senhaConfirm}
                onChange={(e) =>
                  handleInputChange("senhaConfirm", e.target.value)
                }
                placeholder="Confirme sua nova senha"
                className={`w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-1 transition-colors ${
                  errors.senhaConfirm
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50"
                    : "border-gray-300 focus:border-vitrii-blue focus:ring-vitrii-blue"
                }`}
              />
              <button
                type="button"
                onClick={() =>
                  setShowPasswords((prev) => ({
                    ...prev,
                    confirm: !prev.confirm,
                  }))
                }
                className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
              >
                {showPasswords.confirm ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.senhaConfirm && (
              <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.senhaConfirm}
              </p>
            )}
          </div>

          {/* Info message */}
          <div className="bg-blue-50 border-l-4 border-vitrii-blue rounded p-3 text-xs text-vitrii-text">
            💡 A senha deve ter no mínimo 6 caracteres para sua segurança.
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="flex-1 px-4 py-2 bg-vitrii-blue text-white rounded-lg font-semibold hover:bg-vitrii-blue-dark transition-colors disabled:opacity-50"
            >
              {changePasswordMutation.isPending ? "Alterando..." : "Alterar Senha"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
