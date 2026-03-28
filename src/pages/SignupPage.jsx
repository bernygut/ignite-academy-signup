import { Box, Container, Typography } from '@mui/material'
import PublicHeader from '../components/layout/PublicHeader'
import SignupForm from '../components/signup/SignupForm'

export default function SignupPage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <PublicHeader />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Apply to Ignite Academy
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Complete the form below to submit your application. Fields marked with * are required.
        </Typography>
        <SignupForm />
      </Container>
    </Box>
  )
}
