import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { AppBar, Box, Button, Chip, IconButton, Toolbar, Tooltip, Typography } from '@mui/material'
import SchoolIcon from '@mui/icons-material/School'
import LogoutIcon from '@mui/icons-material/Logout'
import LockResetIcon from '@mui/icons-material/LockReset'
import PeopleIcon from '@mui/icons-material/People'
import { useAuth } from '../../context/AuthContext'
import { useSnackbar } from '../../context/SnackbarContext'
import ChangePasswordDialog from '../admin/ChangePasswordDialog'
import UserManagementDialog from '../admin/UserManagementDialog'

export default function AdminHeader() {
  const { session, role, signOut } = useAuth()
  const { showSnack } = useSnackbar()
  const navigate = useNavigate()
  const location = useLocation()
  const [changePwOpen, setChangePwOpen]       = useState(false)
  const [instructorsOpen, setInstructorsOpen] = useState(false)

  const isAdmin      = role === 'admin'
  const onAdmin      = location.pathname === '/admin'
  const onAttendance = location.pathname === '/attendance'

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
          {isAdmin ? 'Ignite Academy — Administración' : 'Ignite Academy — Instructores'}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Nav links */}
          {isAdmin && !onAdmin && (
            <Button color="inherit" size="small" onClick={() => navigate('/admin')}>
              Solicitudes
            </Button>
          )}
          {!onAttendance && (
            <Button color="inherit" size="small" onClick={() => navigate('/attendance')}>
              Asistencia
            </Button>
          )}

          {session?.user?.email && (
            <Chip
              label={session.user.email}
              size="small"
              sx={{ bgcolor: 'primary.dark', color: 'white' }}
            />
          )}

          {/* Instructor management — admin only */}
          {isAdmin && (
            <Tooltip title="Gestionar usuarios">
              <IconButton color="inherit" onClick={() => setInstructorsOpen(true)}>
                <PeopleIcon />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title="Cambiar contraseña">
            <IconButton color="inherit" onClick={() => setChangePwOpen(true)}>
              <LockResetIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Cerrar sesión">
            <IconButton color="inherit" onClick={handleLogout}>
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>

      <ChangePasswordDialog open={changePwOpen} onClose={() => setChangePwOpen(false)} />
      <UserManagementDialog open={instructorsOpen} onClose={() => setInstructorsOpen(false)} />
    </AppBar>
  )
}
