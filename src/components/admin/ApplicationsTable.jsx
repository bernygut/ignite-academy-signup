import { useState } from 'react'
import {
  Box,
  Chip,
  IconButton,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography,
} from '@mui/material'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { STATUS_COLORS, STATUS_LABELS } from '../../utils/constants'

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50]

const COLUMNS = [
  { id: 'full_name', label: 'Nombre', sortable: true },
  { id: 'email', label: 'Correo', sortable: true },
  { id: 'programme', label: 'Programa', sortable: false },
  { id: 'ngo_name', label: 'ONG', sortable: true },
  { id: 'country', label: 'País', sortable: true },
  { id: 'status', label: 'Estado', sortable: true },
  { id: 'submitted_at', label: 'Enviada', sortable: true },
  { id: 'actions', label: '', sortable: false },
]

function descendingComparator(a, b, orderBy) {
  const valA = orderBy === 'programme' ? (a.programmes?.name ?? '') : (a[orderBy] ?? '')
  const valB = orderBy === 'programme' ? (b.programmes?.name ?? '') : (b[orderBy] ?? '')
  if (valB < valA) return -1
  if (valB > valA) return 1
  return 0
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy)
}

export default function ApplicationsTable({ applications, loading, onEdit }) {
  const [order, setOrder] = useState('desc')
  const [orderBy, setOrderBy] = useState('submitted_at')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  function handleSort(col) {
    const isAsc = orderBy === col && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(col)
    setPage(0)
  }

  const sorted = [...applications].sort(getComparator(order, orderBy))
  const paginated = sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  return (
    <Paper elevation={2}>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {COLUMNS.map((col) => (
                <TableCell key={col.id}>
                  {col.sortable ? (
                    <TableSortLabel
                      active={orderBy === col.id}
                      direction={orderBy === col.id ? order : 'asc'}
                      onClick={() => handleSort(col.id)}
                    >
                      {col.label}
                    </TableSortLabel>
                  ) : (
                    col.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {COLUMNS.map((col) => (
                      <TableCell key={col.id}>
                        <Skeleton variant="text" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : paginated.length === 0
              ? (
                  <TableRow>
                    <TableCell colSpan={COLUMNS.length} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No se encontraron solicitudes.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )
              : paginated.map((app) => (
                  <TableRow key={app.id} hover>
                    <TableCell>{app.full_name}</TableCell>
                    <TableCell>{app.email}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">{app.programmes?.name}</Typography>
                        {app.programmes?.cohort && (
                          <Typography variant="caption" color="text.secondary">
                            {app.programmes.cohort}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{app.ngo_name ?? '–'}</TableCell>
                    <TableCell>{app.country ?? '–'}</TableCell>
                    <TableCell>
                      <Chip
                        label={STATUS_LABELS[app.status]}
                        color={STATUS_COLORS[app.status]}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {new Date(app.submitted_at).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Ver / Editar">
                        <IconButton size="small" onClick={() => onEdit(app)}>
                          <OpenInNewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
        component="div"
        count={applications.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10))
          setPage(0)
        }}
      />
    </Paper>
  )
}
