import * as XLSX from 'xlsx'

const COLUMNS = [
  { key: 'full_name', label: 'Full Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'age', label: 'Age' },
  { key: 'gender', label: 'Gender' },
  { key: 'country', label: 'Country' },
  { key: 'ngo_name', label: 'NGO Name' },
  { key: 'caseworker_name', label: 'Caseworker Name' },
  { key: 'beneficiary_id', label: 'Beneficiary ID' },
  { key: 'programme_name', label: 'Programme' },
  { key: 'status', label: 'Status' },
  { key: 'admin_notes', label: 'Admin Notes' },
  { key: 'submitted_at', label: 'Submitted At' },
]

function flattenApplication(app) {
  return {
    full_name: app.full_name,
    email: app.email,
    phone: app.phone ?? '',
    age: app.age ?? '',
    gender: app.gender ?? '',
    country: app.country ?? '',
    ngo_name: app.ngo_name ?? '',
    caseworker_name: app.caseworker_name ?? '',
    beneficiary_id: app.beneficiary_id ?? '',
    programme_name: app.programmes?.name ?? '',
    status: app.status,
    admin_notes: app.admin_notes ?? '',
    submitted_at: app.submitted_at
      ? new Date(app.submitted_at).toLocaleString()
      : '',
  }
}

export function exportToCSV(applications, filename = 'applications.csv') {
  const rows = applications.map(flattenApplication)
  const header = COLUMNS.map((c) => c.label).join(',')
  const body = rows
    .map((row) =>
      COLUMNS.map((c) => {
        const val = String(row[c.key] ?? '')
        // Escape commas and quotes
        return val.includes(',') || val.includes('"') || val.includes('\n')
          ? `"${val.replace(/"/g, '""')}"`
          : val
      }).join(',')
    )
    .join('\n')

  const csv = header + '\n' + body
  triggerDownload(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), filename)
}

export function exportToExcel(applications, filename = 'applications.xlsx') {
  const rows = applications.map(flattenApplication)
  const wsData = [
    COLUMNS.map((c) => c.label),
    ...rows.map((row) => COLUMNS.map((c) => row[c.key] ?? '')),
  ]
  const ws = XLSX.utils.aoa_to_sheet(wsData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Applications')
  XLSX.writeFile(wb, filename)
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
