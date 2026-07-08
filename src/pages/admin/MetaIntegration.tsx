import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import AdminTopbar from '../../components/AdminTopbar'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { clearMetaCache } from '../../utils/metaPixel'
import { useToast } from '../../hooks/useToast'
import { Link2, Key, Hash, ToggleLeft, Save, CheckCircle } from 'lucide-react'

interface MetaSettingsForm {
  pixel_id: string
  access_token: string
  test_event_code: string
  dataset_id: string
  enabled: boolean
}

export default function MetaIntegration() {
  const { showToast } = useToast()
  const [form, setForm] = useState<MetaSettingsForm>({
    pixel_id: '',
    access_token: '',
    test_event_code: '',
    dataset_id: '',
    enabled: false,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [hasToken, setHasToken] = useState(false)

  useEffect(() => {
    async function loadSettings() {
      try {
        const { data, error } = await supabase.functions.invoke('get-meta-settings', {
          method: 'GET',
        })

        if (error) throw error

        if (data) {
          setForm({
            pixel_id: data.pixel_id || '',
            access_token: '',
            test_event_code: data.test_event_code || '',
            dataset_id: data.dataset_id || '',
            enabled: data.enabled || false,
          })
          setHasToken(data.has_token || false)
        }
      } catch (err) {
        console.error('Erro ao carregar configurações Meta:', err)
        showToast('Erro ao carregar configurações', 'error')
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [showToast])

  async function handleSave() {
    if (!form.pixel_id.trim()) {
      showToast('Meta Pixel ID é obrigatório', 'error')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase.functions.invoke('update-meta-settings', {
        method: 'POST',
        body: {
          pixel_id: form.pixel_id.trim(),
          access_token: form.access_token.trim(),
          test_event_code: form.test_event_code.trim(),
          dataset_id: form.dataset_id.trim(),
          enabled: form.enabled,
        },
      })

      if (error) throw error

      clearMetaCache()
      setSaved(true)
      showToast('Configurações salvas com sucesso!', 'success')
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error('Erro ao salvar:', err)
      showToast('Erro ao salvar configurações', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout currentPage="/admin/meta">
        <AdminTopbar currentPage="/admin/meta" />
        <div className="app-shell">
          <div className="glass-card" style={{ padding: '28px', textAlign: 'center' }}>
            <p style={{ color: 'var(--muted-2)' }}>Carregando configurações...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout currentPage="/admin/meta">
      <AdminTopbar currentPage="/admin/meta" />

      <div className="app-shell">
        <section className="hero-panel reveal">
          <div>
            <p className="eyebrow">Integrações</p>
            <h1>Meta Pixel + Conversions API</h1>
            <p>Configure o rastreamento de eventos do Meta Pixel e a Conversions API para o servidor.</p>
          </div>
        </section>

        <div className="glass-card" style={{ padding: '28px' }}>
          <div className="card-heading">
            <span className="icon-pill" aria-hidden="true"><Link2 size={20} /></span>
            <h2>Configuração da Integração</h2>
          </div>

          <p style={{ color: 'var(--muted-2)', fontSize: '13px', marginBottom: '20px' }}>
            Preencha os dados do seu Meta Pixel e Access Token. O token é mantido seguro no servidor e nunca enviado ao frontend.
          </p>

          <div className="stack-form" style={{ gap: '16px' }}>
            <label>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Hash size={14} /> Meta Pixel ID <span style={{ color: 'var(--danger)' }}>*</span>
              </span>
              <input
                type="text"
                value={form.pixel_id}
                onChange={(e) => setForm(prev => ({ ...prev, pixel_id: e.target.value }))}
                placeholder="Ex: 123456789012345"
                required
              />
            </label>

            <label>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Key size={14} /> Meta Access Token
              </span>
              <input
                type="password"
                value={form.access_token}
                onChange={(e) => setForm(prev => ({ ...prev, access_token: e.target.value }))}
                placeholder={hasToken ? "•••••••• (deixe vazio para manter o atual)" : "Access Token da Conversions API"}
              />
              <small style={{ color: 'var(--muted-2)', fontSize: '11px' }}>
                {hasToken
                  ? "Token já configurado. Para alterar, digite o novo token. Para manter o atual, deixe em branco."
                  : "Nunca será enviado ao frontend. Utilizado apenas pelo servidor para enviar eventos."}
              </small>
            </label>

            <label>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Hash size={14} /> Test Event Code <span style={{ color: 'var(--muted-2)', fontWeight: 400 }}>(Opcional)</span>
              </span>
              <input
                type="text"
                value={form.test_event_code}
                onChange={(e) => setForm(prev => ({ ...prev, test_event_code: e.target.value }))}
                placeholder="Ex: TEST12345"
              />
              <small style={{ color: 'var(--muted-2)', fontSize: '11px' }}>
                Código de teste para validar eventos no Meta Events Manager.
              </small>
            </label>

            <label>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Hash size={14} /> Dataset ID <span style={{ color: 'var(--muted-2)', fontWeight: 400 }}>(Opcional)</span>
              </span>
              <input
                type="text"
                value={form.dataset_id}
                onChange={(e) => setForm(prev => ({ ...prev, dataset_id: e.target.value }))}
                placeholder="ID do Dataset (opcional)"
              />
            </label>

            <label
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                padding: '12px',
                borderRadius: '12px',
                border: `1px solid ${form.enabled ? 'rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.3)' : 'var(--line)'}`,
                background: form.enabled ? 'rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.05)' : 'transparent',
              }}
            >
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => setForm(prev => ({ ...prev, enabled: e.target.checked }))}
                style={{ display: 'none' }}
              />
              <div
                style={{
                  width: '44px',
                  height: '24px',
                  borderRadius: '12px',
                  background: form.enabled ? 'var(--accent)' : 'var(--line)',
                  position: 'relative',
                  transition: 'background 0.2s',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: 'white',
                    position: 'absolute',
                    top: '3px',
                    left: form.enabled ? '23px' : '3px',
                    transition: 'left 0.2s',
                  }}
                />
              </div>
              <div>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
                  <ToggleLeft size={16} style={{ display: 'inline', verticalAlign: 'middle' }} /> Ativar Integração
                </span>
                <p style={{ fontSize: '12px', color: 'var(--muted-2)', margin: 0 }}>
                  {form.enabled ? 'Pixel e Conversions API ativos' : 'Integração desabilitada'}
                </p>
              </div>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px', alignItems: 'center' }}>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : saved ? <><CheckCircle size={16} /> Salvo!</> : <><Save size={16} /> Salvar Configurações</>}
            </Button>
          </div>
        </div>

        {form.enabled && form.pixel_id && (
          <div className="glass-card" style={{ padding: '28px', marginTop: '16px' }}>
            <div className="card-heading">
              <span className="icon-pill" aria-hidden="true" style={{ background: 'rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.15)', color: 'var(--accent)' }}>
                <CheckCircle size={20} />
              </span>
              <h2>Status da Integração</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginTop: '16px' }}>
              <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--bg)', border: '1px solid var(--line)' }}>
                <p style={{ fontSize: '11px', color: 'var(--muted-2)', margin: 0 }}>Pixel ID</p>
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', margin: 0, marginTop: '4px', fontFamily: 'monospace' }}>{form.pixel_id}</p>
              </div>
              <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--bg)', border: '1px solid var(--line)' }}>
                <p style={{ fontSize: '11px', color: 'var(--muted-2)', margin: 0 }}>Access Token</p>
                <p style={{ fontSize: '14px', fontWeight: 600, color: hasToken ? 'var(--accent)' : 'var(--muted-2)', margin: 0, marginTop: '4px', fontFamily: 'monospace' }}>{hasToken ? '✓ Configurado' : 'Não configurado'}</p>
              </div>
              <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--bg)', border: '1px solid var(--line)' }}>
                <p style={{ fontSize: '11px', color: 'var(--muted-2)', margin: 0 }}>Test Event Code</p>
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', margin: 0, marginTop: '4px', fontFamily: 'monospace' }}>{form.test_event_code || 'Não definido'}</p>
              </div>
              <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--bg)', border: '1px solid var(--line)' }}>
                <p style={{ fontSize: '11px', color: 'var(--muted-2)', margin: 0 }}>Status</p>
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent)', margin: 0, marginTop: '4px' }}>● Ativo</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
