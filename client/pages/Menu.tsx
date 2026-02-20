import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Home,
  ShoppingBag,
  Plus,
  QrCode,
  Info,
  Heart,
  Settings,
  LogOut,
  LogIn,
  Shield,
  FileText,
  Store,
  Grid,
  Tag,
  Layers,
  Users,
  Package,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Menu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1">
        {/* Header Section */}
        <div className="sticky top-16 bg-white border-b border-gray-200 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Voltar"
              >
                <ArrowLeft className="w-6 h-6 text-vitrii-text" />
              </button>
              <h1 className="text-2xl font-bold text-vitrii-text">Menu</h1>
            </div>
          </div>
        </div>

        {/* Menu Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Main Navigation */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-vitrii-text mb-4">
              Navegação
            </h2>
            <div className="space-y-2">
              <Link
                to="/"
                className="flex items-center gap-4 px-6 py-4 bg-vitrii-gray hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Home className="w-6 h-6 text-vitrii-blue" />
                <span className="text-vitrii-text font-medium">
                  Página Inicial
                </span>
              </Link>

              <Link
                to="/browse"
                className="flex items-center gap-4 px-6 py-4 bg-vitrii-gray hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ShoppingBag className="w-6 h-6 text-vitrii-blue" />
                <span className="text-vitrii-text font-medium">
                  Ver Anúncios
                </span>
              </Link>

              {user && (
                <Link
                  to="/anuncio/criar"
                  className="flex items-center gap-4 px-6 py-4 bg-vitrii-yellow hover:bg-vitrii-yellow-dark rounded-lg transition-colors"
                >
                  <Plus className="w-6 h-6 text-vitrii-text" />
                  <span className="text-vitrii-text font-bold">
                    Publicar Anúncio
                  </span>
                </Link>
              )}

              {!user && (
                <Link
                  to="/anuncio/criar"
                  className="flex items-center gap-4 px-6 py-4 bg-vitrii-yellow hover:bg-vitrii-yellow-dark rounded-lg transition-colors"
                >
                  <Plus className="w-6 h-6 text-vitrii-text" />
                  <span className="text-vitrii-text font-bold">Vender</span>
                </Link>
              )}

              <Link
                to="/qrcode"
                className="flex items-center gap-4 px-6 py-4 bg-vitrii-gray hover:bg-gray-200 rounded-lg transition-colors"
              >
                <QrCode className="w-6 h-6 text-vitrii-blue" />
                <span className="text-vitrii-text font-medium">QR Code</span>
              </Link>

              <Link
                to="/about"
                className="flex items-center gap-4 px-6 py-4 bg-vitrii-gray hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Info className="w-6 h-6 text-vitrii-blue" />
                <span className="text-vitrii-text font-medium">Sobre Nós</span>
              </Link>
            </div>
          </section>

          {/* User Features (only for logged-in users) */}
          {user && (
            <>
              <section className="mb-8">
                <h2 className="text-lg font-semibold text-vitrii-text mb-4">
                  Minha Conta
                </h2>
                <div className="space-y-2">
                  <Link
                    to="/meus-anuncios"
                    className="flex items-center gap-4 px-6 py-4 bg-vitrii-gray hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Package className="w-6 h-6 text-vitrii-blue" />
                    <span className="text-vitrii-text font-medium">
                      Meus Anúncios
                    </span>
                  </Link>

                  <Link
                    to="/favoritos"
                    className="flex items-center gap-4 px-6 py-4 bg-vitrii-gray hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Heart className="w-6 h-6 text-red-500" />
                    <span className="text-vitrii-text font-medium">
                      Meus Favoritos
                    </span>
                  </Link>

                  <Link
                    to="/lista-desejos"
                    className="flex items-center gap-4 px-6 py-4 bg-vitrii-gray hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Heart className="w-6 h-6 text-pink-500" />
                    <span className="text-vitrii-text font-medium">
                      Lista de Desejos
                    </span>
                  </Link>

                  <Link
                    to="/minha-agenda"
                    className="flex items-center gap-4 px-6 py-4 bg-vitrii-gray hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Calendar className="w-6 h-6 text-vitrii-blue" />
                    <span className="text-vitrii-text font-medium">
                      Minha Agenda
                    </span>
                  </Link>

                  <Link
                    to="/chat"
                    className="flex items-center gap-4 px-6 py-4 bg-vitrii-gray hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <FileText className="w-6 h-6 text-vitrii-blue" />
                    <span className="text-vitrii-text font-medium">
                      Minhas Mensagens
                    </span>
                  </Link>
                </div>
              </section>

              {/* Cadastros Section */}
              <section className="mb-8">
                <h2 className="text-lg font-semibold text-vitrii-text mb-4">
                  Cadastros
                </h2>
                <div className="space-y-2">
                  <Link
                    to="/cadastros/lojas"
                    className="flex items-center gap-4 px-6 py-4 bg-vitrii-gray hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Store className="w-6 h-6 text-vitrii-blue" />
                    <span className="text-vitrii-text font-medium">
                      Cadastro de Anunciantes e Lojas
                    </span>
                  </Link>

                  <Link
                    to="/cadastros/grupos-productos"
                    className="flex items-center gap-4 px-6 py-4 bg-vitrii-gray hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Grid className="w-6 h-6 text-vitrii-blue" />
                    <span className="text-vitrii-text font-medium">
                      Grupos de Produtos
                    </span>
                  </Link>

                  <Link
                    to="/cadastros/productos"
                    className="flex items-center gap-4 px-6 py-4 bg-vitrii-gray hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <ShoppingBag className="w-6 h-6 text-vitrii-blue" />
                    <span className="text-vitrii-text font-medium">
                      Cadastro de Produtos
                    </span>
                  </Link>

                  <Link
                    to="/cadastros/tabelas-preco"
                    className="flex items-center gap-4 px-6 py-4 bg-vitrii-gray hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Tag className="w-6 h-6 text-vitrii-blue" />
                    <span className="text-vitrii-text font-medium">
                      Tabelas de Preço
                    </span>
                  </Link>

                  <Link
                    to="/cadastros/variantes"
                    className="flex items-center gap-4 px-6 py-4 bg-vitrii-gray hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Layers className="w-6 h-6 text-vitrii-blue" />
                    <span className="text-vitrii-text font-medium">
                      Variantes
                    </span>
                  </Link>

                  <Link
                    to="/cadastros/equipes-venda"
                    className="flex items-center gap-4 px-6 py-4 bg-vitrii-gray hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Users className="w-6 h-6 text-vitrii-blue" />
                    <span className="text-vitrii-text font-medium">
                      Equipes de Venda
                    </span>
                  </Link>
                </div>
              </section>

              {/* Admin Section (only for admins) */}
              {user.tipoUsuario === "adm" && (
                <section className="mb-8">
                  <h2 className="text-lg font-semibold text-vitrii-text mb-4">
                    Administração
                  </h2>
                  <div className="space-y-2">
                    <Link
                      to="/admin/dashboard"
                      className="flex items-center gap-4 px-6 py-4 bg-yellow-100 hover:bg-yellow-200 rounded-lg transition-colors border border-yellow-300"
                    >
                      <Shield className="w-6 h-6 text-yellow-700" />
                      <span className="text-yellow-900 font-medium">
                        Painel de Controle
                      </span>
                    </Link>

                    <Link
                      to="/admin/anuncios"
                      className="flex items-center gap-4 px-6 py-4 bg-orange-100 hover:bg-orange-200 rounded-lg transition-colors border border-orange-300"
                    >
                      <FileText className="w-6 h-6 text-orange-700" />
                      <span className="text-orange-900 font-medium">
                        Gerenciar Anúncios
                      </span>
                    </Link>
                  </div>
                </section>
              )}
            </>
          )}

          {/* Authentication Section */}
          <section>
            <h2 className="text-lg font-semibold text-vitrii-text mb-4">
              {user ? "Conta" : "Autenticação"}
            </h2>
            <div className="space-y-2">
              {user ? (
                <>
                  <div className="flex items-center gap-4 px-6 py-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center">
                      <span className="text-green-800 font-bold">
                        {user.nome.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-green-900 font-semibold">
                        {user.nome}
                      </p>
                      <p className="text-green-700 text-sm">{user.email}</p>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-4 px-6 py-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200 text-left"
                  >
                    <LogOut className="w-6 h-6 text-red-600" />
                    <span className="text-red-900 font-medium">
                      Sair da Conta
                    </span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/auth/signin"
                    className="flex items-center gap-4 px-6 py-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                  >
                    <LogIn className="w-6 h-6 text-blue-600" />
                    <span className="text-blue-900 font-medium">Entrar</span>
                  </Link>
                </>
              )}
            </div>
          </section>

          {/* Footer Info */}
          <div className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-vitrii-text-secondary">
            <p>Vitrii Marketplace © 2024</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
