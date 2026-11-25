// ─── PanelCard3DAdmin.tsx ─────────────────────────────────────────────────────
// Admin page: Panel → 3D ID Cards
// Tabs: Layout · Card · Front · Back · Strap · Physics · Lighting · Behavior
// Live 3D preview using the first real panel member (or a sample).
// Save Draft / Publish via site_config key "panel.card3d".
// Keep in sync with root src/components/panel3d/cardDefaults.ts
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import {
  LayoutGrid, CreditCard, ImageIcon, AlignLeft,
  Dumbbell, Zap, Lightbulb, Settings2,
  Save, Upload, RotateCcw, Loader2,
} from 'lucide-react'

// ── Types (kept in sync with root cardDefaults.ts) ────────────────────────────
type CardFinish     = 'glossy' | 'matte' | 'holographic' | 'metallic'
type CardOrientation = 'portrait' | 'landscape'
type CardMode       = 'auto' | '3d' | '2d_only'
type LightingPreset = 'studio' | 'neon'
type StrapPattern   = 'solid' | 'stripes' | 'text'
type CardPreset     = 'neon' | 'minimal' | 'holo' | 'classic'
type SocialPlatform = 'instagram' | 'linkedin' | 'github' | 'x' | 'portfolio' | 'email'
type SocialButtonSize = 'small' | 'medium' | 'large'
type InstagramProminence = 'large' | 'normal'
type SocialButtonStyle = 'icon_handle' | 'icon_only'
type SocialButtonPosition = 'bottom' | 'under_name'
type SocialButtonColors = 'brand' | 'accent' | 'mono'

const SOCIAL_PLATFORM_OPTIONS: { id: SocialPlatform; label: string }[] = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'linkedin',  label: 'LinkedIn' },
  { id: 'github',    label: 'GitHub' },
  { id: 'x',         label: 'X' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'email',     label: 'Email' },
]

interface CardConfig {
  mode: CardMode; layout: 'carousel' | 'grid'; preset: CardPreset
  lowPowerThreshold: number; showHint: boolean; hintText: string; popupEnabled: boolean
  orientation: CardOrientation; cornerRadius: number; size: number
  finish: CardFinish; baseColor: string; edgeColor: string
  photoFrame: 'rectangle' | 'rounded' | 'circle'
  showBarcode: boolean; showHologram: boolean; showMemberId: boolean
  accentStripe: boolean; logoUrl: string
  showFrontSocials: boolean; frontSocialPlatforms: SocialPlatform[]
  socialButtonSize: SocialButtonSize; instagramProminence: InstagramProminence
  socialButtonStyle: SocialButtonStyle; socialButtonPosition: SocialButtonPosition
  socialButtonColors: SocialButtonColors; socialButtonGlow: boolean
  showQr: boolean; qrUrl: string; tagline: string; clubName: string
  strapColor: string; strapColor2: string; strapWidth: number
  strapLength: number; strapPattern: StrapPattern; metal: 'silver' | 'gold' | 'graphite'
  gravity: number; damping: number; elasticity: number; breeze: number; idleSway: boolean
  lighting: LightingPreset; bloom: boolean; shadow: boolean
  cardsPerViewDesktop: number; cardsPerViewTablet: number; cardsPerViewMobile: number
  cardSpacing: number
}

