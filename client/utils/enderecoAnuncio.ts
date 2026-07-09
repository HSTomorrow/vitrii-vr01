interface AnuncioEnderecoInput {
  endereco?: string | null;
  cidade?: string | null;
  estado?: string | null;
  ocultarEndereco?: boolean | null;
  anunciantes?: { endereco?: string | null } | null;
}

// Single source of truth for how an anúncio's address is resolved anywhere it's shown:
// the anúncio's own address wins when set; otherwise falls back to the anunciante's
// registered address; ocultarEndereco overrides both with "A consultar".
export function getEnderecoExibicao(anuncio: AnuncioEnderecoInput): string {
  if (anuncio.ocultarEndereco) return "A consultar";

  const enderecoAnuncio = [anuncio.endereco, anuncio.cidade, anuncio.estado]
    .filter(Boolean)
    .join(", ");

  return enderecoAnuncio || anuncio.anunciantes?.endereco || "";
}

// Whether a "Encontre no Mapa" link should be shown alongside the address.
export function podeExibirNoMapa(anuncio: AnuncioEnderecoInput): boolean {
  return !anuncio.ocultarEndereco && !!getEnderecoExibicao(anuncio);
}
