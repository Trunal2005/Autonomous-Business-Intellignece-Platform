import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import WarehouseQueryPanel from '@/components/WarehouseQueryPanel'
import { getWarehouseQueries, type WarehouseQueryEvidence } from '@/services/api'

vi.mock('@/services/api', () => ({ getWarehouseQueries: vi.fn() }))
afterEach(() => { cleanup(); vi.clearAllMocks() })
const evidence: WarehouseQueryEvidence = {
  dataset_id: 'fixture', dataset_name: 'Synthetic fixture', report: 'monthly_revenue',
  title: 'Monthly revenue and orders', executed_at: '2026-10-26T10:00:00Z', elapsed_ms: 3,
  status: 'executed', reason: null,
  queries: [{ sql: 'SELECT SUM(c1) FROM dataset_fixture WHERE c0 >= ?', parameters: ['2025-01-01'], execution_ms: 1 }],
  rows: [{ period: '2025-01', revenue: 190 }],
  column_mappings: [{ table: 'dataset_fixture', source: 'items.csv', columns: [{ stored: 'c1', original: 'price' }] }],
}

it('runs on demand and shows returned SQL, bindings, source mapping and actual result', async () => {
  vi.mocked(getWarehouseQueries).mockResolvedValue(evidence)
  render(<WarehouseQueryPanel />)
  expect(getWarehouseQueries).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Run and show SQL' }))
  expect(await screen.findByText(evidence.queries[0].sql)).toBeVisible()
  expect(getWarehouseQueries).toHaveBeenCalledWith('monthly_revenue')
  expect(screen.getByText('190')).toBeVisible()
  expect(screen.getByText(/2025-01-01/)).toBeVisible()
  fireEvent.click(screen.getByText('Table and column names used in SQL'))
  expect(screen.getByText('price')).toBeVisible()
  fireEvent.change(screen.getByLabelText('Warehouse SQL report'), { target: { value: 'orders_by_status' } })
  expect(screen.queryByText(evidence.queries[0].sql)).not.toBeInTheDocument()
})

it('shows an honest unsupported-field response and a real request error', async () => {
  vi.mocked(getWarehouseQueries).mockResolvedValue({ ...evidence, status: 'not_applicable', reason: 'No confirmed status field.', rows: [], queries: [] })
  render(<WarehouseQueryPanel />)
  fireEvent.click(screen.getByRole('button', { name: 'Run and show SQL' }))
  expect(await screen.findByText('No confirmed status field.')).toBeVisible()
  expect(screen.queryByText('Executed SQL 1')).not.toBeInTheDocument()
  vi.mocked(getWarehouseQueries).mockRejectedValue(new Error('Selected dataset changed.'))
  fireEvent.click(screen.getByRole('button', { name: 'Run and show SQL' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Selected dataset changed.')
  expect(screen.queryByText('No confirmed status field.')).not.toBeInTheDocument()
})

it('does not display an old dataset result after the page is unmounted', async () => {
  let finish!: (value: WarehouseQueryEvidence) => void
  vi.mocked(getWarehouseQueries).mockReturnValueOnce(new Promise(resolve => { finish = resolve }))
  const view = render(<WarehouseQueryPanel />)
  fireEvent.click(screen.getByRole('button', { name: 'Run and show SQL' }))
  view.unmount()
  render(<WarehouseQueryPanel />)
  finish(evidence)
  expect(screen.queryByText(evidence.queries[0].sql)).not.toBeInTheDocument()
})
