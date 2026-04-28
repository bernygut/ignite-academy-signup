import { Button } from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'

const TODAY = new Date()
TODAY.setHours(23, 59, 59, 999)

function parseLocalDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatHeader(lesson) {
  const date = parseLocalDate(lesson.lesson_date)
  const label = date.toLocaleDateString('es-CR', { month: 'short', day: 'numeric' })
  return `L${lesson.lesson_number} (${label})`
}

function csvEscape(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`
}

function exportAttendanceCSV(students, lessons, attendanceMap, programmeName) {
  const pastLessons = lessons.filter((l) => parseLocalDate(l.lesson_date) <= TODAY)

  const headers = [
    'Nombre',
    'Correo',
    ...lessons.map(formatHeader),
    'Asistencia %',
  ]

  const rows = students.map((student) => {
    const studentMap = attendanceMap.get(student.id) ?? new Map()
    const attended   = pastLessons.filter((l) => studentMap.get(l.id) === true).length
    const pct        = pastLessons.length > 0
      ? `${Math.round((attended / pastLessons.length) * 100)}%`
      : 'N/A'

    return [
      student.full_name,
      student.email,
      ...lessons.map((l) => {
        if (parseLocalDate(l.lesson_date) > TODAY) return 'Pendiente'
        return studentMap.get(l.id) === true ? 'Presente' : 'Ausente'
      }),
      pct,
    ]
  })

  const csv = [headers, ...rows]
    .map((row) => row.map(csvEscape).join(','))
    .join('\r\n')

  // BOM ensures Excel opens the file with correct encoding for Spanish characters
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `asistencia-${programmeName}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function AttendanceExportButton({
  students,
  lessons,
  attendanceMap,
  programmeName,
  disabled,
}) {
  return (
    <Button
      variant="outlined"
      startIcon={<DownloadIcon />}
      disabled={disabled}
      onClick={() => exportAttendanceCSV(students, lessons, attendanceMap, programmeName)}
    >
      Exportar CSV
    </Button>
  )
}
