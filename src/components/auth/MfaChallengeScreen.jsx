import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  TextField,
  Typography,
} from '@mui/material'
import PhonelinkLockIcon from '@mui/icons-material/PhonelinkLock'
import supabase from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'

async function getVerifiedTotpFactor() {
  const { data: { totp } } = await supabase.auth.mfa.listFactors()
  return totp?.find((f) => f.status === 'verified') ?? null
}

export default function MfaChallengeScreen({ onSuccess }) {
  const { signOut } = useAuth()
  const [challengeData, setChallengeData] = useState(null) // { factorId, challengeId }
  const [code, setCode]       = useState('')
  const [preparing, setPreparing] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function createChallenge() {
    const factor = await getVerifiedTotpFactor()
    if (!factor) throw new Error('No se encontró un factor de autenticación activo.')
    const { data, error } = await supabase.auth.mfa.challenge({ factorId: factor.id })
    if (error) throw error
    return { factorId: factor.id, challengeId: data.id }
  }

  useEffect(() => {
    createChallenge()
      .then(setChallengeData)
      .catch((err) => setError(err.message))
      .finally(() => setPreparing(false))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!challengeData || code.length !== 6) return
    setError('')
    setLoading(true)
    try {
      const { error } = await supabase.auth.mfa.verify({
        factorId:    challengeData.factorId,
        challengeId: challengeData.challengeId,
        code,
      })
      if (error) throw error
      onSuccess()
    } catch {
      setError('Código incorrecto. Verifica tu aplicación e inténtalo de nuevo.')
      setCode('')
      // Refresh challenge so the user can retry without reloading
      createChallenge()
        .then(setChallengeData)
        .catch(() => {})
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
      <Card elevation={3} sx={{ width: '100%', maxWidth: 380 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <PhonelinkLockIcon color="primary" sx={{ fontSize: 48 }} />
            <Typography variant="h5" fontWeight={700}>
              Verificación en dos pasos
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ingresa el código de 6 dígitos de tu aplicación de autenticación.
            </Typography>
          </Box>

          {preparing ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                label="Código de verificación"
                fullWidth
                required
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputProps={{ inputMode: 'numeric', maxLength: 6 }}
                autoComplete="one-time-code"
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
                disabled={loading || code.length !== 6}
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
                sx={{ mb: 1 }}
              >
                {loading ? 'Verificando…' : 'Verificar'}
              </Button>
              <Button fullWidth color="inherit" onClick={signOut} disabled={loading}>
                Cerrar sesión
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
