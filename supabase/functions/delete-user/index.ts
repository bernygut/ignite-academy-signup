import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

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
        'Access-Control-Allow-Methods': 'DELETE',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  if (req.method !== 'DELETE') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) {
    return json({ error: 'Unauthorized' }, 401, corsHeaders)
  }
  const callerJwt = authHeader.slice(7)

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })

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

  let body: { userId?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON' }, 400, corsHeaders)
  }

  const { userId } = body
  if (!userId) {
    return json({ error: 'userId is required' }, 400, corsHeaders)
  }

  if (userId === caller.id) {
    return json({ error: 'No puedes eliminar tu propia cuenta.' }, 400, corsHeaders)
  }

  const { error: deleteErr } = await adminClient.auth.admin.deleteUser(userId)
  if (deleteErr) {
    return json({ error: deleteErr.message }, 400, corsHeaders)
  }

  return json({ success: true }, 200, corsHeaders)
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
