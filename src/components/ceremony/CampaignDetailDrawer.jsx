import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Toolbar,
  Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import ReplayIcon from '@mui/icons-material/Replay'
import { fetchInvitationDetail, retryInvitation } from '../../services/ceremonyService'
import { useSnackbar } from '../../context/SnackbarContext'

const TYPE_LABELS = { inicio: 'Ceremonia de Inicio', graduacion: 'Ceremonia de Graduación' }
const STATUS_COLORS = { sent: 'success', failed: 'error', pending: 'default' }
const STATUS_LABELS = { sent: 'Enviado', failed: 'Fallido', pending: 'Pendiente' }

function Field({ label, value }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
      <Typography variant="body2">{value || '—'}</Typography>
    </Box>
  )
}

export default function CampaignDetailDrawer({ invitationId, onClose }) {
  const { showSnack } = useSnackbar()
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [retrying, setRetrying] = useState(false)

  function load() {
    if (!invitationId) return
    setLoading(true)
    setData(null)
    fetchInvitationDetail(invitationId)
      .then(setData)
      .catch((err) => showSnack(err.message || 'Error al cargar la invitación.', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [invitationId])

  async function handleRetry() {
    setRetrying(true)
    try {
      const result = await retryInvitation(invitationId)
      showSnack(`Reintento: ${result.sent} enviados, ${result.failed} fallidos.`, 'success')
      load()
    } catch (err) {
      showSnack(err.message || 'Error al reintentar.', 'error')
    } finally {
      setRetrying(false)
    }
  }

  const open = Boolean(invitationId)
  const invitation = data?.invitation
  const recipients = data?.recipients ?? []

  const sentCount   = recipients.filter((r) => r.delivery_status === 'sent').length
  const failedCount = recipients.filter((r) => r.delivery_status === 'failed').length

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 560 } } }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography variant="h6">Detalle de la invitación</Typography>
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </Toolbar>
      <Divider />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : invitation && (
        <Box sx={{ p: 3, overflowY: 'auto' }}>
          <Field label="Tipo" value={TYPE_LABELS[invitation.ceremony_type]} />
          <Field
            label="Enviada"
            value={new Date(invitation.sent_at).toLocaleString('es-CR')}
          />
          <Field label="Fecha del evento" value={invitation.event_date} />
          <Field label="Hora del evento" value={invitation.event_time?.slice(0, 5)} />
          <Field label="Lugar" value={invitation.location} />
          <Field
            label="CC"
            value={invitation.cc_emails?.length ? invitation.cc_emails.join(', ') : '—'}
          />
          <Field label="Asunto" value={invitation.subject} />

          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
              Mensaje
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', maxHeight: 280, overflowY: 'auto' }}>
              <Box
                sx={{ '& p': { mt: 0 }, fontSize: 14 }}
                dangerouslySetInnerHTML={{ __html: invitation.body_html }}
              />
            </Paper>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Chip label={`${recipients.length} destinatarios`} size="small" />
            <Chip label={`${sentCount} enviados`} size="small" color="success" />
            {failedCount > 0 && (
              <Chip label={`${failedCount} fallidos`} size="small" color="error" />
            )}
            {(recipients.length - sentCount) > 0 && (
              <Button
                size="small"
                variant="outlined"
                startIcon={retrying ? <CircularProgress size={14} /> : <ReplayIcon />}
                onClick={handleRetry}
                disabled={retrying}
                sx={{ ml: 'auto' }}
              >
                {retrying ? 'Reintentando…' : 'Reintentar fallidos'}
              </Button>
            )}
          </Box>

          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 320 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Nombre</strong></TableCell>
                  <TableCell><strong>Correo</strong></TableCell>
                  <TableCell><strong>Estado</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recipients.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell>{r.full_name}</TableCell>
                    <TableCell>{r.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={STATUS_LABELS[r.delivery_status] ?? r.delivery_status}
                        size="small"
                        color={STATUS_COLORS[r.delivery_status] ?? 'default'}
                      />
                      {r.error_message && (
                        <Typography variant="caption" display="block" color="error">
                          {r.error_message}
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Drawer>
  )
}
