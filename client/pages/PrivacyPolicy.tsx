import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Shield, ChevronRight } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      {/* Page Header */}
      <section className="bg-vitrii-gray-light border-b border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-vitrii-blue" />
            <h1 className="text-3xl md:text-4xl font-bold text-vitrii-text">
              Política de Privacidade
            </h1>
          </div>
          <p className="text-lg text-vitrii-text-secondary max-w-2xl">
            Como protegemos seus dados pessoais no Vitrii
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
                "1. Informações que Coletamos",
                "2. Como Usamos Suas Informações",
                "3. Compartilhamento de Dados",
                "4. Segurança de Dados",
                "5. Seus Direitos",
                "6. Cookies e Rastreamento",
                "7. Retenção de Dados",
                "8. Alterações nesta Política",
                "9. Contato",
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
                1. Informações que Coletamos
              </h2>
              <div className="space-y-4 text-vitrii-text-secondary">
                <p>
                  Coletamos várias categorias de informações para fornecer, melhorar e personalizar nossos serviços:
                </p>
                <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                  <div>
                    <h3 className="font-semibold text-vitrii-text mb-2">
                      Informações de Conta
                    </h3>
                    <p>
                      Nome completo, email, CPF/CNPJ, telefone, endereço e dados de identificação que você fornece ao se registrar.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-vitrii-text mb-2">
                      Informações de Transação
                    </h3>
                    <p>
                      Histórico de compras, vendas, pagamentos, QR Code scans e comunicações com outros usuários.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-vitrii-text mb-2">
                      Informações Técnicas
                    </h3>
                    <p>
                      Endereço IP, tipo de navegador, sistema operacional, páginas visitadas e ações realizadas no site.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-vitrii-text mb-2">
                      Informações de Localização
                    </h3>
                    <p>
                      Localidade selecionada, geolocalização aproximada para filtros de busca (com sua permissão).
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section id="section-2">
              <h2 className="text-2xl font-bold text-vitrii-text mb-4">
                2. Como Usamos Suas Informações
              </h2>
              <div className="space-y-4 text-vitrii-text-secondary">
                <p>
                  Utilizamos as informações coletadas para:
                </p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Criar e gerenciar sua conta no Vitrii</li>
                  <li>Processar transações e pagamentos via Pix</li>
                  <li>Fornecer suporte ao cliente</li>
                  <li>Enviar notificações sobre sua conta e atividades</li>
                  <li>Melhorar e personalizar sua experiência</li>
                  <li>Detectar fraudes e atividades maliciosas</li>
                  <li>Cumprir obrigações legais</li>
                  <li>Enviar comunicações de marketing (com sua permissão)</li>
                </ul>
              </div>
            </section>

            {/* Section 3 */}
            <section id="section-3">
              <h2 className="text-2xl font-bold text-vitrii-text mb-4">
                3. Compartilhamento de Dados
              </h2>
              <div className="space-y-4 text-vitrii-text-secondary">
                <p>
                  Podemos compartilhar suas informações com:
                </p>
                <ul className="space-y-3 list-disc list-inside">
                  <li>
                    <strong>Outros usuários:</strong> Seus dados públicos de perfil são visíveis para compradores e vendedores
                  </li>
                  <li>
                    <strong>Prestadores de serviços:</strong> Provedores de pagamento, hospedagem e análise
                  </li>
                  <li>
                    <strong>Autoridades legais:</strong> Quando obrigado por lei ou ordem judicial
                  </li>
                  <li>
                    <strong>Parceiros de negócios:</strong> Apenas com sua consentimento prévio
                  </li>
                </ul>
                <p className="mt-4 pt-4 border-t border-gray-300">
                  <strong>Não vendemos</strong> seus dados pessoais para terceiros.
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section id="section-4">
              <h2 className="text-2xl font-bold text-vitrii-text mb-4">
                4. Segurança de Dados
              </h2>
              <div className="space-y-4 text-vitrii-text-secondary">
                <p>
                  Implementamos medidas de segurança técnicas, administrativas e físicas para proteger seus dados pessoais contra acesso não autorizado, alteração, divulgação ou destruição.
                </p>
                <p>
                  Isso inclui:
                </p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Encriptação SSL/TLS para transmissão de dados</li>
                  <li>Firewalls e sistemas de detecção de intrusão</li>
                  <li>Controle de acesso baseado em roles</li>
                  <li>Auditorias de segurança regulares</li>
                  <li>Backup regular de dados</li>
                </ul>
                <p className="mt-4 pt-4 border-t border-gray-300">
                  <strong>Nota:</strong> Nenhum sistema é 100% seguro. Enquanto esforçamos para proteger seus dados, não podemos garantir segurança absoluta.
                </p>
              </div>
            </section>

            {/* Section 5 */}
            <section id="section-5">
              <h2 className="text-2xl font-bold text-vitrii-text mb-4">
                5. Seus Direitos
              </h2>
              <div className="space-y-4 text-vitrii-text-secondary">
                <p>
                  De acordo com a Lei Geral de Proteção de Dados (LGPD) e outras legislações aplicáveis, você tem direito a:
                </p>
                <ul className="space-y-3 list-disc list-inside">
                  <li>
                    <strong>Acessar:</strong> Solicitar cópia dos dados pessoais que mantemos sobre você
                  </li>
                  <li>
                    <strong>Corrigir:</strong> Solicitar correção de dados imprecisos ou incompletos
                  </li>
                  <li>
                    <strong>Deletar:</strong> Solicitar exclusão de seus dados (direito ao esquecimento)
                  </li>
                  <li>
                    <strong>Portabilidade:</strong> Solicitar transferência de seus dados em formato estruturado
                  </li>
                  <li>
                    <strong>Oposição:</strong> Opor-se ao processamento de seus dados
                  </li>
                  <li>
                    <strong>Consentimento:</strong> Revogar seu consentimento a qualquer momento
                  </li>
                </ul>
                <p className="mt-4 pt-4 border-t border-gray-300">
                  Para exercer esses direitos, entre em contato conosco em{" "}
                  <a href="mailto:contato@herestomorrow.com" className="text-vitrii-blue hover:underline font-semibold">
                    contato@herestomorrow.com
                  </a>
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section id="section-6">
              <h2 className="text-2xl font-bold text-vitrii-text mb-4">
                6. Cookies e Rastreamento
              </h2>
              <div className="space-y-4 text-vitrii-text-secondary">
                <p>
                  Usamos cookies e tecnologias semelhantes para:
                </p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Lembrar suas preferências e configurações</li>
                  <li>Manter você conectado</li>
                  <li>Analisar como você usa nossos serviços</li>
                  <li>Prevenir fraudes e problemas de segurança</li>
                </ul>
                <p className="mt-4 pt-4 border-t border-gray-300">
                  Você pode desabilitar cookies em suas configurações de navegador, mas isso pode afetar a funcionalidade de alguns recursos.
                </p>
              </div>
            </section>

            {/* Section 7 */}
            <section id="section-7">
              <h2 className="text-2xl font-bold text-vitrii-text mb-4">
                7. Retenção de Dados
              </h2>
              <div className="space-y-4 text-vitrii-text-secondary">
                <p>
                  Retemos seus dados pessoais pelo tempo necessário para:
                </p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Manter sua conta ativa</li>
                  <li>Cumprir obrigações legais</li>
                  <li>Resolver disputas e cobranças</li>
                  <li>Melhorar nossos serviços</li>
                </ul>
                <p className="mt-4 pt-4 border-t border-gray-300">
                  Após a exclusão da conta, retemos alguns dados por um período limitado conforme exigido por lei ou para fins legítimos.
                </p>
              </div>
            </section>

            {/* Section 8 */}
            <section id="section-8">
              <h2 className="text-2xl font-bold text-vitrii-text mb-4">
                8. Alterações nesta Política
              </h2>
              <div className="space-y-4 text-vitrii-text-secondary">
                <p>
                  Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre mudanças significativas por email ou publicando a versão atualizada em nosso site.
                </p>
                <p>
                  Seu uso continuado dos serviços após alterações significa sua aceitação da Política atualizada.
                </p>
              </div>
            </section>

            {/* Section 9 */}
            <section id="section-9">
              <h2 className="text-2xl font-bold text-vitrii-text mb-4">
                9. Contato
              </h2>
              <div className="space-y-4 text-vitrii-text-secondary bg-gray-50 p-6 rounded-lg">
                <p>
                  Se tiver dúvidas ou preocupações sobre esta Política de Privacidade, ou deseja exercer seus direitos:
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
                    <p className="font-semibold text-vitrii-text">Endereço:</p>
                    <p>HeresTomorrow - Porto Alegre, RS, Brasil</p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Navigation Links */}
          <div className="mt-16 pt-8 border-t border-gray-300 flex justify-between items-center">
            <Link
              to="/ajuda-e-contato"
              className="text-vitrii-blue hover:underline font-semibold"
            >
              ← Voltar para Ajuda e Contato
            </Link>
            <Link
              to="/termos-de-uso"
              className="text-vitrii-blue hover:underline font-semibold"
            >
              Ver Termos de Uso →
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
