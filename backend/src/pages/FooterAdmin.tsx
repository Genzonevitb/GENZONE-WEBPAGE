import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Save, Upload, Eye, EyeOff, Plus, Trash2, GripVertical } from 'lucide-react'
import { uploadImage } from '@/lib/uploadImage'
import ImageDropzone from '@/components/ImageDropzone'

// ─── Types ───────────────────────────────────────────────────────────────────

interface SocialLink {
  label: string
  href: string
  color: 'cyan' | 'pink' | 'yellow' | 'white'
}

interface FooterConfig {
  // Ghost text
  ghost_text: string
  ghost_text_visible: boolean
  ghost_text_gradient_from: string
  ghost_text_gradient_to: string
  ghost_text_opacity: number

  // Logo
  logo_visible: boolean

  // Contact column
  contact_heading: string
  contact_heading_color: 'cyan' | 'pink' | 'yellow' | 'white'
  contact_email: string
  contact_location: string

  // Follow column
  follow_heading: string
  follow_heading_color: 'cyan' | 'pink' | 'yellow' | 'white'
  socials: SocialLink[]

  // Copyright bar
  copyright_left: string
  copyright_right: string

  // Background
  bg_color: string
  padding_top: number
  padding_bottom: number
}

const DEFAULT: FooterConfig = {
  ghost_text: 'GENZONE',
  ghost_text_visible: true,
  ghost_text_gradient_from: '#00bfff',
  ghost_text_gradient_to: '#ff69b4',
  ghost_text_opacity: 100,

  logo_visible: true,

  contact_heading: 'Contact',
  contact_heading_color: 'cyan',
  contact_email: 'email@placeholder.com',
  contact_location: 'Campus address — to be added',

  follow_heading: 'Follow',
  follow_heading_color: 'pink',
  socials: [
    { label: 'Instagram', href: 'https://www.instagram.com/genzone_vitb', color: 'pink' },
    { label: 'LinkedIn',  href: '#', color: 'white' },
    { label: 'YouTube',   href: '#', color: 'white' },
    { label: 'X',         href: '#', color: 'white' },
  ],

  copyright_left:  '© {year} GENZONE',
  copyright_right: 'Turning Trends Into Tradition',

  bg_color: '#000000',
  padding_top: 96,
  padding_bottom: 40,
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const colorClass: Record<string, string> = {
  cyan: 'text-[#00f0ff]',
  pink: 'text-[#ff007f]',
  yellow: 'text-[#ffe600]',
  white: 'text-white',
}

const baseFieldCls =
  'bg-black/50 border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-cyan'
const inputCls = `w-full ${baseFieldCls}`
const labelCls = 'block font-mono text-[11px] text-muted-foreground uppercase mb-1.5 tracking-widest'
const sectionCls = 'bg-charcoal/50 border border-border rounded-xl p-5 space-y-4'

function inferSocialLabel(url: string): string | null {
  const lower = url.toLowerCase()
  if (lower.includes('instagram.com') || lower.includes('instagr.am')) return 'Instagram'
  if (lower.includes('linkedin.com')) return 'LinkedIn'
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'YouTube'
  if (lower.includes('x.com') || lower.includes('twitter.com')) return 'X'
  return null
}

function PreviewSocialBadgeIcon({ label, href }: { label: string; href: string }) {
  const key = `${label} ${href}`.toLowerCase()
  if (key.includes('insta')) {
    return (
      <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-[4px] bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white shadow-[0_0_8px_rgba(238,42,123,0.85)]">
        <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      </span>
    )
  }
  return null
}

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={e => onChange(e.target.value)}
          className="w-10 h-8 rounded cursor-pointer border border-border bg-transparent" />
        <input type="text" value={value} onChange={e => onChange(e.target.value)}
          className={`${baseFieldCls} min-w-0 flex-1`} placeholder="#000000" />
      </div>
    </div>
  )
}

