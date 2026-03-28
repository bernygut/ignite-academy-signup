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
      showSnack('Logout failed. Please try again.', 'error')
    }
  }

  return (
    <AppBar position="static" elevation={0}>
      <Toolbar>
        <SchoolIcon sx={{ mr: 1.5 }} />
        <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
          Ignite Academy — Admin
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {session?.user?.email && (
            <Chip
              label={session.user.email}
              size="small"
              sx={{ bgcolor: 'primary.dark', color: 'white' }}
            />
          )}
          <Tooltip title="Logout">
            <IconButton color="inherit" onClick={handleLogout}>
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  )
}
