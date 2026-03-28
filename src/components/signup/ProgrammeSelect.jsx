import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material'

const PROGRAMMES = [
  { id: 'a0000000-0000-0000-0000-000000000001', name: 'AI-900' },
  { id: 'a0000000-0000-0000-0000-000000000002', name: 'Az-900' },
  { id: 'a0000000-0000-0000-0000-000000000003', name: 'SC-900' },
]

export default function ProgrammeSelect({ value, onChange, error, helperText }) {
  return (
    <FormControl fullWidth error={Boolean(error)}>
      <InputLabel id="programme-label">Programa *</InputLabel>
      <Select
        labelId="programme-label"
        value={value}
        label="Programa *"
        onChange={(e) => onChange(e.target.value)}
      >
        {PROGRAMMES.map((p) => (
          <MenuItem key={p.id} value={p.id}>
            {p.name}
          </MenuItem>
        ))}
      </Select>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  )
}
