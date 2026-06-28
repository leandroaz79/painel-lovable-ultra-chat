import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, SUPABASE_URL, FUNCTIONS } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { Button } from '../components/ui/button'
import { Logo } from '../components/ui/Logo'
import AdminLayout from '../components/AdminLayout'
import ResellerLayout from '../components/ResellerLayout'
import AdminTopbar from '../components/AdminTopbar'
import ResellerMobileMenu from '../components/ResellerMobileMenu'
import { User, AtSign, Smartphone, Trash2, AlertTriangle, Lock } from 'lucide-react'

export default function Profile() {
  const { user, role, signOut } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [name, setName] = useState(user?.user_metadata?.name || '')
  const [phone, setPhone] = useState(user?.user_metadata?.whatsapp || '')
  const [email, setEmail] = useState(user?.email || '')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleUpdateProfile(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const updates: {
        email?: string
        data?: Record<string, unknown>
      } = {
        data: {
          ...user?.user_metadata,
          name: name.trim(),
          ...(phone.trim() ? { whatsapp: phone.trim() } : {}),
        },
      }

      const normalizedEmail = email.trim().toLowerCase()
      if (normalizedEmail !== user?.email) {
        updates.email = normalizedEmail
      }

      const { error } = await supabase.auth.updateUser(updates)
      if (error) throw error

      showToast('Perfil atualizado com sucesso!')
      if (normalizedEmail !== user?.email) {
        showToast('Email de confirmação enviado para o novo endereço.')
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erro ao atualizar perfil', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`${SUPABASE_URL}${FUNCTIONS.USER_DELETE_ACCOUNT}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.error)

      showToast('Conta deletada com sucesso.')
      await supabase.auth.signOut()
      navigate('/')
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erro ao deletar conta', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const profileContent = (
    <div className="app-shell" style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 20px' }}>
      <div className="hero-panel" style={{ alignItems: 'flex-start', marginBottom: '32px' }}>
        <div style={{ flex: 1 }}>
          <p className="eyebrow">Configurações</p>
          <h1>Meu perfil</h1>
          <p>Atualize seus dados ou gerencie sua conta.</p>
        </div>
      </div>

      <form className="glass-card" onSubmit={handleUpdateProfile} style={{ padding: '28px', marginBottom: '24px' }}>
        <div className="card-heading" style={{ marginBottom: '24px' }}>
          <span className="icon-pill" aria-hidden="true"><User size={20} /></span>
          <h2>Dados pessoais</h2>
        </div>

        <div className="stack-form">
          <label>
            <span><AtSign size={14} /> Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </label>

          <label>
            <span><User size={14} /> Nome</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
            />
          </label>

          <label>
            <span><Smartphone size={14} /> Telefone</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 99999-9999"
            />
          </label>

          <Button type="submit" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </div>
      </form>

      <div className="glass-card" style={{ padding: '28px', marginBottom: '24px' }}>
        <div className="card-heading" style={{ marginBottom: '20px' }}>
          <span className="icon-pill" aria-hidden="true"><Lock size={20} /></span>
          <h2>Segurança</h2>
        </div>
        <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '16px' }}>
          Receba um email com instruções para redefinir sua senha.
        </p>
        <Button
          variant="outline"
          onClick={async () => {
            try {
              const { error } = await supabase.auth.resetPasswordForEmail(user!.email!, {
                redirectTo: `${window.location.origin}/login`,
              })
              if (error) throw error
              showToast('Email de recuperação enviado!')
            } catch (err: unknown) {
              showToast(err instanceof Error ? err.message : 'Erro ao enviar email', 'error')
            }
          }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <Lock size={16} /> Redefinir senha
        </Button>
      </div>

      <div className="glass-card" style={{ padding: '28px', border: '1px solid rgba(255, 77, 77, 0.3)' }}>
        <div className="card-heading" style={{ marginBottom: '16px' }}>
          <span className="icon-pill" style={{ background: 'rgba(255,77,77,0.2)' }} aria-hidden="true">
            <AlertTriangle size={20} style={{ color: 'var(--danger)' }} />
          </span>
          <h2 style={{ color: 'var(--danger)' }}>Zona de perigo</h2>
        </div>

        <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '16px' }}>
          Ao deletar sua conta, todas as suas licenças, compras e dados serão permanentemente removidos. Esta ação não pode ser desfeita.
        </p>

        {!confirmDelete ? (
          <Button
            variant="destructive"
            onClick={() => setConfirmDelete(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <Trash2 size={16} /> Deletar minha conta
          </Button>
        ) : (
          <div style={{
            padding: '16px',
            background: 'rgba(255,77,77,0.1)',
            borderRadius: '12px',
            border: '1px solid rgba(255,77,77,0.3)',
          }}>
            <p style={{ fontWeight: 'bold', marginBottom: '12px', color: 'var(--danger)' }}>
              Tem certeza? Esta ação é irreversível.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={deleting}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <Trash2 size={16} /> {deleting ? 'Deletando...' : 'Sim, deletar minha conta'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  if (role === 'admin') {
    return (
      <AdminLayout currentPage="/profile">
        <AdminTopbar currentPage="/profile" />
        {profileContent}
      </AdminLayout>
    )
  }

  if (role === 'reseller') {
    return (
      <ResellerLayout currentPage="/profile">
        <header className="topbar">
          <ResellerMobileMenu currentPage="/profile" />
          <Logo variant="reseller" href="/reseller" />
          <nav className="nav-links" aria-label="Navegação principal">
            <a href="/reseller">Painel</a>
            <a href="/reseller#credits">Créditos</a>
            <a href="/reseller#create-license">Gerar licença</a>
            <a href="/reseller#create-trial">Gerar trial</a>
            <a href="/reseller#licenses">Licenças</a>
            <a href="/profile" style={{ color: 'var(--text)' }}>Perfil</a>
          </nav>
          <div className="session-box">
            <span>{user?.email || 'Carregando...'}</span>
            <Button variant="ghost" onClick={() => signOut()}>Sair</Button>
          </div>
        </header>
        {profileContent}
      </ResellerLayout>
    )
  }

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
      {profileContent}
    </div>
  )
}
