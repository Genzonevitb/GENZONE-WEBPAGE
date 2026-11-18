import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import {
  Save,
  RotateCcw,
  Search,
  UploadCloud,
  CheckCircle2,
  FileEdit,
  Type,
} from 'lucide-react'

interface TextEntry {
  group: string
  key: string
  shortKey: string
  defaultText: string
}

const TEXT_ENTRIES: TextEntry[] = [
  // INTRO
  {
    group: 'INTRO',
    key: 'text.intro.tagline',
    shortKey: 'intro.tagline',
    defaultText: 'NOT ANOTHER CLUB. THIS IS GENZONE.',
  },
  // HERO
  {
    group: 'HERO',
    key: 'text.hero.line1',
    shortKey: 'hero.line1',
    defaultText: 'NOT ANOTHER',
  },
  {
    group: 'HERO',
    key: 'text.hero.line2',
    shortKey: 'hero.line2',
    defaultText: 'CLUB. THIS IS',
  },
  {
    group: 'HERO',
    key: 'text.hero.line3',
    shortKey: 'hero.line3',
    defaultText: 'GENZONE.',
  },
  {
    group: 'HERO',
    key: 'text.hero.subtitle',
    shortKey: 'hero.subtitle',
    defaultText: 'Where creativity gets louder, ideas get bolder, and possibilities have no limits.',
  },
  // ABOUT
  {
    group: 'ABOUT',
    key: 'text.about.label',
    shortKey: 'about.label',
    defaultText: 'About GenZone',
  },
  {
    group: 'ABOUT',
    key: 'text.about.heading',
    shortKey: 'about.heading',
    defaultText: 'A playground for people who make things.',
  },
  {
    group: 'ABOUT',
    key: 'text.about.paragraph',
    shortKey: 'about.paragraph',
    defaultText:
      "GenZone is the college's creative and technical club — a crew of designers, coders, filmmakers, artists and curious minds who'd rather build than sit still.",
  },
  {
    group: 'ABOUT',
    key: 'text.about.story',
    shortKey: 'about.story',
    defaultText: '[Placeholder: your club\'s story, mission and founding year go here.]',
  },
  {
    group: 'ABOUT',
    key: 'text.about.watermark',
    shortKey: 'about.watermark',
    defaultText: 'LOUDER BOLDER',
  },
  // EVENTS
  {
    group: 'EVENTS',
    key: 'text.events.section_label',
    shortKey: 'events.section_label',
    defaultText: 'Events & Activities',
  },
  {
    group: 'EVENTS',
    key: 'text.events.section_heading',
    shortKey: 'events.section_heading',
    defaultText: "What's going down.",
  },
  {
    group: 'EVENTS',
    key: 'text.events.empty_state',
    shortKey: 'events.empty_state',
    defaultText: 'No events yet — check back soon.',
  },
  // GALLERY
  {
    group: 'GALLERY',
    key: 'text.gallery.section_label',
    shortKey: 'gallery.section_label',
    defaultText: 'GenZone Memories',
  },
  {
    group: 'GALLERY',
    key: 'text.gallery.section_heading',
    shortKey: 'gallery.section_heading',
    defaultText: 'Proof it happened.',
  },
  {
    group: 'GALLERY',
    key: 'text.gallery.empty_state',
    shortKey: 'gallery.empty_state',
    defaultText: 'No photos yet — upload some from the admin panel.',
  },
  // PANEL
  {
    group: 'PANEL',
    key: 'text.panel.section_label',
    shortKey: 'panel.section_label',
    defaultText: 'Meet the Panel',
  },
  {
    group: 'PANEL',
    key: 'text.panel.section_heading',
    shortKey: 'panel.section_heading',
    defaultText: 'The people behind the noise.',
  },
  // FEEDBACK
  {
    group: 'FEEDBACK',
    key: 'text.feedback.section_label',
    shortKey: 'feedback.section_label',
    defaultText: 'Suggestions & Feedback',
  },
  {
    group: 'FEEDBACK',
    key: 'text.feedback.section_heading',
    shortKey: 'feedback.section_heading',
    defaultText: 'Got something loud to say?',
  },
  {
    group: 'FEEDBACK',
    key: 'text.feedback.subtitle',
    shortKey: 'feedback.subtitle',
    defaultText: 'Ideas, rants, collabs — drop them here. The panel reads everything.',
  },
  {
    group: 'FEEDBACK',
    key: 'text.feedback.name_placeholder',
    shortKey: 'feedback.name_placeholder',
    defaultText: 'Your name *',
  },
  {
    group: 'FEEDBACK',
    key: 'text.feedback.email_placeholder',
    shortKey: 'feedback.email_placeholder',
    defaultText: 'Email (optional)',
  },
  {
    group: 'FEEDBACK',
    key: 'text.feedback.message_placeholder',
    shortKey: 'feedback.message_placeholder',
    defaultText: 'Your message *',
  },
  {
    group: 'FEEDBACK',
    key: 'text.feedback.submit_button',
    shortKey: 'feedback.submit_button',
    defaultText: 'Send it',
  },
  {
    group: 'FEEDBACK',
    key: 'text.feedback.success_prefix',
    shortKey: 'feedback.success_prefix',
    defaultText: 'Thanks',
  },
  {
    group: 'FEEDBACK',
    key: 'text.feedback.success_suffix',
    shortKey: 'feedback.success_suffix',
    defaultText: '! Your',
  },
  // FOOTER
  {
    group: 'FOOTER',
    key: 'text.footer.tagline',
    shortKey: 'footer.tagline',
    defaultText: 'Not another club.',
  },
  {
    group: 'FOOTER',
    key: 'text.footer.copyright_prefix',
    shortKey: 'footer.copyright_prefix',
    defaultText: '©',
  },
  {
    group: 'FOOTER',
    key: 'text.footer.contact_label',
    shortKey: 'footer.contact_label',
    defaultText: 'Contact',
  },
  {
    group: 'FOOTER',
    key: 'text.footer.follow_label',
    shortKey: 'footer.follow_label',
    defaultText: 'Follow',
  },
  {
    group: 'FOOTER',
    key: 'text.footer.scroll_label',
    shortKey: 'footer.scroll_label',
    defaultText: 'Scroll to explore',
  },
]

