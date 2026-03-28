import { Box, Button, Paper, Typography } from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'

export default function SuccessScreen({ fullName, email, applicationId, onReset }) {
  return (
    <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
      <CheckCircleOutlineIcon sx={{ fontSize: 72, color: 'success.main', mb: 2 }} />
      <Typography variant="h5" gutterBottom>
        ¡Gracias, {fullName}!
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
        Tu solicitud ha sido recibida.
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Se ha enviado un correo de confirmación a <strong>{email}</strong>.
      </Typography>
      <Box
        sx={{
          display: 'inline-block',
          bgcolor: 'grey.100',
          borderRadius: 1,
          px: 2,
          py: 1,
          mb: 3,
        }}
      >
        <Typography variant="caption" color="text.secondary" display="block">
          Número de referencia
        </Typography>
        <Typography variant="body2" fontFamily="monospace">
          {applicationId}
        </Typography>
      </Box>
      <Box>
        <Button variant="outlined" onClick={onReset}>
          Enviar otra solicitud
        </Button>
      </Box>
    </Paper>
  )
}
