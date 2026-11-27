import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { toast } from 'sonner'
import { Loader2, Shield, AlertTriangle } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        toast.error(error.message)
      } else {
        navigate('/')
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden px-4">
      {/* Neon gradient blobs */}
      <div
        className="pointer-events-none absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-20 blur-[120px]"
        style={{ background: 'oklch(0.8 0.15 220)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full opacity-15 blur-[120px]"
        style={{ background: 'oklch(0.64 0.26 0)' }}
      />

      {/* Setup warning banner */}
      {!isSupabaseConfigured && (
        <div className="relative z-10 w-full max-w-md mb-6 flex items-start gap-3 rounded-xl border border-yellow/40 bg-yellow/10 px-4 py-3">
          <AlertTriangle size={16} className="text-yellow mt-0.5 shrink-0" />
          <div>
            <p className="font-mono text-xs text-yellow font-semibold tracking-wide">Supabase not configured</p>
            <p className="font-mono text-xs text-yellow/80 mt-1 leading-relaxed">
              Open <code className="bg-yellow/20 px-1 rounded">backend/.env</code> and replace the placeholder values with your real Supabase URL and anon key, then restart the server.
            </p>
          </div>
        </div>
      )}

      {/* Card */}
      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-5xl font-black tracking-widest text-white mb-2">
            GENZONE
          </h1>
          <p className="font-mono text-cyan text-sm tracking-[0.3em] uppercase">
            Admin Portal
          </p>
        </div>

        {/* Form card */}
        <div className="bg-charcoal border border-border rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
            <Shield size={16} className="text-cyan" />
            <span className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
              Restricted Access
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block font-mono text-xs text-muted-foreground uppercase tracking-widest mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@genzone.in"
                className="w-full bg-background border border-border rounded-lg px-4 py-3 text-white placeholder-muted-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block font-mono text-xs text-muted-foreground uppercase tracking-widest mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-background border border-border rounded-lg px-4 py-3 text-white placeholder-muted-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full relative overflow-hidden rounded-lg py-3 px-6 font-mono text-sm font-semibold tracking-widest uppercase text-black transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed group"
              style={{
                background: 'linear-gradient(135deg, oklch(0.8 0.15 220), oklch(0.64 0.26 0))',
              }}
            >
              <span
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: 'linear-gradient(135deg, oklch(0.88 0.18 92), oklch(0.8 0.15 220))',
                }}
              />
              <span className="relative flex items-center justify-center gap-2">
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? 'Signing in…' : 'Sign In'}
              </span>
            </button>
          </form>
        </div>

        {/* Footer note */}
        <p className="text-center font-mono text-xs text-muted-foreground mt-6 tracking-wider">
          GenZone Admin — Restricted Access
        </p>
      </div>
    </div>
  )
}