export default function TextTypography() {
  const [values, setValues] = useState<Record<string, string>>({})
  const [publishedValues, setPublishedValues] = useState<Record<string, string>>({})
  const [draftKeys, setDraftKeys] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL')
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [publishingAll, setPublishingAll] = useState(false)

  const groups = ['ALL', 'INTRO', 'HERO', 'ABOUT', 'EVENTS', 'GALLERY', 'PANEL', 'FEEDBACK', 'FOOTER']

  useEffect(() => {
    fetchTexts()
  }, [])

  async function fetchTexts() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('site_config')
        .select('key, status, value')
        .like('key', 'text.%')

      if (error) throw error

      const valMap: Record<string, string> = {}
      const pubMap: Record<string, string> = {}
      const drafts = new Set<string>()

      TEXT_ENTRIES.forEach((e) => {
        valMap[e.key] = e.defaultText
        pubMap[e.key] = e.defaultText
      })

      if (data) {
        data.forEach((row) => {
          const textVal = row.value?.text
          if (typeof textVal === 'string') {
            if (row.status === 'published') {
              pubMap[row.key] = textVal
              valMap[row.key] = textVal
            } else if (row.status === 'draft') {
              valMap[row.key] = textVal
              drafts.add(row.key)
            }
          }
        })
      }

      setValues(valMap)
      setPublishedValues(pubMap)
      setDraftKeys(drafts)
    } catch (err: any) {
      console.warn('Error fetching texts from site_config:', err.message)
      // Populate defaults
      const defaults: Record<string, string> = {}
      TEXT_ENTRIES.forEach((e) => {
        defaults[e.key] = e.defaultText
      })
      setValues(defaults)
      setPublishedValues(defaults)
    } finally {
      setLoading(false)
    }
  }

  function handleTextChange(key: string, newText: string) {
    setValues((prev) => ({ ...prev, [key]: newText }))
    setDraftKeys((prev) => new Set(prev).add(key))
  }

  async function saveAsDraft(key: string) {
    setSavingKey(key)
    try {
      const textVal = values[key] ?? ''
      const { error } = await supabase.from('site_config').upsert(
        {
          key,
          status: 'draft',
          value: { text: textVal },
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key,status' }
      )
      if (error) throw error
      setDraftKeys((prev) => new Set(prev).add(key))
      toast.success('Saved as draft!')
    } catch (err: any) {
      toast.error('Failed to save draft: ' + err.message)
    } finally {
      setSavingKey(null)
    }
  }

  async function publishSingle(key: string) {
    setSavingKey(key)
    try {
      const textVal = values[key] ?? ''
      const now = new Date().toISOString()
      // Upsert published
      const { error: pubError } = await supabase.from('site_config').upsert(
        {
          key,
          status: 'published',
          value: { text: textVal },
          updated_at: now,
        },
        { onConflict: 'key,status' }
      )
      if (pubError) throw pubError

      // Remove draft row if exists
      await supabase.from('site_config').delete().eq('key', key).eq('status', 'draft')

      setPublishedValues((prev) => ({ ...prev, [key]: textVal }))
      setDraftKeys((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
      toast.success('Published live!')
    } catch (err: any) {
      toast.error('Failed to publish: ' + err.message)
    } finally {
      setSavingKey(null)
    }
  }

  function resetToDefault(key: string) {
    const entry = TEXT_ENTRIES.find((e) => e.key === key)
    if (!entry) return
    handleTextChange(key, entry.defaultText)
    toast.info(`Reset "${entry.shortKey}" to default`)
  }

  async function publishAllDrafts() {
    const keysToPublish = Array.from(draftKeys)
    if (keysToPublish.length === 0) {
      toast.info('No pending drafts to publish.')
      return
    }

    setPublishingAll(true)
    try {
      const rows = keysToPublish.map((key) => ({
        key,
        status: 'published',
        value: { text: values[key] ?? '' },
        updated_at: new Date().toISOString(),
      }))

      const { error } = await supabase.from('site_config').upsert(rows, { onConflict: 'key,status' })
      if (error) throw error

      // Clean up drafts
      await supabase.from('site_config').delete().in('key', keysToPublish).eq('status', 'draft')

      const updatedPub = { ...publishedValues }
      keysToPublish.forEach((k) => {
        updatedPub[k] = values[k]
      })
      setPublishedValues(updatedPub)
      setDraftKeys(new Set())
      toast.success(`Published all ${keysToPublish.length} drafts!`)
    } catch (err: any) {
      toast.error('Failed to publish all drafts: ' + err.message)
    } finally {
      setPublishingAll(false)
    }
  }

  const filteredEntries = TEXT_ENTRIES.filter((item) => {
    const matchesGroup = selectedGroup === 'ALL' || item.group === selectedGroup
    const query = search.toLowerCase()
    const matchesSearch =
      item.shortKey.toLowerCase().includes(query) ||
      (values[item.key] ?? '').toLowerCase().includes(query) ||
      item.group.toLowerCase().includes(query)
    return matchesGroup && matchesSearch
  })

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="font-mono text-xs text-cyan tracking-[0.3em] uppercase mb-1">
            05 — Text & Typography
          </p>
          <h1 className="font-display text-3xl font-black uppercase">Website Text Strings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Edit all public website text strings, placeholders, and labels with draft & publish control.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={publishAllDrafts}
            disabled={publishingAll || draftKeys.size === 0}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan text-background hover:bg-cyan/90 text-xs font-mono font-semibold uppercase tracking-widest disabled:opacity-40 transition-all shadow-lg shadow-cyan/10"
          >
            <UploadCloud size={16} />
            {publishingAll ? 'Publishing…' : `Publish All Drafts (${draftKeys.size})`}
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by key name or text content…"
            className="w-full bg-charcoal border border-border rounded-xl pl-11 pr-4 py-3 text-sm font-mono focus:outline-none focus:border-cyan text-foreground placeholder:text-muted-foreground/60 transition-all"
          />
        </div>

        {/* Section Tabs */}
        <div className="flex flex-wrap gap-2">
          {groups.map((grp) => (
            <button
              key={grp}
              type="button"
              onClick={() => setSelectedGroup(grp)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all ${
                selectedGroup === grp
                  ? 'bg-cyan text-background font-bold shadow'
                  : 'bg-charcoal border border-border text-muted-foreground hover:text-white hover:border-cyan/40'
              }`}
            >
              {grp}
            </button>
          ))}
        </div>
      </div>

      {/* Rows */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse h-28 bg-charcoal/50 rounded-xl border border-border" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map((item) => {
            const currentVal = values[item.key] ?? ''
            const isDraft = draftKeys.has(item.key)
            const isSaving = savingKey === item.key
            const isLong =
              item.key.includes('paragraph') ||
              item.key.includes('story') ||
              item.key.includes('subtitle')

            return (
              <div
                key={item.key}
                className={`p-5 rounded-xl border bg-charcoal/40 transition-all ${
                  isDraft ? 'border-yellow/50 bg-yellow/[0.02]' : 'border-border'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-0.5 rounded-md bg-black/60 border border-border font-mono text-[10px] text-cyan uppercase font-bold tracking-wider">
                      {item.group}
                    </span>
                    <span className="font-mono text-xs text-foreground font-semibold">
                      {item.shortKey}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isDraft ? (
                      <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-yellow font-bold bg-yellow/10 border border-yellow/30 px-2 py-0.5 rounded">
                        <FileEdit size={11} /> Unsaved Draft
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-green-400 bg-green-500/10 border border-green-500/30 px-2 py-0.5 rounded">
                        <CheckCircle2 size={11} /> Published
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {isLong ? (
                    <textarea
                      rows={3}
                      value={currentVal}
                      onChange={(e) => handleTextChange(item.key, e.target.value)}
                      placeholder={item.defaultText}
                      className="w-full bg-black/50 border border-border rounded-lg p-3 text-sm font-sans text-foreground focus:outline-none focus:border-cyan transition-all resize-y"
                    />
                  ) : (
                    <input
                      type="text"
                      value={currentVal}
                      onChange={(e) => handleTextChange(item.key, e.target.value)}
                      placeholder={item.defaultText}
                      className="w-full bg-black/50 border border-border rounded-lg px-3 py-2.5 text-sm font-sans text-foreground focus:outline-none focus:border-cyan transition-all"
                    />
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <p className="font-mono text-[11px] text-muted-foreground/70 truncate max-w-md">
                      Default: <span className="italic">{item.defaultText}</span>
                    </p>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => resetToDefault(item.key)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-[11px] font-mono uppercase tracking-wider text-muted-foreground hover:text-white hover:bg-border/30 transition-all"
                      >
                        <RotateCcw size={12} />
                        Default
                      </button>

                      <button
                        type="button"
                        onClick={() => saveAsDraft(item.key)}
                        disabled={isSaving}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-yellow/40 text-yellow hover:bg-yellow/10 text-[11px] font-mono uppercase tracking-wider transition-all"
                      >
                        <Save size={12} />
                        Draft
                      </button>

                      <button
                        type="button"
                        onClick={() => publishSingle(item.key)}
                        disabled={isSaving}
                        className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-cyan text-background hover:bg-cyan/90 text-[11px] font-mono font-semibold uppercase tracking-wider transition-all"
                      >
                        <UploadCloud size={12} />
                        Publish
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {filteredEntries.length === 0 && (
            <div className="p-12 text-center text-muted-foreground font-mono text-sm bg-charcoal/30 rounded-xl border border-border">
              No matching text strings found for "{search}".
            </div>
          )}
        </div>
      )}
    </div>
  )
}
