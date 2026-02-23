import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  ChevronDown,
  Mail,
  Phone,
  MessageCircle,
  Clock,
  HelpCircle,
  MapPin,
} from "lucide-react";

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: "comprador" | "vendedor" | "pagamento" | "tecnico";
}

const faqItems: FAQItem[] = [
  // Buyer FAQs
  {
    id: 1,
    question: "Como faço para criar uma conta?",
    answer:
      "Clique no botão 'Cadastrar' no topo da página e preencha seus dados pessoais (email, CPF/CNPJ e senha). Você receberá um email de confirmação para validar sua conta. Após confirmar, já poderá começar a buscar e comprar produtos.",
    category: "comprador",
  },
  {
    id: 2,
    question: "Como faço para buscar produtos?",
    answer:
      "Use a função 'Buscar' na página inicial ou navegue pelas categorias. Você pode filtrar por localidade, preço, tipo de produto e muito mais. Clique em qualquer anúncio para ver detalhes completos do produto.",
    category: "comprador",
  },
  {
    id: 3,
    question: "Como faço para entrar em contato com um vendedor?",
    answer:
      "Em cada anúncio, você pode clicar em 'Enviar Mensagem' para iniciar um chat direto, usar o botão 'WhatsApp' para contato rápido, ou chamar a equipe de vendas do anunciante se disponível.",
    category: "comprador",
  },
  {
    id: 4,
    question: "Como funcionam os QR Codes?",
    answer:
      "Vendedores colocam QR Codes em suas lojas físicas. Quando você escaneia um QR Code com o app Vitrii, pode ver produtos em tempo real, estoque atualizado, preços e pode chamar atendentes diretamente para atendimento.",
    category: "comprador",
  },

  // Seller FAQs
  {
    id: 5,
    question: "Como começo a vender no Vitrii?",
    answer:
      "Crie uma conta, configure seu perfil e comece a criar anúncios. Você tem direito a 3 anúncios gratuitos por mês. Após isso, pague apenas R$ 0,99 por anúncio, por dia de publicação, via Pix. O processo é simples e rápido.",
    category: "vendedor",
  },
  {
    id: 6,
    question: "Qual é o custo para vender?",
    answer:
      "Os 3 primeiros anúncios por mês são completamente gratuitos. Depois disso, cada anúncio custa apenas R$ 0,99 por dia. Você paga apenas pelos dias em que o anúncio fica ativo. Sem taxas escondidas ou percentuais de venda.",
    category: "vendedor",
  },
  {
    id: 7,
    question: "Como faço para gerenciar meus anúncios?",
    answer:
      "Acesse a seção 'Meus Anúncios' no seu perfil. Lá você pode criar, editar, deletar ou pausar anúncios. Também pode acompanhar visualizações, gerenciar estoque e controlar suas publicações.",
    category: "vendedor",
  },
  {
    id: 8,
    question: "Como funcionam os QR Codes para vendedores?",
    answer:
      "Você gera QR Codes na seção 'QR Code Studio'. Coloque-os em sua loja física para que clientes vejam seus produtos, tamanhos, cores, estoque e preços em tempo real através do app. Você pode receber alertas quando clientes chamam seu atendimento.",
    category: "vendedor",
  },

  // Payment FAQs
  {
    id: 9,
    question: "Como funciona o pagamento?",
    answer:
      "Usamos Pix como método de pagamento seguro e rápido. Quando você publica um anúncio (após os 3 gratuitos), gera um QR Code Pix e você pode pagar instantaneamente. O anúncio é ativado assim que confirmamos o pagamento.",
    category: "pagamento",
  },
  {
    id: 10,
    question: "O Vitrii retém alguma taxa sobre as vendas?",
    answer:
      "Não! O Vitrii não cobra nenhuma taxa sobre suas vendas. Você paga apenas pela publicação do anúncio (R$ 0,99/dia após os 3 gratuitos). Toda a receita de suas vendas é sua.",
    category: "pagamento",
  },

  // Technical FAQs
  {
    id: 11,
    question: "Qual app devo baixar?",
    answer:
      "O Vitrii é uma aplicação web progressiva (PWA) que funciona em qualquer navegador moderno. Você pode acessar pelo seu celular, tablet ou computador. Em dispositivos móveis, pode adicionar um atalho à tela inicial para fácil acesso.",
    category: "tecnico",
  },
  {
    id: 12,
    question: "Como reportar um problema ou enviar sugestões?",
    answer:
      "Use a seção 'Ajuda e Contato' para enviar mensagens diretamente. Você também pode entrar em contato por email (contato@herestomorrow.com) ou WhatsApp (+55 51 99193-0384). Nossa equipe responde em até 24 horas.",
    category: "tecnico",
  },
];

const categories = [
  { id: "comprador", label: "Para Compradores" },
  { id: "vendedor", label: "Para Vendedores" },
  { id: "pagamento", label: "Pagamento" },
  { id: "tecnico", label: "Técnico" },
];

