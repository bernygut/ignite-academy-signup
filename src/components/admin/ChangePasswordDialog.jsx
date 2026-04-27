import { useState } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import supabase from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { useSnackbar } from '../../context/SnackbarContext'

const RULES = [
  { label: 'Mínimo 12 caracteres',              test: (p) => p.length >= 12 },
  { label: 'Al menos una letra mayúscula (A–Z)', test: (p) => /[A-Z]/.test(p) },
  { label: 'Al menos una letra minúscula (a–z)', test: (p) => /[a-z]/.test(p) },
  { label: 'Al menos un número (0–9)',           test: (p) => /[0-9]/.test(p) },
  { label: 'Al menos un carácter especial',      test: (p) => /[^A-Za-z0-9]/.test(p) },
]

function passes(password) {
  return RULES.every((r) => r.test(password))
}

export default function ChangePasswordDialog({ open, onClose }) {
  const { session, signIn } = useAuth()
  const { showSnack } = useSnackbar()

  const [current, setCurrent]         = useState('')
  const [next, setNext]               = useState('')
  const [confirm, setConfirm]         = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNext, setShowNext]       = useState(false)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')

  function handleClose() {
    setCurrent('')
    setNext('')
    setConfirm('')
    setError('')
    onClose()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!passes(next)) {
      setError('La nueva contraseña no cumple con los requisitos de seguridad.')
      return
    }
    if (next !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    try {
      // Re-authenticate to verify the current password
      await signIn(session.user.email, current)

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({ password: next })
      if (updateError) throw updateError

      showSnack('Contraseña actualizada correctamente.', 'success')
      handleClose()
    } catch (err) {
      setError(err.message?.includes('Invalid login')
        ? 'La contraseña actual es incorrecta.'
        : err.message || 'Error al cambiar la contraseña.')
    } finally {
      setLoading(false)
    }
  }

  const allPassed = passes(next)
  const mismatch  = confirm.length > 0 && next !== confirm

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Cambiar Contraseña</DialogTitle>
      <DialogContent>
        <Box component="form" id="change-pw-form" onSubmit={handleSubmit} noValidate sx={{ pt: 1 }}>
          <TextField
            label="Contraseña actual"
            type={showCurrent ? 'text' : 'password'}
            fullWidth
            required
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowCurrent((v) => !v)} edge="end" size="small">
                    {showCurrent ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="Nueva contraseña"
            type={showNext ? 'text' : 'password'}
            fullWidth
            required
            value={next}
            onChange={(e) => setNext(e.target.value)}
            sx={{ mb: 1 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowNext((v) => !v)} edge="end" size="small">
                    {showNext ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <List dense disablePadding sx={{ mb: 2 }}>
            {RULES.map((rule) => {
              const ok = rule.test(next)
              return (
                <ListItem key={rule.label} disableGutters sx={{ py: 0 }}>
                  <ListItemIcon sx={{ minWidth: 28 }}>
                    {ok
                      ? <CheckCircleIcon fontSize="small" color="success" />
                      : <RadioButtonUncheckedIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                    }
                  </ListItemIcon>
                  <ListItemText
                    primary={rule.label}
                    primaryTypographyProps={{ variant: 'caption', color: ok ? 'success.main' : 'text.secondary' }}
                  />
                </ListItem>
              )
            })}
          </List>

          <TextField
            label="Confirmar nueva contraseña"
            type="password"
            fullWidth
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            error={mismatch}
            helperText={mismatch ? 'Las contraseñas no coinciden.' : ''}
            sx={{ mb: 1 }}
          />

          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading}>Cancelar</Button>
        <Button
          type="submit"
          form="change-pw-form"
          variant="contained"
          disabled={loading || !allPassed || mismatch || !current}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {loading ? 'Guardando…' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
