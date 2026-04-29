import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY   = Deno.env.get('RESEND_API_KEY')!
const FROM_EMAIL       = Deno.env.get('FROM_EMAIL') ?? 'noreply@igniteacademy.org'
const ADMIN_EMAIL      = Deno.env.get('ADMIN_NOTIFICATION_EMAIL')

const ALLOWED_ORIGINS = ['https://bernygut.github.io']

function parseLeads(envVar: string | undefined): string[] {
  if (!envVar) return []
  return envVar.split(',').map((e) => e.trim()).filter(Boolean)
}

const GROUP_LEADS: Record<string, string[]> = {
  HOLA:       parseLeads(Deno.env.get('GROUP_LEADS_HOLA')),
  BAMCCR:     parseLeads(Deno.env.get('GROUP_LEADS_BAMCCR')),
  FAMILIES:   parseLeads(Deno.env.get('GROUP_LEADS_FAMILIES')),
  WAM:        parseLeads(Deno.env.get('GROUP_LEADS_WAM')),
  INDIGENOUS: parseLeads(Deno.env.get('GROUP_LEADS_INDIGENOUS')),
  GLEAM:      parseLeads(Deno.env.get('GROUP_LEADS_GLEAM')),
}

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Resend error: ${err}`)
  }
}

serve(async (req: Request) => {
  const origin      = req.headers.get('origin') ?? ''
  const corsHeaders = ALLOWED_ORIGINS.includes(origin)
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

  let body: { application_id?: string }
  try { body = await req.json() } catch {
    return json({ error: 'Invalid JSON' }, 400, corsHeaders)
  }

  const { application_id } = body
  if (!application_id) return json({ error: 'application_id is required' }, 400, corsHeaders)

  // Fetch application + programme in one query
  const { data: app, error: fetchErr } = await adminClient
    .from('applications')
    .select('full_name, email, educational_email, age, ngo_name, diversity_group, programmes(name)')
    .eq('id', application_id)
    .single()

  if (fetchErr || !app) return json({ error: 'Application not found' }, 404, corsHeaders)

  const programmeName  = (app.programmes as { name: string } | null)?.name ?? ''
  const diversityGroup = app.diversity_group ?? null
  const groupLeads     = diversityGroup ? (GROUP_LEADS[diversityGroup] ?? []) : []

  // ── Participant email ────────────────────────────────────────────
  const participantHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2196F3;">¡Has sido aceptado/a en Ignite Academy!</h2>
      <p>Hola <strong>${escapeHtml(app.full_name)}</strong>,</p>
      <p>
        ¡Felicitaciones! Tu solicitud para el programa
        <strong>${escapeHtml(programmeName)}</strong> ha sido <strong>aprobada</strong>.
      </p>
      <p>
        Pronto recibirás más información sobre los próximos pasos y la fecha de inicio.
        Si tienes alguna pregunta, responde a este correo.
      </p>
      <p>
        Tu número de referencia es:<br/>
        <code style="background:#f5f5f5; padding: 4px 8px; border-radius: 4px; font-size: 14px;">
          ${escapeHtml(application_id)}
        </code>
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #888; font-size: 12px;">Mensaje automático de Ignite Academy. Por favor no respondas a este correo.</p>
    </div>
  `

  // ── Shared details table for admin / group leads ─────────────────
  const optionalRows = [
    diversityGroup    ? `<tr><td style="${tdLabel}">Grupo Patrocinador</td><td>${escapeHtml(diversityGroup)}</td></tr>` : '',
    app.educational_email ? `<tr><td style="${tdLabel}">Correo Educativo</td><td>${escapeHtml(app.educational_email)}</td></tr>` : '',
    app.age           ? `<tr><td style="${tdLabel}">Edad</td><td>${escapeHtml(String(app.age))}</td></tr>` : '',
    app.ngo_name      ? `<tr><td style="${tdLabel}">ONG</td><td>${escapeHtml(app.ngo_name)}</td></tr>` : '',
  ].join('')

  const detailsTable = `
    <table style="border-collapse: collapse; width: 100%;">
      <tr><td style="${tdLabel}">Nombre</td><td>${escapeHtml(app.full_name)}</td></tr>
      <tr><td style="${tdLabel}">Correo</td><td>${escapeHtml(app.email)}</td></tr>
      <tr><td style="${tdLabel}">Programa</td><td>${escapeHtml(programmeName)}</td></tr>
      ${optionalRows}
      <tr><td style="${tdLabel}">Referencia</td><td><code>${escapeHtml(application_id)}</code></td></tr>
    </table>
  `

  const adminPortalBtn = `
    <div style="text-align: center; margin: 24px 0;">
      <a href="https://bernygut.github.io/ignite-academy-signup/#/admin"
         style="background-color: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: bold;">
        Ver en el Portal de Administración
      </a>
    </div>
  `

  // ── Admin email ──────────────────────────────────────────────────
  const adminHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4CAF50;">Solicitud aprobada</h2>
      <p>La siguiente solicitud ha sido <strong>aprobada</strong>:</p>
      ${detailsTable}
      ${adminPortalBtn}
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #888; font-size: 12px;">Mensaje automático de Ignite Academy.</p>
    </div>
  `

  // ── Group lead email ─────────────────────────────────────────────
  const groupLeadHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4CAF50;">Participante aprobado/a${diversityGroup ? ` — ${escapeHtml(diversityGroup)}` : ''}</h2>
      <p>Un/a participante de tu grupo ha sido <strong>aprobado/a</strong> en Ignite Academy:</p>
      ${detailsTable}
      ${adminPortalBtn}
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #888; font-size: 12px;">Mensaje automático de Ignite Academy.</p>
    </div>
  `

  const adminSubject    = `Solicitud aprobada: ${app.full_name} – ${programmeName}`
  const leadSubject     = `Participante aprobado/a${diversityGroup ? ` [${diversityGroup}]` : ''}: ${app.full_name} – ${programmeName}`
  const participantSubj = `¡Has sido aceptado/a en Ignite Academy! – ${programmeName}`

  try {
    await sendEmail(app.email, participantSubj, participantHtml)

    if (ADMIN_EMAIL) await sendEmail(ADMIN_EMAIL, adminSubject, adminHtml)

    for (const lead of groupLeads) {
      await sendEmail(lead, leadSubject, groupLeadHtml)
    }
  } catch (err) {
    console.error('Email error:', err)
    return json({ error: 'Email delivery failed' }, 502, corsHeaders)
  }

  return json({ success: true }, 200, corsHeaders)
})

const tdLabel = 'padding: 6px 12px 6px 0; color: #666; font-size: 13px; white-space: nowrap; vertical-align: top;'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function json(data: unknown, status: number, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...extra },
  })
}
