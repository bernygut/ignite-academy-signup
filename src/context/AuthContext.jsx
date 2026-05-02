import { createContext, useContext, useEffect, useState } from 'react'
import supabase from '../lib/supabaseClient'

// Decodes the JWT payload and checks whether this session was created via
// an invite OTP link (AMR method = "otp") rather than a password sign-in.
// This is reliable regardless of URL processing order or browser behaviour.
function isInviteSession(session) {
  if (!session?.access_token) return false
  try {
    const payload = JSON.parse(atob(session.access_token.split('.')[1]))
    const amr = payload.amr ?? []
    return (
      amr.some((m) => m.method === 'otp' || m.method === 'invite') &&
      !amr.some((m) => m.method === 'password')
    )
  } catch {
    return false
  }
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession]                   = useState(undefined) // undefined = loading
  const [role, setRole]                         = useState(null)
  const [profileLoading, setProfileLoading]     = useState(true)
  const [needsPasswordSet, setNeedsPasswordSet] = useState(false)
  // currentLevel: AAL of this session. nextLevel: max AAL achievable (based on enrolled factors).
  // Both start as 'aal1'; updated once user state is fetched.
  const [mfaLevel, setMfaLevel] = useState({ current: 'aal1', next: 'aal1' })

  async function fetchUserState(userId) {
    setProfileLoading(true)
    try {
      const [{ data: profileData }, { data: mfaData }] = await Promise.all([
        supabase.from('profiles').select('role').eq('id', userId).single(),
        supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
      ])
      setRole(profileData?.role ?? null)
      setMfaLevel({
        current: mfaData?.currentLevel ?? 'aal1',
        next:    mfaData?.nextLevel    ?? 'aal1',
      })
    } catch {
      setRole(null)
    } finally {
      setProfileLoading(false)
    }
  }

  // Call after a successful MFA challenge or enroll to reflect the new AAL in context.
  async function refreshMfaLevel() {
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    setMfaLevel({
      current: data?.currentLevel ?? 'aal1',
      next:    data?.nextLevel    ?? 'aal1',
    })
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        if (isInviteSession(session)) {
          setRole('instructor')
          setNeedsPasswordSet(true)
          setMfaLevel({ current: 'aal1', next: 'aal1' })
          setProfileLoading(false)
        } else {
          fetchUserState(session.user.id)
        }
      } else {
        setProfileLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session)
        if (session) {
          // Only apply invite detection on new sign-in events, not on
          // USER_UPDATED (which fires after the password is set).
          if (
            (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') &&
            isInviteSession(session)
          ) {
            setRole('instructor')
            setNeedsPasswordSet(true)
            setMfaLevel({ current: 'aal1', next: 'aal1' })
            setProfileLoading(false)
          } else {
            fetchUserState(session.user.id)
          }
        } else {
          setRole(null)
          setMfaLevel({ current: 'aal1', next: 'aal1' })
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
      mfaLevel,
      refreshMfaLevel,
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
