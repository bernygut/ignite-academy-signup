import { AppBar, Box, Chip, IconButton, Toolbar, Tooltip, Typography } from '@mui/material'
import SchoolIcon from '@mui/icons-material/School'
import LogoutIcon from '@mui/icons-material/Logout'
import { useAuth } from '../../context/AuthContext'
import { useSnackbar } from '../../context/SnackbarContext'

export default function AdminHeader() {
  const { session, signOut } = useAuth()
  const { showSnack } = useSnackbar()

  async function handleLogout() {
    try {
      await signOut()
    } catch {
      showSnack('Error al cerrar sesión. Inténtalo de nuevo.', 'error')
    }
  }

  return (
    <AppBar position="static" elevation={0}>
      <Toolbar>
        <SchoolIcon sx={{ mr: 1.5 }} />
        <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
          Ignite Academy — Administración
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {session?.user?.email && (
            <Chip
              label={session.user.email}
              size="small"
              sx={{ bgcolor: 'primary.dark', color: 'white' }}
            />
          )}
          <Tooltip title="Cerrar sesión">
            <IconButton color="inherit" onClick={handleLogout}>
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  )
}
