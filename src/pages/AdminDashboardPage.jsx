import { useState } from 'react'
import { Box, Container, Typography } from '@mui/material'
import AdminHeader from '../components/layout/AdminHeader'
import StatsCards from '../components/admin/StatsCards'
import FilterBar from '../components/admin/FilterBar'
import ApplicationsTable from '../components/admin/ApplicationsTable'
import ApplicationDrawer from '../components/admin/ApplicationDrawer'
import ExportButton from '../components/admin/ExportButton'
import CapacityPanel from '../components/admin/CapacityPanel'
import { useApplications } from '../hooks/useApplications'

const INITIAL_FILTERS = { status: '', programmeId: '', dateFrom: '', dateTo: '' }

export default function AdminDashboardPage() {
  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const [selected, setSelected] = useState(null)
  const { applications, loading, error, update } = useApplications(filters)

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AdminHeader />
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Typography variant="h4" gutterBottom>
          Solicitudes
        </Typography>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <StatsCards applications={applications} />
        <CapacityPanel />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1, mb: 1 }}>
          <FilterBar filters={filters} onChange={setFilters} />
          <ExportButton applications={applications} />
        </Box>

        <ApplicationsTable
          applications={applications}
          loading={loading}
          onEdit={setSelected}
        />

        <ApplicationDrawer
          application={selected}
          onClose={() => setSelected(null)}
          onSave={update}
        />
      </Container>
    </Box>
  )
}
