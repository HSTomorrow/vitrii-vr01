import { Store } from "lucide-react";

interface AnuncianteIconColorProps {
  anuncianteName: string;
  iconColor?: string;
  className?: string;
}

// Map color names to Tailwind classes
const colorMap: Record<string, { bg: string; text: string }> = {
  azul: { bg: "bg-blue-500", text: "text-blue-600" },
  verde: { bg: "bg-green-500", text: "text-green-600" },
  rosa: { bg: "bg-pink-500", text: "text-pink-600" },
  vermelho: { bg: "bg-red-500", text: "text-red-600" },
  laranja: { bg: "bg-orange-500", text: "text-orange-600" },
};

export default function AnuncianteIconColor({
  anuncianteName,
  iconColor = "azul",
  className = "w-9 h-9",
}: AnuncianteIconColorProps) {
  const colors = colorMap[iconColor] || colorMap["azul"];

  return (
    <div
      className={`${className} rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all ${colors.bg}`}
      title={anuncianteName}
    >
      <Store className="w-5 h-5 text-white" />
    </div>
  );
}
