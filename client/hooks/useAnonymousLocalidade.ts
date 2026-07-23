import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "vitrii_localidade_anonima";
// Sentinel stored when the visitor explicitly picks "Todas as localidades" (as opposed
// to simply never having answered), so we don't ask again on their next visit.
const ALL_LOCALIDADES = "all";

export function useAnonymousLocalidade() {
  const [localidadeId, setLocalidadeIdState] = useState<number | null>(null);
  const [hasChosen, setHasChosen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) return;
    setHasChosen(true);
    setLocalidadeIdState(stored === ALL_LOCALIDADES ? null : parseInt(stored, 10));
  }, []);

  const chooseLocalidade = useCallback((id: number | null) => {
    localStorage.setItem(STORAGE_KEY, id === null ? ALL_LOCALIDADES : String(id));
    setLocalidadeIdState(id);
    setHasChosen(true);
  }, []);

  return { localidadeId, hasChosen, chooseLocalidade };
}
