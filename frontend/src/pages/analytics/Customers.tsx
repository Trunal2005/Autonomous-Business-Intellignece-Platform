import DatasetResults from '@/components/DatasetResults'
import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { getAnalyticsCustomers } from '@/services/api'
import { useFilters } from '@/hooks/useFilters'
import { KpiCard } from '@/components/KpiCard'
import { fmtMoney } from '@/services/format'

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316']

export default function Customers() {
  const { filters } = useFilters()
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    let current = true
    setState('loading')
    getAnalyticsCustomers(filters)
      .then((res) => {
        if (!current) return
        setData(res)
        setState('ready')
      })
      .catch(e => { if (current) { setError(e.message); setState('error') } })
    return () => { current = false }
  }, [filters])

  if (state === 'error') {
    return (
      <div className="text-red-400">
        {error || 'Could not load data.'}
      </div>
    )
  }

  if (state === 'loading' || !data) {
    return <div className="text-neutral-400">Loading customers data...</div>
  }

  const {
    kpis,
    spend_distribution,
    order_frequency,
    top_customers,
    top_states,
    new_vs_repeat,
  } = data

  if ('metric_cards' in data) return <DatasetResults data={data} />

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Unique Customers" value={kpis.unique_customers.toLocaleString()} />
        <KpiCard label="Avg Spend" value={fmtMoney(kpis.avg_spend_per_customer)} />
        <KpiCard label="Avg Orders" value={kpis.avg_orders_per_customer.toFixed(2)} />
        <KpiCard label="Repeat Rate" value={`${kpis.repeat_rate}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-neutral-900/60 p-4 rounded-lg border border-neutral-800">
          <h2 className="mb-3 font-medium">Customer Spend Distribution</h2>
          {spend_distribution && spend_distribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={spend_distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="bucket" stroke="#666" fontSize={11} angle={-20} textAnchor="end" height={50} />
                <YAxis stroke="#666" fontSize={11} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <Tooltip contentStyle={{ background: '#171717', border: '1px solid #333' }} />
                <Bar dataKey="customers" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-neutral-500">No data available</div>
          )}
        </div>

        <div className="bg-neutral-900/60 p-4 rounded-lg border border-neutral-800">
          <h2 className="mb-3 font-medium">Top States by Customer Count</h2>
          {top_states && top_states.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={top_states.slice(0, 10)} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" horizontal={false} />
                <XAxis type="number" stroke="#666" fontSize={11} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <YAxis type="category" dataKey="state" stroke="#666" fontSize={10} width={40} />
                <Tooltip contentStyle={{ background: '#171717', border: '1px solid #333' }} />
                <Bar dataKey="customers" fill="#22c55e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-neutral-500">No data available</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-neutral-900/60 p-4 rounded-lg border border-neutral-800">
          <h2 className="mb-3 font-medium">New vs Repeat</h2>
          <div className="flex h-[250px]">
            {new_vs_repeat && new_vs_repeat.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={new_vs_repeat}
                    dataKey="customers"
                    nameKey="segment"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {new_vs_repeat.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#171717', border: '1px solid #333' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex-1 flex items-center justify-center text-neutral-500">No data available</div>
            )}
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {new_vs_repeat?.map((s: any, i: number) => (
              <div key={s.segment} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-neutral-300">{s.segment}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-neutral-900/60 p-4 rounded-lg border border-neutral-800">
          <h2 className="mb-3 font-medium">Order Frequency</h2>
          <div className="space-y-3 mt-4">
            {order_frequency?.map((of: any) => (
              <div key={of.bucket} className="flex justify-between items-center text-sm border-b border-neutral-800 pb-2">
                <span className="text-neutral-300">{of.bucket}</span>
                <span className="text-neutral-400">{of.customers.toLocaleString()} ({of.share_pct}%)</span>
              </div>
            ))}
            {!order_frequency?.length && <div className="text-neutral-500 text-sm">No data available</div>}
          </div>
        </div>

        <div className="bg-neutral-900/60 p-4 rounded-lg border border-neutral-800 overflow-hidden flex flex-col">
          <h2 className="mb-3 font-medium">Top Customers by Spend</h2>
          <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {top_customers?.slice(0, 10).map((c: any) => (
              <div key={c.customer} className="flex flex-col text-sm border-b border-neutral-800 pb-2">
                <span className="font-medium text-neutral-200">ID: {c.customer}</span>
                <span className="text-neutral-500 text-xs uppercase">{c.state}</span>
                <div className="flex justify-between mt-1">
                  <span className="text-neutral-400">{c.orders} orders</span>
                  <span className="text-blue-400 font-medium">{fmtMoney(c.revenue)}</span>
                </div>
              </div>
            ))}
            {!top_customers?.length && <div className="text-neutral-500 text-sm">No data available</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
