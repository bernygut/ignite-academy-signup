import { Box, Button, Checkbox, Chip, FormControl, InputLabel, ListItemText, MenuItem, OutlinedInput, Select, TextField } from '@mui/material'
import ClearIcon from '@mui/icons-material/Clear'
import { useProgrammes } from '../../hooks/useProgrammes'
import { DIVERSITY_GROUP_OPTIONS, NGO_OPTIONS, STATUS_LABELS } from '../../utils/constants'

const MENU_PROPS = {
  PaperProps: { style: { maxHeight: 320 } },
}

export default function FilterBar({ filters, onChange }) {
  const { programmes } = useProgrammes()

  function set(key) {
    return (e) => onChange({ ...filters, [key]: e.target.value })
  }

  function clear() {
    onChange({ status: '', programmeId: '', dateFrom: '', dateTo: '', ngoNames: [], diversityGroups: [] })
  }

  const hasFilters = Object.values(filters).some((v) =>
    Array.isArray(v) ? v.length > 0 : Boolean(v)
  )

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

      <FormControl size="small" sx={{ minWidth: 220, maxWidth: 360 }}>
        <InputLabel>ONG</InputLabel>
        <Select
          multiple
          value={filters.ngoNames ?? []}
          onChange={set('ngoNames')}
          input={<OutlinedInput label="ONG" />}
          renderValue={(selected) =>
            selected.length === 0
              ? 'Todas'
              : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((v) => <Chip key={v} label={v} size="small" />)}
                </Box>
              )
          }
          MenuProps={MENU_PROPS}
        >
          {NGO_OPTIONS.map((n) => (
            <MenuItem key={n} value={n}>
              <Checkbox checked={(filters.ngoNames ?? []).includes(n)} size="small" />
              <ListItemText primary={n} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 220, maxWidth: 360 }}>
        <InputLabel>Grupo de Inclusión</InputLabel>
        <Select
          multiple
          value={filters.diversityGroups ?? []}
          onChange={set('diversityGroups')}
          input={<OutlinedInput label="Grupo de Inclusión" />}
          renderValue={(selected) =>
            selected.length === 0
              ? 'Todos'
              : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((v) => <Chip key={v} label={v} size="small" />)}
                </Box>
              )
          }
          MenuProps={MENU_PROPS}
        >
          {DIVERSITY_GROUP_OPTIONS.map((g) => (
            <MenuItem key={g} value={g}>
              <Checkbox checked={(filters.diversityGroups ?? []).includes(g)} size="small" />
              <ListItemText primary={g} />
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
