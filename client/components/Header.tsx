import { Link, useNavigate } from "react-router-dom";
import {
  Menu,
  Search,
  User,
  Plus,
  MessageSquare,
  Shield,
  FileText,
  Heart,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Header() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link
              to="/"
              className="flex-shrink-0 flex items-center space-x-2 group"
            >
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2Ff2e9e91d4cc44d4bae5b9dac3bb6abe8%2F9b0468b30c2f492b9eac618e9410fecf?format=webp&width=800"
                alt="Vitrii Logo"
                className="h-12 w-auto"
              />
            </Link>

            {/* Search Bar - Hidden on mobile */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="w-full relative">
                <input
                  type="text"
                  placeholder="Buscar anúncios, anunciantes, eventos..."
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      (e.target as HTMLInputElement).value.trim()
                    ) {
                      navigate(
                        `/buscar?q=${encodeURIComponent((e.target as HTMLInputElement).value)}`,
                      );
                    }
                  }}
                  className="w-full px-4 py-2 pl-10 bg-vitrii-gray border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-vitrii-blue focus:ring-1 focus:ring-vitrii-blue"
                  title="Busque por anúncios, anunciantes, eventos, agendas e doacões"
                />
                <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-6">
              <Link
                to="/browse"
                className="text-vitrii-text-secondary hover:text-vitrii-blue transition-colors text-[0.85rem]"
              >
                Ver Anúncios
              </Link>
            </nav>

            {/* Right side - Auth and actions */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link
                to="/chat"
                className="flex-shrink-0 p-2 hover:bg-vitrii-gray rounded-lg transition-colors"
                title="Minhas mensagens"
              >
                <MessageSquare className="w-5 h-5 text-vitrii-text" />
              </Link>

              {user && (
                <Link
                  to="/favoritos"
                  className="flex-shrink-0 p-2 hover:bg-vitrii-gray rounded-lg transition-colors"
                  title="Meus favoritos"
                >
                  <Heart className="w-5 h-5 text-vitrii-text" />
                </Link>
              )}

              {user ? (
                <>
                  <Link
                    to="/anuncio/criar"
                    className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-vitrii-yellow text-vitrii-text rounded-lg hover:bg-vitrii-yellow-dark transition-colors font-semibold text-[0.85rem]"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden md:inline">Publicar</span>
                  </Link>

                  {user.tipoUsuario === "adm" && (
                    <div className="hidden sm:flex gap-2">
                      <Link
                        to="/admin/dashboard"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors font-semibold text-[0.85rem]"
                        title="Painel de Administrador"
                      >
                        <Shield className="w-4 h-4" />
                        <span className="hidden md:inline">Administrador</span>
                      </Link>
                      <Link
                        to="/admin/anuncios"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors font-semibold text-[0.85rem]"
                        title="Gerenciar Anúncios"
                      >
                        <FileText className="w-4 h-4" />
                        <span className="hidden md:inline">Anúncios</span>
                      </Link>
                      <Link
                        to="/admin/banners"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-semibold text-[0.85rem]"
                        title="Gerenciar Banners"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="hidden md:inline">Banners</span>
                      </Link>
                    </div>
                  )}

                  <div className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-green-50 rounded-lg border border-green-200">
                    <User className="w-4 h-4 text-green-600" />
                    <span className="text-[0.74rem] font-semibold text-green-800 hidden md:inline">
                      {user.nome.split(" ")[0]}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/anuncio/criar"
                    className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-vitrii-yellow text-vitrii-text rounded-lg hover:bg-vitrii-yellow-dark transition-colors font-semibold text-[0.85rem]"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden md:inline">Publicar</span>
                  </Link>

                  <Link
                    to="/auth/signin"
                    className="px-4 py-2 text-vitrii-blue hover:bg-blue-50 rounded-lg transition-colors hidden sm:block text-[0.85rem]"
                  >
                    Entrar
                  </Link>
                </>
              )}

              {/* Mobile menu button */}
              <Link
                to="/menu"
                className="flex-shrink-0 p-2 hover:bg-vitrii-gray rounded-lg mobile-menu-button"
                aria-label="Menu de navegação"
              >
                <Menu className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden pb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar anúncios, anunciantes..."
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    (e.target as HTMLInputElement).value.trim()
                  ) {
                    navigate(
                      `/buscar?q=${encodeURIComponent((e.target as HTMLInputElement).value)}`,
                    );
                  }
                }}
                className="w-full px-4 py-2 pl-10 bg-vitrii-gray border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-vitrii-blue"
                title="Busque por anúncios, anunciantes, eventos, agendas e doações"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
