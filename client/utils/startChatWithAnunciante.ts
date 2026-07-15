import { NavigateFunction } from "react-router-dom";

// Opens (or starts) an in-app chat with an anunciante, reusing the same
// dedupe-then-create pattern as ReservationManagementPanel.tsx's handleChatWithUser.
export async function startChatWithAnunciante({
  usuarioId,
  anuncianteId,
  assunto,
  navigate,
}: {
  usuarioId: number;
  anuncianteId: number;
  assunto: string;
  navigate: NavigateFunction;
}): Promise<void> {
  const listResponse = await fetch(`/api/conversas?usuarioId=${usuarioId}`);
  if (listResponse.ok) {
    const { data: conversas } = await listResponse.json();
    const existing = conversas?.find(
      (c: any) => c.usuarioId === usuarioId && c.anuncianteId === anuncianteId,
    );
    if (existing) {
      navigate(`/chat?conversaId=${existing.id}`);
      return;
    }
  }

  const createResponse = await fetch("/api/conversas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuarioId, anuncianteId, assunto }),
  });

  if (!createResponse.ok) throw new Error("Erro ao iniciar conversa");
  const { data: novaConversa } = await createResponse.json();
  navigate(`/chat?conversaId=${novaConversa.id}`);
}
