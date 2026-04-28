import { useState } from 'react'
import { Box, Container, Tab, Tabs, Typography } from '@mui/material'
import AdminHeader from '../components/layout/AdminHeader'
import AttendanceTable from '../components/attendance/AttendanceTable'
import AttendanceExportButton from '../components/attendance/AttendanceExportButton'
import { useAttendance } from '../hooks/useAttendance'

const PROGRAMMES = [
  { id: 'a0000000-0000-0000-0000-000000000001', name: 'AI-900' },
  { id: 'a0000000-0000-0000-0000-000000000002', name: 'AZ-900' },
  { id: 'a0000000-0000-0000-0000-000000000003', name: 'SC-900' },
]

export default function AttendancePage() {
  const [tab, setTab] = useState(0)
  const programme     = PROGRAMMES[tab]

  const { students, lessons, attendanceMap, loading, error, toggle } =
    useAttendance(programme.id)

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AdminHeader />
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 2,
          }}
        >
          <Typography variant="h4">Asistencia</Typography>
          <AttendanceExportButton
            students={students}
            lessons={lessons}
            attendanceMap={attendanceMap}
            programmeName={programme.name}
            disabled={loading || students.length === 0}
          />
        </Box>

        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ mb: 2 }}
        >
          {PROGRAMMES.map((p) => (
            <Tab key={p.id} label={p.name} />
          ))}
        </Tabs>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <AttendanceTable
          students={students}
          lessons={lessons}
          attendanceMap={attendanceMap}
          loading={loading}
          toggle={toggle}
        />
      </Container>
    </Box>
  )
}
