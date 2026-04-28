import supabase from '../lib/supabaseClient'

export async function fetchEnrolledStudents(programmeId) {
  const { data, error } = await supabase
    .from('applications')
    .select('id, full_name, email')
    .eq('programme_id', programmeId)
    .eq('status', 'approved')
    .order('full_name', { ascending: true })

  if (error) throw error
  return data
}

export async function fetchLessons(programmeId) {
  const { data, error } = await supabase
    .from('lessons')
    .select('id, lesson_number, lesson_date')
    .eq('programme_id', programmeId)
    .order('lesson_number', { ascending: true })

  if (error) throw error
  return data
}

export async function fetchAttendanceByLessonIds(lessonIds) {
  if (!lessonIds.length) return []
  const { data, error } = await supabase
    .from('attendance')
    .select('application_id, lesson_id, present')
    .in('lesson_id', lessonIds)

  if (error) throw error
  return data
}

export async function upsertAttendance({ lessonId, applicationId, present, recordedBy }) {
  const { error } = await supabase
    .from('attendance')
    .upsert(
      {
        lesson_id:      lessonId,
        application_id: applicationId,
        present,
        recorded_by:    recordedBy ?? null,
        recorded_at:    new Date().toISOString(),
      },
      { onConflict: 'lesson_id,application_id' }
    )

  if (error) throw error
}
