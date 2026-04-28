import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
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
import SchoolIcon from '@mui/icons-material/School'
import supabase from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

const RULES = [
  { label: 'Mínimo 12 caracteres',               test: (p) => p.length >= 12 },
  { label: 'Al menos una letra mayúscula (A–Z)',  test: (p) => /[A-Z]/.test(p) },
  { label: 'Al menos una letra minúscula (a–z)',  test: (p) => /[a-z]/.test(p) },
  { label: 'Al menos un número (0–9)',            test: (p) => /[0-9]/.test(p) },
  { label: 'Al menos un carácter especial',       test: (p) => /[^A-Za-z0-9]/.test(p) },
]

function passes(password) {
  return RULES.every((r) => r.test(password))
}

export default function SetPasswordPage() {
  const { clearInviteState } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const allPassed = passes(password)
  const mismatch  = confirm.length > 0 && password !== confirm

  async function handleSubmit(e) {
    e.preventDefault()
    if (!allPassed || mismatch) return
    setError('')
    setLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError

      // Fetch the real role from the database — the context has 'instructor'
      // set optimistically for all invite flows, so we can't rely on it here.
      const { data: { session } } = await supabase.auth.getSession()
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      clearInviteState()
      navigate(profile?.role === 'admin' ? '/admin' : '/attendance', { replace: true })
    } catch (err) {
      setError(err.message || 'Error al establecer la contraseña.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Card elevation={3} sx={{ width: '100%', maxWidth: 420 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <SchoolIcon color="primary" sx={{ fontSize: 48 }} />
            <Typography variant="h5" fontWeight={700}>
              Establece tu contraseña
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Bienvenido a Ignite Academy. Crea una contraseña segura para tu cuenta de instructor.
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              label="Nueva contraseña"
              type={showPw ? 'text' : 'password'}
              fullWidth
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 1 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPw((v) => !v)} edge="end" size="small">
                      {showPw ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <List dense disablePadding sx={{ mb: 2 }}>
              {RULES.map((rule) => {
                const ok = rule.test(password)
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
                      primaryTypographyProps={{
                        variant: 'caption',
                        color: ok ? 'success.main' : 'text.secondary',
                      }}
                    />
                  </ListItem>
                )
              })}
            </List>

            <TextField
              label="Confirmar contraseña"
              type="password"
              fullWidth
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              error={mismatch}
              helperText={mismatch ? 'Las contraseñas no coinciden.' : ''}
              sx={{ mb: 2 }}
            />

            {error && (
              <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                {error}
              </Typography>
            )}

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading || !allPassed || mismatch || !confirm}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
            >
              {loading ? 'Guardando…' : 'Establecer contraseña'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
