import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, SUPABASE_URL, FUNCTIONS } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { Button } from '../components/ui/button'
import { Navbar } from '../components/landing/Navbar'
import { Footer } from '../components/landing/Footer'
import { ArrowLeft, CheckCircle, Clock, Smartphone, Headphones, User, Mail, Phone, CreditCard } from 'lucide-react'
import { formatWhatsApp, cleanDigits } from '../utils/format'

interface Product {
  id: string
  name: string
  slug: string
  description: string
  days: number
  price_cents: number
  devices: number
  has_priority_support: boolean
}

interface PaymentResponse {
  success: boolean
  payment_id: string
  product: {
    name: string
    days: number
    devices: number
    has_priority_support: boolean
  }
  pix: {
    qr_code: string
    qr_code_base64: string
    ticket_url: string
  }
}

type Step = 'loading' | 'form' | 'pix' | 'success' | 'error'

function formatCPF(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

export default function Checkout() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast } = useToast()

  const [product, setProduct] = useState<Product | null>(null)
  const [step, setStep] = useState<Step>('loading')
  const [payment, setPayment] = useState<PaymentResponse | null>(null)
  const [copied, setCopied] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [generating, setGenerating] = useState(false)

  const [buyerName, setBuyerName] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  const [buyerWhatsapp, setBuyerWhatsapp] = useState('')
  const [buyerCpf, setBuyerCpf] = useState('')

  useEffect(() => {
    if (user?.user_metadata) {
      const meta = user.user_metadata
      if (meta.name) setBuyerName(meta.name as string)
      if (meta.whatsapp) setBuyerWhatsapp(formatWhatsApp(meta.whatsapp as string))
      if (meta.cpf) setBuyerCpf(formatCPF(meta.cpf as string))
    }
    if (user?.email) setBuyerEmail(user.email)
  }, [user])

  useEffect(() => {
    if (!slug) return
    loadProduct(slug)
  }, [slug])

  async function loadProduct(productSlug: string) {
    try {
      const { data, error } = await supabase
        .from('products_endcustomer')
        .select('*')
        .eq('slug', productSlug)
        .eq('active', true)
        .single()

      if (error || !data) {
        setErrorMsg('Produto não encontrado')
        setStep('error')
        return
      }

      setProduct(data)
      setStep('form')
    } catch {
      setErrorMsg('Erro ao carregar produto')
      setStep('error')
    }
  }

  async function handleStartPayment() {
    if (!user || !product) return

    if (!buyerName.trim() || !buyerEmail.trim() || !buyerWhatsapp.trim() || !buyerCpf.trim()) {
      showToast('Preencha todos os dados do comprador', 'error')
      return
    }

    const cleanedCPF = buyerCpf.replace(/\D/g, '')
    if (cleanedCPF.length !== 11) {
      showToast('CPF deve ter 11 dígitos', 'error')
      return
    }

    const cleanedWhatsApp = buyerWhatsapp.replace(/\D/g, '')
    if (cleanedWhatsApp.length !== 11) {
      showToast('WhatsApp deve ter 11 dígitos', 'error')
      return
    }

    setGenerating(true)
    setStep('loading')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`${SUPABASE_URL}${FUNCTIONS.CUSTOMER_CREATE_PAYMENT}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_slug: slug,
          buyer_name: buyerName.trim(),
          buyer_email: buyerEmail.trim(),
          buyer_whatsapp: cleanDigits(buyerWhatsapp),
          buyer_cpf: cleanedCPF,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao gerar pagamento')
      }

      setPayment(result)
      setStep('pix')

      startPolling(result.payment_id)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao gerar pagamento'
      setErrorMsg(msg)
      showToast(msg, 'error')
      setStep('form')
    } finally {
      setGenerating(false)
    }
  }

  function startPolling(paymentId: string) {
    let attempts = 0
    const maxAttempts = 120

    const interval = setInterval(async () => {
      attempts++
      if (attempts > maxAttempts) {
        clearInterval(interval)
        showToast('Tempo limite excedido. Recarregue a página.', 'error')
        return
      }

      try {
        const { data: { session } } = await supabase.auth.getSession()
        const response = await fetch(`${SUPABASE_URL}${FUNCTIONS.CUSTOMER_CHECK_PAYMENT}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ payment_id: paymentId }),
        })

        const result = await response.json()

        if (result.success && result.status === 'approved') {
          clearInterval(interval)
          setStep('success')

          setTimeout(() => {
            navigate('/user', { replace: true })
          }, 3000)
        }
      } catch {
        // Ignorar erros de polling
      }
    }, 5000)
  }

  function handleCopyCode() {
    if (!payment?.pix.qr_code) return
    navigator.clipboard.writeText(payment.pix.qr_code)
    setCopied(true)
    showToast('Código Pix copiado!', 'success')
    setTimeout(() => setCopied(false), 3000)
  }

  function formatPrice(cents: number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100)
  }

  if (step === 'loading' && !product) {
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #050b12 0%, #03070d 100%)', color: 'var(--text)' }}>
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="loading-spinner-large" />
        </div>
        <Footer />
      </div>
    )
  }

  if (step === 'error' && !product) {
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #050b12 0%, #03070d 100%)', color: 'var(--text)' }}>
        <Navbar />
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
          <h1 className="text-2xl font-bold">Produto não encontrado</h1>
          <p style={{ color: 'var(--muted)' }}>{errorMsg}</p>
          <Button onClick={() => navigate('/')}>Voltar para início</Button>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #050b12 0%, #03070d 100%)', color: 'var(--text)' }}>
      <Navbar />

      <main className="mx-auto max-w-2xl px-4 py-16 md:px-6 md:py-24">
        <button
          onClick={() => navigate(-1)}
          className="mb-8 inline-flex items-center gap-2 text-sm transition hover:opacity-70"
          style={{ color: 'var(--muted)' }}
        >
          <ArrowLeft className="size-4" /> Voltar
        </button>

        {step === 'form' && product && (
          <div className="rounded-2xl border p-6 md:p-8" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              Checkout
            </span>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight">{product.name}</h1>
            <p className="mt-2" style={{ color: 'var(--muted)' }}>{product.description}</p>

            <div className="mt-8 rounded-xl p-4" style={{ background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.15)' }}>
              <div className="text-4xl font-black">{formatPrice(product.price_cents)}</div>
              <div className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
                Pagamento único via Pix
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 text-sm" style={{ color: 'var(--muted)' }}>
              <div className="inline-flex items-center gap-2">
                <Clock className="size-4" style={{ color: 'var(--brand-green)' }} /> {product.days} dias de acesso
              </div>
              <div className="inline-flex items-center gap-2">
                <Smartphone className="size-4" style={{ color: 'var(--brand-green)' }} /> Até {product.devices} dispositivo{product.devices > 1 ? 's' : ''}
              </div>
              {product.has_priority_support && (
                <div className="inline-flex items-center gap-2">
                  <Headphones className="size-4" style={{ color: 'var(--brand-green)' }} /> Suporte prioritário
                </div>
              )}
            </div>

            {user ? (
              <>
                <div className="mt-8 rounded-xl border p-4" style={{ borderColor: 'rgba(168, 85, 247, 0.15)', background: 'rgba(168, 85, 247, 0.03)' }}>
                  <h3 className="flex items-center gap-2 text-sm font-semibold mb-4">
                    <User className="size-4" /> Dados do comprador
                  </h3>

                  <div className="stack-form" style={{ gap: '12px' }}>
                    <label>
                      <span><User className="size-3" /> Nome completo</span>
                      <input
                        type="text"
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                        placeholder="João Silva"
                        required
                      />
                    </label>
                    <label>
                      <span><Mail className="size-3" /> Email</span>
                      <input
                        type="email"
                        value={buyerEmail}
                        onChange={(e) => setBuyerEmail(e.target.value)}
                        placeholder="email@exemplo.com"
                        required
                      />
                    </label>
                    <div className="split-fields">
                      <label>
                        <span><Phone className="size-3" /> WhatsApp</span>
                        <input
                          type="text"
                          value={buyerWhatsapp}
                          onChange={(e) => setBuyerWhatsapp(formatWhatsApp(e.target.value))}
                          placeholder="(11) 9 9999-9999"
                          required
                        />
                      </label>
                      <label>
                        <span><CreditCard className="size-3" /> CPF</span>
                        <input
                          type="text"
                          value={buyerCpf}
                          onChange={(e) => setBuyerCpf(formatCPF(e.target.value))}
                          placeholder="000.000.000-00"
                          required
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <Button
                  className="mt-6 h-14 w-full text-base font-bold"
                  onClick={handleStartPayment}
                  disabled={generating}
                  isLoading={generating}
                >
                  {generating ? 'Gerando Pix...' : 'Gerar Pix para pagamento'}
                </Button>
              </>
            ) : (
              <div className="mt-8 rounded-xl border p-4 text-center" style={{ borderColor: 'rgba(168, 85, 247, 0.2)', background: 'rgba(168, 85, 247, 0.05)' }}>
                <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Faça login para continuar</p>
                <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>Crie sua conta ou entre para gerar o pagamento.</p>
                <div className="mt-4 flex gap-3 justify-center">
                  <Button onClick={() => navigate(`/signup?redirect=/checkout/${slug}`)}>Criar conta grátis</Button>
                  <Button variant="outline" onClick={() => navigate(`/login?redirect=/checkout/${slug}`)}>Entrar</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 'pix' && payment && (
          <div className="rounded-2xl border p-6 text-center md:p-8" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <h1 className="text-2xl font-extrabold tracking-tight">Pague com Pix</h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
              Escaneie o QR Code ou copie o código Pix para pagar
            </p>

            <div className="my-8 mx-auto flex flex-col items-center gap-4">
              {payment.pix.qr_code_base64 ? (
                <img
                  src={`data:image/png;base64,${payment.pix.qr_code_base64}`}
                  alt="QR Code Pix"
                  className="size-56 rounded-xl border"
                  style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'white' }}
                />
              ) : (
                <div className="flex size-56 items-center justify-center rounded-xl border" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  <span style={{ color: 'var(--muted)' }}>QR Code indisponível</span>
                </div>
              )}

              <div className="w-full max-w-sm rounded-xl border p-3 text-center" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                  Código Pix copia e cola
                </p>
                <p className="break-all text-xs font-mono" style={{ color: 'var(--text)' }}>
                  {payment.pix.qr_code}
                </p>
                <Button
                  variant="outline"
                  size="tiny"
                  className="mt-2"
                  onClick={handleCopyCode}
                >
                  {copied ? 'Copiado!' : 'Copiar código'}
                </Button>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm animate-pulse" style={{ background: 'rgba(45, 212, 191, 0.1)', color: 'var(--brand-green)' }}>
              <Clock className="size-4" />
              Aguardando confirmação do pagamento...
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="rounded-2xl border p-8 text-center" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <CheckCircle className="mx-auto size-16" style={{ color: 'var(--brand-green)' }} />
            <h1 className="mt-4 text-2xl font-extrabold tracking-tight">Pagamento confirmado!</h1>
            <p className="mt-2" style={{ color: 'var(--muted)' }}>
              Sua licença foi gerada e você será redirecionado para o painel.
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
