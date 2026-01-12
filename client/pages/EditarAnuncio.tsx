import { useNavigate, useParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnuncioForm from "@/components/AnuncioForm";

export default function EditarAnuncio() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) {
    navigate("/sell");
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-vitrii-gray-light">
      <Header />
      <main className="flex-1">
        <AnuncioForm 
          anuncioId={parseInt(id)}
          onSuccess={() => navigate(`/anuncio/${id}`)}
        />
      </main>
      <Footer />
    </div>
  );
}
