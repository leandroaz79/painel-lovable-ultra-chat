import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuth } from '../hooks/useAuth'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock data defined with vi.hoisted to avoid hoisting issues
const mockSession = vi.hoisted(() => ({
  access_token: 'token',
  refresh_token: 'refresh',
  expires_in: 3600,
  token_type: 'bearer' as const,
  user: {
    id: 'user-1',
    email: 'admin@test.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2024-01-01',
  },
}))

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: mockSession },
        error: null,
      }),
      onAuthStateChange: vi.fn().mockImplementation(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signInWithPassword: vi.fn(),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { role: 'admin' },
        error: null,
      }),
    }),
  },
  SUPABASE_URL: 'https://test.supabase.co',
  FUNCTIONS: {},
}))

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should start with loading state', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.loading).toBe(true)
    expect(result.current.user).toBeNull()
    expect(result.current.role).toBeNull()
  })

  it('should load session and user role on mount', async () => {
    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.user?.id).toBe('user-1')
    expect(result.current.role).toBe('admin')
  })

  it('should call signInWithPassword on signIn', async () => {
    const supabaseModule = await vi.mocked(import('../lib/supabase'))
    vi.mocked(supabaseModule.supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: mockSession.user, session: mockSession },
      error: null,
    })

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      const data = await result.current.signIn('admin@test.com', 'password')
      expect(data.user?.id).toBe('user-1')
    })
  })

  it('should clear user and role on signOut', async () => {
    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.signOut()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.role).toBeNull()
  })

  it('should subscribe to auth state changes', async () => {
    const supabaseModule = await vi.mocked(import('../lib/supabase'))
    renderHook(() => useAuth())

    expect(supabaseModule.supabase.auth.onAuthStateChange).toHaveBeenCalledTimes(1)
  })
})
