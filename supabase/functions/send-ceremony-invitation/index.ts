// Sends a ceremony invitation campaign to its recipients.
// Looks up the invitation + recipients by ID, formats the date/time/location
// nicely in Spanish, substitutes merge fields per-recipient, calls Resend,
// and updates delivery_status on each recipient row.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY   = Deno.env.get('RESEND_API_KEY')!
const FROM_EMAIL       = Deno.env.get('FROM_EMAIL') ?? 'noreply@ignite-academy.org'

const ALLOWED_ORIGINS = ['https://bernygut.github.io']

const MONTHS_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

function formatDateEs(dateStr: string | null): string {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  return `${d} de ${MONTHS_ES[m - 1]} de ${y}`
}

function formatTimeEs(timeStr: string | null): string {
  if (!timeStr) return ''
  // timeStr is HH:MM:SS, return HH:MM
  return timeStr.slice(0, 5)
}

function fillMergeFields(html: string, vars: Record<string, string>): string {
  return html.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '')
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Resend free tier is 5 req/sec. We aim for ~4 req/sec to stay safely below.
const MIN_INTERVAL_MS = 250
const MAX_RETRIES     = 3

async function sendEmailWithRetry(opts: {
  to: string
  cc?: string[]
  subject: string
  html: string
}) {
  let attempt = 0
  while (true) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to:   [opts.to],
        cc:   opts.cc && opts.cc.length ? opts.cc : undefined,
        subject: opts.subject,
        html:    opts.html,
      }),
    })
    if (res.ok) return

    const text = await res.text()
    // Retry on 429 (rate limit) with exponential backoff
    if (res.status === 429 && attempt < MAX_RETRIES) {
      attempt += 1
      await sleep(1000 * attempt)
      continue
    }
    throw new Error(text)
  }
}

serve(async (req: Request) => {
  const origin = req.headers.get('origin') ?? ''
  const corsHeaders: Record<string, string> = ALLOWED_ORIGINS.includes(origin)
    ? { 'Access-Control-Allow-Origin': origin }
    : {}

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

  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) {
    return json({ error: 'Unauthorized' }, 401, corsHeaders)
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })

  const { data: { user: caller }, error: jwtErr } =
    await adminClient.auth.getUser(authHeader.slice(7))

  if (jwtErr || !caller) return json({ error: 'Unauthorized' }, 401, corsHeaders)

  const { data: callerProfile } = await adminClient
    .from('profiles').select('role').eq('id', caller.id).single()

  if (callerProfile?.role !== 'admin') {
    return json({ error: 'Forbidden' }, 403, corsHeaders)
  }

  let body: { invitation_id?: string }
  try { body = await req.json() } catch {
    return json({ error: 'Invalid JSON' }, 400, corsHeaders)
  }

  const { invitation_id } = body
  if (!invitation_id) return json({ error: 'invitation_id is required' }, 400, corsHeaders)

  const { data: invitation, error: invErr } = await adminClient
    .from('ceremony_invitations')
    .select('id, ceremony_type, subject, body_html, cc_emails, event_date, event_time, location')
    .eq('id', invitation_id)
    .single()

  if (invErr || !invitation) return json({ error: 'Invitation not found' }, 404, corsHeaders)

  // Only process recipients that have not already been sent — makes the
  // function safe to re-invoke for retries of failed/pending ones.
  const { data: recipients, error: recErr } = await adminClient
    .from('ceremony_invitation_recipients')
    .select('id, email, full_name, programme_name')
    .eq('invitation_id', invitation_id)
    .neq('delivery_status', 'sent')

  if (recErr) return json({ error: recErr.message }, 500, corsHeaders)
  if (!recipients?.length) return json({ success: true, sent: 0, failed: 0 }, 200, corsHeaders)

  const fechaStr = formatDateEs(invitation.event_date)
  const horaStr  = formatTimeEs(invitation.event_time)
  const lugarStr = invitation.location ?? ''

  let sent = 0
  let failed = 0
  let lastSendAt = 0

  for (const r of recipients) {
    // Throttle to stay under Resend's 5 req/sec limit
    const elapsed = Date.now() - lastSendAt
    if (elapsed < MIN_INTERVAL_MS) await sleep(MIN_INTERVAL_MS - elapsed)

    const vars = {
      nombre:   r.full_name,
      programa: r.programme_name ?? '',
      fecha:    fechaStr,
      hora:     horaStr,
      lugar:    lugarStr,
    }
    const personalized = fillMergeFields(invitation.body_html, vars)
    const subject      = fillMergeFields(invitation.subject, vars)

    try {
      await sendEmailWithRetry({
        to:      r.email,
        cc:      invitation.cc_emails,
        subject,
        html:    personalized,
      })
      sent += 1
      await adminClient
        .from('ceremony_invitation_recipients')
        .update({ delivery_status: 'sent', error_message: null })
        .eq('id', r.id)
    } catch (err) {
      failed += 1
      const msg = err instanceof Error ? err.message : String(err)
      await adminClient
        .from('ceremony_invitation_recipients')
        .update({ delivery_status: 'failed', error_message: msg.slice(0, 500) })
        .eq('id', r.id)
    }
    lastSendAt = Date.now()
  }

  return json({ success: true, sent, failed }, 200, corsHeaders)
})

function json(data: unknown, status: number, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...extra },
  })
}
