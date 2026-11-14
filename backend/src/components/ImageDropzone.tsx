import { useRef, useState, type DragEvent, type ChangeEvent } from 'react'
import { ImagePlus, X } from 'lucide-react'

interface ImageDropzoneProps {
  onFile: (file: File) => void
  currentUrl?: string
  label?: string
  maxMB?: number
}

export default function ImageDropzone({
  onFile,
  currentUrl,
  label = 'Drop image here or click to browse',
  maxMB = 15,
}: ImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  function validate(file: File): string | null {
    if (!file.type.startsWith('image/')) return 'Only image files are allowed.'
    if (file.size > maxMB * 1024 * 1024)
      return `File is too large. Max size is ${maxMB} MB.`
    return null
  }

  function handleFile(file: File) {
    const err = validate(file)
    if (err) {
      setError(err)
      return
    }
    setError(null)
    setPreview(URL.createObjectURL(file))
    onFile(file)
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    // reset so same file can be reselected
    e.target.value = ''
  }

  const displayUrl = preview ?? currentUrl

  return (
    <div className="space-y-2">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 overflow-hidden
          ${dragging ? 'border-cyan bg-cyan/5' : 'border-border hover:border-cyan/50 hover:bg-white/[0.02]'}`}
      >
        {displayUrl ? (
          /* Preview */
          <div className="relative aspect-video w-full">
            <img
              src={displayUrl}
              alt="Preview"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <span className="font-mono text-xs text-white tracking-widest uppercase">
                Click to replace
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setPreview(null)
              }}
              className="absolute top-2 right-2 bg-background/80 rounded-full p-1 hover:bg-pink/20 hover:text-pink transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center gap-3 py-10 px-6 text-center">
            <div className={`rounded-full p-3 transition-colors ${dragging ? 'bg-cyan/20' : 'bg-border/40'}`}>
              <ImagePlus size={22} className={dragging ? 'text-cyan' : 'text-muted-foreground'} />
            </div>
            <div>
              <p className="font-mono text-xs text-muted-foreground tracking-wide">
                {dragging ? 'Release to upload' : label}
              </p>
              <p className="font-mono text-[10px] text-muted-foreground/60 mt-1">
                JPEG, PNG or WebP · max {maxMB} MB
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="font-mono text-xs text-pink">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onInputChange}
      />
    </div>
  )
}
