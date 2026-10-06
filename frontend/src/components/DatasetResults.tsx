import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { KpiCard } from '@/components/KpiCard'

interface Results {
  status: string; reason?: string; dataset_name?: string
  metric_cards: { label: string; value: number | null }[]
  numeric_statistics?: { field: string; count: number; sum: number | null; mean: number | null; median: number | null; min: number | null; max: number | null }[]
  distributions?: { field: string; series: { label: string; rows: number; amount?: number }[] }[]
  time_series?: { period: string; rows: number; revenue?: number; amount?: number }[]
  entities?: { label: string; rows: number; amount?: number }[]
}
const format = (v: number | null | undefined) => v == null ? 'No observed values' : v.toLocaleString('en-US', { maximumFractionDigits: 2 })

/** Semantic content slot reused inside the existing dashboard and analytics pages. */
export default function DatasetResults({ data }: { data: Results }) {
  if (data.status === 'not_applicable') return <div role="status" className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-5"><h2 className="font-medium">Not available for this dataset.</h2><p className="text-neutral-400 mt-2">{data.reason}</p></div>
  return <div className="space-y-6">
    <p className="text-sm text-neutral-400">Calculated from {data.dataset_name} with the current filters.</p>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{data.metric_cards.map(c => <KpiCard key={c.label} label={c.label} value={format(c.value)} />)}</div>
    {data.metric_cards[0]?.value === 0 && <p role="status">No rows match the selected filters.</p>}
    {!!data.time_series?.length && <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-4"><h2 className="mb-4 font-medium">Time trend</h2>
      <ResponsiveContainer width="100%" height={260}><LineChart data={data.time_series}><CartesianGrid stroke="#262626" /><XAxis dataKey="period" stroke="#888" /><YAxis stroke="#888" /><Tooltip contentStyle={{ background: '#171717', border: '1px solid #333' }} /><Line dataKey={data.time_series.some(p => p.revenue != null) ? 'revenue' : data.time_series.some(p => p.amount != null) ? 'amount' : 'rows'} stroke="#3b82f6" dot={false} /></LineChart></ResponsiveContainer>
    </div>}
    <div className="grid md:grid-cols-2 gap-4">{data.distributions?.map(d => <div key={d.field} className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-4"><h2 className="mb-4 font-medium">{d.field} distribution</h2>
      <ResponsiveContainer width="100%" height={240}><BarChart data={d.series}><CartesianGrid stroke="#262626" /><XAxis dataKey="label" stroke="#888" /><YAxis stroke="#888" /><Tooltip contentStyle={{ background: '#171717', border: '1px solid #333' }} /><Bar dataKey="rows" fill="#3b82f6" /></BarChart></ResponsiveContainer>
    </div>)}</div>
    {!!data.numeric_statistics?.length && <div className="overflow-auto border border-neutral-800 rounded-lg"><table className="w-full text-sm text-left"><thead className="bg-neutral-900"><tr>{['Field', 'Count', 'Total', 'Average', 'Median', 'Min', 'Max'].map(h => <th className="p-3" key={h}>{h}</th>)}</tr></thead><tbody>{data.numeric_statistics.map(s => <tr key={s.field} className="border-t border-neutral-800"><td className="p-3">{s.field}</td>{[s.count, s.sum, s.mean, s.median, s.min, s.max].map((v, i) => <td className="p-3" key={i}>{format(v)}</td>)}</tr>)}</tbody></table></div>}
    {!!data.entities?.length && <div className="overflow-auto border border-neutral-800 rounded-lg"><table className="w-full text-sm text-left"><thead><tr><th className="p-3">Entity</th><th>Rows</th><th>Amount</th></tr></thead><tbody>{data.entities.map(r => <tr key={r.label}><td className="p-3">{r.label}</td><td>{r.rows}</td><td>{format(r.amount)}</td></tr>)}</tbody></table></div>}
  </div>
}
