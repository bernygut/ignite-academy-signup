import supabase from '../lib/supabaseClient'

export async function fetchApprovedRecipients(programmeIds) {
  let query = supabase
    .from('applications')
    .select('id, full_name, email, programmes ( id, name )')
    .eq('status', 'approved')
    .order('full_name', { ascending: true })

  if (programmeIds?.length) query = query.in('programme_id', programmeIds)

  const { data, error } = await query
  if (error) throw error
  return data.map((a) => ({
    application_id: a.id,
    full_name:      a.full_name,
    email:          a.email,
    programme_name: a.programmes?.name ?? null,
  }))
}

export async function createInvitationAndSend({
  ceremonyType,
  programmeIds,
  subject,
  bodyHtml,
  ccEmails,
  eventDate,
  eventTime,
  location,
  recipients, // [{ application_id, full_name, email, programme_name }]
}) {
  const { data: { session } } = await supabase.auth.getSession()

  // Insert the campaign
  const { data: invitation, error: invErr } = await supabase
    .from('ceremony_invitations')
    .insert({
      ceremony_type: ceremonyType,
      programme_ids: programmeIds ?? [],
      subject,
      body_html:     bodyHtml,
      cc_emails:     ccEmails ?? [],
      event_date:    eventDate || null,
      event_time:    eventTime || null,
      location:      location || null,
      sent_by:       session?.user?.id ?? null,
    })
    .select('id')
    .single()

  if (invErr) throw invErr

  // Insert recipients
  const rows = recipients.map((r) => ({
    invitation_id:  invitation.id,
    application_id: r.application_id,
    email:          r.email,
    full_name:      r.full_name,
    programme_name: r.programme_name,
  }))

  const { error: recErr } = await supabase
    .from('ceremony_invitation_recipients')
    .insert(rows)

  if (recErr) throw recErr

  // Trigger the Edge Function to actually send the emails
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-ceremony-invitation`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ invitation_id: invitation.id }),
    }
  )

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || 'Error al enviar las invitaciones.')
  }

  return { invitationId: invitation.id, ...(await res.json()) }
}

export async function fetchInvitations() {
  const { data, error } = await supabase
    .from('ceremony_invitations')
    .select('id, ceremony_type, programme_ids, subject, cc_emails, event_date, event_time, location, sent_at')
    .order('sent_at', { ascending: false })

  if (error) throw error
  return data
}

export async function fetchInvitationDetail(invitationId) {
  const { data: invitation, error: invErr } = await supabase
    .from('ceremony_invitations')
    .select('*')
    .eq('id', invitationId)
    .single()

  if (invErr) throw invErr

  const { data: recipients, error: recErr } = await supabase
    .from('ceremony_invitation_recipients')
    .select('*')
    .eq('invitation_id', invitationId)
    .order('full_name', { ascending: true })

  if (recErr) throw recErr

  return { invitation, recipients }
}
