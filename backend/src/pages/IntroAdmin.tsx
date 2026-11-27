import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Save, UploadCloud, Sparkles, AlertCircle } from 'lucide-react'

interface IntroConfig {
  show_mode: 'every_visit' | 'session' | 'day' | 'never'
  total_duration_ms: number
  logo_stage_on: boolean
  wordmark_stage_on: boolean
  tagline: string
  particles_on: boolean
  particles_count: number
  particles_colors: string[]
  particles_speed: number
  skip_toggle: boolean
  skip_label: string
  logo_size: number
  logo_glow_color: 'cyan' | 'pink' | 'yellow' | 'none'
  logo_glow_intensity: number
  reduced_motion: 'instant' | 'fade'
}

const DEFAULT_INTRO_CONFIG: IntroConfig = {
  show_mode: 'every_visit',
  total_duration_ms: 3600,
  logo_stage_on: true,
  wordmark_stage_on: false,
  tagline: 'NOT ANOTHER CLUB. THIS IS GENZONE.',
  particles_on: true,
  particles_count: 36,
  particles_colors: ['cyan', 'pink', 'yellow'],
  particles_speed: 1,
  skip_toggle: true,
  skip_label: 'Tap to skip',
  logo_size: 340,
  logo_glow_color: 'cyan',
  logo_glow_intensity: 1,
  reduced_motion: 'instant',
}

