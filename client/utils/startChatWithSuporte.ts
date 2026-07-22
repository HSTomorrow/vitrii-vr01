import { NavigateFunction } from "react-router-dom";

// Opens (or starts) the current user's support chat, mirroring the
// dedupe-then-create pattern of startChatWithAnunciante.ts — the dedupe here
// happens server-side in GET /api/suporte/conversa.
export async function startChatWithSuporte(
  navigate: NavigateFunction,
): Promise<void> {
  const response = await fetch("/api/suporte/conversa");
  if (!response.ok) throw new Error("Erro ao iniciar chat com suporte");

  const { data } = await response.json();
  navigate(`/chat?conversaId=${data.conversaId}`);
}
