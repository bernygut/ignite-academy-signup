import { Grid, Card, CardContent, Typography } from '@mui/material'
import PeopleIcon from '@mui/icons-material/People'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import { APPLICATION_STATUS } from '../../utils/constants'

export default function StatsCards({ applications }) {
  const total = applications.length
  const pending = applications.filter((a) => a.status === APPLICATION_STATUS.PENDING).length
  const approved = applications.filter((a) => a.status === APPLICATION_STATUS.APPROVED).length
  const waitlisted = applications.filter((a) => a.status === APPLICATION_STATUS.WAITLISTED).length

  const cards = [
    { label: 'Total', value: total, icon: <PeopleIcon />, color: '#2196F3' },
    { label: 'Pending', value: pending, icon: <HourglassEmptyIcon />, color: '#FF9800' },
    { label: 'Approved', value: approved, icon: <CheckCircleIcon />, color: '#4CAF50' },
    { label: 'Waitlisted', value: waitlisted, icon: <AccessTimeIcon />, color: '#2196F3' },
  ]

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {cards.map((c) => (
        <Grid item xs={6} sm={3} key={c.label}>
          <Card elevation={2}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 2 }}>
              <span style={{ color: c.color, display: 'flex' }}>{c.icon}</span>
              <div>
                <Typography variant="h5" fontWeight={700} lineHeight={1}>
                  {c.value}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {c.label}
                </Typography>
              </div>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}
