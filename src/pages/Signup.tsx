import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { useToast } from '../hooks/useToast'
import { Button } from '../components/ui/button'
import { Logo } from '../components/ui/Logo'

function formatWhatsApp(value: string): string {
  // Remove tudo que não é número
  const cleaned = value.replace(/\D/g, '')
  
  // Limita a 11 dígitos (Brasil)
  const trimmed = cleaned.slice(0, 11)
  
  // Formata: (XX) 9 XXXX-XXXX
  if (trimmed.length === 0) return ''
  if (trimmed.length <= 2) return `(${trimmed}`
  if (trimmed.length <= 7) return `(${trimmed.slice(0, 2)}) ${trimmed.slice(2)}`
  return `(${trimmed.slice(0, 2)}) ${trimmed.slice(2, 3)} ${trimmed.slice(3, 7)}-${trimmed.slice(7)}`
}

export default function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { user, role } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    if (user && role === 'user') {
      navigate('/user', { replace: true })
      return
    }
  }, [role, user, navigate])

  function handleWhatsAppChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatWhatsApp(e.target.value)
    setWhatsapp(formatted)
  }

  async function handleSignup(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!name || !email || !whatsapp || !password) return

    // Valida se tem 11 dígitos (formato correto)
    const cleanedWhatsApp = whatsapp.replace(/\D/g, '')
    if (cleanedWhatsApp.length !== 11) {
      setError('WhatsApp deve ter 11 dígitos')
      showToast('WhatsApp deve ter 11 dígitos', 'error')
      return
    }

    setLoading(true)
    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, whatsapp: cleanedWhatsApp } },
      })
      if (signupError) throw signupError
      if (data.user) {
        showToast('Conta criada com sucesso! Redirecionando...', 'success')
        setTimeout(() => navigate('/user'), 1500)
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
            <p>Cadastre-se e comece a testar a extensão Lovable Ultra Chat por 30 min.</p>
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
              {loading ? 'Criando conta...' : 'Criar conta e testar grátis'}
            </Button>
          </form>

          {error && <p className="form-message error" role="status">{error}</p>}

          <p style={{ marginTop: '16px', textAlign: 'center', fontSize: '13px', color: 'var(--muted)' }}>
            Já tem conta?{' '}
            <a href="/login" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
              Fazer login
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
