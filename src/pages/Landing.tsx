import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { Button } from '../components/ui/button'

export default function Landing() {
  const { user, role } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [showSignup, setShowSignup] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [faqOpen, setFaqOpen] = useState<number | null>(null)

  if (user && role === 'user') {
    navigate('/user', { replace: true })
  }

  async function handleSignup(e: FormEvent) {
    e.preventDefault()
    if (!name || !email || !password) return

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      })

      if (error) throw error

      if (data.user) {
        showToast('Conta criada com sucesso! Redirecionando...', 'success')
        setTimeout(() => navigate('/user'), 1500)
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erro ao criar conta', 'error')
    } finally {
      setLoading(false)
    }
  }

  const features = [
    {
      icon: '💬',
      title: 'Chat Inteligente Sem Limites',
      desc: 'Escale seu atendimento sem se preocupar com custos. Use o chat inteligente de forma ilimitada para respostas instantâneas.',
    },
    {
      icon: '🧠',
      title: 'Refino Inteligente de Prompts',
      desc: 'Pare de desperdiçar tempo com repetições. Nossa tecnologia otimiza seu comando antes do envio para resultados perfeitos de primeira.',
    },
    {
      icon: '🏗️',
      title: 'Arquitetura Cognitiva',
      desc: 'Ative o raciocínio profundo da IA para resolver problemas complexos e estruturar sistemas robustos com precisão cirúrgica.',
    },
    {
      icon: '⚡',
      title: 'Resposta Instantânea',
      desc: 'Atendimento em tempo real com IA integrada. Respostas rápidas e precisas para seus clientes, sem delay.',
    },
    {
      icon: '🎤',
      title: 'Fluxo Criativo por Voz',
      desc: 'Transmita suas ideias na velocidade do pensamento. Fale naturalmente e veja o código ganhar vida enquanto você idealiza.',
    },
    {
      icon: '📎',
      title: 'Integração Multimídia Real',
      desc: 'Arraste e solte referências de design, PDFs ou imagens. A IA absorbe o contexto visual para criar interfaces 100% fiéis.',
    },
    {
      icon: '🎨',
      title: 'White-Label de Verdade',
      desc: 'Remova qualquer marca do Ultra Chat. Entregue projetos profissionais e autorais onde 100% do crédito pertence a você.',
    },
    {
      icon: '🛡️',
      title: 'Mentor de IA 24/7',
      desc: 'Tenha um especialista sênior ao seu lado. Sugestões estratégicas de prompts e guia completo do protótipo ao deploy final.',
    },
    {
      icon: '🔧',
      title: 'Ecossistema de Skills',
      desc: 'Ative especialistas em SEO, UI/UX e Copywriting. Transforme sua IA no profissional que seu projeto precisa naquele momento.',
    },
  ]

  const plans = [
    {
      name: 'Plano Professional',
      tag: 'Ideal para testar',
      discount: '-50% OFF',
      oldPrice: 'R$ 79,90',
      price: 'R$ 39,90',
      perDay: 'R$ 5,70 / DIA',
      days: '7 DIAS',
      features: [
        'Comandos 100% infinitos',
        'Chat Inteligente Pro',
        'Upload ilimitado de arquivos',
        'Tutorial Master de instalação',
        'Suporte humanizado 24/7',
      ],
      highlighted: false,
    },
    {
      name: 'Plano Business',
      tag: 'O MAIS ESCOLHIDO',
      discount: '-30% OFF',
      oldPrice: 'R$ 99,90',
      price: 'R$ 69,90',
      perDay: 'R$ 4,66 / DIA',
      days: '15 DIAS',
      features: [
        'Tudo do Plano Professional',
        'Atalhos Rápidos de Produtividade',
        '+15 Skills Premium Ultra Chat',
        'Prioridade Máxima no Fluxo',
        'Suporte Prioritário VIP',
      ],
      highlighted: true,
    },
    {
      name: 'Plano Ultra Pro',
      tag: 'MELHOR CUSTO-BENEFÍCIO',
      discount: '-33% OFF',
      oldPrice: 'R$ 149,90',
      price: 'R$ 99,90',
      perDay: 'R$ 3,33 / DIA',
      days: '30 DIAS',
      features: [
        'Tudo do Plano Business',
        'Performance Ultra-Otimizada',
        'Suporte VIP Dedicado',
        'Acesso Vitalício a Atualizações',
        'O Menor Valor Diário Garantido',
      ],
      highlighted: false,
    },
  ]

  const faqs = [
    {
      q: 'Como recebo o acesso?',
      a: 'Em até 1 minuto após o Pix, você recebe e-mail com chave de ativação e link de download.',
    },
    {
      q: 'Minha conta fica em risco?',
      a: 'Não. É uma extensão de navegador que não acessa sua conta, senha ou projetos.',
    },
    {
      q: 'Tem reembolso?',
      a: 'Oferecemos suporte completo para qualquer problema de ativação. Entre em contato pelo WhatsApp.',
    },
    {
      q: 'O que é o Chat Sem Gastar Créditos?',
      a: 'Modo de conversa que processa suas mensagens sem consumir créditos da conta.',
    },
    {
      q: 'Funciona em qual navegador?',
      a: 'Chrome e navegadores Chromium (Edge, Brave, Arc). Não funciona no Firefox ou Safari.',
    },
    {
      q: 'Preciso saber programar?',
      a: 'Não. A instalação leva menos de 2 minutos.',
    },
    {
      q: 'Como instalo a extensão?',
      a: 'Após receber a chave por e-mail, instale a extensão no Chrome e insira a chave. Leva menos de 2 minutos.',
    },
    {
      q: 'Funciona com qualquer conta?',
      a: 'Sim, contas gratuitas e pagas.',
    },
  ]

  return (
    <div className="landing-new">
      {/* Top Promo Banner */}
      <div className="promo-banner">
        <span>Promoção Especial: 30% OFF em qualquer plano</span>
        <span className="promo-coupon">Use o Cupom: ULTRA30</span>
      </div>

      {/* Header */}
      <header className="landing-header">
        <div className="landing-header-inner">
          <a href="/" className="brand">
            <span className="brand-bolt">⚡</span>
            <strong>
              Lovable <span>Ultra Chat</span>
            </strong>
          </a>
          <nav className="landing-nav">
            <a href="#features">Recursos</a>
            <a href="#pricing">Planos</a>
            <a href="#faq">Dúvidas</a>
            <Button variant="ghost" onClick={() => navigate('/login')}>
              Entrar
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            EXTENSÃO PARA NAVEGADORES • 436ms
          </div>
          <h1 className="hero-title">
            Domine o Lovable com{' '}
            <span className="hero-highlight">Poder Ilimitado</span> e crie sem
            barreiras!
          </h1>
          <p className="hero-subtitle">
            A extensão definitiva para Chrome que remove os limites do Lovable.
            Automatize comandos, edite visualmente e use o chat inteligente sem
            consumir seus créditos.
          </p>
          <div className="hero-cta-group">
            <Button size="lg" onClick={() => setShowSignup(true)}>
              Acessar Poder Ilimitado Agora
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowSignup(true)}
            >
              Teste Grátis →
            </Button>
          </div>

          {/* Stats Row */}
          <div className="hero-stats">
            <div className="hero-stat">
              <strong>+600</strong>
              <span>usuários ativos</span>
            </div>
            <div className="hero-stat">
              <strong>100%</strong>
              <span>SEGURO E CONFIÁVEL</span>
            </div>
            <div className="hero-stat">
              <strong>⚡</strong>
              <span>Ativação em segundos</span>
            </div>
            <div className="hero-stat">
              <strong>💬</strong>
              <span>Suporte por WhatsApp</span>
            </div>
            <div className="hero-stat">
              <strong>🔄</strong>
              <span>Sem renovação automática</span>
            </div>
          </div>
        </div>

        {/* Hero Visual / Mockup */}
        <div className="hero-visual">
          <div className="hero-mockup-window">
            <div className="mockup-titlebar">
              <span className="mockup-dot" />
              <span className="mockup-dot" />
              <span className="mockup-dot" />
              <span className="mockup-title">Lovable Ultra Chat</span>
            </div>
            <div className="mockup-content">
              <div className="mockup-badge">🎁 Matias P.</div>
              <div className="mockup-row">
                <span className="mockup-label">⏱ Tempo restante</span>
                <span className="mockup-value">11d 21h 59m</span>
              </div>
              <div className="mockup-row">
                <span className="mockup-label">✈ COMANDOS</span>
                <span className="mockup-value">204</span>
              </div>
              <div className="mockup-row">
                <span className="mockup-label">$ ECONOMIA</span>
                <span className="mockup-value highlight">R$ 408,00</span>
              </div>
              <div className="mockup-divider" />
              <div className="mockup-section-title">ATALHOS RÁPIDOS</div>
              <div className="mockup-tags">
                <span>🔧CORRIGIR</span>
                <span>⚖️REFATORAR</span>
                <span>🎨MELHORAR</span>
                <span>🔍EXPLICAR</span>
                <span>🚀OTIMIZAR</span>
              </div>
              <div className="mockup-input-row">
                <span className="mockup-input-icon">▶</span>
                <span className="mockup-input-text">✅ Comando processado ⚡</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section className="steps-section">
        <div className="section-container">
          <h2 className="section-heading">Ativo em 3 passos simples</h2>
          <div className="steps-grid">
            <div className="step-card">
              <span className="step-number">1</span>
              <h3>Escolha seu plano</h3>
              <p>Selecione o período ideal</p>
            </div>
            <div className="step-card">
              <span className="step-number">2</span>
              <h3>Receba sua chave</h3>
              <p>Em menos de 1 minuto após o Pix</p>
            </div>
            <div className="step-card">
              <span className="step-number">3</span>
              <h3>Instale e ative</h3>
              <p>Extensão no Chrome em 2 minutos</p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="problem-section">
        <div className="section-container">
          <h2 className="section-heading">
            Cansado de perder tempo no meio da criação?
          </h2>
          <p className="problem-desc">
            Quem cria projetos no Lovable sabe como é frustrante repetir
            comandos, ajustar detalhes manualmente e interromper o fluxo de
            trabalho. O Lovable Ultra Chat foi criado para deixar sua
            experiência mais rápida, prática e produtiva.
          </p>
          <div className="problem-cards">
            <div className="problem-card">
              <span className="problem-icon">🔄</span>
              <strong>Menos repetição</strong>
              <p>Use recursos inteligentes para acelerar tarefas frequentes.</p>
            </div>
            <div className="problem-card">
              <span className="problem-icon">🎯</span>
              <strong>Mais controle</strong>
              <p>
                Trabalhe com arquivos, imagens, elementos e comandos de forma
                mais prática.
              </p>
            </div>
            <div className="problem-card">
              <span className="problem-icon">⚡</span>
              <strong>Mais velocidade</strong>
              <p>
                Mantenha o foco na criação e avance seus projetos com menos
                interrupções.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="features-section">
        <div className="section-container">
          <div className="section-label">RECURSOS PREMIUM</div>
          <h2 className="section-heading">
            Tudo que você precisa para criar sem limites
          </h2>
          <p className="section-desc">
            Uma suíte completa de ferramentas inteligentes projetadas para levar
            sua produtividade no Lovable ao nível máximo.
          </p>
          <div className="features-grid-new">
            {features.map((f, i) => (
              <article key={i} className="feature-card-new">
                <span className="feature-icon-new">{f.icon}</span>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="pricing-section">
        <div className="section-container">
          <div className="section-label">PLANOS</div>
          <h2 className="section-heading">Planos que cabem no seu momento</h2>
          <p className="section-desc">
            Planos flexíveis para testar, criar e produzir mais no Lovable.
          </p>
          <div className="pricing-grid-new">
            {plans.map((plan, i) => (
              <div
                key={i}
                className={`pricing-card-new${plan.highlighted ? ' featured' : ''}`}
              >
                <div className="pricing-discount-badge">{plan.discount}</div>
                {plan.highlighted && <div className="pricing-popular-badge">MAIS ESCOLHIDO</div>}
                <div className="pricing-tag">{plan.tag}</div>
                <h3 className="pricing-name">{plan.name}</h3>
                <div className="pricing-old-price">{plan.oldPrice}</div>
                <div className="pricing-price-row">
                  <strong>{plan.price}</strong>
                  <span className="pricing-period">{plan.days}</span>
                </div>
                <div className="pricing-per-day">{plan.perDay}</div>
                <div className="pricing-fidelity">Sem Fidelidade</div>
                <ul className="pricing-features-new">
                  {plan.features.map((f, j) => (
                    <li key={j}>{f}</li>
                  ))}
                </ul>
                <Button
                  className="pricing-btn"
                  onClick={() => setShowSignup(true)}
                >
                  {plan.highlighted ? 'ESCOLHER ' : 'ATIVAR '}
                  {plan.days}
                </Button>
                <div className="pricing-footnote">
                  Pagamento seguro via PIX
                  <br />
                  Liberação rápida após confirmação
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <div className="section-container">
          <h2 className="section-heading">O que nossos usuários dizem</h2>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <p>
                "Com o Lovable Ultra Chat entrego projetos em metade do tempo.
                O chat sem créditos sozinho já pagou o investimento."
              </p>
              <strong>Ricardo M.</strong>
              <span>Freelancer</span>
            </div>
            <div className="testimonial-card">
              <p>
                "Incrivelmente simples de instalar e faz diferença real no dia
                a dia."
              </p>
              <strong>Ana R.</strong>
              <span>Criadora digital</span>
            </div>
            <div className="testimonial-card">
              <p>
                "Testei na primeira semana e renovei na mesma hora. Meus
                clientes nem sabem que uso Lovable."
              </p>
              <strong>Felipe S.</strong>
              <span>Agência</span>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="comparison-section">
        <div className="section-container">
          <h2 className="section-heading">
            Mais do que uma chave: uma experiência completa
          </h2>
          <p className="section-desc">
            O Lovable Ultra Chat combina ativação rápida, recursos avançados e
            suporte para você começar com mais confiança.
          </p>
          <div className="comparison-table-wrap">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Recurso</th>
                  <th className="col-highlight">Lovable Ultra Chat</th>
                  <th>Extensões comuns</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Ativação rápida', '✓', 'Nem sempre'],
                  ['Teste grátis', '✓', 'Nem sempre'],
                  ['Tutorial de instalação', '✓', 'Pouco claro'],
                  ['Suporte para ativação', '✓', 'Limitado'],
                  ['Skills incluídas', '✓', 'Variável'],
                  ['Recursos avançados', '✓', 'Básico'],
                  ['Planos flexíveis', '7, 15 e 30 dias', 'Variável'],
                  ['Experiência premium', '✓', 'Nem sempre'],
                ].map((row, i) => (
                  <tr key={i}>
                    <td>{row[0]}</td>
                    <td className="col-highlight">{row[1]}</td>
                    <td>{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="faq-section">
        <div className="section-container">
          <h2 className="section-heading">Dúvidas frequentes</h2>
          <div className="faq-list">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className={`faq-item${faqOpen === i ? ' open' : ''}`}
                onClick={() => setFaqOpen(faqOpen === i ? null : i)}
              >
                <div className="faq-question">
                  <h4>{faq.q}</h4>
                  <span className="faq-arrow">{faqOpen === i ? '−' : '+'}</span>
                </div>
                {faqOpen === i && <p className="faq-answer">{faq.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta-section">
        <div className="section-container">
          <div className="final-cta-card">
            <h2>Ainda na dúvida?</h2>
            <h3>Teste grátis agora mesmo!</h3>
            <p>
              Explore todos os recursos do Lovable Ultra Chat sem compromisso.
              Comece a criar com máxima produtividade hoje.
            </p>
            <div className="final-cta-buttons">
              <Button size="lg" onClick={() => setShowSignup(true)}>
                Começar Teste Grátis
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Ver planos
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer-new">
        <div className="footer-inner-new">
          <div>
            <a href="/" className="brand">
              <span className="brand-bolt">⚡</span>
              <strong>
                Lovable <span>Ultra Chat</span>
              </strong>
            </a>
            <p className="footer-tagline">
              A extensão mais poderosa para Lovable. Desbloqueie recursos
              premium e aumente sua produtividade em 10x.
            </p>
          </div>
          <p className="footer-copy">
            © 2026 Lovable Ultra Chat. Todos os direitos reservados.
          </p>
        </div>
      </footer>

      {/* Modal de Cadastro */}
      {showSignup && (
        <div className="modal-overlay" onClick={() => setShowSignup(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <button className="modal-close" onClick={() => setShowSignup(false)}>
              &times;
            </button>
            <h2>Criar Conta</h2>
            <p style={{ color: 'var(--muted)', marginBottom: '24px' }}>
              Cadastre-se para acessar o painel e testar a extensão grátis.
            </p>

            <form className="stack-form" onSubmit={handleSignup}>
              <label>
                <span>Nome completo</span>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" required />
              </label>
              <label>
                <span>Email</span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" required />
              </label>
              <label>
                <span>Senha</span>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" minLength={6} required />
              </label>
              <Button type="submit" disabled={loading}>
                {loading ? 'Criando conta...' : 'Criar conta e testar grátis'}
              </Button>
            </form>

            <p style={{ marginTop: '16px', textAlign: 'center', fontSize: '13px', color: 'var(--muted)' }}>
              Já tem conta?{' '}
              <a href="/login" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
                Fazer login
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
