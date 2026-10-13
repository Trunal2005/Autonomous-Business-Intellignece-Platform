import { Link, Outlet, useLocation, useNavigate, useNavigation } from 'react-router-dom'
import { useCallback, useEffect, useRef, useState } from 'react'
import Nav from '@/components/common/Nav'
import { DatasetContext } from '@/hooks/useDataset'
import { listDatasets, selectDataset, setDatasetScope, type Dataset } from '@/services/api'

export default function AppLayout() {
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [active, setActive] = useState<Dataset | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const navigation = useNavigation()
  const location = useLocation()
  const currentLocation = useRef(location)
  const selectionEpoch = useRef(0)
  const scopeStamp = useRef('')
  const applyScope = useCallback((dataset: Dataset | null) => {
    const stamp = `${dataset?.dataset_id || ''}:${dataset?.updated_at || ''}`
    if (stamp !== scopeStamp.current) {
      scopeStamp.current = stamp
      setDatasetScope(dataset?.dataset_id || null)
    }
  }, [])
  useEffect(() => { currentLocation.current = location }, [location])
  const reload = useCallback(async () => {
    const epoch = selectionEpoch.current
    let result
    try { result = await listDatasets() } catch (error) { if (epoch !== selectionEpoch.current) return; throw error }
    if (epoch !== selectionEpoch.current) return
    setDatasets(result.datasets)
    const selected = result.datasets.flatMap(d => [d,...(d.tables || [])]).find(d => d.dataset_id === result.active_dataset_id && d.status === 'READY') || null
    setActive(selected)
    applyScope(selected)
  }, [applyScope])
  useEffect(() => {
    let current = true
    reload().catch(e => { if (current) setError(e.message) }).finally(() => { if (current) setLoading(false) })
    return () => { current = false; setDatasetScope(null) }
  }, [reload])
  const select = async (id: string, destination?: string) => {
    selectionEpoch.current += 1
    // An explicit selection supersedes older schema/list refresh requests.
    if (id !== active?.dataset_id) setDatasetScope(active?.dataset_id || null)
    setBusy(true); setError(null)
    try {
      const selected = await selectDataset(id)
      applyScope(selected)
      setActive(selected)
      navigate(destination || currentLocation.current.pathname, { replace: true })
    } catch (e) { setError(e instanceof Error ? e.message : 'Dataset selection failed'); throw e }
    finally { setBusy(false) }
  }
  return (
    <DatasetContext.Provider value={{ datasets, active, busy, reload, select }}>
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800">
        <div className="mx-auto max-w-7xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="font-semibold shrink-0">Sem5 BI</div>
          <Nav />
        </div>
        <div className="mx-auto max-w-7xl px-4 py-3 flex flex-wrap items-center gap-3 text-sm">
          <label htmlFor="active-dataset">Active Dataset:</label>
          <select id="active-dataset" aria-label="Active Dataset" value={active?.bundle_id || active?.dataset_id || ''} disabled={busy || loading}
            onChange={e => { void select(e.target.value).catch(() => {}) }} className="max-w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-2">
            <option value="" disabled>Select a dataset</option>
            {datasets.filter(d => d.status === 'READY').map(d => <option key={d.dataset_id} value={d.dataset_id}>{d.dataset_name}</option>)}
          </select>
          {(active?.bundle_id || active?.tables) && <label className="flex flex-wrap items-center gap-2">Active Table:
            <select aria-label="Active Table" value={active.dataset_id} disabled={busy} className="max-w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-2" onChange={e => { void select(e.target.value).catch(() => {}) }}>
              {(active.tables ? active : datasets.find(d => d.dataset_id === active.bundle_id))?.relational_analysis?.supported && <option value={active.bundle_id || active.dataset_id}>Bundle overview</option>}
              {(active.tables || datasets.find(d => d.dataset_id === active.bundle_id)?.tables)?.map(t => <option key={t.dataset_id} value={t.dataset_id}>{t.relative_path || t.dataset_name}</option>)}
            </select>
          </label>}
          <Link to="/datasets" className="text-blue-400">Dataset Manager</Link>
          {busy && <span role="status">Switching dataset…</span>}
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">
        {error && <div role="alert" className="text-red-400 mb-4">{error}</div>}
        {loading || busy ? <div role="status">{busy ? 'Switching dataset…' : 'Loading datasets…'}</div> : navigation.state === 'loading' ? <div role="status">Loading page…</div> : active || location.pathname === '/dashboard' || location.pathname === '/datasets' || location.pathname.startsWith('/admin') ?
          <div key={active ? `${active.dataset_id}:${active.updated_at}` : 'no-dataset'}><Outlet /></div> : <p>Select or <Link className="text-blue-400" to="/datasets">upload a dataset</Link> to begin.</p>}
      </main>
    </div>
    </DatasetContext.Provider>
  )
}
