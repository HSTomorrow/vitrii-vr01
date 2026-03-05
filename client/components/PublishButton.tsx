import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function PublishButton() {
  const { user } = useAuth();

  // Only show for tablets and up (md and above)
  // Hide on mobile where BottomNavBar takes care of it
  if (!user) return null;

  return (
    <Link
      to="/anuncio/criar"
      className="hidden md:fixed md:bottom-6 md:right-6 md:flex items-center justify-center gap-2 bg-vitrii-yellow text-vitrii-text p-4 rounded-full shadow-lg hover:shadow-xl hover:bg-vitrii-yellow-dark transition-all hover:scale-110 z-40 group"
      title="Publicar novo anúncio"
      aria-label="Publicar novo anúncio"
    >
      <Plus className="w-6 h-6" />
      <span className="hidden lg:inline font-semibold text-sm ml-1">Publicar</span>
    </Link>
  );
}
