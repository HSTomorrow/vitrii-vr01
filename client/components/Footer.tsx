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
            <p className="text-gray-300 text-sm mb-3">
              Marketplace conectando compradores e vendedores com tecnologia QR
              Code inovadora.
            </p>
            <p className="text-gray-400 text-xs">
              Desenvolvido pela <span className="font-semibold">HeresTomorrow</span>, especializada em soluções tecnológicas.
            </p>
            <p className="text-gray-400 text-xs mt-2">
              <a href="mailto:contato@herestomorrow.com.br" className="hover:text-vitrii-yellow transition-colors">contato@herestomorrow.com.br</a>
            </p>
          </div>

          {/* Comprador */}
          <div>
            <h4 className="font-semibold mb-4 text-vitrii-yellow">Para Compradores</h4>
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
            <h4 className="font-semibold mb-4 text-vitrii-yellow">Para Vendedores</h4>
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
            <h4 className="font-semibold mb-4 text-vitrii-yellow">Suporte</h4>
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
                <Link
                  to="/ajuda-e-contato"
                  className="hover:text-vitrii-yellow transition-colors"
                >
                  Ajuda e Contato
                </Link>
              </li>
              <li>
                <Link
                  to="/privacidade"
                  className="hover:text-vitrii-yellow transition-colors"
                >
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link
                  to="/termos-de-uso"
                  className="hover:text-vitrii-yellow transition-colors"
                >
                  Termos de Uso
                </Link>
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
              title="Facebook"
            >
              <Facebook className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-vitrii-yellow transition-colors"
              title="Instagram"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-vitrii-yellow transition-colors"
              title="Twitter"
            >
              <Twitter className="w-5 h-5" />
            </a>
            <a
              href="mailto:contato@herestomorrow.com.br"
              className="text-gray-400 hover:text-vitrii-yellow transition-colors"
              title="Email"
            >
              <Mail className="w-5 h-5" />
            </a>
          </div>

          {/* Bottom Text */}
          <div className="text-center text-gray-400 text-sm space-y-2">
            <p>
              &copy; 2026 Vitrii. Todos os direitos reservados.
            </p>
            <p>
              Desenvolvido com ❤️ por <a href="https://herestomorrow.com.br" target="_blank" rel="noopener noreferrer" className="text-vitrii-yellow hover:underline">HeresTomorrow</a> para realizar excelentes negócios
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
