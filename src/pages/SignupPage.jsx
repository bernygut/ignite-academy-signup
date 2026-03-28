import { Box, Container, Typography } from '@mui/material'
import PublicHeader from '../components/layout/PublicHeader'
import SignupForm from '../components/signup/SignupForm'

export default function SignupPage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <PublicHeader />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Aplicar a Ignite Academy
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Completa el formulario para enviar tu solicitud. Los campos marcados con * son obligatorios.
        </Typography>
        <SignupForm />
      </Container>
    </Box>
  )
}
