import { useCallback, useEffect, useState } from 'react'
import { approveApplication, deleteApplication, fetchApplications, updateApplication } from '../services/applicationService'

export function useApplications(filters = {}) {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchApplications(filters)
      setApplications(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.statuses?.join(','),
    filters.programmeIds?.join(','),
    filters.dateFrom,
    filters.dateTo,
    filters.ngoNames?.join(','),
    filters.diversityGroups?.join(','),
  ])

  useEffect(() => {
    load()
  }, [load])

  async function update(id, changes) {
    await updateApplication(id, changes)
    await load()
  }

  async function remove(id) {
    await deleteApplication(id)
    await load()
  }

  async function approve(id) {
    await approveApplication(id)
    await load()
  }

  return { applications, loading, error, reload: load, update, remove, approve }
}
