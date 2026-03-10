export default function ClientLoading() {
  return (
    <div className="min-h-screen px-5 md:px-8 pt-20 pb-16" style={{ background: '#080808' }}>
      <div className="max-w-6xl mx-auto">

        {/* Header skeleton */}
        <div className="flex items-center gap-3 pt-4 mb-7">
          <div className="skeleton w-10 h-10 rounded-full" />
          <div className="space-y-2">
            <div className="skeleton h-4 w-36 rounded" />
            <div className="skeleton h-3 w-24 rounded" />
          </div>
          <div className="skeleton h-6 w-20 rounded-full ml-2" />
        </div>

        {/* Row 1: Wealth Wallet + Wellness */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
          {/* Wealth Wallet card */}
          <div
            className="lg:col-span-3 rounded-2xl p-6 space-y-5"
            style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="skeleton h-3 w-20 rounded" />
            {/* Total value */}
            <div className="space-y-2">
              <div className="skeleton h-3 w-24 rounded" />
              <div className="skeleton h-8 w-48 rounded" />
              <div className="skeleton h-3 w-32 rounded" />
            </div>
            {/* Donut + bars */}
            <div className="flex items-center gap-4">
              <div className="skeleton w-36 h-36 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-3">
                {[80, 65, 45, 30, 20].map((w, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between">
                      <div className="skeleton h-2.5 rounded" style={{ width: `${w * 0.6}%` }} />
                      <div className="skeleton h-2.5 w-8 rounded" />
                    </div>
                    <div className="skeleton h-1.5 rounded-full" style={{ width: `${w}%` }} />
                  </div>
                ))}
              </div>
            </div>
            {/* Positions */}
            <div className="space-y-2 pt-2">
              <div className="skeleton h-2.5 w-20 rounded" />
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex justify-between py-1">
                  <div className="skeleton h-3 w-32 rounded" />
                  <div className="skeleton h-3 w-16 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Wellness Scorecard */}
          <div
            className="lg:col-span-2 rounded-2xl p-6 space-y-5"
            style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="skeleton h-3 w-24 rounded" />
            {/* Gauge */}
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="skeleton w-40 h-20 rounded-xl" />
              <div className="skeleton h-4 w-20 rounded" />
              <div className="skeleton h-3 w-32 rounded" />
            </div>
            <div className="h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
            {/* Sub-scores */}
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between">
                  <div className="skeleton h-3 w-24 rounded" />
                  <div className="skeleton h-3 w-12 rounded" />
                </div>
                <div className="skeleton h-1.5 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Row 2: Score Breakdown */}
        <div
          className="rounded-2xl p-6 space-y-4"
          style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="skeleton h-3 w-28 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="rounded-xl p-4 space-y-3"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="skeleton w-7 h-7 rounded-lg" />
                    <div className="space-y-1">
                      <div className="skeleton h-3 w-20 rounded" />
                      <div className="skeleton h-2.5 w-12 rounded" />
                    </div>
                  </div>
                  <div className="skeleton h-6 w-8 rounded" />
                </div>
                <div className="skeleton h-1 rounded-full" />
                <div className="skeleton h-3 rounded" />
                <div className="skeleton h-3 w-4/5 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
