import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnuncioForm from "@/components/AnuncioForm";

export default function CriarAnuncio() {
  const navigate = useNavigate();

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
