import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Search,
  User,
  Plus,
  LogOut,
  Settings,
  MessageSquare,
  Shield,
  FileText,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCadastrosOpen, setIsCadastrosOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex-shrink-0 flex items-center space-x-2 group"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-walmart-blue to-walmart-blue-dark rounded-lg flex items-center justify-center text-white font-bold text-lg">
              V
            </div>
            <span className="text-xl font-bold text-walmart-blue hidden sm:inline">
              Vitrii
            </span>
          </Link>

          {/* Search Bar - Hidden on mobile */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="w-full relative">
              <input
                type="text"
                placeholder="Buscar produtos e serviços..."
                onFocus={() => navigate("/buscar")}
                className="w-full px-4 py-2 pl-10 bg-walmart-gray border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-walmart-blue focus:ring-1 focus:ring-walmart-blue cursor-pointer"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            <Link
              to="/browse"
              className="text-walmart-text-secondary hover:text-walmart-blue transition-colors"
            >
              Ver Anúncios
            </Link>
            <Link
              to="/sell"
              className="text-walmart-text-secondary hover:text-walmart-blue transition-colors"
            >
              Vender
            </Link>
            <Link
              to="/qrcode"
              className="text-walmart-text-secondary hover:text-walmart-blue transition-colors"
            >
              QR Code
            </Link>
            <Link
              to="/about"
              className="text-walmart-text-secondary hover:text-walmart-blue transition-colors"
            >
              Sobre
            </Link>
          </nav>

          {/* Right side - Auth and actions */}
          <div className="flex items-center space-x-4">
            <Link
              to="/chat"
              className="p-2 hover:bg-walmart-gray rounded-lg transition-colors"
              title="Minhas mensagens"
            >
              <MessageSquare className="w-5 h-5 text-walmart-text" />
            </Link>

            {user ? (
              <>
                <Link
                  to="/anuncio/criar"
                  className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-walmart-yellow text-walmart-text rounded-lg hover:bg-walmart-yellow-dark transition-colors font-semibold"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden md:inline">Publicar</span>
                </Link>

                {user.tipoUsuario === "adm" && (
                  <div className="hidden sm:flex gap-2">
                    <Link
                      to="/admin/dashboard"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors font-semibold"
                      title="Painel de Administrador"
                    >
                      <Shield className="w-4 h-4" />
                      <span className="hidden md:inline">Administrador</span>
                    </Link>
                    <Link
                      to="/admin/anuncios"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors font-semibold"
                      title="Gerenciar Anúncios"
                    >
                      <FileText className="w-4 h-4" />
                      <span className="hidden md:inline">Anúncios</span>
                    </Link>
                  </div>
                )}

                <div className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-green-50 rounded-lg border border-green-200">
                  <User className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-800 hidden md:inline">
                    {user.nome.split(" ")[0]}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors hidden sm:flex items-center gap-2 font-semibold"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden md:inline">Sair</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/anuncio/criar"
                  className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-walmart-yellow text-walmart-text rounded-lg hover:bg-walmart-yellow-dark transition-colors font-semibold"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden md:inline">Publicar</span>
                </Link>

                <Link
                  to="/auth/signin"
                  className="px-4 py-2 text-walmart-blue hover:bg-blue-50 rounded-lg transition-colors hidden sm:block"
                >
                  Entrar
                </Link>

                <Link
                  to="/auth/signup"
                  className="px-4 py-2 bg-walmart-blue text-white rounded-lg hover:bg-walmart-blue-dark transition-colors hidden sm:block"
                >
                  Cadastrar
                </Link>
              </>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 hover:bg-walmart-gray rounded-lg"
            >
              {isMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full px-4 py-2 pl-10 bg-walmart-gray border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-walmart-blue"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <nav className="lg:hidden pb-4 border-t border-gray-200">
            <div className="flex flex-col space-y-2 pt-4">
              <Link
                to="/browse"
                className="px-4 py-2 text-walmart-text hover:bg-walmart-gray rounded-lg"
              >
                Comprar
              </Link>
              <Link
                to="/sell"
                className="px-4 py-2 text-walmart-text hover:bg-walmart-gray rounded-lg"
              >
                Vender
              </Link>
              <Link
                to="/qrcode"
                className="px-4 py-2 text-walmart-text hover:bg-walmart-gray rounded-lg"
              >
                QR Code
              </Link>
              <Link
                to="/about"
                className="px-4 py-2 text-walmart-text hover:bg-walmart-gray rounded-lg"
              >
                Sobre
              </Link>

              <div className="border-t border-gray-300 pt-4 mt-2">
                <button
                  onClick={() => setIsCadastrosOpen(!isCadastrosOpen)}
                  className="w-full text-left px-4 py-2 text-walmart-text hover:bg-walmart-gray rounded-lg font-semibold flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Cadastros
                </button>
                {isCadastrosOpen && (
                  <div className="pl-4 space-y-2 mt-2">
                    <Link
                      to="/cadastros/lojas"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsCadastrosOpen(false);
                      }}
                      className="block px-4 py-2 text-sm text-walmart-text hover:bg-walmart-gray rounded-lg"
                    >
                      Cadastro de Lojas
                    </Link>
                    <Link
                      to="/cadastros/grupos-productos"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsCadastrosOpen(false);
                      }}
                      className="block px-4 py-2 text-sm text-walmart-text hover:bg-walmart-gray rounded-lg"
                    >
                      Grupos de Produtos
                    </Link>
                    <Link
                      to="/cadastros/productos"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsCadastrosOpen(false);
                      }}
                      className="block px-4 py-2 text-sm text-walmart-text hover:bg-walmart-gray rounded-lg"
                    >
                      Cadastro de Produtos
                    </Link>
                    <Link
                      to="/cadastros/tabelas-preco"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsCadastrosOpen(false);
                      }}
                      className="block px-4 py-2 text-sm text-walmart-text hover:bg-walmart-gray rounded-lg"
                    >
                      Tabelas de Preço
                    </Link>
                    <Link
                      to="/cadastros/variantes"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsCadastrosOpen(false);
                      }}
                      className="block px-4 py-2 text-sm text-walmart-text hover:bg-walmart-gray rounded-lg"
                    >
                      Variantes
                    </Link>
                    <Link
                      to="/cadastros/equipes-venda"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsCadastrosOpen(false);
                      }}
                      className="block px-4 py-2 text-sm text-walmart-text hover:bg-walmart-gray rounded-lg"
                    >
                      Equipes de Venda
                    </Link>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-300 pt-4 mt-2">
                <Link
                  to="/auth/signin"
                  className="block px-4 py-2 text-walmart-blue"
                >
                  Entrar
                </Link>
                <Link
                  to="/auth/signup"
                  className="block px-4 py-2 bg-walmart-blue text-white rounded-lg"
                >
                  Cadastrar
                </Link>
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
