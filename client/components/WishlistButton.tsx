import { useState } from "react";
import { Gift } from "lucide-react";
import WishlistModal from "./WishlistModal";

interface WishlistButtonProps {
  anuncioId: number;
  anuncioTitulo: string;
  anuncioPreco?: number;
  variant?: "icon" | "button";
  className?: string;
}

export default function WishlistButton({
  anuncioId,
  anuncioTitulo,
  anuncioPreco,
  variant = "icon",
  className = "",
}: WishlistButtonProps) {
  const [showModal, setShowModal] = useState(false);

  if (variant === "icon") {
    return (
      <>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowModal(true);
          }}
          className={`p-2 rounded-full transition-all shadow-lg hover:shadow-xl transform hover:scale-110 bg-white hover:bg-purple-50 ${className}`}
          title="Adicionar à Lista de Desejos"
        >
          <Gift className="w-5 h-5 text-purple-600" />
        </button>
        <WishlistModal
          open={showModal}
          onOpenChange={setShowModal}
          anuncioId={anuncioId}
          anuncioTitulo={anuncioTitulo}
          anuncioPreco={anuncioPreco}
        />
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-purple-300 text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors text-sm ${className}`}
      >
        <Gift className="w-4 h-4" />
        Lista de Desejos
      </button>
      <WishlistModal
        open={showModal}
        onOpenChange={setShowModal}
        anuncioId={anuncioId}
        anuncioTitulo={anuncioTitulo}
        anuncioPreco={anuncioPreco}
      />
    </>
  );
}
