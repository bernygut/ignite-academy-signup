// Supabase Edge Function: create-instructor
// Deploy with: supabase functions deploy create-instructor --project-ref YOUR_PROJECT_REF
// Uses SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (auto-injected by Supabase Edge runtime)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SITE_URL          = 'https://bernygut.github.io/ignite-academy-signup/'

const ALLOWED_ORIGINS = ['https://bernygut.github.io']

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

  // Verify caller has a valid session
  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) {
    return json({ error: 'Unauthorized' }, 401, corsHeaders)
  }
  const callerJwt = authHeader.slice(7)

  // Admin client uses service role key — bypasses RLS for admin operations
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })

  // Verify the caller's JWT and look up their role
  const { data: { user: caller }, error: jwtErr } =
    await adminClient.auth.getUser(callerJwt)

  if (jwtErr || !caller) {
    return json({ error: 'Unauthorized' }, 401, corsHeaders)
  }

  const { data: callerProfile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', caller.id)
    .single()

  if (callerProfile?.role !== 'admin') {
    return json({ error: 'Forbidden: admin role required' }, 403, corsHeaders)
  }

  // Parse request body
  let body: { email?: string; full_name?: string; role?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON' }, 400, corsHeaders)
  }

  const { email, full_name, role = 'instructor' } = body
  if (!email) {
    return json({ error: 'email is required' }, 400, corsHeaders)
  }
  if (role !== 'admin' && role !== 'instructor') {
    return json({ error: 'role must be admin or instructor' }, 400, corsHeaders)
  }

  // Invite the user — Supabase sends an email with a one-time link.
  // The link redirects to SITE_URL where the app detects type=invite
  // and renders SetPasswordPage.
  const { data: inviteData, error: inviteErr } =
    await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: SITE_URL,
    })

  if (inviteErr) {
    return json({ error: inviteErr.message }, 400, corsHeaders)
  }

  const newUserId = inviteData.user.id

  // Update the auto-created profile: set role plus name/email
  await adminClient
    .from('profiles')
    .update({ role, full_name: full_name ?? null, email })
    .eq('id', newUserId)

  return json({ success: true, userId: newUserId }, 200, corsHeaders)
})

function json(
  data: unknown,
  status: number,
  extra: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...extra },
  })
}