function FAQAccordion() {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("comprador");

  const filteredFAQs = faqItems.filter((item) => item.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              selectedCategory === cat.id
                ? "bg-vitrii-blue text-white"
                : "bg-gray-200 text-vitrii-text hover:bg-gray-300"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* FAQ Items */}
      <div className="space-y-3">
        {filteredFAQs.map((item) => (
          <div
            key={item.id}
            className="border border-gray-300 rounded-lg overflow-hidden hover:border-vitrii-blue transition-colors"
          >
            <button
              onClick={() =>
                setExpandedId(expandedId === item.id ? null : item.id)
              }
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
            >
              <span className="font-semibold text-vitrii-text pr-4">
                {item.question}
              </span>
              <ChevronDown
                className={`w-5 h-5 text-vitrii-blue flex-shrink-0 transition-transform ${
                  expandedId === item.id ? "rotate-180" : ""
                }`}
              />
            </button>

            {expandedId === item.id && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-300">
                <p className="text-vitrii-text-secondary">{item.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HelpAndContact() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      {/* Page Header */}
      <section className="bg-vitrii-gray-light border-b border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold text-vitrii-text mb-4">
            Ajuda e Contato
          </h1>
          <p className="text-lg text-vitrii-text-secondary max-w-2xl">
            Encontre respostas para suas dúvidas ou entre em contato com nossa equipe
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* FAQ Section */}
            <div className="lg:col-span-2">
              <div className="mb-12">
                <h2 className="text-2xl md:text-3xl font-bold text-vitrii-text mb-2 flex items-center gap-2">
                  <HelpCircle className="w-8 h-8 text-vitrii-blue" />
                  Perguntas Frequentes
                </h2>
                <p className="text-vitrii-text-secondary">
                  Selecione uma categoria abaixo para ver as perguntas mais frequentes
                </p>
              </div>

              <FAQAccordion />
            </div>

            {/* Contact Section */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Contact Info Card */}
                <div className="vitrii-card p-8">
                  <h2 className="text-2xl font-bold text-vitrii-text mb-6 flex items-center gap-2">
                    <MessageCircle className="w-6 h-6 text-vitrii-blue" />
                    Entre em Contato
                  </h2>

                  <div className="space-y-6">
                    {/* Email */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-vitrii-text font-semibold">
                        <Mail className="w-5 h-5 text-vitrii-blue flex-shrink-0" />
                        Email
                      </div>
                      <a
                        href="mailto:contato@herestomorrow.com"
                        className="block text-vitrii-blue hover:underline break-all text-sm"
                      >
                        contato@herestomorrow.com
                      </a>
                      <p className="text-xs text-vitrii-text-secondary">
                        Resposta em até 24 horas
                      </p>
                    </div>

                    {/* Phone */}
                    <div className="space-y-2 pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-vitrii-text font-semibold">
                        <Phone className="w-5 h-5 text-vitrii-blue flex-shrink-0" />
                        Telefone
                      </div>
                      <a
                        href="tel:+5551991930384"
                        className="block text-vitrii-blue hover:underline text-sm font-semibold"
                      >
                        +55 51 99193-0384
                      </a>
                      <p className="text-xs text-vitrii-text-secondary">
                        Seg-Sex: 9h às 18h
                      </p>
                    </div>

                    {/* WhatsApp */}
                    <div className="space-y-2 pt-4 border-t border-gray-200">
                      <a
                        href="https://wa.me/5551991930384"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 w-full px-4 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
                      >
                        <MessageCircle className="w-5 h-5" />
                        Abrir WhatsApp
                      </a>
                      <p className="text-xs text-vitrii-text-secondary text-center">
                        Resposta imediata quando disponível
                      </p>
                    </div>
                  </div>
                </div>

                {/* Business Hours Card */}
                <div className="vitrii-card p-6 bg-blue-50">
                  <div className="flex items-center gap-2 text-vitrii-blue font-semibold mb-4">
                    <Clock className="w-5 h-5" />
                    Horário de Atendimento
                  </div>
                  <ul className="text-sm text-vitrii-text-secondary space-y-2">
                    <li>
                      <span className="font-semibold">Segunda à Sexta:</span> 9h
                      às 18h
                    </li>
                    <li>
                      <span className="font-semibold">Sábado:</span> 10h às 14h
                    </li>
                    <li>
                      <span className="font-semibold">Domingo:</span> Fechado
                    </li>
                  </ul>
                </div>

                {/* About Developer */}
                <div className="vitrii-card p-6 bg-gray-50">
                  <h3 className="font-semibold text-vitrii-text mb-3">
                    Desenvolvido por
                  </h3>
                  <p className="text-sm text-vitrii-text-secondary mb-3">
                    O Vitrii é desenvolvido pela <span className="font-semibold">HeresTomorrow</span>, empresa
                    especializada em soluções tecnológicas inovadoras.
                  </p>
                  <Link
                    to="/about"
                    className="text-vitrii-blue hover:underline text-sm font-semibold"
                  >
                    Saiba mais sobre o Vitrii →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
