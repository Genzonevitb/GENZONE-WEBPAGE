import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { uploadImage } from '@/lib/uploadImage'
import { toast } from 'sonner'
import { Upload, Trash2, Loader2, Images, X, Check } from 'lucide-react'
import ConfirmDialog from '@/components/ConfirmDialog'

interface GalleryItem {
  id: string
  caption: string | null
  category: string | null
  image_url: string
  image_path: string
  thumb_url: string | null
  thumb_path: string | null
  event_id: string | null
  sort_order: number | null
  tall: boolean | null
  created_at: string
}

interface UploadTask {
  file: File
  id: string
  status: 'pending' | 'uploading' | 'done' | 'error'
  progress: number
  error?: string
  preview: string
}

const CATEGORIES = ['All', 'Events', 'Workshops', 'Behind the Scenes', 'Fests']

function CategoryBadge({ category }: { category: string | null }) {
  const map: Record<string, string> = {
    Events: 'text-cyan border-cyan/30 bg-cyan/10',
    Workshops: 'text-yellow border-yellow/30 bg-yellow/10',
    'Behind the Scenes': 'text-pink border-pink/30 bg-pink/10',
    Fests: 'text-cyan border-cyan/30 bg-cyan/10',
  }
  const cls = map[category ?? ''] ?? 'text-muted-foreground border-border bg-border/10'
  return (
    <span className={`font-mono text-[9px] uppercase tracking-widest border rounded-full px-1.5 py-0.5 ${cls}`}>
      {category ?? 'Uncategorized'}
    </span>
  )
}

function CaptionEditor({
  item,
  onSave,
}: {
  item: GalleryItem
  onSave: (id: string, caption: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(item.caption ?? '')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleSave() {
    if (value === (item.caption ?? '')) {
      setEditing(false)
      return
    }
    setSaving(true)
    await onSave(item.id, value)
    setSaving(false)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave()
            if (e.key === 'Escape') setEditing(false)
          }}
          onBlur={handleSave}
          className="flex-1 bg-background border border-cyan/50 rounded px-2 py-1 text-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-cyan/50 w-full"
        />
        {saving && <Loader2 size={12} className="text-cyan animate-spin shrink-0" />}
      </div>
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="text-left w-full text-xs font-mono text-muted-foreground hover:text-white transition-colors truncate"
      title="Click to edit caption"
    >
      {item.caption || <span className="italic opacity-50">Add caption…</span>}
    </button>
  )
}

