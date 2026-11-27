import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Save, UploadCloud, Users, Sparkles } from 'lucide-react'

interface PanelPopupDesignConfig {
  animation: 'pop' | 'slide-up' | 'fade'
  speed: number
  layout: 'photo-left' | 'photo-right' | 'photo-top' | 'photo-bleed'
  backdrop_blur: number
  backdrop_opacity: number
  corner_radius: number
  width: number
  card_hover: 'tilt' | 'scale' | 'none'
  caption_position: 'below' | 'overlay'
  aspect_ratio: '3/4' | '1/1' | '4/3'
}

const DEFAULT_CONFIG: PanelPopupDesignConfig = {
  animation: 'pop',
  speed: 400,
  layout: 'photo-left',
  backdrop_blur: 12,
  backdrop_opacity: 0.8,
  corner_radius: 16,
  width: 760,
  card_hover: 'tilt',
  caption_position: 'below',
  aspect_ratio: '3/4',
}

export default function PanelPopupDesign() {
  const [config, setConfig] = useState<PanelPopupDesignConfig>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [hasDraft, setHasDraft] = useState(false)

  useEffect(() => {
    fetchConfig()
  }, [])

  async function fetchConfig() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('site_config')
        .select('*')
        .eq('key', 'panel_popup_design')

      if (error) throw error

      if (data && data.length > 0) {
        const draftRow = data.find((r) => r.status === 'draft')
        const pubRow = data.find((r) => r.status === 'published')
        if (draftRow?.value) {
          setConfig({ ...DEFAULT_CONFIG, ...draftRow.value })
          setHasDraft(true)
        } else if (pubRow?.value) {
          setConfig({ ...DEFAULT_CONFIG, ...pubRow.value })
          setHasDraft(false)
        }
      }
    } catch (err: any) {
      console.warn('Silent fallback on fetchConfig:', err.message)
    } finally {
      setLoading(false)
    }
  }

  function updateField<K extends keyof PanelPopupDesignConfig>(field: K, val: PanelPopupDesignConfig[K]) {
    setConfig((prev) => ({ ...prev, [field]: val }))
  }

  async function handleSaveDraft() {
    setSaving(true)
    try {
      const { error } = await supabase.from('site_config').upsert(
        {
          key: 'panel_popup_design',
          status: 'draft',
          value: config,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key,status' }
      )
      if (error) throw error
      setHasDraft(true)
      toast.success('Saved panel popup design as draft!')
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
      const { error } = await supabase.from('site_config').upsert(
        {
          key: 'panel_popup_design',
          status: 'published',
          value: config,
          updated_at: now,
        },
        { onConflict: 'key,status' }
      )
      if (error) throw error

      await supabase
        .from('site_config')
        .delete()
        .eq('key', 'panel_popup_design')
        .eq('status', 'draft')

      setHasDraft(false)
      toast.success('Panel popup design published live!')
    } catch (err: any) {
      toast.error('Failed to publish: ' + err.message)
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="font-mono text-xs text-cyan tracking-[0.3em] uppercase">
              03 — Panel Visuals
            </p>
            {hasDraft && (
              <span className="font-mono text-[10px] uppercase tracking-wider text-yellow font-bold bg-yellow/10 border border-yellow/30 px-2 py-0.5 rounded">
                Draft Pending
              </span>
            )}
          </div>
          <h1 className="font-display text-3xl font-black uppercase">Panel Popup & Card Design</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Customize the member modal popup appearance, animation curves, backdrop filters, and card grid styles.
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
        <div className="lg:col-span-7 space-y-6">
          {/* Modal Layout & Dimensions */}
          <section className="bg-charcoal/50 border border-border rounded-xl p-5 space-y-4">
            <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-white border-b border-border pb-2">
              Popup Layout & Width
            </h3>

            <div>
              <label className="block font-mono text-xs text-muted-foreground uppercase tracking-widest mb-2">
                Layout Direction
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'photo-left', label: 'Photo Left' },
                  { id: 'photo-right', label: 'Photo Right' },
                  { id: 'photo-top', label: 'Photo Top' },
                  { id: 'photo-bleed', label: 'Full-bleed Photo' },
                ].map((l) => (
                  <label
                    key={l.id}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer font-mono text-xs transition-all ${
                      config.layout === l.id
                        ? 'border-cyan bg-cyan/10 text-cyan'
                        : 'border-border text-muted-foreground hover:text-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="layout"
                      value={l.id}
                      checked={config.layout === l.id}
                      onChange={() => updateField('layout', l.id as any)}
                      className="accent-cyan"
                    />
                    {l.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-mono text-[11px] text-muted-foreground uppercase">
                    Modal Max Width
                  </label>
                  <span className="font-mono text-xs text-cyan">{config.width}px</span>
                </div>
                <input
                  type="range"
                  min="400"
                  max="900"
                  step="20"
                  value={config.width}
                  onChange={(e) => updateField('width', Number(e.target.value))}
                  className="w-full accent-cyan cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-mono text-[11px] text-muted-foreground uppercase">
                    Corner Radius
                  </label>
                  <span className="font-mono text-xs text-cyan">{config.corner_radius}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="24"
                  value={config.corner_radius}
                  onChange={(e) => updateField('corner_radius', Number(e.target.value))}
                  className="w-full accent-cyan cursor-pointer"
                />
              </div>
            </div>
          </section>

          {/* Animation & Backdrop */}
          <section className="bg-charcoal/50 border border-border rounded-xl p-5 space-y-4">
            <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-white border-b border-border pb-2">
              Animation & Backdrop Filter
            </h3>

            <div>
              <label className="block font-mono text-xs text-muted-foreground uppercase tracking-widest mb-2">
                Open Animation Style
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'pop', label: 'Pop (Spring)' },
                  { id: 'slide-up', label: 'Slide Up' },
                  { id: 'fade', label: 'Fade' },
                ].map((a) => (
                  <label
                    key={a.id}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer font-mono text-xs transition-all ${
                      config.animation === a.id
                        ? 'border-cyan bg-cyan/10 text-cyan'
                        : 'border-border text-muted-foreground hover:text-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="animation"
                      value={a.id}
                      checked={config.animation === a.id}
                      onChange={() => updateField('animation', a.id as any)}
                      className="accent-cyan"
                    />
                    {a.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-mono text-[11px] text-muted-foreground uppercase">
                    Speed
                  </label>
                  <span className="font-mono text-xs text-cyan">{config.speed}ms</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="800"
                  step="50"
                  value={config.speed}
                  onChange={(e) => updateField('speed', Number(e.target.value))}
                  className="w-full accent-cyan cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-mono text-[11px] text-muted-foreground uppercase">
                    Backdrop Blur
                  </label>
                  <span className="font-mono text-xs text-cyan">{config.backdrop_blur}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={config.backdrop_blur}
                  onChange={(e) => updateField('backdrop_blur', Number(e.target.value))}
                  className="w-full accent-cyan cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-mono text-[11px] text-muted-foreground uppercase">
                    Backdrop Opacity
                  </label>
                  <span className="font-mono text-xs text-cyan">
                    {Math.round(config.backdrop_opacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={config.backdrop_opacity}
                  onChange={(e) => updateField('backdrop_opacity', Number(e.target.value))}
                  className="w-full accent-cyan cursor-pointer"
                />
              </div>
            </div>
          </section>

          {/* Card Grid Options */}
          <section className="bg-charcoal/50 border border-border rounded-xl p-5 space-y-4">
            <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-white border-b border-border pb-2">
              Section Card Grid Styling
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-mono text-[11px] text-muted-foreground uppercase mb-1.5">
                  Hover Effect
                </label>
                <div className="space-y-1.5">
                  {[
                    { id: 'tilt', label: 'Tilt (-2deg)' },
                    { id: 'scale', label: 'Scale Up' },
                    { id: 'none', label: 'None' },
                  ].map((h) => (
                    <label
                      key={h.id}
                      className="flex items-center gap-2 font-mono text-xs text-foreground cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="card_hover"
                        value={h.id}
                        checked={config.card_hover === h.id}
                        onChange={() => updateField('card_hover', h.id as any)}
                        className="accent-cyan"
                      />
                      {h.label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-mono text-[11px] text-muted-foreground uppercase mb-1.5">
                  Caption Position
                </label>
                <div className="space-y-1.5">
                  {[
                    { id: 'below', label: 'Below Photo' },
                    { id: 'overlay', label: 'Overlay on Photo' },
                  ].map((c) => (
                    <label
                      key={c.id}
                      className="flex items-center gap-2 font-mono text-xs text-foreground cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="caption_position"
                        value={c.id}
                        checked={config.caption_position === c.id}
                        onChange={() => updateField('caption_position', c.id as any)}
                        className="accent-cyan"
                      />
                      {c.label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-mono text-[11px] text-muted-foreground uppercase mb-1.5">
                  Aspect Ratio
                </label>
                <div className="space-y-1.5">
                  {['3/4', '1/1', '4/3'].map((ar) => (
                    <label
                      key={ar}
                      className="flex items-center gap-2 font-mono text-xs text-foreground cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="aspect_ratio"
                        value={ar}
                        checked={config.aspect_ratio === ar}
                        onChange={() => updateField('aspect_ratio', ar as any)}
                        className="accent-cyan"
                      />
                      {ar}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Live Preview Column */}
        <div className="lg:col-span-5 sticky top-6">
          <div className="bg-charcoal/70 border border-border rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="font-mono text-xs uppercase tracking-widest text-cyan font-bold flex items-center gap-1.5">
                <Sparkles size={14} /> Live Popup Preview
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">{config.layout}</span>
            </div>

            {/* Mock Backdrop Container */}
            <div
              style={{
                backgroundColor: `rgba(0, 0, 0, ${config.backdrop_opacity})`,
                backdropFilter: `blur(${config.backdrop_blur}px)`,
              }}
              className="p-4 rounded-xl border border-border/80 flex items-center justify-center min-h-[360px]"
            >
              {/* Mock Popup Modal */}
              <div
                style={{
                  borderRadius: `${config.corner_radius}px`,
                  maxWidth: '100%',
                }}
                className={`bg-background border border-cyan/40 p-4 shadow-2xl overflow-hidden ${
                  config.layout === 'photo-left'
                    ? 'flex flex-row gap-4 items-center'
                    : config.layout === 'photo-right'
                    ? 'flex flex-row-reverse gap-4 items-center'
                    : config.layout === 'photo-bleed'
                    ? 'relative'
                    : 'flex flex-col gap-3'
                }`}
              >
                {/* Mock Member Portrait */}
                <div
                  className={`bg-zinc-800 rounded-lg overflow-hidden shrink-0 flex items-center justify-center ${
                    config.layout === 'photo-bleed'
                      ? 'w-full h-44 opacity-25'
                      : config.layout === 'photo-top'
                      ? 'w-full h-32'
                      : 'w-28 h-36'
                  }`}
                >
                  <Users size={32} className="text-cyan/60" />
                </div>

                {/* Mock Member Content */}
                <div className="space-y-2 flex-1">
                  <div className="font-mono text-[10px] uppercase text-cyan tracking-widest">
                    Club Lead & Design
                  </div>
                  <div className="font-display font-black text-lg uppercase text-white leading-tight">
                    Alex Mercer
                  </div>
                  <p className="font-mono text-[10px] text-muted-foreground line-clamp-2">
                    "Creating things that scream louder than words."
                  </p>
                  <div className="flex gap-1.5 pt-1">
                    <span className="px-2 py-0.5 rounded bg-cyan/10 text-cyan text-[9px] font-mono">
                      Figma
                    </span>
                    <span className="px-2 py-0.5 rounded bg-pink/10 text-pink text-[9px] font-mono">
                      React
                    </span>
                    <span className="px-2 py-0.5 rounded bg-yellow/10 text-yellow text-[9px] font-mono">
                      Blender
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="font-mono text-[11px] text-muted-foreground space-y-1">
              <div>• Animation: <span className="text-foreground uppercase">{config.animation} ({config.speed}ms)</span></div>
              <div>• Card hover: <span className="text-foreground uppercase">{config.card_hover}</span> • Aspect: <span className="text-foreground">{config.aspect_ratio}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
