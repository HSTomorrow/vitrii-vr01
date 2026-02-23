import { useState } from "react";
import { Search, X } from "lucide-react";

interface SearchOverlayProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  placeholder?: string;
}

export default function SearchOverlay({
  searchTerm,
  onSearchChange,
  placeholder = "Buscar anúncios...",
}: SearchOverlayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="md:hidden w-full">
      {!isExpanded ? (
        // Collapsed state - icon button
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full flex items-center gap-2 bg-gray-100 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors"
        >
          <Search className="w-5 h-5" />
          <span className="text-sm">{placeholder}</span>
        </button>
      ) : (
        // Expanded state - full search overlay
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex flex-col">
          {/* Search Bar */}
          <div className="bg-white p-4 shadow-md flex items-center gap-2">
            <button
              onClick={() => {
                setIsExpanded(false);
                onSearchChange("");
              }}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                autoFocus
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vitrii-blue focus:border-transparent"
              />
            </div>
          </div>

          {/* Search Results Area (optional - can be populated with suggestions) */}
          <div className="flex-1 overflow-y-auto bg-white">
            {searchTerm ? (
              <div className="p-4">
                <p className="text-sm text-gray-500">
                  Procurando por: <strong>{searchTerm}</strong>
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Deslize para baixo para ver os resultados da busca
                </p>
              </div>
            ) : (
              <div className="p-4 text-center text-gray-400 mt-8">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">Digite para buscar</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
