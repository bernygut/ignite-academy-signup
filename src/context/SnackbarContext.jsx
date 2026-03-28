import { createContext, useCallback, useContext, useState } from 'react'

const SnackbarContext = createContext(null)

export function SnackbarProvider({ children }) {
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'info' })

  const showSnack = useCallback((message, severity = 'info') => {
    setSnack({ open: true, message, severity })
  }, [])

  const closeSnack = useCallback(() => {
    setSnack((prev) => ({ ...prev, open: false }))
  }, [])

  return (
    <SnackbarContext.Provider value={{ snack, showSnack, closeSnack }}>
      {children}
    </SnackbarContext.Provider>
  )
}

export function useSnackbar() {
  const ctx = useContext(SnackbarContext)
  if (!ctx) throw new Error('useSnackbar must be used within SnackbarProvider')
  return ctx
}
