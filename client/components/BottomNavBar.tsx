import { useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Search,
  Plus,
  MessageCircle,
  User,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// Dispatch a custom event to notify the MinhaAgenda page to add an evento
const dispatchAddEventoEvent = () => {
  window.dispatchEvent(new CustomEvent("addEvento"));
};

// Dispatch a custom event to notify the Financeiro page to open "Novo Lançamento"
const dispatchNovoLancamentoEvent = () => {
  window.dispatchEvent(new CustomEvent("novoLancamento"));
};

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

  // Check if we're on the MinhaAgenda or Financeiro page, which repurpose the
  // central "+" button for their own quick-add action instead of publishing an ad.
  const isOnMinhaAgenda = location.pathname === "/minha-agenda";
  const isOnFinanceiro = location.pathname === "/financeiro";

  const publishBgClass = isOnMinhaAgenda
    ? "bg-vitrii-green"
    : isOnFinanceiro
      ? "bg-vitrii-blue"
      : "bg-vitrii-yellow";
  const publishTextClass = isOnMinhaAgenda || isOnFinanceiro ? "text-white" : "text-vitrii-text";

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
      label: isOnMinhaAgenda ? "Evento" : isOnFinanceiro ? "Lançamento" : "Publicar",
      icon: Plus,
      route: isOnMinhaAgenda || isOnFinanceiro ? "#" : user ? "/anuncio/criar" : "/signin",
      isActive: isOnMinhaAgenda || isOnFinanceiro ? false : location.pathname.startsWith("/anuncio/criar"),
      requiresAuth: true,
      onClick: isOnMinhaAgenda ? dispatchAddEventoEvent : isOnFinanceiro ? dispatchNovoLancamentoEvent : undefined,
    },
    {
      id: "chat",
      label: "Chat",
      icon: MessageCircle,
      route: "/chat",
      isActive: location.pathname === "/chat",
      requiresAuth: true,
    },
    {
      id: "profile",
      label: "Perfil",
      icon: User,
      route: user ? "/perfil" : "/signin",
      isActive: location.pathname === "/perfil",
      requiresAuth: true,
    },
  ].filter((item) => !item.requiresAuth || user);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-200">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item: any) => {
          const Icon = item.icon;
          const isActive = item.isActive;

          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.onClick) {
                  item.onClick();
                } else {
                  navigate(item.route);
                }
              }}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-150 ${
                item.id === "publish"
                  ? `${publishBgClass} ${publishTextClass} relative -top-4`
                  : isActive
                    ? "text-vitrii-blue"
                    : "text-gray-500"
              }`}
              aria-label={item.label}
            >
              {item.id === "publish" ? (
                <div className={`rounded-full p-2.5 shadow-lg ${publishBgClass}`}>
                  <Icon className={`w-5 h-5 ${publishTextClass}`} />
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
