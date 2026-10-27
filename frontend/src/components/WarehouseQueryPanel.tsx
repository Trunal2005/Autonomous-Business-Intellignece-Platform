import { useEffect, useRef, useState } from 'react'
import { getWarehouseQueries, type WarehouseQueryEvidence, type WarehouseQueryReport } from '@/services/api'

export default function WarehouseQueryPanel() {
  const [report, setReport] = useState<WarehouseQueryReport>('monthly_revenue')
  const [evidence, setEvidence] = useState<WarehouseQueryEvidence | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mounted = useRef(false)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])

  async function run() {
    setBusy(true); setError(null); setEvidence(null)
    try {
      const result = await getWarehouseQueries(report)
      if (mounted.current) setEvidence(result)
    } catch (err) {
      if (mounted.current) setError(err instanceof Error ? err.message : 'Could not run the selected report.')
    } finally {
      if (mounted.current) setBusy(false)
    }
  }

  const columns = evidence?.rows.length ? Object.keys(evidence.rows[0]) : []
  return <section className="abi-panel p-4 space-y-4" aria-labelledby="warehouse-sql-title">
    <div>
      <h2 id="warehouse-sql-title" className="font-medium text-lg">Warehouse SQL queries</h2>
      <p className="text-sm text-neutral-400 mt-2">Run a read-only report to see the SQL executed by the existing analytics service, its bound parameters and its result. Scope: the selected dataset, all recorded dates.</p>
    </div>
    <div className="flex flex-wrap items-end gap-3">
      <label className="text-sm space-y-1">Report
        <select aria-label="Warehouse SQL report" disabled={busy} value={report} onChange={e => { setReport(e.target.value as WarehouseQueryReport); setEvidence(null); setError(null) }} className="block bg-neutral-900 border border-neutral-700 rounded px-3 py-2">
          <option value="monthly_revenue">Monthly revenue and orders</option>
          <option value="orders_by_status">Orders by status</option>
          <option value="revenue_by_category">Top categories by item revenue</option>
        </select>
      </label>
      <button type="button" className="abi-button abi-button-primary" disabled={busy} onClick={() => { void run() }}>{busy ? 'Running read-only report…' : 'Run and show SQL'}</button>
    </div>
    {error && <p role="alert" className="text-red-400 text-sm">{error}</p>}
    {evidence && <div className="space-y-4">
      <div className="text-sm">
        <h3 className="font-medium">{evidence.title}</h3>
        <p className="text-neutral-400 mt-1">{evidence.dataset_name} · Executed {new Date(evidence.executed_at).toLocaleString()} · {evidence.queries.length} SQL statements · {evidence.elapsed_ms.toLocaleString()} ms total</p>
      </div>
      {evidence.status === 'not_applicable' && <p className="text-sm text-neutral-400">{evidence.reason}</p>}
      {evidence.queries.map((query, i) => <div key={i} className="border border-neutral-800 rounded p-3 space-y-2">
        <h4 className="font-medium text-sm">Executed SQL {i + 1}</h4>
        <pre className="whitespace-pre-wrap break-words overflow-auto max-h-80 text-sm font-mono bg-neutral-950 p-3 rounded"><code>{query.sql}</code></pre>
        <p className="text-xs text-neutral-400">SQL execution: {query.execution_ms} ms. Parameters are bound separately to the placeholders in SQL.</p>
        <pre className="whitespace-pre-wrap break-words text-xs font-mono">{JSON.stringify(query.parameters, null, 2)}</pre>
      </div>)}
      {!!evidence.column_mappings.length && <details className="border border-neutral-800 rounded p-3 text-sm">
        <summary className="cursor-pointer font-medium">Table and column names used in SQL</summary>
        <p className="text-neutral-400 my-3">Uploaded columns have internal storage names. These mappings connect the actual SQL to the original CSV fields.</p>
        {evidence.column_mappings.map(mapping => <div className="mt-3" key={mapping.table}>
          <p className="font-medium break-words">{mapping.source}</p><code className="text-xs break-all">{mapping.table}</code>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 mt-2">{mapping.columns.map(column => <div className="contents" key={column.stored}><dt className="font-mono">{column.stored}</dt><dd className="break-words">{column.original}</dd></div>)}</dl>
        </div>)}
      </details>}
      <div>
        <h3 className="font-medium text-sm mb-2">Report result ({evidence.rows.length} rows)</h3>
        {evidence.rows.length ? <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead><tr>{columns.map(column => <th className="text-left p-2 border-b border-neutral-700" key={column}>{column}</th>)}</tr></thead>
          <tbody>{evidence.rows.map((row, i) => <tr className="border-b border-neutral-800" key={i}>{columns.map(column => <td className="p-2" key={column}>{row[column] == null ? 'NULL' : String(row[column])}</td>)}</tr>)}</tbody>
        </table></div> : <p className="text-sm text-neutral-400">No matching result rows.</p>}
      </div>
    </div>}
  </section>
}
