import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import supabase from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { useSnackbar } from '../../context/SnackbarContext'

// ─── Enrolled view ────────────────────────────────────────────────────────────

function EnrolledView({ open, onClose }) {
  const { role, refreshMfaLevel } = useAuth()
  const { showSnack } = useSnackbar()
  const [loading, setLoading] = useState(false)
  const isAdmin = role === 'admin'

  async function handleUnenroll() {
    setLoading(true)
    try {
      const { data: { totp } } = await supabase.auth.mfa.listFactors()
      const factor = totp?.find((f) => f.status === 'verified')
      if (factor) {
        const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id })
        if (error) throw error
      }
      await refreshMfaLevel()
      onClose()
    } catch (err) {
      showSnack(err.message || 'Error al desactivar 2FA.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Autenticación de dos factores</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <CheckCircleIcon color="success" />
          <Typography>2FA está activado en tu cuenta.</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {isAdmin
            ? 'La autenticación de dos factores es obligatoria para administradores.'
            : 'Puedes desactivarla si lo deseas, aunque se recomienda mantenerla activa.'}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cerrar</Button>
        {!isAdmin && (
          <Button
            color="error"
            variant="outlined"
            onClick={handleUnenroll}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : null}
          >
            {loading ? 'Desactivando…' : 'Desactivar 2FA'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

// ─── Enroll view ──────────────────────────────────────────────────────────────

async function cleanUnverifiedFactors() {
  const { data: { totp } } = await supabase.auth.mfa.listFactors()
  for (const f of totp ?? []) {
    if (f.status === 'unverified') {
      await supabase.auth.mfa.unenroll({ factorId: f.id })
    }
  }
}

function EnrollView({ open, onClose }) {
  const { refreshMfaLevel } = useAuth()
  const [enrollData, setEnrollData] = useState(null)
  const [code, setCode]             = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [preparing, setPreparing]   = useState(true)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')

  useEffect(() => {
    if (!open) return
    let cancelled = false

    async function start() {
      setPreparing(true)
      setEnrollData(null)
      setCode('')
      setError('')
      setShowSecret(false)
      try {
        await cleanUnverifiedFactors()
        const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
        if (error) throw error
        if (!cancelled) {
          setEnrollData({ factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret })
        }
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setPreparing(false)
      }
    }
    start()
    return () => { cancelled = true }
  }, [open])

  async function handleClose() {
    // Clean up the pending (unverified) factor if the user cancels
    if (enrollData?.factorId) {
      await supabase.auth.mfa.unenroll({ factorId: enrollData.factorId }).catch(() => {})
    }
    onClose()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!enrollData || code.length !== 6) return
    setError('')
    setLoading(true)
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: enrollData.factorId,
        code,
      })
      if (error) throw error
      await refreshMfaLevel()
      onClose()
    } catch {
      setError('Código incorrecto. Verifica que no haya expirado e inténtalo de nuevo.')
      setCode('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Activar autenticación de dos factores</DialogTitle>
      <DialogContent>
        {preparing ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        ) : error && !enrollData ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              1. Descarga Google Authenticator, Authy o Microsoft Authenticator.
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              2. Escanea este código QR:
            </Typography>

            {enrollData?.qrCode && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                <img src={enrollData.qrCode} alt="Código QR para 2FA" width={160} height={160} />
              </Box>
            )}

            <Button
              size="small"
              onClick={() => setShowSecret((v) => !v)}
              sx={{ display: 'block', mx: 'auto', mb: 1 }}
            >
              {showSecret ? 'Ocultar código manual' : '¿No puedes escanear el QR?'}
            </Button>
            {showSecret && enrollData?.secret && (
              <Typography
                variant="caption"
                display="block"
                sx={{
                  fontFamily: 'monospace',
                  bgcolor: 'grey.100',
                  p: 1.5,
                  borderRadius: 1,
                  textAlign: 'center',
                  letterSpacing: 2,
                  mb: 2,
                }}
              >
                {enrollData.secret}
              </Typography>
            )}

            <Typography variant="body2" sx={{ mb: 1 }}>
              3. Ingresa el código de 6 dígitos generado:
            </Typography>
            <Box component="form" id="mfa-enroll-form" onSubmit={handleSubmit} noValidate>
              <TextField
                label="Código de verificación"
                fullWidth
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputProps={{ inputMode: 'numeric', maxLength: 6 }}
                autoComplete="one-time-code"
                sx={{ mt: 0.5 }}
              />
              {error && (
                <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                  {error}
                </Typography>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          type="submit"
          form="mfa-enroll-form"
          variant="contained"
          disabled={loading || code.length !== 6 || preparing}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {loading ? 'Activando…' : 'Activar 2FA'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── Public export ────────────────────────────────────────────────────────────

export default function MfaSetupDialog({ open, onClose }) {
  const { mfaLevel } = useAuth()
  const isEnrolled = mfaLevel.next === 'aal2'

  return isEnrolled
    ? <EnrolledView open={open} onClose={onClose} />
    : <EnrollView   open={open} onClose={onClose} />
}
