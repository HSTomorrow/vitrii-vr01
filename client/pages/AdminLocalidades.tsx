import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import AdminLocalidadesManager from "@/components/AdminLocalidadesManager";
import { useEffect } from "react";

export default function AdminLocalidades() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect if not admin
  useEffect(() => {
    if (!user || user.tipoUsuario !== "adm") {
      navigate("/");
    }
  }, [user, navigate]);

  if (!user || user.tipoUsuario !== "adm") {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminLocalidadesManager />
      </main>

      <Footer />
    </div>
  );
}