const DEFAULT: CardConfig = {
  mode: 'auto', layout: 'carousel', preset: 'neon',
  lowPowerThreshold: 4, showHint: true, hintText: 'Drag · Tap to flip', popupEnabled: false,
  orientation: 'portrait', cornerRadius: 0.3, size: 0.62,
  finish: 'glossy', baseColor: '#0a0a14', edgeColor: '#1a1a2e',
  photoFrame: 'rounded', showBarcode: true, showHologram: true,
  showMemberId: true, accentStripe: true, logoUrl: '/genzone-fallback.svg',
  showFrontSocials: true, frontSocialPlatforms: ['instagram', 'linkedin'],
  socialButtonSize: 'medium', instagramProminence: 'large',
  socialButtonStyle: 'icon_handle', socialButtonPosition: 'bottom',
  socialButtonColors: 'brand', socialButtonGlow: true,
  showQr: true, qrUrl: 'https://genzone-webpage.vercel.app',
  tagline: 'NOT ANOTHER CLUB. THIS IS GENZONE.', clubName: 'GENZONE',
  strapColor: '#00f0ff', strapColor2: '#ff007f',
  strapWidth: 0.75, strapLength: 0.52, strapPattern: 'text', metal: 'silver',
  gravity: 1.0, damping: 0.5, elasticity: 0.4, breeze: 0.3, idleSway: true,
  lighting: 'neon', bloom: false, shadow: true,
  cardsPerViewDesktop: 3, cardsPerViewTablet: 2, cardsPerViewMobile: 1, cardSpacing: 2.0,
}

// ── UI helpers ────────────────────────────────────────────────────────────────
function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="block font-mono text-[11px] uppercase tracking-widest text-muted-foreground">{label}</label>
      {children}
      {hint && <p className="font-mono text-[10px] text-muted-foreground/60">{hint}</p>}
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-4">{children}</div>
}

function inputCls() {
  return 'w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs text-white placeholder:text-muted-foreground focus:border-cyan focus:outline-none'
}

function Select({ value, onChange, options }: {
  value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs text-white focus:border-cyan focus:outline-none">
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function Range({ value, onChange, min = 0, max = 1, step = 0.01 }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number
}) {
  return (
    <div className="flex items-center gap-3">
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="flex-1 accent-cyan h-1.5 rounded-full" />
      <span className="font-mono text-[11px] text-cyan w-10 text-right tabular-nums">{value.toFixed(2)}</span>
    </div>
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <div className={`relative w-9 h-5 rounded-full transition-colors ${checked ? 'bg-cyan' : 'bg-border'}`}
        onClick={() => onChange(!checked)}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
      </div>
      <span className="font-mono text-xs text-white/80">{label}</span>
    </label>
  )
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input type="color" value={value} onChange={e => onChange(e.target.value)}
        className="w-8 h-8 rounded border border-border bg-transparent cursor-pointer p-0.5" />
      <input type="text" value={value} onChange={e => onChange(e.target.value)}
        placeholder="#000000"
        className={inputCls() + ' font-mono uppercase'} />
    </div>
  )
}

// ── TABS ──────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'layout',   label: 'Layout',   Icon: LayoutGrid  },
  { id: 'card',     label: 'Card',     Icon: CreditCard  },
  { id: 'front',    label: 'Front',    Icon: ImageIcon   },
  { id: 'back',     label: 'Back',     Icon: AlignLeft   },
  { id: 'strap',    label: 'Strap',    Icon: Dumbbell    },
  { id: 'physics',  label: 'Physics',  Icon: Zap         },
  { id: 'lighting', label: 'Lighting', Icon: Lightbulb   },
  { id: 'behavior', label: 'Behavior', Icon: Settings2   },
] as const
type TabId = typeof TABS[number]['id']

