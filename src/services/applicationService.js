import supabase from '../lib/supabaseClient'

export async function createApplication(data) {
  const { data: row, error } = await supabase
    .from('applications')
    .insert([data])
    .select('id')
    .single()

  if (error) throw error
  return row
}

export async function fetchApplications({ status, programmeId, dateFrom, dateTo } = {}) {
  let query = supabase
    .from('applications')
    .select(`
      id, full_name, email, phone, age, gender, country,
      ngo_name, caseworker_name, beneficiary_id,
      status, admin_notes, reviewed_at, submitted_at,
      programmes ( id, name, cohort )
    `)
    .order('submitted_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (programmeId) query = query.eq('programme_id', programmeId)
  if (dateFrom) query = query.gte('submitted_at', dateFrom)
  if (dateTo) query = query.lte('submitted_at', dateTo)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function updateApplication(id, { status, adminNotes }) {
  const updates = {
    status,
    admin_notes: adminNotes,
    reviewed_at: new Date().toISOString(),
  }

  // Include the logged-in admin's user ID
  const { data: { user } } = await supabase.auth.getUser()
  if (user) updates.reviewed_by = user.id

  const { error } = await supabase
    .from('applications')
    .update(updates)
    .eq('id', id)

  if (error) throw error
}
