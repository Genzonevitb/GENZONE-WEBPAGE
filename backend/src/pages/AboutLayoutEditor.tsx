import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import {
  Save,
  RotateCcw,
  Copy,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Monitor,
  Smartphone,
  Grid,
  Layers,
  Sliders,
  Type,
  FileText,
  BarChart2,
  Tag,
  Eye,
  EyeOff,
} from 'lucide-react'
import TextStyleEditor, { TextStyle } from '@/components/TextStyleEditor'

export interface LayoutElement {
  id: string
  type: 'heading' | 'paragraph' | 'stats' | 'ghost_text' | 'image' | 'badge'
  x: number // % of frame width (0 - 100)
  y: number // % of frame height (0 - 100)
  w: number // % width (0 - 100)
  text?: string
  textStyle?: TextStyle
  opacity?: number
  rotation?: number
  blur?: number
  fontSize?: number
  color?: string
  parallax_speed?: number
  animation?: string
  show?: boolean
}

interface LayoutConfig {
  elements: LayoutElement[]
}

interface DbStat {
  id: string
  value: string
  label: string
  accent: string
}

const DEFAULT_DESKTOP_ELEMENTS: LayoutElement[] = [
  {
    id: 'el-ghost',
    type: 'ghost_text',
    x: 0,
    y: 12,
    w: 100,
    text: 'LOUDER BOLDER',
    opacity: 0.05,
    fontSize: 110,
    color: '#ffffff',
    rotation: 0,
    show: true,
  },
  {
    id: 'el-badge',
    type: 'badge',
    x: 5,
    y: 5,
    w: 30,
    text: '01 // ABOUT GENZONE',
    fontSize: 13,
    color: '#00f0ff',
    show: true,
  },
  {
    id: 'el-heading',
    type: 'heading',
    x: 5,
    y: 22,
    w: 44,
    text: 'A PLAYGROUND FOR PEOPLE WHO MAKE THINGS.',
    fontSize: 38,
    color: '#ffffff',
    show: true,
  },
  {
    id: 'el-paragraph',
    type: 'paragraph',
    x: 52,
    y: 22,
    w: 43,
    text: "GenZone is the college's creative and technical club — a crew of designers, coders, filmmakers, artists and curious minds who'd rather build than sit still.\n\n[Placeholder: your club's story, mission and founding year go here.]",
    fontSize: 15,
    color: '#a1a1aa',
    show: true,
  },
  {
    id: 'el-stats',
    type: 'stats',
    x: 52,
    y: 58,
    w: 43,
    show: true,
  },
]

const DEFAULT_MOBILE_ELEMENTS: LayoutElement[] = [
  {
    id: 'm-ghost',
    type: 'ghost_text',
    x: 0,
    y: 5,
    w: 100,
    text: 'LOUDER BOLDER',
    opacity: 0.05,
    fontSize: 60,
    color: '#ffffff',
    rotation: 0,
    show: true,
  },
  {
    id: 'm-badge',
    type: 'badge',
    x: 5,
    y: 3,
    w: 90,
    text: '01 // ABOUT GENZONE',
    fontSize: 12,
    color: '#00f0ff',
    show: true,
  },
  {
    id: 'm-heading',
    type: 'heading',
    x: 5,
    y: 12,
    w: 90,
    text: 'A PLAYGROUND FOR PEOPLE WHO MAKE THINGS.',
    fontSize: 28,
    color: '#ffffff',
    show: true,
  },
  {
    id: 'm-paragraph',
    type: 'paragraph',
    x: 5,
    y: 35,
    w: 90,
    text: "GenZone is the college's creative and technical club — a crew of designers, coders, filmmakers, artists and curious minds who'd rather build than sit still.",
    fontSize: 14,
    color: '#a1a1aa',
    show: true,
  },
  {
    id: 'm-stats',
    type: 'stats',
    x: 5,
    y: 65,
    w: 90,
    show: true,
  },
]

