import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material'

const PROGRAMMES = ['AI-900', 'Az-900', 'SC-900']

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
        {PROGRAMMES.map((name) => (
          <MenuItem key={name} value={name}>
            {name}
          </MenuItem>
        ))}
      </Select>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  )
}
