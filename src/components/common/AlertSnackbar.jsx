import { Alert, Snackbar } from '@mui/material'
import { useSnackbar } from '../../context/SnackbarContext'

export default function AlertSnackbar() {
  const { snack, closeSnack } = useSnackbar()

  return (
    <Snackbar
      open={snack.open}
      autoHideDuration={4000}
      onClose={closeSnack}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert onClose={closeSnack} severity={snack.severity} variant="filled" sx={{ width: '100%' }}>
        {snack.message}
      </Alert>
    </Snackbar>
  )
}
