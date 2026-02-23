import { useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Search,
  Plus,
  MessageCircle,
  User,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function BottomNavBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Routes that don't show bottom nav (login, admin, etc)
  const hiddenRoutes = [
    "/signin",
    "/signup",
    "/admin",
    "/forgot-password",
    "/reset-password",
  ];

  const isHidden = hiddenRoutes.some((route) =>
    location.pathname.startsWith(route)
  );

  if (isHidden) return null;

  const navItems = [
    {
      id: "home",
      label: "Home",
      icon: Home,
      route: "/",
      isActive: location.pathname === "/",
    },
    {
      id: "search",
      label: "Buscar",
      icon: Search,
      route: "/browse",
      isActive: location.pathname === "/browse",
    },
    {
      id: "publish",
      label: "Publicar",
      icon: Plus,
      route: user ? "/anuncio/criar" : "/signin",
      isActive: location.pathname.startsWith("/anuncio/criar"),
    },
    {
      id: "chat",
      label: "Chat",
      icon: MessageCircle,
      route: user ? "/chat" : "/signin",
      isActive: location.pathname === "/chat",
    },
    {
      id: "profile",
      label: "Perfil",
      icon: User,
      route: user ? "/perfil" : "/signin",
      isActive: location.pathname === "/perfil",
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-200">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.isActive;

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.route)}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-150 ${
                item.id === "publish"
                  ? "bg-vitrii-yellow text-vitrii-text relative -top-4"
                  : isActive
                    ? "text-vitrii-blue"
                    : "text-gray-500"
              }`}
              aria-label={item.label}
            >
              {item.id === "publish" ? (
                <div className="bg-vitrii-yellow rounded-full p-2.5 shadow-lg">
                  <Icon className="w-5 h-5 text-vitrii-text" />
                </div>
              ) : (
                <>
                  <Icon className={`w-5 h-5 ${isActive ? "font-bold" : ""}`} />
                  <span className="text-xs font-semibold">{item.label}</span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
