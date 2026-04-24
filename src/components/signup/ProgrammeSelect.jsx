import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Skeleton,
  Typography,
} from '@mui/material'
import { useProgrammes } from '../../hooks/useProgrammes'

export default function ProgrammeSelect({ value, onChange, error, helperText }) {
  const { programmes, loading } = useProgrammes()

  if (loading) {
    return <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
  }

  return (
    <FormControl fullWidth error={Boolean(error)}>
      <InputLabel id="programme-label">Programa *</InputLabel>
      <Select
        labelId="programme-label"
        value={value}
        label="Programa *"
        onChange={() => {}}
      >
        {programmes.map((p) => (
          <MenuItem key={p.id} value={p.id} disabled={p.available <= 0}
            onClick={() => onChange(p.id, p.name)}
          >
            <span style={{ flexGrow: 1 }}>{p.name}</span>
            <Typography
              variant="caption"
              sx={{ ml: 2, color: p.available <= 0 ? 'error.main' : p.available <= 5 ? 'warning.main' : 'text.secondary' }}
            >
              {p.available <= 0 ? 'Lleno' : `${p.available} espacios disponibles`}
            </Typography>
          </MenuItem>
        ))}
      </Select>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  )
}
