import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import DatasetResults from '@/components/DatasetResults'

afterEach(cleanup)
describe('semantic analytics content', () => {
  it('renders observed student measures with neutral units', () => {
    render(<DatasetResults data={{ status: 'available', dataset_name: 'Students', metric_cards: [{ label: 'Average marks', value: 70 }] }} />)
    expect(screen.getByText('Average marks')).toBeVisible()
    expect(screen.getByText('70')).toBeVisible()
    expect(screen.queryByText(/R\$/)).not.toBeInTheDocument()
    expect(screen.queryByText(/customers/i)).not.toBeInTheDocument()
  })
  it('explains unavailable capabilities without displaying fake cards', () => {
    render(<DatasetResults data={{ status: 'not_applicable', reason: 'No delivery date field was confirmed.', metric_cards: [] }} />)
    expect(screen.getByRole('status')).toHaveTextContent('Not available for this dataset.')
    expect(screen.getByText('No delivery date field was confirmed.')).toBeVisible()
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })
  it('distinguishes zero matching rows from a missing measure', () => {
    render(<DatasetResults data={{ status: 'available', metric_cards: [{ label: 'Rows', value: 0 }, { label: 'Total value', value: null }] }} />)
    expect(screen.getByText('0')).toBeVisible()
    expect(screen.getByText('No observed values')).toBeVisible()
    expect(screen.getByRole('status')).toHaveTextContent('No rows match')
  })
  it('removes old dataset values when content switches', () => {
    const { rerender } = render(<DatasetResults data={{ status: 'available', dataset_name: 'A', metric_cards: [{ label: 'Total revenue', value: 1000 }] }} />)
    rerender(<DatasetResults data={{ status: 'available', dataset_name: 'B', metric_cards: [{ label: 'Total revenue', value: 5000 }] }} />)
    expect(screen.queryByText('1,000')).not.toBeInTheDocument()
    expect(screen.getByText('5,000')).toBeVisible()
  })
})
