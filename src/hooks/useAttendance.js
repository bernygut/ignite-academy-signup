import { useCallback, useEffect, useState } from 'react'
import {
  fetchEnrolledStudents,
  fetchLessons,
  fetchAttendanceByLessonIds,
  upsertAttendance,
} from '../services/attendanceService'
import { useAuth } from '../context/AuthContext'
import { useSnackbar } from '../context/SnackbarContext'

export function useAttendance(programmeId) {
  const { session } = useAuth()
  const { showSnack } = useSnackbar()
  const [students, setStudents]         = useState([])
  const [lessons, setLessons]           = useState([])
  const [attendanceMap, setAttendanceMap] = useState(new Map())
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)

  const userId = session?.user?.id

  useEffect(() => {
    if (!programmeId) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [studentsData, lessonsData] = await Promise.all([
          fetchEnrolledStudents(programmeId),
          fetchLessons(programmeId),
        ])

        if (cancelled) return

        const lessonIds = lessonsData.map((l) => l.id)
        const attendanceData = await fetchAttendanceByLessonIds(lessonIds)

        if (cancelled) return

        // Build Map<applicationId, Map<lessonId, present>>
        const map = new Map()
        for (const student of studentsData) {
          map.set(student.id, new Map())
        }
        for (const record of attendanceData) {
          if (map.has(record.application_id)) {
            map.get(record.application_id).set(record.lesson_id, record.present)
          }
        }

        setStudents(studentsData)
        setLessons(lessonsData)
        setAttendanceMap(map)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [programmeId])

  const toggle = useCallback(async (applicationId, lessonId, present) => {
    // Optimistic update
    setAttendanceMap((prev) => {
      const next       = new Map(prev)
      const studentMap = new Map(next.get(applicationId) ?? [])
      studentMap.set(lessonId, present)
      next.set(applicationId, studentMap)
      return next
    })

    try {
      await upsertAttendance({ lessonId, applicationId, present, recordedBy: userId })
    } catch {
      // Rollback on failure
      setAttendanceMap((prev) => {
        const next       = new Map(prev)
        const studentMap = new Map(next.get(applicationId) ?? [])
        studentMap.set(lessonId, !present)
        next.set(applicationId, studentMap)
        return next
      })
      showSnack('Error al guardar la asistencia. Inténtalo de nuevo.', 'error')
    }
  }, [userId, showSnack])

  return { students, lessons, attendanceMap, loading, error, toggle }
}
