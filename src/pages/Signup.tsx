import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { useToast } from '../hooks/useToast'
import { Button } from '../components/ui/button'
import { Logo } from '../components/ui/Logo'
import { formatWhatsApp } from '../utils/format'
import { validateRedirect } from '../utils/validateRedirect'

function formatCPF(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

export default function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [cpf, setCpf] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { user, role } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = validateRedirect(searchParams.get('redirect'))

  useEffect(() => {
    if (user && role === 'user') {
      navigate(redirect || '/user', { replace: true })
      return
    }
  }, [role, user, navigate, redirect])

  function handleWhatsAppChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatWhatsApp(e.target.value)
    setWhatsapp(formatted)
  }

  function handleCpfChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCpf(formatCPF(e.target.value))
  }

  async function handleSignup(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!name || !email || !whatsapp || !cpf || !password) return

    const cleanedWhatsApp = whatsapp.replace(/\D/g, '')
    if (cleanedWhatsApp.length !== 11) {
      setError('WhatsApp deve ter 11 dígitos')
      showToast('WhatsApp deve ter 11 dígitos', 'error')
      return
    }

    const cleanedCPF = cpf.replace(/\D/g, '')
    if (cleanedCPF.length !== 11) {
      setError('CPF deve ter 11 dígitos')
      showToast('CPF deve ter 11 dígitos', 'error')
      return
    }

    setLoading(true)
    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            whatsapp: cleanedWhatsApp,
            cpf: cleanedCPF,
          },
        },
      })
      if (signupError) throw signupError
      if (data.user) {
        showToast('Conta criada com sucesso!', 'success')
        const destination = redirect || '/user'
        setTimeout(() => navigate(destination), 1500)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao criar conta'
      setError(message)
      showToast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-card reveal">
          <a href="/" className="flex items-center gap-2 mb-6">
            <Logo variant="landing" />
          </a>

          <div className="auth-copy">
            <h1>Criar conta grátis</h1>
            <p>Cadastre-se para comprar planos ou testar a extensão Ultra Chat.</p>
          </div>

          <form className="stack-form" onSubmit={handleSignup}>
            <label>
              <span>Nome completo</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                required
              />
            </label>
            <label>
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
                required
              />
            </label>
            <div className="split-fields">
              <label>
                <span>WhatsApp</span>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={handleWhatsAppChange}
                  placeholder="(11) 9 9999-9999"
                  required
                />
              </label>
              <label>
                <span>CPF</span>
                <input
                  type="text"
                  value={cpf}
                  onChange={handleCpfChange}
                  placeholder="000.000.000-00"
                  required
                />
              </label>
            </div>
            <label>
              <span>Senha</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                required
              />
            </label>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando conta...' : redirect ? 'Criar conta e continuar' : 'Criar conta'}
            </Button>
          </form>

          {error && <p className="form-message error" role="status">{error}</p>}

          <p style={{ marginTop: '16px', textAlign: 'center', fontSize: '13px', color: 'var(--muted)' }}>
            Já tem conta?{' '}
            <a href={redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login'} style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
              Fazer login
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
