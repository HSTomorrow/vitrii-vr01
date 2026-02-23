import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { FileText, ChevronRight } from "lucide-react";

export default function TermsOfUse() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      {/* Page Header */}
      <section className="bg-vitrii-gray-light border-b border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-8 h-8 text-vitrii-blue" />
            <h1 className="text-3xl md:text-4xl font-bold text-vitrii-text">
              Termos de Uso
            </h1>
          </div>
          <p className="text-lg text-vitrii-text-secondary max-w-2xl">
            Direitos e responsabilidades ao usar o Vitrii Marketplace
          </p>
          <p className="text-sm text-vitrii-text-secondary mt-4">
            Última atualização: Fevereiro de 2024
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Table of Contents */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-12">
            <h2 className="font-semibold text-vitrii-text mb-4">Índice</h2>
            <ul className="space-y-2 text-sm">
              {[
                "1. Aceitação dos Termos",
                "2. Descrição do Serviço",
                "3. Requisitos para Uso",
                "4. Conta do Usuário",
                "5. Proibições",
                "6. Direitos de Propriedade Intelectual",
                "7. Responsabilidade de Vendedores",
                "8. Responsabilidade de Compradores",
                "9. Pagamentos e Refunds",
                "10. Isenção de Responsabilidade",
                "11. Limitação de Responsabilidade",
                "12. Resolução de Disputas",
                "13. Suspensão e Encerramento",
                "14. Modificações dos Termos",
                "15. Lei Aplicável e Jurisdição",
                "16. Contato",
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-vitrii-blue flex-shrink-0" />
                  <a href={`#section-${idx + 1}`} className="text-vitrii-blue hover:underline">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Sections */}
          <div className="space-y-12">
            {/* Section 1 */}
            <section id="section-1">
              <h2 className="text-2xl font-bold text-vitrii-text mb-4">
                1. Aceitação dos Termos
              </h2>
              <div className="space-y-4 text-vitrii-text-secondary">
                <p>
                  Ao acessar e usar o Vitrii Marketplace ("Plataforma"), você concorda em estar vinculado por estes Termos de Uso. Se não concordar com qualquer parte dos termos, você não está autorizado a usar a plataforma.
                </p>
                <p>
                  A Plataforma é operada pela HeresTomorrow, e esses termos constituem um acordo vinculativo entre você e a HeresTomorrow.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section id="section-2">
              <h2 className="text-2xl font-bold text-vitrii-text mb-4">
                2. Descrição do Serviço
              </h2>
              <div className="space-y-4 text-vitrii-text-secondary">
                <p>
                  O Vitrii é um marketplace online que permite que vendedores anunciem produtos e serviços, e compradores os procurem e adquiram. A plataforma também oferece:
                </p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Sistema de QR Code para vitrines digitais dinâmicas</li>
                  <li>Chat e sistema de mensagens entre usuários</li>
                  <li>Sistema de pagamento via Pix</li>
                  <li>Gerenciamento de anúncios e perfil de usuário</li>
                </ul>
                <p className="mt-4 pt-4 border-t border-gray-300">
                  O Vitrii atua como intermediário e não é responsável pelas transações entre vendedores e compradores.
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section id="section-3">
              <h2 className="text-2xl font-bold text-vitrii-text mb-4">
                3. Requisitos para Uso
              </h2>
              <div className="space-y-4 text-vitrii-text-secondary">
                <p>
                  Para usar a Plataforma, você deve:
                </p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Ter no mínimo 18 anos de idade</li>
                  <li>Fornecer informações precisas e completas durante o registro</li>
                  <li>Aceitar estes Termos de Uso e a Política de Privacidade</li>
                  <li>Cumprir com todas as leis e regulações aplicáveis</li>
                  <li>Manter a confidencialidade de sua senha</li>
                </ul>
              </div>
            </section>

            {/* Section 4 */}
            <section id="section-4">
              <h2 className="text-2xl font-bold text-vitrii-text mb-4">
                4. Conta do Usuário
              </h2>
              <div className="space-y-4 text-vitrii-text-secondary">
                <p>
                  Ao criar uma conta, você é responsável por:
                </p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Manter a confidencialidade de suas credenciais de login</li>
                  <li>Todas as atividades que ocorrem em sua conta</li>
                  <li>Notificar-nos imediatamente de qualquer uso não autorizado</li>
                  <li>Manter suas informações de perfil precisas e atualizadas</li>
                </ul>
                <p className="mt-4 pt-4 border-t border-gray-300">
                  Você é responsável por qualquer atividade em sua conta, independentemente de você a ter autorizado ou não.
                </p>
              </div>
            </section>

            {/* Section 5 */}
            <section id="section-5">
              <h2 className="text-2xl font-bold text-vitrii-text mb-4">
                5. Proibições
              </h2>
              <div className="space-y-4 text-vitrii-text-secondary">
                <p>
                  Você concorda que não irá:
                </p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Anunciar produtos ou serviços ilegais ou proibidos</li>
                  <li>Enganar ou defraudar compradores ou vendedores</li>
                  <li>Usar a plataforma para atividades criminosas</li>
                  <li>Violar direitos de propriedade intelectual de terceiros</li>
                  <li>Enviar spam, phishing ou conteúdo malicioso</li>
                  <li>Tentar contornar sistemas de segurança</li>
                  <li>Usar de forma que prejudique a plataforma ou outros usuários</li>
                  <li>Fazer transações fora da plataforma para evitar taxas</li>
                  <li>Criar múltiplas contas para eludir restrições</li>
                  <li>Assediar, ameaçar ou abusar outros usuários</li>
                </ul>
              </div>
            </section>

            {/* Section 6 */}
            <section id="section-6">
              <h2 className="text-2xl font-bold text-vitrii-text mb-4">
                6. Direitos de Propriedade Intelectual
              </h2>
              <div className="space-y-4 text-vitrii-text-secondary">
                <p>
                  A plataforma e seus conteúdos (design, funcionalidades, código) são propriedade do Vitrii e protegidos por leis de direitos autorais.
                </p>
                <p>
                  Você concede ao Vitrii licença para usar conteúdo que você publica (descrições, imagens, etc.) para operar a plataforma. Você retém a propriedade do seu conteúdo.
                </p>
                <p>
                  Você garante que tem o direito de publicar qualquer conteúdo que compartilha e que não infringe direitos de terceiros.
                </p>
              </div>
            </section>

            {/* Section 7 */}
            <section id="section-7">
              <h2 className="text-2xl font-bold text-vitrii-text mb-4">
                7. Responsabilidade de Vendedores
              </h2>
              <div className="space-y-4 text-vitrii-text-secondary">
                <p>
                  Os vendedores são responsáveis por:
                </p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Fornecer descrições precisas e completas dos produtos/serviços</li>
                  <li>Incluir fotos precisas e representativas</li>
                  <li>Manter estoque atualizado</li>
                  <li>Cumprir com leis de proteção ao consumidor</li>
                  <li>Entregar produtos conforme descrito no anúncio</li>
                  <li>Fornecer informações sobre direitos do consumidor</li>
                  <li>Responder prontamente aos compradores</li>
                </ul>
                <p className="mt-4 pt-4 border-t border-gray-300">
                  <strong>Produtos Proibidos:</strong> Não é permitido vender armas, drogas, itens roubados ou outros produtos ilegais.
                </p>
              </div>
            </section>

            {/* Section 8 */}
            <section id="section-8">
              <h2 className="text-2xl font-bold text-vitrii-text mb-4">
                8. Responsabilidade de Compradores
              </h2>
              <div className="space-y-4 text-vitrii-text-secondary">
                <p>
                  Os compradores são responsáveis por:
                </p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Fornecer informações de contato precisas</li>
                  <li>Avaliar adequadamente produtos antes de comprar</li>
                  <li>Cumprir com termos de entrega acordados</li>
                  <li>Ser justo e honesto em avaliações e feedback</li>
                  <li>Comunicar-se respeitosamente com vendedores</li>
                </ul>
              </div>
            </section>

            {/* Section 9 */}
            <section id="section-9">
              <h2 className="text-2xl font-bold text-vitrii-text mb-4">
                9. Pagamentos e Refunds
              </h2>
              <div className="space-y-4 text-vitrii-text-secondary">
                <p>
                  <strong>Pagamento:</strong> Aceitamos Pix como método de pagamento. Ao fazer uma compra, você autoriza o Vitrii a processar o pagamento.
                </p>
                <p>
                  <strong>Taxas de Venda:</strong> Vendedores podem publicar até 3 anúncios gratuitamente por mês. Anúncios adicionais custam R$ 0,99 por dia.
                </p>
                <p>
                  <strong>Reembolsos:</strong> Reembolsos devem ser negociados entre comprador e vendedor. O Vitrii não processa reembolsos diretamente.
                </p>
                <p>
                  <strong>Disputas de Pagamento:</strong> Qualquer disputa deve ser reportada dentro de 30 dias. O Vitrii investigará e mediará quando apropriado.
                </p>
              </div>
            </section>

            {/* Section 10 */}
            <section id="section-10">
              <h2 className="text-2xl font-bold text-vitrii-text mb-4">
                10. Isenção de Responsabilidade
              </h2>
              <div className="space-y-4 text-vitrii-text-secondary bg-yellow-50 p-6 rounded-lg">
                <p>
                  <strong>A plataforma é fornecida "CONFORME ESTÁ"</strong> sem garantias de qualquer tipo, expressas ou implícitas.
                </p>
                <p>
                  O Vitrii não garante que:
                </p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Os serviços estarão sempre disponíveis ou ininterruptos</li>
                  <li>Erros serão corrigidos</li>
                  <li>A qualidade atenderá suas expectativas</li>
                </ul>
                <p className="mt-4 pt-4 border-t border-yellow-200">
                  O Vitrii não é responsável por:
                </p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Qualidade dos produtos/serviços vendidos</li>
                  <li>Comportamento de compradores ou vendedores</li>
                  <li>Problemas de entrega ou logística</li>
                  <li>Disputas comerciais entre usuários</li>
                </ul>
              </div>
            </section>

            {/* Section 11 */}
            <section id="section-11">
              <h2 className="text-2xl font-bold text-vitrii-text mb-4">
                11. Limitação de Responsabilidade
              </h2>
              <div className="space-y-4 text-vitrii-text-secondary">
                <p>
                  Em nenhuma circunstância o Vitrii será responsável por danos indiretos, incidentais, especiais, consequentes ou punitivos.
                </p>
                <p>
                  Sua responsabilidade total não excedera o valor que você pagou ao Vitrii nos últimos 12 meses.
                </p>
              </div>
            </section>

            {/* Section 12 */}
            <section id="section-12">
              <h2 className="text-2xl font-bold text-vitrii-text mb-4">
                12. Resolução de Disputas
              </h2>
              <div className="space-y-4 text-vitrii-text-secondary">
                <p>
                  As disputas entre usuários devem ser resolvidas diretamente entre as partes quando possível.
                </p>
                <p>
                  Se as partes não conseguirem resolver, elas podem solicitar mediação do Vitrii enviando uma reclamação detalhada para:
                </p>
                <p className="font-semibold text-vitrii-text">
                  contato@herestomorrow.com
                </p>
                <p>
                  O Vitrii tentará mediar dentro de 7 dias úteis. Se a mediação falhar, o Vitrii pode encerrar a conta de qualquer usuário que violar estes termos.
                </p>
              </div>
            </section>

            {/* Section 13 */}
            <section id="section-13">
              <h2 className="text-2xl font-bold text-vitrii-text mb-4">
                13. Suspensão e Encerramento
              </h2>
              <div className="space-y-4 text-vitrii-text-secondary">
                <p>
                  O Vitrii pode suspender ou encerrar sua conta se:
                </p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Você violar estes Termos de Uso</li>
                  <li>Você se envolver em atividades fraudulentas</li>
                  <li>Você assediar ou ameaçar outros usuários</li>
                  <li>Você não usar a conta por 2 anos consecutivos</li>
                </ul>
                <p className="mt-4 pt-4 border-t border-gray-300">
                  Você também pode encerrar sua conta a qualquer momento contactando-nos.
                </p>
              </div>
            </section>

            {/* Section 14 */}
            <section id="section-14">
              <h2 className="text-2xl font-bold text-vitrii-text mb-4">
                14. Modificações dos Termos
              </h2>
              <div className="space-y-4 text-vitrii-text-secondary">
                <p>
                  O Vitrii pode modificar estes Termos a qualquer momento. Notificaremos você sobre mudanças significativas por email ou postando a versão atualizada aqui.
                </p>
                <p>
                  Seu uso continuado da plataforma após mudanças significa sua aceitação dos Termos atualizados.
                </p>
              </div>
            </section>

            {/* Section 15 */}
            <section id="section-15">
              <h2 className="text-2xl font-bold text-vitrii-text mb-4">
                15. Lei Aplicável e Jurisdição
              </h2>
              <div className="space-y-4 text-vitrii-text-secondary">
                <p>
                  Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil.
                </p>
                <p>
                  Qualquer ação legal ou disputa resultará da jurisdição dos tribunais do Brasil, especificamente do estado do Rio Grande do Sul.
                </p>
              </div>
            </section>

            {/* Section 16 */}
            <section id="section-16">
              <h2 className="text-2xl font-bold text-vitrii-text mb-4">
                16. Contato
              </h2>
              <div className="space-y-4 text-vitrii-text-secondary bg-gray-50 p-6 rounded-lg">
                <p>
                  Se tiver dúvidas sobre estes Termos de Uso:
                </p>
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold text-vitrii-text">Email:</p>
                    <a href="mailto:contato@herestomorrow.com" className="text-vitrii-blue hover:underline">
                      contato@herestomorrow.com
                    </a>
                  </div>
                  <div>
                    <p className="font-semibold text-vitrii-text">Telefone/WhatsApp:</p>
                    <a href="https://wa.me/5551991930384" target="_blank" rel="noopener noreferrer" className="text-vitrii-blue hover:underline">
                      +55 51 99193-0384
                    </a>
                  </div>
                  <div>
                    <p className="font-semibold text-vitrii-text">Horário de Atendimento:</p>
                    <p>Segunda a Sexta: 9h às 18h (Horário de Brasília)</p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Navigation Links */}
          <div className="mt-16 pt-8 border-t border-gray-300 flex justify-between items-center">
            <Link
              to="/privacidade"
              className="text-vitrii-blue hover:underline font-semibold"
            >
              ← Ver Política de Privacidade
            </Link>
            <Link
              to="/ajuda-e-contato"
              className="text-vitrii-blue hover:underline font-semibold"
            >
              Voltar para Ajuda e Contato →
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
