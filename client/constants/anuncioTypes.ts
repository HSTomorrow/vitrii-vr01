/**
 * Tipos de Anúncio com opções amigáveis e valores internos
 */
export const TIPO_ANUNCIO_OPTIONS = [
  { label: "Produto", value: "produto" },
  { label: "Serviço Especializado", value: "servico" },
  { label: "Evento", value: "evento" },
  { label: "Aulas e Cursos", value: "agenda_recorrente" },
  { label: "Vagas de Emprego", value: "oportunidade" },
] as const;

/**
 * Obtém o label amigável para um tipo de anúncio
 */
export const getTipoAnuncioLabel = (tipo: string): string => {
  const option = TIPO_ANUNCIO_OPTIONS.find((opt) => opt.value === tipo);
  return option?.label || tipo;
};

/**
 * Descrições de cada tipo de anúncio
 */
export const TIPO_ANUNCIO_DESCRIPTIONS: Record<string, string> = {
  produto: "Produtos físicos para venda",
  servico: "Serviços e consultorias especializadas",
  evento: "Eventos, workshops, shows e experiências",
  agenda_recorrente: "Agendas de Aulas, Cursos e Serviços Especializados",
  oportunidade: "Oportunidades profissionais e vagas de emprego",
};
