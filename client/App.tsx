import "./global.css";

import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";
import ErrorBoundary from "@/components/ErrorBoundary";

// Eagerly load core pages for better initial page load performance
import Index from "./pages/Index";
import About from "./pages/About";
import Browse from "./pages/Browse";
import Sell from "./pages/Sell";
import NotFound from "./pages/NotFound";

// Lazy-load all other routes to reduce initial bundle size
const QRCodePage = lazy(() => import("./pages/QRCode"));
const SignIn = lazy(() => import("./pages/SignIn"));
const SignUp = lazy(() => import("./pages/SignUp"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Favoritos = lazy(() => import("./pages/Favoritos"));
const PerfilUsuario = lazy(() => import("./pages/PerfilUsuario"));
const CriarAnuncio = lazy(() => import("./pages/CriarAnuncio"));
const AnuncioDetalhe = lazy(() => import("./pages/AnuncioDetalhe"));
const EditarAnuncio = lazy(() => import("./pages/EditarAnuncio"));
const CadastroLojas = lazy(() => import("./pages/CadastroLojas"));
const CadastroGruposProductos = lazy(() => import("./pages/CadastroGruposProductos"));
const CadastroProdutos = lazy(() => import("./pages/CadastroProdutos"));
const CadastroTabelasPreco = lazy(() => import("./pages/CadastroTabelasPreco"));
const CadastroVariantesLista = lazy(() => import("./pages/CadastroVariantesLista"));
const CadastroVariantes = lazy(() => import("./pages/CadastroVariantes"));
const CadastroEquipeDeVenda = lazy(() => import("./pages/CadastroEquipeDeVenda"));
const Agenda = lazy(() => import("./pages/Agenda"));
const SearchAnuncios = lazy(() => import("./pages/SearchAnuncios"));
const SearchProdutos = lazy(() => import("./pages/SearchProdutos"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Chat = lazy(() => import("./pages/Chat"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminManageAds = lazy(() => import("./pages/AdminManageAds"));
const AdminManageUsers = lazy(() => import("./pages/AdminManageUsers"));
const AdminBanners = lazy(() => import("./pages/AdminBanners"));
const AdminAnunciantes = lazy(() => import("./pages/AdminAnunciantes"));
const Menu = lazy(() => import("./pages/Menu"));
const MeusAnuncios = lazy(() => import("./pages/MeusAnuncios"));
const AnuncianteProfile = lazy(() => import("./pages/AnuncianteProfile"));

// Loading fallback component for lazy-loaded pages
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="space-y-4 text-center">
        <div className="inline-block">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
        </div>
        <p className="text-slate-600 font-medium">Carregando...</p>
      </div>
    </div>
  );
}

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/about" element={<About />} />
                <Route path="/browse" element={<Browse />} />
                <Route path="/sell" element={<Sell />} />
                <Route path="/qrcode" element={<Suspense fallback={<PageLoader />}><QRCodePage /></Suspense>} />
                <Route path="/auth/signin" element={<Suspense fallback={<PageLoader />}><SignIn /></Suspense>} />
                <Route path="/entrar" element={<Suspense fallback={<PageLoader />}><SignIn /></Suspense>} />
                <Route path="/auth/signup" element={<Suspense fallback={<PageLoader />}><SignUp /></Suspense>} />
                <Route path="/cadastrar" element={<Suspense fallback={<PageLoader />}><SignUp /></Suspense>} />
                <Route path="/esqueci-senha" element={<Suspense fallback={<PageLoader />}><ForgotPassword /></Suspense>} />
                <Route path="/reset-senha" element={<Suspense fallback={<PageLoader />}><ResetPassword /></Suspense>} />
                <Route path="/favoritos" element={<Suspense fallback={<PageLoader />}><Favoritos /></Suspense>} />
                <Route path="/meus-anuncios" element={<Suspense fallback={<PageLoader />}><MeusAnuncios /></Suspense>} />
                <Route path="/perfil" element={<Suspense fallback={<PageLoader />}><PerfilUsuario /></Suspense>} />
                <Route path="/profile" element={<Suspense fallback={<PageLoader />}><PerfilUsuario /></Suspense>} />
                <Route path="/anuncio/criar" element={<Suspense fallback={<PageLoader />}><CriarAnuncio /></Suspense>} />
                <Route path="/anuncio/:id" element={<Suspense fallback={<PageLoader />}><AnuncioDetalhe /></Suspense>} />
                <Route path="/anuncio/:id/editar" element={<Suspense fallback={<PageLoader />}><EditarAnuncio /></Suspense>} />
                <Route path="/anunciante/:id" element={<Suspense fallback={<PageLoader />}><AnuncianteProfile /></Suspense>} />
                <Route
                  path="/buscar"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <ErrorBoundary>
                        <SearchAnuncios />
                      </ErrorBoundary>
                    </Suspense>
                  }
                />
                <Route
                  path="/buscar-produtos"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <ErrorBoundary>
                        <SearchProdutos />
                      </ErrorBoundary>
                    </Suspense>
                  }
                />
                <Route path="/cadastros/lojas" element={<Suspense fallback={<PageLoader />}><CadastroLojas /></Suspense>} />
                <Route
                  path="/cadastros/grupos-productos"
                  element={<Suspense fallback={<PageLoader />}><CadastroGruposProductos /></Suspense>}
                />
                <Route
                  path="/cadastros/productos"
                  element={<Suspense fallback={<PageLoader />}><CadastroProdutos /></Suspense>}
                />
                <Route
                  path="/cadastros/tabelas-preco"
                  element={<Suspense fallback={<PageLoader />}><CadastroTabelasPreco /></Suspense>}
                />
                <Route
                  path="/cadastros/variantes"
                  element={<Suspense fallback={<PageLoader />}><CadastroVariantesLista /></Suspense>}
                />
                <Route
                  path="/cadastros/variantes/:productId"
                  element={<Suspense fallback={<PageLoader />}><CadastroVariantes /></Suspense>}
                />
                <Route
                  path="/cadastros/equipes-venda"
                  element={<Suspense fallback={<PageLoader />}><CadastroEquipeDeVenda /></Suspense>}
                />
                <Route path="/agenda" element={<Suspense fallback={<PageLoader />}><Agenda /></Suspense>} />
                <Route path="/agenda/:anuncianteId" element={<Suspense fallback={<PageLoader />}><Agenda /></Suspense>} />
                <Route path="/checkout/:anuncioId" element={<Suspense fallback={<PageLoader />}><Checkout /></Suspense>} />
                <Route path="/checkout" element={<Suspense fallback={<PageLoader />}><Checkout /></Suspense>} />
                <Route path="/chat" element={<Suspense fallback={<PageLoader />}><Chat /></Suspense>} />
                <Route path="/menu" element={<Suspense fallback={<PageLoader />}><Menu /></Suspense>} />
                <Route path="/admin/dashboard" element={<Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense>} />
                <Route path="/admin/anuncios" element={<Suspense fallback={<PageLoader />}><AdminManageAds /></Suspense>} />
                <Route path="/admin/usuarios" element={<Suspense fallback={<PageLoader />}><AdminManageUsers /></Suspense>} />
                <Route path="/admin/banners" element={<Suspense fallback={<PageLoader />}><AdminBanners /></Suspense>} />
                <Route path="/admin/anunciantes" element={<Suspense fallback={<PageLoader />}><AdminAnunciantes /></Suspense>} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
