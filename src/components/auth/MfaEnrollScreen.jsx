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
import SecurityIcon from '@mui/icons-material/Security'
import supabase from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'

async function cleanUnverifiedFactors() {
  const { data: { totp } } = await supabase.auth.mfa.listFactors()
  for (const f of totp ?? []) {
    if (f.status === 'unverified') {
      await supabase.auth.mfa.unenroll({ factorId: f.id })
    }
  }
}

export default function MfaEnrollScreen({ onSuccess, mandatory }) {
  const { signOut } = useAuth()
  const [enrollData, setEnrollData] = useState(null) // { factorId, qrCode, secret }
  const [code, setCode]             = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [preparing, setPreparing]   = useState(true)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')

  useEffect(() => {
    async function start() {
      try {
        await cleanUnverifiedFactors()
        const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
        if (error) throw error
        setEnrollData({
          factorId: data.id,
          qrCode:   data.totp.qr_code,
          secret:   data.totp.secret,
        })
      } catch (err) {
        setError(err.message)
      } finally {
        setPreparing(false)
      }
    }
    start()
  }, [])

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
      onSuccess()
    } catch {
      setError('Código incorrecto. Verifica que el código no haya expirado e inténtalo de nuevo.')
      setCode('')
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
      <Card elevation={3} sx={{ width: '100%', maxWidth: 440 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <SecurityIcon color="primary" sx={{ fontSize: 48 }} />
            <Typography variant="h5" fontWeight={700}>
              Autenticación de dos factores
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {mandatory
                ? 'Los administradores deben activar 2FA para acceder al portal.'
                : 'Agrega una capa adicional de seguridad a tu cuenta.'}
            </Typography>
          </Box>

          {preparing ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress />
            </Box>
          ) : error && !enrollData ? (
            <Typography color="error">{error}</Typography>
          ) : (
            <>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                1. Descarga Google Authenticator, Authy o Microsoft Authenticator.
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                2. Escanea este código QR con la aplicación:
              </Typography>

              {enrollData?.qrCode && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                  <img src={enrollData.qrCode} alt="Código QR para 2FA" width={180} height={180} />
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

              <Box component="form" onSubmit={handleSubmit} noValidate>
                <TextField
                  label="Código de verificación"
                  fullWidth
                  required
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
                  {loading ? 'Activando…' : 'Activar 2FA'}
                </Button>
                {mandatory && (
                  <Button fullWidth color="inherit" onClick={signOut} disabled={loading}>
                    Cerrar sesión
                  </Button>
                )}
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
