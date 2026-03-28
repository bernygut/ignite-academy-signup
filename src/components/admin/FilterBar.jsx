import { Box, Button, FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material'
import ClearIcon from '@mui/icons-material/Clear'
import { useProgrammes } from '../../hooks/useProgrammes'
import { STATUS_LABELS } from '../../utils/constants'

export default function FilterBar({ filters, onChange }) {
  const { programmes } = useProgrammes()

  function set(key) {
    return (e) => onChange({ ...filters, [key]: e.target.value })
  }

  function clear() {
    onChange({ status: '', programmeId: '', dateFrom: '', dateTo: '' })
  }

  const hasFilters = Object.values(filters).some(Boolean)

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2, alignItems: 'center' }}>
      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel>Estado</InputLabel>
        <Select value={filters.status} label="Estado" onChange={set('status')}>
          <MenuItem value=""><em>Todos</em></MenuItem>
          {Object.entries(STATUS_LABELS).map(([val, label]) => (
            <MenuItem key={val} value={val}>{label}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel>Programa</InputLabel>
        <Select value={filters.programmeId} label="Programa" onChange={set('programmeId')}>
          <MenuItem value=""><em>Todos</em></MenuItem>
          {programmes.map((p) => (
            <MenuItem key={p.id} value={p.id}>
              {p.name}{p.cohort ? ` – ${p.cohort}` : ''}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        label="Desde"
        type="date"
        size="small"
        value={filters.dateFrom}
        onChange={set('dateFrom')}
        InputLabelProps={{ shrink: true }}
        sx={{ minWidth: 160 }}
      />

      <TextField
        label="Hasta"
        type="date"
        size="small"
        value={filters.dateTo}
        onChange={set('dateTo')}
        InputLabelProps={{ shrink: true }}
        sx={{ minWidth: 160 }}
      />

      {hasFilters && (
        <Button size="small" startIcon={<ClearIcon />} onClick={clear}>
          Limpiar filtros
        </Button>
      )}
    </Box>
  )
}
