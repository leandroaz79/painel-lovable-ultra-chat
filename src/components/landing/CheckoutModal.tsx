import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, SUPABASE_URL, FUNCTIONS } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { Button } from '../ui/button'
import { formatWhatsApp, cleanDigits } from '../../utils/format'
import { CheckCircle, Clock, Smartphone, Headphones, User, Mail, Phone, CreditCard } from 'lucide-react'

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
  product: { name: string; days: number; devices: number; has_priority_support: boolean }
  pix: { qr_code: string; qr_code_base64: string; ticket_url: string }
}

type FlowStep = 'signup' | 'login' | 'checkout' | 'pix' | 'success'

function formatCPF(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  productSlug: string
}

export default function CheckoutModal({ isOpen, onClose, productSlug }: CheckoutModalProps) {
  const { user, loading: authLoading } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [product, setProduct] = useState<Product | null>(null)
  const [productLoading, setProductLoading] = useState(false)
  const [step, setStep] = useState<FlowStep>('checkout')
  const [payment, setPayment] = useState<PaymentResponse | null>(null)
  const [copied, setCopied] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [generating, setGenerating] = useState(false)

  // Buyer form
  const [buyerName, setBuyerName] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  const [buyerWhatsapp, setBuyerWhatsapp] = useState('')
  const [buyerCpf, setBuyerCpf] = useState('')

  // Signup form
  const [signupName, setSignupName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupWhatsapp, setSignupWhatsapp] = useState('')
  const [signupCpf, setSignupCpf] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupLoading, setSignupLoading] = useState(false)
  const [signupError, setSignupError] = useState('')

  // Login form
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setProductLoading(true)
    loadProduct(productSlug)
  }, [isOpen, productSlug])

  useEffect(() => {
    if (authLoading || productLoading) return
    if (user) {
      setStep('checkout')
      const meta = user.user_metadata
      if (meta?.name) setBuyerName(meta.name as string)
      if (meta?.whatsapp) setBuyerWhatsapp(formatWhatsApp(meta.whatsapp as string))
      if (meta?.cpf) setBuyerCpf(formatCPF(meta.cpf as string))
      if (user.email) setBuyerEmail(user.email)
    } else {
      setStep('signup')
    }
  }, [user, authLoading, product])

  useEffect(() => {
    if (!isOpen) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  async function loadProduct(slug: string) {
    try {
      const { data, error } = await supabase
        .from('products_endcustomer')
        .select('*')
        .eq('slug', slug)
        .eq('active', true)
        .single()

      if (error || !data) {
        setErrorMsg('Produto não encontrado')
        return
      }
      setProduct(data)
    } catch {
      setErrorMsg('Erro ao carregar produto')
    } finally {
      setProductLoading(false)
    }
  }

  async function handleSignup(e: FormEvent) {
    e.preventDefault()
    setSignupError('')
    if (!signupName || !signupEmail || !signupWhatsapp || !signupCpf || !signupPassword) return

    const cleanedWhatsApp = signupWhatsapp.replace(/\D/g, '')
    if (cleanedWhatsApp.length !== 11) {
      setSignupError('WhatsApp deve ter 11 dígitos')
      return
    }

    const cleanedCPF = signupCpf.replace(/\D/g, '')
    if (cleanedCPF.length !== 11) {
      setSignupError('CPF deve ter 11 dígitos')
      return
    }

    setSignupLoading(true)
    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: {
            name: signupName.trim(),
            whatsapp: cleanedWhatsApp,
            cpf: cleanedCPF,
          },
        },
      })
      if (signupError) throw signupError
      if (data.user) {
        showToast('Conta criada!', 'success')
        await supabase.auth.signInWithPassword({
          email: signupEmail,
          password: signupPassword,
        })
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao criar conta'
      setSignupError(message)
      showToast(message, 'error')
    } finally {
      setSignupLoading(false)
    }
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      })
      if (error) throw error
      showToast('Login efetuado!', 'success')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao fazer login'
      setLoginError(message)
      showToast(message, 'error')
    } finally {
      setLoginLoading(false)
    }
  }

  async function handleStartPayment() {
    if (!user || !product) return

    if (!buyerName.trim() || !buyerEmail.trim() || !buyerWhatsapp.trim() || !buyerCpf.trim()) {
      showToast('Preencha todos os dados', 'error')
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
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`${SUPABASE_URL}${FUNCTIONS.CUSTOMER_CREATE_PAYMENT}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_slug: productSlug,
          buyer_name: buyerName.trim(),
          buyer_email: buyerEmail.trim(),
          buyer_whatsapp: cleanDigits(buyerWhatsapp),
          buyer_cpf: cleanedCPF,
        }),
      })

      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error || 'Erro ao gerar pagamento')

      setPayment(result)
      setStep('pix')
      startPolling(result.payment_id)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao gerar pagamento'
      setErrorMsg(msg)
      showToast(msg, 'error')
    } finally {
      setGenerating(false)
    }
  }

  function startPolling(paymentId: string) {
    let attempts = 0
    const interval = setInterval(async () => {
      attempts++
      if (attempts > 120) {
        clearInterval(interval)
        showToast('Tempo limite excedido.', 'error')
        return
      }
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const response = await fetch(`${SUPABASE_URL}${FUNCTIONS.CUSTOMER_CHECK_PAYMENT}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ payment_id: paymentId }),
        })
        const result = await response.json()
        if (result.success && result.status === 'approved') {
          clearInterval(interval)
          setStep('success')
        }
      } catch { /* ignore polling errors */ }
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
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
  }

  function resetState() {
    setStep('checkout')
    setPayment(null)
    setCopied(false)
    setErrorMsg('')
    setGenerating(false)
    setSignupError('')
    setLoginError('')
    setSignupName('')
    setSignupEmail('')
    setSignupWhatsapp('')
    setSignupCpf('')
    setSignupPassword('')
    setLoginEmail('')
    setLoginPassword('')
  }

  function handleClose() {
    resetState()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleClose} style={{ zIndex: 1000 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <button className="modal-close" onClick={handleClose}>&times;</button>

        {/* LOADING */}
        {(authLoading || productLoading) && (
          <div className="py-12 text-center">
            <div className="mx-auto size-8 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
            <p className="mt-4 text-sm" style={{ color: 'var(--muted)' }}>Carregando...</p>
          </div>
        )}

        {/* ERRO GLOBAL */}
        {!authLoading && !productLoading && !product && errorMsg && (
          <p className="form-message error" role="status">{errorMsg}</p>
        )}

        {/* SIGNUP STEP */}
        {step === 'signup' && (
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              {product?.name || 'Plano'}
            </span>
            <h2 style={{ marginTop: '16px' }}>Criar conta</h2>
            <p style={{ color: 'var(--muted)', marginBottom: '24px', fontSize: '14px' }}>
              Crie sua conta grátis para continuar com a compra do {product?.name}.
            </p>

            <form className="stack-form" onSubmit={handleSignup}>
              <label>
                <span>Nome completo</span>
                <input type="text" value={signupName} onChange={(e) => setSignupName(e.target.value)} placeholder="Seu nome" required />
              </label>
              <label>
                <span>Email</span>
                <input type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} placeholder="email@exemplo.com" required />
              </label>
              <div className="split-fields">
                <label>
                  <span>WhatsApp</span>
                  <input type="text" value={signupWhatsapp} onChange={(e) => setSignupWhatsapp(formatWhatsApp(e.target.value))} placeholder="(11) 9 9999-9999" required />
                </label>
                <label>
                  <span>CPF</span>
                  <input type="text" value={signupCpf} onChange={(e) => setSignupCpf(formatCPF(e.target.value))} placeholder="000.000.000-00" required />
                </label>
              </div>
              <label>
                <span>Senha</span>
                <input type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} placeholder="Mínimo 6 caracteres" minLength={6} required />
              </label>
              <Button type="submit" disabled={signupLoading} isLoading={signupLoading}>
                {signupLoading ? 'Criando...' : 'Criar conta e continuar'}
              </Button>
            </form>

            {signupError && <p className="form-message error" role="status">{signupError}</p>}

            <p style={{ marginTop: '16px', textAlign: 'center', fontSize: '13px', color: 'var(--muted)' }}>
              Já tem conta?{' '}
              <button
                type="button"
                onClick={() => setStep('login')}
                style={{ color: 'var(--accent)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px' }}
              >
                Fazer login
              </button>
            </p>
          </div>
        )}

        {/* LOGIN STEP */}
        {step === 'login' && (
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              {product?.name || 'Plano'}
            </span>
            <h2 style={{ marginTop: '16px' }}>Entrar</h2>
            <p style={{ color: 'var(--muted)', marginBottom: '24px', fontSize: '14px' }}>
              Faça login para continuar com a compra do {product?.name}.
            </p>

            <form className="stack-form" onSubmit={handleLogin}>
              <label>
                <span>Email</span>
                <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="email@exemplo.com" required />
              </label>
              <label>
                <span>Senha</span>
                <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="••••••••" required />
              </label>
              <Button type="submit" disabled={loginLoading} isLoading={loginLoading}>
                {loginLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>

            {loginError && <p className="form-message error" role="status">{loginError}</p>}

            <p style={{ marginTop: '16px', textAlign: 'center', fontSize: '13px', color: 'var(--muted)' }}>
              Não tem conta?{' '}
              <button
                type="button"
                onClick={() => setStep('signup')}
                style={{ color: 'var(--accent)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px' }}
              >
                Criar conta grátis
              </button>
            </p>
          </div>
        )}

        {/* CHECKOUT / BUYER FORM */}
        {step === 'checkout' && product && (
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              Checkout
            </span>

            <h2 style={{ marginTop: '16px' }}>{product.name}</h2>
            <p style={{ color: 'var(--muted)', fontSize: '14px' }}>{product.description}</p>

            <div className="mt-6 rounded-xl p-4" style={{ background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.15)' }}>
              <div className="text-3xl font-black">{formatPrice(product.price_cents)}</div>
              <div className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>Pagamento único via Pix</div>
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-sm" style={{ color: 'var(--muted)' }}>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5" style={{ color: 'var(--brand-green)' }} /> {product.days} dias
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Smartphone className="size-3.5" style={{ color: 'var(--brand-green)' }} /> {product.devices} dispositivo{product.devices > 1 ? 's' : ''}
              </span>
              {product.has_priority_support && (
                <span className="inline-flex items-center gap-1.5">
                  <Headphones className="size-3.5" style={{ color: 'var(--brand-green)' }} /> Suporte prioritário
                </span>
              )}
            </div>

            <div className="mt-6 rounded-xl border p-4" style={{ borderColor: 'rgba(168, 85, 247, 0.15)', background: 'rgba(168, 85, 247, 0.03)' }}>
              <h3 className="flex items-center gap-2 text-sm font-semibold mb-4">
                <User className="size-4" /> Dados do comprador
              </h3>
              <div className="stack-form" style={{ gap: '12px' }}>
                <label>
                  <span><User className="size-3" /> Nome completo</span>
                  <input type="text" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="João Silva" required />
                </label>
                <label>
                  <span><Mail className="size-3" /> Email</span>
                  <input type="email" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} placeholder="email@exemplo.com" required />
                </label>
                <div className="split-fields">
                  <label>
                    <span><Phone className="size-3" /> WhatsApp</span>
                    <input type="text" value={buyerWhatsapp} onChange={(e) => setBuyerWhatsapp(formatWhatsApp(e.target.value))} placeholder="(11) 9 9999-9999" required />
                  </label>
                  <label>
                    <span><CreditCard className="size-3" /> CPF</span>
                    <input type="text" value={buyerCpf} onChange={(e) => setBuyerCpf(formatCPF(e.target.value))} placeholder="000.000.000-00" required />
                  </label>
                </div>
              </div>
            </div>

            {errorMsg && (
              <p className="form-message error" role="status" style={{ marginTop: '12px' }}>{errorMsg}</p>
            )}

            <Button
              className="mt-6 h-12 w-full text-base font-bold"
              onClick={handleStartPayment}
              disabled={generating}
              isLoading={generating}
            >
              {generating ? 'Gerando Pix...' : 'Gerar Pix para pagamento'}
            </Button>
          </div>
        )}

        {/* PIX STEP */}
        {step === 'pix' && payment && (
          <div className="text-center">
            <h2>Pague com Pix</h2>
            <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
              Escaneie o QR Code ou copie o código
            </p>

            <div className="my-6 mx-auto flex flex-col items-center gap-4">
              {payment.pix.qr_code_base64 ? (
                <img
                  src={`data:image/png;base64,${payment.pix.qr_code_base64}`}
                  alt="QR Code Pix"
                  className="size-48 rounded-xl border"
                  style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'white' }}
                />
              ) : (
                <div className="flex size-48 items-center justify-center rounded-xl border" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  <span style={{ color: 'var(--muted)' }}>QR Code indisponível</span>
                </div>
              )}

              <div className="w-full rounded-xl border p-3" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                  Código Pix
                </p>
                <p className="break-all text-xs font-mono" style={{ color: 'var(--text)' }}>
                  {payment.pix.qr_code}
                </p>
                <Button variant="outline" size="tiny" className="mt-2" onClick={handleCopyCode}>
                  {copied ? 'Copiado!' : 'Copiar código'}
                </Button>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm animate-pulse" style={{ background: 'rgba(45, 212, 191, 0.1)', color: 'var(--brand-green)' }}>
              <Clock className="size-4" />
              Aguardando confirmação...
            </div>
          </div>
        )}

        {/* SUCCESS STEP */}
        {step === 'success' && (
          <div className="text-center py-4">
            <CheckCircle className="mx-auto size-14" style={{ color: 'var(--brand-green)' }} />
            <h2 className="mt-4">Pagamento confirmado!</h2>
            <p className="mt-2" style={{ color: 'var(--muted)' }}>
              Sua licença foi gerada. Acesse seu painel para usar.
            </p>
            <Button
              className="mt-6"
              onClick={() => {
                handleClose()
                navigate('/user')
              }}
            >
              Ir para meu painel
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
