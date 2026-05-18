import {
  Box,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'

export default function RecipientsList({ recipients, selectedIds, onToggle, onToggleAll, loading }) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (recipients.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">
          No hay participantes aprobados que coincidan con el filtro.
        </Typography>
      </Paper>
    )
  }

  const allChecked  = selectedIds.size === recipients.length
  const someChecked = selectedIds.size > 0 && !allChecked

  return (
    <Paper variant="outlined">
      <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={allChecked}
              indeterminate={someChecked}
              onChange={(e) => onToggleAll(e.target.checked)}
            />
          }
          label={
            <Typography variant="body2">
              {selectedIds.size} de {recipients.length} seleccionados
            </Typography>
          }
        />
      </Box>
      <TableContainer sx={{ maxHeight: 360 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" />
              <TableCell><strong>Nombre</strong></TableCell>
              <TableCell><strong>Correo</strong></TableCell>
              <TableCell><strong>Programa</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {recipients.map((r) => {
              const checked = selectedIds.has(r.application_id)
              return (
                <TableRow key={r.application_id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={checked}
                      onChange={() => onToggle(r.application_id)}
                    />
                  </TableCell>
                  <TableCell>{r.full_name}</TableCell>
                  <TableCell>{r.email}</TableCell>
                  <TableCell>
                    {r.programme_name ? <Chip label={r.programme_name} size="small" /> : '—'}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  )
}
