import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

export default function PublishButton() {
  const { user } = useAuth();
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    // Detect iPad and tablets specifically
    const ua = navigator.userAgent.toLowerCase();
    const isIpad = /ipad|android/.test(ua);

    // Also check viewport width for tablets
    const isTabletWidth = window.innerWidth >= 600 && window.innerWidth < 1024;

    setIsTablet(isIpad || isTabletWidth);

    // Listen for window resize
    const handleResize = () => {
      const width = window.innerWidth;
      setIsTablet(width >= 600 && width < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!user) return null;

  // Show on tablets/iPad (small floating button for mobile feel)
  // Hide on mobile (BottomNavBar handles it) and large desktop (use sticky header button)
  if (!isTablet) return null;

  return (
    <Link
      to="/anuncio/criar"
      className="fixed bottom-24 right-6 flex items-center justify-center p-3 bg-vitrii-yellow text-vitrii-text rounded-full shadow-xl hover:shadow-2xl hover:bg-vitrii-yellow-dark transition-all hover:scale-110 z-40"
      title="Publicar novo anúncio"
      aria-label="Publicar novo anúncio"
    >
      <Plus className="w-6 h-6" />
    </Link>
  );
}
