import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AlertCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnuncioForm from "@/components/AnuncioForm";

export default function CriarAnuncio() {
  const navigate = useNavigate();
  const { isLoggedIn, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-walmart-blue" />
        </div>
        <Footer />
      </div>
    );
  }

  // Redirect to login if not logged in
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <AlertCircle className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-walmart-text mb-2">Acesso Restrito</h2>
            <p className="text-walmart-text-secondary mb-6">
              Para criar anúncios, você precisa estar logado com uma conta válida.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => navigate("/entrar")}
                className="flex-1 px-4 py-3 bg-walmart-blue text-white rounded-lg font-semibold hover:bg-walmart-blue-dark transition-colors"
              >
                Entrar
              </button>
              <button
                onClick={() => navigate("/cadastro")}
                className="flex-1 px-4 py-3 border-2 border-walmart-blue text-walmart-blue rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Cadastrar
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-walmart-gray-light">
      <Header />
      <main className="flex-1">
        <AnuncioForm
          onSuccess={() => navigate("/sell")}
        />
      </main>
      <Footer />
    </div>
  );
}
