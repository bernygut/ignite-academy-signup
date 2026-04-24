import { useState } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  Grid,
  MenuItem,
  TextField,
} from '@mui/material'
import FormSection from './FormSection'
import ProgrammeSelect from './ProgrammeSelect'
import SuccessScreen from './SuccessScreen'
import { createApplication } from '../../services/applicationService'
import { sendConfirmationEmail } from '../../services/emailService'
import { DIVERSITY_GROUP_OPTIONS } from '../../utils/constants'
import { useSnackbar } from '../../context/SnackbarContext'

const INITIAL_FORM = {
  full_name: '',
  email: '',
  phone: '',
  age: '',
  identificacion: '',
  diversity_group: '',
  ngo_name: '',
  programme_id: '',
  programme_name: '',
}

function validate(form) {
  const errors = {}
  if (!form.full_name.trim()) errors.full_name = 'El nombre completo es requerido'
  if (!form.email.trim()) {
    errors.email = 'El correo electrónico es requerido'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Ingresa un correo electrónico válido'
  }
  if (form.age && (isNaN(Number(form.age)) || Number(form.age) < 1 || Number(form.age) > 119)) {
    errors.age = 'Ingresa una edad válida (1–119)'
  }
  if (!form.programme_id) errors.programme_id = 'Por favor selecciona un programa'
  return errors
}

export default function SignupForm() {
  const { showSnack } = useSnackbar()
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(null) // { id, full_name, email }

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

    setSubmitting(true)
    try {
      const { programme_name, ...formData } = form
      const payload = {
        ...formData,
        age: form.age ? Number(form.age) : null,
        phone: form.phone || null,
        identificacion: form.identificacion || null,
        diversity_group: form.diversity_group || null,
        ngo_name: form.ngo_name || null,
      }

      const row = await createApplication(payload)

      // Fire-and-forget email — don't block success screen if it fails
      sendConfirmationEmail({
        toEmail: form.email,
        fullName: form.full_name,
        programmeName: form.programme_name,
        applicationId: row.id,
        phone: form.phone || null,
        age: form.age || null,
        ngoName: form.ngo_name || null,
      }).catch((err) => {
        console.warn('Confirmation email failed (non-blocking):', err.message)
      })

      setSubmitted({ id: row.id, full_name: form.full_name, email: form.email })
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
              label="Correo Electrónico *"
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
              label="Número de Teléfono"
              fullWidth
              value={form.phone}
              onChange={handleChange('phone')}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              label="Edad"
              type="number"
              fullWidth
              value={form.age}
              onChange={handleChange('age')}
              error={Boolean(errors.age)}
              helperText={errors.age}
              inputProps={{ min: 1, max: 119 }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              label="Identificación"
              fullWidth
              value={form.identificacion}
              onChange={handleChange('identificacion')}
            />
          </Grid>
        </Grid>
      </FormSection>

      <FormSection title="Detalles de la Organización">
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Grupo de Diversidad e Inclusión"
              select
              fullWidth
              value={form.diversity_group}
              onChange={handleChange('diversity_group')}
            >
              <MenuItem value=""><em>Ninguno</em></MenuItem>
              {DIVERSITY_GROUP_OPTIONS.map((g) => (
                <MenuItem key={g} value={g}>{g}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Nombre de la ONG / Organización"
              fullWidth
              value={form.ngo_name}
              onChange={handleChange('ngo_name')}
            />
          </Grid>
        </Grid>
      </FormSection>

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
