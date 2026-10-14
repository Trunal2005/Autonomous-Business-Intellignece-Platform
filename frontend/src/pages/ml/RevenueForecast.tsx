import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { KpiCard } from '@/components/KpiCard'
import ForecastChart from '@/components/ForecastChart'
import BusinessEvidence from '@/components/BusinessEvidence'
import { getForecast } from '@/services/api'
import { forecastPoints, forecastNumber, type ChartPoint, type ForecastTarget } from '@/services/forecast'
import { useFilters } from '@/hooks/useFilters'
import { useDataset } from '@/hooks/useDataset'
import FilterBar from '@/components/FilterBar'

export function ForecastExperience({ target, onTargetChange }: { target: ForecastTarget; onTargetChange?: (target: ForecastTarget) => void }) {
  const { active } = useDataset()
  const Heading = onTargetChange ? 'h2' : 'h1'
  const { filters } = useFilters()
  const [horizon, setHorizon] = useState(30)
  const stamp = `${active?.dataset_id}:${active?.updated_at}:${JSON.stringify(filters)}:${target}:${horizon}`
  const [result, setResult] = useState<{ stamp: string; points?: ChartPoint[]; reason?: string } | null>(null)
  const currency = active?.semantics.currency_code
  const unit = target === 'orders' ? 'orders' : `item revenue (${currency || 'currency unconfirmed'})`
  const format = (n: number) => forecastNumber(n, target, currency)
  useEffect(() => {
    let current = true
    if (active) getForecast(horizon, target, filters).then(response => {
      if (!current) return
      if (response.status === 'not_applicable') setResult({ stamp, reason: response.reason || 'Model requirements are not satisfied.' })
      else {
        const points = forecastPoints(response.history_tail, response.forecast, target)
        if (response.forecast.length !== horizon) throw new Error('The returned horizon does not match the requested daily forecast.')
        setResult({ stamp, points })
      }
    }).catch(error => { if (current) setResult({ stamp, reason: error.message }) })
    return () => { current = false }
  }, [stamp, active, filters, horizon, target])
  const points = useMemo(() => result?.stamp === stamp ? result.points || [] : [], [result, stamp])
  const historical = points.filter(p => p.historical !== null), future = points.filter(p => p.forecast !== null)
  const latest = historical[historical.length - 1], first = future[0], last = future[future.length - 1]
  const total = future.reduce((sum, p) => sum + p.forecast!, 0)
  const baseline = future.length && historical.length >= future.length ? historical.slice(-future.length).reduce((sum, p) => sum + p.historical!, 0) : null
  const change = baseline != null && baseline > 0 ? (total / baseline - 1) * 100 : null
  const negative = future.some(p => p.forecast! < 0)
  return <div className="space-y-5">
    <div className="flex flex-wrap gap-4 justify-between items-start">
      <div><Heading className="text-2xl font-semibold">{target === 'orders' ? 'Order' : 'Revenue'} Forecast</Heading><p className="text-sm text-neutral-400 mt-1">{active?.dataset_name || 'Select a dataset'} · genuine daily Linear Regression inference</p></div>
      <div className="flex flex-wrap gap-3 items-center">
        {onTargetChange && <label className="text-sm">Forecast target <select aria-label="Forecast target" className="bg-neutral-900 border border-neutral-700 rounded p-2 ml-2" value={target} onChange={e => onTargetChange(e.target.value as ForecastTarget)}><option value="orders">Orders</option><option value="revenue">Revenue</option></select></label>}
        <label className="text-sm">Horizon <select aria-label="Forecast horizon" className="bg-neutral-900 border border-neutral-700 rounded p-2 ml-2" value={horizon} onChange={e => setHorizon(Number(e.target.value))}>{[7, 14, 30, 90].map(n => <option value={n} key={n}>{n} Days</option>)}</select></label>
      </div>
      {change != null && <p className="text-sm text-neutral-300">Model-estimated change versus the preceding {future.length} observed days: {change.toFixed(2)}%. Equal-length adjacent windows; this is a forecast comparison, not realized growth.</p>}
    </div>
    {!active ? <p>Select a dataset in <Link to="/datasets">Dataset Manager</Link>.</p> : result?.stamp !== stamp ? <p role="status">Running forecast model…</p> : result.reason ? <div role="status" className="abi-panel p-5"><h3>Not Applicable</h3><p className="text-xs text-neutral-400">Forecast unavailable for this selection.</p><p>{result.reason}</p><Link className="text-blue-400 text-sm" to="/datasets">Review dataset mapping and coverage →</Link></div> : <>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label={`Latest Actual ${target === 'orders' ? 'Orders' : 'Revenue'}`} value={format(latest.historical!)} hint={latest.date} />
        <KpiCard label="First future prediction" value={format(first.forecast!)} hint={first.date} />
        <KpiCard label="Horizon-end prediction" value={format(last.forecast!)} hint={last.date} />
        <KpiCard label={`Forecast total (${horizon}d)`} value={format(total)} hint={`Daily average ${format(total / future.length)} · ${unit}`} />
      </div>
      <p className="text-xs text-neutral-400">Model: Linear Regression (Daily)</p>
      <ForecastChart points={points} format={format} unit={unit} />
      {negative && <p role="status" className="text-amber-400">The existing unconstrained model returned negative estimates. They are shown unchanged and require review before business use.</p>}
      <p className="text-xs text-neutral-400">Historical window: {historical[0].date}–{latest.date}. Forecast: {first.date}–{last.date}. No aligned out-of-sample prediction series or validated intervals are returned, so neither is plotted. Offline evaluation remains in the model catalog.</p>
      <section className="abi-panel p-4"><h3 className="mb-3 font-medium">Forecast Data Table</h3><div className="overflow-auto max-h-64"><table className="w-full text-sm"><thead><tr><th className="text-left p-2">Date</th><th className="text-right">Future forecast · {unit}</th></tr></thead><tbody>{future.map(p => <tr key={p.date}><td className="p-2">{p.date}</td><td className="text-right font-mono">{format(p.forecast!)}</td></tr>)}</tbody></table></div></section>
    </>}
    {target === 'revenue' && <BusinessEvidence domain="revenue" />}
    <details className="abi-panel p-4"><summary>Model coverage and limitations</summary><p className="text-xs text-neutral-400 mt-3">Uses the existing saved Linear Regression model with ordered lag1, lag7, lag14, lag30, roll7 and roll30 features, recursively for 1–90 days. At least 30 consecutive daily observations are required. Date and applicable dimension filters select inference history; chart grain does not change daily model inputs. Dates continue from the selected historical endpoint, which may precede today. Predictions are uncertain estimates, not guaranteed results. No customer-volume or seller-delay model is registered. Revenue requires the existing commerce/BRL compatibility contract; arbitrary uploads are not assigned a currency.</p></details>
  </div>
}

export default function RevenueForecast({ target = 'revenue' }: { target?: ForecastTarget }) {
  const { active } = useDataset()
  return <div className="space-y-6"><FilterBar /><ForecastExperience key={`${active?.dataset_id}:${active?.updated_at}`} target={target} /></div>
}
export function OrderForecast() { return <RevenueForecast target="orders" /> }
