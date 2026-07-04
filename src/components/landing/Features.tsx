import {
  Infinity as InfinityIcon, Wand2, Brain, MousePointerClick,
  Mic2, Images, EyeOff, GraduationCap, Layers,
} from "lucide-react"

const features = [
  { icon: InfinityIcon, title: "Créditos sem teto", desc: "Converse com a IA o quanto precisar e itere sem medo de estourar o orçamento." },
  { icon: Wand2, title: "Refino automático de prompts", desc: "Cada comando passa por uma camada de otimização antes do envio. Resultado certo na primeira tentativa." },
  { icon: Brain, title: "Raciocínio profundo", desc: "Ative o modo de análise estendida para resolver bugs complexos e estruturar sistemas com precisão." },
  { icon: MousePointerClick, title: "Edição visual instantânea", desc: "Aponte para qualquer elemento da tela e transforme. Sem descrever caminhos longos no chat." },
  { icon: Mic2, title: "Comando por voz", desc: "Fale e veja o código aparecer. Ideal para tirar ideia da cabeça sem perder o fluxo criativo." },
  { icon: Images, title: "Contexto multimídia", desc: "Solte referências, PDFs e imagens. A IA entende o material e entrega telas fiéis ao seu briefing." },
  { icon: EyeOff, title: "White-label completo", desc: "Remova qualquer marca do Lovable da entrega final. O projeto fica 100% no nome da sua marca." },
  { icon: GraduationCap, title: "Mentor de IA 24/7", desc: "Um especialista sênior do seu lado: sugestões de prompt, próximos passos e revisão estratégica." },
  { icon: Layers, title: "Ecossistema de skills", desc: "Ative perfis especialistas em SEO, UX e Copy para deixar a IA com a personalidade que o projeto pede." },
]

export function Features() {
  return (
    <section id="funcionalidades" className="relative py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            Recursos Premium
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: 'var(--text)' }}>
            Tudo o que falta para você{" "}
            <span className="text-gradient-brand">criar sem limites</span>
          </h2>
          <p className="mt-4" style={{ color: 'var(--muted)' }}>
            Uma caixa de ferramentas pensada para levar sua produtividade no Lovable ao próximo nível — da primeira ideia até o deploy.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="group glass-card relative overflow-hidden rounded-2xl p-6 transition hover:-translate-y-1">
              <div className="absolute -right-10 -top-10 size-32 rounded-full bg-gradient-brand opacity-0 blur-3xl transition group-hover:opacity-30" />
              <div className="grid size-11 place-items-center rounded-xl bg-gradient-brand text-white shadow-lg" style={{ boxShadow: '0 0 30px rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.2)' }}>
                <Icon className="size-5" />
              </div>
              <h3 className="mt-5 text-lg font-bold" style={{ color: 'var(--text)' }}>{title}</h3>
              <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
