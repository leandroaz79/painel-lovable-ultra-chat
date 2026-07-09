import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/button'
import { Logo } from '../components/ui/Logo'
import { ChevronDown, ChevronUp, CreditCard, Gift, Package, DollarSign, BarChart3, Target, Zap, Wrench, Handshake, ShoppingBag } from 'lucide-react'

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
  { icon: '☀️', label: 'Diário', price: 'R$ 9,90' },
  { icon: '📅', label: 'Semanal', price: 'R$ 34,90' },
  { icon: '📆', label: 'Mensal', price: 'R$ 89,90' },
  { icon: '📈', label: 'Trimestral', price: 'R$ 169,90' },
  { icon: '👑', label: 'Vitalício', price: 'R$ 299,00' },
]

const WHY_ITEMS = [
  { icon: <DollarSign size={22} />, label: 'Alto potencial de lucro' },
  { icon: <BarChart3 size={22} />, label: 'Escalabilidade' },
  { icon: <Target size={22} />, label: 'Liberdade para definir preços' },
  { icon: <Zap size={22} />, label: 'Licenças Vitalícias' },
  { icon: <Wrench size={22} />, label: 'Atualizações constantes' },
  { icon: <Handshake size={22} />, label: 'Suporte exclusivo' },
  { icon: <ShoppingBag size={22} />, label: 'Compra sob demanda' },
]

