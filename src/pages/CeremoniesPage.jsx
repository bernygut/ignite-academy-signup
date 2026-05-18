import { useState } from 'react'
import { Box, Container, Tab, Tabs, Typography } from '@mui/material'
import AdminHeader from '../components/layout/AdminHeader'
import ComposeForm from '../components/ceremony/ComposeForm'
import CampaignHistory from '../components/ceremony/CampaignHistory'

export default function CeremoniesPage() {
  const [tab, setTab] = useState(0)
  const [reloadKey, setReloadKey] = useState(0)

  function handleSent() {
    // Bump the reload key so the history tab re-fetches when we switch to it
    setReloadKey((k) => k + 1)
    setTab(1)
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AdminHeader />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
          Ceremonias
        </Typography>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
          <Tab label="Nueva invitación" />
          <Tab label="Historial" />
        </Tabs>

        {tab === 0 && <ComposeForm onSent={handleSent} />}
        {tab === 1 && <CampaignHistory reloadKey={reloadKey} />}
      </Container>
    </Box>
  )
}
