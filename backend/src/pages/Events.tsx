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
  AlertTriangle,
  Star,
} from 'lucide-react'
import ImageDropzone from '@/components/ImageDropzone'
import ConfirmDialog from '@/components/ConfirmDialog'
import { format } from 'date-fns'

interface HighlightItem {
  icon: string
  title: string
  text: string
}

interface ScheduleItem {
  time: string
  title: string
  text: string
}

interface SpeakerItem {
  name: string
  role: string
  photo_url: string
}

interface FaqItem {
  question: string
  answer: string
}

interface Event {
  id: string
  title: string
  description: string | null
  full_description: string | null
  event_date: string | null
  venue: string | null
  category: string | null
  accent: string | null
  image_url: string | null
  image_path: string | null
  is_published: boolean
  registration_open?: boolean
  registration_deadline?: string | null
  max_seats?: number | null
  form_mode?: string
  external_form_url?: string | null
  google_form_url?: string | null
  register_button_label?: string | null
  closed_label?: string | null
  featured?: boolean
  highlights?: HighlightItem[] | null
  schedule?: ScheduleItem[] | null
  entry_fee?: string | null
  eligibility?: string | null
  dress_code?: string | null
  seats_note?: string | null
  speakers?: SpeakerItem[] | null
  faqs?: FaqItem[] | null
  tags?: string[] | null
  contact_name?: string | null
  contact_whatsapp?: string | null
  whatsapp_group_url?: string | null
  brochure_url?: string | null
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
  full_description: string
  event_date: string
  registration_deadline: string
  venue: string
  category: string
  accent: string
  is_published: boolean
  registration_open: boolean
  google_form_url: string
  register_button_label: string
  closed_label: string
  featured: boolean
  entry_fee: string
  eligibility: string
  dress_code: string
  seats_note: string
  contact_name: string
  contact_whatsapp: string
  whatsapp_group_url: string
  brochure_url: string
  tags: string
  highlights: HighlightItem[]
  schedule: ScheduleItem[]
  speakers: SpeakerItem[]
  faqs: FaqItem[]
}

const EMPTY_FORM: FormState = {
  title: '',
  description: '',
  full_description: '',
  event_date: '',
  registration_deadline: '',
  venue: '',
  category: 'Workshop',
  accent: 'cyan',
  is_published: false,
  registration_open: true,
  google_form_url: '',
  register_button_label: 'Register Now',
  closed_label: 'Registration Closed',
  featured: false,
  entry_fee: 'Free',
  eligibility: '',
  dress_code: '',
  seats_note: 'Limited seats available',
  contact_name: '',
  contact_whatsapp: '',
  whatsapp_group_url: '',
  brochure_url: '',
  tags: '',
  highlights: [],
  schedule: [],
  speakers: [],
  faqs: [],
}

