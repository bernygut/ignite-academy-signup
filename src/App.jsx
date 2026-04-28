import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ThemeProvider, CssBaseline } from '@mui/material'
import theme from './theme/theme'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SnackbarProvider } from './context/SnackbarContext'
import AlertSnackbar from './components/common/AlertSnackbar'
import { CircularProgress, Box } from '@mui/material'
import SignupPage from './pages/SignupPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AttendancePage from './pages/AttendancePage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import SetPasswordPage from './pages/SetPasswordPage'
import UsersPage from './pages/UsersPage'
import MfaChallengeScreen from './components/auth/MfaChallengeScreen'
import MfaEnrollScreen from './components/auth/MfaEnrollScreen'

function RequireRole({ children, allowedRoles }) {
  const { session, role, profileLoading, mfaLevel, refreshMfaLevel } = useAuth()

  if (session === undefined || profileLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!session) return <Navigate to="/admin/login" replace />
  if (!allowedRoles.includes(role)) return <Navigate to="/" replace />

  // Any user who has enrolled MFA but hasn't completed the challenge this session
  if (mfaLevel.current === 'aal1' && mfaLevel.next === 'aal2') {
    return <MfaChallengeScreen onSuccess={refreshMfaLevel} />
  }

  // Admins must have MFA enrolled — force the enrollment flow if they don't
  if (role === 'admin' && mfaLevel.next === 'aal1') {
    return <MfaEnrollScreen mandatory onSuccess={refreshMfaLevel} />
  }

  return children
}

function AppRoutes() {
  const { needsPasswordSet } = useAuth()

  // Intercept all routing when the user arrived via an invite link
  if (needsPasswordSet) return <SetPasswordPage />

  return (
    <Routes>
      <Route path="/"             element={<SignupPage />} />
      <Route path="/privacy"      element={<PrivacyPolicyPage />} />
      <Route path="/admin/login"  element={<AdminLoginPage />} />
      <Route
        path="/admin"
        element={
          <RequireRole allowedRoles={['admin']}>
            <AdminDashboardPage />
          </RequireRole>
        }
      />
      <Route
        path="/attendance"
        element={
          <RequireRole allowedRoles={['admin', 'instructor']}>
            <AttendancePage />
          </RequireRole>
        }
      />
      <Route
        path="/users"
        element={
          <RequireRole allowedRoles={['admin']}>
            <UsersPage />
          </RequireRole>
        }
      />
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
          <HashRouter>
            <AppRoutes />
          </HashRouter>
          <AlertSnackbar />
        </SnackbarProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
