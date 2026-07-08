import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { DollarSign } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Pagination from "@/components/Pagination";
import { formatCurrencyDisplay } from "@/utils/formatCurrency";

interface LancamentoAdmin {
  id: number;
  origem: string;
  categoria: string;
  descricao?: string;
  valor: string;
  status: string;
  dataCriacao: string;
  anunciante: { id: number; nome: string };
  contato?: { id: number; nome: string };
}

const STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente",
  pix_gerado: "Pix Gerado",
  comprovante_enviado: "Comprovante Enviado",
  pago: "Pago",
  cancelado: "Cancelado",
};

const ORIGEM_LABELS: Record<string, string> = {
  avulso: "Manual",
  contrato: "Contrato",
  mensalidade: "Contrato",
  agenda: "Agenda",
  anuncio: "Anúncio",
};

export default function AdminFinanceiro() {
  const { user } = useAuth();
  const isAdmin = user?.tipoUsuario === "adm";
  const [filterStatus, setFilterStatus] = useState("");
  const [filterOrigem, setFilterOrigem] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const { data: lancamentos = [], isLoading } = useQuery<LancamentoAdmin[]>({
    queryKey: ["admin-lancamentos-financeiros", filterStatus, filterOrigem],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus) params.set("status", filterStatus);
      if (filterOrigem) params.set("origem", filterOrigem);
      const response = await fetch(`/api/admin/lancamentos-financeiros?${params}`);
      if (!response.ok) throw new Error("Erro ao buscar lançamentos");
      const result = await response.json();
      return result.data || [];
    },
    enabled: isAdmin,
  });

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <div className="flex-1 max-w-4xl mx-auto px-4 py-12 text-center text-vitrii-text-secondary">
          Acesso restrito a administradores.
        </div>
        <Footer />
      </div>
    );
  }

  const totalGeral = lancamentos.reduce((sum, l) => sum + parseFloat(l.valor), 0);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const lancamentosPagina = lancamentos.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterOrigem]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-6">
          <DollarSign className="w-8 h-8 text-vitrii-blue" />
          <h1 className="text-3xl font-bold text-vitrii-text">Financeiro - Visão Geral</h1>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Todos os status</option>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select
            value={filterOrigem}
            onChange={(e) => setFilterOrigem(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Todas as origens</option>
            <option value="agenda">Agenda</option>
            <option value="contrato">Contrato (manual)</option>
            <option value="mensalidade">Contrato (automático)</option>
            <option value="avulso">Manual</option>
            <option value="anuncio">Anúncio</option>
          </select>
          <div className="ml-auto text-sm text-vitrii-text-secondary">
            Total no filtro: <span className="font-bold text-vitrii-text">{formatCurrencyDisplay(totalGeral)}</span> ({lancamentos.length})
          </div>
        </div>

        {isLoading ? (
          <p className="text-center text-vitrii-text-secondary py-12">Carregando...</p>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase text-vitrii-text-secondary">
                  <tr>
                    <th className="px-4 py-3">Anunciante</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Categoria</th>
                    <th className="px-4 py-3">Origem</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Valor</th>
                    <th className="px-4 py-3">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {lancamentosPagina.map((l) => (
                    <tr key={l.id} className="border-t border-gray-100">
                      <td className="px-4 py-3">{l.anunciante.nome}</td>
                      <td className="px-4 py-3">{l.contato?.nome || "-"}</td>
                      <td className="px-4 py-3">{l.categoria}</td>
                      <td className="px-4 py-3">{ORIGEM_LABELS[l.origem] || l.origem}</td>
                      <td className="px-4 py-3">{STATUS_LABELS[l.status] || l.status}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatCurrencyDisplay(parseFloat(l.valor))}</td>
                      <td className="px-4 py-3 text-vitrii-text-secondary">
                        {new Date(l.dataCriacao).toLocaleDateString("pt-BR")}
                      </td>
                    </tr>
                  ))}
                  {lancamentos.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-vitrii-text-secondary">
                        Nenhum lançamento encontrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            {lancamentos.length === 0 ? (
              <div className="md:hidden px-4 py-12 text-center text-vitrii-text-secondary border border-gray-200 rounded-lg">
                Nenhum lançamento encontrado
              </div>
            ) : (
              <div className="md:hidden space-y-3">
                {lancamentosPagina.map((l) => (
                  <div key={l.id} className="border border-gray-200 rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-vitrii-text truncate">{l.anunciante.nome}</p>
                        <p className="text-sm text-vitrii-text-secondary truncate">{l.contato?.nome || "-"}</p>
                      </div>
                      <span className="flex-shrink-0 font-bold text-vitrii-text">
                        {formatCurrencyDisplay(parseFloat(l.valor))}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-vitrii-text-secondary">
                      <span className="px-2 py-0.5 rounded-full bg-gray-100">{l.categoria}</span>
                      <span className="px-2 py-0.5 rounded-full bg-gray-100">{ORIGEM_LABELS[l.origem] || l.origem}</span>
                      <span className="px-2 py-0.5 rounded-full bg-gray-100">{STATUS_LABELS[l.status] || l.status}</span>
                      <span className="ml-auto">{new Date(l.dataCriacao).toLocaleDateString("pt-BR")}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Pagination
              currentPage={currentPage}
              totalItems={lancamentos.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
