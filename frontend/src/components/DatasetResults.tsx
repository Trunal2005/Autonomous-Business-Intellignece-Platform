import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { KpiCard } from '@/components/KpiCard'

interface Results {
  grain?: string
  date_range?: {min:string|null;max:string|null}
  currency_code?: string | null
  status: string; reason?: string; dataset_name?: string
  metric_cards: { label: string; value: number | null }[]
  numeric_statistics?: { field: string; count: number; sum: number | null; mean: number | null; median: number | null; min: number | null; max: number | null }[]
  distributions?: { field: string; measure?: 'rows' | 'amount'; series: { label: string; rows: number; amount?: number }[] }[]
  time_series?: { period: string; rows: number; revenue?: number; amount?: number }[]
  entities?: { label: string; rows: number; amount?: number }[]
}
const format = (v: number | null | undefined) => v == null ? 'No observed values' : v.toLocaleString('en-US', { maximumFractionDigits: 2 })

/** Semantic content slot reused inside the existing dashboard and analytics pages. */
export default function DatasetResults({ data, dashboard = false, monetaryFields = [], revenueAvailable }: { data: Results; dashboard?: boolean; monetaryFields?: string[]; revenueAvailable?: boolean }) {
  if (data.status === 'not_applicable') return <div role="status" className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-5"><h2 className="font-medium">Not available for this dataset.</h2><p className="text-neutral-400 mt-2">{data.reason}</p></div>
  const monetary = (label: string) => monetaryFields.some(field => label === field || label === `Total ${field}` || label === `Average ${field}`)
  const priority = (label: string) => monetary(label) ? 0 : label.startsWith('Total ') || label.startsWith('Average ') ? 2 : 1
  const cards = dashboard && data.grain !== 'orders' ? [...data.metric_cards].sort((a, b) => priority(a.label) - priority(b.label)).slice(0, 8) : data.metric_cards
  return <div className="space-y-6">
    <p className="text-sm text-neutral-400">Calculated from {data.dataset_name} with the current filters.</p>
    {data.date_range?.min && data.date_range.max && <p className="text-sm text-neutral-400">Source date coverage: {data.date_range.min.slice(0,10)} to {data.date_range.max.slice(0,10)}</p>}
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">{cards.map(c => <KpiCard key={c.label} label={c.label} value={c.value != null && monetary(c.label) && data.currency_code ? new Intl.NumberFormat('en-US', { style: 'currency', currency: data.currency_code }).format(c.value) : format(c.value)} hint={dashboard ? `Observed values in ${data.grain === 'orders' ? 'matching bundle scope' : 'selected table'} and filters${monetary(c.label) && !data.currency_code ? ' · currency unconfirmed' : ''}` : undefined} />)}</div>
    {dashboard && <div className="flex flex-wrap gap-3 text-sm text-neutral-400 border-l-2 border-blue-500 pl-4"><span>{data.grain === 'orders' ? 'Measures use validated bundle relationships and order-grain aggregates.' : 'Measures use the current table only.'}</span>{!(revenueAvailable ?? data.metric_cards.some(c => /revenue/i.test(c.label))) && <span>Revenue unavailable: no revenue field is confirmed.</span>}{data.currency_code && <span>Currency: {data.currency_code}</span>}</div>}
    {data.metric_cards[0]?.value === 0 && <p role="status">No rows match the selected filters.</p>}
    {!!data.time_series?.length && <div className="min-w-0 overflow-hidden bg-neutral-900/60 border border-neutral-800 rounded-xl p-5"><h2 className="mb-1 font-medium">Time trend</h2><p className="mb-4 text-xs text-neutral-400">Observed {data.time_series.some(p => p.revenue != null) ? 'revenue' : data.time_series.some(p => p.amount != null) ? 'amount' : 'row count'} by period{data.currency_code ? ` · ${data.currency_code}` : ''}</p>
      <ResponsiveContainer width="100%" height={260}><LineChart data={data.time_series} margin={{ top: 10, bottom: 20 }}><CartesianGrid stroke="#262626" /><XAxis dataKey="period" stroke="#888" label={{ value: 'Period', position: 'insideBottom', offset: -15, fill: '#888' }} /><YAxis stroke="#888" /><Tooltip contentStyle={{ background: '#171717', border: '1px solid #333' }} /><Line isAnimationActive={false} dataKey={data.time_series.some(p => p.revenue != null) ? 'revenue' : data.time_series.some(p => p.amount != null) ? 'amount' : 'rows'} stroke="#3b82f6" dot={false} /></LineChart></ResponsiveContainer>
    </div>}
    {dashboard && !data.time_series?.length && <div className="border border-dashed border-neutral-700 rounded-xl p-6"><h2 className="font-medium">Time trend unavailable</h2><p className="text-sm text-neutral-400 mt-1">A validated date field and matching observations are required. Confirm the table schema or change filters.</p></div>}
    <div className="grid md:grid-cols-2 gap-4">{data.distributions?.map(d => <div key={d.field} className="min-w-0 overflow-hidden bg-neutral-900/60 border border-neutral-800 rounded-lg p-4"><h2 className="mb-4 font-medium">{d.measure === 'amount' ? 'Category item revenue' : `${d.field} distribution`}</h2>
      <p className="text-xs text-neutral-400 mb-2">{d.measure === 'amount' ? `Qualifying item prices · ${data.currency_code || 'currency unconfirmed'}` : `Matching rows by ${d.field}`}</p><ResponsiveContainer width="100%" height={d.measure === 'amount' ? 340 : 240}><BarChart data={d.series} layout={d.measure === 'amount' ? 'vertical' : 'horizontal'}><CartesianGrid stroke="#262626" /><XAxis type={d.measure === 'amount' ? 'number' : 'category'} dataKey={d.measure === 'amount' ? undefined : 'label'} stroke="#888" /><YAxis type={d.measure === 'amount' ? 'category' : 'number'} dataKey={d.measure === 'amount' ? 'label' : undefined} width={d.measure === 'amount' ? 135 : 60} tick={d.measure === 'amount' ? {fontSize:10} : undefined} interval={d.measure === 'amount' ? 0 : undefined} allowDecimals={false} stroke="#888" /><Tooltip contentStyle={{ background: '#171717', border: '1px solid #333' }} /><Bar isAnimationActive={false} dataKey={d.measure || 'rows'} fill="#3b82f6" /></BarChart></ResponsiveContainer>
    </div>)}</div>
    {!!data.numeric_statistics?.length && <div className="overflow-auto border border-neutral-800 rounded-lg"><table className="w-full text-sm text-left"><thead className="bg-neutral-900"><tr>{['Field', 'Count', 'Total', 'Average', 'Median', 'Min', 'Max'].map(h => <th className="p-3" key={h}>{h}</th>)}</tr></thead><tbody>{data.numeric_statistics.map(s => <tr key={s.field} className="border-t border-neutral-800"><td className="p-3">{s.field}</td>{[s.count, s.sum, s.mean, s.median, s.min, s.max].map((v, i) => <td className="p-3" key={i}>{format(v)}</td>)}</tr>)}</tbody></table></div>}
    {!!data.entities?.length && <div className="overflow-auto border border-neutral-800 rounded-lg"><table className="w-full text-sm text-left"><thead><tr><th className="p-3">Entity</th><th>Rows</th><th>Amount</th></tr></thead><tbody>{data.entities.map(r => <tr key={r.label}><td className="p-3">{r.label}</td><td>{r.rows}</td><td>{format(r.amount)}</td></tr>)}</tbody></table></div>}
  </div>
}
