const EDGE_FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-confirmation`

export async function sendConfirmationEmail({ toEmail, fullName, programmeName, applicationId }) {
  const res = await fetch(EDGE_FN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // The anon key authenticates the Edge Function call
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      to_email: toEmail,
      full_name: fullName,
      programme_name: programmeName,
      application_id: applicationId,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error')
    throw new Error(`Email send failed: ${text}`)
  }

  return res.json()
}
