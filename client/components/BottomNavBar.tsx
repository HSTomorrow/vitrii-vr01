import { useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Search,
  Plus,
  MessageCircle,
  User,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// Routes that repurpose the central "+" button for their own quick-add action instead of
// publishing an ad. Each page listens for its `event` via window.addEventListener to open
// its own "Novo X" form/modal — see the matching useEffect in that page's component.
const CADASTRO_BUTTON_CONFIG: Record<string, { label: string; event: string; color: string }> = {
  "/minha-agenda": { label: "Evento", event: "addEvento", color: "bg-vitrii-green" },
  "/financeiro": { label: "Lançamento", event: "novoLancamento", color: "bg-vitrii-blue" },
  "/cadastro-lojas": { label: "Anunciante", event: "novoAnunciante", color: "bg-vitrii-blue" },
  "/cadastro-grupos-productos": { label: "Grupo", event: "novoGrupo", color: "bg-vitrii-blue" },
  "/cadastro-productos": { label: "Produto", event: "novoProduto", color: "bg-vitrii-blue" },
  "/cadastro-tabelas-preco": { label: "Tabela", event: "novaTabelaPreco", color: "bg-vitrii-blue" },
  "/cadastro-equipe-venda": { label: "Equipe", event: "novaEquipe", color: "bg-vitrii-blue" },
  "/cadastro-contatos": { label: "Contato", event: "novoContato", color: "bg-vitrii-blue" },
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

  // /cadastro-variantes/:productId is a dynamic route (variant editor for one produto) —
  // the bare /cadastro-variantes list page has no create-form of its own, so it's excluded.
  const isOnVariantesDetail =
    location.pathname.startsWith("/cadastro-variantes/") && location.pathname !== "/cadastro-variantes/";
  const cadastroConfig = isOnVariantesDetail
    ? { label: "Variante", event: "novaVariante", color: "bg-vitrii-blue" }
    : CADASTRO_BUTTON_CONFIG[location.pathname];

  const publishBgClass = cadastroConfig?.color || "bg-vitrii-yellow";
  const publishTextClass = cadastroConfig ? "text-white" : "text-vitrii-text";

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
      label: cadastroConfig?.label || "Publicar",
      icon: Plus,
      route: cadastroConfig ? "#" : user ? "/anuncio/criar" : "/signin",
      isActive: cadastroConfig ? false : location.pathname.startsWith("/anuncio/criar"),
      requiresAuth: true,
      onClick: cadastroConfig
        ? () => window.dispatchEvent(new CustomEvent(cadastroConfig.event))
        : undefined,
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
