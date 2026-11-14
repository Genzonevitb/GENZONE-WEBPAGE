import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { uploadImage } from '@/lib/uploadImage'
import { toast } from 'sonner'
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Calendar,
  Loader2,
  CheckCircle2,
  CircleDashed,
  ClipboardList,
} from 'lucide-react'
import ImageDropzone from '@/components/ImageDropzone'
import ConfirmDialog from '@/components/ConfirmDialog'
import EventFormBuilder from '@/components/EventFormBuilder'
import { format } from 'date-fns'

interface Event {
  id: string
  title: string
  description: string | null
  event_date: string | null
  venue: string | null
  category: string | null
  accent: string | null
  image_url: string | null
  image_path: string | null
  is_published: boolean
  created_at: string
}

const CATEGORIES = ['Workshop', 'Hackathon', 'Showcase', 'Fest', 'Other']
const ACCENTS = [
  { value: 'cyan', label: 'Cyan', color: 'oklch(0.8 0.15 220)' },
  { value: 'pink', label: 'Pink', color: 'oklch(0.64 0.26 0)' },
  { value: 'yellow', label: 'Yellow', color: 'oklch(0.88 0.18 92)' },
]

function AccentDot({ accent }: { accent: string | null }) {
  const color = ACCENTS.find((a) => a.value === accent)?.color ?? '#888'
  return (
    <span
      className="inline-block w-2.5 h-2.5 rounded-full border border-white/20 mr-1.5 align-middle"
      style={{ background: color }}
    />
  )
}

function AccentBadge({ accent }: { accent: string | null }) {
  const map: Record<string, string> = {
    cyan: 'text-cyan border-cyan/40 bg-cyan/10',
    pink: 'text-pink border-pink/40 bg-pink/10',
    yellow: 'text-yellow border-yellow/40 bg-yellow/10',
  }
  const cls = map[accent ?? ''] ?? 'text-muted-foreground border-border bg-border/10'
  return (
    <span className={`inline-flex items-center font-mono text-[10px] uppercase tracking-widest border rounded-full px-2 py-0.5 ${cls}`}>
      <AccentDot accent={accent} />
      {accent ?? '—'}
    </span>
  )
}

function RowSkeleton() {
  return (
    <tr className="border-b border-border animate-pulse">
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <td key={i} className="px-4 py-4">
          <div className="h-4 rounded bg-border/60 w-full" />
        </td>
      ))}
    </tr>
  )
}

interface FormState {
  title: string
  description: string
  event_date: string
  venue: string
  category: string
  accent: string
  is_published: boolean
}

const EMPTY_FORM: FormState = {
  title: '',
  description: '',
  event_date: '',
  venue: '',
  category: 'Workshop',
  accent: 'cyan',
  is_published: false,
}

