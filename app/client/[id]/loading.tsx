export default function ClientLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#080808' }}>
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'rgba(201,162,39,0.3)', borderTopColor: '#C9A227' }}
        />
        <p className="text-sm text-white/40">Loading your dashboard…</p>
      </div>
    </div>
  )
}
