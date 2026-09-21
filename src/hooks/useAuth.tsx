import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

export type Role = 'admin' | 'reseller' | 'user'

interface SignInResult {
  user: User | null
  session: Session | null
}

interface AuthContextValue {
  user: User | null
  role: Role | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<SignInResult>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(true)

  // Resolve the user's role from the user_roles table.
  // This is a PostgREST query (not a Supabase Auth call), so it does NOT touch
  // the auth lock and is safe to run inside onAuthStateChange.
  const fetchRole = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)

      if (error) throw error

      const roles = (data ?? []).map((r: { role: Role }) => r.role)
      if (roles.includes('admin')) {
        setRole('admin')
      } else if (roles.includes('reseller')) {
        setRole('reseller')
      } else {
        setRole('user')
      }
    } catch (error) {
      console.error('Error fetching role:', error)
      setRole('user')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    // Safety net: never let the app hang on the loading screen forever.
    const safety = setTimeout(() => {
      if (active) setLoading(false)
    }, 10000)

    // 1) Load the persisted session once on mount.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchRole(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // 2) React to future auth changes (login/logout/token refresh).
    //
    // IMPORTANT: this callback must stay SYNCHRONOUS and must never call a
    // `supabase.auth.*` method. `signInWithPassword` holds the auth lock while
    // it awaits subscribers; re-entering the lock here (e.g. `await getUser()`)
    // deadlocks the login flow, which is why the app only advanced after F5.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchRole(session.user.id)
      } else {
        setRole(null)
        setLoading(false)
      }
    })

    return () => {
      active = false
      clearTimeout(safety)
      subscription.unsubscribe()
    }
  }, [fetchRole])

  const signIn = useCallback(
    async (email: string, password: string): Promise<SignInResult> => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) throw error

      if (data.user) {
        await fetchRole(data.user.id)
      }

      return { user: data.user ?? null, session: data.session ?? null }
    },
    [fetchRole],
  )

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    setRole(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, role, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
