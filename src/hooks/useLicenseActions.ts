import { useCallback } from 'react'
import { supabase, SUPABASE_URL, FUNCTIONS } from '../lib/supabase'
import { useToast } from './useToast'
import type { Session } from '@supabase/supabase-js'

async function getSession(): Promise<Session | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const session = await getSession()
  return fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
}

export function useLicenseActions() {
  const { showToast } = useToast()

  const submitMutation = useCallback(async (
    button: HTMLButtonElement | null,
    callback: () => Promise<{ license_key?: string }>,
    successMessage: string,
  ): Promise<boolean> => {
    const original = button?.textContent
    if (button) {
      button.disabled = true
      button.textContent = 'Processando...'
    }

    try {
      const result = await callback()
      showToast(result.license_key ? `${successMessage} ${result.license_key}` : successMessage)
      return true
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Falha ao processar ação.'
      showToast(errorMsg, 'error')
      return false
    } finally {
      if (button) {
        button.disabled = false
        button.textContent = original || ''
      }
    }
  }, [showToast])

  const copyLicenseKey = useCallback(async (key: string) => {
    await navigator.clipboard.writeText(key)
    showToast('Chave copiada.')
  }, [showToast])

  const renewLicense = useCallback(async (key: string, button: HTMLButtonElement) => {
    const days = Number(prompt('Renovar por quantos dias?', '30') || 0)
    if (!days) return false

    return submitMutation(button, async () => {
      const response = await fetchWithAuth(
        `${SUPABASE_URL}${FUNCTIONS.RENEW_LICENSE}`,
        {
          method: 'POST',
          body: JSON.stringify({ license_key: key, days }),
        }
      )
      const result = await response.json()
      if (!result.success) throw new Error(result.error)
      return result
    }, 'Licença renovada.')
  }, [submitMutation])

  const resetHwid = useCallback(async (key: string, button: HTMLButtonElement) => {
    return submitMutation(button, async () => {
      const response = await fetchWithAuth(
        `${SUPABASE_URL}${FUNCTIONS.RESET_HWID}`,
        {
          method: 'POST',
          body: JSON.stringify({ license_key: key }),
        }
      )
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || `Erro HTTP ${response.status}`)
      }
      return result
    }, 'HWID resetado.')
  }, [submitMutation])

  const revokeLicense = useCallback(async (key: string, button: HTMLButtonElement) => {
    return submitMutation(button, async () => {
      const response = await fetchWithAuth(
        `${SUPABASE_URL}${FUNCTIONS.REVOKE_LICENSE}`,
        {
          method: 'POST',
          body: JSON.stringify({ license_key: key }),
        }
      )
      const result = await response.json()
      if (!result.success) throw new Error(result.error)
      return result
    }, 'Licença revogada.')
  }, [submitMutation])

  const deleteLicense = useCallback(async (key: string, button: HTMLButtonElement, isReseller: boolean = false) => {
    const functionUrl = isReseller 
      ? `${SUPABASE_URL}${FUNCTIONS.RESELLER_DELETE_LICENSE}` 
      : `${SUPABASE_URL}${FUNCTIONS.DELETE_LICENSE}`

    return submitMutation(button, async () => {
      const response = await fetchWithAuth(
        functionUrl,
        {
          method: 'POST',
          body: JSON.stringify({ license_key: key }),
        }
      )
      const result = await response.json()
      if (!result.success) throw new Error(result.error)
      return result
    }, 'Licença excluída.')
  }, [submitMutation])

  return {
    submitMutation,
    copyLicenseKey,
    renewLicense,
    resetHwid,
    revokeLicense,
    deleteLicense,
    showToast,
    fetchWithAuth,
  }
}