export default function Events() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Event | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [toggleLoading, setToggleLoading] = useState<string | null>(null)
  const [sheetTab, setSheetTab] = useState<'details' | 'form'>('details')

  async function fetchEvents() {
    setLoading(true)
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: false })
    if (error) toast.error(error.message)
    else setEvents(data as Event[])
    setLoading(false)
  }

  useEffect(() => { fetchEvents() }, [])

  function openAdd() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setImageFile(null)
    setSheetTab('details')
    setSheetOpen(true)
  }

  function openEdit(event: Event) {
    setEditing(event)
    setForm({
      title: event.title,
      description: event.description ?? '',
      event_date: event.event_date ? event.event_date.slice(0, 16) : '',
      venue: event.venue ?? '',
      category: event.category ?? 'Workshop',
      accent: event.accent ?? 'cyan',
      is_published: event.is_published,
    })
    setImageFile(null)
    setSheetTab('details')
    setSheetOpen(true)
  }

  function closeSheet() {
    setSheetOpen(false)
    setEditing(null)
    setImageFile(null)
  }

  /** Auto-save a new event as draft so EventFormBuilder gets an ID */
  async function autoSaveNew(): Promise<Event | null> {
    if (!form.title.trim()) {
      toast.error('Please enter a title before building the form.')
      return null
    }
    setAutoSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        event_date: form.event_date || null,
        venue: form.venue.trim() || null,
        category: form.category,
        accent: form.accent,
        is_published: false, // always draft on auto-save
        image_url: null,
        image_path: null,
      }
      const { data, error } = await supabase
        .from('events')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      const created = data as Event
      setEditing(created)
      await fetchEvents()
      toast.success('Event auto-saved as draft. Now build the registration form.')
      return created
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to auto-save event.')
      return null
    } finally {
      setAutoSaving(false)
    }
  }

  async function switchToFormTab() {
    if (editing) {
      setSheetTab('form')
      return
    }
    // New event — auto-save first to get an ID
    const created = await autoSaveNew()
    if (created) setSheetTab('form')
  }

  async function handleSave() {
    if (!form.title.trim()) {
      toast.error('Title is required.')
      return
    }
    setSaving(true)
    try {
      let image_url: string | null = editing?.image_url ?? null
      let image_path: string | null = editing?.image_path ?? null

      if (imageFile) {
        if (editing?.image_path) {
          await supabase.storage.from('events').remove([editing.image_path])
        }
        const result = await uploadImage(imageFile, 'events', 1200, 2)
        image_url = result.url
        image_path = result.path
      }

      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        event_date: form.event_date || null,
        venue: form.venue.trim() || null,
        category: form.category,
        accent: form.accent,
        is_published: form.is_published,
        image_url,
        image_path,
      }

      if (editing) {
        const { error } = await supabase.from('events').update(payload).eq('id', editing.id)
        if (error) throw error
        toast.success('Event updated.')
      } else {
        const { error } = await supabase.from('events').insert(payload)
        if (error) throw error
        toast.success('Event created.')
      }

      closeSheet()
      await fetchEvents()
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to save event.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      if (deleteTarget.image_path) {
        await supabase.storage.from('events').remove([deleteTarget.image_path])
      }
      const { error } = await supabase.from('events').delete().eq('id', deleteTarget.id)
      if (error) throw error
      toast.success('Event deleted.')
      setDeleteTarget(null)
      await fetchEvents()
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to delete event.')
    } finally {
      setDeleting(false)
    }
  }

  async function togglePublished(event: Event) {
    setToggleLoading(event.id)
    const { error } = await supabase
      .from('events')
      .update({ is_published: !event.is_published })
      .eq('id', event.id)
    if (error) toast.error(error.message)
    else {
      setEvents((prev) =>
        prev.map((e) => (e.id === event.id ? { ...e, is_published: !e.is_published } : e))
      )
    }
    setToggleLoading(null)
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-black text-white tracking-tight">Events</h1>
          <p className="font-mono text-sm text-muted-foreground mt-1">
            Manage all club events and workshops.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-cyan/10 border border-cyan/40 hover:border-cyan text-cyan font-mono text-sm px-4 py-2.5 rounded-xl transition-all hover:bg-cyan/20"
        >
          <Plus size={16} />
          Add Event
        </button>
      </div>

      {/* Table */}
      <div className="bg-charcoal border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Title', 'Category', 'Accent', 'Date', 'Venue', 'Published'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left font-mono text-[10px] text-muted-foreground uppercase tracking-widest whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
                {/* Sticky actions column */}
                <th className="px-4 py-3 text-right font-mono text-[10px] text-muted-foreground uppercase tracking-widest sticky right-0 bg-charcoal">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <RowSkeleton key={i} />)
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <Calendar size={32} className="text-muted-foreground mx-auto mb-3" />
                    <p className="font-mono text-sm text-muted-foreground">
                      No events yet. Add your first one.
                    </p>
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr
                    key={event.id}
                    className="border-b border-border/50 hover:bg-background/40 transition-colors group"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-white max-w-[160px] truncate">
                      {event.title}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {event.category ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <AccentBadge accent={event.accent} />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {event.event_date
                        ? format(new Date(event.event_date), 'dd MMM yyyy')
                        : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground max-w-[120px] truncate">
                      {event.venue ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => togglePublished(event)}
                        disabled={toggleLoading === event.id}
                        className="flex items-center gap-1.5 transition-opacity disabled:opacity-50"
                      >
                        {toggleLoading === event.id ? (
                          <Loader2 size={16} className="animate-spin text-muted-foreground" />
                        ) : event.is_published ? (
                          <CheckCircle2 size={16} className="text-cyan" />
                        ) : (
                          <CircleDashed size={16} className="text-muted-foreground" />
                        )}
                        <span
                          className={`font-mono text-[10px] uppercase tracking-widest ${event.is_published ? 'text-cyan' : 'text-muted-foreground'}`}
                        >
                          {event.is_published ? 'Live' : 'Draft'}
                        </span>
                      </button>
                    </td>
                    {/* Sticky actions — always visible */}
                    <td className="px-4 py-3 sticky right-0 bg-charcoal group-hover:bg-background/40 transition-colors">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(event)}
                          title="Edit event"
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-cyan hover:bg-cyan/10 transition-all"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(event)}
                          title="Delete event"
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-pink hover:bg-pink/10 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sheet */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="flex-1 bg-black/60 backdrop-blur-sm"
            onClick={closeSheet}
          />
          {/* Panel */}
          <div className="w-full max-w-lg bg-sidebar border-l border-border flex flex-col h-full">
            {/* Header + tabs */}
            <div className="sticky top-0 bg-sidebar z-10 border-b border-border">
              <div className="flex items-center justify-between p-6 pb-3">
                <h2 className="font-display text-xl font-bold text-white">
                  {editing ? 'Edit Event' : 'New Event'}
                </h2>
                <button
                  onClick={closeSheet}
                  className="p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-border/40 transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex px-6">
                <button
                  onClick={() => setSheetTab('details')}
                  className={`flex items-center gap-1.5 px-4 py-2.5 font-mono text-[11px] uppercase tracking-widest border-b-2 transition-all ${
                    sheetTab === 'details'
                      ? 'border-cyan text-cyan'
                      : 'border-transparent text-muted-foreground hover:text-white'
                  }`}
                >
                  <Calendar size={12} />
                  Details
                </button>
                <button
                  onClick={switchToFormTab}
                  disabled={autoSaving}
                  className={`flex items-center gap-1.5 px-4 py-2.5 font-mono text-[11px] uppercase tracking-widest border-b-2 transition-all disabled:opacity-50 ${
                    sheetTab === 'form'
                      ? 'border-cyan text-cyan'
                      : 'border-transparent text-muted-foreground hover:text-white'
                  }`}
                >
                  {autoSaving ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <ClipboardList size={12} />
                  )}
                  {autoSaving ? 'Saving…' : 'Reg Form'}
                </button>
              </div>
            </div>

            {/* Body */}
            {sheetTab === 'form' && editing ? (
              <div className="flex-1 overflow-y-auto">
                <EventFormBuilder eventId={editing.id} />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-5">

                  {/* Auto-save hint for new events */}
                  {!editing && (
                    <div className="flex items-start gap-2 bg-cyan/5 border border-cyan/20 rounded-xl px-4 py-3">
                      <ClipboardList size={14} className="text-cyan mt-0.5 shrink-0" />
                      <p className="font-mono text-[11px] text-cyan/80 leading-relaxed">
                        Click <strong>Reg Form</strong> at any time — the event will be auto-saved as a draft first.
                      </p>
                    </div>
                  )}

                  {/* Title */}
                  <div>
                    <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">
                      Title <span className="text-pink">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan transition-all"
                      placeholder="Event title"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">
                      Description
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={4}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan transition-all resize-none"
                      placeholder="Describe the event…"
                    />
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">
                      Event Date &amp; Time
                    </label>
                    <input
                      type="datetime-local"
                      value={form.event_date}
                      onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan transition-all"
                    />
                  </div>

                  {/* Venue */}
                  <div>
                    <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">
                      Venue
                    </label>
                    <input
                      type="text"
                      value={form.venue}
                      onChange={(e) => setForm({ ...form, venue: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan transition-all"
                      placeholder="Location or online"
                    />
                  </div>

                  {/* Category + Accent */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">
                        Category
                      </label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan transition-all"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">
                        Accent
                      </label>
                      <select
                        value={form.accent}
                        onChange={(e) => setForm({ ...form, accent: e.target.value })}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan transition-all"
                      >
                        {ACCENTS.map((a) => (
                          <option key={a.value} value={a.value}>{a.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Published toggle */}
                  <div className="flex items-center justify-between bg-background border border-border rounded-lg px-4 py-3">
                    <div>
                      <p className="font-mono text-xs text-white">Published</p>
                      <p className="font-mono text-[10px] text-muted-foreground">Visible on the public site</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, is_published: !form.is_published })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.is_published ? 'bg-cyan' : 'bg-border'}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.is_published ? 'translate-x-6' : 'translate-x-1'}`}
                      />
                    </button>
                  </div>

                  {/* Poster image */}
                  <div>
                    <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">
                      Poster Image
                    </label>
                    <ImageDropzone
                      onFile={setImageFile}
                      currentUrl={editing?.image_url ?? undefined}
                      label="Drop poster here or click to browse"
                      maxMB={15}
                    />
                    {imageFile && (
                      <p className="font-mono text-[10px] text-cyan mt-1.5">
                        New file selected: {imageFile.name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-border flex gap-3 sticky bottom-0 bg-sidebar">
                  <button
                    onClick={closeSheet}
                    className="flex-1 bg-background border border-border text-muted-foreground font-mono text-sm py-2.5 rounded-xl hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 bg-cyan/10 border border-cyan/40 hover:border-cyan text-cyan font-mono text-sm py-2.5 rounded-xl transition-all hover:bg-cyan/20 disabled:opacity-50"
                  >
                    {saving && <Loader2 size={14} className="animate-spin" />}
                    {saving ? 'Saving…' : editing ? 'Update Event' : 'Create Event'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Event?"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This will also remove the poster image and all registrations. This action cannot be undone.`}
        confirmLabel="Delete Event"
      />
    </div>
  )
}
