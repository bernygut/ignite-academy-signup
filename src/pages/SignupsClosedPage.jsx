import { Box, Card, CardContent, Container, Typography } from '@mui/material'
import SchoolIcon from '@mui/icons-material/School'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'

export default function SignupsClosedPage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: { xs: 4, sm: 8 } }}>
      <Container maxWidth="sm">
        <Card elevation={3}>
          <CardContent sx={{ p: { xs: 4, sm: 6 }, textAlign: 'center' }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
              <SchoolIcon color="primary" sx={{ fontSize: 48 }} />
              <EmojiEventsIcon color="primary" sx={{ fontSize: 48 }} />
            </Box>

            <Typography variant="h4" fontWeight={700} gutterBottom>
              Gracias por tu interés en Ignite Academy
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mt: 3, mb: 2 }}>
              En este momento no estamos recibiendo nuevas solicitudes de
              inscripción.
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Para información sobre futuras oportunidades de capacitación, te
              invitamos a ponerte en contacto con la organización que te invitó
              a participar.
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
              ¡Esperamos verte en una próxima edición!
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}
