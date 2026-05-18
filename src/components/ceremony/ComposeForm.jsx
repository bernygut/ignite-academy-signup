import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import { useProgrammes } from '../../hooks/useProgrammes'
import { useSnackbar } from '../../context/SnackbarContext'
import {
  createInvitationAndSend,
  fetchApprovedRecipients,
} from '../../services/ceremonyService'
import RecipientsList from './RecipientsList'

const QUILL_MODULES = {
  toolbar: [
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean'],
  ],
}

const QUILL_FORMATS = ['bold', 'italic', 'underline', 'list', 'bullet', 'link']

const DEFAULT_TEMPLATES = {
  inicio: {
    subject: 'Invitación a la Ceremonia de Inicio de Ignite Academy',
    body: `<p>Estimado/a <strong>{{nombre}}</strong>,</p>
<p>Nos complace invitarte a la <strong>Ceremonia de Inicio</strong> del programa <strong>{{programa}}</strong> de Ignite Academy.</p>
<p><strong>Fecha:</strong> {{fecha}}<br/>
<strong>Hora:</strong> {{hora}}<br/>
<strong>Lugar:</strong> {{lugar}}</p>
<p>Te esperamos para dar inicio a esta gran experiencia.</p>
<p>Saludos cordiales,<br/>Equipo Ignite Academy</p>`,
  },
  graduacion: {
    subject: 'Invitación a la Ceremonia de Graduación de Ignite Academy',
    body: `<p>Estimado/a <strong>{{nombre}}</strong>,</p>
<p>Es un honor invitarte a la <strong>Ceremonia de Graduación</strong> del programa <strong>{{programa}}</strong> de Ignite Academy.</p>
<p><strong>Fecha:</strong> {{fecha}}<br/>
<strong>Hora:</strong> {{hora}}<br/>
<strong>Lugar:</strong> {{lugar}}</p>
<p>Felicitaciones por completar el programa. Te esperamos para celebrar este logro contigo.</p>
<p>Saludos cordiales,<br/>Equipo Ignite Academy</p>`,
  },
}

const MERGE_FIELDS = [
  { token: '{{nombre}}',   description: 'Nombre del participante' },
  { token: '{{programa}}', description: 'Programa al que está inscrito' },
  { token: '{{fecha}}',    description: 'Fecha del evento' },
  { token: '{{hora}}',     description: 'Hora del evento' },
  { token: '{{lugar}}',    description: 'Lugar del evento' },
]

