import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Save, Plus, Trash2 } from 'lucide-react'

interface Stat {
  id: string
  value: string
  label: string
  accent: 'cyan' | 'pink' | 'yellow'
  sort_order: number
}

const ABOUT_KEYS = ['about_label', 'about_heading', 'about_paragraph', 'about_story', 'about_watermark']
const ABOUT_LABELS: Record<string, string> = {
  about_label:     'Section Label (small tag)',
  about_heading:   'Main Heading',
  about_paragraph: 'First Paragraph',
  about_story:     'Story / Mission Paragraph',
  about_watermark: 'Watermark Text (background)',
}
const ABOUT_DEFAULTS: Record<string, string> = {
  about_label:     'About GenZone',
  about_heading:   'A playground for people who make things.',
  about_paragraph: "GenZone is the college's creative and technical club — a crew of designers, coders, filmmakers, artists and curious minds who'd rather build than sit still.",
  about_story:     "[Placeholder: your club's story, mission and founding year go here.]",
  about_watermark: 'LOUDER BOLDER',
}

const ACCENT_OPTS: Array<'cyan' | 'pink' | 'yellow'> = ['cyan', 'pink', 'yellow']

export default function AboutAdmin() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [changed, setChanged] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const [stats, setStats] = useState<Stat[]>([])
  const [newStat, setNewStat] = useState({ value: '', label: '', accent: 'cyan' as 'cyan' | 'pink' | 'yellow' })
  const [addingStat, setAddingStat] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [settingsRes, statsRes] = await Promise.all([
      supabase.from('settings').select('key, value').in('key', ABOUT_KEYS),
      supabase.from('about_stats').select('id, value, label, accent, sort_order').order('sort_order'),
    ])
    if (settingsRes.data) setSettings(Object.fromEntries(settingsRes.data.map((r) => [r.key, r.value ?? ''])))
    if (statsRes.data) setStats(statsRes.data as Stat[])
    setLoading(false)
  }

  function handleChange(key: string, value: string) {
    setChanged((prev) => ({ ...prev, [key]: value }))
  }

  async function saveAboutText() {
    if (Object.keys(changed).length === 0) { toast.info('No changes to save.'); return }
    setSaving(true)
    const rows = Object.entries(changed).map(([key, value]) => ({ key, value }))
    const { error } = await supabase.from('settings').upsert(rows, { onConflict: 'key' })
    if (error) {
      toast.error('Failed to save: ' + error.message)
    } else {
      toast.success('About text saved!')
      setChanged({})
      fetchAll()
    }
    setSaving(false)
  }

  async function addStat() {
    if (!newStat.value.trim() || !newStat.label.trim()) { toast.error('Value and label are required.'); return }
    setAddingStat(true)
    const nextOrder = stats.length > 0 ? Math.max(...stats.map((s) => s.sort_order)) + 1 : 0
    const { error } = await supabase.from('about_stats').insert([{
      value: newStat.value.trim(),
      label: newStat.label.trim(),
      accent: newStat.accent,
      sort_order: nextOrder,
    }])
    if (error) {
      toast.error('Failed to add stat: ' + error.message)
    } else {
      toast.success('Stat added!')
      setNewStat({ value: '', label: '', accent: 'cyan' })
      fetchAll()
    }
    setAddingStat(false)
  }

  async function updateStat(id: string, field: keyof Stat, value: string) {
    const { error } = await supabase.from('about_stats').update({ [field]: value }).eq('id', id)
    if (error) {
      toast.error('Failed to update stat.')
    } else {
      setStats((prev) => prev.map((s) => s.id === id ? { ...s, [field]: value } : s))
    }
  }

  async function deleteStat(id: string) {
    setDeletingId(id)
    const { error } = await supabase.from('about_stats').delete().eq('id', id)
    if (error) {
      toast.error('Failed to delete stat.')
    } else {
      toast.success('Stat removed.')
      setStats((prev) => prev.filter((s) => s.id !== id))
    }
    setDeletingId(null)
  }

  if (loading) return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto">
      <div className="animate-pulse space-y-4">
        {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-charcoal rounded-lg" />)}
      </div>
    </div>
  )

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto">
      <div className="mb-10">
        <p className="font-mono text-xs text-cyan tracking-[0.3em] uppercase mb-2">07 — About</p>
        <h1 className="font-display text-3xl font-black uppercase">About Section</h1>
        <p className="text-muted-foreground text-sm mt-2">Edit the about section text and stats counters.</p>
      </div>

      <div className="space-y-10">
        {/* Text fields */}
        <section>
          <h2 className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-6 pb-2 border-b border-border">
            Text Content
          </h2>
          <div className="space-y-5">
            {ABOUT_KEYS.map((key) => {
              const val = changed[key] ?? settings[key] ?? ''
              const isLong = key === 'about_paragraph' || key === 'about_story'
              return (
                <div key={key}>
                  <label className="block font-mono text-xs text-muted-foreground uppercase tracking-widest mb-2">
                    {ABOUT_LABELS[key]}
                  </label>
                  {isLong ? (
                    <textarea
                      rows={4}
                      value={val}
                      onChange={(e) => handleChange(key, e.target.value)}
                      placeholder={ABOUT_DEFAULTS[key]}
                      className="w-full bg-charcoal border border-border rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan transition-all resize-y"
                    />
                  ) : (
                    <input
                      type="text"
                      value={val}
                      onChange={(e) => handleChange(key, e.target.value)}
                      placeholder={ABOUT_DEFAULTS[key]}
                      className="w-full bg-charcoal border border-border rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan transition-all"
                    />
                  )}
                </div>
              )
            })}
          </div>
          <button
            type="button"
            onClick={saveAboutText}
            disabled={saving || Object.keys(changed).length === 0}
            className="mt-6 flex items-center gap-2 px-6 py-3 rounded-xl font-mono text-sm font-semibold uppercase tracking-widest bg-cyan text-background hover:bg-cyan/90 disabled:opacity-40 transition-all"
          >
            <Save size={15} />
            {saving ? 'Saving…' : 'Save About Text'}
          </button>
        </section>

        {/* Stats */}
        <section>
          <h2 className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-6 pb-2 border-b border-border">
            Stats ({stats.length})
          </h2>
          <div className="space-y-3 mb-6">
            {stats.map((s) => (
              <div key={s.id} className="flex items-center gap-3 bg-charcoal rounded-lg px-4 py-3 border border-border">
                <input
                  type="text"
                  value={s.value}
                  onChange={(e) => updateStat(s.id, 'value', e.target.value)}
                  className="w-20 bg-transparent border-b border-border text-sm font-mono text-center focus:outline-none focus:border-cyan"
                  placeholder="00+"
                />
                <input
                  type="text"
                  value={s.label}
                  onChange={(e) => updateStat(s.id, 'label', e.target.value)}
                  className="flex-1 bg-transparent border-b border-border text-sm font-mono focus:outline-none focus:border-cyan"
                  placeholder="Members"
                />
                <select
                  value={s.accent}
                  onChange={(e) => updateStat(s.id, 'accent', e.target.value)}
                  className="bg-charcoal border border-border rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-cyan"
                >
                  {ACCENT_OPTS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => deleteStat(s.id)}
                  disabled={deletingId === s.id}
                  className="text-muted-foreground hover:text-pink transition-colors"
                  title="Delete"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            {stats.length === 0 && <p className="font-mono text-xs text-muted-foreground">No stats yet.</p>}
          </div>

          {/* Add new stat */}
          <div className="flex gap-3 flex-wrap">
            <input
              type="text"
              value={newStat.value}
              onChange={(e) => setNewStat((p) => ({ ...p, value: e.target.value }))}
              placeholder="Value (e.g. 50+)"
              className="w-28 bg-charcoal border border-border rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-yellow/50 focus:border-yellow transition-all"
            />
            <input
              type="text"
              value={newStat.label}
              onChange={(e) => setNewStat((p) => ({ ...p, label: e.target.value }))}
              placeholder="Label (e.g. Members)"
              className="flex-1 min-w-[120px] bg-charcoal border border-border rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-yellow/50 focus:border-yellow transition-all"
            />
            <select
              value={newStat.accent}
              onChange={(e) => setNewStat((p) => ({ ...p, accent: e.target.value as 'cyan' | 'pink' | 'yellow' }))}
              className="bg-charcoal border border-border rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-yellow transition-all"
            >
              {ACCENT_OPTS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <button
              type="button"
              onClick={addStat}
              disabled={addingStat}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-semibold uppercase tracking-widest border border-yellow text-yellow hover:bg-yellow/10 disabled:opacity-40 transition-all"
            >
              <Plus size={14} />
              {addingStat ? 'Adding…' : 'Add Stat'}
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
