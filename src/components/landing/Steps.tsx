const steps = [
  { n: "1", title: "Escolha seu plano", desc: "Selecione o período que combina com o seu projeto: 7, 15 ou 30 dias." },
  { n: "2", title: "Receba sua chave", desc: "Após o pagamento via Pix, sua chave de ativação chega em até 1 minuto." },
  { n: "3", title: "Instale e ative", desc: "Adicione a extensão ao Chrome, cole a chave e comece a criar em 2 minutos." },
]

export function Steps() {
  return (
    <section id="tutorial" className="relative py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: 'var(--text)' }}>
          Ativo em <span className="text-gradient-brand">3 passos simples</span>
        </h2>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="glass-card rounded-2xl p-6 transition hover:-translate-y-1">
              <div className="grid size-12 place-items-center rounded-xl bg-gradient-brand text-lg font-black text-white shadow-lg" style={{ boxShadow: '0 0 30px rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.2)' }}>
                {s.n}
              </div>
              <h3 className="mt-5 text-lg font-bold" style={{ color: 'var(--text)' }}>{s.title}</h3>
              <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