export default function ComposeForm({ onSent }) {
  const { showSnack } = useSnackbar()
  const { programmes } = useProgrammes()

  const [ceremonyType, setCeremonyType] = useState('inicio')
  const [programmeIds, setProgrammeIds] = useState([])
  const [eventDate,    setEventDate]    = useState('')
  const [eventTime,    setEventTime]    = useState('')
  const [location,     setLocation]     = useState('')
  const [ccInput,      setCcInput]      = useState('')
  const [subject,      setSubject]      = useState(DEFAULT_TEMPLATES.inicio.subject)
  const [bodyHtml,     setBodyHtml]     = useState(DEFAULT_TEMPLATES.inicio.body)

  const [recipients, setRecipients] = useState([])
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [loadingRecipients, setLoadingRecipients] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [sending, setSending] = useState(false)

  // Apply default template when ceremony type changes
  useEffect(() => {
    const t = DEFAULT_TEMPLATES[ceremonyType]
    setSubject(t.subject)
    setBodyHtml(t.body)
  }, [ceremonyType])

  // Reload recipients when programmeIds change
  useEffect(() => {
    let cancelled = false
    setLoadingRecipients(true)
    fetchApprovedRecipients(programmeIds)
      .then((data) => {
        if (cancelled) return
        setRecipients(data)
        setSelectedIds(new Set(data.map((r) => r.application_id)))
      })
      .catch((err) => showSnack(err.message || 'Error al cargar destinatarios.', 'error'))
      .finally(() => { if (!cancelled) setLoadingRecipients(false) })
    return () => { cancelled = true }
  }, [programmeIds, showSnack])

  function toggleRecipient(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAllRecipients(checked) {
    setSelectedIds(checked ? new Set(recipients.map((r) => r.application_id)) : new Set())
  }

  const ccEmails = useMemo(() => {
    return ccInput
      .split(/[\s,;]+/)
      .map((s) => s.trim())
      .filter(Boolean)
  }, [ccInput])

  const selectedRecipients = useMemo(
    () => recipients.filter((r) => selectedIds.has(r.application_id)),
    [recipients, selectedIds]
  )

  const canSend = selectedRecipients.length > 0 && subject.trim() && bodyHtml.trim()

  async function handleSend() {
    setSending(true)
    try {
      const result = await createInvitationAndSend({
        ceremonyType,
        programmeIds,
        subject,
        bodyHtml,
        ccEmails,
        eventDate,
        eventTime,
        location,
        recipients: selectedRecipients,
      })
      showSnack(`Enviados: ${result.sent}, fallidos: ${result.failed}.`, 'success')
      setConfirmOpen(false)
      onSent?.()
    } catch (err) {
      showSnack(err.message || 'Error al enviar las invitaciones.', 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Ceremony type + programme filter */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Tipo de ceremonia</InputLabel>
          <Select
            value={ceremonyType}
            label="Tipo de ceremonia"
            onChange={(e) => setCeremonyType(e.target.value)}
          >
            <MenuItem value="inicio">Ceremonia de Inicio</MenuItem>
            <MenuItem value="graduacion">Ceremonia de Graduación</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 240, maxWidth: 380 }}>
          <InputLabel>Programas</InputLabel>
          <Select
            multiple
            value={programmeIds}
            onChange={(e) => setProgrammeIds(e.target.value)}
            input={<OutlinedInput label="Programas" />}
            renderValue={(selected) =>
              selected.length === 0
                ? 'Todos'
                : (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((id) => {
                      const p = programmes.find((pr) => pr.id === id)
                      return <Chip key={id} label={p?.name ?? id} size="small" />
                    })}
                  </Box>
                )
            }
            MenuProps={{ PaperProps: { style: { maxHeight: 320 } } }}
          >
            {programmes.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                <Checkbox checked={programmeIds.includes(p.id)} size="small" />
                <ListItemText primary={p.name} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Event details */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <TextField
          label="Fecha"
          type="date"
          size="small"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 180 }}
        />
        <TextField
          label="Hora"
          type="time"
          size="small"
          value={eventTime}
          onChange={(e) => setEventTime(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 160 }}
        />
        <TextField
          label="Lugar"
          size="small"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          sx={{ flex: 1, minWidth: 240 }}
        />
      </Box>

      <TextField
        label="CC (separados por coma)"
        size="small"
        value={ccInput}
        onChange={(e) => setCcInput(e.target.value)}
        helperText={
          ccEmails.length > 0
            ? `${ccEmails.length} dirección(es) en copia`
            : 'Opcional. Estos correos recibirán cada invitación en copia.'
        }
        fullWidth
      />

      {/* Subject + body */}
      <TextField
        label="Asunto"
        size="small"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        fullWidth
      />

      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
          Mensaje
        </Typography>
        <Box sx={{ '& .ql-editor': { minHeight: 200, fontSize: 14 } }}>
          <ReactQuill
            theme="snow"
            value={bodyHtml}
            onChange={setBodyHtml}
            modules={QUILL_MODULES}
            formats={QUILL_FORMATS}
          />
        </Box>
        <Paper variant="outlined" sx={{ mt: 1, p: 1.5, bgcolor: 'grey.50' }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            Campos de combinación disponibles:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {MERGE_FIELDS.map((f) => (
              <Chip
                key={f.token}
                label={f.token}
                size="small"
                title={f.description}
                sx={{ fontFamily: 'monospace' }}
              />
            ))}
          </Box>
        </Paper>
      </Box>

      <Divider />

      {/* Recipients */}
      <Box>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
          Destinatarios
        </Typography>
        <RecipientsList
          recipients={recipients}
          selectedIds={selectedIds}
          onToggle={toggleRecipient}
          onToggleAll={toggleAllRecipients}
          loading={loadingRecipients}
        />
      </Box>

      {!canSend && (
        <Alert severity="info">
          Completa el asunto, mensaje y selecciona al menos un destinatario para enviar.
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<SendIcon />}
          onClick={() => setConfirmOpen(true)}
          disabled={!canSend}
          size="large"
        >
          Enviar invitaciones
        </Button>
      </Box>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirmar envío</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Se enviarán <strong>{selectedRecipients.length}</strong> invitaciones,
            cada una con copia a <strong>{ccEmails.length}</strong> dirección(es).
            Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmOpen(false)} disabled={sending}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSend}
            disabled={sending}
            startIcon={sending ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
          >
            {sending ? 'Enviando…' : 'Enviar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