export default function Gallery() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCat, setFilterCat] = useState('All')
  const [uploads, setUploads] = useState<UploadTask[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<GalleryItem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function fetchItems() {
    setLoading(true)
    const { data, error } = await supabase
      .from('gallery')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
    if (error) toast.error(error.message)
    else setItems((data as GalleryItem[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchItems() }, [])

  const filtered =
    filterCat === 'All' ? items : items.filter((i) => i.category === filterCat)

  function validateFile(file: File): string | null {
    if (!file.type.startsWith('image/')) return 'Only image files are accepted.'
    if (file.size > 15 * 1024 * 1024) return 'File exceeds 15 MB limit.'
    return null
  }

  async function processFiles(files: File[]) {
    const tasks: UploadTask[] = files.map((file) => ({
      file,
      id: crypto.randomUUID(),
      status: 'pending',
      progress: 0,
      preview: URL.createObjectURL(file),
      error: validateFile(file) ?? undefined,
    }))

    setUploads((prev) => [...prev, ...tasks])

    for (const task of tasks) {
      if (task.error) continue
      setUploads((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: 'uploading', progress: 20 } : t))
      )
      try {
        // Upload full image
        const full = await uploadImage(task.file, 'gallery', 1600, 1)
        setUploads((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, progress: 60 } : t))
        )
        // Upload thumb
        const thumb = await uploadImage(task.file, 'gallery', 400, 0.1)
        setUploads((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, progress: 85 } : t))
        )
        // Insert db row
        const { error } = await supabase.from('gallery').insert({
          image_url: full.url,
          image_path: full.path,
          thumb_url: thumb.url,
          thumb_path: thumb.path,
          caption: null,
          category: null,
          sort_order: null,
          tall: false,
        })
        if (error) throw error
        setUploads((prev) =>
          prev.map((t) =>
            t.id === task.id ? { ...t, status: 'done', progress: 100 } : t
          )
        )
      } catch (err: any) {
        setUploads((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? { ...t, status: 'error', error: err.message ?? 'Upload failed.' }
              : t
          )
        )
      }
    }

    await fetchItems()

    // Clean done tasks after delay
    setTimeout(() => {
      setUploads((prev) => prev.filter((t) => t.status !== 'done'))
    }, 3000)
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }

  function onDragLeave() { setIsDragging(false) }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length) processFiles(files)
  }

  function onFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length) processFiles(files)
    e.target.value = ''
  }

  async function saveCaption(id: string, caption: string) {
    const { error } = await supabase.from('gallery').update({ caption }).eq('id', id)
    if (error) toast.error(error.message)
    else {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, caption } : i)))
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const paths: string[] = []
      if (deleteTarget.image_path) paths.push(deleteTarget.image_path)
      if (deleteTarget.thumb_path) paths.push(deleteTarget.thumb_path)
      if (paths.length) await supabase.storage.from('gallery').remove(paths)
      const { error } = await supabase.from('gallery').delete().eq('id', deleteTarget.id)
      if (error) throw error
      toast.success('Photo deleted.')
      setDeleteTarget(null)
      await fetchItems()
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to delete photo.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-black text-white tracking-tight">Gallery</h1>
        <p className="font-mono text-sm text-muted-foreground mt-1">
          Upload and manage club photos.
        </p>
      </div>

      {/* Drop zone */}
      <div
        ref={dropRef}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-cyan bg-cyan/5 scale-[1.01]'
            : 'border-border hover:border-cyan/50 hover:bg-charcoal'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={onFileInput}
        />
        <Upload size={28} className={`mx-auto mb-3 ${isDragging ? 'text-cyan' : 'text-muted-foreground'}`} />
        <p className="font-mono text-sm text-muted-foreground">
          {isDragging ? (
            <span className="text-cyan">Drop to upload</span>
          ) : (
            <>Drop images here or <span className="text-cyan">click to browse</span></>
          )}
        </p>
        <p className="font-mono text-xs text-muted-foreground/60 mt-1">
          Max 15 MB per file. Multiple files supported.
        </p>
      </div>

      {/* Upload progress */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map((task) => (
            <div
              key={task.id}
              className="bg-charcoal border border-border rounded-xl p-3 flex items-center gap-3"
            >
              <img
                src={task.preview}
                className="w-10 h-10 object-cover rounded-lg shrink-0"
                alt=""
              />
              <div className="flex-1 min-w-0">
                <p className="font-mono text-xs text-white truncate">{task.file.name}</p>
                {task.error ? (
                  <p className="font-mono text-[10px] text-pink mt-0.5">{task.error}</p>
                ) : task.status === 'done' ? (
                  <p className="font-mono text-[10px] text-cyan mt-0.5">Uploaded!</p>
                ) : (
                  <div className="mt-1.5 h-1 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full rounded-full bg-cyan transition-all duration-300"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                )}
              </div>
              {(task.status === 'done' || task.status === 'error') && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setUploads((prev) => prev.filter((t) => t.id !== task.id))
                  }}
                  className="text-muted-foreground hover:text-white shrink-0"
                >
                  <X size={14} />
                </button>
              )}
              {task.status === 'uploading' && (
                <Loader2 size={14} className="text-cyan animate-spin shrink-0" />
              )}
              {task.status === 'done' && <Check size={14} className="text-cyan shrink-0" />}
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={`font-mono text-xs px-3 py-1.5 rounded-full border transition-all ${
              filterCat === cat
                ? 'border-cyan text-cyan bg-cyan/10'
                : 'border-border text-muted-foreground hover:border-cyan/40 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-xl bg-charcoal border border-border animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-charcoal border border-border rounded-2xl p-16 text-center">
          <Images size={40} className="text-muted-foreground mx-auto mb-3" />
          <p className="font-mono text-sm text-muted-foreground">
            No photos yet. Drop some above to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="group bg-charcoal border border-border rounded-xl overflow-hidden hover:border-cyan/30 transition-all"
            >
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={item.thumb_url ?? item.image_url}
                  alt={item.caption ?? ''}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <button
                  onClick={() => setDeleteTarget(item)}
                  className="absolute top-2 right-2 p-1.5 bg-black/70 rounded-lg text-muted-foreground hover:text-pink opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={13} />
                </button>
                {item.category && (
                  <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <CategoryBadge category={item.category} />
                  </div>
                )}
              </div>
              <div className="p-2.5">
                <CaptionEditor item={item} onSave={saveCaption} />
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Photo?"
        description="This will permanently delete the photo and its thumbnail from storage. This action cannot be undone."
        confirmLabel="Delete Photo"
      />
    </div>
  )
}
