import { Check, Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";

export default function Plans() {
  return (
    <div className="min-h-screen bg-vitrii-gray-light">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-vitrii-text mb-4">
            Planos de Pagamento
          </h1>
          <p className="text-lg text-vitrii-text-secondary">
            Escolha o plano que melhor se adequa às suas necessidades
          </p>
        </div>
      </div>

      {/* Plans Section */}
      <div className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Plan 1: Por Anúncio */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <div className="bg-vitrii-blue p-8 text-white">
                <h2 className="text-2xl font-bold mb-2">Por Anúncio</h2>
                <p className="text-blue-100">Para vendedores ocasionais</p>
              </div>

              <div className="p-8">
                <div className="mb-8">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-vitrii-text">
                      R$ 19,90
                    </span>
                    <span className="text-vitrii-text-secondary">/mês</span>
                  </div>
                  <p className="text-sm text-vitrii-text-secondary mt-2">
                    Cobrado por anúncio publicado
                  </p>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-vitrii-text">
                      Publicação ilimitada de anúncios
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-vitrii-text">
                      Fotos e descrição detalhada
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-vitrii-text">
                      Validade de 7 dias
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-vitrii-text">
                      Acesso ao painel de controle
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-vitrii-text">
                      Contato com compradores
                    </span>
                  </div>
                </div>

                <button className="w-full px-4 py-3 bg-vitrii-blue text-white rounded-lg font-semibold hover:bg-vitrii-blue-dark transition-colors">
                  Comece Agora
                </button>
              </div>
            </div>

            {/* Plan 2: Profissional */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow border-2 border-vitrii-yellow">
              <div className="bg-vitrii-yellow p-8 text-vitrii-text">
                <h2 className="text-2xl font-bold mb-2">Profissional</h2>
                <p className="text-vitrii-text-secondary">Para empresas e grandes vendedores</p>
              </div>

              <div className="p-8">
                <div className="mb-8">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-vitrii-text">
                      Personalizado
                    </span>
                  </div>
                  <p className="text-sm text-vitrii-text-secondary mt-2">
                    Contrate conforme suas necessidades
                  </p>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-vitrii-text">
                      Publicação ilimitada
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-vitrii-text">
                      Equipe de vendas dedicada
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-vitrii-text">
                      Anúncios em destaque
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-vitrii-text">
                      Analytics detalhados
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-vitrii-text">
                      Suporte prioritário
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-vitrii-text">
                      Integração com seus sistemas
                    </span>
                  </div>
                </div>

                <button className="w-full px-4 py-3 bg-vitrii-yellow text-vitrii-text rounded-lg font-semibold hover:bg-vitrii-yellow-dark transition-colors">
                  Solicitar Informações
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-vitrii-text mb-12 text-center">
            Perguntas Frequentes
          </h2>

          <div className="space-y-6">
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-vitrii-text mb-2">
                Como funciona o plano "Por Anúncio"?
              </h3>
              <p className="text-vitrii-text-secondary">
                No plano Por Anúncio, você paga R$ 19,90 por cada anúncio publicado. Você pode publicar quantos anúncios quiser e renovar ou criar novos conforme necessário. O valor é cobrado no ato da publicação.
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-vitrii-text mb-2">
                Quanto tempo dura um anúncio?
              </h3>
              <p className="text-vitrii-text-secondary">
                Cada anúncio tem uma validade de 7 dias por padrão. Você pode renovar o anúncio ou criar um novo após expiração se quiser continuar anunciando.
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-vitrii-text mb-2">
                Como contratar o plano Profissional?
              </h3>
              <p className="text-vitrii-text-secondary">
                Entre em contato com nossa equipe através do email contato@herestomorrow.com.br ou telefone +55 51 99193-0384 para discutir um plano personalizado conforme suas necessidades comerciais.
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-vitrii-text mb-2">
                Posso cancelar minha assinatura?
              </h3>
              <p className="text-vitrii-text-secondary">
                Sim, você pode cancelar sua assinatura a qualquer momento. Se você contratou o plano Profissional, entre em contato com nossa equipe para discutir as opções.
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-vitrii-text mb-2">
                Existem outros serviços premium disponíveis?
              </h3>
              <p className="text-vitrii-text-secondary">
                Sim! Oferecemos anúncios em destaque e outros serviços adicionais. Consulte nossa página de ajuda ou entre em contato com nossa equipe para mais detalhes sobre as opções disponíveis.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-vitrii-blue-light py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-vitrii-text mb-8">
            Ainda tem dúvidas?
          </h2>
          <p className="text-lg text-vitrii-text-secondary mb-8">
            Entre em contato conosco e nossa equipe ajudará você a escolher o melhor plano
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <a
              href="mailto:contato@herestomorrow.com.br"
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <Mail className="w-8 h-8 text-vitrii-blue mx-auto mb-3" />
              <h3 className="font-semibold text-vitrii-text mb-2">Email</h3>
              <p className="text-vitrii-text-secondary text-sm">
                contato@herestomorrow.com.br
              </p>
            </a>

            <a
              href="https://wa.me/5551991930384"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <Phone className="w-8 h-8 text-vitrii-blue mx-auto mb-3" />
              <h3 className="font-semibold text-vitrii-text mb-2">WhatsApp</h3>
              <p className="text-vitrii-text-secondary text-sm">
                +55 51 99193-0384
              </p>
            </a>

            <Link
              to="/ajuda-e-contato"
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <Mail className="w-8 h-8 text-vitrii-blue mx-auto mb-3" />
              <h3 className="font-semibold text-vitrii-text mb-2">Central de Ajuda</h3>
              <p className="text-vitrii-text-secondary text-sm">
                Acesse nosso centro de ajuda
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
