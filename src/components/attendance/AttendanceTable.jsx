import {
  Box,
  Checkbox,
  Chip,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'

function endOfToday() {
  const t = new Date()
  t.setHours(23, 59, 59, 999)
  return t
}

function parseLocalDate(dateStr) {
  // Parse as local time to avoid UTC-offset date shifting
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatLessonDate(dateStr) {
  return parseLocalDate(dateStr).toLocaleDateString('es-CR', {
    month: 'short',
    day:   'numeric',
  })
}

// A lesson "counts" toward attendance once either:
//  - its date has passed (today or earlier), or
//  - any student has been marked for it (so the instructor has taken attendance).
function getCountableLessons(lessons, attendanceMap) {
  const now = endOfToday()
  return lessons.filter((l) => {
    if (parseLocalDate(l.lesson_date) <= now) return true
    for (const sm of attendanceMap.values()) if (sm.has(l.id)) return true
    return false
  })
}

function calcAttendance(studentMap, countableLessons) {
  if (!countableLessons.length) return null
  const attended = countableLessons.filter((l) => studentMap?.get(l.id) === true).length
  return {
    attended,
    total: countableLessons.length,
    pct:   Math.round((attended / countableLessons.length) * 100),
  }
}

function pctColor(pct) {
  if (pct >= 80) return 'success'
  if (pct >= 50) return 'warning'
  return 'error'
}

const STICKY = {
  position: 'sticky',
  left:     0,
  zIndex:   2,
  bgcolor:  'background.paper',
}

const CELL_WIDTH = 80

export default function AttendanceTable({
  students,
  lessons,
  attendanceMap,
  loading,
  toggle,
}) {
  const countableLessons = getCountableLessons(lessons, attendanceMap)

  if (loading) {
    return (
      <Box>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} height={52} sx={{ mb: 0.5 }} />
        ))}
      </Box>
    )
  }

  if (!loading && students.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
        No hay participantes aprobados para este programa.
      </Typography>
    )
  }

  return (
    <TableContainer sx={{ overflowX: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            {/* Sticky name column */}
            <TableCell sx={{ ...STICKY, zIndex: 3, minWidth: 220, fontWeight: 700 }}>
              Participante
            </TableCell>

            {lessons.map((lesson) => (
              <TableCell
                key={lesson.id}
                align="center"
                sx={{ minWidth: CELL_WIDTH, fontWeight: 700 }}
              >
                L{lesson.lesson_number}
                <br />
                <Typography variant="caption" display="block" sx={{ fontWeight: 400 }}>
                  {formatLessonDate(lesson.lesson_date)}
                </Typography>
              </TableCell>
            ))}

            <TableCell align="center" sx={{ minWidth: 110, fontWeight: 700 }}>
              Asistencia
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {students.map((student) => {
            const studentMap = attendanceMap.get(student.id) ?? new Map()
            const stats      = calcAttendance(studentMap, countableLessons)

            return (
              <TableRow key={student.id} hover>
                <TableCell sx={{ ...STICKY }}>
                  <Typography variant="body2" noWrap fontWeight={500}>
                    {student.full_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {student.email}
                  </Typography>
                </TableCell>

                {lessons.map((lesson) => {
                  const checked = studentMap.get(lesson.id) === true

                  return (
                    <TableCell key={lesson.id} align="center" padding="checkbox">
                      <Checkbox
                        size="small"
                        checked={checked}
                        onChange={(e) => toggle(student.id, lesson.id, e.target.checked)}
                      />
                    </TableCell>
                  )
                })}

                <TableCell align="center">
                  {stats ? (
                    <Chip
                      label={`${stats.attended}/${stats.total} (${stats.pct}%)`}
                      color={pctColor(stats.pct)}
                      size="small"
                      variant="outlined"
                    />
                  ) : (
                    <Typography variant="caption" color="text.disabled">—</Typography>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
