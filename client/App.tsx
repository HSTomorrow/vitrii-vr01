import "./global.css";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";
import ErrorBoundary from "@/components/ErrorBoundary";

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
import BottomNavBar from "@/components/BottomNavBar";
import PageTransition from "@/components/PageTransition";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <BrowserRouter>
              <BottomNavBar />
              <PageTransition>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/ajuda-e-contato" element={<HelpAndContact />} />
                  <Route path="/privacidade" element={<PrivacyPolicy />} />
                  <Route path="/termos-de-uso" element={<TermsOfUse />} />
                  <Route path="/browse" element={<Browse />} />
                  <Route path="/sell" element={<Sell />} />
                  <Route path="/qrcode" element={<QRCodePage />} />
                  <Route path="/auth/signin" element={<SignIn />} />
                  <Route path="/entrar" element={<SignIn />} />
                  <Route path="/auth/signup" element={<SignUp />} />
                  <Route path="/cadastrar" element={<SignUp />} />
                  <Route path="/esqueci-senha" element={<ForgotPassword />} />
                  <Route path="/reset-senha" element={<ResetPassword />} />
                  <Route path="/favoritos" element={<Favoritos />} />
                  <Route path="/lista-desejos" element={<ListaDesejos />} />
                  <Route path="/meus-anuncios" element={<MeusAnuncios />} />
                  <Route path="/minha-agenda" element={<MinhaAgenda />} />
                  <Route path="/agenda/:anuncianteId" element={<AgendaAnunciante />} />
                  <Route path="/perfil" element={<PerfilUsuario />} />
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
                  <Route path="/cadastros/lojas" element={<CadastroLojas />} />
                  <Route path="/cadastros/grupos-productos" element={<CadastroGruposProductos />} />
                  <Route path="/cadastros/productos" element={<CadastroProdutos />} />
                  <Route path="/cadastros/tabelas-preco" element={<CadastroTabelasPreco />} />
                  <Route path="/cadastros/variantes" element={<CadastroVariantesLista />} />
                  <Route path="/cadastros/variantes/:productId" element={<CadastroVariantes />} />
                  <Route path="/cadastros/equipes-venda" element={<CadastroEquipeDeVenda />} />
                  <Route path="/agenda" element={<Agenda />} />
                  <Route path="/agenda/:anuncianteId" element={<Agenda />} />
                  <Route path="/checkout/:anuncioId" element={<Checkout />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/menu" element={<Menu />} />
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/anuncios" element={<AdminManageAds />} />
                  <Route path="/admin/usuarios" element={<AdminManageUsers />} />
                  <Route path="/admin/banners" element={<AdminBanners />} />
                  <Route path="/admin/anunciantes" element={<AdminAnunciantes />} />
                  <Route path="/admin/pagamentos" element={<AdminPagamentos />} />
                  <Route path="/admin/localidades" element={<AdminLocalidades />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </PageTransition>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
