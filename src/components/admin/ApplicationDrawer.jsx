import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { APPLICATION_STATUS, STATUS_COLORS, STATUS_LABELS } from '../../utils/constants'
import { useSnackbar } from '../../context/SnackbarContext'

const DRAWER_WIDTH = 420

export default function ApplicationDrawer({ application, onClose, onSave }) {
  const { showSnack } = useSnackbar()
  const [status, setStatus] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (application) {
      setStatus(application.status)
      setNotes(application.admin_notes ?? '')
    }
  }, [application])

  async function handleSave() {
    setSaving(true)
    try {
      await onSave(application.id, { status, adminNotes: notes })
      showSnack('Solicitud actualizada.', 'success')
      onClose()
    } catch (err) {
      showSnack(err.message || 'Error al guardar los cambios.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const open = Boolean(application)

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: DRAWER_WIDTH } }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography variant="h6">Detalles de la Solicitud</Typography>
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </Toolbar>
      <Divider />

      {application && (
        <Box sx={{ p: 3, overflowY: 'auto', flex: 1 }}>
          {/* Read-only summary */}
          <Section label="Nombre" value={application.full_name} />
          <Section label="Correo" value={application.email} />
          {application.phone && <Section label="Teléfono" value={application.phone} />}
          {application.age && <Section label="Edad" value={application.age} />}
          {application.identificacion && <Section label="Identificación" value={application.identificacion} />}
          {application.diversity_group && <Section label="Grupo de Diversidad e Inclusión" value={application.diversity_group} />}
          {application.ngo_name && <Section label="ONG" value={application.ngo_name} />}
          <Section
            label="Programa"
            value={`${application.programmes?.name ?? ''}${application.programmes?.cohort ? ` – ${application.programmes.cohort}` : ''}`}
          />
          <Section
            label="Enviada"
            value={new Date(application.submitted_at).toLocaleString()}
          />

          <Divider sx={{ my: 2 }} />

          {/* Editable fields */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Estado</InputLabel>
            <Select value={status} label="Estado" onChange={(e) => setStatus(e.target.value)}>
              {Object.entries(STATUS_LABELS).map(([val, label]) => (
                <MenuItem key={val} value={val}>
                  <Chip
                    label={label}
                    color={STATUS_COLORS[val]}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Notas del Administrador"
            multiline
            rows={4}
            fullWidth
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            sx={{ mb: 3 }}
          />

          <Button
            variant="contained"
            fullWidth
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : null}
          >
            {saving ? 'Guardando…' : 'Guardar Cambios'}
          </Button>
        </Box>
      )}
    </Drawer>
  )
}

function Section({ label, value }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Typography variant="body2">{value || '–'}</Typography>
    </Box>
  )
}
