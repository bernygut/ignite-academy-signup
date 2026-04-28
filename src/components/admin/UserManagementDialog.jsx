import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import { fetchUsers, inviteUser } from '../../services/userService'
import { useSnackbar } from '../../context/SnackbarContext'

const ROLE_LABELS = { admin: 'Administrador', instructor: 'Instructor' }
const ROLE_COLORS = { admin: 'primary',       instructor: 'secondary'   }

export default function UserManagementDialog({ open, onClose }) {
  const { showSnack } = useSnackbar()
  const [users, setUsers]         = useState([])
  const [listLoading, setListLoading] = useState(false)
  const [fullName, setFullName]   = useState('')
  const [email, setEmail]         = useState('')
  const [role, setRole]           = useState('instructor')
  const [inviting, setInviting]   = useState(false)
  const [inviteError, setInviteError] = useState('')

  useEffect(() => {
    if (!open) return
    setListLoading(true)
    fetchUsers()
      .then(setUsers)
      .catch((err) => showSnack(err.message, 'error'))
      .finally(() => setListLoading(false))
  }, [open, showSnack])

  async function handleInvite(e) {
    e.preventDefault()
    setInviteError('')
    setInviting(true)
    try {
      await inviteUser({ email, fullName, role })
      showSnack(`Invitación enviada a ${email}.`, 'success')
      setFullName('')
      setEmail('')
      setRole('instructor')
      const updated = await fetchUsers()
      setUsers(updated)
    } catch (err) {
      setInviteError(err.message || 'Error al enviar la invitación.')
    } finally {
      setInviting(false)
    }
  }

  function handleClose() {
    setFullName('')
    setEmail('')
    setRole('instructor')
    setInviteError('')
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Gestionar Usuarios</DialogTitle>

      <DialogContent>
        <Typography variant="subtitle2" gutterBottom>
          Usuarios activos
        </Typography>

        {listLoading ? (
          <CircularProgress size={20} />
        ) : users.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No hay usuarios registrados aún.
          </Typography>
        ) : (
          <List dense disablePadding>
            {users.map((u) => (
              <ListItem key={u.id} disableGutters>
                <ListItemText
                  primary={u.full_name || u.email}
                  secondary={u.full_name ? u.email : null}
                />
                <ListItemSecondaryAction>
                  <Chip
                    label={ROLE_LABELS[u.role] ?? u.role}
                    color={ROLE_COLORS[u.role] ?? 'default'}
                    size="small"
                    variant="outlined"
                  />
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" gutterBottom>
          Invitar nuevo usuario
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          El usuario recibirá un correo con un enlace para establecer su contraseña.
        </Typography>

        <Box component="form" id="invite-form" onSubmit={handleInvite} noValidate>
          <TextField
            label="Nombre completo"
            fullWidth
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Correo electrónico"
            type="email"
            fullWidth
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth>
            <InputLabel>Rol</InputLabel>
            <Select
              value={role}
              label="Rol"
              onChange={(e) => setRole(e.target.value)}
            >
              <MenuItem value="instructor">Instructor</MenuItem>
              <MenuItem value="admin">Administrador</MenuItem>
            </Select>
          </FormControl>

          {inviteError && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {inviteError}
            </Typography>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={inviting}>
          Cerrar
        </Button>
        <Button
          type="submit"
          form="invite-form"
          variant="contained"
          disabled={inviting || !email}
          startIcon={
            inviting
              ? <CircularProgress size={16} color="inherit" />
              : <PersonAddIcon />
          }
        >
          {inviting ? 'Enviando…' : 'Enviar invitación'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
