import { renderHook, act } from '@testing-library/react'
import { ToastProvider } from '../hooks/useToast'
import { useLicenseActions } from '../hooks/useLicenseActions'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'mock-token' } },
        error: null,
      }),
    },
  },
  SUPABASE_URL: 'https://test.supabase.co',
  FUNCTIONS: {
    RENEW_LICENSE: '/functions/v1/renew-license',
    RESET_HWID: '/functions/v1/reset-hwid',
    REVOKE_LICENSE: '/functions/v1/revoke-license',
  },
}))

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
})

// Guarda o confirm original
const originalConfirm = window.confirm

describe('useLicenseActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.confirm = vi.fn().mockReturnValue(true)
  })

  afterEach(() => {
    window.confirm = originalConfirm
  })

  it('should copy license key to clipboard', async () => {
    const { result } = renderHook(() => useLicenseActions(), { wrapper: ToastProvider })

    await act(async () => {
      await result.current.copyLicenseKey('TEST-KEY-123')
    })

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('TEST-KEY-123')
  })

  it('should disable button during mutation and re-enable after', async () => {
    const button = document.createElement('button')
    button.textContent = 'Salvar'

    const { result } = renderHook(() => useLicenseActions(), { wrapper: ToastProvider })

    await act(async () => {
      const promise = result.current.submitMutation(
        button,
        async () => {
          expect(button.disabled).toBe(true)
          expect(button.textContent).toBe('Processando...')
          return { license_key: 'NEW-KEY' }
        },
        'Criado com sucesso.'
      )
      await promise
    })

    expect(button.disabled).toBe(false)
    expect(button.textContent).toBe('Salvar')
  })

  it('should return true on success and false on error', async () => {
    const { result } = renderHook(() => useLicenseActions(), { wrapper: ToastProvider })

    const button = document.createElement('button')

    // Success case
    await act(async () => {
      const success = await result.current.submitMutation(
        button,
        async () => ({ license_key: 'KEY-123' }),
        'Sucesso.'
      )
      expect(success).toBe(true)
    })

    // Error case
    await act(async () => {
      const success = await result.current.submitMutation(
        button,
        async () => { throw new Error('Falha') },
        'Sucesso.'
      )
      expect(success).toBe(false)
    })
  })

  it('should handle mutation without license_key in response', async () => {
    const button = document.createElement('button')

    const { result } = renderHook(() => useLicenseActions(), { wrapper: ToastProvider })

    await act(async () => {
      const success = await result.current.submitMutation(
        button,
        async () => ({}),
        'Operação concluída.'
      )
      expect(success).toBe(true)
    })
  })
})
