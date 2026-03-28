import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// GitHub Pages SPA routing fix:
// If 404.html redirected here with ?p=<path>, restore the real URL
// before React Router initialises so the correct route is matched.
(function () {
  const params = new URLSearchParams(window.location.search)
  const redirectedPath = params.get('p')
  if (redirectedPath) {
    const base = '/ignite-academy-signup'
    params.delete('p')
    const remaining = params.toString()
    const newUrl =
      base +
      redirectedPath +
      (remaining ? '?' + remaining : '')
    window.history.replaceState(null, '', newUrl)
  }
})()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
