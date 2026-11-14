import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export type AdminSession = {
  user: User
  isAdmin: boolean
}

type AuthContextValue = {
  session: AdminSession | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AdminSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function resolveAdminSession(user: User): Promise<void> {
      try {
        // Use maybeSingle — if RLS blocks it, it returns null (not an error)
        const { data, error } = await supabase
          .from('admins')
          .select('email')
          .eq('email', user.email ?? '')
          .maybeSingle()

        if (error) {
          // RLS blocked the query or table doesn't exist yet
          console.warn('[auth] admins check failed:', error.message)
          await supabase.auth.signOut()
          setSession(null)
          return
        }

        if (!data) {
          // Authenticated but not an admin
          await supabase.auth.signOut()
          setSession(null)
          return
        }

        setSession({ user, isAdmin: true })
      } catch (err) {
        console.error('[auth] unexpected error:', err)
        await supabase.auth.signOut()
        setSession(null)
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, supabaseSession) => {
      if (supabaseSession?.user) {
        await resolveAdminSession(supabaseSession.user)
      } else {
        setSession(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function signOut(): Promise<void> {
    await supabase.auth.signOut()
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (ctx === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}

export function ProtectedRoute() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <span
            className="block size-10 animate-spin rounded-full border-4 border-border border-t-cyan"
            aria-label="Loading…"
          />
          <p className="font-mono text-sm text-muted-foreground">Authenticating…</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (!session.isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-center px-6">
          <p className="font-display text-2xl font-bold text-pink">Access Denied</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Your account is not in the admins list. Add your email to the admins
            table in Supabase SQL Editor:
          </p>
          <code className="mt-2 rounded-lg bg-charcoal border border-border px-4 py-2 font-mono text-xs text-cyan">
            INSERT INTO admins (email) VALUES ('your@email.com');
          </code>
          <button
            onClick={() => supabase.auth.signOut()}
            className="mt-4 rounded-lg border border-border px-4 py-2 font-mono text-xs text-muted-foreground hover:text-pink hover:border-pink transition-all"
          >
            Sign out
          </button>
        </div>
      </div>
    )
  }

  return <Outlet />
}
