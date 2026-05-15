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
      supabase.rpc('programme_enrollment_counts'),
    ]).then(([{ data: progs, error: progErr }, { data: counts, error: countErr }]) => {
      if (progErr || countErr) {
        setError((progErr || countErr).message)
      } else {
        const countMap = {}
        for (const row of counts ?? []) {
          countMap[row.programme_id] = Number(row.approved_count)
        }
        setProgrammes(
          (progs ?? []).map((p) => ({
            ...p,
            enrolled:  countMap[p.id] ?? 0,
            available: p.max_capacity - (countMap[p.id] ?? 0),
          }))
        )
      }
      setLoading(false)
    })
  }, [])

  return { programmes, loading, error }
}
