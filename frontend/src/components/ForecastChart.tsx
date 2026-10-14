import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { forecastDate, type ChartPoint } from '@/services/forecast'

export default function ForecastChart({ points, format, unit }: { points: ChartPoint[]; format: (value: number) => string; unit: string }) {
  const actual = points.filter(p => p.historical !== null)
  const lastActual = actual[actual.length - 1]
  const firstForecast = points.find(p => p.forecast !== null)!
  return <section className="abi-panel p-5 min-w-0" aria-label="Historical and future forecast chart">
    <h2 className="font-medium">Historical actuals and future forecast</h2>
    <p className="text-xs text-neutral-400 mt-1 mb-5">Daily {unit}. Actuals end {lastActual.date}; future predictions begin {firstForecast.date}. Dashed line: trained model output.</p>
    <div data-testid="forecast-chart" data-history-end={lastActual.date} data-forecast-start={firstForecast.date} data-forecast-points={points.filter(p => p.forecast !== null).length}>
      <ResponsiveContainer width="100%" height={350}><LineChart data={points} margin={{ top: 25, right: 24, left: 12, bottom: 10 }}>
        <CartesianGrid stroke="rgb(var(--border))" strokeDasharray="3 3" vertical={false} />
        <XAxis type="number" dataKey="time" domain={['dataMin', 'dataMax']} tickFormatter={forecastDate} minTickGap={65} stroke="rgb(var(--muted))" fontSize={11} />
        <YAxis width={85} tickFormatter={v => Number(v).toLocaleString('en-US', { notation: 'compact' })} stroke="rgb(var(--muted))" fontSize={11} />
        <Tooltip labelFormatter={value => forecastDate(Number(value))} formatter={(value: number, name: string) => [format(value), name]} contentStyle={{ background: 'rgb(var(--surface-raised))', border: '1px solid rgb(var(--border))' }} />
        <Legend />
        <ReferenceLine x={(lastActual.time + firstForecast.time) / 2} stroke="rgb(var(--muted))" strokeDasharray="3 3" label={{ value: 'Future →', position: 'insideTopRight', fill: 'rgb(var(--muted))', fontSize: 11 }} />
        <Line dataKey="historical" name="Historical actual" stroke="var(--chart-1)" strokeWidth={2} dot={{ r: 2 }} isAnimationActive={false} />
        <Line dataKey="forecast" name="Future forecast" stroke="var(--chart-3)" strokeWidth={2} strokeDasharray="6 4" dot={{ r: 2 }} isAnimationActive={false} />
      </LineChart></ResponsiveContainer>
    </div>
  </section>
}
