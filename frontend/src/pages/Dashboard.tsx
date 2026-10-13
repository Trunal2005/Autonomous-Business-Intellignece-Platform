import DatasetResults from '@/components/DatasetResults'
import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { getAnalyticsOverview } from '@/services/api'
import { useFilters } from '@/hooks/useFilters'
import FilterBar from '@/components/FilterBar'

import { KpiCard } from '@/components/KpiCard'
import { fmtMoney } from '@/services/format'
import { useDataset } from '@/hooks/useDataset'
import { Link } from 'react-router-dom'

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316']

export default function Dashboard() {
  const { filters, resetFilters } = useFilters()
  const { active, datasets } = useDataset()
  const activeId = active?.dataset_id
  const [retry, setRetry] = useState(0)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    let current = true
    if (!activeId) { setData(null); setState('ready'); return () => { current = false } }
    setState('loading')
    setData(null); setError(null)
    getAnalyticsOverview(filters)
      .then((res) => {
        if (!current) return
        setData(res)
        setState('ready')
      })
      .catch(e => { if (current) { setError(e.message); setState('error') } })
    return () => { current = false }
  }, [filters, activeId, active?.updated_at, retry])

  if (!active) return <section className="border border-neutral-800 rounded-2xl p-8 space-y-4"><h1 className="text-3xl font-semibold">Dashboard</h1><h2 className="text-lg">Start with your data</h2><p className="text-neutral-400">Upload a file or CSV folder, inspect its schema and choose a table to see observed metrics.</p><Link className="inline-block bg-blue-600 rounded-lg px-4 py-2" to="/datasets">Upload your first dataset</Link></section>

  if (state === 'error') {
    return (
      <div className="border border-red-900 bg-red-950/20 rounded-xl p-6 space-y-3" role="alert">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p>{error || 'Could not load data.'}</p>
        <button className="px-4 py-2 bg-neutral-800 rounded" onClick={() => setRetry(r => r + 1)}>Retry dashboard</button>
        <Link to="/datasets" className="block text-blue-400">Choose a dataset in Dataset Manager</Link>
      </div>
    )
  }

  const renderContent = () => {
    if (state === 'loading' || !data) {
      return <div role="status" className="space-y-4"><p className="text-neutral-400">Loading dataset metrics...</p><div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">{[1, 2, 3, 4].map(i => <div key={i} className="h-28 rounded-xl bg-neutral-900 border border-neutral-800" />)}</div></div>
    }

    if ('metric_cards' in data) return <div className="space-y-4">{data.revenue_definition && <div className="border border-neutral-800 rounded-xl p-4 text-sm space-y-2"><p>{data.revenue_definition}</p><p>Currency: {data.currency_code || 'Unconfirmed — confirm in Dataset Manager'}. Grain: orders. Every metric uses the current filters.</p><p>Missing values: {active.tables?.reduce((n,t) => n+(t.quality.missing_values || 0),0).toLocaleString()}. Tables: {active.tables?.length}. Uploaded record provenance is unverified.</p><details><summary>Validated relationships and data coverage</summary>{data.relationships?.relationships?.map((r: any,i: number) => <p key={i}>{r.from_table} → {r.to_table}: {r.enabled ? 'Enabled' : r.reason} · unmatched {r.unmatched_rows ?? 'not applicable'} · null keys {r.null_keys ?? 'not applicable'}</p>)}</details></div>}<DatasetResults data={data} dashboard revenueAvailable={!!active?.semantics.fields?.revenue} monetaryFields={active.tables ? ['Item revenue','Average order value','Payment total'] : [active?.semantics.fields?.revenue, active?.semantics.fields?.currency, active?.semantics.fields?.price].filter((field): field is string => !!field)} /></div>

    const { kpis, revenue_series, revenue_by_category, orders_by_status, top_customer_states, delivery } = data

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <KpiCard label="Total Revenue" value={fmtMoney(kpis.total_revenue)} hint="Sum of item prices" />
          <KpiCard label="Total Orders" value={kpis.total_orders.toLocaleString()} />
          <KpiCard label="Unique Customers" value={kpis.unique_customers.toLocaleString()} />
          <KpiCard label="Products Sold" value={kpis.products_sold.toLocaleString()} />
          <KpiCard label="Active Sellers" value={kpis.active_sellers.toLocaleString()} />
          <KpiCard label="Avg Order Value" value={fmtMoney(kpis.avg_order_value)} />
          <KpiCard label="Avg Review Score" value={kpis.avg_review_score?.toFixed(2) || '—'} hint="out of 5" />
          <KpiCard label="On-time Delivery" value={delivery.kpis.on_time_rate != null ? `${delivery.kpis.on_time_rate}%` : '—'} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-neutral-900/60 p-4 rounded-lg border border-neutral-800">
            <h2 className="mb-3 font-medium">Revenue Over Time</h2>
            {revenue_series && revenue_series.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={revenue_series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis dataKey="period" stroke="#666" fontSize={11} />
                  <YAxis stroke="#666" fontSize={11} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                  <Tooltip
                    formatter={(v: number) => fmtMoney(v)}
                    contentStyle={{ background: '#171717', border: '1px solid #333' }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-neutral-500">No data available</div>
            )}
          </div>

          <div className="bg-neutral-900/60 p-4 rounded-lg border border-neutral-800">
            <h2 className="mb-3 font-medium">Orders Over Time</h2>
            {revenue_series && revenue_series.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={revenue_series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis dataKey="period" stroke="#666" fontSize={11} />
                  <YAxis stroke="#666" fontSize={11} />
                  <Tooltip contentStyle={{ background: '#171717', border: '1px solid #333' }} />
                  <Line type="monotone" dataKey="orders" stroke="#22c55e" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-neutral-500">No data available</div>
            )}
          </div>

          <div className="bg-neutral-900/60 p-4 rounded-lg border border-neutral-800">
            <h2 className="mb-3 font-medium">Revenue by Category (Top 10)</h2>
            {revenue_by_category && revenue_by_category.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenue_by_category.slice(0, 10)} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" horizontal={false} />
                  <XAxis type="number" stroke="#666" fontSize={11} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                  <YAxis type="category" dataKey="category" stroke="#666" fontSize={10} width={80} />
                  <Tooltip
                    formatter={(v: number) => fmtMoney(v)}
                    contentStyle={{ background: '#171717', border: '1px solid #333' }}
                  />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-neutral-500">No data available</div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-neutral-900/60 p-4 rounded-lg border border-neutral-800 flex flex-col">
              <h2 className="mb-3 font-medium">Order Status</h2>
              <div className="flex-1 flex items-center justify-center">
                {orders_by_status && orders_by_status.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={orders_by_status}
                        dataKey="orders"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {orders_by_status.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#171717', border: '1px solid #333' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-neutral-500">No data available</div>
                )}
              </div>
            </div>

            <div className="bg-neutral-900/60 p-4 rounded-lg border border-neutral-800">
              <h2 className="mb-3 font-medium">Top States (Customers)</h2>
              <div className="space-y-3">
                {top_customer_states?.slice(0, 5).map((s: any) => (
                  <div key={s.state} className="flex justify-between items-center text-sm">
                    <span className="text-neutral-300 font-medium uppercase">{s.state}</span>
                    <span className="text-neutral-400">{s.customers.toLocaleString()} customers</span>
                  </div>
                ))}
                {!top_customer_states?.length && (
                  <div className="text-neutral-500 text-sm">No data available</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-neutral-800 bg-gradient-to-br from-blue-950/40 via-neutral-900 to-neutral-950 p-6 sm:p-8">
        <div className="flex flex-wrap justify-between gap-4"><div><p className="text-xs uppercase tracking-widest text-blue-400 mb-2">Business intelligence overview</p><h1 className="text-3xl font-semibold">Dashboard</h1><p className="mt-2 text-sm text-neutral-400">Explore observed performance, current filters and data quality.</p></div><Link className="self-start border border-neutral-600 px-4 py-2 rounded-lg text-sm" to="/datasets">Change data source</Link></div>
        <div className="mt-5 flex flex-wrap gap-3 text-sm"><span className="rounded-full bg-neutral-800 px-3 py-1">{active?.bundle_id ? datasets.find(d => d.dataset_id === active.bundle_id)?.dataset_name : active?.dataset_name || 'No selected dataset'}</span>{active?.bundle_id && <span className="rounded-full bg-blue-950 px-3 py-1 break-all">Table: {active.relative_path || active.dataset_name}</span>}<span className="text-emerald-400 px-2 py-1">{active?.status || 'Select a source'}</span></div>
        {active?.bundle_id && <p className="mt-3 text-xs text-neutral-400">Analysis grain: rows in the selected table. Cross-table joins are unavailable; no totals are combined across tables.</p>}
      </div>
      <FilterBar showGrain={false} />
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-400" aria-label="Active filter summary"><span>{Object.keys(filters).length ? `Active filters: ${Object.entries(filters).map(([k, v]) => `${k.replace(/_/g, ' ')} = ${v}`).join(' · ')}` : 'All available records · no active filters'}</span>{Object.keys(filters).length > 0 && <button onClick={resetFilters} className="text-blue-400">Clear all filters</button>}</div>
      {active && <div className="grid sm:grid-cols-3 gap-3"><div className="border border-neutral-800 rounded-xl p-4"><p className="text-xs uppercase text-neutral-500">Source volume</p><p className="mt-2 font-semibold">{active.tables ? `${active.row_count.toLocaleString()} source rows · ${active.tables.length} tables · ${active.column_count} table columns` : `${active.row_count.toLocaleString()} rows · ${active.column_count} fields`}</p><p className="text-xs text-neutral-500 mt-1">{active.tables ? 'All separate tables before filters; repeated keys are not business totals' : 'Whole table before filters'}</p></div><div className="border border-neutral-800 rounded-xl p-4"><p className="text-xs uppercase text-neutral-500">Profile quality</p><p className="mt-2">{active.quality.missing_values ?? 'Unknown'} missing values · {active.quality.duplicate_rows ?? 'Unknown'} duplicate rows</p><p className="text-xs text-neutral-500 mt-1">{active.tables ? 'Sum of per-table profiles; duplicates are retained' : 'Whole-table profile; duplicates are retained'}</p></div><div className="border border-neutral-800 rounded-xl p-4"><p className="text-xs uppercase text-neutral-500">Monetary units</p><p className="mt-2">{active.semantics.currency_code || 'Currency unconfirmed'}</p><p className="text-xs text-neutral-500 mt-1">Values retain source units; no conversion</p></div></div>}
      {active?.quality.warnings?.length ? <div className="border border-amber-900/60 bg-amber-950/20 rounded-xl p-4 text-sm text-amber-300">{active.quality.warnings.map(w => <p key={w}>{w}</p>)}</div> : null}
      {renderContent()}
    </div>
  )
}
