import { useState } from 'react'
import { Button, Menu, MenuItem } from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import { exportToCSV, exportToExcel } from '../../utils/exportUtils'

export default function ExportButton({ applications }) {
  const [anchor, setAnchor] = useState(null)

  function handleExport(type) {
    setAnchor(null)
    const ts = new Date().toISOString().slice(0, 10)
    if (type === 'csv') exportToCSV(applications, `applications-${ts}.csv`)
    else exportToExcel(applications, `applications-${ts}.xlsx`)
  }

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<DownloadIcon />}
        onClick={(e) => setAnchor(e.currentTarget)}
        disabled={applications.length === 0}
      >
        Export
      </Button>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
      >
        <MenuItem onClick={() => handleExport('csv')}>Export as CSV</MenuItem>
        <MenuItem onClick={() => handleExport('excel')}>Export as Excel</MenuItem>
      </Menu>
    </>
  )
}
