import { useEffect, useState } from 'react'
import supabase from '../lib/supabaseClient'

export function useProgrammes() {
  const [programmes, setProgrammes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    supabase
      .from('programmes')
      .select('id, name, cohort')
      .eq('is_active', true)
      .order('starts_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setProgrammes(data ?? [])
        setLoading(false)
      })
  }, [])

  return { programmes, loading, error }
}
