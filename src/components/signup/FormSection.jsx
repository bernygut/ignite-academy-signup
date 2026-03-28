import { Paper, Typography, Box } from '@mui/material'

export default function FormSection({ title, children }) {
  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 2, color: 'primary.main' }}>
        {title}
      </Typography>
      <Box>{children}</Box>
    </Paper>
  )
}
