import { useMemo } from 'react'
import { Box, Paper, Typography } from '@mui/material'

const W = 720
const H = 260
const PAD_LEFT   = 44
const PAD_RIGHT  = 16
const PAD_TOP    = 24
const PAD_BOTTOM = 40

function buildSeries(students, lessons, attendanceMap) {
  // Cumulative average attendance % up to and including each lesson.
  const points = []
  let cumulativeAttended = 0
  let cumulativeSlots    = 0

  for (const lesson of lessons) {
    let attendedThisLesson = 0
    for (const student of students) {
      const studentMap = attendanceMap.get(student.id)
      if (studentMap?.get(lesson.id) === true) attendedThisLesson += 1
    }
    cumulativeAttended += attendedThisLesson
    cumulativeSlots    += students.length
    const pct = cumulativeSlots === 0 ? 0 : (cumulativeAttended / cumulativeSlots) * 100
    points.push({
      lessonNumber: lesson.lesson_number,
      pct,
      attendedThisLesson,
      lessonPct: students.length === 0 ? 0 : (attendedThisLesson / students.length) * 100,
    })
  }
  return points
}

export default function AttendanceChart({ students, lessons, attendanceMap }) {
  const points = useMemo(
    () => buildSeries(students, lessons, attendanceMap),
    [students, lessons, attendanceMap]
  )

  if (students.length === 0 || lessons.length === 0) return null

  const innerW = W - PAD_LEFT - PAD_RIGHT
  const innerH = H - PAD_TOP - PAD_BOTTOM

  // Align points to lesson tick positions
  const stepX = lessons.length > 1 ? innerW / (lessons.length - 1) : 0
  const xFor  = (i) => PAD_LEFT + i * stepX
  const yFor  = (pct) => PAD_TOP + innerH - (pct / 100) * innerH

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i)} ${yFor(p.pct)}`)
    .join(' ')

  const yTicks = [0, 25, 50, 75, 100]

  return (
    <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Asistencia acumulada (%)
      </Typography>
      <Box sx={{ width: '100%', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ width: '100%', maxWidth: W, height: 'auto', display: 'block' }}
        >
          {/* Y-axis grid + labels */}
          {yTicks.map((t) => (
            <g key={t}>
              <line
                x1={PAD_LEFT}
                x2={W - PAD_RIGHT}
                y1={yFor(t)}
                y2={yFor(t)}
                stroke="#e0e0e0"
                strokeDasharray={t === 0 ? '' : '3,3'}
              />
              <text
                x={PAD_LEFT - 8}
                y={yFor(t) + 4}
                fontSize="11"
                fill="#666"
                textAnchor="end"
              >
                {t}%
              </text>
            </g>
          ))}

          {/* X-axis labels (lesson numbers) */}
          {points.map((p, i) => (
            <text
              key={p.lessonNumber}
              x={xFor(i)}
              y={H - PAD_BOTTOM + 18}
              fontSize="11"
              fill="#666"
              textAnchor="middle"
            >
              L{p.lessonNumber}
            </text>
          ))}

          {/* Cumulative attendance line */}
          <path d={linePath} fill="none" stroke="#1976d2" strokeWidth="2" />

          {/* Data points */}
          {points.map((p, i) => (
            <g key={p.lessonNumber}>
              <circle cx={xFor(i)} cy={yFor(p.pct)} r="4" fill="#1976d2" />
              <text
                x={xFor(i)}
                y={yFor(p.pct) - 10}
                fontSize="10"
                fill="#1976d2"
                textAnchor="middle"
                fontWeight="600"
              >
                {Math.round(p.pct)}%
              </text>
            </g>
          ))}
        </svg>
      </Box>
    </Paper>
  )
}