export default function IntroAdmin() {
  const [config, setConfig] = useState<IntroConfig>(DEFAULT_INTRO_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [hasDraft, setHasDraft] = useState(false)
  const [previewLogo, setPreviewLogo] = useState<string | null>(null)

  useEffect(() => {
    fetchConfig()
    fetchPreviewLogo()
  }, [])

  async function fetchPreviewLogo() {
    try {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'logo_url')
        .maybeSingle()
      if (data?.value) setPreviewLogo(data.value as string)
    } catch {
      // silent — preview falls back to text
    }
  }

  async function fetchConfig() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('site_config')
        .select('*')
        .eq('key', 'intro_config')

      if (error) throw error

      if (data && data.length > 0) {
        const draftRow = data.find((r) => r.status === 'draft')
        const pubRow = data.find((r) => r.status === 'published')
        if (draftRow?.value) {
          setConfig({ ...DEFAULT_INTRO_CONFIG, ...draftRow.value })
          setHasDraft(true)
        } else if (pubRow?.value) {
          setConfig({ ...DEFAULT_INTRO_CONFIG, ...pubRow.value })
          setHasDraft(false)
        }
      }
    } catch (err: any) {
      console.warn('Silent fallback on fetchConfig:', err.message)
    } finally {
      setLoading(false)
    }
  }

  function updateField<K extends keyof IntroConfig>(field: K, value: IntroConfig[K]) {
    setConfig((prev) => ({ ...prev, [field]: value }))
  }

  function toggleColor(color: string) {
    const current = config.particles_colors
    if (current.includes(color)) {
      if (current.length === 1) {
        toast.info('Select at least one particle color.')
        return
      }
      updateField(
        'particles_colors',
        current.filter((c) => c !== color)
      )
    } else {
      updateField('particles_colors', [...current, color])
    }
  }

  async function handleSaveDraft() {
    setSaving(true)
    try {
      const { error } = await supabase.from('site_config').upsert(
        {
          key: 'intro_config',
          status: 'draft',
          value: config,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key,status' }
      )
      if (error) throw error
      setHasDraft(true)
      toast.success('Saved intro config as draft!')
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
          key: 'intro_config',
          status: 'published',
          value: config,
          updated_at: now,
        },
        { onConflict: 'key,status' }
      )
      if (error) throw error

      // Clean up draft
      await supabase.from('site_config').delete().eq('key', 'intro_config').eq('status', 'draft')

      setHasDraft(false)
      toast.success('Intro settings published live!')
    } catch (err: any) {
      toast.error('Failed to publish: ' + err.message)
    } finally {
      setPublishing(false)
    }
  }

  // Preview glow styling
  const glowHex =
    config.logo_glow_color === 'cyan'
      ? '#00f0ff'
      : config.logo_glow_color === 'pink'
      ? '#ff007f'
      : config.logo_glow_color === 'yellow'
      ? '#ffe600'
      : 'transparent'

  const glowBoxShadow =
    config.logo_glow_color !== 'none'
      ? `0 0 ${20 * config.logo_glow_intensity}px ${glowHex}88, 0 0 ${40 * config.logo_glow_intensity}px ${glowHex}44`
      : 'none'

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="font-mono text-xs text-cyan tracking-[0.3em] uppercase">
              01 — Splash Screen
            </p>
            {hasDraft && (
              <span className="font-mono text-[10px] uppercase tracking-wider text-yellow font-bold bg-yellow/10 border border-yellow/30 px-2 py-0.5 rounded">
                Draft Pending
              </span>
            )}
          </div>
          <h1 className="font-display text-3xl font-black uppercase">Intro Splash Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configure the opening intro splash animation, timing, logo appearance, and particle dynamics.
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
        {/* Left: Controls Form */}
        <div className="lg:col-span-7 space-y-6">
          {/* Display Mode */}
          <section className="bg-charcoal/50 border border-border rounded-xl p-5 space-y-3">
            <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-white border-b border-border pb-2">
              Frequency & Display Mode
            </h3>
            <div className="grid grid-cols-2 gap-3 pt-1">
              {[
                { id: 'every_visit', label: 'Every Visit' },
                { id: 'session', label: 'Once per Session' },
                { id: 'day', label: 'Once per Day' },
                { id: 'never', label: 'Never (Disabled)' },
              ].map((m) => (
                <label
                  key={m.id}
                  className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer font-mono text-xs transition-all ${
                    config.show_mode === m.id
                      ? 'border-cyan bg-cyan/10 text-cyan'
                      : 'border-border text-muted-foreground hover:text-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="show_mode"
                    value={m.id}
                    checked={config.show_mode === m.id}
                    onChange={() => updateField('show_mode', m.id as any)}
                    className="accent-cyan"
                  />
                  {m.label}
                </label>
              ))}
            </div>

            <div className="pt-2">
              <label className="block font-mono text-xs text-muted-foreground uppercase tracking-widest mb-1.5">
                Total Duration (ms)
              </label>
              <input
                type="number"
                min="1000"
                max="10000"
                step="200"
                value={config.total_duration_ms}
                onChange={(e) => updateField('total_duration_ms', Number(e.target.value))}
                className="w-full bg-black/50 border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-cyan"
              />
            </div>
          </section>

          {/* Logo & Wordmark Stage */}
          <section className="bg-charcoal/50 border border-border rounded-xl p-5 space-y-4">
            <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-white border-b border-border pb-2">
              Logo & Branding Stages
            </h3>

            <div className="flex flex-wrap gap-6 pt-1">
              <label className="flex items-center gap-2 cursor-pointer font-mono text-xs text-foreground">
                <input
                  type="checkbox"
                  checked={config.logo_stage_on}
                  onChange={(e) => updateField('logo_stage_on', e.target.checked)}
                  className="rounded border-border accent-cyan"
                />
                Logo Stage ON
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-mono text-xs text-foreground">
                <input
                  type="checkbox"
                  checked={config.wordmark_stage_on}
                  onChange={(e) => updateField('wordmark_stage_on', e.target.checked)}
                  className="rounded border-border accent-cyan"
                />
                Wordmark Stage ON
              </label>
            </div>

            {config.wordmark_stage_on && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-yellow/10 border border-yellow/30 text-yellow font-mono text-[11px]">
                <AlertCircle size={14} className="shrink-0" />
                <span>Wordmark will only show if no custom logo is uploaded in Settings.</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-mono text-[11px] text-muted-foreground uppercase">
                    Logo Size (px)
                  </label>
                  <span className="font-mono text-xs text-cyan">{config.logo_size}px</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="500"
                  value={config.logo_size}
                  onChange={(e) => updateField('logo_size', Number(e.target.value))}
                  className="w-full accent-cyan cursor-pointer"
                />
              </div>

              <div>
                <label className="block font-mono text-[11px] text-muted-foreground uppercase mb-1.5">
                  Glow Color
                </label>
                <select
                  value={config.logo_glow_color}
                  onChange={(e) => updateField('logo_glow_color', e.target.value as any)}
                  className="w-full bg-black/50 border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-cyan"
                >
                  <option value="cyan">Cyan</option>
                  <option value="pink">Pink</option>
                  <option value="yellow">Yellow</option>
                  <option value="none">None</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="font-mono text-[11px] text-muted-foreground uppercase">
                  Glow Intensity
                </label>
                <span className="font-mono text-xs text-cyan">{config.logo_glow_intensity}</span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={config.logo_glow_intensity}
                onChange={(e) => updateField('logo_glow_intensity', Number(e.target.value))}
                className="w-full accent-cyan cursor-pointer"
              />
            </div>

            <div>
              <label className="block font-mono text-xs text-muted-foreground uppercase tracking-widest mb-1.5">
                Tagline Text
              </label>
              <input
                type="text"
                value={config.tagline}
                onChange={(e) => updateField('tagline', e.target.value)}
                placeholder="NOT ANOTHER CLUB. THIS IS GENZONE."
                className="w-full bg-black/50 border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-cyan"
              />
            </div>
          </section>

          {/* Particles */}
          <section className="bg-charcoal/50 border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-white">
                Particle Background
              </h3>
              <label className="flex items-center gap-2 cursor-pointer font-mono text-xs text-foreground">
                <input
                  type="checkbox"
                  checked={config.particles_on}
                  onChange={(e) => updateField('particles_on', e.target.checked)}
                  className="rounded border-border accent-cyan"
                />
                Particles ON
              </label>
            </div>

            {config.particles_on && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="font-mono text-[11px] text-muted-foreground uppercase">
                        Particle Count
                      </label>
                      <span className="font-mono text-xs text-cyan">{config.particles_count}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="80"
                      value={config.particles_count}
                      onChange={(e) => updateField('particles_count', Number(e.target.value))}
                      className="w-full accent-cyan cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="font-mono text-[11px] text-muted-foreground uppercase">
                        Speed Multiplier
                      </label>
                      <span className="font-mono text-xs text-cyan">{config.particles_speed}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="3"
                      step="0.25"
                      value={config.particles_speed}
                      onChange={(e) => updateField('particles_speed', Number(e.target.value))}
                      className="w-full accent-cyan cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-[11px] text-muted-foreground uppercase mb-2">
                    Particle Colors
                  </label>
                  <div className="flex gap-4">
                    {['cyan', 'pink', 'yellow'].map((c) => (
                      <label
                        key={c}
                        className="flex items-center gap-1.5 font-mono text-xs text-foreground cursor-pointer uppercase"
                      >
                        <input
                          type="checkbox"
                          checked={config.particles_colors.includes(c)}
                          onChange={() => toggleColor(c)}
                          className="rounded border-border accent-cyan"
                        />
                        <span
                          className={`inline-block w-2.5 h-2.5 rounded-full ${
                            c === 'cyan' ? 'bg-[#00f0ff]' : c === 'pink' ? 'bg-[#ff007f]' : 'bg-[#ffe600]'
                          }`}
                        />
                        {c}
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}
          </section>

          {/* Skip Button & Reduced Motion */}
          <section className="bg-charcoal/50 border border-border rounded-xl p-5 space-y-4">
            <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-white border-b border-border pb-2">
              Accessibility & Skip Button
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 cursor-pointer font-mono text-xs text-foreground mb-2">
                  <input
                    type="checkbox"
                    checked={config.skip_toggle}
                    onChange={(e) => updateField('skip_toggle', e.target.checked)}
                    className="rounded border-border accent-cyan"
                  />
                  Enable Skip Button
                </label>
                <input
                  type="text"
                  value={config.skip_label}
                  onChange={(e) => updateField('skip_label', e.target.value)}
                  placeholder="Tap to skip"
                  disabled={!config.skip_toggle}
                  className="w-full bg-black/50 border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-cyan disabled:opacity-40"
                />
              </div>

              <div>
                <label className="block font-mono text-[11px] text-muted-foreground uppercase mb-2">
                  Reduced Motion Behavior
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'instant', label: 'Instant Dismiss (0s)' },
                    { id: 'fade', label: 'Short Fade Out (300ms)' },
                  ].map((rm) => (
                    <label
                      key={rm.id}
                      className="flex items-center gap-2 font-mono text-xs text-foreground cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="reduced_motion"
                        value={rm.id}
                        checked={config.reduced_motion === rm.id}
                        onChange={() => updateField('reduced_motion', rm.id as any)}
                        className="accent-cyan"
                      />
                      {rm.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right: Live Preview Panel */}
        <div className="lg:col-span-5 sticky top-6">
          <div className="bg-charcoal/70 border border-border rounded-2xl p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="font-mono text-xs uppercase tracking-widest text-cyan font-bold flex items-center gap-1.5">
                <Sparkles size={14} /> Live Splash Preview
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">CSS Mockup</span>
            </div>

            {/* Mock Screen */}
            <div className="relative aspect-[4/3] rounded-xl bg-black border border-border/80 overflow-hidden flex flex-col items-center justify-center p-6 text-center shadow-inner">
              {/* Fake Particles */}
              {config.particles_on && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {Array.from({ length: Math.min(config.particles_count, 24) }).map((_, i) => {
                    const color = config.particles_colors[i % config.particles_colors.length]
                    const colorClass =
                      color === 'cyan' ? '#00f0ff' : color === 'pink' ? '#ff007f' : '#ffe600'
                    return (
                      <span
                        key={i}
                        className="absolute rounded-full animate-pulse"
                        style={{
                          left: `${(i * 19) % 94}%`,
                          top: `${(i * 29) % 88}%`,
                          width: `${(i % 3) + 2}px`,
                          height: `${(i % 3) + 2}px`,
                          backgroundColor: colorClass,
                          opacity: 0.6,
                          animationDuration: `${2 / (config.particles_speed || 1)}s`,
                        }}
                      />
                    )
                  })}
                </div>
              )}

              {/* Logo / Wordmark Mockup */}
              {config.logo_stage_on && (
                <div
                  style={{
                    width: `${Math.round(config.logo_size * 0.35)}px`,
                    boxShadow: glowBoxShadow,
                  }}
                  className="transition-all duration-300 rounded-xl z-10 flex items-center justify-center"
                >
                  {previewLogo ? (
                    <img
                      src={previewLogo}
                      alt="Logo preview"
                      style={{
                        width: '100%',
                        maxWidth: `${Math.round(config.logo_size * 0.35)}px`,
                        filter:
                          config.logo_glow_color !== 'none'
                            ? `drop-shadow(0 0 ${8 * config.logo_glow_intensity}px ${
                                config.logo_glow_color === 'cyan'
                                  ? '#00f0ff'
                                  : config.logo_glow_color === 'pink'
                                  ? '#ff007f'
                                  : '#ffe600'
                              })`
                            : 'none',
                      }}
                    />
                  ) : (
                    <div className="py-3 px-4 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm">
                      <div className="font-display font-black text-xl tracking-widest text-white">
                        GEN<span className="text-cyan">ZONE</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {config.wordmark_stage_on && !previewLogo && (
                <div className="py-3 px-4 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm z-10">
                  <div className="font-display font-black text-xl tracking-widest text-white">
                    GEN<span className="text-cyan">ZONE</span>
                  </div>
                </div>
              )}

              {/* Tagline */}
              <p className="mt-4 font-mono text-[10px] tracking-widest uppercase text-muted-foreground z-10 max-w-[85%]">
                {config.tagline}
              </p>

              {/* Skip Button */}
              {config.skip_toggle && (
                <div className="absolute top-3 right-3 font-mono text-[9px] uppercase tracking-wider text-white/50 border border-white/20 rounded-full px-2 py-0.5">
                  {config.skip_label}
                </div>
              )}
            </div>

            <p className="font-mono text-[11px] text-muted-foreground text-center">
              Mode: <span className="text-foreground uppercase">{config.show_mode}</span> •
              Duration: <span className="text-foreground">{config.total_duration_ms}ms</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
