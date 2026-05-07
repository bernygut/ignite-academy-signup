import { useEffect, useState } from 'react'
import { Box, CircularProgress, Typography } from '@mui/material'
import { fetchApplicationHistory } from '../../services/applicationService'
import { STATUS_LABELS } from '../../utils/constants'

const FIELD_LABELS = {
  full_name:         'Nombre',
  email:             'Correo',
  educational_email: 'Correo educativo',
  age:               'Edad',
  diversity_group:   'Grupo Patrocinador',
  ngo_name:          'ONG',
  programme:         'Programa',
  status:            'Estado',
  admin_notes:       'Notas',
}

function formatValue(field, value) {
  if (value === null || value === '') return '—'
  if (field === 'status') return STATUS_LABELS[value] ?? value
  return value
}

export default function ApplicationHistory({ applicationId, refreshKey }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!applicationId) return
    setLoading(true)
    fetchApplicationHistory(applicationId)
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setLoading(false))
  }, [applicationId, refreshKey])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
        <CircularProgress size={20} />
      </Box>
    )
  }

  if (entries.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Sin cambios registrados.
      </Typography>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {entries.map((e) => (
        <Box key={e.id} sx={{ borderLeft: '3px solid', borderColor: 'divider', pl: 1.5 }}>
          <Typography variant="caption" color="text.secondary" display="block">
            {new Date(e.changed_at).toLocaleString('es-CR')} — {e.changed_by_email ?? 'Sistema'}
          </Typography>
          <Typography variant="body2">
            <strong>{FIELD_LABELS[e.field_name] ?? e.field_name}:</strong>{' '}
            <span style={{ color: '#888', textDecoration: 'line-through' }}>
              {formatValue(e.field_name, e.old_value)}
            </span>{' '}
            → {formatValue(e.field_name, e.new_value)}
          </Typography>
        </Box>
      ))}
    </Box>
  )
}
