import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/button'
import { Logo } from '../components/ui/Logo'
import {
  ChevronDown, ChevronUp, CreditCard, Gift, Package, DollarSign,
  BarChart3, Target, Zap, Wrench, Handshake, ShoppingBag,
  Sun, Calendar, TrendingUp, Crown, CheckCircle2, ArrowRight,
  Users, Shield, Clock, Star, Sparkles, Calculator, Paintbrush
} from 'lucide-react'

const PRICING_TIERS = [
  { min: 1, max: 9, price: 37.90 },
  { min: 10, max: 19, price: 35.90 },
  { min: 20, max: 29, price: 33.90 },
  { min: 30, max: 39, price: 31.90 },
  { min: 40, max: 49, price: 29.90 },
  { min: 50, max: 74, price: 27.90 },
  { min: 75, max: 99, price: 25.90 },
  { min: 100, max: 149, price: 23.90 },
  { min: 150, max: null, price: 19.90 },
]

const PROFIT_TABLE = [
  { qty: 10, invest: 359, revenue: 2990, profit: 2631 },
  { qty: 20, invest: 678, revenue: 5980, profit: 5302 },
  { qty: 30, invest: 957, revenue: 8970, profit: 8013 },
  { qty: 50, invest: 1395, revenue: 14950, profit: 13555 },
  { qty: 100, invest: 2390, revenue: 29900, profit: 27510 },
  { qty: 150, invest: 2985, revenue: 44850, profit: 41865 },
]

function getUnitPrice(qty: number) {
  for (const tier of PRICING_TIERS) {
    if (tier.max === null && qty >= tier.min) return tier.price
    if (tier.max !== null && qty >= tier.min && qty <= tier.max) return tier.price
  }
  return PRICING_TIERS[0].price
}

const FAQ_ITEMS = [
  { q: 'Preciso comprar um pacote grande?', a: 'Não. Após aderir ao programa você pode comprar desde uma única licença até centenas.' },
  { q: 'Posso definir meus próprios preços?', a: 'Sim. Você possui liberdade para definir seus preços. Recomendamos apenas respeitar o valor mínimo sugerido.' },
  { q: 'Posso vender mensal, trimestral e vitalício?', a: 'Sim. Você escolhe como deseja comercializar cada licença.' },
  { q: 'As licenças têm validade?', a: 'As licenças adquiridas para revenda são vitalícias e podem ser comercializadas conforme sua estratégia.' },
]

const SELLING_OPTIONS = [
  { icon: <Sun size={22} />, label: 'Diário', price: 'R$ 9,90', color: '#f5b83d' },
  { icon: <Calendar size={22} />, label: 'Semanal', price: 'R$ 34,90', color: '#6de8ff' },
  { icon: <TrendingUp size={22} />, label: 'Mensal', price: 'R$ 89,90', color: '#9dff2f' },
  { icon: <BarChart3 size={22} />, label: 'Trimestral', price: 'R$ 169,90', color: '#b47aff' },
  { icon: <Crown size={22} />, label: 'Vitalício', price: 'R$ 299,00', color: '#ff8a98' },
]

const WHY_ITEMS = [
  { icon: <DollarSign size={22} />, label: 'Alto potencial de lucro', desc: 'Margens acima de 80%' },
  { icon: <BarChart3 size={22} />, label: 'Escalabilidade', desc: 'Cresça no seu ritmo' },
  { icon: <Target size={22} />, label: 'Liberdade de preços', desc: 'Você define o valor' },
  { icon: <Zap size={22} />, label: 'Licenças Vitalícias', desc: 'Sem renovação' },
  { icon: <Wrench size={22} />, label: 'Atualizações constantes', desc: 'Produto sempre atualizado' },
  { icon: <Handshake size={22} />, label: 'Suporte exclusivo', desc: 'Canal dedicado' },
  { icon: <ShoppingBag size={22} />, label: 'Compra sob demanda', desc: 'Sem estoque mínimo' },
  { icon: <Paintbrush size={22} />, label: 'White-Label', desc: 'Customize cores, logo e marca' },
]

const HERO_STATS = [
  { value: '88%', label: 'Margem de lucro' },
  { value: 'R$ 19,90', label: 'A partir de' },
  { value: '24/7', label: 'Suporte' },
]

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect() }
    }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])

  return { ref, visible }
}

function AnimatedSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useInView(0.1)
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(28px)',
      transition: `opacity 0.55s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform 0.55s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
    }}>
      {children}
    </div>
  )
}

export default function ResellerProgram() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [calcQty, setCalcQty] = useState(10)
  const [calcPrice, setCalcPrice] = useState(299)

  useEffect(() => { window.scrollTo(0, 0) }, [])

  const unitCost = getUnitPrice(calcQty)
  const calcInvestment = Math.round(unitCost * calcQty)
  const calcRevenue = Math.round(calcPrice * calcQty)
  const calcProfit = calcRevenue - calcInvestment
  const calcMargin = calcRevenue > 0 ? Math.round((calcProfit / calcRevenue) * 100) : 0

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  return (
    <div className="landing-page">
      {/* ─── HEADER ─── */}
      <header className="landing-header">
        <div className="landing-header-inner">
          <Logo variant="user" href="/user" />
          <div className="session-box">
            <span>{user?.email || 'Usuário'}</span>
            <Button variant="ghost" onClick={() => navigate('/user')}>Painel</Button>
            <Button variant="ghost" onClick={signOut}>Sair</Button>
          </div>
        </div>
      </header>

      {/* ─── HERO ─── */}
      {/* ROLLBACK: para reverter ao hero original, substitua toda esta section pela versão comentada no final do componente */}
      <section style={{ position: 'relative', overflow: 'hidden', minHeight: '520px' }}>
        {/* Animated mesh gradient blobs */}
        <div className="hero-mesh-blob hero-mesh-blob-1" />
        <div className="hero-mesh-blob hero-mesh-blob-2" />
        <div className="hero-mesh-blob hero-mesh-blob-3" />

        {/* Floating particles */}
        {[
          { left: '8%', s: '3px', o: 0.4, d: '9s', del: '0s', px: '12px' },
          { left: '15%', s: '2px', o: 0.3, d: '11s', del: '1s', px: '-8px' },
          { left: '25%', s: '4px', o: 0.5, d: '8s', del: '3s', px: '16px' },
          { left: '35%', s: '2px', o: 0.25, d: '12s', del: '0.5s', px: '-14px' },
          { left: '45%', s: '3px', o: 0.45, d: '10s', del: '2s', px: '10px' },
          { left: '55%', s: '2px', o: 0.35, d: '9.5s', del: '4s', px: '-6px' },
          { left: '65%', s: '4px', o: 0.5, d: '8.5s', del: '1.5s', px: '18px' },
          { left: '72%', s: '2px', o: 0.3, d: '11.5s', del: '0.8s', px: '-12px' },
          { left: '80%', s: '3px', o: 0.4, d: '10.5s', del: '2.5s', px: '8px' },
          { left: '88%', s: '2px', o: 0.25, d: '13s', del: '3.5s', px: '-16px' },
          { left: '92%', s: '3px', o: 0.35, d: '9s', del: '5s', px: '14px' },
          { left: '50%', s: '2px', o: 0.2, d: '14s', del: '6s', px: '-10px' },
        ].map((p, i) => (
          <div key={i} className="hero-particle" style={{
            left: p.left,
            '--s': p.s, '--o': p.o, '--d': p.d, '--del': p.del, '--px': p.px,
          } as React.CSSProperties} />
        ))}

        <div className="landing-section" style={{ paddingTop: '80px', paddingBottom: '80px', position: 'relative', zIndex: 1 }}>
          <AnimatedSection>
            <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
              {/* Badge */}
              <div className="hero-badge-animated" style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px',
                borderRadius: '999px', background: 'rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.1)',
                border: '1px solid rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.3)',
                marginBottom: '28px', fontSize: '13px', fontWeight: 700, color: 'var(--accent)',
                letterSpacing: '0.04em',
              }}>
                <Sparkles size={16} />
                Programa Oficial
              </div>

              <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', letterSpacing: '-0.04em', lineHeight: 1.08, maxWidth: '100%', textAlign: 'center', marginBottom: '20px' }}>
                Torne-se um Revendedor
                <span className="hero-title-shimmer" style={{ display: 'block' }}>
                  Oficial do Lovable Ultra Chat
                </span>
              </h1>

              <p style={{ fontSize: 'clamp(16px, 2.5vw, 19px)', maxWidth: '600px', textAlign: 'center', margin: '0 auto 36px', lineHeight: 1.7 }}>
                Crie uma nova fonte de renda revendendo licenças. Você define seus preços, compra com desconto e pode recuperar o investimento já na primeira venda.
              </p>

              {/* CTA with glow */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '48px' }}>
                <div className="hero-cta-glow">
                  <a href="https://wa.me/556781880921?text=Ol%C3%A1!%20Vim%20pelo%20site%20e%20quero%20ser%20um%20revendedor%20oficial." target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                    <Button style={{ fontSize: '16px', minHeight: '54px', padding: '0 36px', display: 'inline-flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
                      Quero ser Revendedor <ArrowRight size={18} />
                    </Button>
                  </a>
                </div>
              </div>

              {/* Stats row */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(32px, 6vw, 64px)', flexWrap: 'wrap', padding: '28px 0', borderTop: '1px solid var(--line)' }}>
                {HERO_STATS.map((s) => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.03em', lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted-2)', marginTop: '6px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────
          ROLLBACK — Hero original (descomentar para reverter)
          ─────────────────────────────────────────────────────
      <section style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.12), transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-30%', right: '-10%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(109, 232, 255, 0.08), transparent 70%)', pointerEvents: 'none' }} />
        <div className="landing-section" style={{ paddingTop: '80px', paddingBottom: '80px', position: 'relative' }}>
          <AnimatedSection>
            <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '999px', background: 'rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.1)', border: '1px solid rgba(var(--accent-r), var(--accent-g), var(--accent-b))', marginBottom: '28px', fontSize: '13px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.04em' }}>
                <Sparkles size={16} /> Programa Oficial
              </div>
              <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', letterSpacing: '-0.04em', lineHeight: 1.08, maxWidth: '100%', textAlign: 'center', marginBottom: '20px' }}>
                Torne-se um Revendedor
                <span style={{ display: 'block', background: 'linear-gradient(135deg, var(--accent), var(--cyan))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Oficial do Lovable Ultra Chat</span>
              </h1>
              <p style={{ fontSize: 'clamp(16px, 2.5vw, 19px)', maxWidth: '600px', textAlign: 'center', margin: '0 auto 36px', lineHeight: 1.7 }}>
                Crie uma nova fonte de renda revendendo licenças. Você define seus preços, compra com desconto e pode recuperar o investimento já na primeira venda.
              </p>
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '48px' }}>
                <a href="https://wa.me/556781880921?text=Ol%C3%A1!%20Vim%20pelo%20site%20e%20quero%20ser%20um%20revendedor%20oficial." target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                  <Button style={{ fontSize: '16px', minHeight: '54px', padding: '0 36px', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>Quero ser Revendedor <ArrowRight size={18} /></Button>
                </a>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(32px, 6vw, 64px)', flexWrap: 'wrap', padding: '28px 0', borderTop: '1px solid var(--line)' }}>
                {HERO_STATS.map((s) => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.03em', lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted-2)', marginTop: '6px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
      ───────────────────────────────────────────────────── */}

      {/* ─── COMO FUNCIONA ─── */}
      <section className="landing-section" style={{ paddingTop: '20px', paddingBottom: '60px' }}>
        <AnimatedSection>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <p className="eyebrow">Como funciona</p>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', letterSpacing: '-0.03em' }}>4 passos para começar a vender</h2>
          </div>
        </AnimatedSection>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
          {[
            { icon: <CreditCard size={26} />, title: 'Faça sua adesão', desc: 'Ative seu acesso ao programa com pagamento único.', num: '01' },
            { icon: <Gift size={26} />, title: 'Licença de brinde', desc: 'Receba 1 Licença Vitalícia para você usar ou revender.', num: '02' },
            { icon: <Package size={26} />, title: 'Compre licenças', desc: 'Acesse preços exclusivos a partir de R$ 19,90.', num: '03' },
            { icon: <DollarSign size={26} />, title: 'Revenda e lucre', desc: 'Defina seus preços e lucre com cada venda.', num: '04' },
          ].map((c, i) => (
            <AnimatedSection key={i} delay={i * 0.08}>
              <div style={{
                textAlign: 'center', padding: '36px 24px', borderRadius: '20px',
                background: 'linear-gradient(160deg, rgba(15, 30, 44, 0.86), rgba(7, 17, 28, 0.78))',
                border: '1px solid var(--line)', position: 'relative', overflow: 'hidden',
                transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s',
                cursor: 'default',
              }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-6px)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.3)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)' }}
              >
                {/* Step number watermark */}
                <div style={{ position: 'absolute', top: '12px', right: '16px', fontSize: '64px', fontWeight: 900, color: 'rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.06)', lineHeight: 1, pointerEvents: 'none' }}>{c.num}</div>

                <div style={{
                  width: '60px', height: '60px', borderRadius: '18px',
                  background: 'rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.1)',
                  border: '1px solid rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.15)',
                  display: 'grid', placeItems: 'center', margin: '0 auto 20px', color: 'var(--accent)',
                }}>
                  {c.icon}
                </div>
                <h3 style={{ fontSize: '17px', marginBottom: '8px', fontWeight: 700 }}>{c.title}</h3>
                <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.6 }}>{c.desc}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* ─── INVESTIMENTO ─── */}
      <section className="landing-section" style={{ paddingBottom: '60px' }}>
        <AnimatedSection>
          <div style={{
            background: 'linear-gradient(155deg, rgba(15, 30, 44, 0.95), rgba(7, 17, 28, 0.9))',
            border: '1px solid rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.25)',
            borderRadius: '28px', padding: 'clamp(32px, 5vw, 48px)', textAlign: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Glow */}
            <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.15), transparent 70%)', pointerEvents: 'none' }} />

            <div style={{ position: 'relative' }}>
              <p className="eyebrow" style={{ marginBottom: '8px' }}>Investimento Inicial</p>
              <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 28px)', marginBottom: '4px' }}>Programa Oficial de Revendedores</h2>

              <div style={{ fontSize: 'clamp(48px, 8vw, 72px)', fontWeight: 900, color: 'var(--accent)', margin: '24px 0', letterSpacing: '-0.04em', lineHeight: 1 }}>
                R$ 89,90
              </div>
              <p style={{ color: 'var(--muted)', fontSize: '15px', marginBottom: '32px' }}>Sua adesão inclui:</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', maxWidth: '640px', margin: '0 auto', textAlign: 'left' }}>
                {['Cadastro no Programa', 'Painel do Revendedor', 'Materiais de divulgação', 'Suporte dedicado', 'Direito de comprar licenças com desconto', '1 Licença Vitalícia de Brinde'].map((item) => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', padding: '8px 0' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(var(--accent-r), var(--accent-g), var(--accent-b)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <CheckCircle2 size={14} style={{ color: '#07110a' }} />
                    </div>
                    <span style={{ color: 'var(--muted)' }}>{item}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '32px', padding: '18px 24px', background: 'rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.08)', borderRadius: '16px', border: '1px solid rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.15)', fontSize: '14px', color: 'var(--muted)', maxWidth: '520px', margin: '32px auto 0', lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--accent)' }}>Apenas revendendo essa licença de brinde você pode recuperar todo o investimento inicial.</strong>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* ─── TABELA PROGRESSIVA ─── */}
      <section className="landing-section" style={{ paddingBottom: '60px' }}>
        <AnimatedSection>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <p className="eyebrow">Tabela Progressiva</p>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', letterSpacing: '-0.03em' }}>Quanto mais comprar, menos paga</h2>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.1}>
          <div style={{ maxWidth: '640px', margin: '0 auto', display: 'grid', gap: '10px' }}>
            {PRICING_TIERS.map((t) => {
              const pct = ((PRICING_TIERS[0].price - t.price) / (PRICING_TIERS[0].price - PRICING_TIERS[PRICING_TIERS.length - 1].price)) * 100
              const isBest = t.max === null
              return (
                <div key={t.min} style={{
                  display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: '16px',
                  padding: '18px 24px', borderRadius: '16px',
                  background: isBest
                    ? 'linear-gradient(135deg, rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.12), rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.04))'
                    : 'linear-gradient(160deg, rgba(15, 30, 44, 0.86), rgba(7, 17, 28, 0.78))',
                  border: `1px solid ${isBest ? 'rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.35)' : 'var(--line)'}`,
                  transition: 'border-color 0.3s, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  cursor: 'default', position: 'relative', overflow: 'hidden',
                }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.35)'; (e.currentTarget as HTMLElement).style.transform = 'translateX(4px)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = isBest ? 'rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.35)' : 'var(--line)'; (e.currentTarget as HTMLElement).style.transform = 'translateX(0)' }}
                >
                  {/* Progress bar background */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, height: '100%', width: `${pct}%`,
                    background: `linear-gradient(90deg, rgba(var(--accent-r), var(--accent-g), var(--accent-b), ${isBest ? 0.08 : 0.04}), transparent)`,
                    borderRadius: '16px', pointerEvents: 'none',
                  }} />

                  {/* Icon */}
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: isBest ? 'rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.15)' : 'rgba(255, 255, 255, 0.04)',
                    display: 'grid', placeItems: 'center', flexShrink: 0,
                    color: isBest ? 'var(--accent)' : 'var(--muted-2)',
                  }}>
                    <Package size={18} />
                  </div>

                  {/* Quantity + label */}
                  <div style={{ position: 'relative', minWidth: 0 }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: isBest ? 'var(--accent)' : 'var(--text)', whiteSpace: 'nowrap' }}>
                      {t.max ? `${t.min} a ${t.max}` : `${t.min}+`}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--muted-2)', marginTop: '1px' }}>
                      {t.max ? `${(t.max - t.min + 1)} faixa${(t.max - t.min + 1) > 1 ? 's' : ''} de licenças` : 'a partir de'}
                      {isBest && (
                        <span style={{ marginLeft: '8px', padding: '2px 8px', borderRadius: '999px', background: 'var(--accent)', color: '#07110a', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', verticalAlign: 'middle' }}>
                          Melhor preço
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  <div style={{ position: 'relative', textAlign: 'right' }}>
                    <strong style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.02em', whiteSpace: 'nowrap', display: 'block' }}>
                      {fmt(t.price)}
                    </strong>
                    <span style={{ fontSize: '11px', color: 'var(--muted-2)' }}>por licença</span>
                  </div>
                </div>
              )
            })}
          </div>
          <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--muted-2)', marginTop: '20px' }}>
            Quanto maior a quantidade adquirida, menor será o valor por licença.
          </p>
        </AnimatedSection>
      </section>

      {/* ─── CALCULADORA INTERATIVA ─── */}
      <section className="landing-section" style={{ paddingBottom: '60px' }}>
        <AnimatedSection>
          <div style={{
            background: 'linear-gradient(155deg, rgba(109, 232, 255, 0.06), rgba(157, 255, 47, 0.04))',
            border: '1px solid rgba(109, 232, 255, 0.2)',
            borderRadius: '28px', padding: 'clamp(28px, 5vw, 44px)',
            maxWidth: '740px', margin: '0 auto', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '240px', height: '240px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(109, 232, 255, 0.08), transparent 70%)', pointerEvents: 'none' }} />

            <div style={{ position: 'relative', textAlign: 'center', marginBottom: '28px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--cyan)', marginBottom: '8px' }}>
                <Calculator size={20} />
              </div>
              <p className="eyebrow" style={{ marginBottom: '6px' }}>Calculadora de Lucro</p>
              <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 28px)', letterSpacing: '-0.03em' }}>Simule seu potencial de ganho</h2>
            </div>

            <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
              <label style={{ display: 'block' }}>
                <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Quantidade de licenças</span>
                <input
                  type="number" min={1} max={500} value={calcQty}
                  onChange={(e) => setCalcQty(Math.max(1, Number(e.target.value)))}
                  style={{ marginTop: 0 }}
                />
                <span style={{ fontSize: '12px', color: 'var(--accent)', marginTop: '6px', display: 'block', fontWeight: 600 }}>
                  Custo unitário: {fmt(unitCost)}
                </span>
              </label>
              <label style={{ display: 'block' }}>
                <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Preço médio de venda</span>
                <input
                  type="number" min={1} value={calcPrice}
                  onChange={(e) => setCalcPrice(Math.max(1, Number(e.target.value)))}
                  style={{ marginTop: 0 }}
                />
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                  {[89.90, 169.90, 299].map((p) => (
                    <button key={p} onClick={() => setCalcPrice(p)}
                      style={{
                        padding: '6px 14px', borderRadius: '10px', cursor: 'pointer',
                        border: `1.5px solid ${calcPrice === p ? 'var(--accent)' : 'var(--line)'}`,
                        background: calcPrice === p ? 'rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.15)' : 'transparent',
                        color: calcPrice === p ? 'var(--accent)' : 'var(--muted)',
                        fontSize: '13px', fontWeight: 700, transition: 'all 0.2s',
                      }}>
                      {fmt(p)}
                    </button>
                  ))}
                </div>
              </label>
            </div>

            {/* Results grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px', marginTop: '32px', position: 'relative' }}>
              {[
                { label: 'Investimento', value: fmt(calcInvestment), color: 'var(--cyan)', icon: <CreditCard size={16} /> },
                { label: 'Faturamento', value: fmt(calcRevenue), color: 'var(--accent)', icon: <TrendingUp size={16} /> },
                { label: 'Lucro Bruto', value: fmt(calcProfit), color: '#14e6b8', icon: <DollarSign size={16} /> },
                { label: 'Margem', value: `${calcMargin}%`, color: '#b47aff', icon: <BarChart3 size={16} /> },
              ].map((s) => (
                <div key={s.label} style={{
                  textAlign: 'center', padding: '20px 12px', borderRadius: '16px',
                  background: 'rgba(0,0,0,0.3)', border: '1px solid var(--line)',
                  transition: 'border-color 0.2s',
                }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${s.color}40` }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '8px', color: 'var(--muted-2)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                    {s.icon}
                    {s.label}
                  </div>
                  <strong style={{ fontSize: 'clamp(18px, 3vw, 24px)', color: s.color, letterSpacing: '-0.03em' }}>{s.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* ─── POTENCIAL DE LUCRO ─── */}
      <section className="landing-section" style={{ paddingBottom: '60px' }}>
        <AnimatedSection>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <p className="eyebrow">Potencial de Lucro</p>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', letterSpacing: '-0.03em' }}>Simulação com Plano Vitalício (R$ 299)</h2>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.1}>
          <div style={{ maxWidth: '740px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            {PROFIT_TABLE.map((r, i) => {
              const margin = Math.round((r.profit / r.revenue) * 100)
              return (
                <AnimatedSection key={r.qty} delay={0.05 * i}>
                  <div style={{
                    padding: '24px 20px', borderRadius: '18px',
                    background: i === PROFIT_TABLE.length - 1
                      ? 'linear-gradient(135deg, rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.12), rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.04))'
                      : 'linear-gradient(160deg, rgba(15, 30, 44, 0.86), rgba(7, 17, 28, 0.78))',
                    border: `1px solid ${i === PROFIT_TABLE.length - 1 ? 'rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.35)' : 'var(--line)'}`,
                    position: 'relative', overflow: 'hidden',
                    transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s',
                    cursor: 'default',
                  }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.4)' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.borderColor = i === PROFIT_TABLE.length - 1 ? 'rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.35)' : 'var(--line)' }}
                  >
                    {i === PROFIT_TABLE.length - 1 && (
                      <div style={{ position: 'absolute', top: '12px', right: '14px', padding: '3px 10px', borderRadius: '999px', background: 'var(--accent)', color: '#07110a', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Maior lucro
                      </div>
                    )}

                    {/* License count */}
                    <div style={{ fontSize: '13px', color: 'var(--muted-2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                      {r.qty} licenças
                    </div>

                    {/* Profit hero */}
                    <div style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 900, color: 'var(--accent)', letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '14px' }}>
                      {fmt(r.profit)}
                    </div>

                    {/* Supporting data */}
                    <div style={{ display: 'grid', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--line)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span style={{ color: 'var(--muted-2)' }}>Investimento</span>
                        <span style={{ color: 'var(--text)', fontWeight: 600 }}>{fmt(r.invest)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span style={{ color: 'var(--muted-2)' }}>Receita</span>
                        <span style={{ color: 'var(--text)', fontWeight: 600 }}>{fmt(r.revenue)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span style={{ color: 'var(--muted-2)' }}>Margem</span>
                        <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{margin}%</span>
                      </div>
                    </div>

                    {/* Visual bar */}
                    <div style={{ marginTop: '14px', height: '4px', borderRadius: '999px', background: 'rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.1)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${margin}%`, borderRadius: '999px', background: 'linear-gradient(90deg, var(--accent), var(--cyan))' }} />
                    </div>
                  </div>
                </AnimatedSection>
              )
            })}
          </div>
          <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--muted-2)', marginTop: '24px', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
            Os valores acima são apenas uma simulação considerando a venda pelo preço sugerido do plano Vitalício. Cada revendedor define sua própria estratégia comercial.
          </p>
        </AnimatedSection>
      </section>

      {/* ─── COMO VENDER ─── */}
      <section className="landing-section" style={{ paddingBottom: '60px' }}>
        <AnimatedSection>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <p className="eyebrow">Flexibilidade total</p>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', letterSpacing: '-0.03em' }}>Você escolhe como vender</h2>
          </div>
        </AnimatedSection>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '14px', maxWidth: '900px', margin: '0 auto' }}>
          {SELLING_OPTIONS.map((o, i) => (
            <AnimatedSection key={o.label} delay={i * 0.06}>
              <div style={{
                textAlign: 'center', padding: '28px 18px', borderRadius: '20px',
                background: 'linear-gradient(160deg, rgba(15, 30, 44, 0.86), rgba(7, 17, 28, 0.78))',
                border: '1px solid var(--line)', position: 'relative', overflow: 'hidden',
                transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s',
                cursor: 'default',
              }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-5px)'; (e.currentTarget as HTMLElement).style.borderColor = `${o.color}40` }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)' }}
              >
                <div style={{
                  width: '48px', height: '48px', borderRadius: '14px',
                  background: `${o.color}15`, border: `1px solid ${o.color}30`,
                  display: 'grid', placeItems: 'center', margin: '0 auto 14px', color: o.color,
                }}>
                  {o.icon}
                </div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', margin: '0 0 6px' }}>{o.label}</p>
                <strong style={{ fontSize: '20px', color: o.color, letterSpacing: '-0.02em' }}>{o.price}</strong>
              </div>
            </AnimatedSection>
          ))}
        </div>

        <AnimatedSection delay={0.3}>
          <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--muted-2)', marginTop: '24px', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
            Você pode vender exatamente como a plataforma vende ou criar sua própria estratégia comercial. O preço final é definido por você.
            Recomendamos respeitar o preço mínimo sugerido para preservar o mercado de todos os revendedores.
          </p>
        </AnimatedSection>
      </section>

      {/* ─── POR QUE VALE A PENA ─── */}
      <section className="landing-section" style={{ paddingBottom: '60px' }}>
        <AnimatedSection>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <p className="eyebrow">Vantagens</p>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', letterSpacing: '-0.03em' }}>Por que vale a pena?</h2>
          </div>
        </AnimatedSection>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
          {WHY_ITEMS.map((item, i) => (
            <AnimatedSection key={item.label} delay={i * 0.05}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '16px', padding: '22px',
                borderRadius: '18px', background: 'linear-gradient(160deg, rgba(15, 30, 44, 0.86), rgba(7, 17, 28, 0.78))',
                border: '1px solid var(--line)',
                transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s',
                cursor: 'default',
              }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.25)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)' }}
              >
                <div style={{
                  width: '46px', height: '46px', borderRadius: '14px',
                  background: 'rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.1)',
                  border: '1px solid rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.15)',
                  display: 'grid', placeItems: 'center', color: 'var(--accent)', flexShrink: 0,
                }}>
                  {item.icon}
                </div>
                <div>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', display: 'block' }}>{item.label}</span>
                  <span style={{ fontSize: '12px', color: 'var(--muted-2)' }}>{item.desc}</span>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* ─── TRUST BAR ─── */}
      <section className="landing-section" style={{ paddingBottom: '60px' }}>
        <AnimatedSection>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px',
            padding: '32px', borderRadius: '20px',
            background: 'rgba(0, 0, 0, 0.2)', border: '1px solid var(--line)',
          }}>
            {[
              { icon: <Shield size={20} />, label: 'Pagamento seguro', desc: 'Dados protegidos' },
              { icon: <Clock size={20} />, label: 'Ativação imediata', desc: 'Acesso instantâneo' },
              { icon: <Users size={20} />, label: 'Comunidade ativa', desc: 'Networking com outros revendedores' },
              { icon: <Star size={20} />, label: 'Produto top', desc: 'Alta demanda no mercado' },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '4px 0' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.08)', display: 'grid', placeItems: 'center', color: 'var(--accent)', flexShrink: 0 }}>
                  {item.icon}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>{item.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted-2)' }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </section>

      {/* ─── FAQ ─── */}
      <section className="landing-section" style={{ paddingBottom: '20px' }}>
        <AnimatedSection>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <p className="eyebrow">Dúvidas</p>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', letterSpacing: '-0.03em' }}>Perguntas Frequentes</h2>
          </div>
        </AnimatedSection>

        <div style={{ maxWidth: '700px', margin: '0 auto', display: 'grid', gap: '10px' }}>
          {FAQ_ITEMS.map((item, i) => (
            <AnimatedSection key={i} delay={i * 0.06}>
              <div
                style={{
                  padding: 0, overflow: 'hidden', cursor: 'pointer', borderRadius: '16px',
                  background: 'linear-gradient(160deg, rgba(15, 30, 44, 0.86), rgba(7, 17, 28, 0.78))',
                  border: `1px solid ${openFaq === i ? 'rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.35)' : 'var(--line)'}`,
                  transition: 'border-color 0.3s',
                }}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', gap: '16px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>{item.q}</span>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                    background: openFaq === i ? 'rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.12)' : 'rgba(255, 255, 255, 0.04)',
                    display: 'grid', placeItems: 'center', color: openFaq === i ? 'var(--accent)' : 'var(--muted-2)',
                    transition: 'all 0.3s',
                  }}>
                    {openFaq === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>
                <div style={{
                  maxHeight: openFaq === i ? '200px' : '0',
                  opacity: openFaq === i ? 1 : 0,
                  transition: 'max-height 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease, padding 0.35s',
                  padding: openFaq === i ? '0 24px 20px' : '0 24px',
                }}>
                  <div style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.7, paddingTop: '16px', borderTop: '1px solid var(--line)' }}>
                    {item.a}
                  </div>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* ─── CTA FINAL ─── */}
      <section className="landing-section" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
        <AnimatedSection>
          <div style={{
            background: 'linear-gradient(155deg, rgba(157, 255, 47, 0.1), rgba(109, 232, 255, 0.08))',
            border: '1px solid rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.2)',
            borderRadius: '28px', padding: 'clamp(40px, 6vw, 64px)', textAlign: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Glow */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.1), transparent 70%)', pointerEvents: 'none' }} />

            <div style={{ position: 'relative' }}>
              <h2 style={{ fontSize: 'clamp(28px, 4.5vw, 40px)', letterSpacing: '-0.04em', marginBottom: '12px' }}>Comece hoje mesmo</h2>
              <p style={{ fontSize: '17px', maxWidth: '520px', margin: '0 auto 36px', lineHeight: 1.7 }}>
                Faça parte do Programa Oficial de Revendedores e transforme o Lovable Ultra Chat em uma nova oportunidade de negócio.
              </p>
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <a href="https://wa.me/556781880921?text=Ol%C3%A1!%20Vim%20pelo%20site%20e%20quero%20ser%20um%20revendedor%20oficial." target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                  <Button style={{ fontSize: '16px', minHeight: '54px', padding: '0 36px', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                    Quero ser Revendedor <ArrowRight size={18} />
                  </Button>
                </a>
                <a href="https://wa.me/556781880921?text=Ol%C3%A1!%20Tenho%20d%C3%BAvidas%20sobre%20o%20programa%20de%20revendedores." target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                  <Button variant="outline" style={{ fontSize: '16px', minHeight: '54px', padding: '0 36px' }}>Tirar Dúvidas</Button>
                </a>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <Logo variant="user" href="/user" />
          <p>© 2026 Ultra Chat. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
