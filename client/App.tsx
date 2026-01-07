import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import About from "./pages/About";
import Browse from "./pages/Browse";
import Sell from "./pages/Sell";
import QRCodePage from "./pages/QRCode";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import PerfilUsuario from "./pages/PerfilUsuario";
import CriarAnuncio from "./pages/CriarAnuncio";
import AnuncioDetalhe from "./pages/AnuncioDetalhe";
import EditarAnuncio from "./pages/EditarAnuncio";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/sell" element={<Sell />} />
            <Route path="/qrcode" element={<QRCodePage />} />
            <Route path="/auth/signin" element={<SignIn />} />
          <Route path="/auth/signup" element={<SignUp />} />
          <Route path="/perfil" element={<PerfilUsuario />} />
          <Route path="/anuncio/criar" element={<CriarAnuncio />} />
            <Route path="/anuncio/:id" element={<AnuncioDetalhe />} />
            <Route path="/anuncio/:id/editar" element={<EditarAnuncio />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
