import { useState } from 'react'
import { useDataset } from '@/hooks/useDataset'
import { deleteDataset, uploadDataset, updateDatasetSchema, type Dataset } from '@/services/api'

const ROLES = ['date', 'revenue', 'currency', 'quantity', 'price', 'customer', 'order', 'product', 'seller', 'category', 'location', 'status', 'rating', 'delivery_date', 'estimated_date', 'weight_g']
const inputClass = 'bg-neutral-900 border border-neutral-700 rounded px-3 py-2'

function SchemaReview({ dataset, saved }: { dataset: Dataset; saved: () => Promise<void> }) {
  const [fields, setFields] = useState<Record<string, string | null>>(dataset.semantics.fields || {})
  const [currency, setCurrency] = useState(dataset.semantics.currency_code || '')
  const [domain, setDomain] = useState(dataset.semantics.domain || 'general')
  const [dateOrder, setDateOrder] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const save = async () => {
    setBusy(true); setMessage('')
    try {
      await updateDatasetSchema(dataset.dataset_id, { fields, currency_code: currency || null, domain, ...(dateOrder ? { date_order: dateOrder } : {}) })
      await saved(); setMessage('Schema confirmed.')
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Schema could not be saved.') }
    finally { setBusy(false) }
  }
  return <div className="space-y-4">
    <p className="text-sm text-neutral-400">Automatic mappings are shown below. Correct only fields that need clarification. Monetary units must be confirmed before using models trained in those units.</p>
    <div className="grid sm:grid-cols-3 gap-3 text-sm">
      {ROLES.map(role => <label key={role} className="flex flex-col gap-1">{role.replace(/_/g, ' ')}
        <select aria-label={`Map ${role}`} className={inputClass} value={fields[role] || ''} onChange={e => setFields({ ...fields, [role]: e.target.value || null })}>
          <option value="">Not detected / unused</option>
          {dataset.schema.columns?.map(c => <option key={c.name}>{c.name}</option>)}
        </select>
      </label>)}
      <label className="flex flex-col gap-1">Currency
        <select aria-label="Currency" className={inputClass} value={currency} onChange={e => setCurrency(e.target.value)}>
          <option value="">Unknown / no currency</option>{['BRL', 'USD', 'INR', 'EUR', 'GBP'].map(c => <option key={c}>{c}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-1">Dataset domain
        <select aria-label="Dataset domain" className={inputClass} value={domain} onChange={e => setDomain(e.target.value)}>
          {['general', 'commerce', 'transactions'].map(d => <option key={d}>{d}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-1">Ambiguous date order
        <select aria-label="Ambiguous date order" className={inputClass} value={dateOrder} onChange={e => setDateOrder(e.target.value)}>
          <option value="">Keep automatic detection</option><option value="dayfirst">Day / month / year</option><option value="monthfirst">Month / day / year</option>
        </select>
      </label>
    </div>
    <button disabled={busy} onClick={() => void save()} className="bg-blue-600 rounded px-4 py-2 text-sm disabled:opacity-50">{busy ? 'Saving…' : 'Confirm schema'}</button>
    {message && <p role="status">{message}</p>}
  </div>
}

export default function Datasets() {
  const { datasets, active, reload, select } = useDataset()
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inspectId, setInspectId] = useState<string | null>(null)
  const inspected = datasets.find(d => d.dataset_id === inspectId)
  const upload = async () => {
    if (!file) return
    setBusy(true); setError(null)
    try {
      const ds = await uploadDataset(file, name)
      await reload(); setInspectId(ds.dataset_id)
      if (ds.status === 'FAILED') setError(ds.error || 'Dataset processing failed.')
    } catch (e) { setError(e instanceof Error ? e.message : 'Upload failed.') }
    finally { setBusy(false) }
  }
  const remove = async (id: string) => {
    try { await deleteDataset(id); await reload(); setInspectId(null) }
    catch (e) { setError(e instanceof Error ? e.message : 'Delete failed.') }
  }
  return <div className="space-y-6">
    <h1 className="text-2xl font-semibold">Dataset Manager</h1>
    <form onSubmit={e => { e.preventDefault(); void upload() }} className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-4 space-y-4">
      <p className="text-neutral-400 text-sm">Upload CSV, a single worksheet XLSX/XLS, or a JSON array of flat records. Each upload is an independent private dataset.</p>
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-sm">Dataset name<input aria-label="Dataset name" className={inputClass} value={name} maxLength={120} required onChange={e => setName(e.target.value)} /></label>
        <label className="flex flex-col gap-1 text-sm">Dataset file<input aria-label="Dataset file" type="file" accept=".csv,.xlsx,.xls,.json" required onChange={e => setFile(e.target.files?.[0] || null)} /></label>
        <button disabled={busy || !file || !name.trim()} className="bg-blue-600 rounded px-4 py-2 text-sm disabled:opacity-50">{busy ? 'Uploading / processing…' : 'Upload dataset'}</button>
      </div>
      {busy && <p role="status">Processing and profiling dataset…</p>}
      {error && <p role="alert" className="text-red-400">{error}</p>}
    </form>
    <div className="overflow-auto border border-neutral-800 rounded-lg">
      <table className="w-full text-sm text-left"><thead className="bg-neutral-900"><tr>{['Dataset', 'Status', 'Rows', 'Columns', 'Actions'].map(h => <th className="p-3" key={h}>{h}</th>)}</tr></thead>
        <tbody>{datasets.map(d => <tr key={d.dataset_id} className="border-t border-neutral-800">
          <td className="p-3">{d.dataset_name}{active?.dataset_id === d.dataset_id && <span className="text-blue-400 ml-2">Active</span>}</td>
          <td className="p-3">{d.status}{d.error && <p className="text-red-400">{d.error}</p>}</td><td className="p-3">{d.row_count}</td><td className="p-3">{d.column_count}</td>
          <td className="p-3 space-x-3"><button disabled={d.status !== 'READY'} onClick={() => void select(d.dataset_id).catch(e => setError(e.message))} className="text-blue-400 disabled:text-neutral-600">Select</button>
            <button onClick={() => setInspectId(d.dataset_id)}>Inspect</button>{!d.read_only && <button className="text-red-400" onClick={() => void remove(d.dataset_id)}>Delete</button>}</td>
        </tr>)}</tbody></table>
      {!datasets.length && <p className="p-4 text-neutral-400">No datasets yet. Upload one to begin.</p>}
    </div>
    {inspected && <section className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-4 space-y-4">
      <h2 className="text-lg font-medium">{inspected.dataset_name} — Schema and quality</h2>
      <p className="text-sm">Missing values: {inspected.quality.missing_values ?? 'Unavailable'} · Duplicate rows: {inspected.quality.duplicate_rows ?? 'Unavailable'}</p>
      {inspected.quality.warnings?.map(w => <p key={w} className="text-amber-400 text-sm">{w}</p>)}
      <div className="overflow-auto"><table className="w-full text-sm text-left"><thead><tr>{['Field', 'Type', 'Detected role', 'Confidence', 'Missing', 'Unique'].map(h => <th key={h} className="p-2">{h}</th>)}</tr></thead>
        <tbody>{inspected.schema.columns?.map(c => <tr key={c.name} className="border-t border-neutral-800">{[c.name, c.dtype, c.role, `${Math.round(c.confidence * 100)}%`, c.missing, c.unique].map((v, i) => <td key={i} className="p-2">{v}</td>)}</tr>)}</tbody></table></div>
      <div className="grid sm:grid-cols-3 gap-2 text-sm">{Object.entries(inspected.capabilities).map(([feature, c]) => <div key={feature} className="border border-neutral-800 p-3 rounded"><strong className="capitalize">{feature}</strong>: {c.available ? 'Available' : 'Not available'}{c.reason && <p className="text-neutral-400 mt-1">{c.reason}</p>}</div>)}</div>
      {!inspected.read_only && inspected.status === 'READY' && <SchemaReview key={inspected.dataset_id} dataset={inspected} saved={reload} />}
    </section>}
  </div>
}
