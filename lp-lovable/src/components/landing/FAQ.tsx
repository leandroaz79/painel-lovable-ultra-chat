import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Como recebo o acesso depois da compra?",
    a: "Em até 1 minuto após a confirmação do Pix, você recebe um e-mail com a chave de ativação e o link para baixar a extensão.",
  },
  {
    q: "Minha conta do Lovable corre algum risco?",
    a: "Não. O Lovable Ultra Chat é uma extensão de navegador: não acessa sua senha, dados pessoais ou projetos privados.",
  },
  {
    q: "Existe reembolso?",
    a: "Garantimos suporte completo em qualquer dúvida ou problema de ativação. Fale com a gente pelo WhatsApp que resolvemos rapidamente.",
  },
  {
    q: "O que é o chat sem consumir créditos?",
    a: "É o modo de conversa exclusivo do Lovable Ultra Chat: você troca ideias com a IA livremente, sem cada mensagem descontar créditos da sua conta.",
  },
  {
    q: "Em quais navegadores funciona?",
    a: "Funciona no Google Chrome e em navegadores baseados em Chromium (Edge, Brave, Arc, Opera). Não há suporte para Firefox ou Safari.",
  },
  {
    q: "Preciso saber programar para instalar?",
    a: "Não. A instalação leva menos de 2 minutos e nosso tutorial guiado mostra cada passo, mesmo que você nunca tenha mexido com extensões antes.",
  },
  {
    q: "Como instalo a extensão?",
    a: "Após receber sua chave por e-mail, baixe a extensão pelo link enviado, adicione ao Chrome e cole a chave dentro do painel. Em 2 minutos está pronto.",
  },
  {
    q: "Funciona com qualquer conta do Lovable?",
    a: "Sim — funciona tanto em contas gratuitas quanto em contas pagas do Lovable, sem alterações nas suas assinaturas.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-20">
      <div className="mx-auto max-w-3xl px-4 md:px-6">
        <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
          Perguntas <span className="text-gradient-brand">frequentes</span>
        </h2>

        <Accordion type="single" collapsible className="mt-10 space-y-3">
          {faqs.map((f, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="glass-card rounded-2xl border-0 px-5"
            >
              <AccordionTrigger className="py-5 text-left text-base font-semibold hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="pb-5 text-sm text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
