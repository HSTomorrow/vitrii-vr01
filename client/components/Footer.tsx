import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-vitrii-text text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* About */}
          <div>
            <h3 className="font-bold text-lg mb-4 flex items-center space-x-2">
              <div className="w-8 h-8 bg-vitrii-yellow rounded-lg flex items-center justify-center text-vitrii-text font-bold">
                V
              </div>
              <span>Vitrii</span>
            </h3>
            <p className="text-gray-300 text-sm">
              Marketplace conectando compradores e vendedores com tecnologia QR
              Code inovadora.
            </p>
          </div>

          {/* Comprador */}
          <div>
            <h4 className="font-semibold mb-4">Para Compradores</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <Link
                  to="/browse"
                  className="hover:text-vitrii-yellow transition-colors"
                >
                  Buscar Produtos
                </Link>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-vitrii-yellow transition-colors"
                >
                  Categorias
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-vitrii-yellow transition-colors"
                >
                  Ofertas
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-vitrii-yellow transition-colors"
                >
                  Histórico de Compras
                </a>
              </li>
            </ul>
          </div>

          {/* Vendedor */}
          <div>
            <h4 className="font-semibold mb-4">Para Vendedores</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <Link
                  to="/sell"
                  className="hover:text-vitrii-yellow transition-colors"
                >
                  Começar a Vender
                </Link>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-vitrii-yellow transition-colors"
                >
                  Gerenciar Lojas
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-vitrii-yellow transition-colors"
                >
                  Gerenciar Anúncios
                </a>
              </li>
              <li>
                <Link
                  to="/qrcode"
                  className="hover:text-vitrii-yellow transition-colors"
                >
                  QR Code Studio
                </Link>
              </li>
            </ul>
          </div>

          {/* Suporte */}
          <div>
            <h4 className="font-semibold mb-4">Suporte</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <Link
                  to="/about"
                  className="hover:text-vitrii-yellow transition-colors"
                >
                  Sobre o Vitrii
                </Link>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-vitrii-yellow transition-colors"
                >
                  Central de Ajuda
                </a>
              </li>
              <li>
                <a
                  href="mailto:vitriimarketplace@gmail.com"
                  className="hover:text-vitrii-yellow transition-colors"
                >
                  Contato
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-vitrii-yellow transition-colors"
                >
                  Políticas
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-vitrii-yellow transition-colors"
                >
                  Termos de Uso
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 pt-8 mt-8">
          {/* Social Links */}
          <div className="flex justify-center space-x-6 mb-6">
            <a
              href="#"
              className="text-gray-400 hover:text-vitrii-yellow transition-colors"
            >
              <Facebook className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-vitrii-yellow transition-colors"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-vitrii-yellow transition-colors"
            >
              <Twitter className="w-5 h-5" />
            </a>
            <a
              href="mailto:vitriimarketplace@gmail.com"
              className="text-gray-400 hover:text-vitrii-yellow transition-colors"
            >
              <Mail className="w-5 h-5" />
            </a>
          </div>

          {/* Bottom Text */}
          <div className="text-center text-gray-400 text-sm">
            <p>
              &copy; 2024 Vitrii. Todos os direitos reservados. | Desenvolvido
              com ❤️ para vendedores e compradores
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
