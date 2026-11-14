import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  Calendar,
  Images,
  Users,
  MessageSquare,
  CheckCircle,
  Plus,
  Upload,
  UserPlus,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Stats {
  events: number
  publishedEvents: number
  gallery: number
  panel: number
  feedback: number
}

interface FeedbackEntry {
  id: string
  kind: string
  name: string | null
  email: string | null
  message: string
  created_at: string
}

function StatCard({
  icon,
  label,
  value,
  accent,
  loading,
}: {
  icon: React.ReactNode
  label: string
  value: number
  accent: 'cyan' | 'pink' | 'yellow'
  loading: boolean
}) {
  const accentClass = {
    cyan: 'text-cyan',
    pink: 'text-pink',
    yellow: 'text-yellow',
  }[accent]

  const borderClass = {
    cyan: 'border-cyan/20',
    pink: 'border-pink/20',
    yellow: 'border-yellow/20',
  }[accent]

  const bgClass = {
    cyan: 'bg-cyan/5',
    pink: 'bg-pink/5',
    yellow: 'bg-yellow/5',
  }[accent]

  if (loading) {
    return (
      <div className="bg-charcoal border border-border rounded-2xl p-6 animate-pulse">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-lg bg-border" />
          <div className="w-16 h-4 rounded bg-border" />
        </div>
        <div className="w-12 h-9 rounded bg-border mb-1" />
        <div className="w-24 h-3 rounded bg-border" />
      </div>
    )
  }

  return (
    <div
      className={`bg-charcoal border ${borderClass} ${bgClass} rounded-2xl p-6 transition-all hover:scale-[1.02] hover:shadow-xl`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`${accentClass} opacity-80`}>{icon}</div>
      </div>
      <div className={`font-display text-4xl font-black ${accentClass} mb-1`}>{value}</div>
      <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest">{label}</div>
    </div>
  )
}

function KindBadge({ kind }: { kind: string }) {
  const map: Record<string, string> = {
    Idea: 'text-cyan border-cyan/40 bg-cyan/10',
    Feedback: 'text-pink border-pink/40 bg-pink/10',
    Collab: 'text-yellow border-yellow/40 bg-yellow/10',
    Other: 'text-muted-foreground border-border bg-border/20',
  }
  const cls = map[kind] ?? map['Other']
  return (
    <span className={`font-mono text-[10px] uppercase tracking-widest border rounded-full px-2 py-0.5 ${cls}`}>
      {kind}
    </span>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    events: 0,
    publishedEvents: 0,
    gallery: 0,
    panel: 0,
    feedback: 0,
  })
  const [recentFeedback, setRecentFeedback] = useState<FeedbackEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const [
        { count: eventsTotal },
        { count: eventsPublished },
        { count: galleryCount },
        { count: panelCount },
        { count: feedbackCount },
        { data: feedbackRows },
      ] = await Promise.all([
        supabase.from('events').select('*', { count: 'exact', head: true }),
        supabase.from('events').select('*', { count: 'exact', head: true }).eq('is_published', true),
        supabase.from('gallery').select('*', { count: 'exact', head: true }),
        supabase.from('panel_members').select('*', { count: 'exact', head: true }),
        supabase.from('feedback').select('*', { count: 'exact', head: true }),
        supabase.from('feedback').select('*').order('created_at', { ascending: false }).limit(3),
      ])
      setStats({
        events: eventsTotal ?? 0,
        publishedEvents: eventsPublished ?? 0,
        gallery: galleryCount ?? 0,
        panel: panelCount ?? 0,
        feedback: feedbackCount ?? 0,
      })
      setRecentFeedback((feedbackRows as FeedbackEntry[]) ?? [])
      setLoading(false)
    }
    fetchData()
  }, [])

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="font-display text-4xl font-black text-white tracking-tight mb-1">
          Welcome back.
        </h1>
        <p className="font-mono text-sm text-muted-foreground">
          Here's what's happening in GenZone.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          icon={<Calendar size={24} />}
          label="Total Events"
          value={stats.events}
          accent="cyan"
          loading={loading}
        />
        <StatCard
          icon={<CheckCircle size={24} />}
          label="Published"
          value={stats.publishedEvents}
          accent="pink"
          loading={loading}
        />
        <StatCard
          icon={<Images size={24} />}
          label="Gallery"
          value={stats.gallery}
          accent="pink"
          loading={loading}
        />
        <StatCard
          icon={<Users size={24} />}
          label="Members"
          value={stats.panel}
          accent="yellow"
          loading={loading}
        />
        <StatCard
          icon={<MessageSquare size={24} />}
          label="Feedback"
          value={stats.feedback}
          accent="cyan"
          loading={loading}
        />
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-4">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/events"
            className="flex items-center gap-2 bg-charcoal border border-cyan/30 hover:border-cyan text-cyan font-mono text-sm px-5 py-3 rounded-xl transition-all hover:bg-cyan/10"
          >
            <Plus size={16} />
            Add Event
          </Link>
          <Link
            to="/gallery"
            className="flex items-center gap-2 bg-charcoal border border-pink/30 hover:border-pink text-pink font-mono text-sm px-5 py-3 rounded-xl transition-all hover:bg-pink/10"
          >
            <Upload size={16} />
            Upload Photos
          </Link>
          <Link
            to="/panel"
            className="flex items-center gap-2 bg-charcoal border border-yellow/30 hover:border-yellow text-yellow font-mono text-sm px-5 py-3 rounded-xl transition-all hover:bg-yellow/10"
          >
            <UserPlus size={16} />
            Add Member
          </Link>
        </div>
      </div>

      {/* Recent feedback */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
            Recent Feedback
          </h2>
          <Link
            to="/feedback"
            className="font-mono text-xs text-cyan hover:underline"
          >
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-charcoal border border-border rounded-xl p-4 animate-pulse">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-14 h-4 rounded bg-border" />
                  <div className="w-24 h-4 rounded bg-border" />
                </div>
                <div className="w-full h-3 rounded bg-border" />
              </div>
            ))}
          </div>
        ) : recentFeedback.length === 0 ? (
          <div className="bg-charcoal border border-border rounded-xl p-8 text-center">
            <MessageSquare size={32} className="text-muted-foreground mx-auto mb-2" />
            <p className="font-mono text-sm text-muted-foreground">No feedback yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentFeedback.map((fb) => (
              <Link
                to="/feedback"
                key={fb.id}
                className="block bg-charcoal border border-border hover:border-cyan/30 rounded-xl p-4 transition-all"
              >
                <div className="flex items-center gap-3 mb-1.5">
                  <KindBadge kind={fb.kind} />
                  <span className="font-mono text-xs text-white">{fb.name ?? 'Anonymous'}</span>
                  <span className="font-mono text-xs text-muted-foreground ml-auto">
                    {formatDistanceToNow(new Date(fb.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="font-mono text-xs text-muted-foreground truncate">
                  {fb.message.slice(0, 100)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
