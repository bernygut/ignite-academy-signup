// Supabase Edge Function: send-confirmation
// Deploy with: supabase functions deploy send-confirmation --project-ref YOUR_PROJECT_REF
// Required env vars:
//   RESEND_API_KEY          (supabase secrets set RESEND_API_KEY=re_xxx)
//   ADMIN_NOTIFICATION_EMAIL (supabase secrets set ADMIN_NOTIFICATION_EMAIL=admin@yourorg.com)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'noreply@igniteacademy.org'
const ADMIN_EMAIL = Deno.env.get('ADMIN_NOTIFICATION_EMAIL')

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

const ALLOWED_ORIGINS = [
  'https://bernygut.github.io'
]

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
  const origin = req.headers.get('origin') ?? ''
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

  let body: {
    to_email?: string
    educational_email?: string | null
    full_name?: string
    programme_name?: string
    application_id?: string
    age?: string | null
    ngo_name?: string | null
    diversity_group?: string | null
  }

  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  const { to_email, educational_email, full_name, programme_name, application_id, age, ngo_name, diversity_group } = body

  if (!to_email || !full_name || !programme_name || !application_id) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  // --- Applicant confirmation email (Spanish) ---
  const confirmationHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2196F3;">¡Gracias por inscribirte, ${escapeHtml(full_name)}!</h2>
      <p>Tu solicitud para <strong>${escapeHtml(programme_name)}</strong> ha sido recibida.</p>
      ${diversity_group ? `<p>Grupo Patrocinador: <strong>${escapeHtml(diversity_group)}</strong></p>` : ''}
      <p>
        Tu número de referencia es:<br/>
        <code style="background:#f5f5f5; padding: 4px 8px; border-radius: 4px; font-size: 14px;">
          ${escapeHtml(application_id)}
        </code>
      </p>
      <p>Nuestro equipo revisará tu solicitud y se pondrá en contacto contigo pronto.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #888; font-size: 12px;">
        Este es un mensaje automático de Ignite Academy. Por favor no respondas a este correo.
      </p>
    </div>
  `

  // --- Admin / group lead notification email ---
  const optionalRows = [
    diversity_group    ? `<tr><td style="${tdLabel}">Grupo Patrocinador</td><td>${escapeHtml(diversity_group)}</td></tr>` : '',
    educational_email ? `<tr><td style="${tdLabel}">Correo Educativo</td><td>${escapeHtml(educational_email)}</td></tr>` : '',
    age               ? `<tr><td style="${tdLabel}">Edad</td><td>${escapeHtml(String(age))}</td></tr>` : '',
    ngo_name          ? `<tr><td style="${tdLabel}">ONG</td><td>${escapeHtml(ngo_name)}</td></tr>` : '',
  ].join('')

  const notificationTable = `
    <table style="border-collapse: collapse; width: 100%;">
      <tr><td style="${tdLabel}">Nombre</td><td>${escapeHtml(full_name)}</td></tr>
      <tr><td style="${tdLabel}">Correo de Contacto</td><td>${escapeHtml(to_email)}</td></tr>
      <tr><td style="${tdLabel}">Programa</td><td>${escapeHtml(programme_name)}</td></tr>
      ${optionalRows}
      <tr><td style="${tdLabel}">Referencia</td><td><code>${escapeHtml(application_id)}</code></td></tr>
    </table>
  `

  const adminHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2196F3;">Nueva inscripción en Ignite Academy</h2>
      <p>Se ha recibido una nueva solicitud con los siguientes datos:</p>
      ${notificationTable}
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #888; font-size: 12px;">Mensaje automático de Ignite Academy.</p>
    </div>
  `

  const groupLeadHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2196F3;">Nueva inscripción en Ignite Academy</h2>
      <p>Se ha recibido una nueva solicitud con los siguientes datos:</p>
      ${notificationTable}
      <div style="text-align: center; margin: 24px 0;">
        <a href="https://bernygut.github.io/ignite-academy-signup/#/admin"
           style="background-color: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: bold;">
          Revisar en el Portal de Administración
        </a>
      </div>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #888; font-size: 12px;">Mensaje automático de Ignite Academy.</p>
    </div>
  `

  const groupLeads = diversity_group ? (GROUP_LEADS[diversity_group] ?? []) : []
  const notificationSubject = `Nueva inscripción [${diversity_group ?? 'N/A'}]: ${full_name} – ${programme_name}`

  try {
    await sendEmail(to_email, '¡Tu solicitud a Ignite Academy ha sido recibida!', confirmationHtml)

    if (ADMIN_EMAIL) {
      await sendEmail(ADMIN_EMAIL, notificationSubject, adminHtml)
    }

    for (const lead of groupLeads) {
      await sendEmail(lead, notificationSubject, groupLeadHtml)
    }
  } catch (err) {
    console.error('Email error:', err)
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

const tdLabel = 'padding: 6px 12px 6px 0; color: #666; font-size: 13px; white-space: nowrap; vertical-align: top;'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
