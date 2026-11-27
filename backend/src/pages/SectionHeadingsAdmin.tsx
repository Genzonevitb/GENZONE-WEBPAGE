import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Save } from 'lucide-react'

const SECTION_KEYS = [
  'events_label', 'events_heading',
  'gallery_label', 'gallery_heading',
  'panel_label', 'panel_heading',
  'feedback_label', 'feedback_heading', 'feedback_subtitle',
]

const SECTION_LABELS: Record<string, string> = {
  events_label:      'Events — Section Tag',
  events_heading:    'Events — Heading',
  gallery_label:     'Gallery — Section Tag',
  gallery_heading:   'Gallery — Heading',
  panel_label:       'Panel — Section Tag',
  panel_heading:     'Panel — Heading',
  feedback_label:    'Feedback — Section Tag',
  feedback_heading:  'Feedback — Heading',
  feedback_subtitle: 'Feedback — Subtitle',
}

const SECTION_DEFAULTS: Record<string, string> = {
  events_label:      'Events & Activities',
  events_heading:    "What's going down.",
  gallery_label:     'GenZone Memories',
  gallery_heading:   'Wall of Memories',
  panel_label:       'Meet the Panel',
  panel_heading:     'The people behind the noise.',
  feedback_label:    'Suggestions & Feedback',
  feedback_heading:  'Got something loud to say?',
  feedback_subtitle: 'Ideas, rants, collabs — drop them here. The panel reads everything.',
}

export default function SectionHeadingsAdmin() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [changed, setChanged] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchSettings() }, [])

  async function fetchSettings() {
    setLoading(true)
    const { data } = await supabase.from('settings').select('key, value').in('key', SECTION_KEYS)
    if (data) setSettings(Object.fromEntries(data.map((r) => [r.key, r.value ?? ''])))
    setLoading(false)
  }

  function handleChange(key: string, value: string) {
    setChanged((prev) => ({ ...prev, [key]: value }))
  }

  async function save() {
    if (Object.keys(changed).length === 0) { toast.info('No changes to save.'); return }
    setSaving(true)
    const rows = Object.entries(changed).map(([key, value]) => ({ key, value }))
    const { error } = await supabase.from('settings').upsert(rows, { onConflict: 'key' })
    if (error) {
      toast.error('Failed to save: ' + error.message)
    } else {
      toast.success('Section headings saved!')
      setChanged({})
      fetchSettings()
    }
    setSaving(false)
  }

  const sections = [
    { title: 'Events', keys: ['events_label', 'events_heading'] },
    { title: 'Gallery', keys: ['gallery_label', 'gallery_heading'] },
    { title: 'Panel / Team', keys: ['panel_label', 'panel_heading'] },
    { title: 'Feedback', keys: ['feedback_label', 'feedback_heading', 'feedback_subtitle'] },
  ]

  if (loading) return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto">
      <div className="animate-pulse space-y-4">
        {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-10 bg-charcoal rounded-lg" />)}
      </div>
    </div>
  )

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto">
      <div className="mb-10">
        <p className="font-mono text-xs text-cyan tracking-[0.3em] uppercase mb-2">08 — Sections</p>
        <h1 className="font-display text-3xl font-black uppercase">Section Headings</h1>
        <p className="text-muted-foreground text-sm mt-2">Edit the labels and headings shown at the top of each site section.</p>
      </div>

      <div className="space-y-10">
        {sections.map((sec) => (
          <section key={sec.title}>
            <h2 className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-4 pb-2 border-b border-border">
              {sec.title}
            </h2>
            <div className="space-y-4">
              {sec.keys.map((key) => {
                const val = changed[key] ?? settings[key] ?? ''
                const isLong = key === 'feedback_subtitle'
                return (
                  <div key={key}>
                    <label className="block font-mono text-xs text-muted-foreground uppercase tracking-widest mb-2">
                      {SECTION_LABELS[key]}
                    </label>
                    {isLong ? (
                      <textarea
                        rows={2}
                        value={val}
                        onChange={(e) => handleChange(key, e.target.value)}
                        placeholder={SECTION_DEFAULTS[key]}
                        className="w-full bg-charcoal border border-border rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan transition-all resize-none"
                      />
                    ) : (
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => handleChange(key, e.target.value)}
                        placeholder={SECTION_DEFAULTS[key]}
                        className="w-full bg-charcoal border border-border rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan transition-all"
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        ))}

        <button
          type="button"
          onClick={save}
          disabled={saving || Object.keys(changed).length === 0}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-mono text-sm font-semibold uppercase tracking-widest bg-cyan text-background hover:bg-cyan/90 disabled:opacity-40 transition-all"
        >
          <Save size={15} />
          {saving ? 'Saving…' : `Save All${Object.keys(changed).length > 0 ? ` (${Object.keys(changed).length})` : ''}`}
        </button>
      </div>
    </div>
  )
}
