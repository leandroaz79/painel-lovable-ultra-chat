import { useState } from "react"
import { ChevronDown } from "lucide-react"

const faqs = [
  { q: "Precisa instalar algo além da extensão?", a: "Não. Baixe a extensão no Chrome Web Store, cole sua chave de ativação e pronto. Não requer software extra nem configurações avançadas." },
  { q: "Funciona em todos os planos do Lovable?", a: "Sim. A extensão funciona sobre qualquer plano do Lovable — inclusive o gratuito. Ela adiciona uma camada de produtividade sem substituir sua conta." },
  { q: "Como funciona o pagamento único?", a: "Você paga uma única vez via Pix e recebe a chave de acesso para o período escolhido. Não há assinatura ou cobrança recorrente." },
  { q: "Posso usar em mais de um computador?", a: "Sim. Os planos ULTRA permitem registro em até 2 dispositivos simultaneamente. O TRY 7 permite 1 dispositivo." },
  { q: "O que é o modo white-label?", a: "White-label remove indicações visuais do Lovable da sua aplicação, deixando o resultado final 100% com a identidade da sua marca." },
  { q: "Como funciona o suporte?", a: "Todos os planos incluem suporte via WhatsApp. Planos ULTRA têm prioridade nas respostas." },
]

export function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0)

  const toggle = (i: number) => setOpenIdx(openIdx === i ? null : i)

  return (
    <section className="relative py-20">
      <div className="mx-auto max-w-3xl px-4 md:px-6">
        <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: 'var(--text)' }}>
          Perguntas <span className="text-gradient-brand">Frequentes</span>
        </h2>

        <div className="mt-10 space-y-2">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border transition-all" style={{ borderColor: 'rgba(255,255,255,0.08)' }}
            >
              <button
                onClick={() => toggle(i)}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-sm font-semibold transition hover:bg-white/[0.03]"
                style={{ color: 'var(--text)' }}
              >
                {faq.q}
                <ChevronDown
                  className={`size-4 shrink-0 transition-transform ${openIdx === i ? "rotate-180" : ""}`}
                  style={{ color: 'var(--muted)' }}
                />
              </button>
              {openIdx === i && (
                <div className="border-t px-5 pb-4 pt-3 text-sm leading-relaxed" style={{ borderColor: 'rgba(255,255,255,0.06)', color: 'var(--muted)' }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
