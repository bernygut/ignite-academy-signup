// Supabase Edge Function: send-confirmation
// Deploy with: supabase functions deploy send-confirmation --project-ref YOUR_PROJECT_REF
// Required env var: RESEND_API_KEY (set via: supabase secrets set RESEND_API_KEY=re_xxx)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'noreply@igniteacademy.org'

const ALLOWED_ORIGINS = [
  'https://YOUR_ORG.github.io',  // Replace with your GitHub Pages URL
  'http://localhost:5173',        // Vite dev server
  'http://localhost:4173',        // Vite preview
]

serve(async (req: Request) => {
  const origin = req.headers.get('origin') ?? ''
  const corsHeaders = ALLOWED_ORIGINS.includes(origin)
    ? { 'Access-Control-Allow-Origin': origin }
    : {}

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  }

  let body: { to_email?: string; full_name?: string; programme_name?: string; application_id?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  const { to_email, full_name, programme_name, application_id } = body

  if (!to_email || !full_name || !programme_name || !application_id) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2196F3;">Thank you for applying, ${escapeHtml(full_name)}!</h2>
      <p>Your application for <strong>${escapeHtml(programme_name)}</strong> has been received.</p>
      <p>
        Your application reference number is:<br/>
        <code style="background:#f5f5f5; padding: 4px 8px; border-radius: 4px; font-size: 14px;">
          ${escapeHtml(application_id)}
        </code>
      </p>
      <p>Our team will review your application and be in touch shortly.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #888; font-size: 12px;">
        This is an automated message from the Ignite Academy application system.
        Please do not reply to this email.
      </p>
    </div>
  `

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to_email],
      subject: 'Your Ignite Academy application has been received',
      html,
    }),
  })

  if (!resendRes.ok) {
    const errText = await resendRes.text()
    console.error('Resend error:', errText)
    return new Response(JSON.stringify({ error: 'Email delivery failed' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
})

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
