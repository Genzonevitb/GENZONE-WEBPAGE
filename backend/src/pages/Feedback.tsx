import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { MessageSquare, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import ConfirmDialog from '@/components/ConfirmDialog'

interface FeedbackEntry {
  id: string
  kind: string
  name: string | null
  email: string | null
  message: string
  created_at: string
}

const KINDS = ['All', 'Idea', 'Feedback', 'Collab', 'Other']

function KindBadge({ kind }: { kind: string }) {
  const map: Record<string, string> = {
    Idea: 'text-cyan border-cyan/40 bg-cyan/10',
    Feedback: 'text-pink border-pink/40 bg-pink/10',
    Collab: 'text-yellow border-yellow/40 bg-yellow/10',
    Other: 'text-muted-foreground border-border bg-border/20',
  }
  const cls = map[kind] ?? map['Other']
  return (
    <span className={`font-mono text-[10px] uppercase tracking-widest border rounded-full px-2 py-0.5 whitespace-nowrap ${cls}`}>
      {kind}
    </span>
  )
}

function RowSkeleton() {
  return (
    <div className="bg-charcoal border border-border rounded-xl p-4 animate-pulse">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-16 h-4 rounded bg-border" />
        <div className="w-28 h-4 rounded bg-border" />
        <div className="w-20 h-3 rounded bg-border ml-auto" />
      </div>
      <div className="w-full h-3 rounded bg-border" />
    </div>
  )
}

export default function Feedback() {
  const [entries, setEntries] = useState<FeedbackEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filterKind, setFilterKind] = useState('All')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<FeedbackEntry | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function fetchEntries() {
    setLoading(true)
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) toast.error(error.message)
    else setEntries((data as FeedbackEntry[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchEntries() }, [])

  const filtered =
    filterKind === 'All' ? entries : entries.filter((e) => e.kind === filterKind)

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const { error } = await supabase.from('feedback').delete().eq('id', deleteTarget.id)
      if (error) throw error
      toast.success('Message deleted.')
      if (expanded === deleteTarget.id) setExpanded(null)
      setDeleteTarget(null)
      await fetchEntries()
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to delete message.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-black text-white tracking-tight">Feedback</h1>
        <p className="font-mono text-sm text-muted-foreground mt-1">
          Messages from the public site feedback form.
        </p>
      </div>

      {/* Kind filter */}
      <div className="flex flex-wrap gap-2">
        {KINDS.map((kind) => (
          <button
            key={kind}
            onClick={() => setFilterKind(kind)}
            className={`font-mono text-xs px-3 py-1.5 rounded-full border transition-all ${
              filterKind === kind
                ? 'border-cyan text-cyan bg-cyan/10'
                : 'border-border text-muted-foreground hover:border-cyan/40 hover:text-white'
            }`}
          >
            {kind}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)
        ) : filtered.length === 0 ? (
          <div className="bg-charcoal border border-border rounded-2xl p-16 text-center">
            <MessageSquare size={40} className="text-muted-foreground mx-auto mb-3" />
            <p className="font-mono text-sm text-muted-foreground">
              {entries.length === 0
                ? 'No messages yet. The feedback form on the site will send messages here.'
                : `No ${filterKind.toLowerCase()} messages.`}
            </p>
          </div>
        ) : (
          filtered.map((entry) => {
            const isOpen = expanded === entry.id
            return (
              <div
                key={entry.id}
                className="bg-charcoal border border-border hover:border-cyan/20 rounded-xl overflow-hidden transition-all"
              >
                {/* Row header */}
                <button
                  onClick={() => setExpanded(isOpen ? null : entry.id)}
                  className="w-full text-left px-4 py-3 flex items-center gap-3"
                >
                  <KindBadge kind={entry.kind} />
                  <span className="font-mono text-xs text-white shrink-0">
                    {entry.name ?? 'Anonymous'}
                  </span>
                  {entry.email && (
                    <span className="font-mono text-xs text-muted-foreground hidden md:block truncate">
                      {entry.email}
                    </span>
                  )}
                  <span className="font-mono text-xs text-muted-foreground/60 ml-auto shrink-0">
                    {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                  </span>
                  <span className="text-muted-foreground shrink-0 ml-1">
                    {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </span>
                </button>

                {/* Preview (collapsed) */}
                {!isOpen && (
                  <div className="px-4 pb-3">
                    <p className="font-mono text-xs text-muted-foreground truncate">
                      {entry.message.slice(0, 80)}{entry.message.length > 80 ? '…' : ''}
                    </p>
                  </div>
                )}

                {/* Expanded message */}
                {isOpen && (
                  <div className="px-4 pb-4 border-t border-border/50 pt-3 space-y-3">
                    {entry.email && (
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                          Email:
                        </span>
                        <a
                          href={`mailto:${entry.email}`}
                          className="font-mono text-xs text-cyan hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {entry.email}
                        </a>
                      </div>
                    )}
                    <p className="font-mono text-sm text-white whitespace-pre-wrap leading-relaxed">
                      {entry.message}
                    </p>
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteTarget(entry)
                        }}
                        className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-pink hover:bg-pink/10 px-3 py-1.5 rounded-lg transition-all border border-transparent hover:border-pink/30"
                      >
                        <Trash2 size={13} />
                        Delete
                      </button>
                    </div>
                  </div>
                )}

                {/* Delete button on row (collapsed) */}
                {!isOpen && (
                  <div className="absolute top-3 right-3 hidden" />
                )}
              </div>
            )
          })
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Message?"
        description="This will permanently delete this feedback message. This action cannot be undone."
        confirmLabel="Delete Message"
      />
    </div>
  )
}
