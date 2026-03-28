import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ThemeProvider, CssBaseline } from '@mui/material'
import theme from './theme/theme'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SnackbarProvider } from './context/SnackbarContext'
import AlertSnackbar from './components/common/AlertSnackbar'
import SignupPage from './pages/SignupPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import { CircularProgress, Box } from '@mui/material'

function RequireAuth({ children }) {
  const { session } = useAuth()

  // Still loading session from Supabase (undefined = loading, null = not authed)
  if (session === undefined) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!session) {
    return <Navigate to="/admin/login" replace />
  }

  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<SignupPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <AdminDashboardPage />
          </RequireAuth>
        }
      />
      {/* Catch-all: redirect to signup form */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <SnackbarProvider>
          <BrowserRouter basename="/ignite-academy-signup">
            <AppRoutes />
          </BrowserRouter>
          <AlertSnackbar />
        </SnackbarProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
