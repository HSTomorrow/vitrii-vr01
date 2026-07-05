import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import ReservarModal from "./ReservarModal";

interface ReservarButtonProps {
  anuncioId: number;
  anuncioTitulo: string;
  variant?: "icon" | "button";
  className?: string;
}

export default function ReservarButton({
  anuncioId,
  anuncioTitulo,
  variant = "icon",
  className = "",
}: ReservarButtonProps) {
  const [showModal, setShowModal] = useState(false);

  if (variant === "icon") {
    return (
      <>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowModal(true);
          }}
          className={`p-2 rounded-full transition-all shadow-lg hover:shadow-xl transform hover:scale-110 bg-white hover:bg-green-50 ${className}`}
          title="Reservar"
        >
          <CheckCircle2 className="w-5 h-5 text-green-600" />
        </button>
        <ReservarModal
          open={showModal}
          onOpenChange={setShowModal}
          anuncioId={anuncioId}
          anuncioTitulo={anuncioTitulo}
        />
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`w-full min-w-0 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 border-2 border-green-300 text-green-700 rounded-lg font-semibold hover:bg-green-50 transition-colors text-xs sm:text-sm leading-tight text-center ${className}`}
      >
        <CheckCircle2 className="w-4 h-4 shrink-0" />
        <span>Reservar</span>
      </button>
      <ReservarModal
        open={showModal}
        onOpenChange={setShowModal}
        anuncioId={anuncioId}
        anuncioTitulo={anuncioTitulo}
      />
    </>
  );
}
