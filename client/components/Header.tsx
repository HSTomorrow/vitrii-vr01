import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Search, ShoppingCart, User, Plus } from "lucide-react";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
                className="w-full px-4 py-2 pl-10 bg-walmart-gray border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-walmart-blue focus:ring-1 focus:ring-walmart-blue"
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
              Comprar
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

          {/* Right side - Cart and Auth */}
          <div className="flex items-center space-x-4">
            <button className="p-2 hover:bg-walmart-gray rounded-lg transition-colors">
              <ShoppingCart className="w-5 h-5 text-walmart-text" />
            </button>

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
              <Link
                to="/auth/signin"
                className="px-4 py-2 text-walmart-blue"
              >
                Entrar
              </Link>
              <Link
                to="/auth/signup"
                className="px-4 py-2 bg-walmart-blue text-white rounded-lg"
              >
                Cadastrar
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
