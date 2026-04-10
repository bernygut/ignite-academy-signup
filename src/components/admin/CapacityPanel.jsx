import { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  IconButton,
  LinearProgress,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import { useProgrammes } from '../../hooks/useProgrammes'
import { updateProgrammeCapacity } from '../../services/applicationService'
import { useSnackbar } from '../../context/SnackbarContext'

export default function CapacityPanel() {
  const { programmes, loading } = useProgrammes()
  const { showSnack } = useSnackbar()
  const [editing, setEditing] = useState(null) // { id, value }

  async function handleSave(programme) {
    const newCap = parseInt(editing.value, 10)
    if (isNaN(newCap) || newCap < 1) {
      showSnack('La capacidad debe ser un número mayor a 0.', 'error')
      return
    }
    try {
      await updateProgrammeCapacity(programme.id, newCap)
      showSnack(`Capacidad de ${programme.name} actualizada.`, 'success')
      setEditing(null)
      // Reload page to refresh counts
      window.location.reload()
    } catch (err) {
      showSnack(err.message || 'Error al actualizar capacidad.', 'error')
    }
  }

  if (loading) return null

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Capacidad por Programa
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {programmes.map((p) => {
          const pct = Math.min((p.enrolled / p.max_capacity) * 100, 100)
          const isEditing = editing?.id === p.id
          return (
            <Card key={p.id} elevation={2} sx={{ minWidth: 220, flex: '1 1 220px' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight={700}>{p.name}</Typography>
                  {isEditing ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <TextField
                        size="small"
                        type="number"
                        value={editing.value}
                        onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                        inputProps={{ min: 1, style: { width: 60 } }}
                        sx={{ width: 80 }}
                      />
                      <Tooltip title="Guardar">
                        <IconButton size="small" color="primary" onClick={() => handleSave(p)}>
                          <CheckIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Cancelar">
                        <IconButton size="small" onClick={() => setEditing(null)}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ) : (
                    <Tooltip title="Editar capacidad máxima">
                      <IconButton size="small" onClick={() => setEditing({ id: p.id, value: p.max_capacity })}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={pct}
                  color={pct >= 100 ? 'error' : pct >= 80 ? 'warning' : 'primary'}
                  sx={{ mb: 1, height: 8, borderRadius: 1 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {p.enrolled} inscritos / {p.max_capacity} máximo · {Math.max(p.available, 0)} disponibles
                </Typography>
              </CardContent>
            </Card>
          )
        })}
      </Box>
    </Box>
  )
}
