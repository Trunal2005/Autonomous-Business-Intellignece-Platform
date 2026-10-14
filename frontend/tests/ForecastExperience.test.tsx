import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { DatasetContext } from '@/hooks/useDataset'
import { ForecastExperience } from '@/pages/ml/RevenueForecast'
import { getForecast } from '@/services/api'
vi.mock('@/services/api', async original => ({ ...await original<typeof import('@/services/api')>(), getForecast: vi.fn() }))
vi.mock('@/components/BusinessEvidence', () => ({ default: () => null }))
vi.mock('@/components/ForecastChart', () => ({ default: ({ points }: { points: unknown[] }) => <div data-testid="chart">{JSON.stringify(points)}</div> }))
const filters = { date_to:'2025-01-30' }
vi.mock('@/hooks/useFilters', () => ({ useFilters: () => ({ filters }) }))
const dataset = { dataset_id:'a', dataset_name:'Fixture A', updated_at:'1', semantics:{currency_code:null} } as never
const response = (n: number) => ({ status:'available', history_tail:[{date:'2025-01-30',orders:11}], forecast:Array.from({length:n},(_,i)=>({date:new Date(Date.UTC(2025,0,31+i)).toISOString().slice(0,10),orders:20+i})) })
const wrapper = (id='a') => <MemoryRouter><DatasetContext.Provider value={{active:{...dataset,dataset_id:id},datasets:[],busy:false,reload:async()=>{},select:async()=>{}}}><ForecastExperience target="orders" /></DatasetContext.Provider></MemoryRouter>
beforeEach(() => { vi.mocked(getForecast).mockImplementation(async n => response(n!)) })
afterEach(() => {cleanup();vi.clearAllMocks()})
it('requests actual horizons with current filters and labels unavailable backtests', async () => {
  render(wrapper())
  await waitFor(() => expect(screen.getByTestId('chart')).toBeVisible())
  expect(getForecast).toHaveBeenCalledWith(30,'orders',filters)
  expect(screen.getByText(/No aligned out-of-sample/)).toBeVisible()
  fireEvent.change(screen.getByLabelText('Forecast horizon'), {target:{value:'7'}})
  await waitFor(() => expect(getForecast).toHaveBeenLastCalledWith(7,'orders',filters))
  await waitFor(() => expect(screen.getByText('Forecast total (7d)')).toBeVisible())
})
it('clears the prior dataset while pending and rejects late responses', async () => {
  const view=render(wrapper())
  await waitFor(() => expect(screen.getByTestId('chart')).toBeVisible())
  let resolve!: (value: ReturnType<typeof response>) => void
  vi.mocked(getForecast).mockReturnValueOnce(new Promise(done => {resolve=done}))
  view.rerender(wrapper('b'))
  expect(screen.queryByTestId('chart')).not.toBeInTheDocument()
  view.rerender(wrapper('c'))
  await waitFor(() => expect(screen.getByTestId('chart')).toBeVisible())
  resolve({ ...response(30), history_tail:[{date:'2025-01-30',orders:999999}] })
  await waitFor(() => expect(screen.getByTestId('chart')).not.toHaveTextContent('999999'))
})
it('does not draw invented data for not-applicable or inference errors', async () => {
  vi.mocked(getForecast).mockResolvedValueOnce({status:'not_applicable',reason:'Consecutive history missing',history_tail:[],forecast:[]})
  const view=render(wrapper())
  await waitFor(() => expect(screen.getByText('Consecutive history missing')).toBeVisible())
  expect(screen.queryByTestId('chart')).not.toBeInTheDocument()
  vi.mocked(getForecast).mockRejectedValueOnce(new Error('Artifact unavailable'))
  view.rerender(wrapper('b'))
  await waitFor(() => expect(screen.getByText('Artifact unavailable')).toBeVisible())
  expect(screen.queryByTestId('chart')).not.toBeInTheDocument()
})
