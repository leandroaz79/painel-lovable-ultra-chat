import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components/landing/Navbar'
import { Footer } from '../components/landing/Footer'
import { supabase } from '../lib/supabase'
import { ArrowLeft, RefreshCw, KeyRound, CheckCircle, AlertCircle, Shield } from 'lucide-react'

type Status = 'idle' | 'loading' | 'success' | 'error'

export default function ResetLicense() {
  const navigate = useNavigate()
  const [licenseKey, setLicenseKey] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async () => {
    const key = licenseKey.trim()
    if (!key) {
      setStatus('error')
      setMessage('Digite sua chave de licença.')
      return
    }

    setStatus('loading')
    setMessage('')

    try {
      const { data, error } = await supabase.functions.invoke('public-reset-hwid', {
        method: 'POST',
        body: { license_key: key },
      })

      if (error) throw new Error(error.message || 'Erro ao conectar com o servidor')

      if (data?.success) {
        setStatus('success')
        setMessage(data.message || 'HWID resetado com sucesso!')
        setLicenseKey('')
      } else {
        throw new Error(data?.error || 'Erro ao resetar licença')
      }
    } catch (err: any) {
      setStatus('error')
      setMessage(err?.message || 'Erro ao processar solicitação. Tente novamente.')
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          {/* Back link */}
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors mb-8"
            style={{ color: 'var(--muted)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
          >
            <ArrowLeft className="size-4" /> Voltar
          </button>

          {/* Card */}
          <div
            className="rounded-3xl p-8 text-center"
            style={{
              background: 'linear-gradient(145deg, rgba(15, 30, 44, 0.86), rgba(7, 17, 28, 0.78))',
              border: '1px solid var(--line)',
              boxShadow: 'var(--shadow)',
            }}
          >
            {/* Icon */}
            <div
              className="mx-auto mb-6 grid size-16 place-items-center rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, var(--accent), var(--cyan))',
                boxShadow: '0 8px 32px rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.3)',
              }}
            >
              <RefreshCw className="size-8 text-white" />
            </div>

            {/* Title */}
            <h1 className="text-2xl font-extrabold tracking-tight mb-2" style={{ color: 'var(--text)' }}>
              Resetar licença
            </h1>
            <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>
              Mudou de PC? Digite sua chave de licença para liberar o uso em outro computador.
            </p>

            {/* Input */}
            <div className="relative mb-5">
              <KeyRound
                className="absolute left-4 top-1/2 -translate-y-1/2 size-4"
                style={{ color: 'var(--muted-2)' }}
              />
              <input
                type="text"
                value={licenseKey}
                onChange={(e) => { setLicenseKey(e.target.value); setStatus('idle'); setMessage('') }}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="LVB-XXXXX-XXXXX-XXXXX"
                disabled={status === 'loading'}
                className="w-full rounded-xl py-3.5 pl-11 pr-4 text-sm font-medium outline-none transition-all"
                style={{
                  background: 'rgba(1, 8, 14, 0.82)',
                  border: '1px solid var(--line)',
                  color: 'var(--text)',
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--line)'}
              />
            </div>

            {/* Button */}
            <button
              onClick={handleSubmit}
              disabled={status === 'loading' || !licenseKey.trim()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'var(--gradient-brand)',
                boxShadow: '0 8px 24px rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.25)',
                minHeight: '48px',
              }}
            >
              {status === 'loading' ? (
                <>
                  <div className="btn-spinner" /> Resetando...
                </>
              ) : (
                <>
                  <RefreshCw className="size-4" /> Resetar HWID
                </>
              )}
            </button>

            {/* Status message */}
            {message && (
              <div
                className="mt-5 flex items-start gap-2 rounded-xl p-3.5 text-left text-sm"
                style={{
                  background: status === 'success' ? 'rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.08)' : 'rgba(255, 61, 85, 0.08)',
                  border: `1px solid ${status === 'success' ? 'rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.2)' : 'rgba(255, 61, 85, 0.3)'}`,
                  color: status === 'success' ? 'var(--accent)' : '#ff8a98',
                }}
              >
                {status === 'success' ? (
                  <CheckCircle className="size-4 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="size-4 mt-0.5 shrink-0" />
                )}
                {message}
              </div>
            )}

            {/* Tip */}
            <div
              className="mt-6 flex items-center gap-2 text-xs"
              style={{ color: 'var(--muted-2)' }}
            >
              <Shield className="size-3.5 shrink-0" />
              Após o reset, ative a extensão no novo computador normalmente.
            </div>
          </div>

          {/* Footer link */}
          <p className="mt-6 text-center text-sm" style={{ color: 'var(--muted-2)' }}>
            Não encontra sua chave?{' '}
            <a
              href="/signup"
              onClick={(e) => { e.preventDefault(); navigate('/signup') }}
              className="font-semibold underline transition-colors"
              style={{ color: 'var(--accent)' }}
            >
              Acesse o painel
            </a>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}
