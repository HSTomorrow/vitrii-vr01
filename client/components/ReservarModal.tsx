import { useState, useEffect } from "react";
import { CheckCircle2, Loader, Check } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ReservarModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anuncioId: number;
  anuncioTitulo: string;
}

type ModalStep = "confirm" | "success";

export default function ReservarModal({
  open,
  onOpenChange,
  anuncioId,
  anuncioTitulo,
}: ReservarModalProps) {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<ModalStep>("confirm");
  const [observacao, setObservacao] = useState("");

  useEffect(() => {
    if (open) {
      setStep("confirm");
      setObservacao("");
    }
  }, [open]);

  const createReservaMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/anuncios/${anuncioId}/reservas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id?.toString() || "",
        },
        body: JSON.stringify({ observacao: observacao || null }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao criar reserva");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Reserva criada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["anuncio-fotos", anuncioId] });
      setStep("success");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Erro ao criar reserva"
      );
    },
  });

  const handleClose = () => {
    onOpenChange(false);
  };

  if (!isLoggedIn) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reservar</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              Você precisa estar logado para reservar este produto
            </p>
            <button
              onClick={() => {
                onOpenChange(false);
                navigate("/auth/signin");
              }}
              className="inline-flex items-center gap-2 bg-vitrii-blue text-white px-6 py-2 rounded-lg font-semibold hover:bg-vitrii-blue-dark transition-colors"
            >
              Fazer Login
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        {step === "confirm" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                Reservar Produto
              </DialogTitle>
              <DialogDescription>
                Garanta "{anuncioTitulo}" para você. A quantidade disponível diminuirá.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Observações (opcional)
                </label>
                <textarea
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Ex: Retirar sexta-feira, cor preferida..."
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-vitrii-blue focus:outline-none resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleClose}
                  disabled={createReservaMutation.isPending}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => createReservaMutation.mutate()}
                  disabled={createReservaMutation.isPending}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {createReservaMutation.isPending ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Reservando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Confirmar Reserva
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}

        {step === "success" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Reserva Criada!
              </DialogTitle>
            </DialogHeader>
            <div className="text-center py-8">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-gray-700 mb-6">
                Você reservou "{anuncioTitulo}" com sucesso! O produto está garantido para você.
              </p>
              <button
                onClick={handleClose}
                className="inline-flex items-center gap-2 bg-vitrii-blue text-white px-6 py-2 rounded-lg font-semibold hover:bg-vitrii-blue-dark transition-colors"
              >
                <Check className="w-4 h-4" />
                Fechar
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
