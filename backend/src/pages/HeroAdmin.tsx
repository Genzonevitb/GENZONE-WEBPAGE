import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Save, Plus, Trash2, GripVertical } from 'lucide-react'

interface MarqueeWord {
  id: string
  word: string
  sort_order: number
}

const HERO_KEYS = ['hero_line_1', 'hero_line_2', 'hero_line_3', 'hero_subtitle']
const HERO_LABELS: Record<string, string> = {
  hero_line_1:   'Headline Line 1',
  hero_line_2:   'Headline Line 2',
  hero_line_3:   'Headline Line 3 (neon)',
  hero_subtitle: 'Subtitle',
}
const HERO_DEFAULTS: Record<string, string> = {
  hero_line_1:   'NOT ANOTHER',
  hero_line_2:   'CLUB. THIS IS',
  hero_line_3:   'GENZONE.',
  hero_subtitle: 'Where creativity gets louder, ideas get bolder, and possibilities have no limits.',
}

export default function HeroAdmin() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [changed, setChanged] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const [words, setWords] = useState<MarqueeWord[]>([])
  const [newWord, setNewWord] = useState('')
  const [addingWord, setAddingWord] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [settingsRes, wordsRes] = await Promise.all([
      supabase.from('settings').select('key, value').in('key', HERO_KEYS),
      supabase.from('marquee_words').select('id, word, sort_order').order('sort_order', { ascending: true }),
    ])
    if (settingsRes.data) {
      setSettings(Object.fromEntries(settingsRes.data.map((r) => [r.key, r.value ?? ''])))
    }
    if (wordsRes.data) setWords(wordsRes.data as MarqueeWord[])
    setLoading(false)
  }

  function handleChange(key: string, value: string) {
    setChanged((prev) => ({ ...prev, [key]: value }))
  }

  async function saveHeroText() {
    if (Object.keys(changed).length === 0) { toast.info('No changes to save.'); return }
    setSaving(true)
    const rows = Object.entries(changed).map(([key, value]) => ({ key, value }))
    const { error } = await supabase.from('settings').upsert(rows, { onConflict: 'key' })
    if (error) {
      toast.error('Failed to save: ' + error.message)
    } else {
      toast.success('Hero text saved!')
      setChanged({})
      fetchAll()
    }
    setSaving(false)
  }

  async function addWord() {
    const word = newWord.trim()
    if (!word) { toast.error('Word cannot be empty.'); return }
    setAddingWord(true)
    const nextOrder = words.length > 0 ? Math.max(...words.map((w) => w.sort_order)) + 1 : 0
    const { error } = await supabase.from('marquee_words').insert([{ word, sort_order: nextOrder }])
    if (error) {
      toast.error('Failed to add word: ' + error.message)
    } else {
      toast.success(`"${word}" added to marquee.`)
      setNewWord('')
      fetchAll()
    }
    setAddingWord(false)
  }

  async function deleteWord(id: string) {
    setDeletingId(id)
    const { error } = await supabase.from('marquee_words').delete().eq('id', id)
    if (error) {
      toast.error('Failed to delete.')
    } else {
      toast.success('Word removed.')
      setWords((prev) => prev.filter((w) => w.id !== id))
    }
    setDeletingId(null)
  }

  async function moveWord(id: string, direction: 'up' | 'down') {
    const idx = words.findIndex((w) => w.id === id)
    if (idx === -1) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= words.length) return

    const updated = [...words]
    const aOrder = updated[idx].sort_order
    const bOrder = updated[swapIdx].sort_order
    updated[idx] = { ...updated[idx], sort_order: bOrder }
    updated[swapIdx] = { ...updated[swapIdx], sort_order: aOrder }

    setWords([...updated].sort((a, b) => a.sort_order - b.sort_order))

    await Promise.all([
      supabase.from('marquee_words').update({ sort_order: bOrder }).eq('id', updated[idx].id),
      supabase.from('marquee_words').update({ sort_order: aOrder }).eq('id', updated[swapIdx].id),
    ])
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
        <p className="font-mono text-xs text-cyan tracking-[0.3em] uppercase mb-2">06 — Hero</p>
        <h1 className="font-display text-3xl font-black uppercase">Hero Section</h1>
        <p className="text-muted-foreground text-sm mt-2">Edit the main headline, subtitle, and scrolling marquee words.</p>
      </div>

      <div className="space-y-10">
        {/* Hero text fields */}
        <section>
          <h2 className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-6 pb-2 border-b border-border">
            Headline & Subtitle
          </h2>
          <div className="space-y-5">
            {HERO_KEYS.map((key) => {
              const val = changed[key] ?? settings[key] ?? ''
              return (
                <div key={key}>
                  <label className="block font-mono text-xs text-muted-foreground uppercase tracking-widest mb-2">
                    {HERO_LABELS[key]}
                    <span className="ml-2 normal-case text-border">— fallback: "{HERO_DEFAULTS[key]}"</span>
                  </label>
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => handleChange(key, e.target.value)}
                    placeholder={HERO_DEFAULTS[key]}
                    className="w-full bg-charcoal border border-border rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan transition-all"
                  />
                </div>
              )
            })}
          </div>
          <button
            type="button"
            onClick={saveHeroText}
            disabled={saving || Object.keys(changed).length === 0}
            className="mt-6 flex items-center gap-2 px-6 py-3 rounded-xl font-mono text-sm font-semibold uppercase tracking-widest bg-cyan text-background hover:bg-cyan/90 disabled:opacity-40 transition-all"
          >
            <Save size={15} />
            {saving ? 'Saving…' : 'Save Hero Text'}
          </button>
        </section>

        {/* Marquee words */}
        <section>
          <h2 className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-6 pb-2 border-b border-border">
            Marquee Words ({words.length})
          </h2>
          <div className="space-y-2 mb-6">
            {words.map((w, i) => (
              <div key={w.id} className="flex items-center gap-3 bg-charcoal rounded-lg px-4 py-3 border border-border">
                <GripVertical size={14} className="text-muted-foreground shrink-0" />
                <span className="flex-1 font-display text-sm font-black uppercase">{w.word}</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => moveWord(w.id, 'up')}
                    disabled={i === 0}
                    className="font-mono text-xs text-muted-foreground hover:text-cyan disabled:opacity-30 px-2"
                    title="Move up"
                  >↑</button>
                  <button
                    type="button"
                    onClick={() => moveWord(w.id, 'down')}
                    disabled={i === words.length - 1}
                    className="font-mono text-xs text-muted-foreground hover:text-cyan disabled:opacity-30 px-2"
                    title="Move down"
                  >↓</button>
                  <button
                    type="button"
                    onClick={() => deleteWord(w.id)}
                    disabled={deletingId === w.id}
                    className="text-muted-foreground hover:text-pink transition-colors ml-1"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
            {words.length === 0 && (
              <p className="font-mono text-xs text-muted-foreground">No words yet — add some below.</p>
            )}
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addWord()}
              placeholder="New word (e.g. Innovate)"
              className="flex-1 bg-charcoal border border-border rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-yellow/50 focus:border-yellow transition-all"
            />
            <button
              type="button"
              onClick={addWord}
              disabled={addingWord || !newWord.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-semibold uppercase tracking-widest border border-yellow text-yellow hover:bg-yellow/10 disabled:opacity-40 transition-all"
            >
              <Plus size={14} />
              {addingWord ? 'Adding…' : 'Add'}
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
