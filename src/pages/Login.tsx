import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { useToast } from '../hooks/useToast'
import { Button } from '../components/ui/button'
import { Logo } from '../components/ui/Logo'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)
  
  const { signIn, role, user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect')

  useEffect(() => {
    if (user && role) {
      if (redirect) {
        navigate(redirect, { replace: true })
      } else if (role === 'admin') {
        navigate('/admin')
      } else if (role === 'reseller') {
        navigate('/reseller')
      } else if (role === 'user') {
        navigate('/user')
      }
    }
  }, [role, user, navigate, redirect])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signIn(email, password)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login')
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-card reveal">
          <div className="auth-copy" style={{ marginTop: '0' }}>
            <Logo variant="login" />
            <p className="eyebrow" style={{ marginTop: '24px' }}>Bem-vindo</p>
            <h1>Entrar na sua conta</h1>
            <p>Use seu email e senha para acessar o Ultra Chat.</p>
          </div>

          <form className="stack-form" onSubmit={handleSubmit}>
            <label>
              <span>Email</span>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email" 
                placeholder="admin@seudominio.com" 
                required 
              />
            </label>
            <label>
              <span>Senha</span>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password" 
                placeholder="••••••••" 
                required 
              />
            </label>
            <Button type="submit" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar no painel'}
            </Button>
          </form>

          {error && (
            <p className="form-message error" role="status">{error}</p>
          )}

          {resetEmailSent ? (
            <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(157,255,47,0.08)', borderRadius: '14px', border: '1px solid rgba(157,255,47,0.2)' }}>
              <p style={{ color: 'var(--accent)', fontWeight: 'bold', margin: '0 0 8px' }}>📧 Email enviado!</p>
              <p style={{ color: 'var(--muted)', fontSize: '13px', margin: 0 }}>
                Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
              </p>
            </div>
          ) : (
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <Button
                variant="link"
                onClick={async () => {
                  if (!email) {
                    showToast('Digite seu email primeiro', 'error')
                    return
                  }
                  try {
                    const { error } = await supabase.auth.resetPasswordForEmail(email, {
                      redirectTo: `${window.location.origin}/login`,
                    })
                    if (error) throw error
                    setResetEmailSent(true)
                    showToast('Email de recuperação enviado!')
                  } catch (err: unknown) {
                    showToast(err instanceof Error ? err.message : 'Erro ao enviar email', 'error')
                  }
                }}
              >
                Esqueci minha senha
              </Button>
            </div>
          )}

          <p style={{ marginTop: '16px', textAlign: 'center', fontSize: '13px', color: 'var(--muted)' }}>
            Não tem conta?{' '}
            <a href="/signup" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
              Criar conta grátis
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
