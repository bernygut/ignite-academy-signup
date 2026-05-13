import { Box, Button, Checkbox, Chip, FormControl, InputLabel, ListItemText, MenuItem, OutlinedInput, Select, TextField } from '@mui/material'
import ClearIcon from '@mui/icons-material/Clear'
import { useProgrammes } from '../../hooks/useProgrammes'
import { DIVERSITY_GROUP_OPTIONS, NGO_OPTIONS, STATUS_LABELS } from '../../utils/constants'

const MENU_PROPS = {
  PaperProps: { style: { maxHeight: 320 } },
}

function MultiSelect({ label, value, options, onChange, getLabel, emptyText }) {
  const selected = value ?? []
  return (
    <FormControl size="small" sx={{ minWidth: 200, maxWidth: 360 }}>
      <InputLabel>{label}</InputLabel>
      <Select
        multiple
        value={selected}
        onChange={onChange}
        input={<OutlinedInput label={label} />}
        renderValue={(sel) =>
          sel.length === 0
            ? emptyText
            : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {sel.map((v) => (
                  <Chip key={v} label={getLabel ? getLabel(v) : v} size="small" />
                ))}
              </Box>
            )
        }
        MenuProps={MENU_PROPS}
      >
        {options.map((opt) => {
          const val   = typeof opt === 'string' ? opt : opt.value
          const label = typeof opt === 'string' ? opt : opt.label
          return (
            <MenuItem key={val} value={val}>
              <Checkbox checked={selected.includes(val)} size="small" />
              <ListItemText primary={label} />
            </MenuItem>
          )
        })}
      </Select>
    </FormControl>
  )
}

export default function FilterBar({ filters, onChange }) {
  const { programmes } = useProgrammes()

  function set(key) {
    return (e) => onChange({ ...filters, [key]: e.target.value })
  }

  function clear() {
    onChange({ statuses: [], programmeIds: [], dateFrom: '', dateTo: '', ngoNames: [], diversityGroups: [] })
  }

  const hasFilters = Object.values(filters).some((v) =>
    Array.isArray(v) ? v.length > 0 : Boolean(v)
  )

  const statusOptions    = Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))
  const programmeOptions = programmes.map((p) => ({
    value: p.id,
    label: `${p.name}${p.cohort ? ` – ${p.cohort}` : ''}`,
  }))

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2, alignItems: 'center' }}>
      <MultiSelect
        label="Estado"
        value={filters.statuses}
        options={statusOptions}
        onChange={set('statuses')}
        getLabel={(v) => STATUS_LABELS[v] ?? v}
        emptyText="Todos"
      />

      <MultiSelect
        label="Programa"
        value={filters.programmeIds}
        options={programmeOptions}
        onChange={set('programmeIds')}
        getLabel={(v) => programmes.find((p) => p.id === v)?.name ?? v}
        emptyText="Todos"
      />

      <MultiSelect
        label="ONG"
        value={filters.ngoNames}
        options={NGO_OPTIONS}
        onChange={set('ngoNames')}
        emptyText="Todas"
      />

      <MultiSelect
        label="Grupo de Inclusión"
        value={filters.diversityGroups}
        options={DIVERSITY_GROUP_OPTIONS}
        onChange={set('diversityGroups')}
        emptyText="Todos"
      />

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
