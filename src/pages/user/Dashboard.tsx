import { useState, useEffect } from 'react'
import { supabase, SUPABASE_URL, FUNCTIONS } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { Button } from '../../components/ui/button'

interface License {
  license_key: string
  status: string
  license_type: string
  expires_at: string
  device_id?: string
  created_at: string
}

export default function UserDashboard() {
  const { user, signOut } = useAuth()
  const { showToast } = useToast()
  const [licenses, setLicenses] = useState<License[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingTrial, setGeneratingTrial] = useState(false)
  const [hasTrial, setHasTrial] = useState(false)
  const [videoUrl] = useState('https://www.youtube.com/embed/dQw4w9WgXcQ')
  const [downloadUrl] = useState('#')

  useEffect(() => {
    document.body.classList.add('session-ready')
    loadLicenses()
    checkTrialStatus()
  }, [])

  async function checkTrialStatus() {
    try {
      const { data, error } = await supabase
        .from('user_trials')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle()

      if (error) {
        // Tabela pode não existir ainda (migration não executada)
        // Trata como "sem trial" para não bloquear o usuário
        console.warn('user_trials pode não existir:', error.message)
        setHasTrial(false)
        return
      }

      setHasTrial(!!data)
    } catch {
      setHasTrial(false)
    }
  }

  async function loadLicenses() {
    try {
      const { data, error } = await supabase
        .from('ts_licenses')
        .select('license_key, status, license_type, expires_at, device_id, created_at')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setLicenses(data || [])
    } catch (error) {
      console.error('Erro ao carregar licenças:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerateTrial() {
    setGeneratingTrial(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch(
        `${SUPABASE_URL}${FUNCTIONS.USER_CREATE_TRIAL}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      showToast(result.message || 'Teste criado com sucesso!', 'success')
      setHasTrial(true)
      await loadLicenses()
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : 'Erro ao gerar teste',
        'error'
      )
    } finally {
      setGeneratingTrial(false)
    }
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function statusLabel(status: string) {
    const map: Record<string, string> = {
      active: 'Ativa',
      trial: 'Trial',
      expired: 'Expirada',
      suspended: 'Suspensa',
    }
    return map[status] || status
  }

  return (
    <div className="landing-page">
      {/* Header */}
      <header className="landing-header">
        <div className="landing-header-inner">
          <a href="/user" className="brand">
            <span className="brand-bolt">⚡</span>
            <strong>
              Ultra<span>Chat</span>
            </strong>
          </a>
          <div className="session-box">
            <span>{user?.email || 'Usuário'}</span>
            <Button variant="ghost" onClick={signOut}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="landing-section" style={{ paddingTop: '48px' }}>
        <div className="hero-panel" style={{ alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <p className="eyebrow">Painel do Usuário</p>
            <h1>Bem-vindo ao Ultra Chat</h1>
            <p style={{ fontSize: '16px' }}>
              Gerencie suas licenças, teste a extensão e escolha o plano ideal para você.
            </p>
          </div>
        </div>
      </section>

      {/* Vídeo + Download */}
      <section className="landing-section" style={{ paddingTop: '0' }}>
        <div className="work-grid">
          {/* Vídeo Tutorial */}
          <article className="glass-card">
            <div className="card-heading">
              <span className="icon-pill">📹</span>
              <h2>Como instalar a extensão</h2>
            </div>
            <div
              style={{
                position: 'relative',
                paddingBottom: '56.25%',
                height: 0,
                overflow: 'hidden',
                borderRadius: '14px',
              }}
            >
              <iframe
                src={videoUrl}
                title="Tutorial Ultra Chat"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 0,
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </article>

          {/* Download */}
          <article className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="card-heading">
              <span className="icon-pill">📥</span>
              <h2>Download da Extensão</h2>
            </div>
            <p style={{ marginBottom: '24px' }}>
              Baixe a extensão Ultra Chat para começar a usar. Compatível com os principais navegadores.
            </p>
            <Button
              style={{ alignSelf: 'flex-start' }}
              onClick={() => window.open(downloadUrl, '_blank')}
            >
              Baixar Ultra Chat (.zip)
            </Button>
          </article>
        </div>
      </section>

      {/* Trial + Planos */}
      <section className="landing-section" style={{ paddingTop: '0' }}>
        <div className="work-grid">
          {/* Gerar Trial */}
          <article className="glass-card">
            <div className="card-heading">
              <span className="icon-pill">⏱️</span>
              <h2>Teste Grátis</h2>
            </div>
            <p style={{ marginBottom: '20px' }}>
              Experimente a extensão gratuitamente por <strong>30 minutos</strong>.
              Cada usuário tem direito a apenas 1 teste.
            </p>
            {hasTrial ? (
              <div
                style={{
                  padding: '16px',
                  borderRadius: '14px',
                  background: 'rgba(157, 255, 47, 0.06)',
                  border: '1px solid rgba(157, 255, 47, 0.2)',
                  color: 'var(--accent)',
                  fontWeight: 700,
                  fontSize: '14px',
                }}
              >
                ✓ Você já utilizou seu teste gratuito
              </div>
            ) : (
              <Button onClick={handleGenerateTrial} disabled={generatingTrial}>
                {generatingTrial ? 'Gerando...' : 'Gerar teste de 30 min'}
              </Button>
            )}
          </article>

          {/* Planos */}
          <article className="glass-card">
            <div className="card-heading">
              <span className="icon-pill">💎</span>
              <h2>Planos disponíveis</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  borderRadius: '14px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--line)',
                }}
              >
                <div>
                  <strong style={{ fontSize: '16px' }}>Mensal</strong>
                  <p style={{ fontSize: '13px', margin: '2px 0 0' }}>
                    Acesso por 30 dias
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong style={{ fontSize: '22px', color: 'var(--accent)' }}>
                    R$ 29,90
                  </strong>
                  <span style={{ fontSize: '12px', color: 'var(--muted)', display: 'block' }}>
                    /mês
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  borderRadius: '14px',
                  background: 'rgba(157,255,47,0.03)',
                  border: '1px solid rgba(157,255,47,0.2)',
                }}
              >
                <div>
                  <strong style={{ fontSize: '16px' }}>Semestral</strong>
                  <p style={{ fontSize: '13px', margin: '2px 0 0' }}>
                    Acesso por 6 meses
                  </p>
                  <span
                    style={{
                      fontSize: '11px',
                      color: 'var(--accent)',
                      fontWeight: 700,
                    }}
                  >
                    Economize R$ 79,50
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong style={{ fontSize: '22px', color: 'var(--accent)' }}>
                    R$ 99,90
                  </strong>
                  <span style={{ fontSize: '12px', color: 'var(--muted)', display: 'block' }}>
                    /semestre
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  borderRadius: '14px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--line)',
                }}
              >
                <div>
                  <strong style={{ fontSize: '16px' }}>Anual</strong>
                  <p style={{ fontSize: '13px', margin: '2px 0 0' }}>
                    Acesso por 12 meses
                  </p>
                  <span
                    style={{
                      fontSize: '11px',
                      color: 'var(--accent)',
                      fontWeight: 700,
                    }}
                  >
                    Economize R$ 178,90
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong style={{ fontSize: '22px', color: 'var(--accent)' }}>
                    R$ 179,90
                  </strong>
                  <span style={{ fontSize: '12px', color: 'var(--muted)', display: 'block' }}>
                    /ano
                  </span>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* Licenças */}
      <section className="landing-section" style={{ paddingTop: '0' }}>
        <div className="section-header" style={{ textAlign: 'left', marginBottom: '24px' }}>
          <p className="eyebrow">Minhas Licenças</p>
          <h2>Suas licenças</h2>
        </div>

        <div className="table-card reveal">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Chave</th>
                  <th>Status</th>
                  <th>Tipo</th>
                  <th>Expira em</th>
                  <th>HWID</th>
                  <th>Criada em</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6}>Carregando...</td>
                  </tr>
                ) : licenses.length === 0 ? (
                  <tr>
                    <td colSpan={6}>Nenhuma licença encontrada</td>
                  </tr>
                ) : (
                  licenses.map((license) => (
                    <tr key={license.license_key}>
                      <td>
                        <span className="license-key">{license.license_key}</span>
                      </td>
                      <td>
                        <span className={`badge ${license.status}`}>
                          {statusLabel(license.status)}
                        </span>
                      </td>
                      <td>{license.license_type === 'trial' ? 'Trial' : license.license_type === 'lifetime' ? 'Vitalícia' : 'Paga'}</td>
                      <td>{formatDate(license.expires_at)}</td>
                      <td>{license.device_id ? 'vinculado' : 'livre'}</td>
                      <td>{formatDate(license.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="brand">
            <span className="brand-bolt">⚡</span>
            <strong>
              Ultra<span>Chat</span>
            </strong>
          </div>
          <p>© 2026 Ultra Chat. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
