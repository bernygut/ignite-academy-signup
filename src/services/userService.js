import supabase from '../lib/supabaseClient'

export async function fetchUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, created_at')
    .in('role', ['admin', 'instructor'])
    .order('role', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function inviteUser({ email, fullName, role }) {
  const { data: { session } } = await supabase.auth.getSession()

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-instructor`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, full_name: fullName, role }),
    }
  )

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || 'Error al enviar la invitación.')
  }

  return res.json()
}
