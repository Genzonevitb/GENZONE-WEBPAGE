import React from 'react'

export interface TextStyle {
  text?: string
  fontFamily?: string
  fontSize?: { desktop?: number; mobile?: number }
  fontWeight?: number
  color?: string
  opacity?: number
  letterSpacing?: string
  lineHeight?: string
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
  italic?: boolean
  gradient?: { from: string; to: string; angle: number } | null
  glow?: boolean
  outline?: boolean
}

export const FONT_FAMILIES = [
  'Unbounded',
  'Space Grotesk',
  'JetBrains Mono',
  'Orbitron',
  'Rajdhani',
  'Exo 2',
  'Bebas Neue',
  'Inter',
  'Poppins',
  'Montserrat',
  'Oswald',
  'Roboto Condensed',
]

interface Props {
  value: TextStyle
  onChange: (val: TextStyle) => void
  label?: string
  showPreview?: boolean
}

export default function TextStyleEditor({ value, onChange, label, showPreview = true }: Props) {
  const v = {
    text: value?.text ?? 'Sample Preview Text',
    fontFamily: value?.fontFamily ?? 'Unbounded',
    fontSize: {
      desktop: value?.fontSize?.desktop ?? 24,
      mobile: value?.fontSize?.mobile ?? 18,
    },
    fontWeight: value?.fontWeight ?? 700,
    color: value?.color ?? '#ffffff',
    opacity: value?.opacity ?? 1,
    letterSpacing: value?.letterSpacing ?? 'normal',
    lineHeight: value?.lineHeight ?? '1.2',
    textTransform: value?.textTransform ?? 'none',
    italic: value?.italic ?? false,
    gradient: value?.gradient ?? null,
    glow: value?.glow ?? false,
    outline: value?.outline ?? false,
  }

  function update(patch: Partial<TextStyle>) {
    onChange({ ...v, ...patch })
  }

  function updateFontSize(field: 'desktop' | 'mobile', size: number) {
    onChange({
      ...v,
      fontSize: {
        ...v.fontSize,
        [field]: size,
      },
    })
  }

  // Generate preview style
  const previewStyle: React.CSSProperties = {
    fontFamily: v.fontFamily,
    fontSize: `${v.fontSize.desktop}px`,
    fontWeight: v.fontWeight,
    color: v.gradient ? 'transparent' : v.color,
    opacity: v.opacity,
    letterSpacing: v.letterSpacing === 'normal' ? undefined : v.letterSpacing,
    lineHeight: v.lineHeight,
    textTransform: v.textTransform,
    fontStyle: v.italic ? 'italic' : 'normal',
    ...(v.gradient
      ? {
          backgroundImage: `linear-gradient(${v.gradient.angle || 90}deg, ${v.gradient.from || '#00f0ff'}, ${v.gradient.to || '#ff007f'})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }
      : {}),
    ...(v.glow
      ? {
          textShadow: `0 0 12px ${v.color || '#00f0ff'}88, 0 0 24px ${v.color || '#00f0ff'}44`,
        }
      : {}),
    ...(v.outline
      ? {
          WebkitTextStroke: `1px ${v.color || '#ffffff'}`,
          color: 'transparent',
          WebkitTextFillColor: 'transparent',
        }
      : {}),
  }

  return (
    <div className="space-y-4 bg-charcoal/50 border border-border rounded-xl p-4">
      {label && (
        <h4 className="font-mono text-xs uppercase tracking-widest text-cyan font-bold border-b border-border pb-2">
          {label}
        </h4>
      )}

      {/* Live Preview */}
      {showPreview && (
        <div className="p-4 bg-black/60 rounded-lg border border-border/80 flex items-center justify-center min-h-[90px] overflow-hidden text-center">
          <span style={previewStyle} className="select-none break-words">
            {v.text || 'Sample Preview Text'}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Font Family */}
        <div>
          <label className="block font-mono text-[11px] text-muted-foreground uppercase tracking-widest mb-1.5">
            Font Family
          </label>
          <select
            value={v.fontFamily}
            onChange={(e) => update({ fontFamily: e.target.value })}
            className="w-full bg-charcoal border border-border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-cyan text-foreground"
          >
            {FONT_FAMILIES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        {/* Font Weight */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="font-mono text-[11px] text-muted-foreground uppercase tracking-widest">
              Font Weight
            </label>
            <span className="font-mono text-xs text-cyan">{v.fontWeight}</span>
          </div>
          <input
            type="range"
            min="100"
            max="900"
            step="100"
            value={v.fontWeight}
            onChange={(e) => update({ fontWeight: Number(e.target.value) })}
            className="w-full accent-cyan cursor-pointer"
          />
        </div>

        {/* Desktop Font Size */}
        <div>
          <label className="block font-mono text-[11px] text-muted-foreground uppercase tracking-widest mb-1.5">
            Desktop Size (px)
          </label>
          <input
            type="number"
            min="8"
            max="160"
            value={v.fontSize.desktop}
            onChange={(e) => updateFontSize('desktop', Number(e.target.value))}
            className="w-full bg-charcoal border border-border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-cyan text-foreground"
          />
        </div>

        {/* Mobile Font Size */}
        <div>
          <label className="block font-mono text-[11px] text-muted-foreground uppercase tracking-widest mb-1.5">
            Mobile Size (px)
          </label>
          <input
            type="number"
            min="8"
            max="120"
            value={v.fontSize.mobile}
            onChange={(e) => updateFontSize('mobile', Number(e.target.value))}
            className="w-full bg-charcoal border border-border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-cyan text-foreground"
          />
        </div>

        {/* Color */}
        <div>
          <label className="block font-mono text-[11px] text-muted-foreground uppercase tracking-widest mb-1.5">
            Color
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={v.color.startsWith('#') && v.color.length === 7 ? v.color : '#ffffff'}
              onChange={(e) => update({ color: e.target.value })}
              className="h-8 w-9 rounded border border-border bg-transparent cursor-pointer p-0"
            />
            <input
              type="text"
              value={v.color}
              onChange={(e) => update({ color: e.target.value })}
              className="flex-1 bg-charcoal border border-border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-cyan text-foreground"
              placeholder="#ffffff"
            />
          </div>
        </div>

        {/* Opacity */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="font-mono text-[11px] text-muted-foreground uppercase tracking-widest">
              Opacity
            </label>
            <span className="font-mono text-xs text-cyan">{Math.round(v.opacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={v.opacity}
            onChange={(e) => update({ opacity: Number(e.target.value) })}
            className="w-full accent-cyan cursor-pointer"
          />
        </div>

        {/* Letter Spacing */}
        <div>
          <label className="block font-mono text-[11px] text-muted-foreground uppercase tracking-widest mb-1.5">
            Letter Spacing
          </label>
          <input
            type="text"
            value={v.letterSpacing}
            onChange={(e) => update({ letterSpacing: e.target.value })}
            placeholder="e.g. 0.05em, 2px, normal"
            className="w-full bg-charcoal border border-border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-cyan text-foreground"
          />
        </div>

        {/* Text Transform */}
        <div>
          <label className="block font-mono text-[11px] text-muted-foreground uppercase tracking-widest mb-1.5">
            Text Transform
          </label>
          <select
            value={v.textTransform}
            onChange={(e) => update({ textTransform: e.target.value as any })}
            className="w-full bg-charcoal border border-border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-cyan text-foreground"
          >
            <option value="none">None</option>
            <option value="uppercase">UPPERCASE</option>
            <option value="lowercase">lowercase</option>
            <option value="capitalize">Capitalize</option>
          </select>
        </div>
      </div>

      {/* Toggles */}
      <div className="pt-2 border-t border-border flex flex-wrap gap-4 items-center">
        <label className="flex items-center gap-2 cursor-pointer font-mono text-xs text-foreground">
          <input
            type="checkbox"
            checked={v.italic}
            onChange={(e) => update({ italic: e.target.checked })}
            className="rounded border-border accent-cyan"
          />
          Italic
        </label>

        <label className="flex items-center gap-2 cursor-pointer font-mono text-xs text-foreground">
          <input
            type="checkbox"
            checked={v.glow}
            onChange={(e) => update({ glow: e.target.checked })}
            className="rounded border-border accent-cyan"
          />
          Glow Effect
        </label>

        <label className="flex items-center gap-2 cursor-pointer font-mono text-xs text-foreground">
          <input
            type="checkbox"
            checked={v.outline}
            onChange={(e) => update({ outline: e.target.checked })}
            className="rounded border-border accent-cyan"
          />
          Outline Only
        </label>

        <label className="flex items-center gap-2 cursor-pointer font-mono text-xs text-foreground">
          <input
            type="checkbox"
            checked={!!v.gradient}
            onChange={(e) =>
              update({
                gradient: e.target.checked
                  ? { from: '#00f0ff', to: '#ff007f', angle: 90 }
                  : null,
              })
            }
            className="rounded border-border accent-cyan"
          />
          Gradient Text
        </label>
      </div>

      {/* Gradient options if enabled */}
      {v.gradient && (
        <div className="p-3 bg-black/40 border border-border rounded-lg space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-mono text-[10px] text-muted-foreground uppercase mb-1">
                From Color
              </label>
              <div className="flex gap-1.5 items-center">
                <input
                  type="color"
                  value={v.gradient.from}
                  onChange={(e) =>
                    update({
                      gradient: { ...v.gradient!, from: e.target.value },
                    })
                  }
                  className="h-7 w-7 rounded border border-border bg-transparent cursor-pointer p-0"
                />
                <input
                  type="text"
                  value={v.gradient.from}
                  onChange={(e) =>
                    update({
                      gradient: { ...v.gradient!, from: e.target.value },
                    })
                  }
                  className="w-full bg-charcoal border border-border rounded px-2 py-1 text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-mono text-[10px] text-muted-foreground uppercase mb-1">
                To Color
              </label>
              <div className="flex gap-1.5 items-center">
                <input
                  type="color"
                  value={v.gradient.to}
                  onChange={(e) =>
                    update({
                      gradient: { ...v.gradient!, to: e.target.value },
                    })
                  }
                  className="h-7 w-7 rounded border border-border bg-transparent cursor-pointer p-0"
                />
                <input
                  type="text"
                  value={v.gradient.to}
                  onChange={(e) =>
                    update({
                      gradient: { ...v.gradient!, to: e.target.value },
                    })
                  }
                  className="w-full bg-charcoal border border-border rounded px-2 py-1 text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-mono text-[10px] text-muted-foreground uppercase">
                  Angle
                </label>
                <span className="font-mono text-[10px] text-cyan">{v.gradient.angle}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={v.gradient.angle}
                onChange={(e) =>
                  update({
                    gradient: { ...v.gradient!, angle: Number(e.target.value) },
                  })
                }
                className="w-full accent-cyan cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
