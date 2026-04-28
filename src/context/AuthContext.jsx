import { createContext, useContext, useEffect, useState } from 'react'
import supabase from '../lib/supabaseClient'

// Captured synchronously at module load — before Supabase processes the URL hash.
// Supabase invite links redirect with #access_token=...&type=invite in the fragment.
const LAUNCHED_FROM_INVITE = window.location.hash.includes('type=invite')

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession]               = useState(undefined) // undefined = loading
  const [role, setRole]                     = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [needsPasswordSet, setNeedsPasswordSet] = useState(false)

  async function fetchRole(userId) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()
      setRole(data?.role ?? null)
    } catch {
      setRole(null)
    } finally {
      setProfileLoading(false)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        fetchRole(session.user.id)
      } else {
        setProfileLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session)
        if (session) {
          if (LAUNCHED_FROM_INVITE && event === 'SIGNED_IN') {
            // Invited instructor — skip profile fetch, role is known
            setRole('instructor')
            setNeedsPasswordSet(true)
            setProfileLoading(false)
          } else {
            fetchRole(session.user.id)
          }
        } else {
          setRole(null)
          setNeedsPasswordSet(false)
          setProfileLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  function clearInviteState() {
    setNeedsPasswordSet(false)
  }

  return (
    <AuthContext.Provider value={{
      session,
      role,
      profileLoading,
      needsPasswordSet,
      clearInviteState,
      signIn,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
