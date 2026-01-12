import React from "react";
import { X } from "lucide-react";

interface ImageZoomModalProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

const ImageZoomModal: React.FC<ImageZoomModalProps> = ({
  imageUrl,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-screen"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt="Zoom"
          className="max-w-full max-h-screen object-contain rounded-lg"
        />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white rounded-full hover:bg-gray-200 transition-colors"
        >
          <X className="w-6 h-6 text-black" />
        </button>
      </div>
    </div>
  );
};

export default ImageZoomModal;
