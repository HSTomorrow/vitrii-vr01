import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowRight } from "lucide-react";

export default function SignIn() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <div className="flex-1 max-w-lg mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-walmart-gray-light rounded-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-walmart-text">Entrar</h1>
            <p className="text-walmart-text-secondary mt-2">
              Acesse sua conta Vitrii
            </p>
          </div>

          <div className="bg-blue-50 border-l-4 border-walmart-blue rounded p-4 mb-8 flex gap-3">
            <AlertCircle className="w-5 h-5 text-walmart-blue flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-walmart-text">Em Breve</h3>
              <p className="text-sm text-walmart-text-secondary">
                A página de autenticação será implementada em breve com suporte
                para Google e Email/Senha.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <button className="w-full bg-white border-2 border-gray-300 text-walmart-text py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
              Entrar com Google
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-walmart-gray-light text-walmart-text-secondary">
                  Ou
                </span>
              </div>
            </div>

            <input
              type="email"
              placeholder="Email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-walmart-blue focus:ring-1 focus:ring-walmart-blue disabled:opacity-50"
              disabled
            />

            <input
              type="password"
              placeholder="Senha"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-walmart-blue focus:ring-1 focus:ring-walmart-blue disabled:opacity-50"
              disabled
            />

            <button className="w-full bg-walmart-blue text-white py-3 rounded-lg font-semibold hover:bg-walmart-blue-dark transition-colors disabled:opacity-50" disabled>
              Entrar
            </button>
          </div>

          <div className="text-center mt-6">
            <p className="text-walmart-text-secondary">
              Não tem conta?{" "}
              <Link
                to="/auth/signup"
                className="text-walmart-blue font-semibold hover:underline"
              >
                Cadastre-se
              </Link>
            </p>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-300">
            <Link
              to="/"
              className="inline-flex items-center space-x-2 text-walmart-blue font-semibold hover:space-x-3 transition-all"
            >
              <span>Voltar para Home</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
