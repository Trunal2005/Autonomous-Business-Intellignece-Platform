import type { ForecastPoint } from './api'

export type ForecastTarget = 'orders' | 'revenue'
export interface ChartPoint { time: number; date: string; historical: number | null; forecast: number | null }
const DAY = 86400000

/** Fail closed rather than invent zeros, deduplicate ambiguously or align by index. */
export function forecastPoints(history: ForecastPoint[], future: ForecastPoint[], target: ForecastTarget): ChartPoint[] {
  const seen = new Set<string>()
  const convert = (points: ForecastPoint[], kind: 'historical' | 'forecast') => points.map(point => {
    const time = Date.parse(`${point.date}T00:00:00Z`), value = point[target]
    if (!/^\d{4}-\d{2}-\d{2}$/.test(point.date) || !Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== point.date || typeof value !== 'number' || !Number.isFinite(value) || seen.has(point.date)) {
      throw new Error('Forecast response contains duplicate dates, missing values or invalid observations. No chart was drawn.')
    }
    seen.add(point.date)
    return { time, date: point.date, historical: kind === 'historical' ? value : null, forecast: kind === 'forecast' ? value : null }
  }).sort((a, b) => a.time - b.time)
  const actual = convert(history, 'historical'), predicted = convert(future, 'forecast')
  if (!actual.length || !predicted.length) throw new Error('No historical and future observations are available for this selection.')
  if (actual.some((p, i) => i > 0 && p.time !== actual[i - 1].time + DAY)) throw new Error('Historical daily observations contain gaps; no missing date was filled with zero.')
  if (predicted[0].time !== actual[actual.length - 1].time + DAY || predicted.some((p, i) => i > 0 && p.time !== predicted[i - 1].time + DAY)) throw new Error('Forecast dates do not follow the historical boundary at daily intervals.')
  return [...actual, ...predicted]
}

export const forecastDate = (time: number) => new Date(time).toISOString().slice(0, 10)
export function forecastNumber(value: number, target: ForecastTarget, currency?: string | null) {
  return target === 'revenue' && currency
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(value)
    : value.toLocaleString('en-US', { maximumFractionDigits: 2 })
}
