import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<'admin' | 'reseller' | 'user' | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Checar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        // Refresh user metadata from server
        supabase.auth.getUser().then(({ data: { user: freshUser } }) => {
          if (freshUser) setUser(freshUser)
        })
        fetchRole(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listener de mudanças de auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        const { data: { user: freshUser } } = await supabase.auth.getUser()
        if (freshUser) setUser(freshUser)
        fetchRole(session.user.id)
      } else {
        setRole(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchRole(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)

      if (error) throw error

      const roles = data?.map(r => r.role) || []
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
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw error
    
    if (data.user) {
      await fetchRole(data.user.id)
    }
    
    return data
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    setRole(null)
  }

  return {
    user,
    role,
    loading,
    signIn,
    signOut,
  }
}
