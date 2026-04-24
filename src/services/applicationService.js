import supabase from '../lib/supabaseClient'

export async function createApplication(data) {
  const id = crypto.randomUUID()
  const { error } = await supabase
    .from('applications')
    .insert([{ ...data, id }])

  if (error) throw error
  return { id }
}

export async function fetchApplications({ status, programmeId, dateFrom, dateTo } = {}) {
  let query = supabase
    .from('applications')
    .select(`
      id, full_name, email, age, identificacion,
      diversity_group, ngo_name,
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

export async function updateProgrammeCapacity(programmeId, maxCapacity) {
  const { error } = await supabase
    .from('programmes')
    .update({ max_capacity: maxCapacity })
    .eq('id', programmeId)

  if (error) throw error
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
