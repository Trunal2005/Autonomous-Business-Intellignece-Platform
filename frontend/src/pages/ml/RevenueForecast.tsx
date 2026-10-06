import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { KpiCard } from '@/components/KpiCard'
import { getForecast, type ForecastPoint } from '@/services/api'
import { useFilters } from '@/hooks/useFilters'
import FilterBar from '@/components/FilterBar'

const fmtMoney = (n: number) =>
  `R$ ${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`

export default function RevenueForecast() {
  const { filters } = useFilters()
  const [reason, setReason] = useState<string | null>(null)
  const [history, setHistory] = useState<ForecastPoint[]>([])
  const [forecast, setForecast] = useState<ForecastPoint[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [horizon, setHorizon] = useState<number>(30)

  useEffect(() => {
    let current = true
    setState('loading')
    setReason(null)
    getForecast(horizon, 'revenue', filters)
      .then((res) => {
        if (!current) return
        if (res.status === 'not_applicable') { setReason(res.reason || 'Model requirements are not satisfied.'); setState('ready'); setHistory([]); setForecast([]); return }
        setHistory(res.history_tail)
        setForecast(res.forecast)
        setState('ready')
      })
      .catch(e => { if (current) { setReason(e.message); setState('error') } })
    return () => { current = false }
  }, [horizon, filters])

  const forecastData = [
    ...history.map((p) => ({ date: p.date, historical: p.revenue, forecast: null as number | null })),
    ...forecast.map((p) => ({ date: p.date, historical: null as number | null, forecast: p.revenue })),
  ]

  const totalForecastRevenue = forecast.reduce((acc, p) => acc + (p.revenue || 0), 0)
  const avgForecastRevenue = forecast.length > 0 ? totalForecastRevenue / forecast.length : 0
  const latestHistorical = history.length > 0 ? history[history.length - 1].revenue || 0 : 0

  return (
    <div className="space-y-6">
      <FilterBar />
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold">Revenue Forecast</h1>
          <p className="text-sm text-neutral-500">
            Machine Learning (Linear Regression) predictive forecast of daily revenue, trained on lag and rolling historical features.
          </p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded px-3 py-1.5 flex items-center gap-2">
          <label className="text-sm text-neutral-400">Horizon:</label>
          <select
            value={horizon}
            onChange={(e) => setHorizon(Number(e.target.value))}
            className="bg-transparent text-sm text-neutral-200 outline-none"
          >
            <option value={7}>7 Days</option>
            <option value={14}>14 Days</option>
            <option value={30}>30 Days</option>
            <option value={90}>90 Days</option>
          </select>
        </div>
      </div>

      {state === 'loading' && <div className="text-neutral-400">Running forecast model...</div>}

      {state === 'error' && (
        <div className="text-red-400">
          {reason || 'Failed to generate forecast.'}
        </div>
      )}

      {state === 'ready' && reason && <div role="status" className="bg-neutral-900 border border-neutral-800 rounded p-4"><h2>Not Applicable</h2><p className="text-neutral-400">{reason}</p></div>}
      {state === 'ready' && !reason && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KpiCard
              label="Latest Actual Revenue"
              value={fmtMoney(latestHistorical)}
            />
            <KpiCard
              label={`Forecast Average (${horizon}d)`}
              value={fmtMoney(avgForecastRevenue)}
            />
            <KpiCard
              label={`Forecast Total (${horizon}d)`}
              value={fmtMoney(totalForecastRevenue)}
            />
          </div>

          <div className="bg-neutral-900/60 p-4 rounded-lg border border-neutral-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-medium">Historical Actuals vs Predicted Revenue</h2>
              <div className="text-xs text-neutral-500 bg-neutral-800/50 px-2 py-1 rounded">
                Model: Linear Regression (Daily)
              </div>
            </div>

            <ResponsiveContainer width="100%" height={360}>
              <LineChart data={forecastData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis dataKey="date" stroke="#666" fontSize={11} minTickGap={30} />
                <YAxis
                  stroke="#666"
                  fontSize={11}
                  tickFormatter={(v) => `R$${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  contentStyle={{ background: '#171717', border: '1px solid #333' }}
                  formatter={(val: number, name: string) => [fmtMoney(val), name === 'historical' ? 'Actual Revenue' : 'Predicted Revenue']}
                />
                <Legend iconType="circle" />
                <Line
                  name="historical"
                  type="monotone"
                  dataKey="historical"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 2, fill: '#3b82f6', strokeWidth: 0 }}
                  activeDot={{ r: 4 }}
                  connectNulls
                />
                <Line
                  name="forecast"
                  type="monotone"
                  dataKey="forecast"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 2, fill: '#f59e0b', strokeWidth: 0 }}
                  activeDot={{ r: 4 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-neutral-900/60 p-4 rounded-lg border border-neutral-800 mt-6">
            <h2 className="mb-4 font-medium text-sm text-neutral-400 uppercase tracking-wider">Forecast Data Table</h2>
            <div className="max-h-64 overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-neutral-500 text-xs uppercase sticky top-0 bg-neutral-900 border-b border-neutral-800">
                  <tr>
                    <th className="text-left py-2 px-4">Date</th>
                    <th className="text-right py-2 px-4">Predicted Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {forecast.map((p) => (
                    <tr key={p.date} className="border-b border-neutral-800/30 hover:bg-neutral-800/50">
                      <td className="py-2 px-4 text-neutral-300 font-mono">{p.date}</td>
                      <td className="py-2 px-4 text-right font-mono text-amber-400">{fmtMoney(p.revenue || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
