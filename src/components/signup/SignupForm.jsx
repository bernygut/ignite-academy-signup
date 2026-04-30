import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  FormHelperText,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material'
import FormSection from './FormSection'
import ProgrammeSelect from './ProgrammeSelect'
import SuccessScreen from './SuccessScreen'
import { checkEmailExists, createApplication } from '../../services/applicationService'
import { sendConfirmationEmail } from '../../services/emailService'
import { DIVERSITY_GROUP_OPTIONS } from '../../utils/constants'
import { useSnackbar } from '../../context/SnackbarContext'

const INITIAL_FORM = {
  full_name: '',
  email: '',
  educational_email: '',
  age: '',
  diversity_group: '',
  ngo_name: '',
  programme_id: '',
  programme_name: '',
}

function validate(form) {
  const errors = {}
  if (!form.full_name.trim()) errors.full_name = 'El nombre completo es requerido'
  if (!form.email.trim()) {
    errors.email = 'El correo de contacto es requerido'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Ingresa un correo de contacto válido'
  }
  if (form.educational_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.educational_email)) {
    errors.educational_email = 'Ingresa un correo educativo válido'
  }
  if (!form.age) {
    errors.age = 'La edad es requerida'
  } else if (isNaN(Number(form.age)) || Number(form.age) < 1 || Number(form.age) > 119) {
    errors.age = 'Ingresa una edad válida (1–119)'
  }
  if (!form.ngo_name?.trim()) errors.ngo_name = 'La ONG es requerida'
  if (!form.diversity_group) errors.diversity_group = 'Por favor selecciona un grupo'
  if (!form.programme_id) errors.programme_id = 'Por favor selecciona un programa'
  return errors
}

export default function SignupForm() {
  const { showSnack } = useSnackbar()
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(null) // { id, full_name, email }
  const [acknowledged, setAcknowledged] = useState(false)
  const [ackError, setAckError] = useState(false)

  function handleChange(field) {
    return (e) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const validationErrors = validate(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    if (!acknowledged) {
      setAckError(true)
      return
    }

    setSubmitting(true)
    try {
      const alreadyRegistered = await checkEmailExists(form.email)
      if (alreadyRegistered) {
        setErrors({ email: 'Este correo ya tiene una solicitud registrada.' })
        setSubmitting(false)
        return
      }

      const { programme_name, ...formData } = form
      const payload = {
        ...formData,
        age: form.age ? Number(form.age) : null,
        ngo_name: form.ngo_name || null,
        educational_email: form.educational_email || null,
      }

      const row = await createApplication(payload)

      // Fire-and-forget email — don't block success screen if it fails
      sendConfirmationEmail({
        toEmail: form.email,
        educationalEmail: form.educational_email || null,
        fullName: form.full_name,
        programmeName: form.programme_name,
        applicationId: row.id,
        age: form.age || null,
        ngoName: form.ngo_name || null,
        diversityGroup: form.diversity_group || null,
      }).catch((err) => {
        console.warn('Confirmation email failed (non-blocking):', err.message)
      })

      setSubmitted({ id: row.id, full_name: form.full_name, email: form.email, diversity_group: form.diversity_group })
    } catch (err) {
      showSnack(err.message || 'Error al enviar. Inténtalo de nuevo.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <SuccessScreen
        fullName={submitted.full_name}
        email={submitted.email}
        applicationId={submitted.id}
        diversityGroup={submitted.diversity_group}
        onReset={() => {
          setSubmitted(null)
          setForm(INITIAL_FORM)
          setErrors({})
        }}
      />
    )
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <FormSection title="Sobre Ti">
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Nombre Completo *"
              fullWidth
              value={form.full_name}
              onChange={handleChange('full_name')}
              error={Boolean(errors.full_name)}
              helperText={errors.full_name}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Correo de Contacto *"
              type="email"
              fullWidth
              value={form.email}
              onChange={handleChange('email')}
              error={Boolean(errors.email)}
              helperText={errors.email}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Correo Electrónico Educativo"
              type="email"
              fullWidth
              value={form.educational_email}
              onChange={handleChange('educational_email')}
              error={Boolean(errors.educational_email)}
              helperText={errors.educational_email}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Edad *"
              type="number"
              fullWidth
              value={form.age}
              onChange={handleChange('age')}
              error={Boolean(errors.age)}
              helperText={errors.age}
              inputProps={{ min: 1, max: 119 }}
            />
          </Grid>
        </Grid>
      </FormSection>

      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        <Box sx={{ flex: 1, minWidth: 240 }}>
          <FormSection title="Grupo Patrocinador *">
            <TextField
              select
              fullWidth
              value={form.diversity_group}
              onChange={handleChange('diversity_group')}
              error={Boolean(errors.diversity_group)}
              helperText={errors.diversity_group}
            >
              <MenuItem value=""><em>Selecciona un grupo</em></MenuItem>
              {DIVERSITY_GROUP_OPTIONS.map((g) => (
                <MenuItem key={g} value={g}>{g}</MenuItem>
              ))}
            </TextField>
          </FormSection>
        </Box>
        <Box sx={{ flex: 1, minWidth: 240 }}>
          <FormSection title="Detalles de la Organización (ONG)">
            <TextField
              label="ONG que te contó de los cursos *"
              fullWidth
              value={form.ngo_name}
              onChange={handleChange('ngo_name')}
              error={Boolean(errors.ngo_name)}
              helperText={errors.ngo_name}
            />
          </FormSection>
        </Box>
      </Box>

      <FormSection title="Selección de Programa">
        <ProgrammeSelect
          value={form.programme_id}
          onChange={(id, name) => {
            setForm((prev) => ({ ...prev, programme_id: id, programme_name: name }))
            if (errors.programme_id) setErrors((prev) => ({ ...prev, programme_id: undefined }))
          }}
          error={errors.programme_id}
          helperText={errors.programme_id}
        />
      </FormSection>

      <Box sx={{ mt: 3, mb: 1 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={acknowledged}
              onChange={(e) => {
                setAcknowledged(e.target.checked)
                if (e.target.checked) setAckError(false)
              }}
              color="primary"
            />
          }
          label={
            <Typography variant="body2">
              Entiendo que al enviar esta solicitud me comprometo a participar en un curso de aproximadamente
              10 semanas los sábados del 23 de mayo al 1 de agosto de 2026 de 9:00 a.m. a 12:00 p.m. con una asistencia superior al 90%, y acepto que mis datos personales serán
              tratados conforme a la{' '}
              <Link to="/privacy" target="_blank" rel="noopener noreferrer">
                Política de Privacidad
              </Link>{' '}
              de Ignite Academy. *
            </Typography>
          }
          sx={{ alignItems: 'flex-start', '& .MuiCheckbox-root': { pt: 0.5 } }}
        />
        {ackError && (
          <FormHelperText error sx={{ ml: 4 }}>
            Debes aceptar los términos antes de enviar tu solicitud.
          </FormHelperText>
        )}
      </Box>

      <Box sx={{ textAlign: 'center', mt: 2 }}>
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : null}
          sx={{ minWidth: 200 }}
        >
          {submitting ? 'Enviando…' : 'Enviar Solicitud'}
        </Button>
      </Box>
    </Box>
  )
}
