// Single source of truth for the Condição badge color, so every ad view (homepage,
// browse/search listings, ad detail page) stays visually consistent.
export function getCondicaoBadgeClass(condicao?: string | null): string {
  switch (condicao) {
    case "Novo":
      return "bg-green-100 text-green-700";
    case "Serviço/Projeto":
      return "bg-yellow-100 text-yellow-800";
    case "Seminovo":
    case "Usado":
    default:
      return "bg-slate-100 text-slate-700";
  }
}
