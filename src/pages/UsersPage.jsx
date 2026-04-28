import { useCallback, useEffect, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import AdminHeader from '../components/layout/AdminHeader'
import UserManagementDialog from '../components/admin/UserManagementDialog'
import { useAuth } from '../context/AuthContext'
import { useSnackbar } from '../context/SnackbarContext'
import { deleteUser, fetchUsers } from '../services/userService'

function ConfirmDeleteDialog({ user, onConfirm, onCancel, loading }) {
  return (
    <Dialog open={!!user} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>Eliminar usuario</DialogTitle>
      <DialogContent>
        <DialogContentText>
          ¿Seguro que deseas eliminar a{' '}
          <strong>{user?.full_name || user?.email}</strong>? Esta acción no se
          puede deshacer.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button
          color="error"
          variant="contained"
          onClick={onConfirm}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {loading ? 'Eliminando…' : 'Eliminar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default function UsersPage() {
  const { session } = useAuth()
  const { showSnack } = useSnackbar()
  const currentUserId = session?.user?.id

  const [users, setUsers]               = useState([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [inviteOpen, setInviteOpen]     = useState(false)
  const [toDelete, setToDelete]         = useState(null)
  const [deleting, setDeleting]         = useState(false)

  const load = useCallback(async () => {
    setLoadingUsers(true)
    try {
      setUsers(await fetchUsers())
    } catch (err) {
      showSnack(err.message || 'Error al cargar usuarios.', 'error')
    } finally {
      setLoadingUsers(false)
    }
  }, [showSnack])

  useEffect(() => { load() }, [load])

  async function handleDelete() {
    if (!toDelete) return
    setDeleting(true)
    try {
      await deleteUser(toDelete.id)
      showSnack('Usuario eliminado.', 'success')
      setToDelete(null)
      await load()
    } catch (err) {
      showSnack(err.message || 'Error al eliminar el usuario.', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AdminHeader />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight={700}>
            Gestión de usuarios
          </Typography>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => setInviteOpen(true)}
          >
            Invitar usuario
          </Button>
        </Box>

        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Nombre</strong></TableCell>
                <TableCell><strong>Correo electrónico</strong></TableCell>
                <TableCell><strong>Rol</strong></TableCell>
                <TableCell><strong>Fecha de registro</strong></TableCell>
                <TableCell align="center"><strong>Eliminar</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loadingUsers ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No hay usuarios registrados.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id} hover>
                    <TableCell>{u.full_name || '—'}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={u.role === 'admin' ? 'Administrador' : 'Instructor'}
                        color={u.role === 'admin' ? 'primary' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(u.created_at).toLocaleDateString('es-CR', {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={u.id === currentUserId ? 'No puedes eliminar tu propia cuenta' : 'Eliminar usuario'}>
                        <span>
                          <IconButton
                            color="error"
                            size="small"
                            disabled={u.id === currentUserId}
                            onClick={() => setToDelete(u)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>

      <UserManagementDialog
        open={inviteOpen}
        onClose={() => { setInviteOpen(false); load() }}
      />

      <ConfirmDeleteDialog
        user={toDelete}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
        loading={deleting}
      />
    </Box>
  )
}
