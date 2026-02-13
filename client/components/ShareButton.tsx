import { Share2 } from "lucide-react";
import { useState } from "react";
import ShareModal from "./ShareModal";

interface ShareButtonProps {
  title: string;
  url: string;
  whatsappPhone?: string;
  whatsappMessage?: string;
  className?: string;
  variant?: "icon" | "button";
}

export default function ShareButton({
  title,
  url,
  whatsappPhone,
  whatsappMessage,
  className = "",
  variant = "icon",
}: ShareButtonProps) {
  const [showShareModal, setShowShareModal] = useState(false);

  if (variant === "icon") {
    return (
      <>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowShareModal(true);
          }}
          className={`p-2 rounded-full transition-all shadow-lg hover:shadow-xl transform hover:scale-110 bg-white hover:bg-gray-100 ${className}`}
          title="Compartilhar"
        >
          <Share2 className="w-5 h-5 text-gray-600" />
        </button>
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          title={title}
          url={url}
          whatsappPhone={whatsappPhone}
          whatsappMessage={whatsappMessage}
        />
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowShareModal(true)}
        className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 text-vitrii-text rounded-lg font-semibold hover:bg-gray-50 transition-colors ${className}`}
      >
        <Share2 className="w-4 h-4" />
        Compartilhar
      </button>
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title={title}
        url={url}
        whatsappPhone={whatsappPhone}
        whatsappMessage={whatsappMessage}
      />
    </>
  );
}
