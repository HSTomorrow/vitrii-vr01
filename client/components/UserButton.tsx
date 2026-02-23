import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { User, LogOut, Settings, FileText, Heart, Shield, Calendar } from "lucide-react";

export default function UserButton() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate("/");
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors"
        title="Perfil do usuário"
      >
        <User className="w-4 h-4 text-green-600" />
        <span className="text-[0.74rem] font-semibold text-green-800 hidden md:inline">
          {user.nome.split(" ")[0]}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* User Info Section */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{user.nome}</p>
                <p className="text-xs text-gray-600 truncate">{user.email}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {user.tipoUsuario === "adm" ? "👑 Administrador" : "👤 Usuário"}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              onClick={() => handleNavigate("/perfil")}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
            >
              <User className="w-4 h-4" />
              <span>Meu Perfil</span>
            </button>

            <button
              onClick={() => handleNavigate("/meus-anuncios")}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Meus Anúncios</span>
            </button>

            <button
              onClick={() => handleNavigate("/favoritos")}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
            >
              <Heart className="w-4 h-4" />
              <span>Favoritos</span>
            </button>

            <button
              onClick={() => handleNavigate("/minha-agenda")}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              <span>Minha Agenda</span>
            </button>

            {user.tipoUsuario === "adm" && (
              <button
                onClick={() => handleNavigate("/admin/dashboard")}
                className="w-full px-4 py-2 text-left text-sm text-amber-700 hover:bg-amber-50 flex items-center gap-3 transition-colors border-t border-gray-100 mt-2 pt-2"
              >
                <Shield className="w-4 h-4" />
                <span>Painel Admin</span>
              </button>
            )}
          </div>

          {/* Logout Button */}
          <div className="p-2 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded flex items-center gap-3 transition-colors font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
