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
import { GENDER_OPTIONS } from '../../utils/constants'
import { useSnackbar } from '../../context/SnackbarContext'

const INITIAL_FORM = {
  full_name: '',
  email: '',
  phone: '',
  age: '',
  gender: '',
  country: '',
  ngo_name: '',
  caseworker_name: '',
  beneficiary_id: '',
  programme_id: '',
}

function validate(form) {
  const errors = {}
  if (!form.full_name.trim()) errors.full_name = 'Full name is required'
  if (!form.email.trim()) {
    errors.email = 'Email is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Enter a valid email address'
  }
  if (form.age && (isNaN(Number(form.age)) || Number(form.age) < 1 || Number(form.age) > 119)) {
    errors.age = 'Enter a valid age (1–119)'
  }
  if (!form.programme_id) errors.programme_id = 'Please select a programme'
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
      const payload = {
        ...form,
        age: form.age ? Number(form.age) : null,
        phone: form.phone || null,
        gender: form.gender || null,
        country: form.country || null,
        ngo_name: form.ngo_name || null,
        caseworker_name: form.caseworker_name || null,
        beneficiary_id: form.beneficiary_id || null,
      }

      const row = await createApplication(payload)

      // Fire-and-forget email — don't block success screen if it fails
      sendConfirmationEmail({
        toEmail: form.email,
        fullName: form.full_name,
        programmeName: '', // We don't have the name here; service resolves it
        applicationId: row.id,
      }).catch((err) => {
        console.warn('Confirmation email failed (non-blocking):', err.message)
      })

      setSubmitted({ id: row.id, full_name: form.full_name, email: form.email })
    } catch (err) {
      showSnack(err.message || 'Submission failed. Please try again.', 'error')
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
      <FormSection title="About You">
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Full Name *"
              fullWidth
              value={form.full_name}
              onChange={handleChange('full_name')}
              error={Boolean(errors.full_name)}
              helperText={errors.full_name}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Email Address *"
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
              label="Phone Number"
              fullWidth
              value={form.phone}
              onChange={handleChange('phone')}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              label="Age"
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
              label="Gender"
              select
              fullWidth
              value={form.gender}
              onChange={handleChange('gender')}
            >
              <MenuItem value=""><em>Prefer not to say</em></MenuItem>
              {GENDER_OPTIONS.map((g) => (
                <MenuItem key={g} value={g}>{g}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Country"
              fullWidth
              value={form.country}
              onChange={handleChange('country')}
            />
          </Grid>
        </Grid>
      </FormSection>

      <FormSection title="Organisation Details">
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="NGO / Organisation Name"
              fullWidth
              value={form.ngo_name}
              onChange={handleChange('ngo_name')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Caseworker Name"
              fullWidth
              value={form.caseworker_name}
              onChange={handleChange('caseworker_name')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Beneficiary ID"
              fullWidth
              value={form.beneficiary_id}
              onChange={handleChange('beneficiary_id')}
            />
          </Grid>
        </Grid>
      </FormSection>

      <FormSection title="Programme Selection">
        <ProgrammeSelect
          value={form.programme_id}
          onChange={(val) => {
            setForm((prev) => ({ ...prev, programme_id: val }))
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
          {submitting ? 'Submitting…' : 'Submit Application'}
        </Button>
      </Box>
    </Box>
  )
}
