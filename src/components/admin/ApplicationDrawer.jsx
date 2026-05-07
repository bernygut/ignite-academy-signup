import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Drawer,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import DeleteIcon from '@mui/icons-material/Delete'
import supabase from '../../lib/supabaseClient'
import { STATUS_COLORS, STATUS_LABELS, DIVERSITY_GROUP_OPTIONS, NGO_OPTIONS } from '../../utils/constants'
import { useSnackbar } from '../../context/SnackbarContext'
import ApplicationHistory from './ApplicationHistory'

const DRAWER_WIDTH = 420

const EMPTY = {
  full_name: '', email: '', age: '', educational_email: '',
  diversity_group: '', ngo_name: '', programme_id: '', status: '', admin_notes: '',
}

export default function ApplicationDrawer({ application, onClose, onSave, onDelete }) {
  const { showSnack } = useSnackbar()
  const [form, setForm]             = useState(EMPTY)
  const [programmes, setProgrammes] = useState([])
  const [saving, setSaving]         = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting]     = useState(false)
  const [historyKey, setHistoryKey] = useState(0)

  useEffect(() => {
    supabase.from('programmes').select('id, name').eq('is_active', true).then(({ data }) => {
      if (data) setProgrammes(data)
    })
  }, [])

  useEffect(() => {
    if (application) {
      setForm({
        full_name:         application.full_name ?? '',
        email:             application.email ?? '',
        age:               application.age ?? '',
        educational_email: application.educational_email ?? '',
        diversity_group:   application.diversity_group ?? '',
        ngo_name:          application.ngo_name ?? '',
        programme_id:      application.programmes?.id ?? '',
        status:            application.status ?? '',
        admin_notes:       application.admin_notes ?? '',
      })
    }
  }, [application])

  function set(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await onSave(application.id, {
        status:           form.status,
        adminNotes:       form.admin_notes,
        fullName:         form.full_name,
        email:            form.email,
        age:              form.age,
        educationalEmail: form.educational_email,
        diversityGroup:   form.diversity_group,
        ngoName:          form.ngo_name,
        programmeId:      form.programme_id,
      })
      showSnack('Solicitud actualizada.', 'success')
      setHistoryKey((k) => k + 1)
      onClose()
    } catch (err) {
      showSnack(err.message || 'Error al guardar los cambios.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await onDelete(application.id)
      showSnack('Solicitud eliminada.', 'success')
      setConfirmDelete(false)
    } catch (err) {
      showSnack(err.message || 'Error al eliminar la solicitud.', 'error')
    } finally {
      setDeleting(false)
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
        <Button size="small" startIcon={<CloseIcon />} onClick={onClose} color="inherit">
          Cerrar
        </Button>
      </Toolbar>
      <Divider />

      {application && (
        <Box sx={{ p: 3, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>

          <TextField
            label="Nombre completo"
            fullWidth
            value={form.full_name}
            onChange={set('full_name')}
          />

          <TextField
            label="Correo de contacto"
            type="email"
            fullWidth
            value={form.email}
            onChange={set('email')}
          />

          <TextField
            label="Correo educativo"
            type="email"
            fullWidth
            value={form.educational_email}
            onChange={set('educational_email')}
          />

          <TextField
            label="Edad"
            type="number"
            fullWidth
            value={form.age}
            onChange={set('age')}
            inputProps={{ min: 1, max: 119 }}
          />

          <FormControl fullWidth>
            <InputLabel>Grupo Patrocinador</InputLabel>
            <Select value={form.diversity_group} label="Grupo Patrocinador" onChange={set('diversity_group')}>
              <MenuItem value=""><em>Sin grupo</em></MenuItem>
              {DIVERSITY_GROUP_OPTIONS.map((g) => (
                <MenuItem key={g} value={g}>{g}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>ONG / Organización</InputLabel>
            <Select value={form.ngo_name} label="ONG / Organización" onChange={set('ngo_name')}>
              <MenuItem value=""><em>Sin ONG</em></MenuItem>
              {NGO_OPTIONS.map((n) => (
                <MenuItem key={n} value={n}>{n}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Programa</InputLabel>
            <Select value={form.programme_id} label="Programa" onChange={set('programme_id')}>
              {programmes.map((p) => (
                <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Typography variant="caption" color="text.secondary">
            Enviada: {new Date(application.submitted_at).toLocaleString()}
          </Typography>

          <Divider />

          <FormControl fullWidth>
            <InputLabel>Estado</InputLabel>
            <Select value={form.status} label="Estado" onChange={set('status')}>
              {Object.entries(STATUS_LABELS).map(([val, label]) => (
                <MenuItem key={val} value={val}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Notas del Administrador"
            multiline
            rows={4}
            fullWidth
            value={form.admin_notes}
            onChange={set('admin_notes')}
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

          <Divider />

          <Button
            variant="outlined"
            color="error"
            fullWidth
            startIcon={<DeleteIcon />}
            onClick={() => setConfirmDelete(true)}
            disabled={saving}
          >
            Eliminar solicitud
          </Button>

          <Divider sx={{ mt: 1 }} />

          <Typography variant="subtitle2" sx={{ mt: 1 }}>
            Historial de cambios
          </Typography>
          <ApplicationHistory applicationId={application.id} refreshKey={historyKey} />
        </Box>
      )}

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Eliminar solicitud</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Seguro que deseas eliminar la solicitud de{' '}
            <strong>{application?.full_name}</strong>? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmDelete(false)} disabled={deleting}>
            Cancelar
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDelete}
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {deleting ? 'Eliminando…' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Drawer>
  )
}