export default function AboutLayoutEditor() {
  const [activeTab, setActiveTab] = useState<'desktop' | 'mobile'>('desktop')
  const [desktopConfig, setDesktopConfig] = useState<LayoutConfig>({ elements: DEFAULT_DESKTOP_ELEMENTS })
  const [mobileConfig, setMobileConfig] = useState<LayoutConfig>({ elements: DEFAULT_MOBILE_ELEMENTS })
  const [sectionHeightDesktop, setSectionHeightDesktop] = useState(800)
  const [sectionHeightMobile, setSectionHeightMobile] = useState(1200)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dbStats, setDbStats] = useState<DbStat[]>([])

  const canvasRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; elemX: number; elemY: number }>({
    mouseX: 0,
    mouseY: 0,
    elemX: 0,
    elemY: 0,
  })

  // Current elements based on active tab
  const currentElements = activeTab === 'desktop' ? desktopConfig.elements : mobileConfig.elements
  const selectedElement = currentElements.find((e) => e.id === selectedId)

  useEffect(() => {
    loadLayout()
    loadStats()
  }, [])

  async function loadLayout() {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('about_layout').select('*').eq('id', 'main').single()
      if (error && error.code !== 'PGRST116') {
        console.warn('Error fetching about_layout:', error.message)
      } else if (data) {
        if (data.desktop_config?.elements?.length > 0) {
          setDesktopConfig(data.desktop_config)
        }
        if (data.mobile_config?.elements?.length > 0) {
          setMobileConfig(data.mobile_config)
        }
        if (data.section_height_desktop) setSectionHeightDesktop(data.section_height_desktop)
        if (data.section_height_mobile) setSectionHeightMobile(data.section_height_mobile)
      }
    } catch (err: any) {
      console.warn('Silent fallback on loadLayout:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadStats() {
    try {
      const { data } = await supabase
        .from('about_stats')
        .select('id, value, label, accent')
        .order('sort_order', { ascending: true })
      if (data && data.length > 0) {
        setDbStats(data as DbStat[])
      }
    } catch {
      // fallback
    }
  }

  function setCurrentElements(updater: (prev: LayoutElement[]) => LayoutElement[]) {
    if (activeTab === 'desktop') {
      setDesktopConfig((prev) => ({ elements: updater(prev.elements) }))
    } else {
      setMobileConfig((prev) => ({ elements: updater(prev.elements) }))
    }
  }

  function updateElement(id: string, patch: Partial<LayoutElement>) {
    setCurrentElements((elements) =>
      elements.map((el) => (el.id === id ? { ...el, ...patch } : el))
    )
  }

  function addElement(type: LayoutElement['type']) {
    const newId = `el-${Date.now()}`
    let defaultText = 'New Element'
    let fontSize = 16
    let color = '#ffffff'
    let w = 40
    let opacity = 1
    let rotation = 0

    if (type === 'heading') {
      defaultText = 'NEW SECTION HEADING'
      fontSize = 32
      w = 50
    } else if (type === 'paragraph') {
      defaultText = 'Enter custom paragraph description text here...'
      fontSize = 15
      color = '#a1a1aa'
      w = 45
    } else if (type === 'ghost_text') {
      defaultText = 'GENZONE'
      fontSize = 90
      opacity = 0.06
      w = 90
    } else if (type === 'badge') {
      defaultText = '✦ TAG LABEL'
      fontSize = 12
      color = '#00f0ff'
      w = 25
    } else if (type === 'stats') {
      w = 45
    }

    const newEl: LayoutElement = {
      id: newId,
      type,
      x: snapToGrid ? 10 : 15,
      y: snapToGrid ? 20 : 25,
      w,
      text: defaultText,
      fontSize,
      color,
      opacity,
      rotation,
      show: true,
    }

    setCurrentElements((prev) => [...prev, newEl])
    setSelectedId(newId)
    toast.success(`Added ${type} element`)
  }

  function deleteElement(id: string) {
    setCurrentElements((prev) => prev.filter((el) => el.id !== id))
    if (selectedId === id) setSelectedId(null)
    toast.info('Element removed')
  }

  function duplicateElement(id: string) {
    const el = currentElements.find((e) => e.id === id)
    if (!el) return
    const duplicated: LayoutElement = {
      ...el,
      id: `el-${Date.now()}`,
      x: Math.min(el.x + 5, 80),
      y: Math.min(el.y + 5, 80),
    }
    setCurrentElements((prev) => [...prev, duplicated])
    setSelectedId(duplicated.id)
    toast.success('Element duplicated')
  }

  function moveLayer(id: string, direction: 'up' | 'down') {
    setCurrentElements((elements) => {
      const idx = elements.findIndex((e) => e.id === id)
      if (idx === -1) return elements
      const targetIdx = direction === 'up' ? idx + 1 : idx - 1
      if (targetIdx < 0 || targetIdx >= elements.length) return elements
      const next = [...elements]
      const temp = next[idx]
      next[idx] = next[targetIdx]
      next[targetIdx] = temp
      return next
    })
  }

  function copyDesktopToMobile() {
    const copied = desktopConfig.elements.map((el) => ({
      ...el,
      id: `m-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      fontSize: el.fontSize ? Math.round(el.fontSize * 0.75) : undefined,
      w: Math.min(el.w * 1.5, 95),
    }))
    setMobileConfig({ elements: copied })
    toast.success('Copied desktop layout to mobile!')
  }

  function resetToDefaults() {
    if (activeTab === 'desktop') {
      setDesktopConfig({ elements: DEFAULT_DESKTOP_ELEMENTS })
    } else {
      setMobileConfig({ elements: DEFAULT_MOBILE_ELEMENTS })
    }
    setSelectedId(null)
    toast.info('Reset elements to default layout')
  }

  async function handleSave() {
    setSaving(true)
    try {
      const { error } = await supabase.from('about_layout').upsert(
        {
          id: 'main',
          desktop_config: desktopConfig,
          mobile_config: mobileConfig,
          section_height_desktop: sectionHeightDesktop,
          section_height_mobile: sectionHeightMobile,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )

      if (error) throw error
      toast.success('About layout saved successfully!')
    } catch (err: any) {
      toast.error('Failed to save layout: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  // Keyboard nudge for selected element
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!selectedId) return
      // Ignore if typing in input/textarea
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return
      }

      const step = e.shiftKey ? 5 : 1
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        updateElement(selectedId, {
          x: Math.max(0, (selectedElement?.x ?? 0) - step),
        })
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        updateElement(selectedId, {
          x: Math.min(100 - (selectedElement?.w ?? 20), (selectedElement?.x ?? 0) + step),
        })
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        updateElement(selectedId, {
          y: Math.max(0, (selectedElement?.y ?? 0) - step),
        })
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        updateElement(selectedId, {
          y: Math.min(95, (selectedElement?.y ?? 0) + step),
        })
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        deleteElement(selectedId)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedId, selectedElement])

  // Mouse Drag handlers
  function startDrag(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    setSelectedId(id)
    isDraggingRef.current = true

    const el = currentElements.find((item) => item.id === id)
    if (!el || !canvasRef.current) return

    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      elemX: el.x,
      elemY: el.y,
    }

    function onMouseMove(ev: MouseEvent) {
      if (!isDraggingRef.current || !canvasRef.current) return
      const rect = canvasRef.current.getBoundingClientRect()
      const deltaX = ev.clientX - dragStartRef.current.mouseX
      const deltaY = ev.clientY - dragStartRef.current.mouseY

      const deltaXPercent = (deltaX / rect.width) * 100
      const deltaYPercent = (deltaY / rect.height) * 100

      let newX = dragStartRef.current.elemX + deltaXPercent
      let newY = dragStartRef.current.elemY + deltaYPercent

      if (snapToGrid) {
        newX = Math.round(newX / 5) * 5
        newY = Math.round(newY / 5) * 5
      }

      newX = Math.max(0, Math.min(100 - (el.w || 20), newX))
      newY = Math.max(0, Math.min(95, newY))

      updateElement(id, { x: Math.round(newX), y: Math.round(newY) })
    }

    function onMouseUp() {
      isDraggingRef.current = false
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  // Render Element on Canvas
  function renderCanvasElement(el: LayoutElement) {
    const isSelected = el.id === selectedId
    if (el.show === false) return null

    let content = null

    if (el.type === 'ghost_text') {
      content = (
        <p
          className="font-display font-black leading-none select-none tracking-widest whitespace-nowrap overflow-hidden text-ellipsis"
          style={{
            fontSize: `${el.fontSize || 80}px`,
            color: el.color || '#ffffff',
            opacity: el.opacity ?? 0.05,
            transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
          }}
        >
          {el.text || 'LOUDER BOLDER'}
        </p>
      )
    } else if (el.type === 'badge') {
      content = (
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-cyan/40 bg-cyan/10 font-mono text-xs uppercase tracking-widest select-none"
          style={{
            color: el.color || '#00f0ff',
            fontSize: `${el.fontSize || 12}px`,
            opacity: el.opacity ?? 1,
          }}
        >
          {el.text || '01 // ABOUT'}
        </div>
      )
    } else if (el.type === 'heading') {
      content = (
        <h2
          className="font-display font-black uppercase leading-tight select-none"
          style={{
            fontSize: `${el.fontSize || 32}px`,
            color: el.color || '#ffffff',
            opacity: el.opacity ?? 1,
          }}
        >
          {el.text || 'HEADING TEXT'}
        </h2>
      )
    } else if (el.type === 'paragraph') {
      content = (
        <p
          className="font-sans leading-relaxed select-none whitespace-pre-wrap"
          style={{
            fontSize: `${el.fontSize || 15}px`,
            color: el.color || '#a1a1aa',
            opacity: el.opacity ?? 1,
          }}
        >
          {el.text || 'Paragraph description text...'}
        </p>
      )
    } else if (el.type === 'stats') {
      const statsToRender =
        dbStats.length > 0
          ? dbStats
          : [
              { id: '1', value: '00+', label: 'Members', accent: 'cyan' },
              { id: '2', value: '00+', label: 'Events', accent: 'pink' },
              { id: '3', value: '00', label: 'Domains', accent: 'yellow' },
            ]

      content = (
        <div className="grid grid-cols-3 gap-3 border-t border-border pt-3 select-none">
          {statsToRender.map((s) => (
            <div key={s.id}>
              <div
                className={`font-display font-black text-xl md:text-2xl ${
                  s.accent === 'pink'
                    ? 'text-pink'
                    : s.accent === 'yellow'
                    ? 'text-yellow'
                    : 'text-cyan'
                }`}
              >
                {s.value}
              </div>
              <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      )
    } else {
      content = (
        <div className="p-3 border border-dashed border-border rounded text-xs font-mono text-muted-foreground select-none">
          {el.text || el.type}
        </div>
      )
    }

    return (
      <div
        key={el.id}
        onMouseDown={(e) => startDrag(e, el.id)}
        onClick={(e) => {
          e.stopPropagation()
          setSelectedId(el.id)
        }}
        style={{
          position: 'absolute',
          left: `${el.x}%`,
          top: `${el.y}%`,
          width: `${el.w}%`,
          cursor: 'grab',
          zIndex: isSelected ? 30 : 10,
        }}
        className={`group transition-shadow p-1.5 rounded-lg ${
          isSelected
            ? 'ring-2 ring-cyan ring-offset-2 ring-offset-background bg-cyan/5 shadow-lg shadow-cyan/20'
            : 'hover:ring-1 hover:ring-border hover:bg-white/[0.02]'
        }`}
      >
        {/* Handle badge showing type */}
        <div
          className={`absolute -top-3 left-1 px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-widest pointer-events-none transition-opacity ${
            isSelected ? 'bg-cyan text-background font-bold opacity-100' : 'bg-charcoal text-muted-foreground opacity-0 group-hover:opacity-80'
          }`}
        >
          {el.type} ({el.x}%, {el.y}%)
        </div>
        {content}
      </div>
    )
  }

  const frameWidth = activeTab === 'desktop' ? 800 : 420
  const currentHeight = activeTab === 'desktop' ? sectionHeightDesktop : sectionHeightMobile

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="font-mono text-xs text-cyan tracking-[0.3em] uppercase mb-1">
            04 — Layout Visual Editor
          </p>
          <h1 className="font-display text-3xl font-black uppercase">About Section Visual Editor</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Drag, nudge with arrow keys, and customize elements directly on the visual frame.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={resetToDefaults}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-white hover:bg-border/30 transition-all"
          >
            <RotateCcw size={14} />
            Reset Defaults
          </button>

          {activeTab === 'mobile' && (
            <button
              type="button"
              onClick={copyDesktopToMobile}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-yellow/40 text-yellow hover:bg-yellow/10 text-xs font-mono uppercase tracking-wider transition-all"
            >
              <Copy size={14} />
              Copy Desktop
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan text-background hover:bg-cyan/90 text-xs font-mono font-semibold uppercase tracking-widest disabled:opacity-40 transition-all"
          >
            <Save size={15} />
            {saving ? 'Saving…' : 'Save Layout'}
          </button>
        </div>
      </div>

      {/* Toolbar & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-charcoal/60 p-4 rounded-xl border border-border">
        {/* Device Switcher */}
        <div className="flex items-center bg-black/60 p-1 rounded-xl border border-border">
          <button
            type="button"
            onClick={() => {
              setActiveTab('desktop')
              setSelectedId(null)
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-all ${
              activeTab === 'desktop'
                ? 'bg-cyan text-background font-bold shadow'
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            <Monitor size={15} />
            Desktop (800px)
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('mobile')
              setSelectedId(null)
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-all ${
              activeTab === 'mobile'
                ? 'bg-cyan text-background font-bold shadow'
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            <Smartphone size={15} />
            Mobile (420px)
          </button>
        </div>

        {/* Add Element Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground uppercase mr-1">Add:</span>
          <button
            type="button"
            onClick={() => addElement('heading')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-charcoal text-xs font-mono text-foreground hover:border-cyan hover:text-cyan transition-all"
          >
            <Type size={13} />
            Heading
          </button>
          <button
            type="button"
            onClick={() => addElement('paragraph')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-charcoal text-xs font-mono text-foreground hover:border-cyan hover:text-cyan transition-all"
          >
            <FileText size={13} />
            Paragraph
          </button>
          <button
            type="button"
            onClick={() => addElement('ghost_text')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-charcoal text-xs font-mono text-foreground hover:border-cyan hover:text-cyan transition-all"
          >
            <Layers size={13} />
            Ghost Text
          </button>
          <button
            type="button"
            onClick={() => addElement('stats')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-charcoal text-xs font-mono text-foreground hover:border-cyan hover:text-cyan transition-all"
          >
            <BarChart2 size={13} />
            Stats
          </button>
          <button
            type="button"
            onClick={() => addElement('badge')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-charcoal text-xs font-mono text-foreground hover:border-cyan hover:text-cyan transition-all"
          >
            <Tag size={13} />
            Badge
          </button>
        </div>

        {/* Section Height & Snap */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer font-mono text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={snapToGrid}
              onChange={(e) => setSnapToGrid(e.target.checked)}
              className="rounded border-border accent-cyan"
            />
            <Grid size={14} className={snapToGrid ? 'text-cyan' : ''} />
            Snap 5%
          </label>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
              Height:
            </span>
            <input
              type="number"
              min="400"
              max="2400"
              step="50"
              value={activeTab === 'desktop' ? sectionHeightDesktop : sectionHeightMobile}
              onChange={(e) => {
                const val = Number(e.target.value)
                if (activeTab === 'desktop') setSectionHeightDesktop(val)
                else setSectionHeightMobile(val)
              }}
              className="w-20 bg-black/60 border border-border rounded px-2 py-1 text-xs font-mono text-foreground text-center"
            />
            <span className="font-mono text-xs text-muted-foreground">px</span>
          </div>
        </div>
      </div>

      {/* Main Workspace: Left Canvas Frame | Right Properties Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive Visual Canvas */}
        <div className="lg:col-span-8 flex flex-col items-center overflow-x-auto bg-black/80 border border-border rounded-2xl p-6 min-h-[600px]">
          <div className="w-full flex justify-between items-center mb-3 px-2">
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              {activeTab.toUpperCase()} FRAME: {frameWidth}px × {currentHeight}px
            </span>
            <span className="font-mono text-[11px] text-cyan">
              Click & drag to move • Arrow keys to nudge (Shift = 5%)
            </span>
          </div>

          <div
            ref={canvasRef}
            onClick={() => setSelectedId(null)}
            style={{
              width: `${frameWidth}px`,
              minHeight: `${Math.min(currentHeight, 900)}px`,
              position: 'relative',
              backgroundImage: snapToGrid
                ? 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)'
                : undefined,
              backgroundSize: '24px 24px',
            }}
            className="border-2 border-border/80 rounded-xl bg-charcoal/40 overflow-hidden relative shadow-2xl transition-all"
          >
            {/* Elements Layer */}
            {currentElements.map((el) => renderCanvasElement(el))}
          </div>
        </div>

        {/* Right: Properties Panel */}
        <div className="lg:col-span-4 space-y-4">
          {selectedElement ? (
            <div className="bg-charcoal/80 border border-border rounded-2xl p-5 space-y-5">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Sliders size={16} className="text-cyan" />
                  <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-white">
                    {selectedElement.type} Element
                  </h3>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveLayer(selectedElement.id, 'up')}
                    className="p-1.5 rounded hover:bg-border/40 text-muted-foreground hover:text-white transition-colors"
                    title="Bring forward in layer order"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveLayer(selectedElement.id, 'down')}
                    className="p-1.5 rounded hover:bg-border/40 text-muted-foreground hover:text-white transition-colors"
                    title="Send backward in layer order"
                  >
                    <ChevronDown size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => duplicateElement(selectedElement.id)}
                    className="p-1.5 rounded hover:bg-border/40 text-muted-foreground hover:text-yellow transition-colors"
                    title="Duplicate element"
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteElement(selectedElement.id)}
                    className="p-1.5 rounded hover:bg-border/40 text-muted-foreground hover:text-pink transition-colors"
                    title="Delete element"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Position & Size */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-mono text-[10px] text-muted-foreground uppercase mb-1">
                    X Position (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={selectedElement.x}
                    onChange={(e) => updateElement(selectedElement.id, { x: Number(e.target.value) })}
                    className="w-full bg-black/50 border border-border rounded px-2.5 py-1.5 text-xs font-mono text-foreground"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] text-muted-foreground uppercase mb-1">
                    Y Position (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={selectedElement.y}
                    onChange={(e) => updateElement(selectedElement.id, { y: Number(e.target.value) })}
                    className="w-full bg-black/50 border border-border rounded px-2.5 py-1.5 text-xs font-mono text-foreground"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] text-muted-foreground uppercase mb-1">
                    Width (%)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={selectedElement.w}
                    onChange={(e) => updateElement(selectedElement.id, { w: Number(e.target.value) })}
                    className="w-full bg-black/50 border border-border rounded px-2.5 py-1.5 text-xs font-mono text-foreground"
                  />
                </div>
              </div>

              {/* Text content if editable */}
              {selectedElement.type !== 'stats' && (
                <div>
                  <label className="block font-mono text-xs text-muted-foreground uppercase tracking-widest mb-1.5">
                    Text Content
                  </label>
                  {selectedElement.type === 'paragraph' ? (
                    <textarea
                      rows={4}
                      value={selectedElement.text || ''}
                      onChange={(e) => updateElement(selectedElement.id, { text: e.target.value })}
                      className="w-full bg-black/50 border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-cyan"
                    />
                  ) : (
                    <input
                      type="text"
                      value={selectedElement.text || ''}
                      onChange={(e) => updateElement(selectedElement.id, { text: e.target.value })}
                      className="w-full bg-black/50 border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-cyan"
                    />
                  )}
                </div>
              )}

              {/* Styling Properties */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[10px] text-muted-foreground uppercase mb-1">
                    Font Size (px)
                  </label>
                  <input
                    type="number"
                    min="8"
                    max="160"
                    value={selectedElement.fontSize || 16}
                    onChange={(e) =>
                      updateElement(selectedElement.id, { fontSize: Number(e.target.value) })
                    }
                    className="w-full bg-black/50 border border-border rounded px-2.5 py-1.5 text-xs font-mono text-foreground"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] text-muted-foreground uppercase mb-1">
                    Rotation (deg)
                  </label>
                  <input
                    type="number"
                    min="-180"
                    max="180"
                    value={selectedElement.rotation || 0}
                    onChange={(e) =>
                      updateElement(selectedElement.id, { rotation: Number(e.target.value) })
                    }
                    className="w-full bg-black/50 border border-border rounded px-2.5 py-1.5 text-xs font-mono text-foreground"
                  />
                </div>
              </div>

              {/* Color & Opacity */}
              <div className="space-y-3">
                <div>
                  <label className="block font-mono text-[10px] text-muted-foreground uppercase mb-1">
                    Color
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={
                        selectedElement.color?.startsWith('#') && selectedElement.color.length === 7
                          ? selectedElement.color
                          : '#ffffff'
                      }
                      onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                      className="h-8 w-8 rounded border border-border bg-transparent cursor-pointer p-0"
                    />
                    <input
                      type="text"
                      value={selectedElement.color || '#ffffff'}
                      onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                      className="flex-1 bg-black/50 border border-border rounded px-2.5 py-1.5 text-xs font-mono text-foreground"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-mono text-[10px] text-muted-foreground uppercase">
                      Opacity
                    </label>
                    <span className="font-mono text-xs text-cyan">
                      {Math.round((selectedElement.opacity ?? 1) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={selectedElement.opacity ?? 1}
                    onChange={(e) =>
                      updateElement(selectedElement.id, { opacity: Number(e.target.value) })
                    }
                    className="w-full accent-cyan cursor-pointer"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-charcoal/60 border border-border rounded-2xl p-6 text-center text-muted-foreground">
              <Layers size={28} className="mx-auto mb-2 text-muted-foreground/60" />
              <p className="font-mono text-xs uppercase tracking-wider text-foreground">
                No element selected
              </p>
              <p className="font-mono text-[11px] text-muted-foreground mt-1">
                Click any element on the preview frame or pick from the list below to edit its properties.
              </p>
            </div>
          )}

          {/* Layer List */}
          <div className="bg-charcoal/60 border border-border rounded-2xl p-4">
            <h4 className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3 pb-2 border-b border-border">
              Elements Order ({currentElements.length})
            </h4>
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
              {currentElements.map((el, i) => (
                <div
                  key={el.id}
                  onClick={() => setSelectedId(el.id)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer font-mono text-xs transition-colors ${
                    el.id === selectedId
                      ? 'bg-cyan/15 text-cyan border border-cyan/40'
                      : 'hover:bg-border/30 text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-[10px] text-muted-foreground">#{i + 1}</span>
                    <span className="font-semibold uppercase tracking-wider">[{el.type}]</span>
                    <span className="truncate text-muted-foreground">
                      {el.text ? el.text.slice(0, 20) : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        updateElement(el.id, { show: el.show === false ? true : false })
                      }}
                      className="text-muted-foreground hover:text-white p-1"
                      title={el.show === false ? 'Show' : 'Hide'}
                    >
                      {el.show === false ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteElement(el.id)
                      }}
                      className="text-muted-foreground hover:text-pink p-1"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
