import { Link } from 'react-router-dom'

const features = [
  {
    title: 'Data warehouse',
    body: 'Upload structured datasets and explore verified metrics. The existing Olist reference warehouse is available alongside your datasets.',
  },
  {
    title: 'ML models',
    body: 'Sales forecasting, sales prediction, customer and product segmentation, and anomaly detection.',
  },
  {
    title: 'AI assistant',
    body: 'Natural-language insights over your own data, served by a local LLM through Ollama.',
  },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <header className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            AI-Powered Business Intelligence &amp; Predictive Analytics Platform
          </h1>
          <p className="text-neutral-400 mt-4">
            Semester 5 project integrating AI, Data Warehousing &amp; Mining, and Software Engineering.
            Analyze your uploaded datasets or explore the Olist reference.
          </p>
          <Link
            to="/login"
            className="inline-block mt-8 px-6 py-3 rounded bg-blue-600 hover:bg-blue-500 text-sm font-medium"
          >
            Sign in to open the dashboard
          </Link>
          <p className="text-xs text-neutral-500 mt-4">
            Local development accounts: <span className="text-neutral-400">admin / admin123</span> (business
            intelligence + platform administration) ·{' '}
            <span className="text-neutral-400">analyst / analyst123</span> (business intelligence)
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3 mt-16">
          {features.map((f) => (
            <div key={f.title} className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-5">
              <h2 className="font-semibold">{f.title}</h2>
              <p className="text-sm text-neutral-400 mt-2">{f.body}</p>
            </div>
          ))}
        </section>

        <p className="text-center text-xs text-neutral-500 mt-16">
          Analytics, reports and AI insights follow your active dataset. Existing trained ML models run when their input requirements are satisfied.
        </p>
      </div>
    </div>
  )
}
