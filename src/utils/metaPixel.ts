interface MetaSettings {
  id: string
  pixel_id: string
  test_event_code: string
  dataset_id: string
  enabled: boolean
}

interface CAPIEventPayload {
  event_name: string
  event_id?: string
  event_source_url?: string
  action_source?: string
  email?: string
  phone?: string
  first_name?: string
  last_name?: string
  city?: string
  state?: string
  zip?: string
  country?: string
  external_id?: string
  client_ip_address?: string
  client_user_agent?: string
  fbp?: string
  fbc?: string
  custom_data?: Record<string, unknown>
}

let cachedSettings: MetaSettings | null = null
let settingsPromise: Promise<MetaSettings | null> | null = null

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & { loaded?: boolean; version?: string; callMethod?: (...args: unknown[]) => void; q?: unknown[] }
    _fbq?: unknown
  }
}

function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

export function getFbp(): string | undefined {
  try {
    const match = document.cookie.match(/_fbp=([^;]+)/)
    return match ? match[1] : undefined
  } catch {
    return undefined
  }
}

export function getFbc(): string | undefined {
  try {
    const match = document.cookie.match(/_fbc=([^;]+)/)
    return match ? match[1] : undefined
  } catch {
    return undefined
  }
}

export async function fetchMetaSettings(): Promise<MetaSettings | null> {
  if (cachedSettings) return cachedSettings
  if (settingsPromise) return settingsPromise

  settingsPromise = (async () => {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const url = import.meta.env.VITE_SUPABASE_URL as string
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string
      const client = createClient(url, key)

      const { data, error } = await client.functions.invoke('get-meta-settings', {
        method: 'GET',
      })

      if (error || !data) return null

      cachedSettings = data as MetaSettings
      return cachedSettings
    } catch {
      return null
    } finally {
      settingsPromise = null
    }
  })()

  return settingsPromise
}

export function loadPixelScript(pixelId: string): void {
  if (!pixelId || typeof document === 'undefined') return
  if (document.querySelector(`script[data-meta-pixel="${pixelId}"]`)) return

  // Set up fbq stub before loading the external script
  // so any early calls get queued
  if (typeof window.fbq !== 'function') {
    const queue: unknown[][] = []
    window.fbq = function (...args: unknown[]) {
      queue.push(args)
    } as typeof window.fbq
    window.fbq.loaded = false
    window.fbq.version = '2.0'
    window.fbq.q = queue
  }

  const script = document.createElement('script')
  script.dataset.metaPixel = pixelId
  script.async = true
  script.src = 'https://connect.facebook.net/en_US/fbevents.js'

  document.head.appendChild(script)

  // fbevents.js will redefine window.fbq on load,
  // but queue calls are preserved via _fbq.q
  window.fbq('init', pixelId)
  window.fbq('track', 'PageView')
}

export function trackPixelEvent(
  eventName: string,
  params?: Record<string, unknown>,
): string | null {
  if (typeof window === 'undefined' || !window.fbq) return null

  const eventId = generateEventId()
  const eventParams = { eventID: eventId, ...params }
  window.fbq('track', eventName, eventParams)
  return eventId
}

export function trackPixelCustomEvent(
  eventName: string,
  params?: Record<string, unknown>,
): string | null {
  if (typeof window === 'undefined' || !window.fbq) return null

  const eventId = generateEventId()
  const eventParams = { eventID: eventId, ...params }
  window.fbq('trackCustom', eventName, eventParams)
  return eventId
}

export async function sendCAPIEvent(payload: CAPIEventPayload): Promise<boolean> {
  try {
    const { supabase } = await import('../lib/supabase')

    await supabase.functions.invoke('meta-capi-event', {
      method: 'POST',
      body: payload,
    })

    return true
  } catch {
    return false
  }
}

export async function trackEvent(
  eventName: string,
  customData?: Record<string, unknown>,
  userData?: Partial<CAPIEventPayload>,
): Promise<string | null> {
  const settings = await fetchMetaSettings()
  if (!settings?.enabled || !settings?.pixel_id) return null

  const eventId = generateEventId()

  trackPixelEvent(eventName, customData)

  const capiPayload: CAPIEventPayload = {
    event_name: eventName,
    event_id: eventId,
    event_source_url: typeof window !== 'undefined' ? window.location.href : undefined,
    action_source: 'website',
    fbp: getFbp(),
    fbc: getFbc(),
    client_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    custom_data: customData,
    ...userData,
  }

  sendCAPIEvent(capiPayload)

  return eventId
}

export function initMetaPixel(): void {
  fetchMetaSettings().then((settings) => {
    if (settings?.enabled && settings?.pixel_id) {
      loadPixelScript(settings.pixel_id)
    }
  })
}

export function clearMetaCache(): void {
  cachedSettings = null
  settingsPromise = null
}
