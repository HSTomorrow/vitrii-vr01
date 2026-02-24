import "./global.css";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useAutoUpdate } from "@/hooks/useAutoUpdate";

// Import all pages eagerly to avoid lazy loading issues with useState
import Index from "./pages/Index";
import About from "./pages/About";
import Browse from "./pages/Browse";
import Sell from "./pages/Sell";
import NotFound from "./pages/NotFound";
import QRCodePage from "./pages/QRCode";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Favoritos from "./pages/Favoritos";
import ListaDesejos from "./pages/ListaDesejos";
import PerfilUsuario from "./pages/PerfilUsuario";
import CriarAnuncio from "./pages/CriarAnuncio";
import AnuncioDetalhe from "./pages/AnuncioDetalhe";
import EditarAnuncio from "./pages/EditarAnuncio";
import CadastroLojas from "./pages/CadastroLojas";
import CadastroGruposProductos from "./pages/CadastroGruposProductos";
import CadastroProdutos from "./pages/CadastroProdutos";
import CadastroTabelasPreco from "./pages/CadastroTabelasPreco";
import CadastroVariantesLista from "./pages/CadastroVariantesLista";
import CadastroVariantes from "./pages/CadastroVariantes";
import CadastroEquipeDeVenda from "./pages/CadastroEquipeDeVenda";
import CadastroContatos from "./pages/CadastroContatos";
import Agenda from "./pages/Agenda";
import SearchAnuncios from "./pages/SearchAnuncios";
import SearchProdutos from "./pages/SearchProdutos";
import Checkout from "./pages/Checkout";
import Chat from "./pages/Chat";
import AdminDashboard from "./pages/AdminDashboard";
import AdminManageAds from "./pages/AdminManageAds";
import AdminManageUsers from "./pages/AdminManageUsers";
import AdminBanners from "./pages/AdminBanners";
import AdminAnunciantes from "./pages/AdminAnunciantes";
import AdminPagamentos from "./pages/AdminPagamentos";
import AdminLocalidades from "./pages/AdminLocalidades";
import Menu from "./pages/Menu";
import MeusAnuncios from "./pages/MeusAnuncios";
import MinhaAgenda from "./pages/MinhaAgenda";
import AgendaAnunciante from "./pages/AgendaAnunciante";
import AnuncianteProfile from "./pages/AnuncianteProfile";
import HelpAndContact from "./pages/HelpAndContact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfUse from "./pages/TermsOfUse";
import Plans from "./pages/Plans";
import VerifyEmail from "./pages/VerifyEmail";
import TestEmail from "./pages/TestEmail";
import BottomNavBar from "@/components/BottomNavBar";
import PageTransition from "@/components/PageTransition";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 600000, // 10 minutes
      gcTime: 600000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false, // Disable refetch on window focus
      refetchOnMount: false, // Disable refetch on mount if data is not stale
      refetchOnReconnect: false, // Disable refetch on reconnect
      retry: 1, // Retry failed requests once
    },
  },
});

// Separate component to use the hook
function AppContent() {
  useAutoUpdate();

  return (
    <BrowserRouter>
      <BottomNavBar />
      <PageTransition>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/ajuda-e-contato" element={<HelpAndContact />} />
          <Route path="/privacidade" element={<PrivacyPolicy />} />
          <Route path="/termos-de-uso" element={<TermsOfUse />} />
          <Route path="/planos" element={<Plans />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/sell" element={<Sell />} />
          <Route path="/qrcode" element={<QRCodePage />} />
          <Route path="/auth/signin" element={<SignIn />} />
          <Route path="/entrar" element={<SignIn />} />
          <Route path="/auth/signup" element={<SignUp />} />
          <Route path="/cadastrar" element={<SignUp />} />
          <Route path="/esqueci-senha" element={<ForgotPassword />} />
          <Route path="/reset-senha" element={<ResetPassword />} />
          <Route path="/verificar-email" element={<VerifyEmail />} />
          <Route path="/test-email" element={<TestEmail />} />
          <Route path="/favoritos" element={<Favoritos />} />
          <Route path="/lista-desejos" element={<ListaDesejos />} />
          <Route path="/meus-anuncios" element={<MeusAnuncios />} />
          <Route path="/minha-agenda" element={<MinhaAgenda />} />
          <Route path="/agenda/:anuncianteId" element={<AgendaAnunciante />} />
          <Route path="/perfil" element={<PerfilUsuario />} />
          <Route path="/perfil/:id" element={<PerfilUsuario />} />
          <Route path="/profile" element={<PerfilUsuario />} />
          <Route path="/anuncio/criar" element={<CriarAnuncio />} />
          <Route path="/anuncio/:id" element={<AnuncioDetalhe />} />
          <Route path="/anuncio/:id/editar" element={<EditarAnuncio />} />
          <Route path="/anunciante/:id" element={<AnuncianteProfile />} />
          <Route
            path="/buscar"
            element={
              <ErrorBoundary>
                <SearchAnuncios />
              </ErrorBoundary>
            }
          />
          <Route
            path="/buscar-produtos"
            element={
              <ErrorBoundary>
                <SearchProdutos />
              </ErrorBoundary>
            }
          />
          <Route path="/checkout/:anuncioId" element={<Checkout />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/anuncios" element={<AdminManageAds />} />
          <Route path="/admin/usuarios" element={<AdminManageUsers />} />
          <Route path="/admin/banners" element={<AdminBanners />} />
          <Route path="/admin/anunciantes" element={<AdminAnunciantes />} />
          <Route path="/admin/pagamentos" element={<AdminPagamentos />} />
          <Route path="/admin/localidades" element={<AdminLocalidades />} />
          <Route path="/cadastro-lojas" element={<CadastroLojas />} />
          <Route
            path="/cadastro-grupos-productos"
            element={<CadastroGruposProductos />}
          />
          <Route path="/cadastro-productos" element={<CadastroProdutos />} />
          <Route path="/cadastro-tabelas-preco" element={<CadastroTabelasPreco />} />
          <Route path="/cadastro-variantes" element={<CadastroVariantesLista />} />
          <Route
            path="/cadastro-variantes/:produtoId"
            element={<CadastroVariantes />}
          />
          <Route
            path="/cadastro-equipe-venda"
            element={<CadastroEquipeDeVenda />}
          />
          <Route
            path="/cadastro-contatos"
            element={<CadastroContatos />}
          />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/menu" element={<Menu />} />
          {/* Redirect old cadastros/* routes to cadastro-* */}
          <Route path="/cadastros/lojas" element={<Navigate to="/cadastro-lojas" replace />} />
          <Route path="/cadastros/productos" element={<Navigate to="/cadastro-productos" replace />} />
          <Route path="/cadastros/grupos-productos" element={<Navigate to="/cadastro-grupos-productos" replace />} />
          <Route path="/cadastros/tabelas-preco" element={<Navigate to="/cadastro-tabelas-preco" replace />} />
          <Route path="/cadastros/variantes" element={<Navigate to="/cadastro-variantes" replace />} />
          <Route path="/cadastros/equipe-venda" element={<Navigate to="/cadastro-equipe-venda" replace />} />
          <Route path="/cadastros/contatos" element={<Navigate to="/cadastro-contatos" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </PageTransition>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <AppContent />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
