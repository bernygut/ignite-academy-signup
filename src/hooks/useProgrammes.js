import { useEffect, useState } from 'react'
import supabase from '../lib/supabaseClient'

export function useProgrammes() {
  const [programmes, setProgrammes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([
      supabase
        .from('programmes')
        .select('id, name, cohort, max_capacity')
        .eq('is_active', true)
        .order('name', { ascending: true }),
      supabase
        .from('applications')
        .select('programme_id')
        .in('status', ['pending', 'approved']),
    ]).then(([{ data: progs, error: progErr }, { data: apps, error: appErr }]) => {
      if (progErr || appErr) {
        setError((progErr || appErr).message)
      } else {
        const counts = {}
        for (const app of apps ?? []) {
          counts[app.programme_id] = (counts[app.programme_id] ?? 0) + 1
        }
        setProgrammes(
          (progs ?? []).map((p) => ({
            ...p,
            enrolled: counts[p.id] ?? 0,
            available: p.max_capacity - (counts[p.id] ?? 0),
          }))
        )
      }
      setLoading(false)
    })
  }, [])

  return { programmes, loading, error }
}