export default function ResellerProgram() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [calcQty, setCalcQty] = useState(10)
  const [calcPrice, setCalcPrice] = useState(299)

  const unitCost = getUnitPrice(calcQty)
  const calcInvestment = Math.round(unitCost * calcQty)
  const calcRevenue = Math.round(calcPrice * calcQty)
  const calcProfit = calcRevenue - calcInvestment
  const calcMargin = calcRevenue > 0 ? Math.round((calcProfit / calcRevenue) * 100) : 0

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  return (
    <div className="landing-page">
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

      {/* HERO */}
      <section className="landing-section" style={{ paddingTop: '60px', paddingBottom: '48px' }}>
        <div className="hero-panel" style={{ background: 'linear-gradient(135deg, rgba(109,232,255,0.08), rgba(157,255,47,0.06))', flexDirection: 'column', textAlign: 'center', alignItems: 'center' }}>
          <p className="eyebrow" style={{ marginBottom: '12px' }}>Programa de Revendedores</p>
          <h1 style={{ maxWidth: '700px', textAlign: 'center', fontSize: 'clamp(28px, 4vw, 40px)' }}>
            Torne-se um Revendedor Oficial do Lovable Ultra Chat
          </h1>
          <p style={{ fontSize: '17px', maxWidth: '560px', textAlign: 'center', marginBottom: '28px' }}>
            Crie uma nova fonte de renda revendendo licenças do Lovable Ultra Chat. Você define seus preços, compra licenças com desconto e pode recuperar seu investimento já na primeira venda.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button onClick={() => navigate('/user')} style={{ fontSize: '16px', minHeight: '52px', padding: '0 32px' }}>
              Quero ser Revendedor
            </Button>
            <a href="https://wa.me/556781880921?text=Ol%C3%A1!%20Vim%20pelo%20site%20e%20quero%20saber%20sobre%20o%20programa%20de%20revendedores." target="_blank" rel="noopener noreferrer">
              <Button variant="outline" style={{ fontSize: '16px', minHeight: '52px', padding: '0 32px' }}>Falar com o Suporte</Button>
            </a>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="landing-section" style={{ paddingTop: '16px' }}>
        <div className="section-header" style={{ textAlign: 'center' }}>
          <p className="eyebrow">Como funciona</p>
          <h2>4 passos para começar a vender</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginTop: '24px' }}>
          {[
            { icon: <CreditCard size={28} />, title: 'Faça sua adesão', desc: 'Ative seu acesso ao programa com pagamento único.' },
            { icon: <Gift size={28} />, title: 'Licença de brinde', desc: 'Receba 1 Licença Vitalícia para você usar ou revender.' },
            { icon: <Package size={28} />, title: 'Compre licenças', desc: 'Acesse preços exclusivos a partir de R$ 19,90.' },
            { icon: <DollarSign size={28} />, title: 'Revenda e lucre', desc: 'Defina seus preços e lucre com cada venda.' },
          ].map((c, i) => (
            <div key={i} className="glass-card" style={{ textAlign: 'center', padding: '28px 20px', transition: 'transform 0.2s', cursor: 'default' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
            >
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.12)', display: 'grid', placeItems: 'center', margin: '0 auto 16px', color: 'var(--accent)' }}>
                {c.icon}
              </div>
              <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>{c.title}</h3>
              <p style={{ fontSize: '14px', color: 'var(--muted)' }}>{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* INVESTIMENTO */}
      <section className="landing-section" style={{ paddingTop: '40px' }}>
        <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(15,30,44,0.95), rgba(7,17,28,0.9))', border: '1px solid rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.25)', padding: '36px', textAlign: 'center' }}>
          <p className="eyebrow" style={{ marginBottom: '8px' }}>Investimento Inicial</p>
          <h2 style={{ fontSize: '22px', marginBottom: '4px' }}>Programa Oficial de Revendedores</h2>
          <div style={{ fontSize: 'clamp(36px, 6vw, 52px)', fontWeight: 800, color: 'var(--accent)', margin: '20px 0', letterSpacing: '-0.03em' }}>
            R$ 89,90
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '24px' }}>Sua adesão inclui:</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', maxWidth: '600px', margin: '0 auto', textAlign: 'left' }}>
            {['Cadastro no Programa', 'Painel do Revendedor', 'Materiais de divulgação', 'Suporte', 'Direito de comprar licenças com desconto', '1 Licença Vitalícia de Brinde'].map((item) => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
                <span style={{ color: 'var(--accent)', fontWeight: 700 }}>✓</span>
                <span style={{ color: 'var(--muted)' }}>{item}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '28px', padding: '16px', background: 'rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.08)', borderRadius: '14px', border: '1px solid rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.15)', fontSize: '14px', color: 'var(--muted)', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
            <strong style={{ color: 'var(--accent)' }}>Apenas revendendo essa licença de brinde você pode recuperar todo o investimento inicial.</strong>
          </div>
        </div>
      </section>

      {/* TABELA PROGRESSIVA */}
      <section className="landing-section" style={{ paddingTop: '40px' }}>
        <div className="section-header" style={{ textAlign: 'center' }}>
          <p className="eyebrow">Tabela Progressiva</p>
          <h2>Quanto mais comprar, menos paga</h2>
        </div>
        <div className="table-card" style={{ marginTop: '20px', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Quantidade</th>
                  <th style={{ textAlign: 'right' }}>Valor por Licença</th>
                </tr>
              </thead>
              <tbody>
                {PRICING_TIERS.map((t) => (
                  <tr key={t.min}>
                    <td>{t.max ? `${t.min}–${t.max}` : `${t.min}+`}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--accent)' }}>{fmt(t.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--muted-2)', marginTop: '16px' }}>
          Quanto maior a quantidade adquirida, menor será o valor por licença.
        </p>
      </section>

      {/* CALCULADORA INTERATIVA */}
      <section className="landing-section" style={{ paddingTop: '40px' }}>
        <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(109,232,255,0.06), rgba(157,255,47,0.04))', border: '1px solid rgba(109,232,255,0.2)', padding: '32px', maxWidth: '700px', marginLeft: 'auto', marginRight: 'auto' }}>
          <div className="section-header" style={{ textAlign: 'center' }}>
            <p className="eyebrow">Calculadora de Lucro</p>
            <h2>Simule seu potencial de ganho</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginTop: '24px' }}>
            <label>
              <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Quantidade de licenças</span>
              <input type="number" min={1} max={500} value={calcQty} onChange={(e) => setCalcQty(Math.max(1, Number(e.target.value)))} style={{ marginTop: '6px' }} />
              <span style={{ fontSize: '12px', color: 'var(--muted-2)', marginTop: '4px', display: 'block' }}>Custo unitário: {fmt(unitCost)}</span>
            </label>
            <label>
              <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Preço médio de venda</span>
              <input type="number" min={1} value={calcPrice} onChange={(e) => setCalcPrice(Math.max(1, Number(e.target.value)))} style={{ marginTop: '6px' }} />
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                {[89.90, 169.90, 299].map((p) => (
                  <button key={p} onClick={() => setCalcPrice(p)}
                    style={{ padding: '4px 10px', borderRadius: '8px', border: `1px solid ${calcPrice === p ? 'var(--accent)' : 'var(--line)'}`, background: calcPrice === p ? 'rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.15)' : 'transparent', color: calcPrice === p ? 'var(--accent)' : 'var(--muted)', fontSize: '12px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.15s' }}>
                    {fmt(p)}
                  </button>
                ))}
              </div>
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginTop: '28px' }}>
            {[
              { label: 'Investimento', value: fmt(calcInvestment), color: 'var(--cyan)' },
              { label: 'Faturamento', value: fmt(calcRevenue), color: 'var(--accent)' },
              { label: 'Lucro Bruto', value: fmt(calcProfit), color: '#14e6b8' },
              { label: 'Margem', value: `${calcMargin}%`, color: '#7c5aff' },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: 'center', padding: '16px 8px', background: 'rgba(0,0,0,0.3)', borderRadius: '14px', border: '1px solid var(--line)' }}>
                <p style={{ fontSize: '11px', color: 'var(--muted-2)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
                <strong style={{ fontSize: 'clamp(16px, 3vw, 22px)', color: s.color }}>{s.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* POTENCIAL DE LUCRO */}
      <section className="landing-section" style={{ paddingTop: '40px' }}>
        <div className="section-header" style={{ textAlign: 'center' }}>
          <p className="eyebrow">Potencial de Lucro</p>
          <h2>Simulação com Plano Vitalício (R$ 299)</h2>
        </div>
        <div className="table-card" style={{ marginTop: '20px', maxWidth: '700px', marginLeft: 'auto', marginRight: 'auto' }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Licenças</th>
                  <th>Investimento</th>
                  <th>Receita</th>
                  <th>Lucro Bruto</th>
                </tr>
              </thead>
              <tbody>
                {PROFIT_TABLE.map((r) => (
                  <tr key={r.qty}>
                    <td style={{ fontWeight: 700 }}>{r.qty}</td>
                    <td>{fmt(r.invest)}</td>
                    <td>{fmt(r.revenue)}</td>
                    <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{fmt(r.profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--muted-2)', marginTop: '16px', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
          Os valores acima são apenas uma simulação considerando a venda pelo preço sugerido do plano Vitalício. Cada revendedor define sua própria estratégia comercial.
        </p>
      </section>

      {/* COMO VENDER */}
      <section className="landing-section" style={{ paddingTop: '40px' }}>
        <div className="section-header" style={{ textAlign: 'center' }}>
          <p className="eyebrow">Flexibilidade total</p>
          <h2>Você escolhe como vender</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginTop: '24px', maxWidth: '800px', marginLeft: 'auto', marginRight: 'auto' }}>
          {SELLING_OPTIONS.map((o) => (
            <div key={o.label} className="glass-card" style={{ textAlign: 'center', padding: '24px 16px', transition: 'transform 0.2s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
            >
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>{o.icon}</div>
              <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', margin: '0 0 4px' }}>{o.label}</p>
              <strong style={{ fontSize: '18px', color: 'var(--accent)' }}>{o.price}</strong>
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--muted-2)', marginTop: '16px', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
          Você pode vender exatamente como a plataforma vende ou criar sua própria estratégia comercial. O preço final é definido por você.
          Recomendamos respeitar o preço mínimo sugerido para preservar o mercado de todos os revendedores.
        </p>
      </section>

      {/* POR QUE VALE A PENA */}
      <section className="landing-section" style={{ paddingTop: '40px' }}>
        <div className="section-header" style={{ textAlign: 'center' }}>
          <p className="eyebrow">Vantagens</p>
          <h2>Por que vale a pena?</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginTop: '24px' }}>
          {WHY_ITEMS.map((item) => (
            <div key={item.label} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '20px', transition: 'transform 0.2s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
            >
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.1)', display: 'grid', placeItems: 'center', color: 'var(--accent)', flexShrink: 0 }}>
                {item.icon}
              </div>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="landing-section" style={{ paddingTop: '40px', paddingBottom: '16px' }}>
        <div className="section-header" style={{ textAlign: 'center' }}>
          <p className="eyebrow">Dúvidas</p>
          <h2>Perguntas Frequentes</h2>
        </div>
        <div style={{ maxWidth: '700px', margin: '24px auto 0', display: 'grid', gap: '8px' }}>
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className="glass-card" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }}
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px' }}>
                <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>{item.q}</span>
                {openFaq === i ? <ChevronUp size={18} style={{ color: 'var(--muted)', flexShrink: 0 }} /> : <ChevronDown size={18} style={{ color: 'var(--muted)', flexShrink: 0 }} />}
              </div>
              {openFaq === i && (
                <div style={{ padding: '0 20px 18px', fontSize: '14px', color: 'var(--muted)', lineHeight: 1.6, borderTop: '1px solid var(--line)', paddingTop: '14px' }}>
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="landing-section" style={{ paddingTop: '40px', paddingBottom: '60px' }}>
        <div className="hero-panel" style={{ background: 'linear-gradient(135deg, rgba(157,255,47,0.1), rgba(109,232,255,0.08))', border: '1px solid rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.2)', flexDirection: 'column', textAlign: 'center', alignItems: 'center' }}>
          <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 32px)', textAlign: 'center' }}>Comece hoje mesmo</h2>
          <p style={{ fontSize: '16px', maxWidth: '500px', textAlign: 'center', marginBottom: '28px' }}>
            Faça parte do Programa Oficial de Revendedores e transforme o Lovable Ultra Chat em uma nova oportunidade de negócio.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button onClick={() => navigate('/user')} style={{ fontSize: '16px', minHeight: '52px', padding: '0 32px' }}>
              Quero ser Revendedor
            </Button>
            <a href="https://wa.me/556781880921?text=Ol%C3%A1!%20Tenho%20d%C3%BAvidas%20sobre%20o%20programa%20de%20revendedores." target="_blank" rel="noopener noreferrer">
              <Button variant="outline" style={{ fontSize: '16px', minHeight: '52px', padding: '0 32px' }}>Tirar Dúvidas</Button>
            </a>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="footer-inner">
          <Logo variant="user" href="/user" />
          <p>© 2026 Ultra Chat. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
