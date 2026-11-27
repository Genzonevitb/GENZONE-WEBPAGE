import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Save, UploadCloud, Palette, Sliders, Type } from 'lucide-react'

const FONT_OPTIONS = [
  'Unbounded',
  'Orbitron',
  'Rajdhani',
  'Exo 2',
  'Bebas Neue',
  'Oswald',
  'Roboto Condensed',
  'Inter',
  'Poppins',
  'Montserrat',
  'Space Grotesk',
  'JetBrains Mono',
]

interface GlobalFonts {
  display: string
  body: string
  mono: string
}

interface BrandColors {
  cyan: string
  pink: string
  yellow: string
  background: string
}

const DEFAULT_FONTS: GlobalFonts = {
  display: 'Unbounded',
  body: 'Space Grotesk',
  mono: 'JetBrains Mono',
}

const DEFAULT_COLORS: BrandColors = {
  cyan: '#00f0ff',
  pink: '#ff007f',
  yellow: '#ffe600',
  background: '#121212',
}

export default function GlobalControls() {
  const [fonts, setFonts] = useState<GlobalFonts>(DEFAULT_FONTS)
  const [colors, setColors] = useState<BrandColors>(DEFAULT_COLORS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [hasDraft, setHasDraft] = useState(false)

  useEffect(() => {
    fetchConfigs()
  }, [])

  async function fetchConfigs() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('site_config')
        .select('*')
        .in('key', ['global_fonts', 'brand_colors'])

      if (error) throw error

      if (data && data.length > 0) {
        let draftFound = false
        data.forEach((row) => {
          if (row.key === 'global_fonts') {
            if (row.status === 'draft') {
              setFonts((prev) => ({ ...prev, ...row.value }))
              draftFound = true
            } else if (row.status === 'published' && !draftFound) {
              setFonts((prev) => ({ ...prev, ...row.value }))
            }
          }
          if (row.key === 'brand_colors') {
            if (row.status === 'draft') {
              setColors((prev) => ({ ...prev, ...row.value }))
              draftFound = true
            } else if (row.status === 'published' && !draftFound) {
              setColors((prev) => ({ ...prev, ...row.value }))
            }
          }
        })
        setHasDraft(draftFound)
      }
    } catch (err: any) {
      console.warn('Silent fallback on fetchConfigs:', err.message)
    } finally {
      setLoading(false)
    }
  }

  function updateFont<K extends keyof GlobalFonts>(field: K, value: string) {
    setFonts((prev) => ({ ...prev, [field]: value }))
  }

  function updateColor<K extends keyof BrandColors>(field: K, value: string) {
    setColors((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSaveDraft() {
    setSaving(true)
    try {
      const now = new Date().toISOString()
      const rows = [
        {
          key: 'global_fonts',
          status: 'draft',
          value: fonts,
          updated_at: now,
        },
        {
          key: 'brand_colors',
          status: 'draft',
          value: colors,
          updated_at: now,
        },
      ]

      const { error } = await supabase.from('site_config').upsert(rows, { onConflict: 'key,status' })
      if (error) throw error

      setHasDraft(true)
      toast.success('Saved fonts & colors as draft!')
    } catch (err: any) {
      toast.error('Failed to save draft: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handlePublish() {
    setPublishing(true)
    try {
      const now = new Date().toISOString()
      const rows = [
        {
          key: 'global_fonts',
          status: 'published',
          value: fonts,
          updated_at: now,
        },
        {
          key: 'brand_colors',
          status: 'published',
          value: colors,
          updated_at: now,
        },
      ]

      const { error } = await supabase.from('site_config').upsert(rows, { onConflict: 'key,status' })
      if (error) throw error

      // Clean up drafts
      await supabase.from('site_config').delete().in('key', ['global_fonts', 'brand_colors']).eq('status', 'draft')

      setHasDraft(false)
      toast.success('Global controls published live!')
    } catch (err: any) {
      toast.error('Failed to publish: ' + err.message)
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="font-mono text-xs text-cyan tracking-[0.3em] uppercase">
              02 — Design System
            </p>
            {hasDraft && (
              <span className="font-mono text-[10px] uppercase tracking-wider text-yellow font-bold bg-yellow/10 border border-yellow/30 px-2 py-0.5 rounded">
                Draft Pending
              </span>
            )}
          </div>
          <h1 className="font-display text-3xl font-black uppercase">Global Controls</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configure site-wide typography and brand accent colors with live preview.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-yellow/40 text-yellow hover:bg-yellow/10 text-xs font-mono font-semibold uppercase tracking-wider transition-all disabled:opacity-40"
          >
            <Save size={15} />
            {saving ? 'Saving…' : 'Save Draft'}
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={publishing}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan text-background hover:bg-cyan/90 text-xs font-mono font-semibold uppercase tracking-widest transition-all disabled:opacity-40 shadow-lg shadow-cyan/10"
          >
            <UploadCloud size={16} />
            {publishing ? 'Publishing…' : 'Publish Live'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Controls Column */}
        <div className="lg:col-span-7 space-y-8">
          {/* Typography */}
          <section className="bg-charcoal/50 border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Type size={16} className="text-cyan" />
              <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-white">
                Global Typography
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-mono text-xs text-muted-foreground uppercase tracking-widest mb-1.5">
                  Display Font (Headlines)
                </label>
                <select
                  value={fonts.display}
                  onChange={(e) => updateFont('display', e.target.value)}
                  className="w-full bg-black/50 border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-cyan"
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-mono text-xs text-muted-foreground uppercase tracking-widest mb-1.5">
                  Body Font (Paragraphs & UI)
                </label>
                <select
                  value={fonts.body}
                  onChange={(e) => updateFont('body', e.target.value)}
                  className="w-full bg-black/50 border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-cyan"
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-mono text-xs text-muted-foreground uppercase tracking-widest mb-1.5">
                  Mono Font (Badges & Code)
                </label>
                <select
                  value={fonts.mono}
                  onChange={(e) => updateFont('mono', e.target.value)}
                  className="w-full bg-black/50 border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-cyan"
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Brand Colors */}
          <section className="bg-charcoal/50 border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Palette size={16} className="text-cyan" />
              <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-white">
                Brand Palette Colors
              </h2>
            </div>

            <div className="space-y-4">
              {[
                { key: 'cyan', label: 'Cyan Accent (Primary)' },
                { key: 'pink', label: 'Pink Accent (Secondary)' },
                { key: 'yellow', label: 'Yellow Accent (Highlight)' },
                { key: 'background', label: 'Dark Background' },
              ].map(({ key, label }) => {
                const val = colors[key as keyof BrandColors]
                const isHex = val.startsWith('#') && (val.length === 7 || val.length === 4)
                return (
                  <div key={key}>
                    <label className="block font-mono text-xs text-muted-foreground uppercase tracking-widest mb-1.5">
                      {label}
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={isHex ? val : '#00f0ff'}
                        onChange={(e) => updateColor(key as keyof BrandColors, e.target.value)}
                        className="h-9 w-10 rounded border border-border bg-transparent cursor-pointer p-0"
                      />
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => updateColor(key as keyof BrandColors, e.target.value)}
                        className="flex-1 bg-black/50 border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-cyan"
                        placeholder="#00f0ff or oklch(...)"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </div>

        {/* Live Preview Column */}
        <div className="lg:col-span-5 sticky top-6 space-y-5">
          {/* Typography Sample Card */}
          <div className="bg-charcoal/70 border border-border rounded-2xl p-5 space-y-4 shadow-xl">
            <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-cyan border-b border-border pb-2">
              Typography Preview
            </h3>

            <div className="space-y-4">
              <div>
                <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  Display: {fonts.display}
                </p>
                <h2
                  style={{ fontFamily: fonts.display }}
                  className="text-2xl font-black uppercase tracking-tight text-white leading-none"
                >
                  NOT ANOTHER CLUB. THIS IS GENZONE.
                </h2>
              </div>

              <div>
                <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  Body: {fonts.body}
                </p>
                <p
                  style={{ fontFamily: fonts.body }}
                  className="text-sm text-muted-foreground leading-relaxed"
                >
                  A crew of designers, coders, filmmakers, artists, and curious minds who'd rather build than sit still.
                </p>
              </div>

              <div>
                <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  Mono: {fonts.mono}
                </p>
                <div
                  style={{ fontFamily: fonts.mono }}
                  className="text-xs text-cyan uppercase tracking-widest border border-cyan/40 bg-cyan/10 px-3 py-1.5 rounded-lg inline-block"
                >
                  01 // EXPERIMENT_042 [PASS]
                </div>
              </div>
            </div>
          </div>

          {/* Color Swatches Card */}
          <div className="bg-charcoal/70 border border-border rounded-2xl p-5 space-y-4 shadow-xl">
            <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-cyan border-b border-border pb-2">
              Color Swatches Preview
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {[
                { name: 'Cyan', color: colors.cyan },
                { name: 'Pink', color: colors.pink },
                { name: 'Yellow', color: colors.yellow },
                { name: 'Background', color: colors.background },
              ].map((c) => (
                <div key={c.name} className="p-3 rounded-xl border border-border/80 bg-black/40 space-y-2">
                  <div
                    className="h-12 w-full rounded-lg border border-white/10 shadow"
                    style={{ backgroundColor: c.color }}
                  />
                  <div>
                    <div className="font-mono text-xs font-bold text-white">{c.name}</div>
                    <div className="font-mono text-[10px] text-muted-foreground truncate">{c.color}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Combined Mini Card preview */}
            <div
              style={{ backgroundColor: colors.background }}
              className="p-4 rounded-xl border border-white/20 space-y-2 text-center"
            >
              <span
                style={{ color: colors.cyan }}
                className="font-mono text-[10px] uppercase tracking-widest"
              >
                Cyan Tag
              </span>
              <div
                style={{ color: colors.pink, fontFamily: fonts.display }}
                className="text-lg font-black uppercase"
              >
                Pink Headline
              </div>
              <div
                style={{ color: colors.yellow }}
                className="font-mono text-xs uppercase tracking-wider"
              >
                ✦ Yellow Highlight ✦
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