// ── Main component ────────────────────────────────────────────────────────────
export default function PanelCard3DAdmin() {
  const [tab, setTab]           = useState<TabId>('layout')
  const [, setCfg]              = useState<CardConfig>(DEFAULT)
  const [draft, setDraft]       = useState<CardConfig>(DEFAULT)
  const [saving, setSaving]     = useState(false)
  const [isDirty, setIsDirty]   = useState(false)
  const [previewKey, setPreviewKey] = useState(0)
  const [siteLogo, setSiteLogo] = useState<string>('/genzone-fallback.svg')
  const [overrideLogo, setOverrideLogo] = useState<boolean>(false)

  // Load site logo and existing config from site_config (draft row)
  useEffect(() => {
    async function loadData() {
      let resolvedLogo = '/genzone-fallback.svg'
      try {
        const { data: sData } = await supabase.from('settings').select('value').eq('key', 'logo_url').maybeSingle()
        if (sData?.value) {
          resolvedLogo = sData.value
        } else {
          const { data: cData } = await supabase.from('site_config').select('value').eq('key', 'site_identity').maybeSingle()
          if (cData?.value && (cData.value as any).logo_url) {
            resolvedLogo = (cData.value as any).logo_url
          }
        }
      } catch (err) {
        console.warn('Could not load site logo:', err)
      }
      setSiteLogo(resolvedLogo)

      const { data } = await supabase
        .from('site_config')
        .select('value')
        .eq('key', 'panel.card3d')
        .eq('status', 'draft')
        .maybeSingle()

      if (data?.value) {
        const loaded = { ...DEFAULT, ...(data.value as Partial<CardConfig>) }
        const hasCustomLogo = !!loaded.logoUrl && loaded.logoUrl !== resolvedLogo && loaded.logoUrl !== '/genzone-fallback.svg'
        setOverrideLogo(hasCustomLogo)
        if (!hasCustomLogo) {
          loaded.logoUrl = resolvedLogo
        }
        setCfg(loaded)
        setDraft(loaded)
      } else {
        setDraft(prev => ({ ...prev, logoUrl: resolvedLogo }))
        setCfg(prev => ({ ...prev, logoUrl: resolvedLogo }))
      }
    }
    loadData()
  }, [])

  function patch(partial: Partial<CardConfig>) {
    setDraft(prev => ({ ...prev, ...partial }))
    setIsDirty(true)
  }

  async function saveDraft() {
    setSaving(true)
    const toSave = { ...draft, logoUrl: overrideLogo ? draft.logoUrl : siteLogo }
    const { error } = await supabase
      .from('site_config')
      .upsert({ key: 'panel.card3d', status: 'draft', value: toSave as unknown as Record<string,unknown>, updated_at: new Date().toISOString() },
        { onConflict: 'key,status' })
    setSaving(false)
    if (error) { toast.error('Save failed: ' + error.message); return }
    setCfg(toSave)
    setDraft(toSave)
    setIsDirty(false)
    toast.success('Draft saved')
  }

  async function publish() {
    setSaving(true)
    const toSave = { ...draft, logoUrl: overrideLogo ? draft.logoUrl : siteLogo }
    // Upsert both draft (save latest) and published
    const { error } = await supabase.from('site_config').upsert([
      { key: 'panel.card3d', status: 'draft',     value: toSave as unknown as Record<string,unknown>, updated_at: new Date().toISOString() },
      { key: 'panel.card3d', status: 'published',  value: toSave as unknown as Record<string,unknown>, updated_at: new Date().toISOString() },
    ], { onConflict: 'key,status' })
    setSaving(false)
    if (error) { toast.error('Publish failed: ' + error.message); return }
    setCfg(toSave)
    setDraft(toSave)
    setIsDirty(false)
    toast.success('Published! Public site will update on next load.')
  }

  function resetToDefaults() {
    setDraft(DEFAULT)
    setIsDirty(true)
    toast.info('Reset to defaults — save to persist')
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-black text-white tracking-tight">
            Panel <span className="text-cyan">3D ID Cards</span>
          </h1>
          <p className="font-mono text-xs text-muted-foreground mt-1">
            Configure the Meet the Panel section's interactive 3D card carousel.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={resetToDefaults}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 font-mono text-xs text-muted-foreground hover:text-white hover:border-white/30 transition-all">
            <RotateCcw size={13} /> Reset
          </button>
          <button onClick={saveDraft} disabled={saving || !isDirty}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 font-mono text-xs text-muted-foreground hover:text-white hover:border-white/30 transition-all disabled:opacity-30">
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            Save Draft
          </button>
          <button onClick={publish} disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-cyan px-4 py-2 font-mono text-xs font-bold text-black hover:bg-cyan/90 transition-all disabled:opacity-40">
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
            Publish
          </button>
        </div>
      </div>

      {isDirty && (
        <div className="rounded-lg border border-yellow/30 bg-yellow/5 px-4 py-2 font-mono text-xs text-yellow">
          Unsaved changes — save draft or publish to apply.
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
        {/* ── Left: Tab editor ── */}
        <div className="space-y-4">
          {/* Tab bar */}
          <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-sidebar p-1">
            {TABS.map(({ id, label, Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-xs tracking-wide transition-all ${
                  tab === id ? 'bg-cyan text-black font-bold' : 'text-muted-foreground hover:text-white'
                }`}>
                <Icon size={12} /> {label}
              </button>
            ))}
          </div>

          {/* Tab panels */}
          <div className="rounded-xl border border-border bg-sidebar p-5 space-y-5">

            {/* LAYOUT */}
            {tab === 'layout' && <>
              <Field label="Display Mode">
                <Select value={draft.mode} onChange={v => patch({ mode: v as CardMode })} options={[
                  { value: 'auto',    label: 'Auto (3D on capable devices, 2D fallback)' },
                  { value: '3d',      label: 'Always 3D' },
                  { value: '2d_only', label: '2D only (disable 3D everywhere)' },
                ]} />
              </Field>
              <Field label="Card Layout">
                <Select value={draft.layout} onChange={v => patch({ layout: v as 'carousel' | 'grid' })} options={[
                  { value: 'carousel', label: 'Carousel (prev/next with dots)' },
                  { value: 'grid',     label: 'Wrapped grid rows' },
                ]} />
              </Field>
              <Row>
                <Field label="Cards — Desktop">
                  <input type="number" min={1} max={5} value={draft.cardsPerViewDesktop}
                    onChange={e => patch({ cardsPerViewDesktop: Number(e.target.value) })}
                    className={inputCls()} />
                </Field>
                <Field label="Cards — Tablet">
                  <input type="number" min={1} max={3} value={draft.cardsPerViewTablet}
                    onChange={e => patch({ cardsPerViewTablet: Number(e.target.value) })}
                    className={inputCls()} />
                </Field>
              </Row>
              <Field label="Card Spacing (world units)" hint="Distance between card centers. Default 2.0">
                <Range value={draft.cardSpacing} onChange={v => patch({ cardSpacing: v })} min={1.2} max={3.5} step={0.05} />
              </Field>
              <Field label="Low-power threshold" hint="Devices with fewer CPU cores than this fall back to 2D in Auto mode">
                <input type="number" min={1} max={16} value={draft.lowPowerThreshold}
                  onChange={e => patch({ lowPowerThreshold: Number(e.target.value) })}
                  className={inputCls()} />
              </Field>
            </>}

            {/* CARD */}
            {tab === 'card' && <>
              <Field label="Preset">
                <Select value={draft.preset} onChange={v => patch({ preset: v as CardPreset })} options={[
                  { value: 'neon',    label: 'Neon (default — cyan/pink/yellow)' },
                  { value: 'minimal', label: 'Minimal (grey tones)' },
                  { value: 'holo',    label: 'Holo ID (purple iridescent)' },
                  { value: 'classic', label: 'Classic Badge (gold)' },
                ]} />
              </Field>
              <Row>
                <Field label="Orientation">
                  <Select value={draft.orientation} onChange={v => patch({ orientation: v as CardOrientation })} options={[
                    { value: 'portrait',  label: 'Portrait (taller)' },
                    { value: 'landscape', label: 'Landscape (wider)' },
                  ]} />
                </Field>
                <Field label="Finish">
                  <Select value={draft.finish} onChange={v => patch({ finish: v as CardFinish })} options={[
                    { value: 'glossy',      label: 'Glossy' },
                    { value: 'matte',       label: 'Matte' },
                    { value: 'holographic', label: 'Holographic' },
                    { value: 'metallic',    label: 'Metallic' },
                  ]} />
                </Field>
              </Row>
              <Row>
                <Field label="Base Color"><ColorInput value={draft.baseColor} onChange={v => patch({ baseColor: v })} /></Field>
                <Field label="Edge Color"><ColorInput value={draft.edgeColor} onChange={v => patch({ edgeColor: v })} /></Field>
              </Row>
              <Field label="Corner Radius" hint="0 = sharp, 1 = very rounded">
                <Range value={draft.cornerRadius} onChange={v => patch({ cornerRadius: v })} />
              </Field>
              <Field label="Card Size" hint="Relative to viewport height (0.15–0.9)">
                <Range value={draft.size} onChange={v => patch({ size: v })} min={0.15} max={0.9} step={0.01} />
              </Field>
              <Field label="Metal Finish">
                <Select value={draft.metal} onChange={v => patch({ metal: v as 'silver' | 'gold' | 'graphite' })} options={[
                  { value: 'silver',   label: 'Silver' },
                  { value: 'gold',     label: 'Gold' },
                  { value: 'graphite', label: 'Graphite' },
                ]} />
              </Field>
            </>}

            {/* FRONT */}
            {tab === 'front' && <>
              <div className="space-y-3 rounded-lg border border-border bg-background/50 p-3.5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 shrink-0 rounded-lg border border-border bg-black/60 p-1 flex items-center justify-center overflow-hidden">
                      <img
                        src={overrideLogo && draft.logoUrl ? draft.logoUrl : siteLogo}
                        alt="Logo preview"
                        className="h-full w-full object-contain"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/genzone-fallback.svg' }}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-medium text-white truncate">
                        {overrideLogo ? 'Custom Card Logo' : 'Using site logo (set in Settings)'}
                      </p>
                      <p className="font-mono text-[10px] text-muted-foreground truncate max-w-sm">
                        {overrideLogo ? (draft.logoUrl || 'Enter URL below') : siteLogo}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-[11px] text-muted-foreground">Override</span>
                    <Toggle
                      checked={overrideLogo}
                      onChange={(val) => {
                        setOverrideLogo(val)
                        if (!val) {
                          patch({ logoUrl: siteLogo })
                        }
                      }}
                      label=""
                    />
                  </div>
                </div>

                {overrideLogo && (
                  <div className="pt-2 border-t border-border/50">
                    <Field label="Custom Logo URL" hint="Optional: Use a different logo URL only for the 3D cards.">
                      <input
                        type="text"
                        value={draft.logoUrl}
                        onChange={(e) => patch({ logoUrl: e.target.value })}
                        placeholder="https://... or /logo.png"
                        className={inputCls()}
                      />
                    </Field>
                  </div>
                )}
              </div>

              <Field label="Club Name (header text)">
                <input type="text" value={draft.clubName} onChange={e => patch({ clubName: e.target.value })}
                  className={inputCls()} />
              </Field>
              <Field label="Photo Frame">
                <Select value={draft.photoFrame} onChange={v => patch({ photoFrame: v as 'rectangle' | 'rounded' | 'circle' })} options={[
                  { value: 'rectangle', label: 'Rectangle' },
                  { value: 'rounded',   label: 'Rounded' },
                  { value: 'circle',    label: 'Circle' },
                ]} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Toggle checked={draft.showMemberId} onChange={v => patch({ showMemberId: v })} label="Member ID badge" />
                <Toggle checked={draft.accentStripe}  onChange={v => patch({ accentStripe: v })}  label="Accent stripe" />
                <Toggle checked={draft.showHologram}  onChange={v => patch({ showHologram: v })}  label="Hologram sticker" />
                <Toggle checked={draft.showBarcode}   onChange={v => patch({ showBarcode: v })}   label="Barcode strip" />
              </div>

              <div className="space-y-4 rounded-xl border border-border bg-background/40 p-4 pt-3.5">
                <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-2.5">
                  <div>
                    <p className="font-mono text-xs font-semibold uppercase tracking-widest text-white">Social buttons</p>
                    <p className="font-mono text-[10px] text-muted-foreground">Interactive buttons rendered on the 3D card front</p>
                  </div>
                  <Toggle checked={draft.showFrontSocials} onChange={v => patch({ showFrontSocials: v })} label="Show on front" />
                </div>

                {draft.showFrontSocials && <>
                  <Field label="Platforms to show on front">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-0.5">
                      {SOCIAL_PLATFORM_OPTIONS.map(opt => {
                        const checked = draft.frontSocialPlatforms.includes(opt.id)
                        return (
                          <label
                            key={opt.id}
                            className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 font-mono text-xs cursor-pointer transition-colors ${
                              checked
                                ? 'border-cyan/60 bg-cyan/10 text-white'
                                : 'border-border bg-background/60 text-muted-foreground hover:text-white'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                const next = checked
                                  ? draft.frontSocialPlatforms.filter(p => p !== opt.id)
                                  : [...draft.frontSocialPlatforms, opt.id]
                                patch({ frontSocialPlatforms: next })
                              }}
                              className="accent-cyan h-3.5 w-3.5 rounded"
                            />
                            <span>{opt.label}</span>
                          </label>
                        )
                      })}
                    </div>
                  </Field>

                  <Row>
                    <Field label="Button size">
                      <Select value={draft.socialButtonSize} onChange={v => patch({ socialButtonSize: v as SocialButtonSize })} options={[
                        { value: 'small',  label: 'Small' },
                        { value: 'medium', label: 'Medium' },
                        { value: 'large',  label: 'Large' },
                      ]} />
                    </Field>
                    <Field label="Instagram prominence">
                      <Select value={draft.instagramProminence} onChange={v => patch({ instagramProminence: v as InstagramProminence })} options={[
                        { value: 'large',  label: 'Large pill with handle' },
                        { value: 'normal', label: 'Normal icon button' },
                      ]} />
                    </Field>
                  </Row>

                  <Row>
                    <Field label="Button style">
                      <Select value={draft.socialButtonStyle} onChange={v => patch({ socialButtonStyle: v as SocialButtonStyle })} options={[
                        { value: 'icon_handle', label: 'Icon + handle' },
                        { value: 'icon_only',   label: 'Icon only' },
                      ]} />
                    </Field>
                    <Field label="Position on card front">
                      <Select value={draft.socialButtonPosition} onChange={v => patch({ socialButtonPosition: v as SocialButtonPosition })} options={[
                        { value: 'bottom',     label: 'Bottom strip' },
                        { value: 'under_name', label: 'Under role & name' },
                      ]} />
                    </Field>
                  </Row>

                  <Row>
                    <Field label="Button colors">
                      <Select value={draft.socialButtonColors} onChange={v => patch({ socialButtonColors: v as SocialButtonColors })} options={[
                        { value: 'brand',  label: 'Brand colors' },
                        { value: 'accent', label: 'Card accent color' },
                        { value: 'mono',   label: 'Monochrome glass' },
                      ]} />
                    </Field>
                    <div className="flex items-end pb-1.5">
                      <Toggle checked={draft.socialButtonGlow} onChange={v => patch({ socialButtonGlow: v })} label="Hover glow on buttons" />
                    </div>
                  </Row>
                </>}
              </div>
            </>}

            {/* BACK */}
            {tab === 'back' && <>
              <Toggle checked={draft.showQr} onChange={v => patch({ showQr: v })} label="Show QR code on card back" />
              <Field label="QR Code URL">
                <input type="text" value={draft.qrUrl} onChange={e => patch({ qrUrl: e.target.value })}
                  placeholder="https://genzone-webpage.vercel.app" className={inputCls()} />
              </Field>
              <Field label="Card Tagline" hint="Printed at the bottom of the card back">
                <input type="text" value={draft.tagline} onChange={e => patch({ tagline: e.target.value })}
                  className={inputCls()} />
              </Field>
              <Toggle checked={draft.popupEnabled} onChange={v => patch({ popupEnabled: v })}
                label="Enable 'Open full profile' button (opens the popup after card flip)" />
            </>}

            {/* STRAP */}
            {tab === 'strap' && <>
              <Row>
                <Field label="Strap Color 1"><ColorInput value={draft.strapColor}  onChange={v => patch({ strapColor: v })} /></Field>
                <Field label="Strap Color 2"><ColorInput value={draft.strapColor2} onChange={v => patch({ strapColor2: v })} /></Field>
              </Row>
              <Field label="Strap Pattern">
                <Select value={draft.strapPattern} onChange={v => patch({ strapPattern: v as StrapPattern })} options={[
                  { value: 'solid',   label: 'Solid' },
                  { value: 'stripes', label: 'Diagonal stripes' },
                  { value: 'text',    label: 'Repeating text (GENZONE ✦)' },
                ]} />
              </Field>
              <Field label="Strap Width" hint="0.4 = narrow · 2.0 = wide">
                <Range value={draft.strapWidth} onChange={v => patch({ strapWidth: v })} min={0.4} max={2.0} step={0.05} />
              </Field>
              <Field label="Strap Length" hint="0 = short · 1 = long">
                <Range value={draft.strapLength} onChange={v => patch({ strapLength: v })} />
              </Field>
              <Field label="Clip / Hardware Finish">
                <Select value={draft.metal} onChange={v => patch({ metal: v as 'silver' | 'gold' | 'graphite' })} options={[
                  { value: 'silver', label: 'Silver' }, { value: 'gold', label: 'Gold' }, { value: 'graphite', label: 'Graphite' },
                ]} />
              </Field>
            </>}

            {/* PHYSICS */}
            {tab === 'physics' && <>
              <Field label="Gravity" hint="0 = weightless · 3 = heavy">
                <Range value={draft.gravity} onChange={v => patch({ gravity: v })} min={0} max={3} step={0.05} />
              </Field>
              <Field label="Damping" hint="0 = swings forever · 1 = settles instantly">
                <Range value={draft.damping} onChange={v => patch({ damping: v })} />
              </Field>
              <Field label="Elasticity" hint="0 = stiff · 1 = very springy strap">
                <Range value={draft.elasticity} onChange={v => patch({ elasticity: v })} />
              </Field>
              <Field label="Breeze" hint="Simulated wind. 0 = off · 1 = strong">
                <Range value={draft.breeze} onChange={v => patch({ breeze: v })} />
              </Field>
              <Toggle checked={draft.idleSway} onChange={v => patch({ idleSway: v })} label="Idle sway when not dragging" />
            </>}

            {/* LIGHTING */}
            {tab === 'lighting' && <>
              <Field label="Lighting Preset">
                <Select value={draft.lighting} onChange={v => patch({ lighting: v as LightingPreset })} options={[
                  { value: 'studio', label: 'Studio (white key + fill)' },
                  { value: 'neon',   label: 'Neon (cyan key + pink fill, matches site identity)' },
                ]} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Toggle checked={draft.shadow} onChange={v => patch({ shadow: v })} label="Soft contact shadow" />
                <Toggle checked={draft.bloom}  onChange={v => patch({ bloom: v })}  label="Bloom (off by default — heavy on mobile)" />
              </div>
            </>}

            {/* BEHAVIOR */}
            {tab === 'behavior' && <>
              <Toggle checked={draft.showHint} onChange={v => patch({ showHint: v })} label="Show 'Drag · Tap to flip' hint (once per session)" />
              <Field label="Hint Text">
                <input type="text" value={draft.hintText} onChange={e => patch({ hintText: e.target.value })}
                  className={inputCls()} />
              </Field>
              <Toggle checked={draft.popupEnabled} onChange={v => patch({ popupEnabled: v })}
                label="Flip → open full member profile popup" />
            </>}
          </div>
        </div>

        {/* ── Right: Live preview ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">Live Preview</span>
            <button onClick={() => setPreviewKey(k => k + 1)}
              className="font-mono text-[10px] text-cyan hover:text-cyan/70 transition-colors">
              Refresh ↺
            </button>
          </div>
          <CardPreviewEmbed cfg={draft} previewKey={previewKey} />
          <p className="font-mono text-[10px] text-muted-foreground/60 text-center">
            Preview uses a sample member. Actual cards use real member data.
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Live preview embed ────────────────────────────────────────────────────────
// Renders a small iframe pointing to the public site's panel section,
// OR a simple canvas-based mini-card if we can import the scene.
function CardPreviewEmbed({ cfg, previewKey }: { cfg: CardConfig; previewKey: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef  = useRef<unknown>(null)
  const [loaded, setLoaded] = useState(false)
  const [err, setErr]       = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let alive = true

    // Sample member for preview (with social links so Front Social button controls preview live)
    const sampleMember = {
      id: 'preview', name: 'Member Name', role: 'Vice President',
      accent: 'cyan', sort_order: 0, department: 'Creative',
      year_batch: '2024', bio: 'Club preview member.',
      portrait_url: null, focal_point: '50% 50%',
      skills: ['Design', 'Code', 'Ideas'],
      instagram_url: 'genzone.club',
      linkedin_url: 'genzone-club',
      github_url: 'genzone',
      x_url: 'genzone',
      portfolio_url: 'https://genzone.club',
      social_email: 'team@genzone.club',
    }

    import('../components/panel3d/PanelLanyardScene')
      .then(({ PanelLanyardScene }) => {
        if (!alive) return
        const scene = new PanelLanyardScene(canvas, cfg)
        sceneRef.current = scene
        // @ts-ignore — MemberData is compatible
        scene.addCard(sampleMember, 0)
        const w = canvas.parentElement?.clientWidth || 300
        scene.resize(w, 400, 1)
        scene.positionSlots(0, 1)
        scene.startLoop()
        setLoaded(true)
      })
      .catch(() => setErr(true))

    return () => {
      alive = false
      // @ts-ignore
      sceneRef.current?.dispose?.()
      sceneRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewKey])

  // Patch config changes without rebuilding the scene
  useEffect(() => {
    const scene = sceneRef.current as unknown as {
      updateConfig?: (nextCfg: CardConfig) => void
      wake?: () => void
    } | null
    if (!scene) return
    scene.updateConfig?.(cfg)
    scene.wake?.()
  }, [cfg])

  if (err) {
    return (
      <div className="rounded-xl border border-border bg-sidebar flex items-center justify-center h-[400px]">
        <p className="font-mono text-xs text-muted-foreground">Preview unavailable in this environment.</p>
      </div>
    )
  }

  return (
    <div className="relative rounded-xl border border-border bg-black overflow-hidden" style={{ height: 400 }}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full touch-none"
        onPointerDown={(e) => {
          const canvas = canvasRef.current
          // @ts-ignore
          if (canvas) sceneRef.current?.handlePointerDown?.(e.nativeEvent, canvas, () => {})
        }}
        onPointerMove={(e) => {
          const canvas = canvasRef.current
          // @ts-ignore
          if (canvas) sceneRef.current?.handlePointerMove?.(e.nativeEvent, canvas)
        }}
        onPointerUp={(e) => {
          const canvas = canvasRef.current
          // @ts-ignore
          if (canvas) sceneRef.current?.handlePointerUp?.(e.nativeEvent, canvas, () => {})
        }}
        onPointerCancel={(e) => {
          const canvas = canvasRef.current
          // @ts-ignore
          if (canvas) sceneRef.current?.handlePointerCancel?.(e.nativeEvent, canvas)
        }}
      />
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 size={20} className="animate-spin text-cyan" />
        </div>
      )}
    </div>
  )
}
