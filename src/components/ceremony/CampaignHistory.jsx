import { useEffect, useState } from 'react'
import {
  Box,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { fetchInvitations } from '../../services/ceremonyService'
import { useSnackbar } from '../../context/SnackbarContext'
import CampaignDetailDrawer from './CampaignDetailDrawer'

const TYPE_LABELS = { inicio: 'Inicio', graduacion: 'Graduación' }
const TYPE_COLORS = { inicio: 'info', graduacion: 'success' }

export default function CampaignHistory({ reloadKey }) {
  const { showSnack } = useSnackbar()
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading]         = useState(true)
  const [selected, setSelected]       = useState(null)

  useEffect(() => {
    setLoading(true)
    fetchInvitations()
      .then(setInvitations)
      .catch((err) => showSnack(err.message || 'Error al cargar el historial.', 'error'))
      .finally(() => setLoading(false))
  }, [showSnack, reloadKey])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (invitations.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">
          Aún no se han enviado invitaciones.
        </Typography>
      </Paper>
    )
  }

  return (
    <>
      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Fecha enviada</strong></TableCell>
              <TableCell><strong>Tipo</strong></TableCell>
              <TableCell><strong>Asunto</strong></TableCell>
              <TableCell><strong>Fecha evento</strong></TableCell>
              <TableCell align="right"><strong>CC</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invitations.map((inv) => (
              <TableRow
                key={inv.id}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => setSelected(inv.id)}
              >
                <TableCell>
                  {new Date(inv.sent_at).toLocaleString('es-CR', {
                    year: 'numeric', month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit', hour12: false,
                  })}
                </TableCell>
                <TableCell>
                  <Chip
                    label={TYPE_LABELS[inv.ceremony_type]}
                    size="small"
                    color={TYPE_COLORS[inv.ceremony_type]}
                  />
                </TableCell>
                <TableCell>{inv.subject}</TableCell>
                <TableCell>{inv.event_date || '—'}</TableCell>
                <TableCell align="right">{inv.cc_emails?.length ?? 0}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <CampaignDetailDrawer
        invitationId={selected}
        onClose={() => setSelected(null)}
      />
    </>
  )
}