function AccentSelect({ value, onChange }: { value: string; onChange: (v: 'cyan'|'pink'|'yellow'|'white') => void }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value as any)}
      className={`${baseFieldCls} w-24 shrink-0`}>
      {['cyan','pink','yellow','white'].map(c => <option key={c} value={c}>{c}</option>)}
    </select>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function FooterAdmin() {
  const [cfg, setCfg] = useState<FooterConfig>(DEFAULT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [hasDraft, setHasDraft] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    try {
      // Load footer_config from site_config and legacy settings keys to merge smoothly
      const [{ data: cfgRows }, { data: settingsRows }] = await Promise.all([
        supabase.from('site_config').select('*').eq('key', 'footer_config'),
        supabase
          .from('settings')
          .select('key, value')
          .in('key', ['logo_url', 'contact_email', 'location', 'footer_tagline', 'instagram', 'linkedin', 'youtube', 'twitter']),
      ])

      const legacy = Object.fromEntries((settingsRows ?? []).map(r => [r.key, r.value ?? ''])) as Record<string, string>
      if (legacy.logo_url) setLogoUrl(legacy.logo_url)

      let nextCfg: FooterConfig = { ...DEFAULT }
      if (cfgRows && cfgRows.length > 0) {
        const draft = cfgRows.find(r => r.status === 'draft')
        const pub   = cfgRows.find(r => r.status === 'published')
        const row   = draft ?? pub
        if (row?.value) {
          nextCfg = { ...DEFAULT, ...(row.value as any) }
          setHasDraft(!!draft)
        }
      }

      // Migrate non-placeholder legacy settings into footer config when footer still has defaults
      const isValidVal = (v?: string) => Boolean(v && v.trim() && v.trim() !== '#')
      if (nextCfg.contact_email === DEFAULT.contact_email && isValidVal(legacy.contact_email)) {
        nextCfg.contact_email = legacy.contact_email
      }
      if (nextCfg.contact_location === DEFAULT.contact_location && isValidVal(legacy.location)) {
        nextCfg.contact_location = legacy.location
      }

      nextCfg.socials = (nextCfg.socials?.length ? nextCfg.socials : DEFAULT.socials).map(s => {
        const k = s.label.trim().toLowerCase()
        const legacyKey = k.includes('insta') ? 'instagram' : k.includes('linkedin') ? 'linkedin' : k.includes('youtube') ? 'youtube' : (k === 'x' || k.includes('twitter')) ? 'twitter' : ''
        const existingHref = s.href?.trim()
        if (existingHref && existingHref !== '#') return s
        if (legacyKey && isValidVal(legacy[legacyKey])) {
          return { ...s, href: legacy[legacyKey] }
        }
        if (k.includes('insta')) {
          return { ...s, href: 'https://www.instagram.com/genzone_vitb' }
        }
        return s
      })

      setCfg(nextCfg)
    } catch (e: any) {
      console.warn('FooterAdmin fetchAll:', e.message)
    } finally {
      setLoading(false)
    }
  }

  function update<K extends keyof FooterConfig>(key: K, value: FooterConfig[K]) {
    setCfg(prev => ({ ...prev, [key]: value }))
  }

  function updateSocial(i: number, field: keyof SocialLink, value: string) {
    const s = [...cfg.socials]
    const current = { ...s[i], [field]: value }
    if (field === 'href') {
      const inferred = inferSocialLabel(value)
      if (inferred && (!current.label?.trim() || current.label.trim().toLowerCase() === 'new link')) {
        current.label = inferred
        if (inferred === 'Instagram' && current.color === 'white') current.color = 'pink'
      }
    }
    s[i] = current
    update('socials', s)
  }

  function addSocial() {
    update('socials', [...cfg.socials, { label: 'New Link', href: '#', color: 'white' }])
  }

  function removeSocial(i: number) {
    update('socials', cfg.socials.filter((_, idx) => idx !== i))
  }

  async function handleLogoUpload() {
    if (!logoFile) return
    setUploadingLogo(true)
    try {
      const url = await uploadImage(logoFile, 'assets', `logo-${Date.now()}.webp`)
      await supabase.from('settings').upsert([{ key: 'logo_url', value: url }], { onConflict: 'key' })
      setLogoUrl(url)
      setLogoFile(null)
      toast.success('Logo uploaded!')
    } catch (e: any) {
      toast.error('Logo upload failed: ' + e.message)
    } finally {
      setUploadingLogo(false)
    }
  }

  async function saveDraft() {
    setSaving(true)
    try {
      await supabase.from('site_config').upsert(
        [{ key: 'footer_config', status: 'draft', value: cfg, updated_at: new Date().toISOString() }],
        { onConflict: 'key,status' }
      )
      setHasDraft(true)
      toast.success('Draft saved!')
    } catch (e: any) {
      toast.error('Save failed: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  async function publish() {
    setPublishing(true)
    try {
      await supabase.from('site_config').upsert(
        [{ key: 'footer_config', status: 'published', value: cfg, updated_at: new Date().toISOString() }],
        { onConflict: 'key,status' }
      )
      // Remove draft if any and clean up legacy duplicate social/footer keys from settings
      await Promise.all([
        supabase.from('site_config').delete().eq('key', 'footer_config').eq('status', 'draft'),
        supabase.from('settings').delete().in('key', ['instagram', 'linkedin', 'youtube', 'twitter', 'contact_email', 'location', 'footer_tagline']),
      ])
      setHasDraft(false)
      toast.success('Footer published to live site!')
    } catch (e: any) {
      toast.error('Publish failed: ' + e.message)
    } finally {
      setPublishing(false)
    }
  }

  async function revert() {
    await supabase.from('site_config').delete()
      .eq('key', 'footer_config').eq('status', 'draft')
    setHasDraft(false)
    toast.success('Draft discarded — showing published version.')
    fetchAll()
  }

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-[60vh]">
      <div className="font-mono text-xs text-muted-foreground animate-pulse">Loading footer config…</div>
    </div>
  )

  // Live preview ghost text style — sized proportionally so it fits inside preview box
  const previewLen = Math.max((cfg.ghost_text || 'GENZONE').length, 4)
  const ghostStyle = {
    background: `linear-gradient(90deg, ${cfg.ghost_text_gradient_from}, ${cfg.ghost_text_gradient_to})`,
    WebkitBackgroundClip: 'text' as const,
    WebkitTextFillColor: 'transparent' as const,
    backgroundClip: 'text' as const,
    opacity: cfg.ghost_text_opacity / 100,
    fontSize: `${Math.min(4.2, Math.max(1.8, 28 / previewLen))}rem`,
    fontWeight: 900,
    fontFamily: 'var(--font-display, sans-serif)',
    lineHeight: 1,
    userSelect: 'none' as const,
    letterSpacing: '-0.02em',
    whiteSpace: 'nowrap' as const,
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
        <div>
          <h1 className="font-display text-2xl font-black uppercase tracking-widest text-white">
            Footer <span className="text-cyan">Editor</span>
          </h1>
          <p className="font-mono text-xs text-muted-foreground mt-1">
            Control every element of the footer section
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasDraft && (
            <>
              <span className="font-mono text-[10px] text-yellow uppercase tracking-widest px-2 py-1 border border-yellow/40 rounded-full">
                Draft
              </span>
              <button onClick={revert}
                className="font-mono text-xs text-muted-foreground hover:text-pink border border-border rounded-lg px-3 py-2 transition-colors">
                Revert
              </button>
            </>
          )}
          <button onClick={saveDraft} disabled={saving}
            className="flex items-center gap-2 font-mono text-xs bg-charcoal border border-border hover:border-cyan text-foreground rounded-lg px-4 py-2 transition-colors disabled:opacity-50">
            <Save size={13} /> {saving ? 'Saving…' : 'Save Draft'}
          </button>
          <button onClick={publish} disabled={publishing}
            className="flex items-center gap-2 font-mono text-xs bg-cyan text-background rounded-lg px-4 py-2 font-bold hover:bg-cyan/80 transition-colors disabled:opacity-50">
            {publishing ? 'Publishing…' : '⚡ Publish'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Controls */}
        <div className="space-y-5">

          {/* Ghost text */}
          <section className={sectionCls}>
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-white">
                Giant Ghost Text
              </h3>
              <button onClick={() => update('ghost_text_visible', !cfg.ghost_text_visible)}
                className={`flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest px-2 py-1 rounded-full border transition-colors ${
                  cfg.ghost_text_visible ? 'border-cyan text-cyan' : 'border-border text-muted-foreground'}`}>
                {cfg.ghost_text_visible ? <Eye size={11}/> : <EyeOff size={11}/>}
                {cfg.ghost_text_visible ? 'Visible' : 'Hidden'}
              </button>
            </div>
            <div>
              <label className={labelCls}>Text Content</label>
              <input value={cfg.ghost_text} onChange={e => update('ghost_text', e.target.value)}
                className={inputCls} placeholder="GENZONE" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ColorPicker label="Gradient From" value={cfg.ghost_text_gradient_from}
                onChange={v => update('ghost_text_gradient_from', v)} />
              <ColorPicker label="Gradient To" value={cfg.ghost_text_gradient_to}
                onChange={v => update('ghost_text_gradient_to', v)} />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className={labelCls}>Opacity</label>
                <span className="font-mono text-xs text-cyan">{cfg.ghost_text_opacity}%</span>
              </div>
              <input type="range" min={5} max={100} value={cfg.ghost_text_opacity}
                onChange={e => update('ghost_text_opacity', Number(e.target.value))}
                className="w-full accent-cyan cursor-pointer" />
            </div>
          </section>

          {/* Logo */}
          <section className={sectionCls}>
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-white">Logo</h3>
              <button onClick={() => update('logo_visible', !cfg.logo_visible)}
                className={`flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest px-2 py-1 rounded-full border transition-colors ${
                  cfg.logo_visible ? 'border-cyan text-cyan' : 'border-border text-muted-foreground'}`}>
                {cfg.logo_visible ? <Eye size={11}/> : <EyeOff size={11}/>}
                {cfg.logo_visible ? 'Visible' : 'Hidden'}
              </button>
            </div>
            {logoUrl && (
              <div className="flex items-center gap-3 p-3 bg-black/30 rounded-lg border border-border">
                <img src={logoUrl} alt="current logo" className="w-16 h-16 object-contain mix-blend-screen" />
                <span className="font-mono text-[10px] text-muted-foreground break-all">{logoUrl.split('/').pop()}</span>
              </div>
            )}
            <div className="space-y-2">
              <label className={labelCls}>Upload New Logo</label>
              <ImageDropzone onFile={setLogoFile} accept="image/*" />
              {logoFile && (
                <button onClick={handleLogoUpload} disabled={uploadingLogo}
                  className="flex items-center gap-2 font-mono text-xs bg-pink text-white rounded-lg px-3 py-2 hover:bg-pink/80 disabled:opacity-50">
                  <Upload size={13}/> {uploadingLogo ? 'Uploading…' : 'Upload Logo'}
                </button>
              )}
            </div>
          </section>

          {/* Contact column */}
          <section className={sectionCls}>
            <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-white border-b border-border pb-2">
              Contact Column
            </h3>
            <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
              <div>
                <label className={labelCls}>Heading Text</label>
                <input value={cfg.contact_heading} onChange={e => update('contact_heading', e.target.value)}
                  className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Color</label>
                <AccentSelect value={cfg.contact_heading_color}
                  onChange={v => update('contact_heading_color', v)} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Email Address</label>
              <input type="email" value={cfg.contact_email} onChange={e => update('contact_email', e.target.value)}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Location / Address</label>
              <input value={cfg.contact_location} onChange={e => update('contact_location', e.target.value)}
                className={inputCls} placeholder="Campus address" />
            </div>
          </section>

          {/* Follow / Social links */}
          <section className={sectionCls}>
            <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-white border-b border-border pb-2">
              Follow / Social Links
            </h3>
            <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
              <div>
                <label className={labelCls}>Heading Text</label>
                <input value={cfg.follow_heading} onChange={e => update('follow_heading', e.target.value)}
                  className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Color</label>
                <AccentSelect value={cfg.follow_heading_color}
                  onChange={v => update('follow_heading_color', v)} />
              </div>
            </div>
            <div className="space-y-3">
              {cfg.socials.map((s, i) => (
                <div key={i} className="space-y-2 bg-black/25 rounded-xl p-3 border border-border">
                  <div className="flex gap-2 items-center">
                    <GripVertical size={14} className="text-muted-foreground shrink-0 cursor-grab" />
                    <input
                      value={s.label}
                      onChange={e => updateSocial(i, 'label', e.target.value)}
                      className={`${baseFieldCls} min-w-0 flex-1`}
                      placeholder="Platform (e.g. Instagram)"
                    />
                    <AccentSelect value={s.color} onChange={v => updateSocial(i, 'color', v)} />
                    <button
                      type="button"
                      onClick={() => removeSocial(i)}
                      className="p-1.5 text-muted-foreground hover:text-pink transition-colors shrink-0"
                      title="Remove link"
                    >
                      <Trash2 size={14}/>
                    </button>
                  </div>
                  <input
                    type="url"
                    value={s.href === '#' ? '' : s.href}
                    onChange={e => updateSocial(i, 'href', e.target.value.trim() || '#')}
                    className={`${inputCls} w-full`}
                    placeholder="https://www.instagram.com/genzone_vitb"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={addSocial}
                className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-cyan border border-cyan/40 hover:border-cyan rounded-lg px-3 py-1.5 transition-colors"
              >
                <Plus size={11}/> Add Link
              </button>
            </div>
          </section>

          {/* Copyright bar */}
          <section className={sectionCls}>
            <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-white border-b border-border pb-2">
              Copyright Bar
            </h3>
            <div>
              <label className={labelCls}>Left Text <span className="normal-case">(use {'{year}'} for current year)</span></label>
              <input value={cfg.copyright_left} onChange={e => update('copyright_left', e.target.value)}
                className={inputCls} placeholder="© {year} GENZONE" />
            </div>
            <div>
              <label className={labelCls}>Right Text</label>
              <input value={cfg.copyright_right} onChange={e => update('copyright_right', e.target.value)}
                className={inputCls} placeholder="Turning Trends Into Tradition" />
            </div>
          </section>

          {/* Background + spacing */}
          <section className={sectionCls}>
            <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-white border-b border-border pb-2">
              Background & Spacing
            </h3>
            <ColorPicker label="Background Color" value={cfg.bg_color}
              onChange={v => update('bg_color', v)} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className={labelCls}>Padding Top</label>
                  <span className="font-mono text-xs text-cyan">{cfg.padding_top}px</span>
                </div>
                <input type="range" min={0} max={200} value={cfg.padding_top}
                  onChange={e => update('padding_top', Number(e.target.value))}
                  className="w-full accent-cyan cursor-pointer" />
              </div>
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className={labelCls}>Padding Bottom</label>
                  <span className="font-mono text-xs text-cyan">{cfg.padding_bottom}px</span>
                </div>
                <input type="range" min={0} max={100} value={cfg.padding_bottom}
                  onChange={e => update('padding_bottom', Number(e.target.value))}
                  className="w-full accent-cyan cursor-pointer" />
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT: Live preview */}
        <div className="lg:sticky lg:top-6 h-fit">
          <div className="bg-charcoal/70 border border-border rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="font-mono text-xs uppercase tracking-widest text-cyan font-bold">
                Live Preview
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">Footer section</span>
            </div>

            {/* Footer mockup */}
            <div
              className="rounded-xl overflow-hidden text-white"
              style={{ backgroundColor: cfg.bg_color, paddingTop: cfg.padding_top * 0.4, paddingBottom: cfg.padding_bottom * 0.4, paddingLeft: 20, paddingRight: 20 }}
            >
              {/* Top grid */}
              <div className="flex gap-6 flex-wrap mb-4">
                {cfg.logo_visible && (
                  <div className="relative shrink-0 p-1">
                    <div className="pointer-events-none absolute -inset-1 rounded-full bg-gradient-to-tr from-cyan/35 via-pink/35 to-yellow/25 blur-md" />
                    {logoUrl
                      ? <img src={logoUrl} alt="logo" className="relative w-16 h-16 object-contain mix-blend-screen drop-shadow-[0_0_12px_rgba(0,217,255,0.45)]" style={{ maskImage: 'radial-gradient(circle, black 58%, transparent 82%)', WebkitMaskImage: 'radial-gradient(circle, black 58%, transparent 82%)' }} />
                      : <div className="relative w-16 h-16 rounded-full border-2 border-cyan/30 flex items-center justify-center font-mono text-[8px] text-cyan">LOGO</div>
                    }
                  </div>
                )}
                <div className="flex-1 min-w-[120px]">
                  <p className={`font-mono text-[9px] uppercase tracking-widest mb-1 ${colorClass[cfg.contact_heading_color]}`}>
                    {cfg.contact_heading}
                  </p>
                  <p className="text-xs">{cfg.contact_email}</p>
                  <p className="text-[10px] opacity-60">{cfg.contact_location}</p>
                </div>
                <div className="flex-1 min-w-[120px]">
                  <p className={`font-mono text-[9px] uppercase tracking-widest mb-1 ${colorClass[cfg.follow_heading_color]}`}>
                    {cfg.follow_heading}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {cfg.socials.map((s, i) => (
                      <span key={i} className={`inline-flex items-center gap-1.5 text-[9px] border border-white/20 bg-white/[0.04] rounded-full px-2 py-0.5 shadow-[0_2px_0_rgba(0,0,0,0.7),0_0_12px_rgba(255,22,138,0.2)] ${colorClass[s.color]}`}>
                        <PreviewSocialBadgeIcon label={s.label} href={s.href} />
                        <span>{s.label}</span>
                        <span>↗</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Ghost text */}
              {cfg.ghost_text_visible && (
                <div className="text-center overflow-hidden" aria-hidden>
                  <span style={ghostStyle}>{cfg.ghost_text || 'GENZONE'}</span>
                </div>
              )}

              {/* Copyright */}
              <div className="flex justify-between items-center border-t border-white/10 pt-2 mt-2">
                <span className="font-mono text-[9px] uppercase opacity-50">
                  {cfg.copyright_left.replace('{year}', String(new Date().getFullYear()))}
                </span>
                <span className="font-mono text-[9px] uppercase opacity-50">{cfg.copyright_right}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
