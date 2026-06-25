export default function PublicDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 text-gray-900">
          IntegrateWise Continuity Bridge OS
        </h1>
        <p className="text-center text-gray-600 mb-12">
          Three-Spine Architecture: Human + AI + Collaboration
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold text-blue-600 mb-2">Human Spine (L1)</h3>
            <p className="text-sm text-gray-600">Your decisions, goals, outcomes. Ground truth.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
            <h3 className="text-lg font-semibold text-purple-600 mb-2">AI Spine (L3)</h3>
            <p className="text-sm text-gray-600">Reasoning traces, proposals, signals with confidence.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-amber-500">
            <h3 className="text-lg font-semibold text-amber-600 mb-2">Collaboration (L2)</h3>
            <p className="text-sm text-gray-600">Joint approvals, memory compounding, outcomes.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <h3 className="text-lg font-semibold text-green-600 mb-2">Governance (L4)</h3>
            <p className="text-sm text-gray-600">Approvals, compliance, audit trails.</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Unified Lifecycle</h2>
          <div className="flex items-center justify-between text-sm font-medium text-gray-700">
            <div className="text-center">
              <div className="bg-blue-100 text-blue-700 rounded-full px-4 py-2 mb-2">INTAKE</div>
              <p>Signal enters</p>
            </div>
            <div className="text-2xl text-gray-400">→</div>
            <div className="text-center">
              <div className="bg-indigo-100 text-indigo-700 rounded-full px-4 py-2 mb-2">PROMOTION</div>
              <p>Validates & ready</p>
            </div>
            <div className="text-2xl text-gray-400">→</div>
            <div className="text-center">
              <div className="bg-purple-100 text-purple-700 rounded-full px-4 py-2 mb-2">MEMORY</div>
              <p>Stored as truth</p>
            </div>
            <div className="text-2xl text-gray-400">→</div>
            <div className="text-center">
              <div className="bg-amber-100 text-amber-700 rounded-full px-4 py-2 mb-2">DECAY</div>
              <p>Aged & archived</p>
            </div>
            <div className="text-2xl text-gray-400">→</div>
            <div className="text-center">
              <div className="bg-green-100 text-green-700 rounded-full px-4 py-2 mb-2">CONTINUITY</div>
              <p>Outcome stored</p>
            </div>
          </div>
        </div>

        <div className="bg-indigo-50 rounded-lg border border-indigo-200 p-6 mb-8">
          <h3 className="text-xl font-bold text-indigo-900 mb-2">Design Philosophy</h3>
          <p className="text-indigo-800">
            "Thinks in context. Waits for approvals."
          </p>
          <p className="text-sm text-indigo-700 mt-2">
            All three spines flow through the same lifecycle. Human goals + AI reasoning + Joint approvals = Compounded outcomes.
          </p>
        </div>

        <div className="text-center">
          <div className="inline-block bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-4 rounded-lg font-semibold">
            ✓ Deployed on Vercel
          </div>
          <p className="text-gray-600 mt-4 text-sm">
            Services: Cloudflare Workers (Gateway, Spine, Twin, Governance)<br/>
            Database: Supabase PostgreSQL<br/>
            Frontend: Next.js 16 + React 19.2
          </p>
        </div>
      </div>
    </div>
  )
}
