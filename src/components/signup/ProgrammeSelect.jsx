import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Skeleton,
} from '@mui/material'
import { useProgrammes } from '../../hooks/useProgrammes'

export default function ProgrammeSelect({ value, onChange, error, helperText }) {
  const { programmes, loading } = useProgrammes()

  if (loading) {
    return <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
  }

  return (
    <FormControl fullWidth error={Boolean(error)}>
      <InputLabel id="programme-label">Programme *</InputLabel>
      <Select
        labelId="programme-label"
        value={value}
        label="Programme *"
        onChange={(e) => onChange(e.target.value)}
      >
        {programmes.map((p) => (
          <MenuItem key={p.id} value={p.id}>
            {p.name}{p.cohort ? ` – ${p.cohort}` : ''}
          </MenuItem>
        ))}
      </Select>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  )
}
