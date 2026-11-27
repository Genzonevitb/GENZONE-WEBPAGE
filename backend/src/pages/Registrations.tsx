import { useEffect, useState, useCallback, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import {
  ClipboardList,
  Search,
  Download,
  Trash2,
  Loader2,
  Users,
  ChevronDown,
} from 'lucide-react'
import ConfirmDialog from '@/components/ConfirmDialog'

interface Event {
  id: string
  title: string
  max_seats: number | null
  registration_open: boolean
}

interface FormField {
  id: string
  label: string
  type: string
  sort_order: number
}

interface Registration {
  id: string
  event_id: string
  answers: Record<string, string | string[]>
  respondent_email: string | null
  created_at: string
}

export default function Registrations() {
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [fields, setFields] = useState<FormField[]>([])
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [eventsLoading, setEventsLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<Registration | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Load events list
  useEffect(() => {
    supabase
      .from('events')
      .select('id, title, max_seats, registration_open')
      .order('event_date', { ascending: false })
      .then(({ data, error }) => {
        if (error) toast.error(error.message)
        else setEvents((data as Event[]) ?? [])
        setEventsLoading(false)
      })
  }, [])

  // Load fields + registrations when event selected
  const loadEventData = useCallback(async (eventId: string) => {
    if (!eventId) return
    setLoading(true)
    setFields([])
    setRegistrations([])

    const [fieldsRes, regsRes] = await Promise.all([
      supabase
        .from('event_form_fields')
        .select('id, label, type, sort_order')
        .eq('event_id', eventId)
        .order('sort_order'),
      supabase
        .from('event_registrations')
        .select('id, event_id, answers, respondent_email, created_at')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false }),
    ])

    if (fieldsRes.error) toast.error(fieldsRes.error.message)
    else setFields((fieldsRes.data as FormField[]) ?? [])

    if (regsRes.error) toast.error(regsRes.error.message)
    else setRegistrations((regsRes.data as Registration[]) ?? [])

    setLoading(false)
  }, [])

  useEffect(() => {
    if (selectedEventId) loadEventData(selectedEventId)
  }, [selectedEventId, loadEventData])

  const selectedEvent = events.find((e) => e.id === selectedEventId)

  // Filter rows by search
  const filtered = registrations.filter((r) => {
    if (!search.trim()) return true
    const searchLower = search.toLowerCase()
    return (
      (r.respondent_email ?? '').toLowerCase().includes(searchLower) ||
      Object.values(r.answers).some((v) => {
        const str = Array.isArray(v) ? v.join(' ') : (v ?? '')
        return str.toLowerCase().includes(searchLower)
      })
    )
  })

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const { error } = await supabase
      .from('event_registrations')
      .delete()
      .eq('id', deleteTarget.id)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Registration deleted.')
      setRegistrations((prev) => prev.filter((r) => r.id !== deleteTarget.id))
      setDeleteTarget(null)
    }
    setDeleting(false)
  }

  function downloadCSV() {
    if (!filtered.length) return
    const headers = [...fields.map((f) => f.label), 'Email', 'Submitted At']
    const rows = filtered.map((r) => [
      ...fields.map((f) => {
        const a = r.answers[f.id]
        return Array.isArray(a) ? a.join('; ') : (a ?? '')
      }),
      r.respondent_email ?? '',
      new Date(r.created_at).toLocaleString('en-IN'),
    ])
    const csv = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      )
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `registrations-${selectedEvent?.title ?? 'export'}-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function cellValue(reg: Registration, field: FormField) {
    const v = reg.answers[field.id]
    if (v === undefined || v === null) return '—'
    if (Array.isArray(v)) return v.length > 0 ? v.join(', ') : '—'
    return String(v) || '—'
  }

  const seatsLeft =
    selectedEvent?.max_seats != null
      ? selectedEvent.max_seats - registrations.length
      : null

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-black text-white tracking-tight">
            Registrations
          </h1>
          <p className="font-mono text-sm text-muted-foreground mt-1">
            View and manage event registrations.
          </p>
        </div>
        {selectedEventId && filtered.length > 0 && (
          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 bg-cyan/10 border border-cyan/40 hover:border-cyan text-cyan font-mono text-sm px-4 py-2.5 rounded-xl transition-all hover:bg-cyan/20"
          >
            <Download size={15} />
            Download CSV
          </button>
        )}
      </div>

      {/* Event selector */}
      <div className="bg-charcoal border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <select
              value={selectedEventId}
              onChange={(e) => { setSelectedEventId(e.target.value); setSearch('') }}
              className="w-full appearance-none bg-background border border-border rounded-xl px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan transition-all pr-9"
            >
              <option value="">— Select an event —</option>
              {eventsLoading ? (
                <option disabled>Loading…</option>
              ) : (
                events.map((e) => (
                  <option key={e.id} value={e.id}>{e.title}</option>
                ))
              )}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>

          {selectedEventId && (
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search responses…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan transition-all"
              />
            </div>
          )}
        </div>

        {/* Stats bar */}
        {selectedEventId && !loading && (
          <div className="flex items-center gap-6 flex-wrap">
            <StatPill
              icon={<Users size={13} />}
              label="Total Responses"
              value={String(registrations.length)}
              color="cyan"
            />
            {seatsLeft !== null && (
              <StatPill
                icon={<ClipboardList size={13} />}
                label="Seats Left"
                value={String(Math.max(0, seatsLeft))}
                color={seatsLeft <= 0 ? 'pink' : 'yellow'}
              />
            )}
            <StatPill
              icon={<span className="w-2 h-2 rounded-full inline-block" style={{ background: selectedEvent?.registration_open ? 'oklch(0.8 0.15 220)' : 'oklch(0.64 0.26 0)' }} />}
              label="Status"
              value={selectedEvent?.registration_open ? 'Open' : 'Closed'}
              color={selectedEvent?.registration_open ? 'cyan' : 'pink'}
            />
          </div>
        )}
      </div>

      {/* Table */}
      {!selectedEventId ? (
        <div className="bg-charcoal border border-border rounded-2xl p-16 text-center">
          <ClipboardList size={36} className="text-muted-foreground mx-auto mb-4" />
          <p className="font-mono text-sm text-muted-foreground">Select an event to view registrations.</p>
        </div>
      ) : loading ? (
        <div className="bg-charcoal border border-border rounded-2xl p-16 flex justify-center">
          <Loader2 size={28} className="animate-spin text-cyan" />
        </div>
      ) : fields.length === 0 ? (
        <div className="bg-charcoal border border-border rounded-2xl p-16 text-center">
          <p className="font-mono text-sm text-muted-foreground">
            No form fields configured for this event yet. Add fields in the Registration Form tab of the Events page.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-charcoal border border-border rounded-2xl p-16 text-center">
          <p className="font-mono text-sm text-muted-foreground">
            {registrations.length === 0 ? 'No registrations yet.' : 'No results match your search.'}
          </p>
        </div>
      ) : (
        <div className="bg-charcoal border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left font-mono text-[10px] text-muted-foreground uppercase tracking-widest whitespace-nowrap">
                    #
                  </th>
                  {fields.map((f) => (
                    <th
                      key={f.id}
                      className="px-4 py-3 text-left font-mono text-[10px] text-muted-foreground uppercase tracking-widest whitespace-nowrap max-w-[160px]"
                    >
                      {f.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left font-mono text-[10px] text-muted-foreground uppercase tracking-widest whitespace-nowrap">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] text-muted-foreground uppercase tracking-widest whitespace-nowrap">
                    Submitted At
                  </th>
                  <th className="px-4 py-3 font-mono text-[10px] text-muted-foreground uppercase tracking-widest" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((reg, idx) => (
                  <tr
                    key={reg.id}
                    className="border-b border-border/50 hover:bg-background/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{idx + 1}</td>
                    {fields.map((f) => (
                      <td
                        key={f.id}
                        className="px-4 py-3 font-mono text-xs text-white max-w-[160px] truncate"
                        title={cellValue(reg, f)}
                      >
                        {cellValue(reg, f)}
                      </td>
                    ))}
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground max-w-[160px] truncate">
                      {reg.respondent_email ?? '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(reg.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setDeleteTarget(reg)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-pink hover:bg-pink/10 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Registration?"
        description="Are you sure you want to permanently delete this registration? This cannot be undone."
        confirmLabel="Delete"
      />
    </div>
  )
}

function StatPill({
  icon,
  label,
  value,
  color,
}: {
  icon: ReactNode
  label: string
  value: string
  color: 'cyan' | 'pink' | 'yellow'
}) {
  const colorMap = {
    cyan: 'text-cyan bg-cyan/10 border-cyan/30',
    pink: 'text-pink bg-pink/10 border-pink/30',
    yellow: 'text-yellow bg-yellow/10 border-yellow/30',
  }
  return (
    <div className={`flex items-center gap-2 border rounded-xl px-3 py-2 ${colorMap[color]}`}>
      <span className="opacity-70">{icon}</span>
      <span className="font-mono text-[10px] uppercase tracking-widest opacity-70">{label}</span>
      <span className="font-mono text-xs font-bold">{value}</span>
    </div>
  )
}