export default function Events() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Event | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [toggleLoading, setToggleLoading] = useState<string | null>(null)

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
    setSheetOpen(true)
  }

  function openEdit(event: Event) {
    setEditing(event)
    setForm({
      title: event.title ?? '',
      description: event.description ?? '',
      full_description: event.full_description ?? '',
      event_date: event.event_date ? event.event_date.slice(0, 16) : '',
      registration_deadline: event.registration_deadline ? event.registration_deadline.slice(0, 16) : '',
      venue: event.venue ?? '',
      category: event.category ?? 'Workshop',
      accent: event.accent ?? 'cyan',
      is_published: event.is_published,
      registration_open: event.registration_open ?? true,
      google_form_url: event.google_form_url ?? '',
      register_button_label: event.register_button_label ?? 'Register Now',
      closed_label: event.closed_label ?? 'Registration Closed',
      featured: event.featured ?? false,
      entry_fee: event.entry_fee ?? 'Free',
      eligibility: event.eligibility ?? '',
      dress_code: event.dress_code ?? '',
      seats_note: event.seats_note ?? 'Limited seats available',
      contact_name: event.contact_name ?? '',
      contact_whatsapp: event.contact_whatsapp ?? '',
      whatsapp_group_url: event.whatsapp_group_url ?? '',
      brochure_url: event.brochure_url ?? '',
      tags: Array.isArray(event.tags) ? event.tags.join(', ') : '',
      highlights: Array.isArray(event.highlights) ? event.highlights : [],
      schedule: Array.isArray(event.schedule) ? event.schedule : [],
      speakers: Array.isArray(event.speakers) ? event.speakers : [],
      faqs: Array.isArray(event.faqs) ? event.faqs : [],
    })
    setImageFile(null)
    setSheetOpen(true)
  }

  function closeSheet() {
    setSheetOpen(false)
    setEditing(null)
    setImageFile(null)
  }

  async function handleSave() {
    if (!form.title.trim()) {
      toast.error('Title is required.')
      return
    }

    if (form.google_form_url.trim() && !form.google_form_url.trim().startsWith('https://')) {
      toast.error('Google Form URL must start with https://')
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

      const tagsArray = form.tags
        ? form.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : []

      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        full_description: form.full_description.trim() || null,
        event_date: form.event_date || null,
        registration_deadline: form.registration_deadline || null,
        venue: form.venue.trim() || null,
        category: form.category,
        accent: form.accent,
        is_published: form.is_published,
        registration_open: form.registration_open,
        google_form_url: form.google_form_url.trim() || null,
        register_button_label: form.register_button_label.trim() || 'Register Now',
        closed_label: form.closed_label.trim() || 'Registration Closed',
        featured: form.featured,
        entry_fee: form.entry_fee.trim() || null,
        eligibility: form.eligibility.trim() || null,
        dress_code: form.dress_code.trim() || null,
        seats_note: form.seats_note.trim() || null,
        contact_name: form.contact_name.trim() || null,
        contact_whatsapp: form.contact_whatsapp.trim() || null,
        whatsapp_group_url: form.whatsapp_group_url.trim() || null,
        brochure_url: form.brochure_url.trim() || null,
        tags: tagsArray,
        highlights: form.highlights,
        schedule: form.schedule,
        speakers: form.speakers,
        faqs: form.faqs,
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

  const isGoogleFormWarning =
    form.google_form_url.trim().length > 0 &&
    !form.google_form_url.includes('google.com/forms') &&
    !form.google_form_url.includes('forms.gle')

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-black text-white tracking-tight">Events</h1>
          <p className="font-mono text-sm text-muted-foreground mt-1">
            Manage club events, registrations, schedule &amp; highlights.
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
                    <td className="px-4 py-3 font-mono text-xs text-white max-w-[200px] truncate">
                      <div className="flex items-center gap-2">
                        {event.featured && (
                          <Star size={13} className="text-yellow fill-yellow shrink-0" />
                        )}
                        <span className="truncate">{event.title}</span>
                      </div>
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
                    {/* Sticky actions */}
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

      {/* Edit / Create Sheet */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-black/60 backdrop-blur-sm"
            onClick={closeSheet}
          />
          <div className="w-full max-w-2xl bg-sidebar border-l border-border flex flex-col h-full shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 bg-sidebar z-10 border-b border-border flex items-center justify-between p-6 pb-4">
              <div>
                <h2 className="font-display text-xl font-bold text-white">
                  {editing ? 'Edit Event' : 'New Event'}
                </h2>
                <p className="font-mono text-xs text-muted-foreground mt-0.5">
                  Configure event details, registration link, timeline &amp; FAQs
                </p>
              </div>
              <button
                onClick={closeSheet}
                className="p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-border/40 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* SECTION: BASIC INFO */}
              <div className="space-y-4">
                <h3 className="font-mono text-xs font-bold text-cyan uppercase tracking-wider border-b border-border/60 pb-2">
                  Basic Info
                </h3>

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

                {/* Short Description */}
                <div>
                  <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">
                    Short Description (card summary)
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan transition-all resize-none"
                    placeholder="Brief 1-2 sentence hook…"
                  />
                </div>

                {/* Full Description */}
                <div>
                  <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">
                    Full Description (popup details)
                  </label>
                  <textarea
                    value={form.full_description}
                    onChange={(e) => setForm({ ...form, full_description: e.target.value })}
                    rows={4}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan transition-all"
                    placeholder="In-depth details, prerequisites, what attendees will learn or experience…"
                  />
                </div>

                {/* Date & Time and Deadline */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <div>
                    <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">
                      Registration Deadline
                    </label>
                    <input
                      type="datetime-local"
                      value={form.registration_deadline}
                      onChange={(e) => setForm({ ...form, registration_deadline: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan transition-all"
                    />
                  </div>
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
                    placeholder="e.g. Auditorium 2 / Online / Tech Lab"
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
                      Accent Color
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

                {/* Toggles: Published & Featured */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between bg-background border border-border rounded-lg px-4 py-3">
                    <div>
                      <p className="font-mono text-xs text-white">Published</p>
                      <p className="font-mono text-[10px] text-muted-foreground">Visible on site</p>
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

                  <div className="flex items-center justify-between bg-background border border-border rounded-lg px-4 py-3">
                    <div>
                      <p className="font-mono text-xs text-white">Featured Event</p>
                      <p className="font-mono text-[10px] text-muted-foreground">Highlighted badge</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, featured: !form.featured })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.featured ? 'bg-yellow' : 'bg-border'}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.featured ? 'translate-x-6' : 'translate-x-1'}`}
                      />
                    </button>
                  </div>
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

              {/* SECTION: REGISTRATION & GOOGLE FORM */}
              <div className="space-y-4 pt-4">
                <h3 className="font-mono text-xs font-bold text-cyan uppercase tracking-wider border-b border-border/60 pb-2">
                  Registration &amp; Google Form
                </h3>

                {/* Registration Open Toggle */}
                <div className="flex items-center justify-between bg-background border border-border rounded-lg px-4 py-3">
                  <div>
                    <p className="font-mono text-xs text-white">Registration Open</p>
                    <p className="font-mono text-[10px] text-muted-foreground">Allow attendees to register</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, registration_open: !form.registration_open })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.registration_open ? 'bg-cyan' : 'bg-border'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.registration_open ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>

                {/* Google Form URL */}
                <div>
                  <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">
                    Google Form URL
                  </label>
                  <input
                    type="text"
                    value={form.google_form_url}
                    onChange={(e) => setForm({ ...form, google_form_url: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan transition-all"
                    placeholder="https://forms.gle/... or https://docs.google.com/forms/..."
                  />
                  {isGoogleFormWarning && (
                    <div className="flex items-center gap-2 mt-2 text-yellow bg-yellow/10 border border-yellow/30 px-3 py-2 rounded-lg text-xs font-mono">
                      <AlertTriangle size={14} className="shrink-0" />
                      <span>URL does not look like a standard Google Forms link (e.g. forms.gle or google.com/forms). Please verify before publishing.</span>
                    </div>
                  )}
                </div>

                {/* Button Labels */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">
                      Register Button Label
                    </label>
                    <input
                      type="text"
                      value={form.register_button_label}
                      onChange={(e) => setForm({ ...form, register_button_label: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan transition-all"
                      placeholder="Register Now"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">
                      Registration Closed Label
                    </label>
                    <input
                      type="text"
                      value={form.closed_label}
                      onChange={(e) => setForm({ ...form, closed_label: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan transition-all"
                      placeholder="Registration Closed"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION: ATTENDANCE & DETAILS */}
              <div className="space-y-4 pt-4">
                <h3 className="font-mono text-xs font-bold text-cyan uppercase tracking-wider border-b border-border/60 pb-2">
                  Event Specs &amp; Logistics
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Entry Fee */}
                  <div>
                    <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">
                      Entry Fee
                    </label>
                    <input
                      type="text"
                      value={form.entry_fee}
                      onChange={(e) => setForm({ ...form, entry_fee: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan transition-all"
                      placeholder="Free or ₹100"
                    />
                  </div>

                  {/* Eligibility */}
                  <div>
                    <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">
                      Eligibility
                    </label>
                    <input
                      type="text"
                      value={form.eligibility}
                      onChange={(e) => setForm({ ...form, eligibility: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan transition-all"
                      placeholder="e.g. Open to all students / 2nd-4th Year"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Dress Code */}
                  <div>
                    <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">
                      Dress Code
                    </label>
                    <input
                      type="text"
                      value={form.dress_code}
                      onChange={(e) => setForm({ ...form, dress_code: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan transition-all"
                      placeholder="e.g. Casual / Formal"
                    />
                  </div>

                  {/* Seats Note */}
                  <div>
                    <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">
                      Seats Note
                    </label>
                    <input
                      type="text"
                      value={form.seats_note}
                      onChange={(e) => setForm({ ...form, seats_note: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan transition-all"
                      placeholder="Limited seats (first come first served)"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan transition-all"
                    placeholder="AI, Design, Robotics, Networking"
                  />
                </div>
              </div>

              {/* SECTION: CONTACT & LINKS */}
              <div className="space-y-4 pt-4">
                <h3 className="font-mono text-xs font-bold text-cyan uppercase tracking-wider border-b border-border/60 pb-2">
                  Contact &amp; Resources
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Contact Name */}
                  <div>
                    <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">
                      Contact Person Name
                    </label>
                    <input
                      type="text"
                      value={form.contact_name}
                      onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan transition-all"
                      placeholder="e.g. Alex Rivera"
                    />
                  </div>

                  {/* Contact WhatsApp */}
                  <div>
                    <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">
                      Contact WhatsApp / Phone
                    </label>
                    <input
                      type="text"
                      value={form.contact_whatsapp}
                      onChange={(e) => setForm({ ...form, contact_whatsapp: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan transition-all"
                      placeholder="+91 9876543210 or wa.me link"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* WhatsApp Group Link */}
                  <div>
                    <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">
                      WhatsApp Community / Group Link
                    </label>
                    <input
                      type="text"
                      value={form.whatsapp_group_url}
                      onChange={(e) => setForm({ ...form, whatsapp_group_url: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan transition-all"
                      placeholder="https://chat.whatsapp.com/..."
                    />
                  </div>

                  {/* Brochure Link */}
                  <div>
                    <label className="block font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">
                      Brochure Download Link (PDF URL)
                    </label>
                    <input
                      type="text"
                      value={form.brochure_url}
                      onChange={(e) => setForm({ ...form, brochure_url: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan transition-all"
                      placeholder="https://drive.google.com/... or pdf url"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION: HIGHLIGHTS */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <h3 className="font-mono text-xs font-bold text-cyan uppercase tracking-wider">
                    Highlights
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        highlights: [...form.highlights, { icon: '✨', title: '', text: '' }],
                      })
                    }
                    className="flex items-center gap-1 font-mono text-[11px] text-cyan hover:underline"
                  >
                    <Plus size={12} /> Add Highlight
                  </button>
                </div>

                {form.highlights.length === 0 ? (
                  <p className="font-mono text-[11px] text-muted-foreground">
                    No highlights added yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {form.highlights.map((hl, i) => (
                      <div key={i} className="p-3 bg-background border border-border rounded-xl space-y-2 relative">
                        <button
                          type="button"
                          onClick={() =>
                            setForm({
                              ...form,
                              highlights: form.highlights.filter((_, idx) => idx !== i),
                            })
                          }
                          className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-pink transition-colors"
                        >
                          <X size={14} />
                        </button>
                        <div className="grid grid-cols-[60px_1fr] gap-2 pr-6">
                          <div>
                            <label className="block font-mono text-[9px] text-muted-foreground uppercase mb-1">
                              Icon
                            </label>
                            <input
                              type="text"
                              value={hl.icon}
                              onChange={(e) => {
                                const next = [...form.highlights]
                                next[i].icon = e.target.value
                                setForm({ ...form, highlights: next })
                              }}
                              className="w-full bg-sidebar border border-border rounded px-2 py-1.5 text-center text-sm font-mono focus:outline-none focus:border-cyan"
                              placeholder="🏆"
                            />
                          </div>
                          <div>
                            <label className="block font-mono text-[9px] text-muted-foreground uppercase mb-1">
                              Title
                            </label>
                            <input
                              type="text"
                              value={hl.title}
                              onChange={(e) => {
                                const next = [...form.highlights]
                                next[i].title = e.target.value
                                setForm({ ...form, highlights: next })
                              }}
                              className="w-full bg-sidebar border border-border rounded px-2.5 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-cyan"
                              placeholder="Cash Prizes"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block font-mono text-[9px] text-muted-foreground uppercase mb-1">
                            Text
                          </label>
                          <input
                            type="text"
                            value={hl.text}
                            onChange={(e) => {
                              const next = [...form.highlights]
                              next[i].text = e.target.value
                              setForm({ ...form, highlights: next })
                            }}
                            className="w-full bg-sidebar border border-border rounded px-2.5 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-cyan"
                            placeholder="₹50,000 prize pool for top 3 teams"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION: SCHEDULE / TIMELINE */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <h3 className="font-mono text-xs font-bold text-cyan uppercase tracking-wider">
                    Schedule / Timeline
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        schedule: [...form.schedule, { time: '', title: '', text: '' }],
                      })
                    }
                    className="flex items-center gap-1 font-mono text-[11px] text-cyan hover:underline"
                  >
                    <Plus size={12} /> Add Item
                  </button>
                </div>

                {form.schedule.length === 0 ? (
                  <p className="font-mono text-[11px] text-muted-foreground">
                    No schedule items added yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {form.schedule.map((item, i) => (
                      <div key={i} className="p-3 bg-background border border-border rounded-xl space-y-2 relative">
                        <button
                          type="button"
                          onClick={() =>
                            setForm({
                              ...form,
                              schedule: form.schedule.filter((_, idx) => idx !== i),
                            })
                          }
                          className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-pink transition-colors"
                        >
                          <X size={14} />
                        </button>
                        <div className="grid grid-cols-[120px_1fr] gap-2 pr-6">
                          <div>
                            <label className="block font-mono text-[9px] text-muted-foreground uppercase mb-1">
                              Time
                            </label>
                            <input
                              type="text"
                              value={item.time}
                              onChange={(e) => {
                                const next = [...form.schedule]
                                next[i].time = e.target.value
                                setForm({ ...form, schedule: next })
                              }}
                              className="w-full bg-sidebar border border-border rounded px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-cyan"
                              placeholder="10:00 AM"
                            />
                          </div>
                          <div>
                            <label className="block font-mono text-[9px] text-muted-foreground uppercase mb-1">
                              Title
                            </label>
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) => {
                                const next = [...form.schedule]
                                next[i].title = e.target.value
                                setForm({ ...form, schedule: next })
                              }}
                              className="w-full bg-sidebar border border-border rounded px-2.5 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-cyan"
                              placeholder="Opening Keynote"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block font-mono text-[9px] text-muted-foreground uppercase mb-1">
                            Details (optional)
                          </label>
                          <input
                            type="text"
                            value={item.text}
                            onChange={(e) => {
                              const next = [...form.schedule]
                              next[i].text = e.target.value
                              setForm({ ...form, schedule: next })
                            }}
                            className="w-full bg-sidebar border border-border rounded px-2.5 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-cyan"
                            placeholder="Intro to modern web technologies"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION: SPEAKERS / GUESTS */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <h3 className="font-mono text-xs font-bold text-cyan uppercase tracking-wider">
                    Speakers / Guests
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        speakers: [...form.speakers, { name: '', role: '', photo_url: '' }],
                      })
                    }
                    className="flex items-center gap-1 font-mono text-[11px] text-cyan hover:underline"
                  >
                    <Plus size={12} /> Add Speaker
                  </button>
                </div>

                {form.speakers.length === 0 ? (
                  <p className="font-mono text-[11px] text-muted-foreground">
                    No speakers added yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {form.speakers.map((spk, i) => (
                      <div key={i} className="p-3 bg-background border border-border rounded-xl space-y-2 relative">
                        <button
                          type="button"
                          onClick={() =>
                            setForm({
                              ...form,
                              speakers: form.speakers.filter((_, idx) => idx !== i),
                            })
                          }
                          className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-pink transition-colors"
                        >
                          <X size={14} />
                        </button>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pr-6">
                          <div>
                            <label className="block font-mono text-[9px] text-muted-foreground uppercase mb-1">
                              Name
                            </label>
                            <input
                              type="text"
                              value={spk.name}
                              onChange={(e) => {
                                const next = [...form.speakers]
                                next[i].name = e.target.value
                                setForm({ ...form, speakers: next })
                              }}
                              className="w-full bg-sidebar border border-border rounded px-2.5 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-cyan"
                              placeholder="Jane Doe"
                            />
                          </div>
                          <div>
                            <label className="block font-mono text-[9px] text-muted-foreground uppercase mb-1">
                              Role / Org
                            </label>
                            <input
                              type="text"
                              value={spk.role}
                              onChange={(e) => {
                                const next = [...form.speakers]
                                next[i].role = e.target.value
                                setForm({ ...form, speakers: next })
                              }}
                              className="w-full bg-sidebar border border-border rounded px-2.5 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-cyan"
                              placeholder="Product Designer @ Figma"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block font-mono text-[9px] text-muted-foreground uppercase mb-1">
                            Photo URL (optional)
                          </label>
                          <input
                            type="text"
                            value={spk.photo_url}
                            onChange={(e) => {
                              const next = [...form.speakers]
                              next[i].photo_url = e.target.value
                              setForm({ ...form, speakers: next })
                            }}
                            className="w-full bg-sidebar border border-border rounded px-2.5 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-cyan"
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION: FAQS */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <h3 className="font-mono text-xs font-bold text-cyan uppercase tracking-wider">
                    Frequently Asked Questions
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        faqs: [...form.faqs, { question: '', answer: '' }],
                      })
                    }
                    className="flex items-center gap-1 font-mono text-[11px] text-cyan hover:underline"
                  >
                    <Plus size={12} /> Add FAQ
                  </button>
                </div>

                {form.faqs.length === 0 ? (
                  <p className="font-mono text-[11px] text-muted-foreground">
                    No FAQs added yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {form.faqs.map((faq, i) => (
                      <div key={i} className="p-3 bg-background border border-border rounded-xl space-y-2 relative">
                        <button
                          type="button"
                          onClick={() =>
                            setForm({
                              ...form,
                              faqs: form.faqs.filter((_, idx) => idx !== i),
                            })
                          }
                          className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-pink transition-colors"
                        >
                          <X size={14} />
                        </button>
                        <div className="pr-6">
                          <label className="block font-mono text-[9px] text-muted-foreground uppercase mb-1">
                            Question
                          </label>
                          <input
                            type="text"
                            value={faq.question}
                            onChange={(e) => {
                              const next = [...form.faqs]
                              next[i].question = e.target.value
                              setForm({ ...form, faqs: next })
                            }}
                            className="w-full bg-sidebar border border-border rounded px-2.5 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-cyan"
                            placeholder="Do I need prior coding experience?"
                          />
                        </div>
                        <div>
                          <label className="block font-mono text-[9px] text-muted-foreground uppercase mb-1">
                            Answer
                          </label>
                          <textarea
                            value={faq.answer}
                            onChange={(e) => {
                              const next = [...form.faqs]
                              next[i].answer = e.target.value
                              setForm({ ...form, faqs: next })
                            }}
                            rows={2}
                            className="w-full bg-sidebar border border-border rounded px-2.5 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-cyan"
                            placeholder="No, complete beginners are welcome!"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
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
        </div>
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Event?"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This will also remove the poster image. This action cannot be undone.`}
        confirmLabel="Delete Event"
      />
    </div>
  )
}
