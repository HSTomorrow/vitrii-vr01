import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AlertCircle, ArrowRight } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-lg">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>

          <h1 className="text-6xl font-bold text-walmart-text mb-2">404</h1>
          <p className="text-2xl font-bold text-walmart-text mb-4">
            Página não encontrada
          </p>
          <p className="text-walmart-text-secondary mb-8">
            Desculpe, a página que você está procurando não existe ou foi
            removida. Verifique a URL e tente novamente.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center space-x-2 bg-walmart-blue text-white px-6 py-3 rounded-lg font-semibold hover:bg-walmart-blue-dark transition-colors"
            >
              <span>Voltar para Home</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/browse"
              className="inline-flex items-center justify-center space-x-2 border-2 border-walmart-blue text-walmart-blue px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              <span>Explorar Produtos</span>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default NotFound;
