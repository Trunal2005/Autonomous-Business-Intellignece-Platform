import { useEffect, useState } from 'react'
import {
  getMlStatus,
  type MlFeature,
} from '@/services/api'
import { useFilters } from '@/hooks/useFilters'
import FilterBar from '@/components/FilterBar'

const statusColor: Record<string, string> = {
  available: 'text-emerald-400',
  integration: 'text-amber-400',
  failed: 'text-red-400',
  planned: 'text-neutral-500',
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-xs font-medium uppercase ${statusColor[status] ?? 'text-neutral-400'}`}>
      {status}
    </span>
  )
}

export default function MlMetrics() {
  const { filters } = useFilters()
  const [features, setFeatures] = useState<MlFeature[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    let current = true
    setState('loading')
    getMlStatus(filters)
      .then((s) => {
        if (!current) return
        setFeatures(s.features)
        setState('ready')
      })
      .catch(() => { if (current) setState('error') })
    return () => { current = false }
  }, [filters])

  if (state === 'loading') return <div className="text-neutral-400">Loading ML models…</div>
  if (state === 'error') {
    return (
      <div className="text-red-400">
        Could not load ML data. Ensure the backend is running and models are trained.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <FilterBar />
      <div>
        <h1 className="text-2xl font-semibold">ML Metrics</h1>
        <p className="text-sm text-neutral-500">
          Model catalog and offline evaluation metrics. Status reflects the availability of trained artifacts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((f) => (
          <div key={f.name} className="bg-neutral-900/60 p-4 rounded-lg border border-neutral-800">
            <div className="flex items-center justify-between mb-4">
              <div className="font-medium capitalize text-lg">{f.name.replace(/_/g, ' ')}</div>
              <StatusBadge status={f.status} />
            </div>

            <div className="space-y-4">
              {f.models.map((m) => (
                <div key={m.name} className="border-t border-neutral-800 pt-4 first:border-0 first:pt-0">
                  <div className="text-sm font-medium text-neutral-300 mb-1">{m.name.replace(/_/g, ' ')}</div>
                  <div className="text-xs text-neutral-500 mb-3">{m.algorithm || 'Algorithm pending'}</div>
                  <p className="text-xs text-neutral-400 mb-2">{m.metrics_scope}</p>
                  {m.compatibility && <div className="text-sm mb-3"><span className={m.compatibility.compatible ? 'text-emerald-400' : 'text-amber-400'}>{m.compatibility.compatible ? 'Compatible with active dataset' : 'Not Applicable to active dataset'}</span>{m.compatibility.reasons.map(reason => <p key={reason} className="text-xs text-neutral-400 mt-1">{reason}</p>)}</div>}

                  {m.metrics && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {Object.entries(m.metrics).map(([k, v]) => {
                        // Skip nested objects for simplicity in cards (like cluster_sizes, cluster_means)
                        if (typeof v === 'object' && v !== null) return null;

                        return (
                          <div key={k} className="bg-neutral-800/50 p-2 rounded">
                            <div className="text-[10px] text-neutral-500 uppercase tracking-wider">{k.replace(/_/g, ' ')}</div>
                            <div className="text-sm font-mono text-neutral-200">
                              {typeof v === 'number' ? Number.isInteger(v) ? v : v.toFixed(4) : String(v)}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  <div className="text-xs text-neutral-600 mt-3 flex justify-between">
                    <span>Artifact: {m.artifact_available ? 'Ready' : 'Missing'}</span>
                    {m.trained_at && <span>{new Date(m.trained_at).toLocaleDateString()}</span>}
                  </div>
                </div>
              ))}

              {f.models.length === 0 && (
                <div className="text-xs text-neutral-500 italic">No models registered yet</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
