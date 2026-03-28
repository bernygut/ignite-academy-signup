import { useCallback, useEffect, useState } from 'react'
import { fetchApplications, updateApplication } from '../services/applicationService'

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
    filters.status,
    filters.programmeId,
    filters.dateFrom,
    filters.dateTo,
  ])

  useEffect(() => {
    load()
  }, [load])

  async function update(id, changes) {
    await updateApplication(id, changes)
    await load()
  }

  return { applications, loading, error, reload: load, update }
}
