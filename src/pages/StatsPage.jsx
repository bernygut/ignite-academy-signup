import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  CircularProgress,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import AdminHeader from '../components/layout/AdminHeader'
import { fetchStats } from '../services/applicationService'
import { useSnackbar } from '../context/SnackbarContext'

function aggregate(applications, key) {
  const byKey = new Map()
  for (const app of applications) {
    const value = app[key] || 'Sin especificar'
    if (!byKey.has(value)) byKey.set(value, { total: 0, approved: 0 })
    const counts = byKey.get(value)
    counts.total += 1
    if (app.status === 'approved') counts.approved += 1
  }
  return [...byKey.entries()]
    .map(([name, counts]) => ({ name, ...counts }))
    .sort((a, b) => b.total - a.total)
}

function CountTable({ title, rows }) {
  const totals = rows.reduce(
    (acc, r) => ({ total: acc.total + r.total, approved: acc.approved + r.approved }),
    { total: 0, approved: 0 }
  )

  return (
    <Paper elevation={2} sx={{ mb: 4 }}>
      <Typography variant="h6" sx={{ p: 2, pb: 1 }}>{title}</Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Nombre</strong></TableCell>
              <TableCell align="right"><strong>Total</strong></TableCell>
              <TableCell align="right"><strong>Aprobados</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" color="text.secondary">Sin datos</Typography>
                </TableCell>
              </TableRow>
            ) : (
              <>
                {rows.map((r) => (
                  <TableRow key={r.name} hover>
                    <TableCell>{r.name}</TableCell>
                    <TableCell align="right">{r.total}</TableCell>
                    <TableCell align="right">{r.approved}</TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ '& td': { fontWeight: 700, borderTop: '2px solid', borderColor: 'divider' } }}>
                  <TableCell>Total</TableCell>
                  <TableCell align="right">{totals.total}</TableCell>
                  <TableCell align="right">{totals.approved}</TableCell>
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  )
}

export default function StatsPage() {
  const { showSnack } = useSnackbar()
  const [applications, setApplications] = useState([])
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    fetchStats()
      .then(setApplications)
      .catch((err) => showSnack(err.message || 'Error al cargar estadísticas.', 'error'))
      .finally(() => setLoading(false))
  }, [showSnack])

  const byGroup = useMemo(() => aggregate(applications, 'diversity_group'), [applications])
  const byNgo   = useMemo(() => aggregate(applications, 'ngo_name'), [applications])

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AdminHeader />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
          Estadísticas de inscripciones
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <CountTable title="Por Grupo Patrocinador" rows={byGroup} />
            <CountTable title="Por ONG" rows={byNgo} />
          </>
        )}
      </Container>
    </Box>
  )
}
