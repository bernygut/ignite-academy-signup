import { AppBar, Container, Toolbar, Typography } from '@mui/material'
import SchoolIcon from '@mui/icons-material/School'

export default function PublicHeader() {
  return (
    <AppBar position="static" elevation={0}>
      <Container maxWidth="md">
        <Toolbar disableGutters>
          <SchoolIcon sx={{ mr: 1.5 }} />
          <Typography variant="h6" component="div" fontWeight={700}>
            Ignite Academy
          </Typography>
        </Toolbar>
      </Container>
    </AppBar>
  )
}
